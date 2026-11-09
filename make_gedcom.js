// Выгрузка древа в GEDCOM 5.5.1 (UTF-8) из people.js
const fs=require('fs');const s=fs.readFileSync(__dirname+'/people.js','utf8');
const grab=(n)=>{const i=s.indexOf('const '+n+' =');const o=s[s.indexOf('=',i)+2];let j=s.indexOf(o,i),d=0,c=o=='{'?'}':']';for(let k=j;k<s.length;k++){if(s[k]==o)d++;else if(s[k]==c){d--;if(!d)return eval('('+s.slice(j,k+1)+')');}}};
const {makeGedcom}=require('./gedcom.js');
const r=makeGedcom(grab('BIO'),grab('T'),grab('CONF'));
fs.writeFileSync(process.argv[2],r.text);
console.log('persons',r.persons,'families',r.families,'lines',r.lines);
