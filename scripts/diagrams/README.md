# SRS diagram & table generators

Regenerates the Report3 (SRS) entity relationship diagrams, screen flow diagrams and
the three tables that go with them, straight from the repository. Nothing here is
hand-maintained except the prose (entity descriptions, screen descriptions), so the
structure of the documentation cannot drift from the code.

```bash
python3 scripts/diagrams/generate_all.py          # diagrams + markdown tables
python3 scripts/diagrams/generate_all.py --docx   # also rewrite the tables in Report3
```

Standard library only — no pip install, no Java, no PlantUML needed to *generate*
(you need PlantUML only to render the `.puml` to PNG/SVG).

## Where the truth comes from

| Output | Format | Derived from |
|---|---|---|
| `docs/diagrams/img/screen-flow-*.svg` | image | routes + `ProtectedRoute` guards |
| `docs/diagrams/img/schema-*.svg` | image | `database/**/schema.sql` |
| `docs/diagrams/img/*.png` | image | rasterized from the SVGs (`make diagrams-png`) |
| `docs/diagrams/dbml/*.dbml` | editable | `database/**/schema.sql` — paste into dbdiagram.io |
| `docs/diagrams/drawio/erd-*.drawio` | editable | `database/**/schema.sql` |
| `docs/diagrams/*.puml` | source | as above |
| `docs/diagrams/*.mmd`, `DIAGRAMS.md` | source | as above |
| `docs/diagrams/entities-list.md` (§2.1.e) | table | `database/**/schema.sql` + `entity_names.py` |
| `docs/diagrams/screen-details.md` (§3.1.b) | table | `screens.py` |
| `docs/diagrams/non-screen-functions.md` (§3.1.c) | table | `screens.py` |
| `docs/diagrams/sdd-database-design.md` (Report4 §2) | table | `database/**/schema.sql` |

**Which one goes in the report?** Put the `img/*.svg` (or `img/*.png`) straight into
Word. For an ERD you want to arrange yourself, paste `dbml/smile.dbml` into
[dbdiagram.io](https://dbdiagram.io/d) — it auto-arranges and exports PNG/PDF/SVG —
or open `drawio/erd-*.drawio` if you need Chen notation. The `.puml` and `.mmd`
copies are for tools that prefer text.

The DBML is verified against the official `@dbml/core` parser and round-trips back to
PostgreSQL DDL with its enum, composite primary keys and foreign keys intact:

```bash
npm install --no-save @dbml/core
node -e "const{exporter}=require('@dbml/core');const fs=require('fs');
  console.log(exporter.export(fs.readFileSync('docs/diagrams/dbml/smile.dbml','utf8'),'postgres'))"
```

`schema.sql` is the ERD ground truth rather than the TypeORM entities: it reflects the
post-migration database (tightened column widths, `gender` as `SMALLINT`, dropped
tables) and carries explicit `NOTE: entity drift` comments where the decorators
disagree with it.

## Modules

| File | Role |
|---|---|
| `schema_reader.py` | Parses `CREATE TABLE` into tables/columns with PK, FK and cross-service references |
| `route_reader.py` | Reads the Next.js routes, the `*_ROLES` groups and the per-route `ProtectedRoute` guards |
| `screens.py` | Screen catalogue (route → SRS screen, parent, trigger) and the non-screen function list |
| `entity_names.py` | SRS entity name + one-line description per table |
| `svg.py` | Tiny SVG builder — boxes, orthogonal connectors, labels |
| `gen_screenflow_svg.py` | Writes the screen flow **images** |
| `gen_schema_svg.py` | Writes the schema **images** (visual data dictionary) |
| `gen_dbml.py` | Writes the dbdiagram.io DBML |
| `gen_drawio_erd.py` | Writes the editable draw.io ERD, Chen notation |
| `rasterize.js` | SVG → PNG (needs `@resvg/resvg-js`, and fonts) |
| `gen_erd_puml.py` | Writes the ERD `.puml` files |
| `gen_screenflow_puml.py` | Writes one screen flow `.puml` per actor |
| `gen_mermaid.py` | Writes the `.mmd` copies and `DIAGRAMS.md` |
| `gen_srs_tables.py` | Writes the markdown tables, and with `--docx` patches Report3 |
| `gen_sdd_tables.py` | Report4 §2 Database Design; with `--docx` patches Report4 |
| `docx_table.py` | Minimal in-place `.docx` table rewriting (no python-docx on this box) |
| `generate_all.py` | Runs everything, preflight first |

## Drift checks

`generate_all.py` refuses to run when the documentation and the repo disagree:

- a route exists with no catalogue entry, or a catalogue entry names a route that is gone
- a screen's `parent` is not itself a screen
- a non-screen function points at a path that no longer exists
- a `ProtectedRoute requiredRoles={X}` names a group no `export const X = [...]` defines
- a table has no SRS description, or a description names a table no schema defines

That makes it usable as a CI documentation gate:

```bash
python3 scripts/diagrams/generate_all.py && git diff --exit-code docs/diagrams
```

## Screen flows

A screen appears in an actor's flow only if that actor's role passes the guard on its
route, so the flows encode the real access rules rather than an intention. Screens in
that role's sidebar (`navForKind()`) hang off the Dashboard; everything else hangs off
its parent screen with the trigger that opens it. Routes with no guard at all are
treated as visible to every signed-in role — which is what the app actually does.

## Rasterizing to PNG

The SVGs are the deliverable and render correctly in any browser, in Word 2016+ and in
VS Code. PNG is only needed for tools that will not take an SVG:

```bash
npm install --no-save @resvg/resvg-js
make diagrams-png
```

A headless Linux box usually ships **no fonts at all**, and the rasterizer then draws
every glyph as a blank box. `rasterize.js` refuses to run in that case; point it at
font files if the system has none installed:

```bash
DIAGRAM_FONTS=/path/to/some/fonts node scripts/diagrams/rasterize.js --scale 2
```

The generated files carry a `GENERATED FILE` banner. Edit the generator or the
catalogue, never the output.
