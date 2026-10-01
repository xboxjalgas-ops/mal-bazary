/* Reference options only: these are not seller listings or stock claims. */
(function(root){
  const breeds={
    'Сиыр':['Әулиекөл','Қазақтың ақбас сиыры','Герефорд','Абердин-ангус','Голштин','Симментал'],
    'Қой':['Меринос','Еділбай','Гиссар','Қазақтың арқар-мериносы','Романов','Тексель','Дорпер'],
    'Жылқы':['Қазақы жылқы (жабы)','Көшім','Мұғалжар','Адай','Ахалтеке','Араб жылқысы','Ағылшынның таза қанды жылқысы'],
    'Тауық':['Леггорн','Род-Айленд','Брама','Кохинхин'],
    'Қаз':['Линда','Холмогор','Тулуза'],
    'Үйрек':['Пекин','Мускус үйрегі','Үнді жүгіргіші'],
    'Қоян':['Калифорния','Жаңа Зеландия','Фландр','Рекс']
  };
  const products=[
    ['sledgehammer','Кувалда','Кувалда'],['shovel','Күрек','Лопата'],
    ['fork','Айыр','Вилы'],['rake','Тырма','Грабли'],
    ['wheelbarrow','Қоларба','Тачка'],['bucket','Шелек','Ведро'],
    ['trough','Астау','Кормушка'],['drinker','Автосуат','Автопоилка'],
    ['hose','Суару шлангісі','Поливочный шланг'],['shears','Қой қырқатын қайшы','Ножницы для стрижки овец'],
    ['clipper','Қой қырқатын машинка','Машинка для стрижки овец'],['halter','Ноқта','Недоуздок'],
    ['saddle','Ер-тоқым','Седло'],['rope','Арқан','Верёвка'],
    ['milkcan','Сүт бидоны','Бидон для молока']
  ].map(([id,kk,ru])=>({id,kk,ru,category:'tag-coop'}));
  function getBreeds(type){return [...(breeds[type]||[])];}
  function normalize(value){return String(value||'').trim().toLocaleLowerCase().replace(/ё/g,'е');}
  function matchesBreed(listing,breed){return !breed||normalize(listing.animalDetails?.breed||listing.animal_details?.breed)===normalize(breed);}
  function matchesProduct(product,query){
    const value=normalize(query);
    return !value||[product.name,product.desc,product.loc].some(text=>normalize(text).includes(value));
  }
  const catalog={breeds,products,getBreeds,matchesBreed,matchesProduct};
  if(typeof module==='object'&&module.exports)module.exports=catalog;
  else root.MBCatalog=catalog;
})(typeof window==='object'?window:globalThis);
