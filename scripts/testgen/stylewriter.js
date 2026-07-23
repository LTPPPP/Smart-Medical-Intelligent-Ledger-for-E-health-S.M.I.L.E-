// Styled .xlsx writer (ExcelJS) matching the FPT Unit Test template palette:
//   navy header/section rows, light-yellow info labels, bordered grid, blue hyperlinks.
const ExcelJS=require('exceljs');
const NAVY='FF000080',YELLOW='FFFFFFCC',ORANGE='FFFF9900',GRAY='FFF2F2F2',FIELD='FFDDEBF7',BORDER='FFB0B0B0';
const fillOf=argb=>({type:'pattern',pattern:'solid',fgColor:{argb}});
const thin={style:'thin',color:{argb:BORDER}};
const box={top:thin,left:thin,bottom:thin,right:thin};
const INFO=new Set(['Function Code','Created By','Lines of code','Test requirement','Passed','Failed','Untested','N','A','B','Total Test Cases','Function Name','Executed By','Lack of test cases','Endpoint','Note','Project Name','Project Code','Document Code','Notes','Creator','Reviewer/Approver','Issue Date','Version','Effective Date','Change Item','*A,D,M','Change description','Reference','Record of change','Sub total','Use cases','Change Item ']);
const SECTION=new Set(['Condition','Confirm','Result']);
const SUB=new Set(['Precondition','Return','Exception','Log message','Passed/Failed','Executed Date','Defect ID']);

function dims(aoa){let R=aoa.length,C=1;aoa.forEach(r=>{if(r&&r.length>C)C=r.length;});return{R,C};}
function put(ws,aoa){aoa.forEach((row,r)=>{if(!row)return;row.forEach((v,c)=>{if(v===''||v==null)return;ws.getCell(r+1,c+1).value=v;});});}

