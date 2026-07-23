const XLSX=require('xlsx');
const {buildDtoIndex,methods}=require('./analyze2.js');
const cp=require('child_process'),fs=require('fs');const REPO=require('path').resolve(__dirname,'..','..');
const abbr={"iam-service":"IAM","clinical-emr-service":"EMR","payment-service":"PAY"};
const exclude=/(typeorm-config|mongoose-config|seed|redis-cache|handlebars|swagger-aggregator|infrastructure\/uploader)/;
const pascal=c=>c.split(/[-_]/).map(w=>w[0].toUpperCase()+w.slice(1)).join('')+'Service';
// importance
const modRank={auth:1,accounts:1,'otp-tokens':1,'refresh-tokens':1,'oauth-connections':2,'auth-google':2,'kyc-verifications':2,
 appointments:3,'appointment-availability':3,'appointment-option-token':3,payments:1,
 'examination-sessions':4,symptoms:4,diagnoses:4,'medical-records':4,'medical-history':4,
 prescriptions:4,'prescription-items':5,'treatment-plans':4,'treatment-history':5,
 'clinical-orders':5,'diagnostic-orders':5,'lab-test-results':5,patients:5,'patient-representatives':6,
 'dental-images':6,'dental-charts':6,'image-annotations':7,'image-categories':7,'pacs-sync-logs':7,'record-exports':6,
 clinics:7,'treatment-rooms':7,'doctor-schedules':6,'doctor-leaves':7,'work-shifts':7,specialties:7,'doctor-specialties':7,services:7,'service-categories':7,
 roles:6,permissions:6,'user-roles':6,'user-profiles':6,'audit-logs':7,notifications:7,reports:7,mail:7,files:7,
 'kyc-file-storage':7,'kyc-ocr':7,'kyc-ocr-poller':7,'kyc-ocr-assessment':7,'kyc-retention':7,'kyc-auto-verification':7,'kyc-file-access-audit':7};
const P1mod=new Set(['auth','accounts','otp-tokens','kyc-verifications','payments','appointments','prescriptions','treatment-plans','clinical-orders','diagnostic-orders','medical-records','examination-sessions','refresh-tokens','permissions','roles','user-roles']);
function methRank(n){if(/^(create|register|validate|login|submit|approve|pay|book|initiate|confirm)/i.test(n))return 1;if(/^(update|edit|change|cancel|reject|revoke|reset|verify|assign|set|lock|unlock)/i.test(n))return 2;if(/^(find|get|list|view|count|export)/i.test(n))return 3;if(/^(remove|delete|soft)/i.test(n))return 4;return 3;}

// value partitions
function valid(field){const r=field.rules;
 if(r.some(x=>x.k==='email'))return 'user@mail.com';
 if(r.some(x=>x.k==='uuid'))return '<valid uuid>';
 if(r.some(x=>x.k==='date'))return '2026-01-15';
 if(r.some(x=>x.k==='enum'))return '<valid '+(r.find(x=>x.k==='enum').name||'enum')+'>';
 if(r.some(x=>x.k==='int'||x.k==='min'||x.k==='max')){const mn=r.find(x=>x.k==='min');return String(mn?mn.n:5);}
 if(r.some(x=>x.k==='bool'))return 'true';
 if(r.some(x=>x.k==='array'))return '[valid item]';
 if(r.some(x=>x.k==='minlen')){const n=r.find(x=>x.k==='minlen').n;return "'"+('x'.repeat(n))+"' (len "+n+")";}
 return '<valid '+field.name+'>';}
