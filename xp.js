// ============ EMPREENDEXP - Window Manager + Easter eggs ============
let zTop = 10;
const windows = {};
let msnShown = false;

function $(s){ return document.querySelector(s); }
function $all(s){ return document.querySelectorAll(s); }

// --- Sons: tenta assets/ reais, cai pra beep WebAudio se não existir ---
let AC = null;
function beep(freq, dur, type='square', vol=.06){
  try{
    AC = AC || new (window.AudioContext||window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g); g.connect(AC.destination);
    o.start(); g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + dur);
    o.stop(AC.currentTime + dur);
  }catch(e){}
}
function beepStartup(){ beep(523,.12); setTimeout(()=>beep(659,.12),130); setTimeout(()=>beep(784,.22),260); }
function beepError(){ beep(220,.25,'square',.09); setTimeout(()=>beep(160,.35,'square',.09),120); }
function assetOrBeep(file, fallback){
  try{
    const a = new Audio('assets/' + file);
    a.volume = .6;
    const p = a.play();
    if(p && p.catch) p.catch(()=>fallback());
    a.onerror = ()=>fallback();
  }catch(e){ fallback(); }
}
function sndStartup(){ assetOrBeep('startup.mp3', beepStartup); }
function sndError(){ assetOrBeep('error.wav', beepError); }
function sndClick(){ assetOrBeep('click.mp3', ()=>beep(880,.05,'square',.03)); }
function sndPop(){ assetOrBeep('pop.wav', ()=>beep(1200,.08,'sine',.07)); }

// --- Boot ---
const bootBar = $('#bootBar');
for(let i=0;i<18;i++){ const b=document.createElement('i'); bootBar.appendChild(b); }
let bi=0;
const bootTimer = setInterval(()=>{ const bars=bootBar.children; if(bars[bi]) bars[bi].classList.add('on'); bi=(bi+1)%bars.length; if(bi===0) bars && [...bars].forEach(x=>x.classList.remove('on')); },120);
function boot(){
  clearInterval(bootTimer);
  $('#boot').style.display='none';
  sndStartup();
  clippySay("Olá! Eu sou o <b>Clippy</b>! 📎<br>Dê duplo-clique nos ícones para abrir cada tema do portfólio. Comece pelo <b>Meu Computador</b>!");
  setTimeout(showMSN, 7000);
  // abre boas-vindas
  setTimeout(()=>openWin('win-bemvindo'), 600);
}
$('#boot').addEventListener('click', boot);
document.addEventListener('keydown', function h(e){ if($('#boot').style.display!=='none'){ boot(); document.removeEventListener('keydown',h);} });

// --- Janelas ---
function registerWins(){
  $all('.window').forEach(w=>{
    windows[w.id]=w;
    // posição inicial em cascata
    const n = Object.keys(windows).length;
    if(!w.dataset.placed){
      w.style.left = (20 + (n*28)%220)+'px';
      w.style.top = (14 + (n*24)%140)+'px';
      w.dataset.placed="1";
    }
    // drag
    const bar = w.querySelector('.titlebar');
    bar.addEventListener('mousedown', e=>{
      if(e.target.classList.contains('t-btn')) return;
      focusWin(w.id);
      const sx=e.clientX-w.offsetLeft, sy=e.clientY-w.offsetTop;
      if(w.classList.contains('maximized')) return;
      function mv(ev){ w.style.left=(ev.clientX-sx)+'px'; w.style.top=Math.max(0,ev.clientY-sy)+'px'; }
      function up(){ document.removeEventListener('mousemove',mv); document.removeEventListener('mouseup',up); }
      document.addEventListener('mousemove',mv); document.addEventListener('mouseup',up);
    });
    // touch drag
    bar.addEventListener('touchstart', e=>{
      focusWin(w.id);
      const t=e.touches[0]; const sx=t.clientX-w.offsetLeft, sy=t.clientY-w.offsetTop;
      function mv(ev){ const tt=ev.touches[0]; w.style.left=(tt.clientX-sx)+'px'; w.style.top=Math.max(0,tt.clientY-sy)+'px'; }
      function up(){ document.removeEventListener('touchmove',mv); document.removeEventListener('touchend',up); }
      document.addEventListener('touchmove',mv); document.addEventListener('touchend',up);
    }, {passive:true});
  });
}
function openWin(id){
  const w = document.getElementById(id); if(!w) return;
  w.classList.add('open'); w.classList.remove('minimized');
  focusWin(id); sndClick(); refreshTasks();
  const titles = {
    'win-bill':'Bill Gates, né? Boa escolha! 💻',
    'win-social':'Empreendedorismo Social é sobre lucro com propósito! 🤝',
    'win-startups':'HandTalk: tiramos o chapéu! 🎩',
    'win-az':'5 conceitos pra gabaritar a P1! 📝',
    'win-cinema':'Que filme, hein? Turing era brabo. 🎬',
    'win-eu':'Esse é o admin do sistema! 👤',
    'win-ajuda':'Precisou, chamou! 📎'
  };
  if(titles[id] && Math.random()<.8) clippySay(titles[id]);
}
function closeWin(id){ document.getElementById(id).classList.remove('open'); sndClick(); refreshTasks(); }
function minWin(id){ document.getElementById(id).classList.add('minimized'); refreshTasks(); sndClick(); }
function maxWin(id){ document.getElementById(id).classList.toggle('maximized'); focusWin(id); }
function focusWin(id){
  zTop++;
  const w=document.getElementById(id);
  w.style.zIndex=zTop;
  $all('.window').forEach(x=>x.classList.remove('focused'));
  w.classList.add('focused');
  refreshTasks();
}
function refreshTasks(){
  const bar=$('#taskBtns'); bar.innerHTML='';
  $all('.window.open').forEach(w=>{
    const t=w.querySelector('.t-title').textContent;
    const ico=w.querySelector('.t-ico').innerHTML;
    const b=document.createElement('div');
    b.className='taskbtn'+(w.classList.contains('focused')&&!w.classList.contains('minimized')?' active':'');
    b.innerHTML='<span class="tb-ico">'+ico+'</span><span style="overflow:hidden;text-overflow:ellipsis">'+t+'</span>';
    b.onclick=()=>{
      if(w.classList.contains('minimized')){ w.classList.remove('minimized'); focusWin(w.id); }
      else if(w.classList.contains('focused')) minWin(w.id);
      else focusWin(w.id);
      refreshTasks();
    };
    bar.appendChild(b);
  });
}

