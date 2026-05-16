var importBridgeMode = 'auto';
var importBridgeDraft = null;

function ensureImportState(){
  if(!S.imports) S.imports=[];
  if(!S.trainingPlans) S.trainingPlans=[];
  if(!S.workImports) S.workImports=[];
  if(!Array.isArray(S.habits)) S.habits=[];
  if(!S.dayTasks) S.dayTasks={};
  if(!S.dayChecks) S.dayChecks={};
}

function plain(value){
  return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
}

function esc(value){
  return String(value||'').replace(/[&<>"']/g,function(ch){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
  });
}

function setImportMode(mode,btn){
  importBridgeMode=mode;
  document.querySelectorAll('.import-tab').forEach(function(tab){tab.classList.remove('active');});
  if(btn)btn.classList.add('active');
}

function clearImport(){
  document.getElementById('import-input').value='';
  importBridgeDraft=null;
  document.getElementById('import-save').style.display='none';
  document.getElementById('import-preview').innerHTML='<div class="import-empty">Wklej material i kliknij Analizuj.</div>';
}

function detectImportType(text){
  const normalized=plain(text);
  if(/trening|cwicze|serie|powtorz|przysiad|martwy|wyciskan|wiosl/.test(normalized))return'training';
  if(/nawyk|codziennie|rutyna|habit/.test(normalized))return'habits';
  if(/zadani|todo|do zrobienia|termin|deadline|jutro|dzis/.test(normalized))return'tasks';
  if(/projekt|klient|oferta|wycena|brief|praca/.test(normalized))return'work';
  return'note';
}

function getField(text,names){
  const lines=text.split(/\r?\n/);
  const keys=names.map(plain);
  for(const line of lines){
    const clean=line.trim();
    const normalized=plain(clean);
    for(const key of keys){
      if(normalized.startsWith(key+':')){
        return clean.split(':').slice(1).join(':').trim();
      }
    }
  }
  return'';
}

function parseImportDate(raw){
  const text=plain(raw).trim();
  const base=new Date(now);
  if(!text||text==='dzis'||text==='today')return tdk();
  if(text==='jutro'||text==='tomorrow'){
    base.setDate(base.getDate()+1);
    return dk(base.getFullYear(),base.getMonth(),base.getDate());
  }
  const iso=text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if(iso)return iso[1]+'-'+iso[2]+'-'+iso[3];
  const pl=text.match(/(\d{1,2})[.\-/](\d{1,2})(?:[.\-/](\d{4}))?/);
  if(pl){
    const y=pl[3]?parseInt(pl[3]):now.getFullYear();
    return dk(y,parseInt(pl[2])-1,parseInt(pl[1]));
  }
  return tdk();
}

function linesAfterLabel(text,labels){
  const lines=text.split(/\r?\n/);
  const keys=labels.map(plain);
  const out=[];
  let active=false;
  for(const line of lines){
    const clean=line.trim();
    const normalized=plain(clean);
    if(keys.some(function(key){return normalized===key+':'||normalized.startsWith(key+':');})){
      active=true;
      const after=clean.split(':').slice(1).join(':').trim();
      if(after)out.push(after);
      continue;
    }
    if(active&&/^[a-z\s]{2,24}:/i.test(normalized)&&!/^[-*•]/.test(clean))break;
    if(active&&clean)out.push(clean);
  }
  return out;
}

function extractItems(text,type){
  const labelMap={
    tasks:['zadania','tasks','todo','do zrobienia'],
    training:['cwiczenia','trening','plan'],
    habits:['nawyki','habits','rutyna'],
    work:['projekty','projekt','praca'],
    note:['notatka','wnioski','podsumowanie']
  };
  let raw=linesAfterLabel(text,labelMap[type]||[]);
  if(raw.length===0)raw=text.split(/\r?\n/).filter(function(line){return /^\s*[-*•]\s+/.test(line);});
  raw=raw.map(function(line){
    return line.replace(/^\s*[-*•]\s+/,'').replace(/^\d+[.)]\s+/,'').trim();
  }).filter(function(line){
    return line&&!/^(typ|data|nazwa|tytul)\s*:/i.test(plain(line));
  });
  if(raw.length===0&&['tasks','habits','training','work'].includes(type)){
    raw=text.split(/\r?\n/).map(function(line){return line.trim();})
      .filter(function(line){return line&&!line.startsWith('#')&&!/^(typ|data|nazwa|tytul|notatka)\s*:/i.test(plain(line));});
  }
  return raw.slice(0,30);
}

