const XLSX=require('xlsx');const fs=require('fs');const REPO=require('path').resolve(__dirname,'..','..');
const specs=fs.readFileSync(REPO+'/docs/testing/results/2026-07-23/classes-with-specs.txt','utf8').trim().split('\n');
const norm=s=>s.replace(/\.(service|controller)$/,'').replace(/[-_]/g,'').toLowerCase();
const specSet=new Set(specs.map(norm));
const failNorm=new Set(['kycverifications']); // iam kyc-verifications.service: 1 failing test
const wb=XLSX.readFile(REPO+'/docs/testing/SMILE_UnitTest.xlsx');
// ---- Functions: add Has spec + Suite result ----
const wf=wb.Sheets.Functions;const A=XLSX.utils.sheet_to_json(wf,{header:1,defval:''});
A[7][10]='Class has spec?';A[7][11]='Class suite (2026-07-23)';
let withSpec=0;
for(let i=8;i<A.length;i++){const cls=A[i][2];if(!cls)continue;const nk=norm(cls.replace(/Service$/,''));
 const has=specSet.has(nk);if(has)withSpec++;
 A[i][10]=has?'Yes':'No';
 A[i][11]=has?(failNorm.has(nk)?'Suite FAIL (1 test)':'Suite PASS'):'— no spec yet';}
const nf=XLSX.utils.aoa_to_sheet(A);nf['!cols']=[{wch:5},{wch:16},{wch:22},{wch:22},{wch:30},{wch:7},{wch:7},{wch:6},{wch:7},{wch:40},{wch:13},{wch:22}];wb.Sheets.Functions=nf;
// ---- Statistics: append real execution block ----
const ws=wb.Sheets.Statistics;const S=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
S.push([]);S.push(['— EXECUTION RESULTS · repo test suites · run 2026-07-23 —']);
S.push(['Service','Suites','Tests','Passed','Failed','Skipped']);
const rows=[['iam-service',11,54,53,1,0],['clinical-emr-service',36,322,316,0,6],['gateway-service',2,10,10,0,0],['payment-service',0,0,0,0,0],['frontend/web (Vitest)',19,67,67,0,0]];
rows.forEach(r=>S.push(r));
S.push(['','','TOTAL', 53+316+10+0+67, 1, 6]);
S.push([]);
S.push(['Note','446 tests passed, 1 failed (iam KycVerificationsService), 6 skipped.']);
S.push(['','Also: frontend file tests/kycOcrPayload.test.mjs failed to load (KYC OCR).']);
S.push(['Functions whose CLASS has a spec suite (not per-method coverage)','',withSpec,'of',A.length-8,'(others = design only, not yet executed)']);
const nS=XLSX.utils.aoa_to_sheet(S);nS['!cols']=[{wch:26},{wch:9},{wch:8},{wch:8},{wch:8},{wch:9}];wb.Sheets.Statistics=nS;
XLSX.writeFile(wb,REPO+'/docs/testing/SMILE_UnitTest.xlsx');
console.log('Filled. Functions backed by existing spec:',withSpec,'/',A.length-8);
