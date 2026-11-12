import {readFileSync,writeFileSync,mkdirSync,lstatSync,existsSync} from "node:fs";
import {resolve,join,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {createHash} from "node:crypto";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const dest=join(root,"dist/pages");
const allow=["index.html","app.mjs","src/evaluate.mjs"];
const read=p=>{const filepath=join(root,p);if(lstatSync(filepath).isSymbolicLink())throw Error("SYMLINK_SOURCE");return readFileSync(filepath);};
const html=read("index.html").toString("utf8");
const app=read("app.mjs").toString("utf8");
if(!html.includes("connect-src 'none'")||!html.includes("script-src 'self'")||
  !html.includes('src="./app.mjs"')||html.includes("<iframe")||html.includes("<img"))throw Error("SITE_SAFETY_CONTRACT");
if(/(?:fetch\s*\(|XMLHttpRequest|localStorage|innerHTML|eval\s*\()/.test(app))throw Error("UNSAFE_APP_PRIMITIVE");
if(existsSync(dest))throw Error("STAGE_ALREADY_EXISTS");
mkdirSync(dest,{recursive:true});
const hashes={};
for(const p of allow){
 const data=read(p);
 if(data.length>75000)throw Error("SOURCE_TOO_LARGE");
 mkdirSync(dirname(join(dest,p)),{recursive:true});
 writeFileSync(join(dest,p),data,{flag:"wx"});
 hashes[p]=createHash("sha256").update(data).digest("hex");
}
writeFileSync(join(dest,".nojekyll"),"",{flag:"wx"});
console.log(JSON.stringify({state:"STAGED_ONLY",files:[...allow,".nojekyll"],hashes,remoteCalls:false}));
