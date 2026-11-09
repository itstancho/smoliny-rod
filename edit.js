// Редактирование древа семьёй: работает в офлайн-версии (или с ?edit в адресе).
// Добавления хранятся в браузере (localStorage), их можно сохранить в файл-копию и выгрузить в .ged.
// Подключается после people.js и до основного скрипта: сначала вливает добавления в BIO и T.
(function(){
const ON = !!window.__OFF || /[?&]edit\b/.test(location.search);
window.FAM_EDIT_ON = ON;
if(!ON) return;

const KEY = "smoliny-rod-family-v1";
const ROOTS = ["alexander_d","nikita_d"];
let storeOk = true;
function load(){ try{ const j = JSON.parse(localStorage.getItem(KEY)||"null"); if(j && j.people) return j; }catch(e){ storeOk=false; } return {people:{}, rels:[], notes:{}}; }
function save(){ D.updated = new Date().toISOString(); try{ localStorage.setItem(KEY, JSON.stringify(D)); return true; }catch(e){ storeOk=false; return false; } }
const D = load();
window.FAM_DATA = D;

const clean = s => String(s||"").replace(/[<>&"]/g,"").trim();
const isF = c => (D.people[c]||{}).sx==="F";

/* ── вливаем добавления в данные сайта ── */
const NODE = {}; T.nodes.forEach(n=>NODE[n.c]=n);
const parentsOf = c => T.links.filter(l=>l[0]===c && !l[2]).map(l=>l[1]);
for(const [c,p] of Object.entries(D.people)){
  const by=p.by||"", dy=p.dy||"";
  const l=[];
  if(by) l.push(by+" — "+(p.sx==="F"?"родилась":"родился")+"."+(p.place?" Место рождения: "+p.place+".":""));
  else if(p.place) l.push("Место рождения: "+p.place+".");
  if(p.note) l.push(p.note);
  BIO[c] = {t:p.t, y: by&&dy ? by+" — "+dy : (by||(dy?"? — "+dy:"")), l, sx:p.sx, fam:1, s:"Добавлено семьёй", u:1};
}
for(const r of D.rels){
  if(!BIO[r.a]||!BIO[r.b]) continue;
  if(r.k==="child") T.links.push([r.a, r.b, 0]);            // a — ребёнок, b — родитель
  else if(r.k==="spouse") T.pairs.push([r.a, r.b]);
  else if(r.k==="sib"){                                      // b — новый брат/сестра человека a
    const n=NODE[r.a];
    if(n){ n.sib = n.sib && !n.sib.q ? n.sib : {c:[]}; if(!n.sib.c.includes(r.b)) n.sib.c.push(r.b); }
    parentsOf(r.a).forEach(p=>T.links.push([r.b, p, 0]));
  }
}
for(const [c,arr] of Object.entries(D.notes||{})){
  if(!BIO[c]) continue;
  BIO[c].l = (BIO[c].l||[]).concat(arr.map(x=>"Записано семьёй: "+x.text));
}

/* ── стили ── */
const css = `
.fe-bar{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0 4px}
.fe-btn{font:inherit;font-size:15px;border:1.5px solid var(--accent);background:#fff;color:var(--accent);border-radius:10px;padding:7px 14px;cursor:pointer}
.fe-btn.main{background:var(--accent);color:#fff}
.fe-btn.del{border-color:#b9ada0;color:var(--muted)}
.fe-form label{display:block;font-size:14px;color:var(--muted);margin:12px 0 4px}
.fe-form input,.fe-form select,.fe-form textarea{font:inherit;font-size:16px;width:100%;padding:8px 10px;border:1.5px solid var(--line);border-radius:10px;background:#fff;color:var(--ink)}
.fe-form textarea{min-height:90px}
.fe-form .row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.fe-tag{display:inline-block;font-size:13px;background:var(--qbg);border:1px solid var(--qline);border-radius:8px;padding:1px 8px;margin-left:6px;vertical-align:middle}
#newgen{margin:4px 0 18px}
#newgen .ng{background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px 18px;margin-bottom:10px}
#newgen h4{font-size:17px;margin-bottom:6px}
#newgen ul{list-style:none;padding-left:18px;border-left:2px solid var(--line);margin:4px 0 4px 4px}
#newgen li{margin:3px 0}
#newgen a,.fe-list a{color:var(--g);cursor:pointer;text-decoration:underline}
.fe-list{list-style:none;margin:10px 0 20px}
.fe-list li{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap;padding:8px 0;border-bottom:1px solid var(--line)}
.fe-list li span.m{color:var(--muted);font-size:14px}
.fe-warn{background:var(--qbg);border:1px solid var(--qline);border-radius:12px;padding:12px 16px;margin:14px 0}
`;
const st=document.createElement("style"); st.textContent=css; document.head.appendChild(st);

/* ── формы ── */
const REL = [["son","Сын","M"],["daughter","Дочь","F"],["wife","Жена","F"],["husband","Муж","M"],
             ["father","Отец","M"],["mother","Мать","F"],["brother","Брат","M"],["sister","Сестра","F"]];
let seq = Date.now();
const newCode = () => "u"+(seq++).toString(36);

function form(title, sub, p, withRel, spouses){
  const opts = REL.map(([v,t])=>`<option value="${v}">${t}</option>`).join("");
  const sp = (spouses||[]).map(c=>`<option value="${c}">${BIO[c].t}</option>`).join("");
  return `<h3>${title}</h3><div class="dmeta">${sub}</div><div class="fe-form">
   ${withRel?`<label>Кем приходится</label><select id="fe-rel" onchange="var x=document.getElementById('fe-sp-w');if(x)x.style.display=/son|daughter/.test(this.value)?'':'none'">${opts}</select>`:""}
   ${withRel&&sp?`<div id="fe-sp-w"><label>Второй родитель</label><select id="fe-sp">${sp}<option value="">не указывать</option></select></div>`:""}
   <label>Фамилия, имя, отчество</label><input id="fe-t" value="${p.t||""}" placeholder="например, Анна Сергеевна Смолина">
   <div class="row2"><div><label>Год рождения</label><input id="fe-by" value="${p.by||""}" placeholder="1990"></div>
   <div><label>Год смерти</label><input id="fe-dy" value="${p.dy||""}" placeholder="если есть"></div></div>
   <label>Где родился(-ась)</label><input id="fe-pl" value="${p.place||""}" placeholder="город или село">
   <label>Что хочется сохранить</label><textarea id="fe-nt" placeholder="профессия, где жил, памятные события">${p.note||""}</textarea>
   ${withRel?"":`<label>Пол</label><select id="fe-sx"><option value="M"${p.sx==="M"?" selected":""}>мужской</option><option value="F"${p.sx==="F"?" selected":""}>женский</option></select>`}
   <div class="fe-bar"><button class="fe-btn main" id="fe-ok">Сохранить</button><button class="fe-btn del" onclick="closeDr()">Отмена</button></div></div>`;
}
const val = id => clean((document.getElementById(id)||{}).value);
function show(h){ document.getElementById("drin").innerHTML=h; document.getElementById("dr").classList.add("on"); }
function reloadTo(code){ try{ sessionStorage.setItem("fe-reopen", code||""); }catch(e){} location.reload(); }

window.feAdd = function(anchor){
  const spouses=T.pairs.filter(p=>p.includes(anchor)).map(p=>p[0]===anchor?p[1]:p[0]).filter(c=>BIO[c]);
  show(form("Добавить родственника", "к человеку: "+BIO[anchor].t, {}, true, spouses));
  document.getElementById("fe-ok").onclick = ()=>{
    const t=val("fe-t"); if(!t){ alert("Впишите имя."); return; }
    const rel=val("fe-rel"), sx=REL.find(r=>r[0]===rel)[2], c=newCode();
    D.people[c]={t, by:val("fe-by"), dy:val("fe-dy"), place:val("fe-pl"), note:val("fe-nt"), sx};
    if(rel==="son"||rel==="daughter"){
      D.rels.push({k:"child",a:c,b:anchor});
      const sp2=val("fe-sp"); if(sp2&&BIO[sp2]) D.rels.push({k:"child",a:c,b:sp2});
    }
    else if(rel==="wife"||rel==="husband") D.rels.push({k:"spouse",a:anchor,b:c});
    else if(rel==="father"||rel==="mother") D.rels.push({k:"child",a:anchor,b:c});
    else D.rels.push({k:"sib",a:anchor,b:c});
    save(); reloadTo(c);
  };
};
window.feEdit = function(c){
  const p=D.people[c]; if(!p) return;
  show(form("Изменить запись", "добавлено семьёй", p, false));
  document.getElementById("fe-ok").onclick = ()=>{
    const t=val("fe-t"); if(!t){ alert("Впишите имя."); return; }
    Object.assign(p,{t, by:val("fe-by"), dy:val("fe-dy"), place:val("fe-pl"), note:val("fe-nt"), sx:val("fe-sx")||p.sx});
    save(); reloadTo(c);
  };
};
window.feDel = function(c){
  const p=D.people[c]; if(!p) return;
  if(!confirm("Удалить «"+p.t+"» из древа? Это действие нельзя отменить.")) return;
  delete D.people[c]; D.rels=D.rels.filter(r=>r.a!==c&&r.b!==c); delete D.notes[c];
  save(); reloadTo("");
};
window.feNote = function(c){
  show(`<h3>Добавить заметку</h3><div class="dmeta">${BIO[c].t}</div><div class="fe-form">
    <label>Что вы знаете об этом человеке</label><textarea id="fe-nt" placeholder="семейный рассказ, воспоминание, уточнение"></textarea>
    <div class="fe-bar"><button class="fe-btn main" id="fe-ok">Сохранить</button><button class="fe-btn del" onclick="closeDr()">Отмена</button></div></div>`);
  document.getElementById("fe-ok").onclick = ()=>{
    const text=val("fe-nt"); if(!text) return;
    (D.notes[c]=D.notes[c]||[]).push({text, d:new Date().toISOString().slice(0,10)});
    save(); reloadTo(c);
  };
};
window.feDelNote = function(c,i){
  if(!confirm("Удалить заметку?")) return;
  D.notes[c].splice(i,1); if(!D.notes[c].length) delete D.notes[c]; save(); reloadTo("");
};

/* ── файлы: .ged, копия, загрузка копии ── */
function download(name, text, type){
  const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([text],{type}));
  a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href); a.remove();},500);
}
const today = () => new Date().toISOString().slice(0,10);
window.feGed = function(){
  if(typeof makeGedcom!=="function"){ alert("Не найден модуль выгрузки."); return; }
  download("Род_Вожовых_Кольцовых_Смолиных_"+today()+".ged", makeGedcom(BIO,T,CONF).text, "text/plain;charset=utf-8");
};
window.feBackup = function(){
  download("Наше_древо_копия_"+today()+".json", JSON.stringify(D,null,1), "application/json");
};
window.feRestore = function(inp){
  const f=inp.files&&inp.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload=()=>{ try{
      const j=JSON.parse(r.result); if(!j||!j.people||!Array.isArray(j.rels)) throw 0;
      if(!confirm("Заменить текущие записи записями из копии ("+Object.keys(j.people).length+" чел.)?")) return;
      localStorage.setItem(KEY, JSON.stringify(j)); reloadTo("");
    }catch(e){ alert("Это не файл копии древа."); } };
  r.readAsText(f);
};

