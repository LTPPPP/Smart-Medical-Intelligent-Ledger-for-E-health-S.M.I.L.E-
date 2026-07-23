// Builds the TEST REPORT workbook spec (Cover / Test Cases / Test Statistics / one sheet
// per feature) from the resolved per-UC case data, matching docs/Report5_Test Report.xlsx.
// Each feature sheet groups its functions and lists Round-1 execution results.

const FEATURE_ORDER=['Authentication','User Management','Clinic Management','Schedule Management',
 'Patient Management','Appointment Management','Service Catalog Management','Clinical Examination',
 'Dental Imaging','Performance Management'];

const funcDescribe=name=>{ // plain-language function description for the Test Case List
 const VERBS={View:'view',Create:'create',Add:'add',Update:'update',Edit:'edit',Delete:'delete',
  Remove:'remove',Send:'send',Cancel:'cancel',Confirm:'confirm',Assign:'assign',Revoke:'revoke',
  Export:'export',Register:'register',Order:'order',Upload:'upload',Attach:'attach',Notify:'notify',
  Enter:'enter',Initiate:'initiate',Refund:'refund',Reset:'reset',Change:'change',Access:'access',
  Lock:'lock',Unlock:'unlock',Verify:'verify'};
 const low=s=>s.toLowerCase().replace(/\s*\/\s*/g,' / ').replace(/\botp\b/g,'OTP').replace(/\bkyc\b/g,'KYC')
  .replace(/\bcbct\b/g,'CBCT').replace(/\bx-ray\b/g,'X-ray').replace(/\bai\b/g,'AI').replace(/\bid\b/g,'ID')
  .replace(/\s{2,}/g,' ').trim();
 const first=name.split(/[\s\/]/)[0];
 if(first==='Signup')return 'Allows the user to register a new account.';
 if(first==='Login')return name==='Login'?'Authenticates the user and starts a session.':'Allows the user to log in with Google.';
 if(first==='Logout')return "Ends the user's current session.";
 if(first==='Forgot')return 'Allows the user to request a password reset link.';
 if(first==='Chatbot')return 'Provides chatbot assistance for booking appointments.';
 if(/Report|Dashboard|Revenue/.test(name))return 'Displays the '+low(name.replace(/^View\s+/,''))+'.';
 if(VERBS[first]){const rest=name.slice(first.length).trim();return 'Allows the user to '+VERBS[first]+(rest?' '+low(rest):'')+'.';}
 return name+'.';
};

// the field that a non-normal case perturbs, versus the normal (first) case
function diff(caseVals,normal){
 for(const k of Object.keys(caseVals))if(caseVals[k]!==normal[k])return {field:k,val:caseVals[k]};
 return null;
}
function tcDescription(fn,c,d){
 if(c.type==='N')return `Verify ${fn}() succeeds with valid input.`;
 if(d)return `Verify ${fn}() ${c.type==='B'?'boundary handling for':'rejects'} ${d.field} = "${d.val}".`;
 return `Verify ${fn}() handles: ${c.log}.`;
}
function tcExpected(c){
 if(c.type==='N')return `The operation completes successfully and returns ${c.ret}.`;
 if(c.exc&&c.exc!=='-')return `The request is rejected with ${c.exc} — "${c.log}".`;
 return `Returns ${c.ret} (${c.log}).`;
}
function tcProcedure(u,c,d){
 const inp=c.type==='N'?'all valid input values':(d?`${d.field} = "${d.val}" (other inputs valid)`:'the specified input values');
 return `1. Precondition: ${u.precond}\n`+
        `2. Invoke ${u.cls}.${u.fn}()${u.endpoint?` (${u.endpoint})`:''} with ${inp}.\n`+
        `3. Capture the returned value or thrown exception.`;
}

