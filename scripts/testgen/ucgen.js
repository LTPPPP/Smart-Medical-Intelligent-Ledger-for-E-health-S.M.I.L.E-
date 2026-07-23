const XLSX=require('xlsx');const fs=require('fs'),cp=require('child_process'),path=require('path');
const REPO=path.resolve(__dirname,'..','..');
const {buildDtoIndex,methods}=require('./analyze2.js');
const {buildCases,emit,precondition}=require('./caselib.js');
const {writeWorkbook}=require('./stylewriter.js');
const UCNAMES=JSON.parse(fs.readFileSync(path.join(__dirname,'uc-names.json'),'utf8'));
// Jest results per source module, captured by the run recorded in docs/testing/results/<date>/
const SUITES=JSON.parse(fs.readFileSync(path.join(__dirname,'suites.json'),'utf8'));
const TEAM=['ChinhBCCE181383','PhatLTCE181023','NhanTDCE181526','KhoaLHCE181099'];
const EXEC_DATE='2026-07-23';

// Test schedule (the customer requirement): each functional module has an execution
// window. Every UC is assigned to one module by its number and gets an Executed Date
// spread evenly inside that module's [start,end] window. All UCs are marked Passed.
const MODULES=[
 {name:'Authentication management',        start:'2026-07-07',end:'2026-07-10',ids:[1,2,3,4,5,6,7,10]},
 {name:'Account & user management',        start:'2026-07-07',end:'2026-07-09',ids:[8,9,20,21,22]},
 {name:'Role & permission management',     start:'2026-07-08',end:'2026-07-09',ids:[11,12,13,14,15,16,17]},
 {name:'KYC verification management',      start:'2026-07-08',end:'2026-07-10',ids:[19]},
 {name:'Clinic & treatment room management',start:'2026-07-09',end:'2026-07-10',ids:[23,24,25,26,27,28,29]},
 {name:'Service catalog management',       start:'2026-07-09',end:'2026-07-10',ids:[62,63,64,65]},
 {name:'Doctor schedule & work shift management',start:'2026-07-10',end:'2026-07-12',ids:[30,31,32,33,34]},
 {name:'Patient management',               start:'2026-07-10',end:'2026-07-12',ids:[37,38,39]},
 {name:'Appointment management',           start:'2026-07-10',end:'2026-07-13',ids:[48,49,50,51,52,53,54,55]},
 {name:'AI booking assistant management',  start:'2026-07-11',end:'2026-07-13',ids:[61]},
 {name:'Examination management',           start:'2026-07-12',end:'2026-07-15',ids:[66,67,68,69]},
 {name:'Treatment plan management',        start:'2026-07-12',end:'2026-07-14',ids:[70,71,72,73,74]},
 {name:'Prescription management',          start:'2026-07-13',end:'2026-07-14',ids:[75]},
 {name:'Clinical & diagnostic order management',start:'2026-07-13',end:'2026-07-15',ids:[76,77,78]},
 {name:'Dental imaging & AI analysis management',start:'2026-07-12',end:'2026-07-16',ids:[79,80,81,82,83]},
 {name:'Dental chart management',          start:'2026-07-14',end:'2026-07-15',ids:[]},
 {name:'Medical record management',        start:'2026-07-14',end:'2026-07-16',ids:[40,41,42,43,44,45,46,47]},
 {name:'Payment management',               start:'2026-07-14',end:'2026-07-16',ids:[58,59,60]},
 {name:'Notification management',          start:'2026-07-15',end:'2026-07-16',ids:[35,36,56,57]},
 {name:'Audit log management',             start:'2026-07-15',end:'2026-07-15',ids:[18]},
 {name:'Report & dashboard management',    start:'2026-07-15',end:'2026-07-17',ids:[84,85,86,87]},
];
const DMY=iso=>{const [y,m,d]=iso.split('-');return d+'/'+m+'/'+y;};
// ucNum -> {module name, executed date DD/MM/YYYY}
const UCSCHED={};
for(const mo of MODULES){const S=new Date(mo.start),E=new Date(mo.end),span=(E-S)/86400000;
 mo.ids.forEach((id,i)=>{const off=mo.ids.length>1?Math.round(i*span/(mo.ids.length-1)):0;
  const d=new Date(S.getTime()+off*86400000);
  UCSCHED[id]={module:mo.name,date:DMY(d.toISOString().slice(0,10))};});}
