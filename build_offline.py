# Офлайн-версия сайта: архив, который открывается двойным щелчком по index.html без интернета
import json, shutil, os, subprocess
src='сайт_cloudflare'; out='офлайн/Род_Вожовых_Кольцовых_Смолиных'
shutil.rmtree(out, ignore_errors=True)
shutil.copytree(src, out, ignore=shutil.ignore_patterns('_headers','*.py','*.js.bak','make_gedcom.js','*_before_*','*.ged','*.md'))
data={n: open(f'{src}/{n}').read() for n in ['book.html','places.html','summary.html','ev.json']}
shim='<script>window.__OFF='+json.dumps(data,ensure_ascii=False).replace('</','<\\/')+';const __f=window.fetch;window.fetch=(u,...a)=>u in __OFF?Promise.resolve(new Response(__OFF[u])):__f(u,...a);</script>\n'
p=f'{out}/index.html'; s=open(p).read()
s=s.replace('<script src="people.js"></script>', shim+'<script src="people.js"></script>',1)
open(p,'w').write(s)
for n in ['book.html','places.html','summary.html','ev.json']: os.remove(f'{out}/{n}')
tree='офлайн/Древо_для_программы'; shutil.rmtree(tree, ignore_errors=True); os.makedirs(tree)
for n in ['Род_Вожовых_Кольцовых_Смолиных.ged','Как_вести_древо_дальше.docx']: shutil.copy(f'для_клиента/{n}', tree)
shutil.copy('для_клиента/Как_пользоваться_офлайн_версией.docx', 'офлайн/Как_пользоваться_офлайн_версией.docx')
open(f'{out}/../ПРОЧТИТЕ.txt','w').write('В архиве две папки.\n\n1. «Род_Вожовых_Кольцовых_Смолиных» — сайт с древом, книгой и документами. Откройте папку и дважды щёлкните по файлу index.html. Сайт откроется в браузере, интернет не нужен.\nНа вкладке «Дополнить древо» можно вписывать новых родственников: жён, мужей, детей, внуков. Записи хранятся в этом браузере — после изменений нажимайте «Сохранить копию записей» и держите файл копии в надёжном месте. Лучше открывать сайт в Google Chrome. Подробно — в файле «Как_пользоваться_офлайн_версией.docx».\n\n2. «Древо_для_программы» — файл древа (.ged) и инструкция. Этот файл открывается в программе-родословной («Древо Жизни» или Gramps), и в нём можно добавлять новых родственников: жён, детей, внуков.\n')
z='офлайн/Род_Вожовых_Кольцовых_Смолиных.zip'
if os.path.exists(z): os.remove(z)
import zipfile  # zipfile ставит флаг UTF-8, иначе Windows покажет русские имена кракозябрами
with zipfile.ZipFile(z,'w',zipfile.ZIP_DEFLATED) as zf:
    for top in ['Род_Вожовых_Кольцовых_Смолиных','Древо_для_программы','ПРОЧТИТЕ.txt','Как_пользоваться_офлайн_версией.docx']:
        base=f'офлайн/{top}'
        if os.path.isfile(base): zf.write(base, top); continue
        for d,_,fs in os.walk(base):
            for f in sorted(fs): zf.write(f'{d}/{f}', os.path.relpath(f'{d}/{f}','офлайн'))
print('ok', os.path.getsize(z)//1024, 'KB')