// failing variants -> [{val,expl,type,exc,log}]
function fails(field){const out=[];const r=field.rules;
 r.forEach(x=>{
  if(x.k==='email')out.push({val:'not-an-email',type:'A',exc:'BadRequestException',log:field.name+' must be an email'});
  if(x.k==='minlen')out.push({val:"'"+('x'.repeat(x.n-1))+"' (len "+(x.n-1)+")",type:'B',exc:'BadRequestException',log:field.name+' shorter than '+x.n});
  if(x.k==='min')out.push({val:String(x.n-1),type:'B',exc:'BadRequestException',log:field.name+' < '+x.n});
  if(x.k==='max')out.push({val:String(x.n+1),type:'B',exc:'BadRequestException',log:field.name+' > '+x.n});
  if(x.k==='enum')out.push({val:'INVALID_ENUM',type:'A',exc:'BadRequestException',log:field.name+' not in enum'});
  if(x.k==='uuid')out.push({val:'not-a-uuid',type:'A',exc:'BadRequestException',log:field.name+' invalid uuid'});
  if(x.k==='date')out.push({val:'31-13-2026',type:'A',exc:'BadRequestException',log:field.name+' invalid date'});
  if((x.k==='required'||x.k==='notempty'))out.push({val:'(empty/missing)',type:'A',exc:'BadRequestException',log:field.name+' should not be empty'});
 });
 // dedupe by val
 const seen=new Set();return out.filter(o=>{if(seen.has(o.val))return false;seen.add(o.val);return true;});
}
function throwVal(t){const k=(t.key||'').toLowerCase();const f=t.field||'input';
 if(/exist|already|duplicat|taken/.test(k))return '<existing '+f+'>';
 if(/notfound|not_found|missing|invalid|incorrect|expired|unauth/.test(k))return '<invalid/absent '+f+'>';
 return '<triggers '+(t.key||t.ex)+'>';}

// build cases for a method
function buildCases(m,dtoIdx){
 // resolve fields
 let fields=[];
 for(const p of m.params){
   if(dtoIdx[p.type]){fields.push(...dtoIdx[p.type].fields.map(f=>({...f,src:p.name})));}
   else {const rules=[];if(!/\?$/.test(p.name)&&!/optional/i.test(p.type))rules.push({k:'required'});
     if(/uuid/i.test(p.type)||/Id$/.test(p.name))rules.push({k:'uuid'});
     fields.push({name:p.name,optional:/\?/.test(m.rawparams),type:p.type,rules,src:'param'});}
 }
 const cases=[]; // {label, values:{field->val}, ret, exc, log, type}
 const norm={}; fields.forEach(f=>norm[f.name]=valid(f));
 cases.push({values:{...norm},ret:'success ('+(m.rt||'value')+')',exc:'-',log:'operation succeeds',type:'N'});
 // validation-fail cases (one field bad)
 for(const f of fields){for(const fl of fails(f)){const v={...norm};v[f.name]=fl.val;
   cases.push({values:v,ret:'—',exc:fl.exc,log:fl.log,type:fl.type});}}
 // body throw cases (field-tied)
 for(const t of m.throws){const v={...norm};if(t.field&&norm[t.field]!==undefined)v[t.field]=throwVal(t);
   cases.push({values:v,ret:'—',exc:t.ex,log:t.key,type:'A'});}
 // finder not-found edge
 if(m.throws.length===0 && /^(find|get)/i.test(m.name) && m.dbCall && fields.length){
   const v={...norm};v[fields[0].name]='<nonexistent>';cases.push({values:v,ret:'null (not found)',exc:'-',log:'returns null',type:'A'});}
 return {fields,cases,dbCall:m.dbCall};
}