function firstContentLine(text){
  return text.split(/\r?\n/).map(function(line){return line.trim();})
    .find(function(line){return line&&!line.startsWith('#')&&!/^(typ|data|nazwa|tytul|zadania|cwiczenia|nawyki|notatka)\s*:/i.test(plain(line));})||'Import z ChatGPT';
}

function analyzeImport(){
  ensureImportState();
  const input=document.getElementById('import-input');
  const text=input.value.trim();
  if(!text){
    clearImport();
    return;
  }
  const forced=importBridgeMode==='auto'?plain(getField(text,['typ','type'])):importBridgeMode;
  let type=forced||detectImportType(text);
  const aliases={zadanie:'tasks',zadania:'tasks',task:'tasks',tasks:'tasks',trening:'training',training:'training',nawyk:'habits',nawyki:'habits',habit:'habits',habits:'habits',projekt:'work',praca:'work',work:'work',notatka:'note',note:'note'};
  type=aliases[type]||type;
  if(!['tasks','training','habits','work','note'].includes(type))type=detectImportType(text);
  const title=getField(text,['nazwa','tytul','title'])||firstContentLine(text).slice(0,90);
  const date=parseImportDate(getField(text,['data','date','termin']));
  const items=type==='note'?[]:extractItems(text,type);
  const note=type==='note'?text:(getField(text,['notatka','note'])||'');
  importBridgeDraft={type,title,date,items,note,raw:text,createdAt:new Date().toISOString()};
  renderImportPreview(importBridgeDraft);
}

function importTypeLabel(type){
  return {tasks:'Zadania',training:'Trening',habits:'Nawyki',work:'Praca',note:'Notatka'}[type]||'Import';
}

function renderImportPreview(draft){
  const el=document.getElementById('import-preview');
  const itemsHtml=draft.items&&draft.items.length?'<div class="import-list">'+draft.items.map(function(item){
    return '<div class="import-item"><span class="import-dot"></span><span>'+esc(item)+'</span></div>';
  }).join('')+'</div>':'';
  const noteHtml=draft.note?'<div class="import-note">'+esc(draft.note)+'</div>':'';
  el.innerHTML='<div class="import-preview-top">'+
    '<div><div class="import-type">'+importTypeLabel(draft.type)+'</div><div class="import-title">'+esc(draft.title)+'</div></div>'+
    '<div class="import-date">'+esc(draft.date)+'</div></div>'+
    (itemsHtml||noteHtml||'<div class="import-empty">Nie znalazlem listy, zapisze calosc jako notatke.</div>');
  document.getElementById('import-save').style.display='block';
}

function saveImportDraft(){
  if(!importBridgeDraft)return;
  ensureImportState();
  const d=importBridgeDraft;
  if(d.type==='tasks'){
    if(!S.dayTasks[d.date])S.dayTasks[d.date]=[];
    if(!S.dayChecks[d.date])S.dayChecks[d.date]={};
    (d.items.length?d.items:[d.title]).forEach(function(item){S.dayTasks[d.date].push(item);});
  }else if(d.type==='habits'){
    (d.items.length?d.items:[d.title]).forEach(function(item){
      if(item&&!S.habits.includes(item))S.habits.push(item);
    });
  }else if(d.type==='training'){
    S.trainingPlans.unshift({title:d.title,date:d.date,items:d.items,note:d.note,raw:d.raw,createdAt:d.createdAt});
  }else if(d.type==='work'){
    S.workImports.unshift({title:d.title,date:d.date,items:d.items,note:d.note,raw:d.raw,createdAt:d.createdAt});
  }
  S.imports.unshift({type:d.type,title:d.title,date:d.date,count:d.items.length,note:d.type==='note'?d.note:'',createdAt:d.createdAt});
  S.imports=S.imports.slice(0,50);
  S.trainingPlans=S.trainingPlans.slice(0,30);
  S.workImports=S.workImports.slice(0,30);
  save();
  renderImportHistory();
  renderTrainingPlans();
  renderWorkImports();
  renderTaskCal();
  renderHabitSummary();
  renderHome();
  document.getElementById('import-preview').innerHTML='<div class="import-empty">Zapisane.</div>';
  document.getElementById('import-save').style.display='none';
  importBridgeDraft=null;
}