/* ── после отрисовки сайта ── */
document.addEventListener("DOMContentLoaded", ()=>{
  // кнопки в карточке человека
  const base = window.open;
  window.open = function(code){
    base(code);
    if(!BIO[code]) return;
    const drin=document.getElementById("drin");
    const mine=!!D.people[code];
    if(mine){ const h=drin.querySelector("h3"); if(h) h.insertAdjacentHTML("beforeend",'<span class="fe-tag">добавлено семьёй</span>'); }
    let notes="";
    (D.notes[code]||[]).forEach((n,i)=>{ notes+=`<div class="dsrc">Заметка семьи (${n.d}): ${n.text} <a onclick="feDelNote('${code}',${i})">удалить</a></div>`; });
    const sibs=D.rels.filter(r=>r.k==="sib"&&r.a===code&&!NODE[code]).map(r=>r.b).filter(c=>BIO[c]);
    const sibH=sibs.length?`<div class="fam"><div><b>Братья и сёстры:</b> ${sibs.map(c=>`<a onclick="open('${c}')">${BIO[c].t}</a>`).join(", ")}</div></div>`:"";
    drin.insertAdjacentHTML("beforeend", sibH+notes+`<div class="fe-bar">
      <button class="fe-btn main" onclick="feAdd('${code}')">＋ Родственник</button>
      ${mine?`<button class="fe-btn" onclick="feEdit('${code}')">Изменить</button><button class="fe-btn del" onclick="feDel('${code}')">Удалить</button>`
            :`<button class="fe-btn" onclick="feNote('${code}')">＋ Заметка</button>`}</div>`);
  };

  // вкладка «Дополнить древо»
  const tabs=document.querySelector(".tabs");
  if(tabs){ const b=document.createElement("button"); b.className="tab"; b.dataset.p="fam"; b.textContent="Дополнить древо"; tabs.appendChild(b); }
  const pane=document.createElement("section"); pane.className="pane"; pane.id="p-fam";
  const list=Object.entries(D.people).map(([c,p])=>`<li><a onclick="open('${c}')">${p.t}</a><span class="m">${BIO[c]?BIO[c].y:""}</span>
     <button class="fe-btn" onclick="feEdit('${c}')">Изменить</button><button class="fe-btn del" onclick="feDel('${c}')">Удалить</button></li>`).join("");
  const nlist=Object.entries(D.notes).flatMap(([c,arr])=>arr.map((n,i)=>`<li><a onclick="open('${c}')">${BIO[c]?BIO[c].t:c}</a><span class="m">${n.text}</span>
     <button class="fe-btn del" onclick="feDelNote('${c}',${i})">Удалить</button></li>`)).join("");
  pane.innerHTML=`<div class="lead" style="max-width:820px">
    <h2 style="margin-bottom:10px">Дополнить древо</h2>
    <p>Сюда можно вписать новых родственников: жён и мужей, детей, внуков, а также братьев, сестёр и родителей любого человека в древе. Откройте карточку человека (на вкладке «Древо» нажмите на его имя) и нажмите <b>«＋ Родственник»</b>. К любому человеку можно добавить и <b>заметку</b> — семейный рассказ или уточнение.</p>
    <p>Жёны, мужья, дети и внуки Александра и Никиты появляются в блоке <b>«Новое поколение»</b> над древом. Остальные — в карточках и в кружках «братья и сёстры» у людей на древе.</p>
    <div class="fe-warn"><b>Важно.</b> Записи хранятся только в этом браузере на этом компьютере. Чтобы их не потерять, после изменений нажимайте <b>«Сохранить копию записей»</b> и храните файл, например, на флешке или в облаке. На другом компьютере копию можно загрузить кнопкой «Загрузить копию».${storeOk?"":" <br><b>Сейчас браузер не даёт сохранять записи</b> — откройте сайт в Google Chrome или сохраните копию сразу после изменений."}</div>
    <div class="fe-bar">
      <button class="fe-btn main" onclick="feBackup()">Сохранить копию записей</button>
      <label class="fe-btn" style="display:inline-block">Загрузить копию<input type="file" accept=".json" style="display:none" onchange="feRestore(this)"></label>
      <button class="fe-btn" onclick="feGed()">Скачать файл древа (.ged)</button>
    </div>
    <p style="font-size:14px;color:var(--muted)">Файл древа (.ged) содержит всё древо вместе с вашими добавлениями. Его открывают программы-родословные («Древо Жизни», Gramps, MacFamilyTree) и его можно отправить родственникам.</p>
    <h3 style="margin-top:22px">Добавленные люди ${Object.keys(D.people).length?"("+Object.keys(D.people).length+")":""}</h3>
    ${list?`<ul class="fe-list">${list}</ul>`:`<p style="color:var(--muted)">Пока никого. Начните с карточки Александра или Никиты.</p>
      <div class="fe-bar"><button class="fe-btn main" onclick="open('alexander_d')">Карточка Александра</button><button class="fe-btn main" onclick="open('nikita_d')">Карточка Никиты</button></div>`}
    ${nlist?`<h3 style="margin-top:18px">Заметки семьи</h3><ul class="fe-list">${nlist}</ul>`:""}
  </div>`;
  const last=document.querySelector(".pane:last-of-type"); (last||document.body).insertAdjacentElement("afterend",pane);

  // блок «Новое поколение» над древом
  const kidsOf = c => D.rels.filter(r=>r.k==="child"&&r.b===c).map(r=>r.a);
  const spOf = c => D.rels.filter(r=>r.k==="spouse"&&(r.a===c||r.b===c)).map(r=>r.a===c?r.b:r.a);
  const lnk = c => `<a onclick="open('${c}')">${BIO[c].t}</a>${BIO[c].y?` <span style="color:var(--muted)">${BIO[c].y}</span>`:""}`;
  function branch(c, seen){
    if(seen.has(c)) return ""; seen.add(c);
    const sp=spOf(c).filter(x=>BIO[x]);
    const kids=[...new Set(kidsOf(c).concat(...sp.map(kidsOf)))].filter(x=>BIO[x]);
    let h="";
    sp.forEach(s=>{ seen.add(s); h+=`<li>${isF(s)?"жена":"муж"}: ${lnk(s)}</li>`; });
    kids.forEach(k=>{ h+=`<li>${isF(k)?"дочь":"сын"}: ${lnk(k)}${branch(k,seen)}</li>`; });
    return h?`<ul>${h}</ul>`:"";
  }
  const ng=ROOTS.filter(r=>BIO[r]).map(r=>{ const b=branch(r,new Set()); return b?`<div class="ng"><h4>${lnk(r)}</h4>${b}</div>`:""; }).join("");
  const tb=document.getElementById("treebox1");
  if(tb){ const d=document.createElement("div"); d.id="newgen";
    d.innerHTML=(ng?`<h3 style="margin:6px 0 10px">Новое поколение</h3>${ng}`:"")+
      `<div class="fe-bar" style="margin:0 0 10px"><button class="fe-btn" onclick="showPane('fam')">✎ Дополнить древо</button></div>`;
    tb.insertAdjacentElement("beforebegin",d); }

  // вернуться к карточке после сохранения
  let re=""; try{ re=sessionStorage.getItem("fe-reopen")||""; sessionStorage.removeItem("fe-reopen"); }catch(e){}
  if(re){ showPane("tree"); setTimeout(()=>open(re),50); }
});
})();