// emit grid AOA (fields as candidate rows w/ value options; confirm; result)
function emit(item,bc){
 const {fields,cases,dbCall}=bc;const C0=5;
 const N=cases.filter(c=>c.type==='N').length,A=cases.filter(c=>c.type==='A').length,B=cases.filter(c=>c.type==='B').length,T=cases.length;
 const G=[];const put=(r,c,v)=>{while(G.length<=r)G.push([]);while(G[r].length<=c)G[r].push('');G[r][c]=v;};
 put(1,0,'Function Code');put(1,2,item.code);put(1,5,'Function Name');put(1,11,item.className+'.'+item.fn+'()');
 put(2,0,'Created By');put(2,2,'chinhwind');put(2,5,'Executed By');
 put(3,0,'Lines of code');put(3,2,item.loc);put(3,5,'Lack of test cases');
 put(4,0,'Test requirement');put(4,2,`Verify ${item.fn}() — params: ${item.paramSig||'-'}`);
 put(5,0,'Passed');put(5,2,'Failed');put(5,5,'Untested');put(5,11,'N');put(5,12,'A');put(5,13,'B');put(5,14,'Total Test Cases');
 put(6,0,0);put(6,2,0);put(6,5,T);put(6,11,N);put(6,12,A);put(6,13,B);put(6,14,T);
 cases.forEach((c,i)=>put(8,C0+i,'UTCID'+String(i+1).padStart(2,'0')));
 let r=9;
 put(r,0,'Condition');put(r,1,'Precondition');put(r,3,dbCall?'Repository/DB reachable':'Service instantiated');cases.forEach((c,i)=>put(r,C0+i,'O'));r++;
 // each field = candidate, list distinct values used across cases
 for(const f of fields){
   put(r,1,f.name+(f.optional?'?':'')+' : '+f.type.slice(0,16));r++;
   const vals=[...new Set(cases.map(c=>c.values[f.name]))];
   for(const val of vals){put(r,3,String(val));cases.forEach((c,i)=>{if(c.values[f.name]===val)put(r,C0+i,'O');});r++;}
 }
 r++;
 put(r,0,'Confirm');put(r,1,'Return');r++;
 const rets=[...new Set(cases.map(c=>c.ret))];
 for(const rv of rets){put(r,3,rv);cases.forEach((c,i)=>{if(c.ret===rv)put(r,C0+i,'O');});r++;}
 put(r,1,'Exception');const excs=[...new Set(cases.map(c=>c.exc).filter(e=>e&&e!=='-'))];
 if(!excs.length)r++; else for(const e of excs){put(r,3,e);cases.forEach((c,i)=>{if(c.exc===e)put(r,C0+i,'O');});r++;}
 put(r,1,'Log message');const logs=[...new Set(cases.map(c=>c.log))];
 for(const lg of logs){put(r,3,lg);cases.forEach((c,i)=>{if(c.log===lg)put(r,C0+i,'O');});r++;}
 r++;
 put(r,0,'Result');put(r,1,'Type (N:Normal, A:Abnormal, B:Boundary)');cases.forEach((c,i)=>put(r,C0+i,c.type));r++;
 put(r,1,'Passed/Failed');r++;put(r,1,'Executed Date');r++;put(r,1,'Defect ID');r++;
 return {G,N,A,B,T};
}

// ---- collect all methods across services ----
const dtoAll={};const order=["iam-service","clinical-emr-service","payment-service"];
for(const s of order)Object.assign(dtoAll,buildDtoIndex(REPO+`/backend/service/${s}/src`));
let all=[];
for(const s of order){let files=cp.execSync(`find ${REPO}/backend/service/${s}/src -name '*.service.ts' -not -name '*.spec.ts'`).toString().trim().split('\n').filter(Boolean).filter(f=>!exclude.test(f)).sort();
 for(const f of files){const mod=f.split('/').pop().replace('.service.ts','');
  for(const m of methods(f)){all.push({svc:s,mod,fn:m.name,className:pascal(mod),m,
    paramSig:m.params.map(p=>p.name+':'+p.type).join(', ').slice(0,60),
    mRank:modRank[mod]||7,fnRank:methRank(m.name),pri:P1mod.has(mod)?'P1':'P2',loc:m.m?m.m.loc:m.loc});}}}
// sort by importance
all.sort((a,b)=>a.mRank-b.mRank||a.fnRank-b.fnRank||a.className.localeCompare(b.className)||a.fn.localeCompare(b.fn));
// version by tier
all.forEach(x=>x.ver=x.mRank<=3?'1.0':x.mRank<=5?'1.1':'1.2');
all.forEach((x,i)=>{x.no=i+1;x.sheet='F'+String(i+1).padStart(3,'0');
  x.code=`UT-${abbr[x.svc]}-${x.mod.toUpperCase().replace(/-/g,'')}-${x.fn}`.slice(0,40);});
// build sheets
const built=all.map(it=>{const bc=buildCases(it.m,dtoAll);const e=emit(it,bc);return {it,e};});
const totCases=built.reduce((s,b)=>s+b.e.T,0);

