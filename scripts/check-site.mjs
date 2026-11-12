import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const app=readFileSync(new URL("../app.mjs",import.meta.url),"utf8");
test("offline CSP and local import only",()=>{
 assert.match(html,/connect-src 'none'/);assert.match(html,/script-src 'self'/);
 assert.match(html,/src="\.\/app\.mjs"/);assert.match(app,/\.\/src\/evaluate\.mjs/);
 assert.doesNotMatch(html,/<iframe|<img|<script[^>]+https?:/i);
 assert.doesNotMatch(app,/\bfetch\s*\(|XMLHttpRequest|localStorage|innerHTML|\beval\s*\(/);
});
test("usable accessible controls and responsive layout",()=>{
 for(const id of ["output-a","output-b","scenarios","results","evaluate","reset","receipt"]){
  assert.match(html,new RegExp('id="'+id+'"'));
 }
 assert.match(html,/role="status"|aria-live="polite"/);
 assert.match(html,/prefers-reduced-motion/);
 assert.match(html,/max-width:840px/);
 assert.match(app,/\.textContent/);
});
test("marketing claims do not overstate evaluation",()=>{
 assert.match(html,/rule coverage, not proof of accuracy/i);
 assert.match(html,/No private data, client work/i);
 assert.doesNotMatch(html,/independent fact checking|WCAG certified|proven model accuracy/i);
});