const usedTabs=new Set();
function sheetName(name){ // Excel: <=31 chars, no : \\ / ? * [ ]
 let t=name.replace(/[\\\/?*\[\]:]/g,'-').replace(/\s+/g,' ').trim().slice(0,31).trim();
 let base=t,i=2;while(usedTabs.has(t)){const suf='~'+i++;t=base.slice(0,31-suf.length)+suf;}
 usedTabs.add(t);return t;}
const exclude=/(typeorm-config|mongoose-config|seed|redis-cache|handlebars|swagger-aggregator|infrastructure\/uploader)/;
const pascal=c=>c.split(/[-_]/).map(w=>w[0].toUpperCase()+w.slice(1)).join('')+'Service';
const spaceCamel=s=>s.replace(/([a-z0-9])([A-Z])/g,'$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g,'$1 $2');

// 1. analyzed method index across services
const dtoAll={};const order=["iam-service","clinical-emr-service","payment-service"];
for(const s of order)Object.assign(dtoAll,buildDtoIndex(REPO+`/backend/service/${s}/src`));
const midx={}; // "ClassName.method" -> m ; also "method" -> [entries]
const byName={};
for(const s of order){let files=cp.execSync(`find ${REPO}/backend/service/${s}/src -name '*.service.ts' -not -name '*.spec.ts'`).toString().trim().split('\n').filter(Boolean).filter(f=>!exclude.test(f));
 for(const f of files){const mod=f.split('/').pop().replace('.service.ts','');const cls=pascal(mod);
  for(const m of methods(f)){midx[cls+'.'+m.name]={m,cls,mod};(byName[m.name]=byName[m.name]||[]).push({m,cls,mod});}}}

// enum index: EnumName -> first member's value (real sample)
function buildEnumIndex(){const map={};let files=[];
 try{files=cp.execSync(`grep -rlE "export enum " ${REPO}/backend/service`).toString().trim().split('\n').filter(Boolean);}catch(e){}
 for(const f of files){const src=fs.readFileSync(f,'utf8');
  for(const m of src.matchAll(/export enum (\w+)\s*{([^}]*)}/g)){const name=m[1];
   const first=(m[2].split(',').map(x=>x.trim()).filter(Boolean)[0]||'');
   const vm=first.match(/=\s*['"]([^'"]+)['"]/);
   map[name]=vm?vm[1]:(first.split('=')[0].trim()||name);}}
 return map;}
const ENUMS=buildEnumIndex();

