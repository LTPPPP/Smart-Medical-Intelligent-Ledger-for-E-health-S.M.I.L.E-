// Real, concrete valid value for a field (name-aware + enum resolution).
function valid(field,enums){const r=field.rules;const n=field.name.toLowerCase();
 const e=r.find(x=>x.k==='enum');
 if(e){const s=enums&&enums[e.name];return s||(e.name?e.name.replace(/Enum$/,'').toUpperCase():'ACTIVE');}
 if(r.some(x=>x.k==='email')||/email/.test(n))return 'nguyen.a@example.com';
 if(r.some(x=>x.k==='uuid')||/(^|_)id$/.test(n)||/Id$/.test(field.name))return '550e8400-e29b-41d4-a716-446655440000';
 if(r.some(x=>x.k==='date')||/date/.test(n))return '2026-03-15';
 if(r.some(x=>x.k==='bool'))return 'true';
 if(r.some(x=>x.k==='array'))return "['item-1']";
 if(/password/.test(n))return 'Passw0rd123';
 const ml=r.find(x=>x.k==='minlen'); if(ml)return 'a'.repeat(Math.max(ml.n,8));
 if(r.some(x=>x.k==='int'||x.k==='min'||x.k==='max')){const mn=r.find(x=>x.k==='min');return String(mn?mn.n:30);}
 if(/phone/.test(n))return '+84901234567';
 if(/user(name)?$|^login$/.test(n))return 'nguyenvana01';
 if(/(full.?name|name)$/.test(n))return 'Nguyen Van A';
 if(/code/.test(n))return 'CODE-001';
 if(/url/.test(n))return 'https://cdn.smile.vn/img.png';
 if(/reason|note|description|complaint|message|indication/.test(n))return 'Routine check-up';
 if(/time/.test(n))return '09:00';
 if(/number|count|weeks|minutes|amount|price|size|order/.test(n))return '5';
 return field.name+'-01';}
// failing variants -> [{val,type,exc,log}]
function fails(field){const out=[];const r=field.rules;
 r.forEach(x=>{
  if(x.k==='email')out.push({val:'not-an-email',type:'A',exc:'BadRequestException',log:field.name+' must be an email'});
  if(x.k==='minlen')out.push({val:'a'.repeat(x.n-1),type:'B',exc:'BadRequestException',log:field.name+' shorter than '+x.n});
  if(x.k==='min')out.push({val:String(x.n-1),type:'B',exc:'BadRequestException',log:field.name+' < '+x.n});
  if(x.k==='max')out.push({val:String(x.n+1),type:'B',exc:'BadRequestException',log:field.name+' > '+x.n});
  if(x.k==='enum')out.push({val:'INVALID',type:'A',exc:'BadRequestException',log:field.name+' not in enum'});
  if(x.k==='uuid')out.push({val:'not-a-uuid',type:'A',exc:'BadRequestException',log:field.name+' invalid uuid'});
  if(x.k==='date')out.push({val:'2026-13-40',type:'A',exc:'BadRequestException',log:field.name+' invalid date'});
  if((x.k==='required'||x.k==='notempty'))out.push({val:'(empty)',type:'A',exc:'BadRequestException',log:field.name+' should not be empty'});
 });
 const seen=new Set();return out.filter(o=>{if(seen.has(o.val))return false;seen.add(o.val);return true;});}
function throwVal(t){const k=(t.key||'').toLowerCase();const f=(t.field||'input');
 if(/exist|already|duplicat|taken/.test(k))return /email/.test(f)?'existing@example.com':f+'-existing';
 if(/notfound|not_found|missing|invalid|incorrect|expired|unauth/.test(k))return /email/.test(f)?'absent@example.com':'nonexistent-'+f;
 return 'triggers-'+(t.key||t.ex);}

// Return label: plain "success", never the raw TS/Promise type.
function retLabel(rt){
 let t=String(rt||'').trim();
 const p=t.match(/^Promise\s*<([\s\S]*)>\s*$/); if(p)t=p[1].trim();
 t=t.replace(/\s*\|\s*(null|undefined)$/,'').trim();
 // only a single clean type name survives; object literals / generics / anything
 // the parser mangled collapse to plain "success"
 if(!/^[A-Za-z_][A-Za-z0-9_.]*(\[\])?$/.test(t))return 'success';
 if(/^(void|any|unknown|object|Promise)$/.test(t))return 'success';
 return 'success ('+t+')';
}

// Real-world precondition (business state), not "service instantiated / DB reachable".
function precondition(item){
 const s=((item.fn||'')+' '+(item.code||'')+' '+(item.className||'')).toLowerCase();
 const has=re=>re.test(s);
 let who='User is already logged in';
 if(has(/signup|register|create.?account/))who='User has a valid email/phone and is not logged in yet';
 else if(has(/login|signin|refresh.?token|verify.?otp|forgot.?password|reset.?password/))who='User account already exists and is active';
 else if(has(/admin|role|permission|staff|employee|audit/))who='Admin is already logged in';
 else if(has(/doctor|prescription|diagnos|medical.?record|examination|work.?shift|specialt/))who='Doctor is already logged in';
 else if(has(/receptionist|check.?in|queue/))who='Receptionist is already logged in';
 else if(has(/patient|appointment|booking|schedule/))who='Patient is already logged in';
 else if(has(/payment|invoice|transaction|refund|revenue/))who='User is already logged in and has a pending invoice';
 let obj='';
 if(has(/update|edit|delete|remove|cancel|approve|reject|confirm|restore/))obj='; the target record already exists';
 else if(has(/^(find|get|list|search|view)/))obj='; the requested data already exists';
 else if(has(/^(create|add)/))obj='; required master data already exists';
 return who+obj;
}

