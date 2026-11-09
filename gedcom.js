// Выгрузка древа в GEDCOM 5.5.1 (UTF-8). Общий модуль: сайт (кнопка «Скачать файл древа») и make_gedcom.js
function makeGedcom(BIO,T,CONF){
const parents={},spouse=new Set(),inc=new Set();
for(const [ch,p] of T.links){(parents[ch]=parents[ch]||[]).push(p);inc.add(ch);inc.add(p);}
for(const [a,b] of T.pairs){spouse.add(a+'|'+b);inc.add(a);inc.add(b);}
for(const n of T.nodes){inc.add(n.c);if(n.sib)for(const c of n.sib.c){inc.add(c);if(!parents[c]&&parents[n.c])parents[c]=parents[n.c].slice();}}
// T.sibs: possibly extra sibling groups
if(Array.isArray(T.sibs))for(const g of T.sibs){const list=g.c||g;const anchor=g.of||null;if(anchor&&Array.isArray(list))for(const c of list){inc.add(c);if(!parents[c]&&parents[anchor])parents[c]=parents[anchor].slice();}}
const ids=[...inc].filter(k=>BIO[k]);const id={};ids.forEach((k,i)=>id[k]='@I'+(i+1)+'@');
const male0=(t)=>/(ович|евич|ич)\b/.test(t)||/^(Яков|Иван|Сергей|Семён|Павел|Матвей|Архип|Никита|Николай|Михаил|Дмитрий|Константин|Александр|Анатолий|Юрий|Алексей|Виктор|Вениамин|Пётр|Андрей|Григорий|Аггей|Яким|Онисим|Кондратий|Фаддей|Венедикт|Кирилл|Стефан|Филипп|Аким|Максим|Тихон|Савва|Диомид|Степан|Анфим|Геннадий|Фёдор|Илия|Алексий|Терентий|Иосиф|Василий|Феодор|Георгий|Игнатий|Иоанн|Димитрий|Арсений|Гервасий|Агапий|Сергий)/.test(t);
const fem0=(t)=>/(овна|евна|ична|инична)\b/.test(t)||/^(Мария|Анна|Наталья|Валентина|Галина|Матрона|Параскева|Клавдия|Ксения|Евдокия|Татиана|Васса|Екатерина|Феодосия|Таисия|Антонина|Евгения|Лидия|Нина|Александра|Софья|София|Домна|Марья|Акулина|Соломония|Матрена|Глафира|Глике|Ирина|Феодора|Пелаг|Агафья|Анастасия)/.test(t);
const male=(t)=>{const b=Object.values(BIO).find(x=>x.t===t);return b&&b.sx?b.sx==='M':male0(t);};
const fem=(t)=>{const b=Object.values(BIO).find(x=>x.t===t);return b&&b.sx?b.sx==='F':fem0(t);};
const PATR=/(ич|вна|ична|чна)$/;
function parse(t){t=t.replace(/\s*\(.*?\)\s*/g,' ').trim();const w=t.split(/\s+/);
 if(w.length>=3&&PATR.test(w[1]))return {g:w.slice(0,2).join(' '),s:w.slice(2).join(' ')};
 if(w.length==2&&!PATR.test(w[1])&&/(ов|ев|ёв|ин|ын|ский|ова|ева|ёва|ина|ына|ская|ко|ых|их)$/.test(w[1]))return {g:w[0],s:w[1]};
 return {g:t,s:''};}
const femSur=(x)=>/(ов|ев|ёв|ин|ын)$/.test(x)?x+'а':/ский$/.test(x)?x.replace(/ский$/,'ская'):x;
const mascSur=(x)=>/(ова|ева|ёва|ина|ына)$/.test(x)?x.slice(0,-1):/ская$/.test(x)?x.replace(/ская$/,'ский'):x;
function yr(part){part=(part||'').trim();if(!part||part=='?'||/^—?$/.test(part))return null;
 const m=part.match(/(\d{4})(?:\s*[–—-]\s*(\d{4}))?/);if(!m)return null;let d=m[2]?('BET '+m[1]+' AND '+m[2]):m[1];if(/ок\.|около|\?/.test(part))d=m[2]?d:'ABT '+m[1];return d;}
const PN={};for(const k of ids)PN[k]=parse(BIO[k].t||'?');
const fatherOf=(k)=>(parents[k]||[]).find(p=>BIO[p]&&male(BIO[p].t||''));
for(let it=0;it<12;it++)for(const k of ids){if(PN[k].s)continue;const f=fatherOf(k);if(!f||!PN[f]||!PN[f].s)continue;const base=mascSur(PN[f].s);PN[k].s=fem(BIO[k].t||'')?femSur(base):base;}
// у крестьян XIX в. фамилий в документах часто нет: мужчинам прямой линии даём фамилию рода по сыну, дальше она снова идёт вниз
const sonsOf={};for(const k of ids)for(const p of parents[k]||[])if(BIO[k]&&male(BIO[k].t||''))(sonsOf[p]=sonsOf[p]||[]).push(k);
for(let it=0;it<12;it++){for(const k of ids){if(PN[k].s||!male(BIO[k].t||''))continue;const sn=(sonsOf[k]||[]).find(c=>PN[c].s);if(sn)PN[k].s=mascSur(PN[sn].s);}
 for(const k of ids){if(PN[k].s)continue;const f=fatherOf(k);if(!f||!PN[f].s)continue;const base=mascSur(PN[f].s);PN[k].s=fem(BIO[k].t||'')?femSur(base):base;}}
const name=(k)=>PN[k].g+' /'+PN[k].s+'/';
const L=[];const out=(x)=>L.push(x);
out('0 HEAD');out('1 SOUR SMOLINY_ROD');out('2 NAME Родословная Вожовых, Кольцовых и Смолиных');out('1 GEDC');out('2 VERS 5.5.1');out('2 FORM LINEAGE-LINKED');out('1 CHAR UTF-8');out('1 LANG Russian');
out('1 NOTE Составлено по материалам исследования, октябрь 2026. Сайт: https://smoliny-rod.pages.dev');
const wrap=(lvl,tag,text)=>{const lines=String(text).split('\n');let first=true;for(const ln of lines){let rest=ln;let t=first?tag:'CONT';first=false;
  while(rest.length>200){out(lvl+' '+t+' '+rest.slice(0,200));rest=rest.slice(200);t='CONC';lvl=lvl;}out(lvl+' '+t+' '+rest);if(t==='CONC'){} } };
const srcs=new Map();
const fams=new Map();let fn=0;
function famKey(h,w){return (h||'?')+'|'+(w||'?');}
function getFam(a,b){let h=a,w=b;const ta=BIO[a]?.t||'',tb=BIO[b]?.t||'';if(b&&fem(ta)&&!fem(tb)){h=b;w=a;}const k=famKey(h,w);if(!fams.has(k))fams.set(k,{id:'@F'+(++fn)+'@',h,w,ch:[]});return fams.get(k);}
for(const sp of spouse){const [a,b]=sp.split('|');if(BIO[a]&&BIO[b])getFam(a,b);}
for(const ch of ids){const ps=(parents[ch]||[]).filter(p=>BIO[p]);if(!ps.length)continue;const f=ps.length>=2?getFam(ps[0],ps[1]):getFam(ps[0],null);if(!f.ch.includes(ch))f.ch.push(ch);}
const famOfSp={},famOfCh={};for(const f of fams.values()){for(const p of [f.h,f.w])if(p)(famOfSp[p]=famOfSp[p]||[]).push(f.id);for(const c of f.ch)(famOfCh[c]=famOfCh[c]||[]).push(f.id);}
for(const k of ids){const b=BIO[k];out('0 '+id[k]+' INDI');out('1 NAME '+name(k));
 const sx=male(b.t||'')?'M':fem(b.t||'')?'F':'U';out('1 SEX '+sx);
 const [by,dy]=String(b.y||'').split(/\s+—\s+/);const bd=yr(by),dd=yr(dy);
 if(bd){out('1 BIRT');out('2 DATE '+bd);} if(dd){out('1 DEAT');out('2 DATE '+dd);}
 if(b.l&&b.l.length)wrap(1,'NOTE',b.l.join('\n'));
 const cf=CONF[k];if(cf)wrap(1,'NOTE','Уверенность: '+cf[0]+'%. '+cf[1]);
 if(b.s){if(!srcs.has(b.s))srcs.set(b.s,'@S'+(srcs.size+1)+'@');out('1 SOUR '+srcs.get(b.s));}
 for(const f of famOfSp[k]||[])out('1 FAMS '+f);for(const f of famOfCh[k]||[])out('1 FAMC '+f);}
for(const f of fams.values()){out('0 '+f.id+' FAM');if(f.h)out('1 '+(fem(BIO[f.h]?.t||'')?'WIFE':'HUSB')+' '+id[f.h]);if(f.w)out('1 '+(male(BIO[f.w]?.t||'')?'HUSB':'WIFE')+' '+id[f.w]);for(const c of f.ch)out('1 CHIL '+id[c]);}
for(const [t,sid] of srcs){out('0 '+sid+' SOUR');wrap(1,'TITL',t);}
out('0 TRLR');
return {text:L.join('\r\n')+'\r\n',persons:ids.length,families:fams.size,lines:L.length};
}
if(typeof module!=='undefined')module.exports={makeGedcom};