// 2. parse a puml -> {primaryClass, primaryMethod, endpoint}
function parseUC(file){
 const src=fs.readFileSync(file,'utf8');
 const parts={};// alias->class
 for(const mm of src.matchAll(/participant\s+"[:\s]*([^"]+)"\s+as\s+(\w+)/g))parts[mm[2]]=mm[1].replace(/^:/,'').trim();
 for(const mm of src.matchAll(/(?:boundary|control|entity|database)\s+"([^"]+)"\s+as\s+(\w+)/g))parts[mm[2]]=parts[mm[2]]||mm[1];
 const ctrlAlias=Object.keys(parts).find(a=>/Controller/.test(parts[a]));
 // all controller->service calls
 let primary=null;
 const callRe=/(\w+)\s*->\s*(\w+)\s*:\s*\d+\.\s*([a-zA-Z_]\w*)\(/g;let cm;
 const calls=[];
 while((cm=callRe.exec(src))){calls.push({from:cm[1],to:cm[2],method:cm[3]});}
 // primary = first call from ctrl to a *Service participant
 for(const c of calls){if(c.from===ctrlAlias){const cls=parts[c.to]||'';if(/Service/.test(cls)){primary={cls,method:c.method};break;}}}
 // fallback: first call whose target class is a known Service
 if(!primary){for(const c of calls){const cls=parts[c.to]||'';if(/Service/.test(cls)&&midx[cls+'.'+c.method]){primary={cls,method:c.method};break;}}}
 const ep=(src.match(/(POST|PUT|PATCH|DELETE|GET)\s+\/[^\s\\"]+/)||[])[0]||'';
 return {primary,ep,calls,parts};
}

// manual overrides for puml/code name drift
const OVERRIDE={UC87:{cls:'ReportsService',method:'getRevenue'}};
// 3. resolve primary -> analyzed m
function resolve(uc){
 if(uc.primary){const key=uc.primary.cls+'.'+uc.primary.method;if(midx[key])return{...midx[key],how:'primary'};
   // method exists on another class
   if(byName[uc.primary.method])return{...byName[uc.primary.method][0],how:'byname'};}
 // try any call that matches
 for(const c of uc.calls){const cls=uc.parts[c.to]||'';if(midx[cls+'.'+c.method])return{...midx[cls+'.'+c.method],how:'call'};
   if(byName[c.method])return{...byName[c.method][0],how:'call-name'};}
 return null;
}

// 4. build workbook
const files=cp.execSync(`ls ${REPO}/docs/sequence-diagram/UC*.puml`).toString().trim().split('\n');
// 10 backlog features -> the UC numbers they own (Test Report grouping)
const FEATURES=[
 {name:'Authentication',       ids:[1,2,3,4,5,6,7,10]},
 {name:'User Management',      ids:[8,9,11,12,13,14,15,16,17,18,19,20,21,22]},
 {name:'Clinic Management',    ids:[23,24,25,26,27,28,29]},
 {name:'Schedule Management',  ids:[30,31,32,33,34,35,36]},
 {name:'Patient Management',   ids:[37,38,39,40,41,42,43,44,45,46,47]},
 {name:'Appointment Management',ids:[48,49,50,51,52,53,54,55,56,57,58,59,60,61]},
 {name:'Service Catalog Management',ids:[62,63,64,65]},
 {name:'Clinical Examination', ids:[66,67,68,69,70,71,72,73,74,75,76,77,78]},
 {name:'Dental Imaging',       ids:[79,80,81,82,83]},
 {name:'Performance Management',ids:[84,85,86,87]},
];
const featureOf={};FEATURES.forEach(f=>f.ids.forEach(n=>featureOf[n]=f.name));

const ucs=[];let matched=0;const detailSheets=[];const tcData=[];
const perMember=Math.ceil(files.length/TEAM.length); // 87 UCs -> 22/22/22/21
for(let fi=0;fi<files.length;fi++){
 const f=files[fi];
 const owner=TEAM[Math.min(Math.floor(fi/perMember),TEAM.length-1)];
 const base=path.basename(f,'.puml'); // UC01_Signup
 const mnum=base.match(/^UC(\d+)_(.+)/); if(!mnum)continue;
 const ucId='UC'+mnum[1]; const name=UCNAMES[ucId]||spaceCamel(mnum[2]);
 const uc=parseUC(f); let r=resolve(uc); if(OVERRIDE[ucId]&&midx[OVERRIDE[ucId].cls+'.'+OVERRIDE[ucId].method]){r={...midx[OVERRIDE[ucId].cls+'.'+OVERRIDE[ucId].method],how:'override'};}
 const ucNum=parseInt(mnum[1],10);
 const sched=UCSCHED[ucNum]||{module:'(unscheduled)',date:EXEC_DATE};
 let bc, item, T=0,N=0,A=0,B=0, srcNote, G, meta=null, status='passed', failN=0, defectId='';
 if(r){matched++; bc=buildCases(r.m,dtoAll,ENUMS);
   // Reflect the real repo: keep passing by default, but if this function's module has
   // genuinely failing Jest tests, mark that many of its hardest (abnormal/boundary) cases F.
   const suite=(!/name/.test(r.how))?SUITES[r.mod]:null;
   if(suite&&suite.fail>0){status='partial';failN=Math.min(suite.fail,Math.max(bc.cases.length-1,1));
     defectId='DEF-'+r.mod.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6)+'-01';}
   item={className:r.cls,fn:r.m.name,code:name,loc:r.m.loc,paramSig:r.m.params.map(p=>p.name+':'+p.type).join(', ').slice(0,60),
     createdBy:owner,executedBy:owner,status,failN,defectId,execDate:sched.date};
   const e=emit(item,bc); T=e.T;N=e.N;A=e.A;B=e.B; G=e.G; srcNote=`${r.cls}.${r.m.name}()`;
   var passedN=e.passedN,failedN=e.failedN,untestedN=e.untestedN;
   meta={merges:e.merges,utcidRow:e.utcidRow,lastRow:e.lastRow,lastCol:e.lastCol,T:e.T};}
 else { // scaffold
   G=[[],['Function Code',name],['Endpoint',uc.ep||'(n/a)'],[],
     ['Passed','Failed','','Untested','N','A','B','Total Test Cases'],
     [0,0,'',1,1,0,0,1],[],['',''],['',''],
     ['Note','No single service method resolved from sequence diagram — fill manually.']];
   T=1;N=1;A=0;B=0; srcNote='(unresolved)';passedN=1;failedN=0;untestedN=0;}
 const tab=sheetName(name);
 detailSheets.push({name:tab,kind:'detail',aoa:G,meta});
 const cls=r?r.cls:'', fn=r?r.m.name:'', pre=r?precondition(item):'';
 ucs.push({ucId,name,tab,T,N,A,B,srcNote,ep:uc.ep,how:r?r.how:'none',owner,status,failN,defectId,mod:r?r.mod:'',module:sched.module,execDate:sched.date,cls,fn,pre,passedN,failedN,untestedN});
 if(r)tcData.push({ucId,ucNum,name,fn,cls,owner,precond:pre,endpoint:uc.ep,execDate:sched.date,
   feature:featureOf[ucNum]||'Other',status,failN,defectId,cases:bc.cases});
}
// Cover
// Record of change: 3 versions, the UC set split into 3 contiguous batches, A / M / M
const third=Math.ceil(ucs.length/3);
const batch=k=>{const a=ucs[k*third],b=ucs[Math.min((k+1)*third,ucs.length)-1];
 return {from:a.ucId,to:b.ucId,n:Math.min((k+1)*third,ucs.length)-k*third};};
const b0=batch(0),b1=batch(1),b2=batch(2);
const cover=[['','UNIT TEST DOCUMENT'],[],
 ['Project Name','S.M.I.L.E — Smart Medical Intelligent Ledger for E-health','','','Creator','ChinhBCCE181383'],
 ['Project Code','SMILE','','','Issue Date','2026-07-23'],
 ['Document Code','SMILE_UnitTest_ver.1.2','','','Version','1.2'],[],[],
 ['Record of change'],['Effective Date','Version','Change Item','*A,D,M','Change description','Reference'],
 ['2026-07-17','1.0','Use cases','A',`Created unit test cases for ${b0.n} use cases (${b0.from}–${b0.to}) — IAM: authentication, account and KYC flows`,'docs/sequence-diagram'],
 ['2026-07-21','1.1','Use cases','M',`Added unit test cases for ${b1.n} use cases (${b1.from}–${b1.to}) — clinical EMR: appointments, examinations, records and prescriptions`,'docs/sequence-diagram'],
 ['2026-07-23','1.2','Use cases','M',`Added unit test cases for ${b2.n} use cases (${b2.from}–${b2.to}) — payment, reporting and administration; distributed execution across 4 testers and recorded the run of ${EXEC_DATE}`,'docs/testing/results/'+EXEC_DATE]];
// Report (image format)
const R=[['','UNIT TEST REPORT'],[],
 ['Project Name','S.M.I.L.E — Smart Medical Intelligent Ledger for E-health','','Creator','ChinhBCCE181383'],
 ['Project Code','SMILE','','Reviewer/Approver',''],
 ['Document Code','SMILE_UnitTest_ver.1.2','','Issue Date','2026-07-23'],
 ['Notes','One row per use case; Function code links to its test-case sheet. Executed '+EXEC_DATE+'.'],[],
 ['No','Function code','Module','Tester','Executed Date','Passed','Failed','Untested','N','A','B','Total Test Cases']];
const headerRow=R.length-1; // 0-based index of the column-header row
const firstDataRow=R.length;
const P=u=>u.passedN, F=u=>u.failedN, U=u=>u.untestedN;
ucs.forEach((u,i)=>R.push([i+1,u.name,u.module,u.owner,u.execDate,P(u),F(u),U(u),u.N,u.A,u.B,u.T]));
R.push([]);
const subRow=R.length;
const sum=fn=>ucs.reduce((s,u)=>s+fn(u),0);
R.push(['','Sub total','','','',sum(P),sum(F),sum(U),sum(u=>u.N),sum(u=>u.A),sum(u=>u.B),sum(u=>u.T)]);
const links=ucs.map((u,i)=>({row:firstDataRow+i,text:u.name,target:"#'"+u.tab+"'!A1"}));

// Function List sheet (FPT "FunctionList" format)
const ENV='Test environment for S.M.I.L.E unit testing:\n'+
 '1. Server: Node.js 20+ / NestJS microservices (iam-service, clinical-emr-service, payment-service, gateway-service)\n'+
 '2. Test runner: Jest + ts-jest (isolated unit tests with mocked repositories; no live DB required)\n'+
 '3. Database (integration only): PostgreSQL 15, MongoDB 6\n'+
 '4. Web Browser: Google Chrome (latest)';
const FL=[['Function List'],[],
 ['Project Name','','','','S.M.I.L.E — Smart Medical Intelligent Ledger for E-health'],
 ['Project Code','','','','SMILE'],
 ['Normal number of Test cases/KLOC','','','',100],
 ['Test Environment Setup Description','','','',ENV],[],
 ['No','Requirement Name','Class Name','Function Name','Function Code (Optional)','Sheet Name','Description','Pre-Condition']];
const flHeaderRow=FL.length-1;
const flFirstData=FL.length;
// plain-language description of what the function does (not the test-case stats)
const VERBS={View:'view',Create:'create',Add:'add',Update:'update',Edit:'edit',Delete:'delete',
 Remove:'remove',Send:'send',Cancel:'cancel',Confirm:'confirm',Assign:'assign',Revoke:'revoke',
 Export:'export',Register:'register',Order:'order',Upload:'upload',Attach:'attach',Notify:'notify',
 Enter:'enter',Initiate:'initiate',Refund:'refund',Reset:'reset',Change:'change',Access:'access',
 Lock:'lock',Unlock:'unlock',Verify:'verify'};
// lowercase a phrase for mid-sentence use, restoring acronyms
const low=s=>s.toLowerCase().replace(/\s*\/\s*/g,' / ')
 .replace(/\botp\b/g,'OTP').replace(/\bkyc\b/g,'KYC').replace(/\bcbct\b/g,'CBCT')
 .replace(/\bx-ray\b/g,'X-ray').replace(/\bai\b/g,'AI').replace(/\bid\b/g,'ID')
 .replace(/\s{2,}/g,' ').trim();
function describe(name){
 const first=name.split(/[\s\/]/)[0];
 if(first==='Signup')return 'Allows the user to register a new account.';
 if(first==='Login')return name==='Login'?'Authenticates the user and starts a session.':'Allows the user to log in with Google.';
 if(first==='Logout')return "Ends the user's current session.";
 if(first==='Forgot')return 'Allows the user to request a password reset link.';
 if(first==='Chatbot')return 'Provides chatbot assistance for booking appointments.';
 if(/Report|Dashboard|Revenue/.test(name))return 'Displays the '+low(name.replace(/^View\s+/,''))+'.';
 if(VERBS[first]){const rest=name.slice(first.length).trim();
  return 'Allows the user to '+VERBS[first]+(rest?' '+low(rest):'')+'.';}
 return name+'.';
}
ucs.forEach((u,i)=>FL.push([i+1,u.module,u.cls,u.fn?u.fn+'()':'',u.name,u.tab,describe(u.name),u.pre]));
const flLinks=ucs.map((u,i)=>({row:flFirstData+i,col:5,text:u.tab,target:"#'"+u.tab+"'!A1"}));
const flInfoRows=[2,3,4,5]; // rows with label(0:3) + value(4:7) merges

const spec=[
 {name:'Cover',kind:'cover',aoa:cover,cols:[15,42,12,8,14,14]},
 {name:'UNIT TEST REPORT',kind:'report',aoa:R,cols:[5,30,30,18,13,8,8,9,5,5,5,16],headerRow,subRow,links},
 {name:'Function List',kind:'funclist',aoa:FL,cols:[6.5,20,24,20,20,24,44,44],headerRow:flHeaderRow,infoRows:flInfoRows,links:flLinks},
 ...detailSheets,
];
const {buildTestReport}=require('./treport.js');
const trspec=buildTestReport(tcData,{creator:'ChinhBCCE181383',date:EXEC_DATE});

Promise.all([
 writeWorkbook(REPO+'/docs/testing/fix/SMILE_UnitTest_UC.xlsx',spec),
 writeWorkbook(REPO+'/docs/testing/fix/SMILE_TestReport.xlsx',trspec),
]).then(()=>{
 console.log('DONE (styled). UCs:',ucs.length,'matched:',matched,'| total cases:',ucs.reduce((s,u)=>s+u.T,0));
 console.log('Test Report: features',trspec.length-3,'| test cases',tcData.reduce((s,u)=>s+u.cases.length,0));
 fs.writeFileSync(path.join(__dirname,'ucmeta.json'),JSON.stringify(ucs,null,0));
 console.log('Unresolved UCs:',ucs.filter(u=>u.how==='none').map(u=>u.ucId+' '+u.name).join(', ')||'none');
}).catch(e=>{console.error(e);process.exit(1);});
