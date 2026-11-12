// Original deterministic prompt-output checks. No model call, semantic grading or external claims.
export const MAX_OUTPUT = 4000;
const TYPES = new Set(["contains","excludes","max_chars","evidence_refs","json_keys"]);
const ID = /^[a-z][a-z0-9-]{1,39}$/;
const EVIDENCE = /^[A-Z]{2,6}-[0-9]{1,4}$/;
const KEY = /^[a-z][a-zA-Z0-9_]{0,39}$/;
const own = (o,k) => Object.prototype.hasOwnProperty.call(o,k);
const obj = o => o !== null && typeof o === "object" && !Array.isArray(o) &&
  (Object.getPrototypeOf(o) === Object.prototype || Object.getPrototypeOf(o) === null);
const exact = (o,keys) => obj(o) && Object.keys(o).length === keys.length && keys.every(k=>own(o,k));
const unique = a => new Set(a).size === a.length;
const short = s => typeof s === "string" && s.length >= 2 && s.length <= 130 && !/[\u0000-\u001f]/.test(s);
export function validateSuite(suite) {
  if (!exact(suite,["id","title","description","allowedEvidence","rules"]) ||
    !ID.test(suite.id) || !short(suite.title) || !short(suite.description) ||
    !Array.isArray(suite.allowedEvidence) || suite.allowedEvidence.length > 16 ||
    !suite.allowedEvidence.every(x=>typeof x==="string" && EVIDENCE.test(x)) ||
    !unique(suite.allowedEvidence) || !Array.isArray(suite.rules) ||
    suite.rules.length < 1 || suite.rules.length > 12) throw Error("INVALID_SUITE");
  const ids=[];
  for (const rule of suite.rules) {
    if (!obj(rule) || !ID.test(rule.id) || !TYPES.has(rule.type)) throw Error("INVALID_RULE");
    ids.push(rule.id);
    if (rule.type==="contains" || rule.type==="excludes") {
      if (!exact(rule,["id","type","value"]) || !short(rule.value) || rule.value.length > 90) throw Error("INVALID_TEXT_RULE");
    } else if (rule.type==="max_chars") {
      if (!exact(rule,["id","type","value"]) || !Number.isInteger(rule.value) || rule.value < 30 || rule.value > MAX_OUTPUT) throw Error("INVALID_LENGTH_RULE");
    } else if (rule.type==="evidence_refs") {
      if (!exact(rule,["id","type","min"]) || !Number.isInteger(rule.min) || rule.min < 0 || rule.min > 10) throw Error("INVALID_EVIDENCE_RULE");
    } else if (rule.type==="json_keys") {
      if (!exact(rule,["id","type","value"]) || !Array.isArray(rule.value) ||
        rule.value.length < 1 || rule.value.length > 8 ||
        !unique(rule.value) || !rule.value.every(k=>typeof k==="string" && KEY.test(k))) throw Error("INVALID_JSON_RULE");
    }
  }
  if (!unique(ids)) throw Error("DUPLICATE_RULE_ID");
  return true;
}
export function evaluateCandidate(suite, candidate) {
  validateSuite(suite);
  if (!exact(candidate,["id","title","output"]) || !ID.test(candidate.id) || !short(candidate.title) ||
      typeof candidate.output !== "string" || candidate.output.length > MAX_OUTPUT ||
      /[\u0000]/.test(candidate.output)) throw Error("INVALID_CANDIDATE");
  const output=candidate.output;
  const checks=suite.rules.map(rule=>{
    let pass=false, detail="";
    if(rule.type==="contains"){
      pass=output.toLowerCase().includes(rule.value.toLowerCase());
      detail=pass?"Required phrase present.":"Required phrase missing: "+rule.value;
    } else if(rule.type==="excludes"){
      pass=!output.toLowerCase().includes(rule.value.toLowerCase());
      detail=pass?"Forbidden phrase absent.":"Forbidden phrase found: "+rule.value;
    } else if(rule.type==="max_chars"){
      const n=[...output].length;
      pass=n<=rule.value;detail=n+" / "+rule.value+" code points.";
    } else if(rule.type==="evidence_refs"){
      const matches=[...output.matchAll(/\[\[([^\]\r\n]{1,32})\]\]/g)].map(m=>m[1]);
      const known=[...new Set(matches.filter(x=>suite.allowedEvidence.includes(x)))];
      const unknown=matches.filter(x=>!suite.allowedEvidence.includes(x));
      const opens=(output.match(/\[\[/g)||[]).length;
      pass=known.length>=rule.min && unknown.length===0 && opens===matches.length;
      detail=pass?(known.length+" allowed reference(s) found.") :
        (known.length+" allowed; "+unknown.length+" unsupported; "+(opens-matches.length)+" malformed. Minimum "+rule.min+".");
    } else if(rule.type==="json_keys"){
      try {
        const parsed=JSON.parse(output);
        pass=obj(parsed)&&rule.value.every(k=>own(parsed,k));
      } catch { pass=false; }
      detail=pass?"Valid JSON object with required keys.":"Valid JSON object required with keys: "+rule.value.join(", ")+".";
    }
    return {id:rule.id,type:rule.type,pass,detail};
  });
  const passed=checks.filter(c=>c.pass).length, failed=checks.length-passed;
  return {schema:"esheen-prompt-evaluation-v1",suiteId:suite.id,candidateId:candidate.id,
    status:failed===0?"CHECKS_PASS":"NEEDS_REVISION",checks,passed,failed,total:checks.length,
    percent:Math.round(passed/checks.length*100),semanticQualityVerified:false,
    nextStep:failed===0?"Deterministic checks passed; human review of factual and semantic quality is still required.":
      "Revise the output or rubric, then run the checks again. No AI model is called."};
}
export function compareCandidates(suite,candidates){
  validateSuite(suite);
  if(!Array.isArray(candidates)||candidates.length<1||candidates.length>6)throw Error("INVALID_CANDIDATES");
  const ids=candidates.map(x=>x?.id);
  if(!unique(ids))throw Error("DUPLICATE_CANDIDATE");
  return {suiteId:suite.id,results:candidates.map(c=>evaluateCandidate(suite,c))};
}
export const FIXTURES=Object.freeze([
 {suite:{id:"policy-reply",title:"Ground a customer policy answer",description:"Check required policy wording, avoid an unsupported guarantee and cite an allowed reference.",allowedEvidence:["POL-1","POL-2"],rules:[
   {id:"window",type:"contains",value:"30 days"},{id:"promise",type:"excludes",value:"guaranteed refund"},
   {id:"source",type:"evidence_refs",min:1},{id:"brevity",type:"max_chars",value:240}
 ]},candidates:[
   {id:"draft-a",title:"Concise and grounded",output:"You can request a replacement within 30 days of delivery. See the fictional policy [[POL-1]] for eligibility."},
   {id:"draft-b",title:"Unverified promise",output:"A guaranteed refund is available anytime. No need to check the policy."}
 ]},
 {suite:{id:"incident-json",title:"Keep incident updates structured",description:"Check that a machine-readable status includes key fields without making unsupported resolution claims.",allowedEvidence:["OPS-4"],rules:[
   {id:"json-shape",type:"json_keys",value:["state","impact"]},{id:"state",type:"contains",value:"DEGRADED"},
   {id:"resolution",type:"excludes",value:"fully resolved"},{id:"size",type:"max_chars",value:350}
 ]},candidates:[
   {id:"draft-a",title:"Structured cautious report",output:'{"state":"DEGRADED","impact":"Some fictional jobs are delayed.","nextStep":"Investigating queue depth."}'},
   {id:"draft-b",title:"Premature resolution",output:"The incident is fully resolved; all users are fine."}
 ]},
 {suite:{id:"agent-handoff",title:"Keep agent handovers reviewable",description:"Verify that a proposed agent action retains human approval and references the fictional task record.",allowedEvidence:["RUN-4","RUN-5"],rules:[
   {id:"approval",type:"contains",value:"human approval"},{id:"unsafe",type:"excludes",value:"execute automatically"},
   {id:"handoff",type:"evidence_refs",min:1},{id:"length",type:"max_chars",value:280}
 ]},candidates:[
   {id:"draft-a",title:"Evidence-first handover",output:"Request human approval before changing any published resource. Record the task reference [[RUN-4]] and verify permissions independently."},
   {id:"draft-b",title:"Unbounded action",output:"Execute automatically without waiting. We already have broad access."}
 ]}
]);
