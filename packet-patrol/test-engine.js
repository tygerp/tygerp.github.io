const assert=require('node:assert/strict');
const {validIP,matches,blockedBy,outcome,packetFor}=require('./engine.js');
assert.equal(validIP('203.0.113.66'),true);
for(const bad of ['999.1.1.1','hello','1.2.3','1.2.3.4<script>','-1.2.3.4'])assert.equal(validIP(bad),false);
const narrow={source:'192.0.2.88',port:'22',protocol:'TCP'};
const attack=packetFor(2,3,()=>0),dns=packetFor(2,1,()=>0);
assert.equal(matches(attack,narrow),true);assert.equal(matches(dns,narrow),false);
assert.equal(matches(dns,{...narrow,port:'any',protocol:'any'}),true);
assert.equal(blockedBy(attack,[{source:'203.0.113.66',port:'any',protocol:'any'},narrow]),narrow);
assert.deepEqual(outcome(attack,true),{score:20,damage:0});assert.deepEqual(outcome(attack,false),{score:-30,damage:6});
assert.deepEqual(outcome(dns,true),{score:-25,damage:0});assert.deepEqual(outcome(dns,false),{score:5,damage:0});
// A precise three-rule strategy must block all threats without blocking legitimate traffic.
const rules=[{source:'203.0.113.66',port:'any',protocol:'any'},{source:'198.51.100.99',port:'443',protocol:'TCP'},narrow];
for(let wave=0;wave<3;wave++)for(let i=1;i<=42;i++)for(const r of [0,.5,.99]){const p=packetFor(wave,i,()=>r);assert.equal(Boolean(blockedBy(p,rules)),p.threat);}
console.log('PASS: IPv4 validation, AND/OR rules, scoring, shared-gateway false positives, and all 3 waves (378 generated cases).');
