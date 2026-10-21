import fs from 'node:fs';
const s = fs.readFileSync('../research/script-en.pretty.js','utf8');
function findAssign(name){
  const re = new RegExp('(?:^|[,\\s])'+name.replace(/[$]/g,'\\$&')+'\\s*=\\s*([\\[{])','m');
  const m = re.exec(s); if(!m) throw new Error('not found '+name);
  const start = m.index + m[0].lastIndexOf(m[1]);
  const open = m[1], close = open==='['?']':'}';
  let depth=0, inStr=null, esc=false, line=false, block=false;
  for(let i=start;i<s.length;i++){
    const c=s[i], n=s[i+1];
    if(line){ if(c==='\n') line=false; continue; }
    if(block){ if(c==='*'&&n==='/'){block=false;i++;} continue; }
    if(inStr){ if(esc){esc=false;continue;} if(c==='\\'){esc=true;continue;} if(c===inStr) inStr=null; continue; }
    if(c==='/'&&n==='/'){line=true;i++;continue;}
    if(c==='/'&&n==='*'){block=true;i++;continue;}
    if(c==='"'||c==="'"||c==='`'){inStr=c;continue;}
    if(c===open) depth++;
    else if(c===close){depth--; if(depth===0) return s.slice(start,i+1);}
  }
  throw new Error('unbalanced '+name);
}
const p = {};
const cfg = fs.readFileSync('../research/config-inline.js','utf8');
const mm = cfg.match(/var MapOptions = (\{[\s\S]*?\n\});/);
if(mm){ Object.assign(p, Function('return ('+mm[1]+')')()); }
const sizes={};
for(const n of ['rb','ma','va','Ta','$a','Ua']) sizes[n]=Function('return ('+findAssign(n)+')')();
const wa = Function('return ('+findAssign('wa')+')')();
const Va = Function('bb','return ('+findAssign('Va')+')')({});
const T = Function('p','ma','va','Ta','$a','Ua','rb','m','return ('+findAssign('T')+')')(p,sizes.ma,sizes.va,sizes.Ta,sizes.$a,sizes.Ua,sizes.rb,{min:(...a)=>Math.min(...a),max:(...a)=>Math.max(...a)});
fs.writeFileSync('wa.json',JSON.stringify(wa,null,2));
fs.writeFileSync('Va.json',JSON.stringify(Va,null,2));
fs.writeFileSync('T.json',JSON.stringify(T,null,2));
fs.writeFileSync('sizes.json',JSON.stringify(sizes,null,2));
console.log('ok',Object.keys(T).length);
for(const [k,v] of Object.entries(T)) console.log(k, JSON.stringify(v.size));
