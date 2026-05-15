const firebaseConfig = {
  apiKey: "AIzaSyBsEIuxWJH0Gd3efmmIMtnWSwK-0YCI0cI",
  authDomain: "majcher-dashboard.firebaseapp.com",
  databaseURL: "https://majcher-dashboard-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "majcher-dashboard",
  storageBucket: "majcher-dashboard.firebasestorage.app",
  messagingSenderId: "578624736194",
  appId: "1:578624736194:web:474242a81d6809f344645b"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const MONTHS_DEF=[
  {id:'maj',label:'Maj',tags:['Budowa fundamentów','Brak publikacji'],tagc:['tg','ta'],sections:[
    {id:'system',label:'System',ico:'&#9881;',bg:'#E1F5EE',tasks:['Założyć konto Notion i dashboard','Stworzyć folder "Firma 2026" w Google Drive','Skonfigurować kolekcje w IG i TikTok']},
    {id:'rynek',label:'Rynek',ico:'&#128269;',bg:'#FAEEDA',tasks:['Znaleźć i zapisać 20 firm meblowych (IG/TikTok/Allegro)','Spisać ceny 20 produktów konkurencji','Zapisać 30 inspiracji produktowych']},
    {id:'content',label:'Content (obserwacja)',ico:'&#128247;',bg:'#EEEDFE',tasks:['Zapisać 30 rolek inspiracyjnych do kolekcji','Wypisać 20 pomysłów na własny content','Znaleźć 10 dobrych hooków które działają']},
    {id:'sprzedaz',label:'Sprzedaż',ico:'&#128176;',bg:'#FAECE7',tasks:['Obejrzeć 10 materiałów o sprzedaży (YouTube/podcast)','Wypisać 15 technik sprzedażowych które zapamiętałem']},
    {id:'finanse',label:'Finanse',ico:'&#128179;',bg:'#E6F1FB',tasks:['Rozpisać miesięczne koszty (co, ile)','Zejść poniżej 3 600 zł wydatków','Odłożyć choć symboliczną kwotę']},
    {id:'zdrowie',label:'Zdrowie i psychika',ico:'&#128170;',bg:'#EAF3DE',tasks:['20 treningów w maju','Codziennie 60 min nad przyszłością','Max 1h bezmyślnego scrollowania dziennie','Regularny sen — kłaść się o stałej porze']}
  ]},
  {id:'czerwiec',label:'Czerwiec',tags:['Pierwszy produkt','Start contentu'],tagc:['tg','tp'],sections:[
    {id:'c-biznes',label:'Biznes',ico:'&#128296;',bg:'#E1F5EE',tasks:['Zrobić pierwszy produkt (choćby prosty)','Wrzucić pierwsze zdjęcia/rolki z procesu','Założyć profil na IG pod markę','Zebrać pierwsze portfolio (3+ zdjęcia)']},
    {id:'c-trener',label:'Trener',ico:'&#127947;',bg:'#FAEEDA',tasks:['Zdobyć pierwszych 3 klientów','Ustalić cennik i pakiety','Zacząć budować sieć na siłowni']},
    {id:'c-content',label:'Content',ico:'&#127909;',bg:'#EEEDFE',tasks:['Wrzucić minimum 12 postów/rolek','Przetestować 3 różne style contentu','Zapisać co działa, co nie działa']}
  ]},
  {id:'lipiec',label:'Lipiec',tags:['Trener na etat','Meble równolegle'],tagc:['tg','ta'],sections:[
    {id:'l-trener',label:'Trener',ico:'&#127947;',bg:'#FAEEDA',tasks:['Przejść na trenerstwo jako główne źródło dochodu','Cel: min 2 000 zł z treningów','Utrzymać regularność klientów']},
    {id:'l-biznes',label:'Biznes',ico:'&#128296;',bg:'#E1F5EE',tasks:['2–3 gotowe produkty w portfolio','Pierwsze zapytania od klientów','Sprawdzić wymagania PUP do dotacji']}
  ]},
  {id:'sierpien',label:'Sierpień',tags:['Dotacje','Pierwsze zlecenie'],tagc:['tp','tg'],sections:[
    {id:'s-dotacje',label:'Dotacje',ico:'&#128196;',bg:'#E6F1FB',tasks:['Umówić się do PUP Częstochowa','Przygotować opis biznesu','Sprawdzić ARR Częstochowa','Zebrać dokumenty do wniosku']},
    {id:'s-biznes',label:'Biznes',ico:'&#128296;',bg:'#E1F5EE',tasks:['Pierwsze płatne zlecenie meblowe','Marka widoczna lokalnie','Plan na jesień gotowy']}
  ]}
];
const DAYS=['Pn','Wt','Śr','Czw','Pt','Sb','Nd'];
const MP=['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];
const DP=['Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota','Niedziela'];

let S={};
function load(){
  try{S=JSON.parse(localStorage.getItem('dash_v3')||'{}');}catch(e){S={};}
  if(!S.cel) S.cel='Własna marka meblowa · 30k+/mies · dom koło Częstochowy · rodzina · wolność finansowa';
  if(!S.tasks) S.tasks={};
  if(!S.checks) S.checks={};
  if(!S.note) S.note='';
  if(!S.weekTasks) S.weekTasks={};
  if(!S.weekChecks) S.weekChecks={};
  if(!S.activeMonth) S.activeMonth='maj';
  if(!S.habits) S.habits={};
  if(!S.hdata) S.hdata={};
  if(!S.dayTasks) S.dayTasks={};
  if(!S.dayChecks) S.dayChecks={};
  MONTHS_DEF.forEach(m=>m.sections.forEach(sec=>{
    if(!S.tasks[sec.id]) S.tasks[sec.id]=[...sec.tasks];
    if(!S.checks[sec.id]) S.checks[sec.id]={};
  }));
}

function save(){
  localStorage.setItem('dash_v3',JSON.stringify(S));
  db.ref('dashboard').set(S);
}

const now=new Date();
let viewYear=now.getFullYear(),viewMonth=now.getMonth(),selDate=null;
let taskViewYear=now.getFullYear(),taskViewMonth=now.getMonth(),taskSelDate=null;
function dk(y,m,d){return y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');}
function tdk(){return dk(now.getFullYear(),now.getMonth(),now.getDate());}

function switchPage(id,tab){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.ntab').forEach(t=>t.classList.remove('active'));
  document.getElementById('page-'+id).classList.add('active');
  if(tab)tab.classList.add('active');
  else document.querySelectorAll('.ntab').forEach(t=>{if(t.getAttribute('onclick')&&t.getAttribute('onclick').includes("'"+id+"'"))t.classList.add('active');});
}

function openSection(id){
  document.getElementById('home-screen').style.display='none';
  document.getElementById('app-ja').style.display='none';
  document.getElementById('app-praca').style.display='none';
  document.getElementById('app-trening').style.display='none';
  document.getElementById('app-'+id).style.display='block';
  window.scrollTo(0,0);
}

function goHome(){
  document.getElementById('home-screen').style.display='flex';
  document.getElementById('app-ja').style.display='none';
  document.getElementById('app-praca').style.display='none';
  document.getElementById('app-trening').style.display='none';
  window.scrollTo(0,0);
}

function openJaPage(page){
  openSection('ja');
  switchPage(page,null);
}

function openDailyCalendarToday(){
  openJaPage('plan');
  const parts=tdk().split('-');
  taskViewYear=parseInt(parts[0]);
  taskViewMonth=parseInt(parts[1])-1;
  taskSelDate=tdk();
  renderTaskCal();
  openTaskModal(taskSelDate);
}

function render(){
  document.getElementById('cel-text').textContent=S.cel;
  renderMonthTabs();
  renderTaskCal();
  renderWeek();
  renderCal();
  renderHabitSummary();
  document.getElementById('weekly-note').value=S.note||'';
  updateStats();
  renderHome();
}

function getMonthProgress(){
  const m=MONTHS_DEF.find(x=>x.id===S.activeMonth)||MONTHS_DEF[0];
  let done=0,total=0;
  if(m)m.sections.forEach(sec=>{
    const t=S.tasks[sec.id]||[];
    const c=S.checks[sec.id]||{};
    total+=t.length;
    done+=t.filter((_,i)=>c[i]).length;
  });
  return {month:m,done,total,pct:total?Math.round(done/total*100):0};
}

function getTodayWeekKey(){
  const jsDay=now.getDay();
  const index=jsDay===0?6:jsDay-1;
  return DAYS[index];
}

function renderHome(){
  const dateEl=document.getElementById('home-date');
  if(!dateEl)return;

  const todayName=DP[now.getDay()===0?6:now.getDay()-1];
  dateEl.textContent=todayName+' · '+now.getDate()+'.'+String(now.getMonth()+1).padStart(2,'0');

  const progress=getMonthProgress();
  document.getElementById('home-month-label').textContent=progress.month?progress.month.label:'Plan';
  document.getElementById('home-month-progress').textContent=progress.done+' z '+progress.total+' zadań zrobione';
  document.getElementById('home-progress-pct').textContent=progress.pct+'%';
  const ring=document.getElementById('home-progress-ring');
  if(ring){
    const full=326.73;
    ring.style.strokeDashoffset=String(full-(full*progress.pct/100));
  }

  const habitData=S.hdata[tdk()]||{};
  const doneHabits=S.habits.filter(h=>habitData[h]).length;
  document.getElementById('home-habit-score').textContent=doneHabits+'/'+S.habits.length;

  const healthData=S.hlog&&S.hlog[tdk()]?S.hlog[tdk()]:{};
  document.getElementById('home-health-score').textContent=Object.keys(healthData).length;

  const focus=S.dayTasks[tdk()]||[];
  const focusChecks=S.dayChecks[tdk()]||{};
  const focusEl=document.getElementById('home-focus-list');
  focusEl.innerHTML=focus.length?focus.map((task,i)=>`
    <div class="home-focus-item">
      <input type="checkbox" class="home-focus-check" ${focusChecks[i]?'checked':''} onchange="toggleDayTask('${tdk()}',${i},this.checked)">
      <button class="home-focus-task${focusChecks[i]?' done':''}" onclick="openDailyCalendarToday()">${task}</button>
    </div>
  `).join(''):'<button class="home-focus-empty" onclick="openDailyCalendarToday()">Brak zadań na dziś. Kliknij, żeby dodać coś do kalendarza.</button>';
}

function renderMonthTabs(){
  const tabsEl=document.getElementById('month-tabs');
  const panelsEl=document.getElementById('month-panels');
  tabsEl.innerHTML=''; panelsEl.innerHTML='';
  MONTHS_DEF.forEach(m=>{
    const t=document.createElement('div');
    t.className='mtab'+(S.activeMonth===m.id?' active':'');
    t.textContent=m.label;
    t.onclick=()=>{S.activeMonth=m.id;save();renderMonthTabs();updateStats();};
    tabsEl.appendChild(t);
    const p=document.createElement('div');
    p.className='mpanel'+(S.activeMonth===m.id?' active':'');
    const tagsHtml=m.tags.map((t,i)=>`<span class="tag ${m.tagc[i]}">${t}</span>`).join('');
    p.innerHTML=`<div style="margin-bottom:.875rem">${tagsHtml}</div>`;
    m.sections.forEach(sec=>p.appendChild(buildSection(sec)));
    const ab=document.createElement('button');
    ab.className='add-btn';ab.innerHTML='&#43; dodaj sekcję';
    ab.onclick=()=>addSection(m.id);
    p.appendChild(ab);
    panelsEl.appendChild(p);
  });
}

function buildSection(sec){
  const wrap=document.createElement('div');
  wrap.className='acc';wrap.id='acc-sec-'+sec.id;
  const tasks=S.tasks[sec.id]||[];
  const checks=S.checks[sec.id]||{};
  const done=tasks.filter((_,i)=>checks[i]).length;
  const pct=tasks.length?Math.round(done/tasks.length*100):0;
  wrap.innerHTML=`<div class="acc-h" onclick="togSecAcc('${sec.id}')">
    <div class="acc-ico" style="background:${sec.bg}">${sec.ico}</div>
    <div class="acc-title">${sec.label}</div>
    <div class="acc-meta" id="meta-${sec.id}">${done}/${tasks.length}</div>
    <span class="acc-chev" id="chev-${sec.id}">&#8964;</span>
  </div>
  <div class="acc-body" id="body-${sec.id}">
    <div id="tlist-${sec.id}"></div>
    <div class="prog-bar"><div class="prog-fill" id="prog-${sec.id}" style="width:${pct}%"></div></div>
    <button class="add-btn" onclick="addTask('${sec.id}')">&#43; dodaj zadanie</button>
  </div>`;
  setTimeout(()=>renderTaskList(sec.id),0);
  return wrap;
}

function renderTaskList(secId){
  const list=document.getElementById('tlist-'+secId);
  if(!list) return;
  const tasks=S.tasks[secId]||[];
  const checks=S.checks[secId]||{};
  list.innerHTML='';
  tasks.forEach((t,i)=>{
    const row=document.createElement('div');row.className='task-row';
    const cb=document.createElement('input');cb.type='checkbox';cb.className='task-cb';cb.checked=!!checks[i];
    cb.onchange=()=>{S.checks[secId][i]=cb.checked;save();refreshSec(secId);updateStats();};
    const lbl=document.createElement('div');
    lbl.className='task-lbl'+(cb.checked?' done':'');
    lbl.contentEditable='true';lbl.spellcheck=false;lbl.textContent=t;
    lbl.onblur=()=>{S.tasks[secId][i]=lbl.textContent;save();};
    lbl.onclick=()=>{if(!window.getSelection().toString())cb.click();};
    const del=document.createElement('button');del.className='task-del';del.innerHTML='&#10005;';
    del.onclick=()=>{
      S.tasks[secId].splice(i,1);
      const c={};Object.keys(S.checks[secId]).forEach(k=>{const ki=parseInt(k);if(ki<i)c[k]=S.checks[secId][k];else if(ki>i)c[ki-1]=S.checks[secId][k];});
      S.checks[secId]=c;save();renderTaskList(secId);refreshSec(secId);updateStats();
    };
    row.appendChild(cb);row.appendChild(lbl);row.appendChild(del);
    list.appendChild(row);
  });
}

function refreshSec(secId){
  const tasks=S.tasks[secId]||[];const checks=S.checks[secId]||{};
  const done=tasks.filter((_,i)=>checks[i]).length;
  const pct=tasks.length?Math.round(done/tasks.length*100):0;
  const m=document.getElementById('meta-'+secId);const p=document.getElementById('prog-'+secId);
  if(m)m.textContent=done+'/'+tasks.length;if(p)p.style.width=pct+'%';
}

function addTask(secId){
  if(!S.tasks[secId])S.tasks[secId]=[];
  S.tasks[secId].push('Nowe zadanie');save();renderTaskList(secId);refreshSec(secId);updateStats();
  setTimeout(()=>{const list=document.getElementById('tlist-'+secId);if(list){const lbls=list.querySelectorAll('.task-lbl');if(lbls.length){const last=lbls[lbls.length-1];last.focus();document.execCommand('selectAll',false,null);}}},50);
}

function addSection(monthId){
  const m=MONTHS_DEF.find(x=>x.id===monthId);if(!m)return;
  const id=monthId+'-s'+Date.now();
  m.sections.push({id,label:'Nowa sekcja',ico:'&#9679;',bg:'#f5f5f2',tasks:['Pierwsze zadanie']});
  S.tasks[id]=['Pierwsze zadanie'];S.checks[id]={};save();renderMonthTabs();updateStats();
}

function togAcc(id){
  const b=document.getElementById('body-'+id);const c=document.getElementById('chev-'+id);
  if(!b||!c)return;const open=b.style.display==='block';
  b.style.display=open?'none':'block';c.classList.toggle('open',!open);
}
function togSecAcc(id){togAcc(id);}

function renderWeek(){
  const grid=document.getElementById('week-grid');grid.innerHTML='';
  DAYS.forEach(d=>{
    const cell=document.createElement('div');cell.className='week-day';
    const tasks=S.weekTasks[d]||[];const checks=S.weekChecks[d]||{};
    let html=`<div class="wday-label">${d}</div>`;
    tasks.forEach((t,i)=>{
      html+=`<div class="dtask"><input type="checkbox" ${checks[i]?'checked':''} onchange="toggleWT('${d}',${i},this.checked)"><div class="dtask-lbl${checks[i]?' done':''}" contenteditable="true" spellcheck="false" onblur="editWT('${d}',${i},this)">${t}</div></div>`;
    });
    html+=`<button class="day-add" onclick="addWT('${d}')">+ dodaj</button>`;
    cell.innerHTML=html;grid.appendChild(cell);
  });
  updateWeekMeta();
  renderHome();
}
function toggleWT(d,i,val){if(!S.weekChecks[d])S.weekChecks[d]={};S.weekChecks[d][i]=val;save();renderWeek();}
function editWT(d,i,el){if(!S.weekTasks[d])S.weekTasks[d]=[];S.weekTasks[d][i]=el.textContent;save();}
function addWT(d){if(!S.weekTasks[d])S.weekTasks[d]=[];S.weekTasks[d].push('Zadanie');if(!S.weekChecks[d])S.weekChecks[d]={};save();renderWeek();}
function updateWeekMeta(){
  let done=0,total=0;
  DAYS.forEach(d=>{const t=S.weekTasks[d]||[];const c=S.weekChecks[d]||{};total+=t.length;done+=t.filter((_,i)=>c[i]).length;});
  const m=document.getElementById('week-meta');if(m)m.textContent=done+'/'+total;
}

function renderTaskCal(){
  const title=document.getElementById('task-cal-title');
  const cells=document.getElementById('task-cal-cells');
  if(!title||!cells)return;
  title.textContent=MP[taskViewMonth]+' '+taskViewYear;
  const first=new Date(taskViewYear,taskViewMonth,1);
  let dow=first.getDay();dow=dow===0?6:dow-1;
  const days=new Date(taskViewYear,taskViewMonth+1,0).getDate();
  let html='';
  for(let i=0;i<dow;i++)html+='<div class="cal-day empty"></div>';
  for(let d=1;d<=days;d++){
    const k=dk(taskViewYear,taskViewMonth,d);
    let cls='cal-day';
    if(k===tdk())cls+=' today';
    if(k===taskSelDate)cls+=' sel';
    if(S.dayTasks[k]&&S.dayTasks[k].length>0)cls+=' has-data';
    html+=`<div class="${cls}" onclick="selectTaskDay('${k}')">${d}</div>`;
  }
  cells.innerHTML=html;
}

function changeTaskMonth(dir){
  taskViewMonth+=dir;
  if(taskViewMonth>11){taskViewMonth=0;taskViewYear++;}
  if(taskViewMonth<0){taskViewMonth=11;taskViewYear--;}
  renderTaskCal();
}

function selectTaskDay(k){
  taskSelDate=k;
  renderTaskCal();
  openTaskModal(k);
}

function openTaskModal(k){
  const p=k.split('-');const y=parseInt(p[0]),m=parseInt(p[1])-1,d=parseInt(p[2]);
  const dobj=new Date(y,m,d);const dow=dobj.getDay();
  document.getElementById('task-modal-date-label').textContent=DP[dow===0?6:dow-1]+', '+d+' '+MP[m];
  document.getElementById('task-day-modal').classList.add('open');
  renderDayTasks(k);
}

function closeTaskModal(){
  document.getElementById('task-day-modal').classList.remove('open');
  taskSelDate=null;
  renderTaskCal();
  renderHome();
}

function renderDayTasks(k){
  if(!S.dayTasks[k])S.dayTasks[k]=[];
  if(!S.dayChecks[k])S.dayChecks[k]={};
  const el=document.getElementById('task-day-list');
  const tasks=S.dayTasks[k]||[];
  const checks=S.dayChecks[k]||{};
  if(tasks.length===0){
    el.innerHTML='<div class="home-focus-empty">Dodaj pierwsze ważne zadanie na ten dzień.</div>';
    return;
  }
  el.innerHTML='';
  tasks.forEach((task,i)=>{
    const row=document.createElement('div');
    row.className='task-row day-task-row';
    row.innerHTML=`<input type="checkbox" class="task-cb" ${checks[i]?'checked':''} onchange="toggleDayTask('${k}',${i},this.checked)">
      <div class="task-lbl${checks[i]?' done':''}" contenteditable="true" spellcheck="false" onblur="editDayTask('${k}',${i},this)">${task}</div>
      <button class="task-del" onclick="deleteDayTask('${k}',${i})">&#10005;</button>`;
    el.appendChild(row);
  });
}

function addDayTask(){
  const inp=document.getElementById('new-day-task-input');
  const val=inp.value.trim();
  if(!val)return;
  const k=taskSelDate||tdk();
  if(!S.dayTasks[k])S.dayTasks[k]=[];
  if(!S.dayChecks[k])S.dayChecks[k]={};
  S.dayTasks[k].push(val);
  inp.value='';
  save();
  renderDayTasks(k);
  renderTaskCal();
  renderHome();
}

function toggleDayTask(k,i,val){
  if(!S.dayChecks[k])S.dayChecks[k]={};
  S.dayChecks[k][i]=val;
  save();
  if(taskSelDate===k)renderDayTasks(k);
  renderTaskCal();
  renderHome();
}

function editDayTask(k,i,el){
  if(!S.dayTasks[k])S.dayTasks[k]=[];
  S.dayTasks[k][i]=el.textContent.trim()||'Zadanie';
  save();
  renderHome();
}

function deleteDayTask(k,i){
  if(!S.dayTasks[k])return;
  S.dayTasks[k].splice(i,1);
  const c={};
  Object.keys(S.dayChecks[k]||{}).forEach(key=>{
    const ki=parseInt(key);
    if(ki<i)c[key]=S.dayChecks[k][key];
    else if(ki>i)c[ki-1]=S.dayChecks[k][key];
  });
  S.dayChecks[k]=c;
  if(S.dayTasks[k].length===0){delete S.dayTasks[k];delete S.dayChecks[k];}
  save();
  renderDayTasks(k);
  renderTaskCal();
  renderHome();
}

function renderCal(){
  document.getElementById('cal-title').textContent=MP[viewMonth]+' '+viewYear;
  const cells=document.getElementById('cal-cells');
  const first=new Date(viewYear,viewMonth,1);
  let dow=first.getDay();dow=dow===0?6:dow-1;
  const days=new Date(viewYear,viewMonth+1,0).getDate();
  let html='';
  for(let i=0;i<dow;i++)html+='<div class="cal-day empty"></div>';
  for(let d=1;d<=days;d++){
    const k=dk(viewYear,viewMonth,d);
    let cls='cal-day';
    if(k===tdk())cls+=' today';
    if(k===selDate)cls+=' sel';
    if(S.hdata[k]&&Object.keys(S.hdata[k]).length>0)cls+=' has-data';
    html+=`<div class="${cls}" onclick="selDay('${k}')">${d}</div>`;
  }
  cells.innerHTML=html;
}
function changeMonth(dir){
  viewMonth+=dir;if(viewMonth>11){viewMonth=0;viewYear++;}if(viewMonth<0){viewMonth=11;viewYear--;}renderCal();
}
function selDay(k){selDate=k;renderCal();openModal(k);}
function openModal(k){
  const p=k.split('-');const y=parseInt(p[0]),m=parseInt(p[1])-1,d=parseInt(p[2]);
  const dobj=new Date(y,m,d);const dow=dobj.getDay();
  document.getElementById('modal-date-label').textContent=DP[dow===0?6:dow-1]+', '+d+' '+MP[m];
  document.getElementById('day-modal').classList.add('open');
  renderModalHabits(k);
}
function closeModal(){
  document.getElementById('day-modal').classList.remove('open');
  selDate=null;renderCal();renderHabitSummary();updateStats();
}
function renderModalHabits(k){
  if(!S.hdata[k])S.hdata[k]={};
  const el=document.getElementById('modal-habits');
  if(S.habits.length===0){el.innerHTML='<div style="font-size:13px;color:#aaa;padding:8px 0">Dodaj pierwszy nawyk poniżej.</div>';return;}
  let html='';
  S.habits.forEach((h,i)=>{
    const checked=S.hdata[k][h]?'checked':'';
    html+=`<div class="hrow"><input type="checkbox" class="hcb" ${checked} onchange="toggleH('${k}','${h}',this.checked)"><span class="hname">${h}</span><button class="hdel" onclick="deleteH(${i})">&#10005;</button></div>`;
  });
  el.innerHTML=html;
}
function toggleH(k,h,val){
  if(!S.hdata[k])S.hdata[k]={};
  if(val)S.hdata[k][h]=true;else delete S.hdata[k][h];
  if(Object.keys(S.hdata[k]).length===0)delete S.hdata[k];
  save();renderCal();
}
function addHabit(){
  const inp=document.getElementById('new-habit-input');const val=inp.value.trim();if(!val)return;
  if(!S.habits.includes(val))S.habits.push(val);inp.value='';save();
  if(selDate)renderModalHabits(selDate);renderHabitSummary();updateStats();
}
function deleteH(i){
  const name=S.habits[i];S.habits.splice(i,1);
  Object.keys(S.hdata).forEach(k=>{delete S.hdata[k][name];});
  save();if(selDate)renderModalHabits(selDate);renderHabitSummary();updateStats();
}
function calcStreak(h){
  let cur=0;const d=new Date(now);
  for(let b=0;b<365;b++){
    const k=dk(d.getFullYear(),d.getMonth(),d.getDate());
    if(S.hdata[k]&&S.hdata[k][h])cur++;else break;
    d.setDate(d.getDate()-1);
  }
  let longest=0,tmp=0;const d2=new Date(now);
  for(let b=0;b<365;b++){
    const k=dk(d2.getFullYear(),d2.getMonth(),d2.getDate());
    if(S.hdata[k]&&S.hdata[k][h])tmp++;else{longest=Math.max(longest,tmp);tmp=0;}
    d2.setDate(d2.getDate()-1);
  }
  longest=Math.max(longest,tmp);
  return{current:cur,longest};
}
function renderHabitSummary(){
  let bestStreak=0,bestName='—';
  document.getElementById('habit-count').textContent=S.habits.length;
  let html='';
  S.habits.forEach(h=>{
    const{current,longest}=calcStreak(h);
    if(longest>bestStreak){bestStreak=longest;bestName=h;}
    const pct=longest>0?Math.round((current/longest)*100):0;
    html+=`<div class="hs-row"><div class="hs-top"><span class="hs-name">${h}</span><span class="hs-streak${current===0?' zero':''}">${current===0?'brak serii':current+' dni z rzędu'}</span></div><div class="s-bar"><div class="s-fill" style="width:${pct}%"></div></div><div style="display:flex;justify-content:space-between;margin-top:4px"><span style="font-size:11px;color:#aaa">aktualna seria</span><span style="font-size:11px;color:#aaa">rekord: ${longest} dni</span></div></div>`;
  });
  document.getElementById('habit-summary').innerHTML=html||'<div style="font-size:13px;color:#aaa">Kliknij na dzień w kalendarzu żeby dodać nawyki.</div>';
  document.getElementById('best-streak').textContent=bestStreak+' dni';
  document.getElementById('best-streak-name').textContent=bestName;
  renderHome();
}

function updateStats(){
  const m=MONTHS_DEF.find(x=>x.id===S.activeMonth);
  let done=0,total=0;
  if(m)m.sections.forEach(sec=>{const t=S.tasks[sec.id]||[];const c=S.checks[sec.id]||{};total+=t.length;done+=t.filter((_,i)=>c[i]).length;});
  document.getElementById('stat-tasks').textContent=done+' / '+total;
  let bestStreak=0,bestName='—';
  S.habits.forEach(h=>{const{longest}=calcStreak(h);if(longest>bestStreak){bestStreak=longest;bestName=h;}});
  document.getElementById('stat-streak').textContent=bestStreak+' dni';
  document.getElementById('stat-streak-name').textContent=bestName;
  renderHome();
}

const WDAYS_SHORT=['Nd','Pn','Wt','Śr','Cz','Pt','Sb'];
const DEFAULT_METRICS=[
  {name:'Kcal',unit:'kcal',ico:'&#127859;'},
  {name:'Kroki',unit:'kroków',ico:'&#128694;'},
  {name:'Waga',unit:'kg',ico:'&#9878;'}
];

function hdk(d){return dk(d.getFullYear(),d.getMonth(),d.getDate());}
let hSelDate=hdk(now);

function initHealth(){
  if(!S.metrics) S.metrics=[...DEFAULT_METRICS];
  if(!S.hlog) S.hlog={};
}

function renderHealthPage(){
  renderHWeek();
  renderHDayLabel();
  renderHMetrics();
  renderHSummary();
}

function renderHWeek(){
  const grid=document.getElementById('hweek-grid');
  if(!grid)return;
  let html='';
  for(let i=6;i>=0;i--){
    const d=new Date(now);d.setDate(d.getDate()-i);
    const k=hdk(d);
    const dow=WDAYS_SHORT[d.getDay()];
    const num=d.getDate();
    const isToday=i===0;
    const isSel=k===hSelDate;
    const hasData=S.hlog[k]&&Object.keys(S.hlog[k]).some(m=>S.hlog[k][m]!=='');
    let cls='hweek-day';
    if(isToday)cls+=' today';
    if(isSel)cls+=' active';
    if(hasData)cls+=' has-data';
    html+=`<div class="${cls}" onclick="selectHDay('${k}')">
      <div class="hweek-label">${dow}</div>
      <div class="hweek-num">${num}</div>
      <div class="hweek-dot"></div>
    </div>`;
  }
  grid.innerHTML=html;
}

function selectHDay(k){hSelDate=k;renderHWeek();renderHDayLabel();renderHMetrics();}

function renderHDayLabel(){
  const el=document.getElementById('hday-label');
  if(!el)return;
  const parts=hSelDate.split('-');
  const d=new Date(parseInt(parts[0]),parseInt(parts[1])-1,parseInt(parts[2]));
  const dow=WDAYS_SHORT[d.getDay()];
  el.textContent=dow+' '+d.getDate()+'.'+String(d.getMonth()+1).padStart(2,'0');
}

function renderHMetrics(){
  const el=document.getElementById('hmetrics-list');
  if(!el)return;
  if(!S.hlog[hSelDate])S.hlog[hSelDate]={};
  const log=S.hlog[hSelDate];
  let html='';
  S.metrics.forEach((m,i)=>{
    const val=log[m.name]||'';
    html+=`<div class="metric-row">
      <div class="metric-ico">${m.ico||'&#9679;'}</div>
      <div class="metric-name">${m.name}</div>
      <input class="metric-input" type="number" value="${val}" placeholder="—" onchange="logMetric('${m.name}',this.value)" oninput="logMetric('${m.name}',this.value)">
      <div class="metric-unit">${m.unit}</div>
      <button class="metric-del" onclick="deleteMetric(${i})">&#10005;</button>
    </div>`;
  });
  el.innerHTML=html;
}

function logMetric(name,val){
  if(!S.hlog[hSelDate])S.hlog[hSelDate]={};
  if(val==='')delete S.hlog[hSelDate][name];
  else S.hlog[hSelDate][name]=val;
  if(Object.keys(S.hlog[hSelDate]).length===0)delete S.hlog[hSelDate];
  save();renderHWeek();renderHSummary();
}

function addMetric(){
  const nameEl=document.getElementById('new-metric-name');
  const unitEl=document.getElementById('new-metric-unit');
  const name=nameEl.value.trim();const unit=unitEl.value.trim()||'';
  if(!name)return;
  if(!S.metrics.find(m=>m.name===name))S.metrics.push({name,unit,ico:'&#9679;'});
  nameEl.value='';unitEl.value='';
  save();renderHMetrics();renderHSummary();
}

function deleteMetric(i){
  const name=S.metrics[i].name;S.metrics.splice(i,1);
  Object.keys(S.hlog).forEach(k=>{delete S.hlog[k][name];});
  save();renderHMetrics();renderHSummary();
}

function renderHSummary(){
  const el=document.getElementById('h-summary');if(!el)return;
  const days7=[];
  for(let i=6;i>=0;i--){const d=new Date(now);d.setDate(d.getDate()-i);days7.push(hdk(d));}
  let html='';
  S.metrics.forEach(m=>{
    const vals=days7.map(k=>S.hlog[k]&&S.hlog[k][m.name]?parseFloat(S.hlog[k][m.name]):null).filter(v=>v!==null);
    if(vals.length===0)return;
    const avg=Math.round(vals.reduce((a,b)=>a+b,0)/vals.length*10)/10;
    html+=`<div class="h-sum-card">
      <div class="h-sum-label">${m.ico||''} ${m.name}</div>
      <div class="h-sum-val">${avg}</div>
      <div class="h-sum-sub">śr. ${m.unit} · ${vals.length}/7 dni</div>
    </div>`;
  });
  el.innerHTML=html||'<div style="font-size:13px;color:#aaa;grid-column:1/-1">Zacznij logować żeby zobaczyć statystyki.</div>';
  renderWeeklyArchive();
  renderHome();
}

function getISOWeek(date){
  const d=new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()));
  const day=d.getUTCDay()||7;
  d.setUTCDate(d.getUTCDate()+4-day);
  const yearStart=new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return{week:Math.ceil((((d-yearStart)/86400000)+1)/7),year:d.getUTCFullYear()};
}

function getWeekDays(year,week){
  // Poniedziałek danego tygodnia ISO
  const jan4=new Date(Date.UTC(year,0,4));
  const day=jan4.getUTCDay()||7;
  const mon=new Date(jan4);
  mon.setUTCDate(jan4.getUTCDate()-day+1+(week-1)*7);
  const days=[];
  for(let i=0;i<7;i++){
    const d=new Date(mon);d.setUTCDate(mon.getUTCDate()+i);
    days.push(dk(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()));
  }
  return days;
}

function renderWeeklyArchive(){
  const el=document.getElementById('h-weekly-archive');if(!el)return;
  // Zbierz wszystkie tygodnie z danych (tylko zakończone)
  const weeksMap={};
  const todayKey=tdk();
  Object.keys(S.hlog||{}).forEach(k=>{
    if(k>=todayKey) return; // pomijamy bieżący i przyszłe
    const parts=k.split('-');
    const d=new Date(parseInt(parts[0]),parseInt(parts[1])-1,parseInt(parts[2]));
    const{week,year}=getISOWeek(d);
    const wKey=year+'-W'+String(week).padStart(2,'0');
    if(!weeksMap[wKey])weeksMap[wKey]={week,year,wKey};
  });
  // Pomiń bieżący tydzień
  const{week:curWeek,year:curYear}=getISOWeek(now);
  const curWKey=curYear+'-W'+String(curWeek).padStart(2,'0');
  delete weeksMap[curWKey];

  const weeks=Object.values(weeksMap).sort((a,b)=>b.wKey.localeCompare(a.wKey));
  if(weeks.length===0){
    el.innerHTML='<div style="font-size:13px;color:#aaa;padding:.5rem 0">Zakończone tygodnie pojawią się tutaj automatycznie.</div>';
    return;
  }
  let html='';
  weeks.forEach(({week,year,wKey})=>{
    const days=getWeekDays(year,week);
    const mon=days[0].split('-');const sun=days[6].split('-');
    const dateRange=parseInt(mon[2])+'.'+mon[1]+' – '+parseInt(sun[2])+'.'+sun[1]+'.'+sun[0];
    let metricsHtml='';
    S.metrics.forEach(m=>{
      const vals=days.map(k=>S.hlog[k]&&S.hlog[k][m.name]?parseFloat(S.hlog[k][m.name]):null).filter(v=>v!==null);
      if(vals.length===0)return;
      const avg=Math.round(vals.reduce((a,b)=>a+b,0)/vals.length*10)/10;
      const sum=Math.round(vals.reduce((a,b)=>a+b,0)*10)/10;
      // Dla kroków i kcal pokaż sumę, dla reszty średnią
      const showSum=['Kroki','Kcal'].includes(m.name);
      metricsHtml+=`<div class="week-archive-card">
        <div class="week-archive-card-label">${m.ico||'●'} ${m.name}</div>
        <div class="week-archive-card-val">${showSum?sum:avg}</div>
        <div class="week-archive-card-sub">${showSum?'suma '+m.unit:'śr. '+m.unit+' · '+vals.length+'/7 dni'}</div>
      </div>`;
    });
    if(!metricsHtml)return;
    html+=`<div class="week-archive-item">
      <div class="week-archive-header" onclick="togWeekArchive('${wKey}')">
        <div>
          <div class="week-archive-title" style="display:flex;align-items:center;gap:8px">
            <span class="week-badge">${week}. tydzień ${year}</span>
          </div>
          <div class="week-archive-sub">${dateRange}</div>
        </div>
        <span class="week-archive-chev" id="wchev-${wKey}">⌄</span>
      </div>
      <div class="week-archive-body" id="wbody-${wKey}">
        <div class="week-archive-grid">${metricsHtml}</div>
      </div>
    </div>`;
  });
  el.innerHTML=html||'<div style="font-size:13px;color:#aaa">Brak danych do wyświetlenia.</div>';
}

function togWeekArchive(wKey){
  const body=document.getElementById('wbody-'+wKey);
  const chev=document.getElementById('wchev-'+wKey);
  if(!body||!chev)return;
  const open=body.style.display==='block';
  body.style.display=open?'none':'block';
  chev.classList.toggle('open',!open);
}

document.getElementById('cel-text').addEventListener('blur',function(){S.cel=this.textContent;save();});
document.getElementById('weekly-note').addEventListener('input',function(){S.note=this.value;save();});

db.ref('dashboard').once('value').then(function(snapshot){
  if(snapshot.exists()){
    S=snapshot.val();
  }else{
    load();
  }
  if(!S.cel) S.cel='Własna marka meblowa · 30k+/mies · dom koło Częstochowy · rodzina · wolność finansowa';
  if(!S.tasks) S.tasks={};
  if(!S.checks) S.checks={};
  if(!S.note) S.note='';
  if(!S.weekTasks) S.weekTasks={};
  if(!S.weekChecks) S.weekChecks={};
  if(!S.activeMonth) S.activeMonth='maj';
  if(!S.habits) S.habits=[];
  if(!S.hdata) S.hdata={};
  if(!S.dayTasks) S.dayTasks={};
  if(!S.dayChecks) S.dayChecks={};
  MONTHS_DEF.forEach(m=>m.sections.forEach(sec=>{
    if(!S.tasks[sec.id]) S.tasks[sec.id]=[...sec.tasks];
    if(!S.checks[sec.id]) S.checks[sec.id]={};
  }));
  initHealth();
  save();
  render();
  renderHealthPage();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('./sw.js').catch(function () {});
  });
}

