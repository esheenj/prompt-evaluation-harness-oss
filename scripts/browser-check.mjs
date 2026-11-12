import {createServer} from "node:http";
import {readFileSync} from "node:fs";
import {spawn} from "node:child_process";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(fileURLToPath(new URL("../dist/pages/",import.meta.url)));
const files=new Map([["/","index.html"],["/index.html","index.html"],["/app.mjs","app.mjs"],["/src/evaluate.mjs","src/evaluate.mjs"]]);
const server=createServer((req,res)=>{
 const path=new URL(req.url,"http://127.0.0.1").pathname;
 const file=files.get(path);
 if(!file){res.writeHead(404).end();return;}
 try{res.writeHead(200,{"Content-Type":file.endsWith(".mjs")?"text/javascript; charset=utf-8":"text/html; charset=utf-8","Cache-Control":"no-store"}).end(readFileSync(resolve(root,file)));}
 catch{res.writeHead(500).end();}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const port=server.address().port;
async function runChrome(scenario){
 const url="http://127.0.0.1:"+port+"/?scenario="+scenario;
 const args=["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
 "--no-first-run","--no-default-browser-check","--window-size=390,850","--virtual-time-budget=2500","--dump-dom",url];
 const html=await new Promise((resolveResult,reject)=>{
  const child=spawn(process.env.CHROME_BIN||"google-chrome",args,{stdio:["ignore","pipe","pipe"]});
  let stdout="",stderr="";
  const timeout=setTimeout(()=>{child.kill("SIGKILL");reject(Error("CHROME_TIMEOUT:"+scenario));},30000);
  child.stdout.on("data",chunk=>{stdout+=chunk.toString();if(stdout.length>300000)child.kill("SIGKILL");});
  child.stderr.on("data",chunk=>{stderr+=chunk.toString();if(stderr.length>10000)stderr=stderr.slice(-10000);});
  child.on("error",error=>{clearTimeout(timeout);reject(error);});
  child.on("close",code=>{clearTimeout(timeout);code===0?resolveResult(stdout):reject(Error("CHROME_EXIT_"+code+":"+stderr.slice(-400)));});
 });
 if(!html.includes('data-active-suite="'+scenario+'"'))throw Error("SUITE_NOT_RENDERED:"+scenario);
 if(!html.includes('id="result-a" data-state="CHECKS_PASS"')&&!html.includes('class="result" data-state="CHECKS_PASS" id="result-a"'))throw Error("PASS_NOT_RENDERED:"+scenario);
 if(!html.includes('data-state="NEEDS_REVISION"'))throw Error("NEGATIVE_NOT_RENDERED:"+scenario);
 if(!html.includes("of 4 rules"))throw Error("RESULT_METRICS_MISSING:"+scenario);
 console.log("CHROME_PASS "+scenario+" both candidates rendered");
}
try{
 for(const suite of ["policy-reply","incident-json","agent-handoff"])await runChrome(suite);
}finally{server.close();}
