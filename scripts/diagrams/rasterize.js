#!/usr/bin/env node
/**
 * Rasterize docs/diagrams/img/*.svg to PNG for pasting into the Word report.
 *
 * The SVGs are the source of truth and render correctly anywhere that has fonts
 * (browser, Word 2016+, VS Code). This step exists only for tools that want a
 * bitmap. It needs @resvg/resvg-js, which is not a project dependency:
 *
 *   npm install --no-save @resvg/resvg-js
 *   node scripts/diagrams/rasterize.js --scale 2
 *
 * Fonts: a headless Linux box usually has none, and resvg then draws every glyph
 * as a blank box. Point DIAGRAM_FONTS at .ttf/.otf files or directories
 * (colon-separated) to override the search below.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const IMG_DIR = path.join(ROOT, "docs", "diagrams", "img");

const scaleArg = process.argv.indexOf("--scale");
const SCALE = scaleArg > -1 ? Number(process.argv[scaleArg + 1]) : 2;

const SEARCH = [
  "/usr/share/fonts",
  "/usr/local/share/fonts",
  path.join(process.env.HOME || "", ".fonts"),
  path.join(process.env.HOME || "", ".local/share/fonts"),
  "/System/Library/Fonts",
  "C:/Windows/Fonts",
];

function collect(target, out) {
  let stat;
  try {
    stat = fs.statSync(target);
  } catch {
    return out;
  }
  if (stat.isFile()) {
    if (/\.(ttf|otf)$/i.test(target)) out.push(target);
    return out;
  }
  for (const entry of fs.readdirSync(target)) {
    collect(path.join(target, entry), out);
  }
  return out;
}

function findFonts() {
  const out = [];
  if (process.env.DIAGRAM_FONTS) {
    for (const t of process.env.DIAGRAM_FONTS.split(":").filter(Boolean)) collect(t, out);
    return out;
  }
  for (const dir of SEARCH) collect(dir, out);
  return out;
}

/** Read the typographic family name (name ID 1) out of a TrueType/OpenType file. */
function familyName(file) {
  let buf;
  try {
    buf = fs.readFileSync(file);
  } catch {
    return null;
  }
  try {
    const numTables = buf.readUInt16BE(4);
    let nameOff = 0;
    for (let i = 0; i < numTables; i++) {
      const rec = 12 + i * 16;
      if (buf.toString("ascii", rec, rec + 4) === "name") {
        nameOff = buf.readUInt32BE(rec + 8);
        break;
      }
    }
    if (!nameOff) return null;
    const count = buf.readUInt16BE(nameOff + 2);
    const stringOff = nameOff + buf.readUInt16BE(nameOff + 4);
    for (let i = 0; i < count; i++) {
      const rec = nameOff + 6 + i * 12;
      if (buf.readUInt16BE(rec + 6) !== 1) continue; // name ID 1 = family
      const platform = buf.readUInt16BE(rec);
      const len = buf.readUInt16BE(rec + 8);
      const off = stringOff + buf.readUInt16BE(rec + 10);
      const slice = Buffer.from(buf.subarray(off, off + len));
      // platform 1 (Mac) stores single bytes; everything else stores UTF-16BE,
      // which Node only decodes as LE — so swap the byte pairs first.
      if (platform === 1) return slice.toString("latin1");
      return (len % 2 ? slice.subarray(0, len - 1) : slice).swap16().toString("utf16le");
    }
  } catch {
    return null;
  }
  return null;
}

function pickFamily(files, patterns, fallback) {
  for (const p of patterns) {
    const hit = files.find((f) => p.test(path.basename(f)));
    if (hit) return familyName(hit) || path.basename(hit).replace(/\.(ttf|otf)$/i, "");
  }
  return fallback;
}

(async () => {
  let Resvg;
  try {
    ({ Resvg } = require("@resvg/resvg-js"));
  } catch {
    console.error("@resvg/resvg-js is not installed. Run:\n  npm install --no-save @resvg/resvg-js");
    process.exit(1);
  }

  const fontFiles = findFonts();
  if (fontFiles.length === 0) {
    console.error(
      "No .ttf/.otf fonts found — every glyph would rasterize as a blank box.\n" +
        "Install fonts, or point DIAGRAM_FONTS at font files/directories:\n" +
        "  DIAGRAM_FONTS=/path/to/fonts node scripts/diagrams/rasterize.js"
    );
    process.exit(1);
  }

  const sans = pickFamily(fontFiles, [/inter/i, /noto.?sans/i, /dejavu.?sans/i, /arial/i], "Noto Sans");
  const mono = pickFamily(
    fontFiles,
    [/jetbrains/i, /mono/i, /typewriter/i, /consol/i, /courier/i],
    sans
  );
  console.log(`fonts: ${fontFiles.length} file(s) · sans="${sans}" mono="${mono}"`);

  const files = fs.readdirSync(IMG_DIR).filter((f) => f.endsWith(".svg")).sort();
  for (const f of files) {
    const src = path.join(IMG_DIR, f);
    const out = src.replace(/\.svg$/, ".png");
    const resvg = new Resvg(fs.readFileSync(src, "utf8"), {
      fitTo: { mode: "zoom", value: SCALE },
      font: {
        fontFiles,
        loadSystemFonts: false,
        defaultFontFamily: sans,
        sansSerifFamily: sans,
        serifFamily: sans,
        monospaceFamily: mono,
      },
    });
    const png = resvg.render();
    fs.writeFileSync(out, png.asPng());
    console.log(
      `  ${path.basename(out)}  ${png.width}x${png.height}  ${(fs.statSync(out).size / 1024).toFixed(0)} KB`
    );
  }
})().catch((e) => {
  console.error(e.stack || e.message);
  process.exit(1);
});