// Per-function sheet, styled to match the template "Example" sheet exactly:
//   rows 2-7 header block = light yellow (FFFFCC) with the template's merges,
//   UTCID row = full-width navy, 45pt, labels rotated 90deg,
//   column A = continuous navy spine, column E = hidden orange separator (FF9900).
function styleDetail(ws,aoa,meta){
 const {R,C}=dims(aoa);
 const m=meta||{};
 const uRow=m.utcidRow!=null?m.utcidRow:8;          // 0-based
 const last=m.lastRow!=null?m.lastRow:R-1;
 const lastCol=Math.max(m.lastCol!=null?m.lastCol:19,C-1);
 const T=m.T||Math.max(lastCol-4,1);

 // widths: template A/B/C/D/E, then one narrow column per test case
 const w=[8.13,24,10.88,45,1.88];
 for(let c=5;c<=lastCol;c++)w.push(2.88);
 ws.columns=w.map(width=>({width}));
 ws.getColumn(5).hidden=true;                        // template hides the separator

 for(let r=0;r<=last;r++){
   const row=aoa[r]||[];
   const xr=ws.getRow(r+1);
   xr.height=(r===uRow)?45:13.5;
   for(let c=0;c<=lastCol;c++){
     const t=row[c]==null?'':String(row[c]);
     const cell=ws.getCell(r+1,c+1);
     if(r>=1&&r<=6){                                  // header info block
       cell.fill=fillOf(YELLOW);cell.border=box;
       cell.font={name:'Arial',size:10,bold:INFO.has(t)};
       cell.alignment={vertical:'middle',wrapText:true,horizontal:(c>=11&&!isNaN(row[c])&&t!==''?'center':'left')};
       continue;
     }
     if(r===uRow){                                    // UTCID header strip
       cell.fill=fillOf(NAVY);cell.border=box;
       cell.font={name:'Arial',size:10,bold:true,color:{argb:'FFFFFFFF'}};
       cell.alignment={vertical:'bottom',horizontal:'center',textRotation:90};
       continue;
     }
     if(r>uRow){
       if(c===0){cell.fill=fillOf(NAVY);cell.font={name:'Arial',size:10,bold:true,color:{argb:'FFFFFFFF'}};
         cell.alignment={vertical:'middle',horizontal:'left'};cell.border=box;continue;}
       if(c===4){cell.fill=fillOf(ORANGE);cell.border=box;continue;}
       cell.border=box;
       cell.font={name:'Arial',size:10,bold:SUB.has(t)||/^Type ?\(/.test(t)||t==='O'};
       // Executed Date values (per-case columns) render vertical, like the UTCID strip
       const isExecDate=(aoa[r]||[])[1]==='Executed Date';
       if(isExecDate&&c>=5)cell.alignment={vertical:'bottom',horizontal:'center',textRotation:90};
       else cell.alignment={vertical:'middle',wrapText:c<=3,horizontal:(c>=5?'center':'left')};
     }
   }
 }
 for(const [r1,c1,r2,c2] of (m.merges||[]))ws.mergeCells(r1+1,c1+1,r2+1,c2+1);
}
function styleReport(ws,aoa,headerRow,subRow,links){
 const {R,C}=dims(aoa);
 // title
 ws.mergeCells(1,1,1,C);const tc=ws.getCell(1,1);tc.value=aoa[0][1]||aoa[0][0];tc.font={bold:true,size:16};tc.alignment={horizontal:'center'};
 for(let r=1;r<R;r++){const row=aoa[r]||[];for(let c=0;c<C;c++){
   const t=row[c]==null?'':String(row[c]);const cell=ws.getCell(r+1,c+1);
   if(r===headerRow){cell.border=box;cell.fill=fillOf(NAVY);cell.font={bold:true,color:{argb:'FFFFFFFF'}};cell.alignment={horizontal:'center',vertical:'middle',wrapText:true};continue;}
   if(r>headerRow){cell.border=box;cell.alignment={vertical:'middle',horizontal:(c===1?'left':'center'),wrapText:true};}
   if(t===''){continue;}
   if(INFO.has(t)){cell.fill=fillOf(YELLOW);cell.font={bold:true};}
   if(r===subRow){cell.fill=fillOf(GRAY);cell.font={bold:true};}
 }}
 // hyperlinks (col B, 1-based col 2)
 for(const l of links){const cell=ws.getCell(l.row+1,2);cell.value={text:l.text,hyperlink:l.target};cell.font={color:{argb:'FF0563C1'},underline:true};}
}
function styleCover(ws,aoa){
 const {R,C}=dims(aoa);
 ws.mergeCells(1,1,1,Math.max(C,6));const tc=ws.getCell(1,1);tc.value=aoa[0][1]||aoa[0][0];tc.font={bold:true,size:16};tc.alignment={horizontal:'center'};
 for(let r=1;r<R;r++){const row=aoa[r]||[];for(let c=0;c<C;c++){const t=row[c]==null?'':String(row[c]);const cell=ws.getCell(r+1,c+1);if(t==='')continue;
   if(INFO.has(t)){cell.fill=fillOf(YELLOW);cell.font={bold:true};cell.border=box;}
   else {cell.border=box;}}}
}

// Function List sheet, styled to the template "Functions" sheet:
//   title row, yellow info block (label A:D / value E:H merged), navy 333399 header,
//   yellow bordered data grid, blue hyperlink in the Sheet Name column.
const FLHEAD='FF333399';
function styleFunclist(ws,aoa,headerRow,infoRows,links){
 const {R,C}=dims(aoa);
 // title
 ws.mergeCells(1,1,1,C);const tc=ws.getCell(1,1);
 tc.font={name:'Arial',bold:true,size:14};tc.alignment={horizontal:'center',vertical:'middle'};
 // info block: label cols A:D, value cols E:H
 for(const r of (infoRows||[])){
   ws.mergeCells(r+1,1,r+1,4);ws.mergeCells(r+1,5,r+1,C);
   const lab=ws.getCell(r+1,1),val=ws.getCell(r+1,5);
   for(const cell of [lab,val]){cell.fill=fillOf(YELLOW);cell.border=box;cell.font={name:'Arial',size:10};}
   lab.font={name:'Arial',size:10,bold:true};lab.alignment={vertical:'top',wrapText:true};
   val.alignment={vertical:'top',wrapText:true};
 }
 // header + data grid
 for(let r=headerRow;r<R;r++){const row=aoa[r]||[];for(let c=0;c<C;c++){
   const cell=ws.getCell(r+1,c+1);cell.border=box;
   if(r===headerRow){cell.fill=fillOf(FLHEAD);cell.font={name:'Arial',size:10,bold:true,color:{argb:'FFFFFFFF'}};
     cell.alignment={horizontal:'center',vertical:'middle',wrapText:true};}
   else {cell.fill=fillOf(YELLOW);cell.font={name:'Arial',size:10};
     cell.alignment={vertical:'top',wrapText:c>=6,horizontal:(c===0?'center':'left')};}
 }}
 for(const l of (links||[])){const cell=ws.getCell(l.row+1,l.col+1);
   cell.value={text:l.text,hyperlink:l.target};cell.font={name:'Arial',size:10,color:{argb:'FF0563C1'},underline:true};}
}

// ---- TEST REPORT stylers (template docs/Report5_Test Report.xlsx) ----
const TRGREEN='FF77933C';      // TC grid header + statistics header
const FUNCROW='FFEBF1DE';      // light-green function group rows
const RESULT={Passed:'FFC6EFCE',Failed:'FFFFC7CE',Pending:'FFFFEB9C'}; // cell tints
function tint(t){return RESULT[t];}

function styleTclist(ws,aoa,headerRow,links){
 const {R,C}=dims(aoa);
 ws.mergeCells(1,2,1,C);const tc=ws.getCell(1,2);tc.value=aoa[0][1];tc.font={name:'Arial',bold:true,size:14};tc.alignment={horizontal:'center'};
 for(let r=2;r<headerRow;r++){const row=aoa[r]||[];if(!row[1])continue;
   const lab=ws.getCell(r+1,2);lab.fill=fillOf(YELLOW);lab.font={name:'Arial',size:10,bold:true};lab.border=box;lab.alignment={vertical:'top',wrapText:true};
   const val=ws.getCell(r+1,3);val.border=box;val.alignment={vertical:'top',wrapText:true};val.font={name:'Arial',size:10};
   ws.mergeCells(r+1,3,r+1,C);}
 for(let r=headerRow;r<R;r++){const row=aoa[r]||[];for(let c=1;c<C;c++){const cell=ws.getCell(r+1,c+1);cell.border=box;
   if(r===headerRow){cell.fill=fillOf(TRGREEN);cell.font={name:'Arial',size:10,bold:true,color:{argb:'FFFFFFFF'}};cell.alignment={horizontal:'center',vertical:'middle',wrapText:true};}
   else{cell.font={name:'Arial',size:10};cell.alignment={vertical:'top',wrapText:c>=4,horizontal:(c===1?'center':'left')};}}}
 for(const l of (links||[])){const cell=ws.getCell(l.row+1,l.col+1);cell.value={text:l.text,hyperlink:l.target};cell.font={name:'Arial',size:10,color:{argb:'FF0563C1'},underline:true};}
}
function styleTstats(ws,aoa,headerRow,subRow){
 const {R,C}=dims(aoa);
 ws.mergeCells(1,2,1,C);const tc=ws.getCell(1,2);tc.value=aoa[0][1];tc.font={name:'Arial',bold:true,size:14};tc.alignment={horizontal:'center'};
 for(let r=2;r<=5;r++){const row=aoa[r]||[];for(let c=1;c<C;c++){const t=row[c]==null?'':String(row[c]);const cell=ws.getCell(r+1,c+1);if(t==='')continue;
   if(t==='Project Name'||t==='Project Code'||t==='Document Code'||t==='Notes'||t==='Creator'||t==='Reviewer/Approver'||t==='Issue Date'){cell.fill=fillOf(YELLOW);cell.font={name:'Arial',size:10,bold:true};cell.border=box;}
   else{cell.font={name:'Arial',size:10};cell.border=box;cell.alignment={wrapText:true,vertical:'top'};}}}
 for(let r=headerRow;r<R;r++){const row=aoa[r]||[];for(let c=1;c<C;c++){const t=row[c]==null?'':String(row[c]);const cell=ws.getCell(r+1,c+1);
   if(r===headerRow){cell.fill=fillOf(TRGREEN);cell.font={name:'Arial',size:10,bold:true,color:{argb:'FFFFFFFF'}};cell.alignment={horizontal:'center',vertical:'middle',wrapText:true};cell.border=box;continue;}
   if(t==='')continue;
   cell.border=box;cell.font={name:'Arial',size:10,bold:(r===subRow||/Test coverage|Sub total|Test successful/.test(t))};
   cell.alignment={horizontal:(c===2?'left':'center'),vertical:'middle'};}}
}
function styleFeature(ws,aoa,headerRow,funcRows){
 const {R,C}=dims(aoa);const fset=new Set(funcRows||[]);
 // info block rows 1..7 (Feature / Test requirement / Number of TCs / Testing Round table)
 for(let r=1;r<=7;r++){const row=aoa[r]||[];for(let c=0;c<5;c++){const t=row[c]==null?'':String(row[c]);const cell=ws.getCell(r+1,c+1);if(t===''&&c>0&&r<4)continue;
   cell.border=box;cell.font={name:'Arial',size:10};
   if(c===0&&t){cell.fill=fillOf(YELLOW);cell.font={name:'Arial',size:10,bold:true};}
   if(r===4){cell.fill=fillOf(TRGREEN);cell.font={name:'Arial',size:10,bold:true,color:{argb:'FFFFFFFF'}};cell.alignment={horizontal:'center'};} // Testing Round header
   cell.alignment=cell.alignment||{vertical:'top',wrapText:true};}}
 for(const [r,c] of [[1,1],[2,1]])ws.mergeCells(r+1,c+1,r+1,5); // Feature / requirement values span B:E
 // grid
 for(let r=headerRow;r<R;r++){const row=aoa[r]||[];const isFunc=fset.has(r);
   for(let c=0;c<C;c++){const t=row[c]==null?'':String(row[c]);const cell=ws.getCell(r+1,c+1);cell.border=box;
     if(r===headerRow){cell.fill=fillOf(TRGREEN);cell.font={name:'Arial',size:10,bold:true,color:{argb:'FFFFFFFF'}};cell.alignment={horizontal:'center',vertical:'middle',wrapText:true};continue;}
     if(isFunc){cell.fill=fillOf(FUNCROW);cell.font={name:'Arial',size:10,bold:true};cell.alignment={vertical:'middle'};if(c===0)cell.value=row[0];continue;}
     cell.font={name:'Arial',size:10};cell.alignment={vertical:'top',wrapText:c>=1&&c<=4};
     if((c===5||c===8||c===11)&&tint(t)){cell.fill=fillOf(tint(t));cell.font={name:'Arial',size:10,bold:true};cell.alignment={horizontal:'center',vertical:'middle'};}
   }
   if(isFunc)ws.mergeCells(r+1,1,r+1,C);
 }
}

async function writeWorkbook(outPath,spec){
 const wb=new ExcelJS.Workbook();
 for(const sh of spec){
   const ws=wb.addWorksheet(sh.name,{views:[{showGridLines:false}]});
   if(sh.cols&&sh.kind!=='detail')ws.columns=sh.cols.map(w=>({width:w}));
   put(ws,sh.aoa);
   if(sh.kind==='cover')styleCover(ws,sh.aoa);
   else if(sh.kind==='report')styleReport(ws,sh.aoa,sh.headerRow,sh.subRow,sh.links||[]);
   else if(sh.kind==='funclist')styleFunclist(ws,sh.aoa,sh.headerRow,sh.infoRows,sh.links||[]);
   else if(sh.kind==='tclist')styleTclist(ws,sh.aoa,sh.headerRow,sh.links||[]);
   else if(sh.kind==='tstats')styleTstats(ws,sh.aoa,sh.headerRow,sh.subRow);
   else if(sh.kind==='feature')styleFeature(ws,sh.aoa,sh.headerRow,sh.funcRows||[]);
   else styleDetail(ws,sh.aoa,sh.meta);
 }
 await wb.xlsx.writeFile(outPath);
}
module.exports={writeWorkbook};