function renderImportHistory(){
  ensureImportState();
  const el=document.getElementById('import-history');
  if(!el)return;
  const imports=S.imports||[];
  if(imports.length===0){
    el.innerHTML='<div class="import-empty">Brak importow.</div>';
    return;
  }
  el.innerHTML=imports.slice(0,8).map(function(item){
    return '<div class="import-card"><div class="import-card-top"><div>'+
      '<div class="import-type">'+importTypeLabel(item.type)+'</div>'+
      '<div class="import-title">'+esc(item.title)+'</div></div>'+
      '<div class="import-date">'+esc(item.date)+'</div></div>'+
      (item.note?'<div class="import-note">'+esc(item.note)+'</div>':'<div class="import-meta">'+(item.count||0)+' pozycji</div>')+
      '</div>';
  }).join('');
}

function renderTrainingPlans(){
  ensureImportState();
  const list=document.getElementById('training-import-list');
  const empty=document.getElementById('training-empty');
  if(!list||!empty)return;
  const plans=S.trainingPlans||[];
  empty.style.display=plans.length?'none':'block';
  list.innerHTML=plans.map(function(plan){
    const items=(plan.items||[]).map(function(item){
      return '<div class="import-item"><span class="import-dot"></span><span>'+esc(item)+'</span></div>';
    }).join('');
    return '<div class="import-card"><div class="import-card-top"><div>'+
      '<div class="import-type">Plan treningowy</div><div class="import-title">'+esc(plan.title)+'</div></div>'+
      '<div class="import-date">'+esc(plan.date)+'</div></div>'+
      '<div class="import-list">'+items+'</div>'+
      (plan.note?'<div class="import-note">'+esc(plan.note)+'</div>':'')+'</div>';
  }).join('');
}

function renderWorkImports(){
  ensureImportState();
  const list=document.getElementById('work-import-list');
  const empty=document.getElementById('work-empty');
  if(!list||!empty)return;
  const items=S.workImports||[];
  empty.style.display=items.length?'none':'block';
  list.innerHTML=items.map(function(item){
    const tasks=(item.items||[]).map(function(task){
      return '<div class="import-item"><span class="import-dot"></span><span>'+esc(task)+'</span></div>';
    }).join('');
    return '<div class="import-card"><div class="import-card-top"><div>'+
      '<div class="import-type">Projekt</div><div class="import-title">'+esc(item.title)+'</div></div>'+
      '<div class="import-date">'+esc(item.date)+'</div></div>'+
      '<div class="import-list">'+tasks+'</div>'+
      (item.note?'<div class="import-note">'+esc(item.note)+'</div>':'')+'</div>';
  }).join('');
}

(function(){
  const baseOpenSection=window.openSection;
  window.openSection=function(id){
    baseOpenSection(id);
    const appImport=document.getElementById('app-import');
    if(appImport)appImport.style.display=id==='import'?'block':'none';
  };

  const baseGoHome=window.goHome;
  window.goHome=function(){
    baseGoHome();
    const appImport=document.getElementById('app-import');
    if(appImport)appImport.style.display='none';
  };

  const baseRender=window.render;
  window.render=function(){
    baseRender();
    renderImportHistory();
    renderTrainingPlans();
    renderWorkImports();
  };
})();
