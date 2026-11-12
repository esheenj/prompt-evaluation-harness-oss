import test from "node:test";
import assert from "node:assert/strict";
import {FIXTURES,MAX_OUTPUT,evaluateCandidate,compareCandidates,validateSuite} from "../src/evaluate.mjs";
const first=FIXTURES[0];
test("all three example suites have passing A and failing B",()=>{
 for(const fixture of FIXTURES){
  const result=compareCandidates(fixture.suite,fixture.candidates);
  assert.equal(result.results[0].status,"CHECKS_PASS");
  assert.equal(result.results[1].status,"NEEDS_REVISION");
  assert.equal(result.results[0].semanticQualityVerified,false);
 }
});
test("score counts deterministic checks, not semantic truth",()=>{
 const r=evaluateCandidate(first.suite,first.candidates[0]);
 assert.equal(r.passed,4);assert.equal(r.failed,0);assert.equal(r.percent,100);
});
test("unsupported citations fail even if one source is valid",()=>{
 const c={id:"invalid-ref",title:"Unsupported source included",output:"Replace within 30 days [[POL-1]] [[UNTRUSTED-99]]."};
 const r=evaluateCandidate(first.suite,c);
 assert.equal(r.status,"NEEDS_REVISION");
 assert.equal(r.checks.find(c=>c.type==="evidence_refs").pass,false);
});
test("malformed reference tokens fail closed",()=>{
 const c={...first.candidates[0],output:"Request in 30 days [[POL-1"};
 assert.equal(evaluateCandidate(first.suite,c).checks.find(x=>x.type==="evidence_refs").pass,false);
});
test("a caller cannot bypass the forbidden statement with uppercase text",()=>{
 const c={...first.candidates[0],output:"30 DAYS are eligible for a GUARANTEED REFUND [[POL-1]]"};
 assert.equal(evaluateCandidate(first.suite,c).checks.find(x=>x.type==="excludes").pass,false);
});
test("valid JSON must be a top-level object",()=>{
 const suite=FIXTURES[1].suite;
 assert.equal(evaluateCandidate(suite,{id:"test1",title:"An array instead of an object",output:'["DEGRADED"]'}).checks[0].pass,false);
 assert.equal(evaluateCandidate(suite,{id:"test2",title:"Malformed JSON",output:'{"state":'}).checks[0].pass,false);
});
test("a case with a missing JSON key fails",()=>{
 const r=evaluateCandidate(FIXTURES[1].suite,{id:"incomplete",title:"Missing impact field",output:'{"state":"DEGRADED"}'});
 assert.equal(r.checks[0].pass,false);
});
test("too-large output is rejected before scoring",()=>{
 assert.throws(()=>evaluateCandidate(first.suite,{...first.candidates[0],output:"x".repeat(MAX_OUTPUT+1)}),/INVALID_CANDIDATE/);
});
test("unknown rule types cannot be supplied by users",()=>{
 assert.throws(()=>validateSuite({...first.suite,rules:[{id:"unsafe",type:"eval_js",value:"true"}]}),/INVALID_RULE/);
});
test("unknown registry source ID is rejected at schema validation",()=>{
 assert.throws(()=>validateSuite({...first.suite,allowedEvidence:["PRIVATE_KEY"]}),/INVALID_SUITE/);
});
test("duplicate rule IDs are forbidden",()=>{
 const rules=[first.suite.rules[0],first.suite.rules[0]];
 assert.throws(()=>validateSuite({...first.suite,rules}),/DUPLICATE_RULE_ID/);
});
test("duplicate candidate IDs cannot be compared",()=>{
 assert.throws(()=>compareCandidates(first.suite,[first.candidates[0],first.candidates[0]]),/DUPLICATE_CANDIDATE/);
});
test("candidate count must be bounded",()=>{
 assert.throws(()=>compareCandidates(first.suite,[]),/INVALID_CANDIDATES/);
});
test("non-plain JSON object / inherited properties are rejected",()=>{
 const inherited=Object.assign(Object.create({x:1}),first.suite);
 assert.throws(()=>validateSuite(inherited),/INVALID_SUITE/);
});
test("disallow additional object properties",()=>{
 const unexpected={...first.suite,rules:[{...first.suite.rules[0],extra:true}]};
 assert.throws(()=>validateSuite(unexpected),/INVALID_TEXT_RULE/);
});
test("zero required evidence is acceptable, unknown evidence is not",()=>{
 const suite={...first.suite,rules:[{id:"references",type:"evidence_refs",min:0}]};
 const c={id:"no-refs",title:"No source referenced",output:"No reference"};
 assert.equal(evaluateCandidate(suite,c).status,"CHECKS_PASS");
 assert.equal(evaluateCandidate(suite,{...c,output:"[[FAKE-1]]"}).status,"NEEDS_REVISION");
});
test("control-character injection rejected in labels",()=>{
 assert.throws(()=>validateSuite({...first.suite,title:"Bad\nLabel"}),/INVALID_SUITE/);
});
