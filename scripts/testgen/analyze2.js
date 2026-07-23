const fs=require('fs'),cp=require('child_process');
function matchPair(s,i,o,c){let d=0;for(;i<s.length;i++){if(s[i]===o)d++;else if(s[i]===c){d--;if(d===0)return i;}}return -1;}

// ---- DTO index: className -> {file, fields[]} ----
function buildDtoIndex(SR){
  const idx={};
  const files=cp.execSync(`find ${SR} -name '*.dto.ts' -not -name '*.spec.ts'`).toString().trim().split('\n').filter(Boolean);
  for(const f of files){
    const src=fs.readFileSync(f,'utf8');
    const re=/export class (\w+)\s*(?:extends\s+[\w<>., ]+)?\{/g;let m;
    while((m=re.exec(re.lastIndex,src)||re.exec(src))){ // fallback
      break;
    }
    // simpler: find each "export class X {"
    const cre=/export class (\w+)[^{]*\{/g;let cm;
    while((cm=cre.exec(src))){
      const cname=cm[1];const start=cm.index+cm[0].length-1;const end=matchPair(src,start,'{','}');
      const body=src.slice(start+1,end);
      idx[cname]={file:f,fields:parseFields(body)};
    }
  }
  return idx;
}
function parseFields(body){
  const fields=[];
  // split by property declarations: lines with "name?: type;" preceded by decorators
  const propRe=/((?:@\w+(?:\([^)]*\))?\s*)+)\s*(\w+)(\?)?\s*:\s*([\w<>\[\]| ]+?)\s*;/g;let m;
  while((m=propRe.exec(body))){
    const decs=m[1];const name=m[2];const opt=!!m[3]||/@IsOptional/.test(decs);const type=m[4].trim();
    const f={name,optional:opt,type,rules:[]};
    if(/@IsEmail/.test(decs))f.rules.push({k:'email'});
    const ml=decs.match(/@MinLength\((\d+)\)/);if(ml)f.rules.push({k:'minlen',n:+ml[1]});
    const xl=decs.match(/@MaxLength\((\d+)\)/);if(xl)f.rules.push({k:'maxlen',n:+xl[1]});
    const mn=decs.match(/@Min\((-?\d+)\)/);if(mn)f.rules.push({k:'min',n:+mn[1]});
    const mx=decs.match(/@Max\((-?\d+)\)/);if(mx)f.rules.push({k:'max',n:+mx[1]});
    if(/@IsEnum/.test(decs))f.rules.push({k:'enum',name:(decs.match(/@IsEnum\((\w+)/)||[])[1]});
    if(/@IsUUID/.test(decs))f.rules.push({k:'uuid'});
    if(/@IsDateString/.test(decs))f.rules.push({k:'date'});
    if(/@IsInt/.test(decs))f.rules.push({k:'int'});
    if(/@IsBoolean/.test(decs))f.rules.push({k:'bool'});
    if(/@IsArray/.test(decs))f.rules.push({k:'array'});
    if(/@IsNotEmpty/.test(decs))f.rules.push({k:'notempty'});
    if(!f.optional && !f.rules.some(r=>r.k==='notempty'))f.rules.push({k:'required'});
    fields.push(f);
  }
  return fields;
}

// ---- method extractor with throw field:key ----
function methods(file){
  const src=fs.readFileSync(file,'utf8');const out=[];
  const re=/^\s{2}(public\s+|private\s+)?(async\s+)?([a-zA-Z_]\w*)\s*\(/gm;let m;
  while((m=re.exec(src))){
    const name=m[3];
    if(['constructor','if','for','while','switch','catch','get','set','return'].includes(name))continue;
    if(m[1]&&m[1].trim()==='private')continue;
    const pOpen=src.indexOf('(',m.index+m[0].length-1);const pClose=matchPair(src,pOpen,'(',')');if(pClose<0)continue;
    const params=src.slice(pOpen+1,pClose).replace(/\s+/g,' ').trim();
    let i=pClose+1,ang=0,bs=-1;for(;i<src.length;i++){const c=src[i];if(c==='<')ang++;else if(c==='>'&&ang>0)ang--;else if(c==='{'&&ang===0){bs=i;break;}else if(c===';')break;}
    if(bs<0)continue;const be=matchPair(src,bs,'{','}');const body=src.slice(bs,be+1);
    // return type
    const rt=src.slice(pClose+1,bs).replace(/[:{]/g,'').replace(/\s+/g,' ').trim();
    // throws with field:key
    const throws=[];
    const tre=/throw new (\w+)\(([^]*?)\)\s*;/g;let tm;
    while((tm=tre.exec(body))){
      const ex=tm[1];const arg=tm[2];
      const fk=arg.match(/(\w+)\s*:\s*[`'"]([\w.]+)[`'"]/);
      const msg=arg.match(/[`'"]([^`'"]{4,80})[`'"]/);
      throws.push({ex,field:fk?fk[1]:null,key:fk?fk[2]:(msg?msg[1]:ex)});
    }
    const params2=parseParams(params);
    const dbCall=/repository|Repository|\.save\(|\.find|\.update\(|\.insert|manager\.|\.create\(|\.delete\(|\.remove\(/.test(body);
    out.push({name,params:params2,rawparams:params,throws,dbCall,rt,loc:body.split('\n').length,body});
  }
  return out;
}
function parseParams(p){
  if(!p)return[];
  // split top-level commas
  const parts=[];let d=0,cur='';for(const ch of p){if('<([{'.includes(ch))d++;else if('>)]}'.includes(ch))d--;if(ch===','&&d===0){parts.push(cur);cur='';}else cur+=ch;}if(cur.trim())parts.push(cur);
  return parts.map(x=>{const mm=x.match(/(\w+)\??\s*:\s*(.+)/);return mm?{name:mm[1].trim(),type:mm[2].trim()}:{name:x.trim(),type:'any'};});
}
module.exports={buildDtoIndex,methods};
if(require.main===module){
  const svc=process.env.REPO+'/backend/service/iam-service/src';
  const dto=buildDtoIndex(svc);
  console.log('DTOs indexed:',Object.keys(dto).length);
  console.log('CreateAccountDto fields:',JSON.stringify(dto.CreateAccountDto&&dto.CreateAccountDto.fields.map(f=>f.name+(f.optional?'?':'')+':'+f.rules.map(r=>r.k+(r.n!==undefined?r.n:'')).join('/'))));
  const ms=methods(svc+'/accounts/accounts.service.ts');
  const cr=ms.find(x=>x.name==='create');
  console.log('\ncreate params:',JSON.stringify(cr.params));
  console.log('create throws:',JSON.stringify(cr.throws));
}
