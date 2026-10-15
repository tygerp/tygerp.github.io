const $ = id => document.getElementById(id);
const {waves, validIP, blockedBy, outcome, packetFor} = Patrol;
let state, selectedPacket, filter='all', lastFrame=0, best=0;
try { best=Number(localStorage.getItem('packetPatrolBest'))||0; } catch {}
const destination = port => ({443:'10.0.0.10',53:'10.0.0.53',22:'10.0.0.22'})[port];
function reset(){
  state={running:false,paused:false,ended:false,time:0,wave:0,spawnTime:0,serial:0,waveSerial:0,rules:[],packets:[],moving:[],score:0,health:100,blocked:0,leaked:0,allowed:0,falseBlocks:0};
  selectedPacket=null;filter='all';$('packet-layer').replaceChildren();$('map-overlay').hidden=false;
  $('start').textContent='Start mission →';$('source').value='';$('port').value='any';$('protocol').value='any';$('rule-error').textContent='';
  document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('selected',b.dataset.filter==='all'));
  renderRules();renderTraffic();updateWave();renderStats();
}
function start(){state.running=true;state.paused=false;$('map-overlay').hidden=true;renderStats();}
function togglePause(){if(!state.running)return;state.paused=!state.paused;renderStats();}
function renderStats(){
  $('health').innerHTML=state.health+'<span>%</span>';$('healthbar').style.width=state.health+'%';$('healthbar').style.background=state.health<35?'var(--red)':'var(--cyan)';
  $('score').textContent=String(state.score).padStart(4,'0');$('blocked').textContent=state.blocked;$('leaked').textContent=state.leaked+' threats got through';
  const total=state.allowed+state.falseBlocks;
  $('delivery').textContent=total?Math.round(state.allowed/total*100)+'%':'—';$('friendly').textContent=total+' legitimate packets processed';$('best').textContent='Personal best: '+best;
  $('timer').textContent=Math.max(0,Math.ceil(45-state.time%45));$('progress').style.width=(state.time%45/45*100)+'%';
  if(state.ended){$('timer').textContent='0';$('progress').style.width='100%';}
  $('pause').disabled=!state.running;$('pause').textContent=state.paused?'Resume mission':'Pause mission';
  $('status').textContent=state.ended?'MISSION COMPLETE':state.running?(state.paused?'SIMULATION PAUSED':'NETWORK LIVE / WAVE 0'+(state.wave+1)):'AWAITING OPERATOR';
}
function updateWave(){const w=waves[state.wave];$('wave-label').textContent='MISSION 0'+(state.wave+1)+' / 03';$('wave-title').textContent=w.title;$('wave-desc').textContent=w.description;$('intel').textContent=w.intel;}
function renderRules(){
  $('rule-count').textContent=state.rules.length+' ACTIVE';$('map-rule-count').textContent=state.rules.length+' ACTIVE RULES';
  $('rules').replaceChildren();
  if(!state.rules.length){$('rules').innerHTML='<div class="empty">◎<h3>No rules deployed</h3><p>All traffic is currently allowed.<br>Inspect a packet to identify its source.</p></div>';return;}
  for(const rule of state.rules){
    const row=document.createElement('div');row.className='rule';
    const body=document.createElement('div'),title=document.createElement('b'),sub=document.createElement('small');
    title.textContent='DENY '+(rule.source||'ANY SOURCE');sub.textContent=(rule.port==='any'?'All ports':':'+rule.port)+' · '+rule.protocol.toUpperCase()+' · '+rule.hits+' hits';body.append(title,sub);
    const remove=document.createElement('button');remove.textContent='×';remove.setAttribute('aria-label','Delete block rule for '+(rule.source||'any source'));remove.onclick=()=>{state.rules=state.rules.filter(r=>r.id!==rule.id);renderRules();};
    row.append(body,remove);$('rules').append(row);
  }
}
$('rule-form').onsubmit=e=>{
  e.preventDefault();const source=$('source').value.trim();const port=$('port').value,protocol=$('protocol').value;
  if(source&&!validIP(source)){$('rule-error').textContent='Enter a valid IPv4 address, or leave source blank.';return;}
  if(!source&&port==='any'&&protocol==='any'){$('rule-error').textContent='Choose at least one condition. Blocking everything disconnects the network.';return;}
  if(state.rules.some(r=>r.source===source&&r.port===port&&r.protocol===protocol)){$('rule-error').textContent='This rule is already active.';return;}
  if(state.rules.length>=8){$('rule-error').textContent='Eight-rule limit reached. Remove an unnecessary rule first.';return;}
  state.rules.push({id:Date.now()+Math.random(),source,port,protocol,hits:0});$('rule-error').textContent='Rule deployed. It applies to packets that have not reached the firewall yet.';renderRules();
};
function spawn(){
  const data=packetFor(state.wave,++state.waveSerial);const p={...data,id:++state.serial,age:0,decided:false,blocked:false,destination:destination(data.port)};
  const el=document.createElementNS('http://www.w3.org/2000/svg','circle');el.setAttribute('r','5');el.setAttribute('fill',data.threat?'#ff7189':'#58e6cf');el.setAttribute('stroke',data.threat?'#ff718944':'#58e6cf44');el.setAttribute('stroke-width','7');$('packet-layer').append(el);p.el=el;state.moving.push(p);
}
function decide(p){
  p.decided=true;const rule=blockedBy(p,state.rules);p.blocked=Boolean(rule);
  if(rule){rule.hits++;renderRules();}
  const result=outcome(p,p.blocked);state.score+=result.score;state.health=Math.max(0,state.health-result.damage);
  if(p.threat){if(p.blocked)state.blocked++;else state.leaked++;}else{if(p.blocked)state.falseBlocks++;else state.allowed++;}
  state.packets.unshift({...p,el:undefined});state.packets=state.packets.slice(0,60);renderTraffic();
  if(state.health<=0)finish();
}
function animatePackets(dt){
  for(const p of state.moving){
    if(!state.running)break;
    p.age+=dt;
    if(p.age>=1.5&&!p.decided)decide(p);
    if(p.blocked){p.el.setAttribute('fill','#f2c66f');p.el.setAttribute('cx','365');p.el.setAttribute('cy','155');p.el.setAttribute('r',String(5+Math.min(12,(p.age-1.5)*25)));p.el.setAttribute('opacity',String(Math.max(0,1-(p.age-1.5)*3)));}
    else {const t=p.age<1.5?p.age/1.5:Math.min(1,(p.age-1.5)/1.2);const from=p.age<1.5?[105,p.threat?225:85]:[365,155];const to=p.age<1.5?[365,155]:[655,{443:65,53:155,22:245}[p.port]];p.el.setAttribute('cx',from[0]+(to[0]-from[0])*t);p.el.setAttribute('cy',from[1]+(to[1]-from[1])*t);}
  }
  state.moving=state.moving.filter(p=>{const keep=p.age<(p.blocked?1.85:2.7);if(!keep)p.el.remove();return keep;});
}
function renderTraffic(){
  const list=state.packets.filter(p=>filter==='all'||(filter==='threat'?p.threat:p.blocked));$('traffic-body').replaceChildren();
  if(!list.length){$('traffic-body').innerHTML='<tr><td colspan="6" class="table-empty">'+(state.running?'Waiting for matching packets…':'Start your mission to capture traffic. Click a packet to inspect it.')+'</td></tr>';return;}
  for(const p of list){const row=document.createElement('tr');
    for(const text of ['#'+String(p.id).padStart(3,'0'),p.source+' → '+p.destination,p.port+' / '+p.protocol]){const td=document.createElement('td');td.textContent=text;row.append(td);}
    const assess=document.createElement('td'),pill=document.createElement('span');pill.className='pill'+(p.threat?' threat':'');pill.textContent=p.threat?'THREAT':'LEGITIMATE';assess.append(pill);row.append(assess);
    const action=document.createElement('td');action.textContent=p.blocked?'⊘ BLOCKED':'↗ ALLOWED';action.className=p.blocked?'yellow':p.threat?'red':'cyan';row.append(action);
    const td=document.createElement('td'),button=document.createElement('button');button.textContent='Inspect ↗';button.setAttribute('aria-label','Inspect packet '+p.id);button.onclick=()=>inspect(p);td.append(button);row.append(td);$('traffic-body').append(row);
  }
}
function inspect(p){
  selectedPacket=p;if(state.running){state.paused=true;renderStats();}
  $('detail-title').textContent='Packet #'+String(p.id).padStart(3,'0');$('detail-body').replaceChildren();const dl=document.createElement('dl');
  for(const [label,value] of Object.entries({Source:p.source,Destination:p.destination,Port:p.port,Protocol:p.protocol,Assessment:p.threat?'Known simulated threat':'Legitimate request',Decision:p.blocked?'Blocked by matching rule':'Allowed — no matching rule'})){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;dl.append(dt,dd);}
  const note=document.createElement('p');note.textContent=p.note;const hint=document.createElement('p');hint.textContent='Simulation paused for inspection. Resume when you are ready.';$('detail-body').append(dl,note,hint);$('detail').showModal();
}
$('use-source').onclick=()=>{if(selectedPacket){$('source').value=selectedPacket.source;$('port').value='any';$('protocol').value='any';$('detail').close();$('source').focus();}};
function finish(){
  if(state.ended)return;state.running=false;state.ended=true;
  const total=state.allowed+state.falseBlocks,rate=total?state.allowed/total:0;const won=state.health>0&&rate>=.7;
  if(state.score>best){best=state.score;try{localStorage.setItem('packetPatrolBest',String(best));}catch{}}
  $('result-title').textContent=won?'Network defended.':state.health<=0?'Network compromised.':'Defense came at a cost.';
  $('result-summary').textContent=won?'You preserved the network while keeping legitimate services available.':state.health<=0?'Too many threats reached your services. Inspect hostile sources and deploy your rules earlier.':'Your firewall blocked too much legitimate traffic. Aim for at least 70% delivery, not just maximum blocking.';
  $('result-stats').textContent='Score: '+state.score+' · Integrity: '+state.health+'% · Delivery: '+Math.round(rate*100)+'%';
  $('result-lesson').textContent='Takeaway: conditions inside a rule use AND, while separate block rules use OR. A precise source + port rule protects shared services better than a broad source-only rule.';renderStats();$('result').showModal();
}
function frame(now){const dt=Math.min((now-lastFrame)/1000||0,.1);lastFrame=now;
  if(state.running&&!state.paused){state.time+=dt;const newWave=Math.min(2,Math.floor(state.time/45));if(newWave!==state.wave){state.wave=newWave;state.waveSerial=0;updateWave();}state.spawnTime+=dt;if(state.spawnTime>=1.05){state.spawnTime-=1.05;spawn();}animatePackets(dt);if(state.time>=135&&state.running)finish();renderStats();}
  requestAnimationFrame(frame);
}
document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('selected',x===b));renderTraffic();});
document.querySelectorAll('.close').forEach(b=>b.onclick=()=>b.closest('dialog').close());
$('help').onclick=()=>{if(state.running){state.paused=true;renderStats();}$('manual').showModal();};
$('start').onclick=start;$('pause').onclick=togglePause;$('restart').onclick=reset;$('again').onclick=()=>{$('result').close();reset();start();};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.running){state.paused=true;renderStats();}});
reset();requestAnimationFrame(frame);
