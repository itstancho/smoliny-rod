// Выгрузка древа в GEDCOM 5.5.1 (UTF-8) из people.js
const fs=require('fs');const s=fs.readFileSync(__dirname+'/people.js','utf8');
const grab=(n)=>{const i=s.indexOf('const '+n+' =');const o=s[s.indexOf('=',i)+2];let j=s.indexOf(o,i),d=0,c=o=='{'?'}':']';for(let k=j;k<s.length;k++){if(s[k]==o)d++;else if(s[k]==c){d--;if(!d)return eval('('+s.slice(j,k+1)+')');}}};
const BIO=grab('BIO'),T=grab('T'),CONF=grab('CONF');
const parents={},spouse=new Set(),inc=new Set();
for(const [ch,p] of T.links){(parents[ch]=parents[ch]||[]).push(p);inc.add(ch);inc.add(p);}
for(const [a,b] of T.pairs){spouse.add(a+'|'+b);inc.add(a);inc.add(b);}
for(const n of T.nodes){inc.add(n.c);if(n.sib)for(const c of n.sib.c){inc.add(c);if(!parents[c]&&parents[n.c])parents[c]=parents[n.c].slice();}}
// T.sibs: possibly extra sibling groups
if(Array.isArray(T.sibs))for(const g of T.sibs){const list=g.c||g;const anchor=g.of||null;if(anchor&&Array.isArray(list))for(const c of list){inc.add(c);if(!parents[c]&&parents[anchor])parents[c]=parents[anchor].slice();}}
const ids=[...inc].filter(k=>BIO[k]);const id={};ids.forEach((k,i)=>id[k]='@I'+(i+1)+'@');
const male=(t)=>/(ович|евич|ич)\b/.test(t)||/^(Яков|Иван|Сергей|Семён|Павел|Матвей|Архип|Никита|Николай|Михаил|Дмитрий|Константин|Александр|Анатолий|Юрий|Алексей|Виктор|Вениамин|Пётр|Андрей|Григорий|Аггей|Яким|Онисим|Кондратий|Фаддей|Венедикт|Кирилл|Стефан|Филипп|Аким|Максим|Тихон|Савва|Диомид|Степан|Анфим|Геннадий|Фёдор|Илия|Алексий|Терентий|Иосиф|Василий|Феодор|Георгий|Игнатий|Иоанн|Димитрий|Арсений|Гервасий|Агапий|Сергий)/.test(t);
const fem=(t)=>/(овна|евна|ична|инична)\b/.test(t)||/^(Мария|Анна|Наталья|Валентина|Галина|Матрона|Параскева|Клавдия|Ксения|Евдокия|Татиана|Васса|Екатерина|Феодосия|Таисия|Антонина|Евгения|Лидия|Нина|Александра|Софья|София|Домна|Марья|Акулина|Соломония|Матрена|Глафира|Глике|Ирина|Феодора|Пелаг|Агафья|Анастасия)/.test(t);
function name(t){t=t.replace(/\s*\(.*?\)\s*/g,' ').trim();const w=t.split(/\s+/);
 if(w.length>=3&&/(ов|ев|ин|ын|ский|ова|ева|ина|ская|цов|цова)$/.test(w[w.length-1]))return w.slice(0,-1).join(' ')+' /'+w[w.length-1]+'/';
 return t+' //';}
function yr(part){part=(part||'').trim();if(!part||part=='?'||/^—?$/.test(part))return null;
 const m=part.match(/(\d{4})(?:\s*[–—-]\s*(\d{4}))?/);if(!m)return null;let d=m[2]?('BET '+m[1]+' AND '+m[2]):m[1];if(/ок\.|около|\?/.test(part))d=m[2]?d:'ABT '+m[1];return d;}
const L=[];const out=(x)=>L.push(x);
out('0 HEAD');out('1 SOUR SMOLINY_ROD');out('2 NAME Родословная Вожовых, Кольцовых и Смолиных');out('1 GEDC');out('2 VERS 5.5.1');out('2 FORM LINEAGE-LINKED');out('1 CHAR UTF-8');out('1 LANG Russian');
out('1 NOTE Составлено по материалам исследования, октябрь 2026. Сайт: https://smoliny-rod.pages.dev');
const wrap=(lvl,tag,text)=>{const lines=String(text).split('\n');let first=true;for(const ln of lines){let rest=ln;let t=first?tag:'CONT';first=false;
  while(rest.length>200){out(lvl+' '+t+' '+rest.slice(0,200));rest=rest.slice(200);t='CONC';lvl=lvl;}out(lvl+' '+t+' '+rest);if(t==='CONC'){} } };
const fams=new Map();let fn=0;
function famKey(h,w){return (h||'?')+'|'+(w||'?');}
function getFam(a,b){let h=a,w=b;const ta=BIO[a]?.t||'',tb=BIO[b]?.t||'';if(b&&fem(ta)&&!fem(tb)){h=b;w=a;}const k=famKey(h,w);if(!fams.has(k))fams.set(k,{id:'@F'+(++fn)+'@',h,w,ch:[]});return fams.get(k);}
for(const sp of spouse){const [a,b]=sp.split('|');if(BIO[a]&&BIO[b])getFam(a,b);}
for(const ch of ids){const ps=(parents[ch]||[]).filter(p=>BIO[p]);if(!ps.length)continue;const f=ps.length>=2?getFam(ps[0],ps[1]):getFam(ps[0],null);if(!f.ch.includes(ch))f.ch.push(ch);}
const famOfSp={},famOfCh={};for(const f of fams.values()){for(const p of [f.h,f.w])if(p)(famOfSp[p]=famOfSp[p]||[]).push(f.id);for(const c of f.ch)(famOfCh[c]=famOfCh[c]||[]).push(f.id);}
for(const k of ids){const b=BIO[k];out('0 '+id[k]+' INDI');out('1 NAME '+name(b.t||'?'));
 const sx=male(b.t||'')?'M':fem(b.t||'')?'F':'U';out('1 SEX '+sx);
 const [by,dy]=String(b.y||'').split(/\s+—\s+/);const bd=yr(by),dd=yr(dy);
 if(bd){out('1 BIRT');out('2 DATE '+bd);} if(dd){out('1 DEAT');out('2 DATE '+dd);}
 if(b.l&&b.l.length)wrap(1,'NOTE',b.l.join('\n'));
 const cf=CONF[k];if(cf)wrap(1,'NOTE','Уверенность: '+cf[0]+'%. '+cf[1]);
 if(b.s){out('1 SOUR');wrap(2,'TITL',b.s);}
 for(const f of famOfSp[k]||[])out('1 FAMS '+f);for(const f of famOfCh[k]||[])out('1 FAMC '+f);}
for(const f of fams.values()){out('0 '+f.id+' FAM');if(f.h)out('1 '+(fem(BIO[f.h]?.t||'')?'WIFE':'HUSB')+' '+id[f.h]);if(f.w)out('1 '+(male(BIO[f.w]?.t||'')?'HUSB':'WIFE')+' '+id[f.w]);for(const c of f.ch)out('1 CHIL '+id[c]);}
out('0 TRLR');
const dst=process.argv[2];fs.writeFileSync(dst,L.join('\r\n')+'\r\n');
console.log('persons',ids.length,'families',fams.size,'lines',L.length);
