const KZ_LOCATIONS={
'Астана':['Алматы ауданы','Байқоңыр ауданы','Есіл ауданы','Нұра ауданы','Сарыарқа ауданы'],
'Алматы':['Алатау ауданы','Алмалы ауданы','Әуезов ауданы','Бостандық ауданы','Жетісу ауданы','Медеу ауданы','Наурызбай ауданы','Түрксіб ауданы'],
'Шымкент':['Абай ауданы','Әл-Фараби ауданы','Еңбекші ауданы','Қаратау ауданы','Тұран ауданы'],
'Абай':['Абай ауданы','Ақсуат ауданы','Аягөз ауданы','Бесқарағай ауданы','Бородулиха ауданы','Жарма ауданы','Көкпекті ауданы','Үржар ауданы'],
'Ақмола':['Ақкөл ауданы','Аршалы ауданы','Астрахан ауданы','Атбасар ауданы','Бурабай ауданы','Зеренді ауданы','Целиноград ауданы'],
'Ақтөбе':['Алға ауданы','Әйтеке би ауданы','Байғанин ауданы','Қарғалы ауданы','Мәртөк ауданы','Мұғалжар ауданы','Хромтау ауданы'],
'Алматы облысы':['Балқаш ауданы','Еңбекшіқазақ ауданы','Жамбыл ауданы','Іле ауданы','Қарасай ауданы','Кеген ауданы','Райымбек ауданы','Талғар ауданы','Ұйғыр ауданы'],
'Атырау':['Жылыой ауданы','Индер ауданы','Исатай ауданы','Қызылқоға ауданы','Құрманғазы ауданы','Мақат ауданы','Махамбет ауданы'],
'Батыс Қазақстан':['Ақжайық ауданы','Бәйтерек ауданы','Бөкей ордасы ауданы','Бөрілі ауданы','Жаңақала ауданы','Жәнібек ауданы','Қаратөбе ауданы','Сырым ауданы','Тасқала ауданы','Теректі ауданы'],
'Жамбыл':['Байзақ ауданы','Жамбыл ауданы','Жуалы ауданы','Қордай ауданы','Меркі ауданы','Мойынқұм ауданы','Сарысу ауданы','Талас ауданы','Тұрар Рысқұлов ауданы','Шу ауданы'],
'Жетісу':['Ақсу ауданы','Алакөл ауданы','Ескелді ауданы','Кербұлақ ауданы','Көксу ауданы','Панфилов ауданы','Сарқан ауданы'],
'Қарағанды':['Абай ауданы','Ақтоғай ауданы','Бұқар жырау ауданы','Қарқаралы ауданы','Нұра ауданы','Осакаров ауданы','Шет ауданы'],
'Қостанай':['Алтынсарин ауданы','Амангелді ауданы','Әулиекөл ауданы','Бейімбет Майлин ауданы','Денисов ауданы','Жангелдин ауданы','Қарабалық ауданы','Қостанай ауданы','Меңдіқара ауданы','Науырзым ауданы','Сарыкөл ауданы','Ұзынкөл ауданы','Федоров ауданы'],
'Қызылорда':['Арал ауданы','Жалағаш ауданы','Жаңақорған ауданы','Қазалы ауданы','Қармақшы ауданы','Сырдария ауданы','Шиелі ауданы'],
'Маңғыстау':['Бейнеу ауданы','Қарақия ауданы','Маңғыстау ауданы','Мұнайлы ауданы','Түпқараған ауданы'],
'Павлодар':['Аққулы ауданы','Ақтоғай ауданы','Баянауыл ауданы','Ертіс ауданы','Железин ауданы','Май ауданы','Павлодар ауданы','Тереңкөл ауданы','Успен ауданы','Шарбақты ауданы'],
'Солтүстік Қазақстан':['Айыртау ауданы','Ақжар ауданы','Аққайың ауданы','Есіл ауданы','Жамбыл ауданы','Қызылжар ауданы','Мамлют ауданы','Мағжан Жұмабаев ауданы','Тайынша ауданы','Тимирязев ауданы','Уәлиханов ауданы','Шал ақын ауданы'],
'Түркістан':['Бәйдібек ауданы','Жетісай ауданы','Келес ауданы','Қазығұрт ауданы','Мақтаарал ауданы','Ордабасы ауданы','Отырар ауданы','Сайрам ауданы','Сарыағаш ауданы','Сауран ауданы','Созақ ауданы','Төлеби ауданы','Түлкібас ауданы','Шардара ауданы'],
'Ұлытау':['Жаңаарқа ауданы','Ұлытау ауданы'],
'Шығыс Қазақстан':['Алтай ауданы','Глубокое ауданы','Зайсан ауданы','Катонқарағай ауданы','Күршім ауданы','Самар ауданы','Тарбағатай ауданы','Ұлан ауданы','Үлкен Нарын ауданы','Шемонаиха ауданы']};
function fillRegions(id){const e=document.getElementById(id);if(!e)return;const first=e.dataset.all||'Облысты таңдаңыз';e.innerHTML=`<option value="">${first}</option>`+Object.keys(KZ_LOCATIONS).map(x=>`<option>${x}</option>`).join('')}
function fillDistricts(regionId,districtId){const r=document.getElementById(regionId),d=document.getElementById(districtId);if(!r||!d)return;d.innerHTML='<option value="">Ауданды таңдаңыз</option>'+((KZ_LOCATIONS[r.value]||[]).map(x=>`<option>${x}</option>`).join(''));d.disabled=!r.value;syncLocation(regionId,districtId)}
function syncLocation(regionId,districtId,villageId,targetId){const r=document.getElementById(regionId),d=document.getElementById(districtId),v=villageId&&document.getElementById(villageId),t=targetId&&document.getElementById(targetId);if(t)t.value=[r?.value,d?.value,v?.value.trim()].filter(Boolean).join(', ')}
function initLocationGroup(prefix,target){fillRegions(prefix+'Region');const r=document.getElementById(prefix+'Region'),d=document.getElementById(prefix+'District'),v=document.getElementById(prefix+'Village');if(!r)return;r.addEventListener('change',()=>{fillDistricts(prefix+'Region',prefix+'District');syncLocation(prefix+'Region',prefix+'District',prefix+'Village',target)});d.addEventListener('change',()=>syncLocation(prefix+'Region',prefix+'District',prefix+'Village',target));v.addEventListener('input',()=>syncLocation(prefix+'Region',prefix+'District',prefix+'Village',target))}
function renderKazakhstanMap(){const box=document.getElementById('kazakhstanMap');if(!box)return;box.innerHTML=Object.keys(KZ_LOCATIONS).map(x=>`<button type="button" onclick="selectMapRegion('${x}',this)">${x}</button>`).join('')}
function selectMapRegion(region,button){document.querySelectorAll('#kazakhstanMap button').forEach(x=>x.classList.remove('active'));button?.classList.add('active');const s=document.getElementById('filterRegion');s.value=region;applyAdvancedFilters();document.getElementById('mapSelection').textContent=`Таңдалды: ${region}`}
document.addEventListener('DOMContentLoaded',()=>{initLocationGroup('post','postLoc');initLocationGroup('prod','prodLoc');renderKazakhstanMap()});
