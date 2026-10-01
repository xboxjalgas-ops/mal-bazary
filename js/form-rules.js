(function(root){
  const limits={postTitle:120,postDesc:1500,postBreed:80,postAge:50,postWeight:50,postHealth:120,postDocuments:300,prodTitle:120,prodDesc:1500,prodPrice:60};
  function validate(kind,values){
    const prefix=kind==='animal'?'post':'prod',errors=[];
    for(const [key,limit] of Object.entries(limits)){
      if(!key.startsWith(prefix))continue;
      const value=String(values[key]||'').trim();
      if(value.length>limit)errors.push({field:key,code:'length',limit});
    }
    if(String(values[prefix+'Title']||'').trim().length<3)errors.push({field:prefix+'Title',code:'title'});
    if(kind==='animal'){
      const price=Number(values.postPrice);
      if(!Number.isFinite(price)||price<=0||price>1e9)errors.push({field:'postPrice',code:'price'});
    }else if(!String(values.prodPrice||'').trim())errors.push({field:'prodPrice',code:'required'});
    const location=String(values[prefix+'Loc']||'').trim();
    if(location.length<2||location.length>120)errors.push({field:prefix+'Region',code:'location'});
    return errors;
  }
  function priceRange(min,max){
    const low=min===''?null:Number(min),high=max===''?null:Number(max);
    return ![low,high].some(n=>n!==null&&(!Number.isFinite(n)||n<0))&&!(low!==null&&high!==null&&low>high);
  }
  function imageProblem(file){
    if(!['image/jpeg','image/png','image/webp'].includes(file.type))return 'type';
    if(!file.size||file.size>4*1024*1024)return 'size';
    return null;
  }
  // Private document details, account data and photos never enter this draft.
  const draftFields=['postType','postTitle','postDesc','postPrice','postBreed','postAge','postWeight','postHealth','postRegion','postDistrict','postVillage','prodCat','prodTitle','prodDesc','prodPrice','prodRegion','prodDistrict','prodVillage'];
  function cleanDraft(value){
    if(!value||value.version!==1||!['animal','product'].includes(value.kind)||!value.fields||typeof value.fields!=='object')return null;
    const fields={};
    for(const key of draftFields)if(typeof value.fields[key]==='string')fields[key]=value.fields[key].slice(0,limits[key]||120);
    return {version:1,kind:value.kind,fields};
  }
  const rules={limits,validate,priceRange,imageProblem,draftFields,cleanDraft};
  if(typeof module==='object'&&module.exports)module.exports=rules;else root.MBFormRules=rules;
})(typeof window==='object'?window:globalThis);