const wb=XLSX.utils.book_new();
const vcount=v=>all.filter(a=>a.ver===v).length;
const vcase=v=>built.filter(b=>b.it.ver===v).reduce((s,b)=>s+b.e.T,0);
const cover=[['','UNIT TEST DOCUMENT'],[],
 ['Project Name','S.M.I.L.E — Smart Medical Intelligent Ledger for E-health','','','Creator','chinhwind'],
 ['Project Code','SMILE','','','Issue Date','2026-07-23'],
 ['Document Code','SMILE_UnitTest_v1.2','','','Version','1.2'],[],[],
 ['Record of change'],
 ['Effective Date','Version','Change Item','*A,D,M','Change description','Reference'],
 ['2026-07-17','1.0','Functions','A',`Main-flow: auth, accounts, OTP, KYC, appointments, payments (${vcount('1.0')} fn / ${vcase('1.0')} cases)`,''],
 ['2026-07-21','1.1','Functions','A',`Clinical core: examination, records, prescriptions, treatment, orders, patients (${vcount('1.1')} fn / ${vcase('1.1')} cases)`,''],
 ['2026-07-23','1.2','Functions','A',`Supporting: images, clinic/schedule admin, roles, notifications, reports (${vcount('1.2')} fn / ${vcase('1.2')} cases)`,'']];
const wsC=XLSX.utils.aoa_to_sheet(cover);wsC['!cols']=[{wch:15},{wch:22},{wch:12},{wch:7},{wch:60},{wch:12}];XLSX.utils.book_append_sheet(wb,wsC,'Cover');
const F=[['','','','','Function List (ordered by main-flow importance)'],[],
 ['Project Name','','','','S.M.I.L.E'],['Project Code','','','','SMILE'],
 ['Test Environment','','','','Node 20+, Jest/Vitest, deps mocked, no live DB'],[],[],
 ['No','Requirement','Class Name','Function Name','Function Code','Sheet','Version','Cases','Priority','Params']];
for(const {it,e} of built)F.push([it.no,it.mod,it.className,it.fn+'()',it.code,it.sheet,it.ver,e.T,it.pri,it.paramSig]);
const wsF=XLSX.utils.aoa_to_sheet(F);wsF['!cols']=[{wch:5},{wch:16},{wch:22},{wch:22},{wch:30},{wch:7},{wch:7},{wch:6},{wch:7},{wch:40}];XLSX.utils.book_append_sheet(wb,wsF,'Functions');
const S=[['UNIT TEST REPORT'],[],['Project Name','S.M.I.L.E','','Creator','chinhwind'],['Project Code','SMILE','','Issue Date','2026-07-23'],
 ['Notes',all.length+' functions / '+totCases+' test cases (design complete, execution pending)'],[],
 ['Version','Date','Functions','Cases','Passed','Failed','Untested'],
 ['1.0','2026-07-17',vcount('1.0'),vcase('1.0'),0,0,vcase('1.0')],
 ['1.1','2026-07-21',vcount('1.1'),vcase('1.1'),0,0,vcase('1.1')],
 ['1.2','2026-07-23',vcount('1.2'),vcase('1.2'),0,0,vcase('1.2')],[],
 ['','Total',all.length,totCases,0,0,totCases],[],
 ['','Test coverage',{f:'(E12+F12)*100/D12'},'%'],['','Successful coverage',{f:'E12*100/D12'},'%']];
const wsS=XLSX.utils.aoa_to_sheet(S);wsS['!cols']=[{wch:9},{wch:12},{wch:10},{wch:8},{wch:8},{wch:8},{wch:9}];XLSX.utils.book_append_sheet(wb,wsS,'Statistics');
for(const {it,e} of built){const ws=XLSX.utils.aoa_to_sheet(e.G);ws['!cols']=[{wch:12},{wch:22},{wch:2},{wch:30}].concat(Array(e.T).fill({wch:11}));XLSX.utils.book_append_sheet(wb,ws,it.sheet);}
XLSX.writeFile(wb,REPO+'/docs/testing/SMILE_UnitTest.xlsx');
console.log('DONE sheets',wb.SheetNames.length,'functions',all.length,'cases',totCases);
console.log('v1.0',vcount('1.0'),'/',vcase('1.0'),' v1.1',vcount('1.1'),'/',vcase('1.1'),' v1.2',vcount('1.2'),'/',vcase('1.2'));
fs.writeFileSync(require('path').join(__dirname,'allmeta.json'),JSON.stringify(all.map(a=>({no:a.no,sheet:a.sheet,code:a.code,fn:a.fn,cls:a.className,ver:a.ver,pri:a.pri,cases:built.find(b=>b.it===a).e.T}))));