// --- Ícones ---
$all('.dicon').forEach(d=>{
  d.addEventListener('dblclick', ()=>openWin(d.dataset.win));
  d.addEventListener('click', ()=>{
    $all('.dicon').forEach(x=>x.classList.remove('selected'));
    d.classList.add('selected');
    if(window.innerWidth<640) openWin(d.dataset.win);
  });
  // lixeira easter egg: 3 cliques = BSOD
  if(d.dataset.win==='win-lixeira'){
    let c=0;
    d.addEventListener('click', ()=>{ c++; if(c>=4){ c=0; showBSOD(); } setTimeout(()=>c=0,1500); });
  }
});

// --- Start menu ---
$('#startBtn').onclick=(e)=>{ e.stopPropagation(); $('#startmenu').classList.toggle('open'); sndClick(); };
document.addEventListener('click', e=>{ if(!e.target.closest('#startmenu')&&!e.target.closest('#startBtn')) $('#startmenu').classList.remove('open'); });
$all('#startmenu .sm-item').forEach(i=>i.addEventListener('click', ()=>{ $('#startmenu').classList.remove('open'); openWin(i.dataset.win); }));

// --- Relógio ---
function clock(){
  const d=new Date();
  const h=String(d.getHours()).padStart(2,'0'), m=String(d.getMinutes()).padStart(2,'0');
  $('#clock').textContent=h+':'+m;
}
setInterval(clock,10000); clock();

// --- Clippy ---
const tips=[
  "Dica: use o <b>Menu Iniciar</b> pra navegar rapidinho! 🖱️",
  "Você sabia? A <b>HandTalk</b> já traduziu bilhões de palavras em Libras! 🤟",
  "Psst... clica 4x na <b>Lixeira</b>. Não me culpe depois. 😈",
  "Bill Gates largou Harvard pra fundar a Microsoft. Coragem, né? 💻",
  "MVP = faça o mínimo, teste rápido, aprenda mais rápido ainda!",
  "Não esquece de citar as fontes. Plágio dá tela azul na nota! 💀"
];
let tipI=0;
function clippySay(html){
  const b=$('#clippyBubble'); b.innerHTML=html+'<div class="x" onclick="document.getElementById(\'clippy\').style.display=\'none\'">x</div>';
  $('#clippy').style.display='flex';
}
function clippyLoop(){ clippySay(tips[tipI % tips.length]); tipI++; }
setInterval(()=>{ if($('#boot').style.display==='none' && Math.random()<.6) clippyLoop(); }, 25000);
$('#clippyChar').onclick=()=>{ sndPop(); clippyLoop(); };

// --- MSN ---
function showMSN(){
  if(msnShown) return; msnShown=true;
  $('#msn').classList.add('show'); sndPop();
  setTimeout(()=>$('#msn').classList.remove('show'), 12000);
}
function closeMSN(){ $('#msn').classList.remove('show'); }

// --- Diálogo genérico (erro, info, alerta, pergunta, sucesso) ---
const dlgIcons = { critical:'icon-critical.png', info:'icon-info.png', alert:'icon-alert.png', question:'icon-question.png', success:'icon-success.png' };
function showError(msg, icon){
  $('#errorMsg').textContent = msg || "EmpreendeXP encontrou criatividade em excesso e precisa compartilhar.";
  const key = dlgIcons[icon] ? icon : 'critical';
  const ico = $('#errorIco');
  if(ico){ ico.src = 'assets/' + dlgIcons[key]; ico.alt = key; }
  const d=$('#errorDlg');
  d.style.left=(80+Math.random()*200)+'px'; d.style.top=(60+Math.random()*160)+'px';
  d.style.zIndex=++zTop;
  d.classList.add('show'); sndError();
}
function closeError(){ $('#errorDlg').classList.remove('show'); sndClick(); }

// --- BSOD ---
function showBSOD(){ $('#bsod').classList.add('show'); sndError(); }
function hideBSOD(){
  $('#bsod').classList.remove('show'); sndStartup();
  setTimeout(()=>showError('Sistema reiniciado com sucesso! Nenhum arquivo foi perdido.','success'), 500);
}
function shutdown(){ showBSOD(); }

registerWins();
refreshTasks();
