import {FIXTURES,MAX_OUTPUT,compareCandidates} from "./src/evaluate.mjs";
const byId=id=>document.getElementById(id);
const buttons=byId("scenarios"),results=byId("results");
const a=byId("output-a"),b=byId("output-b");
let active=FIXTURES[0];
function el(tag,cls,text){
 const node=document.createElement(tag);if(cls)node.className=cls;
 if(text!==undefined)node.textContent=text;return node;
}
function changeCounter(){
 byId("count-a").textContent=[...a.value].length+" / "+MAX_OUTPUT+" code points";
 byId("count-b").textContent=[...b.value].length+" / "+MAX_OUTPUT+" code points";
}
function renderResults(){
 results.replaceChildren();
 try {
  const report=compareCandidates(active.suite,[
   {id:"draft-a",title:active.candidates[0].title,output:a.value},
   {id:"draft-b",title:active.candidates[1].title,output:b.value}
  ]);
  report.results.forEach((item,i)=>{
   const box=el("article","result");box.dataset.state=item.status;box.id=i===0?"result-a":"result-b";
   const top=el("div","result-top"),heading=el("h3","",i===0?"Candidate A":"Candidate B");
   const label=el("span","badge",item.status.replaceAll("_"," "));top.append(heading,label);
   const metrics=el("div","metrics"),score=el("span","score",String(item.percent)+"%");
   score.append(el("small",""," checks passed"));metrics.append(score,el("span","subtext",item.passed+" of "+item.total+" rules"));
   const meter=el("div","meter"),bar=el("span");bar.style.width=item.percent+"%";meter.append(bar);
   const list=el("ul","details");
   for (const rule of item.checks){
    const li=el("li");li.dataset.pass=String(rule.pass);
    li.append(el("strong","",rule.pass?"PASS":"FAIL"),el("span","",rule.id.replaceAll("-"," ")+" — "+rule.detail));
    list.append(li);
   }
   box.append(top,metrics,meter,list);results.append(box);
  });
  document.body.dataset.activeSuite=active.suite.id;
  byId("receipt").textContent=JSON.stringify(report,null,2);
 }catch(error){
  const node=el("p","subtext","Input rejected: "+String(error.message).slice(0,90));
  results.append(node);byId("receipt").textContent="Invalid local input";
 }
 changeCounter();
}
function selectScenario(suiteId){
 const found=FIXTURES.find(c=>c.suite.id===suiteId);
 if(!found)return;
 active=found;
 for(const button of buttons.querySelectorAll("button"))button.setAttribute("aria-pressed",String(button.dataset.suite===suiteId));
 byId("case-title").textContent=found.suite.title;
 byId("case-description").textContent=found.suite.description;
 const allowed=byId("evidence");allowed.replaceChildren();
 allowed.append(el("strong","subtext","Allowed sample evidence:"));
 allowed.append(...(found.suite.allowedEvidence.length?
  found.suite.allowedEvidence.map(x=>el("span","",x)):[el("span","","none")]));
 byId("label-a").textContent="Candidate A · "+found.candidates[0].title;
 byId("label-b").textContent="Candidate B · "+found.candidates[1].title;
 a.value=found.candidates[0].output;b.value=found.candidates[1].output;
 renderResults();
}
for(const fixture of FIXTURES){
 const button=el("button","tab",fixture.suite.title);
 button.type="button";button.dataset.suite=fixture.suite.id;button.setAttribute("aria-pressed","false");
 button.addEventListener("click",()=>selectScenario(fixture.suite.id));
 buttons.append(button);
}
byId("evaluate").addEventListener("click",renderResults);
byId("reset").addEventListener("click",()=>selectScenario(active.suite.id));
a.addEventListener("input",changeCounter);b.addEventListener("input",changeCounter);
const id=new URLSearchParams(location.search).get("scenario");
selectScenario(FIXTURES.some(x=>x.suite.id===id)?id:FIXTURES[0].suite.id);
