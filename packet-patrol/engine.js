/* Pure simulation logic, shared by the browser and the Node test runner. */
(function(root){
  const waves = [
    {title:'The obvious intruder',description:'One hostile source is scanning your services. Block its address without interrupting real users.',intel:'Threat intel: 203.0.113.66 is probing several ports. A source-only rule stops it without blocking an entire service.'},
    {title:'The encrypted flood',description:'A second attacker is flooding HTTPS. Keep web access available while shutting out the new sender.',intel:'New hostile source: 198.51.100.99. Both customers and attackers use TCP port 443. Blocking all HTTPS is not a precise defense.'},
    {title:'The protocol puzzle',description:'A shared gateway carries both legitimate DNS and hostile traffic. Source-only blocking now has a cost.',intel:'Shared gateway 192.0.2.88 carries legitimate UDP/53 DNS and hostile TCP/22 traffic. Combine source AND port to isolate the attack.'}
  ];
  function validIP(ip){return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip)&&ip.split('.').every(n=>Number(n)<=255);}
  function matches(packet,rule){return (!rule.source||packet.source===rule.source)&&(rule.port==='any'||packet.port===Number(rule.port))&&(rule.protocol==='any'||packet.protocol===rule.protocol);}
  function blockedBy(packet,rules){return rules.find(rule=>matches(packet,rule));}
  function outcome(packet,blocked){return packet.threat?(blocked?{score:20,damage:0}:{score:-30,damage:6}):(blocked?{score:-25,damage:0}:{score:5,damage:0});}
  function packetFor(wave,index,random=Math.random){
    const threat=index%3===0;
    if(threat){
      if(wave===0)return {source:'203.0.113.66',port:[22,443,53][Math.floor(random()*3)],protocol:'TCP',threat:true,note:'Repeated unsolicited probes from a known hostile source. Block this source rather than every service it touches.'};
      if(wave===1)return {source:'198.51.100.99',port:443,protocol:'TCP',threat:true,note:'This source is sending a simulated request flood. HTTPS alone does not make a sender trustworthy.'};
      return {source:'192.0.2.88',port:22,protocol:'TCP',threat:true,note:'Unauthorized SSH attempts from a gateway that also forwards legitimate DNS. Combine source and destination port.'};
    }
    if(wave===2&&index%3===1)return {source:'192.0.2.88',port:53,protocol:'UDP',threat:false,note:'An approved DNS query through a shared gateway. A rule blocking the whole source would block this legitimate request too.'};
    const service=[{port:443,protocol:'TCP',note:'A customer requesting a secure web page.'},{port:53,protocol:'UDP',note:'An approved DNS lookup that translates a hostname to an address.'},{port:22,protocol:'TCP',note:'An authorized administrator opening a remote SSH session.'}][Math.floor(random()*3)];
    return {source:['192.0.2.10','192.0.2.24','198.51.100.12'][Math.floor(random()*3)],...service,threat:false};
  }
  const api={waves,validIP,matches,blockedBy,outcome,packetFor};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Patrol=api;
})(typeof globalThis!=='undefined'?globalThis:this);
