# Офлайн-версия сайта: архив, который открывается двойным щелчком по index.html без интернета
import json, shutil, os, subprocess
src='сайт_cloudflare'; out='офлайн/Род_Вожовых_Кольцовых_Смолиных'
shutil.rmtree(out, ignore_errors=True)
shutil.copytree(src, out, ignore=shutil.ignore_patterns('_headers'))
data={n: open(f'{src}/{n}').read() for n in ['book.html','places.html','summary.html','ev.json']}
shim='<script>window.__OFF='+json.dumps(data,ensure_ascii=False).replace('</','<\\/')+';const __f=window.fetch;window.fetch=(u,...a)=>u in __OFF?Promise.resolve(new Response(__OFF[u])):__f(u,...a);</script>\n'
p=f'{out}/index.html'; s=open(p).read()
s=s.replace('<script src="people.js"></script>', shim+'<script src="people.js"></script>',1)
open(p,'w').write(s)
for n in ['book.html','places.html','summary.html','ev.json']: os.remove(f'{out}/{n}')
open(f'{out}/../ПРОЧТИТЕ.txt','w').write('Распакуйте архив, откройте папку «Род_Вожовых_Кольцовых_Смолиных» и дважды щёлкните по файлу index.html.\nСайт откроется в браузере. Интернет не нужен.\n')
z='офлайн/Род_Вожовых_Кольцовых_Смолиных.zip'
if os.path.exists(z): os.remove(z)
subprocess.run(['zip','-qr','Род_Вожовых_Кольцовых_Смолиных.zip','Род_Вожовых_Кольцовых_Смолиных','ПРОЧТИТЕ.txt'],cwd='офлайн',check=True)
print('ok', os.path.getsize(z)//1024, 'KB')