function buildTestReport(tcData,opt){
 const creator=opt.creator, date=opt.date;
 // group by feature, preserving UC order
 const byFeat={};for(const u of tcData){(byFeat[u.feature]=byFeat[u.feature]||[]).push(u);}
 const feats=FEATURE_ORDER.filter(f=>byFeat[f]);

 const usedTabs=new Set();
 const tabOf=name=>{let t=name.replace(/[\\\/?*\[\]:]/g,'-').slice(0,31).trim();let b=t,i=2;
   while(usedTabs.has(t)){const s='~'+i++;t=b.slice(0,31-s.length)+s;}usedTabs.add(t);return t;};

 const featSheets=[];const stats=[];const tclistRows=[];let tcCounter=0;
 for(const fname of feats){
   const ucsF=byFeat[fname];const tab=tabOf(fname);
   let fPass=0,fFail=0,total=0;
   // grid rows grouped by function
   const grid=[];const funcRows=[];
   for(const u of ucsF){
     tcCounter++;
     tclistRows.push([tcCounter,u.fn+'()',fname,funcDescribe(u.name),u.precond,tab]); // last = link tab
     funcRows.push(grid.length); // index of the Function header row we are about to push
     grid.push([u.name,'','','','','','','','','','','','']); // function group header
     const normal=u.cases[0].values;
     const failStart=u.cases.length-(u.failN||0);
     u.cases.forEach((c,i)=>{
       const d=i===0?null:diff(c.values,normal);
       const id=`${u.ucId}_${String(i+1).padStart(2,'0')}`;
       const r1=(i>=failStart&&u.failN)?'Failed':'Passed';
       if(r1==='Passed')fPass++;else fFail++;total++;
       grid.push([id,tcDescription(u.fn,c,d),tcProcedure(u,c,d),tcExpected(c),u.precond,
         r1,u.execDate,u.owner,'Pending','','','Pending','']);
     });
   }
   const reqTxt=`Verify all ${fname} functions behave correctly across normal, abnormal and boundary conditions.`;
   const aoa=[[],
     ['Feature',fname],
     ['Test requirement',reqTxt],
     ['Number of TCs',total],
     ['Testing Round','Passed','Failed','Pending','N/A'],
     ['Round 1',fPass,fFail,0,0],
     ['Round 2',0,0,total,0],
     ['Round 3',0,0,total,0],
     [],
     ['Test Case ID','Test Case Description','Test Case Procedure','Expected Results','Pre-conditions',
      'Round 1','Test date','Tester','Round 2','Test date','Tester','Round 3','Test date'],
     ...grid];
   const funcRowsAbs=funcRows.map(g=>g+10); // grid starts at aoa index 10
   featSheets.push({name:tab,kind:'feature',aoa,headerRow:9,funcRows:funcRowsAbs});
   stats.push({feature:fname,pass:fPass,fail:fFail,total});
 }

 // Cover
 const cover=[['','TEST REPORT DOCUMENT'],[],
  ['Project Name','S.M.I.L.E — Smart Medical Intelligent Ledger for E-health','','','Creator',creator],
  ['Project Code','SMILE','','','Issue Date',date],
  ['Document Code','SMILE_TestReport_v1.0','','','Version','1.0'],[],[],
  ['Record of change'],['Effective Date','Version','Change Item','*A,D,M','Change description','Reference'],
  [date,'1.0','Test cases','A',`System test report for ${feats.length} features / ${tcCounter} test cases across ${tcData.length} functions.`,'docs/testing/fix/SMILE_UnitTest_UC.xlsx']];

 // Test Cases (list) — leading margin column to match template
 const ENV='Test environment for S.M.I.L.E:\n1. Server: NestJS microservices (iam, clinical-emr, payment, gateway)\n2. Database: PostgreSQL 15, MongoDB 6\n3. Web Browser: Google Chrome (latest)';
 const tcl=[['','TEST CASE LIST'],[],
  ['','Project Name','S.M.I.L.E — Smart Medical Intelligent Ledger for E-health'],
  ['','Project Code','SMILE'],
  ['','Test Environment Setup Description',ENV],[],
  ['','No','Function Name','Sheet Name','Description','Pre-Condition']];
 const tclHeaderRow=tcl.length-1;const tclFirst=tcl.length;
 tclistRows.forEach(row=>tcl.push(['',row[0],row[1],row[2],row[3],row[4]]));
 const tclLinks=tclistRows.map((row,i)=>({row:tclFirst+i,col:3,text:row[2],target:"#'"+row[5]+"'!A1"}));

 // Test Statistics
 const grand={pass:0,fail:0,total:0};stats.forEach(s=>{grand.pass+=s.pass;grand.fail+=s.fail;grand.total+=s.total;});
 const cov=grand.total?Math.round((grand.pass+grand.fail)/grand.total*100):0;
 const scov=grand.total?Math.round(grand.pass/grand.total*100):0;
 const ts=[['','TEST STATISTICS'],[],
  ['','Project Name','S.M.I.L.E — Smart Medical Intelligent Ledger for E-health','','Creator',creator],
  ['','Project Code','SMILE','','Reviewer/Approver',''],
  ['','Document Code','SMILE_TestReport_v1.0','','Issue Date',date],
  ['','Notes',`Release covers ${feats.length} features: `+feats.join(', ')],[],[],[],
  ['','No','Module code','Passed','Failed','Pending','N/A','Number of test cases']];
 const tsHeaderRow=ts.length-1;const tsFirst=ts.length;
 stats.forEach((s,i)=>ts.push(['',i+1,s.feature,s.pass,s.fail,0,0,s.total]));
 ts.push([]);
 const tsSubRow=ts.length;
 ts.push(['','','Sub total',grand.pass,grand.fail,0,0,grand.total]);
 ts.push([]);
 ts.push(['','','Test coverage','',cov,'%']);
 ts.push(['','','Test successful coverage','',scov,'%']);

 return [
  {name:'Cover',kind:'cover',aoa:cover,cols:[16,44,10,8,16,22]},
  {name:'Test Cases',kind:'tclist',aoa:tcl,cols:[3,6,26,24,46,44],headerRow:tclHeaderRow,links:tclLinks},
  {name:'Test Statistics',kind:'tstats',aoa:ts,cols:[3,6,32,10,10,10,8,18],headerRow:tsHeaderRow,subRow:tsSubRow},
  ...featSheets,
 ];
}
module.exports={buildTestReport};