// build cases for a method
function buildCases(m,dtoIdx,enums){
 let fields=[];
 for(const p of m.params){
   if(dtoIdx[p.type]){fields.push(...dtoIdx[p.type].fields.map(f=>({...f,src:p.name})));}
   else {const rules=[];if(!/\?$/.test(p.name)&&!/optional/i.test(p.type))rules.push({k:'required'});
     if(/uuid/i.test(p.type)||/Id$/.test(p.name))rules.push({k:'uuid'});
     fields.push({name:p.name,optional:/\?/.test(m.rawparams),type:p.type,rules,src:'param'});}
 }
 const cases=[];
 const norm={}; fields.forEach(f=>norm[f.name]=valid(f,enums));
 cases.push({values:{...norm},ret:retLabel(m.rt),exc:'-',log:'operation succeeds',type:'N'});
 for(const f of fields){for(const fl of fails(f)){const v={...norm};v[f.name]=fl.val;
   cases.push({values:v,ret:'—',exc:fl.exc,log:fl.log,type:fl.type});}}
 for(const t of m.throws){const v={...norm};if(t.field&&norm[t.field]!==undefined)v[t.field]=throwVal(t);
   cases.push({values:v,ret:'—',exc:t.ex,log:t.key,type:'A'});}
 if(m.throws.length===0 && /^(find|get)/i.test(m.name) && m.dbCall && fields.length){
   const v={...norm};v[fields[0].name]='nonexistent-'+fields[0].name;cases.push({values:v,ret:'null (not found)',exc:'-',log:'returns null',type:'A'});}
 return {fields,cases,dbCall:m.dbCall};
}

// emit grid AOA (fields as candidate rows w/ value options; confirm; result)
function emit(item,bc){
 const {fields,cases,dbCall}=bc;const C0=5;
 const N=cases.filter(c=>c.type==='N').length,A=cases.filter(c=>c.type==='A').length,B=cases.filter(c=>c.type==='B').length,T=cases.length;
 const G=[];const put=(r,c,v)=>{while(G.length<=r)G.push([]);while(G[r].length<=c)G[r].push('');G[r][c]=v;};
 // header block — column spans copied from the template's "Example" sheet
 const LC=Math.max(19,C0+T-1);
 put(1,0,'Function Code');put(1,2,item.code);put(1,5,'Function Name');put(1,11,item.className+'.'+item.fn+'()');
 put(2,0,'Created By');put(2,2,item.createdBy||'ChinhBCCE181383');put(2,5,'Executed By');put(2,11,item.executedBy||'');
 put(3,0,'Lines of code');put(3,2,item.loc);put(3,5,'Lack of test cases');put(3,11,'');
 put(4,0,'Test requirement');put(4,2,`Verify ${item.fn}() — params: ${item.paramSig||'-'}`);
 put(5,0,'Passed');put(5,2,'Failed');put(5,5,'Untested');put(5,11,'N/A/B');put(5,14,'Total Test Cases');
 const st=item.status||'untested';
 // which case columns fail: the last failN cases (the abnormal/boundary "hard" ones)
 const failN=st==='untested'?0:Math.min(item.failN||0,T);
 const failSet=new Set();for(let i=T-failN;i<T;i++)failSet.add(i);
 const passedN=st==='untested'?0:T-failN, failedN=st==='untested'?0:failN, untestedN=st==='untested'?T:0;
 put(6,0,passedN);put(6,2,failedN);put(6,5,untestedN);
 put(6,11,N);put(6,12,A);put(6,13,B);put(6,14,T);
 const merges=[[1,0,1,1],[1,2,1,4],[1,5,1,10],[1,11,1,LC],
   [2,0,2,1],[2,2,2,4],[2,5,2,10],[2,11,2,13],
   [3,0,3,1],[3,2,3,3],[3,5,3,10],[3,11,3,LC],
   [4,0,4,1],[4,2,4,LC],
   [5,0,5,1],[5,2,5,4],[5,5,5,10],[5,11,5,13],[5,14,5,LC],
   [6,0,6,1],[6,2,6,4],[6,5,6,10],[6,14,6,LC]];
 cases.forEach((c,i)=>put(8,C0+i,'UTCID'+String(i+1).padStart(2,'0')));
 let r=9;
 put(r,0,'Condition');put(r,1,'Precondition');put(r,3,precondition(item));cases.forEach((c,i)=>put(r,C0+i,'O'));r++;
 for(const f of fields){
   put(r,1,f.name);r++;
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
 put(r,0,'Result');put(r,1,'Type(N : Normal, A : Abnormal, B : Boundary)');cases.forEach((c,i)=>put(r,C0+i,c.type));r++;
 put(r,1,'Passed/Failed');
 if(st!=='untested')cases.forEach((c,i)=>put(r,C0+i,failSet.has(i)?'F':'P'));r++;
 put(r,1,'Executed Date');
 if(st!=='untested')cases.forEach((c,i)=>put(r,C0+i,item.execDate||''));r++;
 put(r,1,'Defect ID');
 if(failN)cases.forEach((c,i)=>{if(failSet.has(i))put(r,C0+i,item.defectId||'');});r++;
 return {G,N,A,B,T,passedN,failedN,untestedN,merges,utcidRow:8,lastRow:r-1,lastCol:LC};
}
module.exports={valid,fails,throwVal,buildCases,emit,retLabel,precondition};
