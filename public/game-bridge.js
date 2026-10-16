(function(){
  const game=window.__LMS_GAME__, saved=window.__LMS_SAVED__||{};
  const prefix=/^(mathquest-|reading-rangers-|rr-previous-|story-star-)/;
  const original=Storage.prototype.setItem;
  for(const [k,v] of Object.entries(saved)){try{original.call(localStorage,k,v);}catch{}}
  let timer, start=performance.now(), losses=0, helped=false;
  function snapshot(){const out={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(prefix.test(k))out[k]=localStorage.getItem(k);}return out;}
  let retry;
  async function sync(event){try{const r=await fetch('/api/legacy',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({game,saved:snapshot(),event})});if(!r.ok)throw Error();document.getElementById('lms-save-status').textContent='☁ Saved to your adventure';}catch{document.getElementById('lms-save-status').textContent='Saved on this iPad · cloud sync will retry';clearTimeout(retry);retry=setTimeout(()=>sync(event),5000);}}
  Storage.prototype.setItem=function(k,v){original.call(this,k,v);if(this===localStorage&&prefix.test(k)){clearTimeout(timer);timer=setTimeout(()=>sync(),400);}};
  window.LMS={begin(){start=performance.now();losses=0;helped=false;},answer(prompt,answer,correct){sync({prompt,answer,correct,elapsedMs:Math.round(performance.now()-start),focusLosses:losses,helped});}};
  document.addEventListener('visibilitychange',()=>{if(document.hidden)losses++;});
  document.addEventListener('click',e=>{if(['help','hint','hear','speak'].includes(e.target.id))helped=true;});
  window.addEventListener('online',()=>sync());
  window.addEventListener('pagehide',()=>{fetch('/api/legacy',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({game,saved:snapshot()}),keepalive:true}).catch(()=>{});});
  document.addEventListener('DOMContentLoaded',()=>{const bar=document.createElement('div');bar.style='position:sticky;top:0;z-index:99;background:#173f3b;color:white;padding:10px 16px;display:flex;justify-content:space-between;font:14px system-ui';const a=document.createElement('a');a.href='/';a.target='_top';a.textContent='← Adventure home';a.style='color:white;min-height:30px;display:grid;place-content:center';const s=document.createElement('span');s.id='lms-save-status';s.textContent='☁ Your LMS game copy';bar.append(a,s);document.body.prepend(bar);});
})();
