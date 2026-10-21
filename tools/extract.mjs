import fs from 'node:fs';
const s = fs.readFileSync('../research/script-en.pretty.js','utf8');
function findAssign(name){
  const re = new RegExp('(?:^|[,\\s])'+name+'\\s*=\\s*([\\[{])','m');
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
if(mm){ const obj = Function('return ('+mm[1]+')')(); Object.assign(p,obj); }
const wa = Function('return ('+findAssign('wa')+')')();
const Va = Function('bb','return ('+findAssign('Va')+')')({});
const T = Function('p','ma','va','Ta','$a','Ua','rb','m','return ('+findAssign('T')+')')(p,{},{},{},{},{},{},{min:(...a)=>Math.min(...a),max:(...a)=>Math.max(...a)});
fs.writeFileSync('wa.json',JSON.stringify(wa,null,2));
fs.writeFileSync('Va.json',JSON.stringify(Va,null,2));
fs.writeFileSync('T.json',JSON.stringify(T,null,2));
console.log('wa groups',wa.length,'Va',Object.keys(Va).length,'T models',Object.keys(T).length);
console.log(Object.keys(T).join(' '));
