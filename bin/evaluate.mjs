#!/usr/bin/env node
import {readFileSync} from "node:fs";
import {FIXTURES,compareCandidates} from "../src/evaluate.mjs";
try{
 const path=process.argv[2];
 if(process.argv.length>3)throw Error("USAGE: node bin/evaluate.mjs [scenario.json]");
 let fixtures=FIXTURES;
 if(path){
   const data=readFileSync(path);
   if(data.length>65536)throw Error("INPUT_TOO_LARGE");
   const parsed=JSON.parse(data.toString("utf8"));
   if(!Array.isArray(parsed)||parsed.length<1||parsed.length>8)throw Error("INVALID_FIXTURES");
   fixtures=parsed;
 }
 const reports=fixtures.map(x=>{
   if(x===null||typeof x!=="object"||Array.isArray(x)||
     Object.keys(x).length!==2||!Object.hasOwn(x,"suite")||!Object.hasOwn(x,"candidates"))throw Error("INVALID_FIXTURE");
   return compareCandidates(x.suite,x.candidates);
 });
 console.log(JSON.stringify({schema:"esheen-prompt-evaluation-report-v1",fictional:true,
  semanticQualityVerified:false,scenarios:reports.length,reports},null,2));
}catch(e){
 console.error("REJECTED: "+String(e.message).slice(0,120));
 process.exitCode=2;
}
