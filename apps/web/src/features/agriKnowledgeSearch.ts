import {knowledgeCrops,knowledgeInputTopics} from './agriKnowledgeCore.ts';
import {knowledgePests} from './agriKnowledgePests.ts';
import {knowledgeNutrients} from './agriKnowledgeNutrients.ts';
import {inputSearchAliases} from './agriInputsModel.ts';
const nutrientAliases:Readonly<Record<string,string>>={
 'नायट्रोजन':'nitrogen','नत्र':'nitrogen','नाइट्रोजन':'nitrogen',
 'फॉस्फरस':'phosphorus','फास्फोरस':'phosphorus','स्फुरद':'phosphorus',
 'पोटॅशियम':'potassium','पोटाश':'potassium',
 'कॅल्शियम':'calcium','कैल्शियम':'calcium',
 'मॅग्नेशियम':'magnesium','मैग्नीशियम':'magnesium',
 'गंधक':'sulphur','सल्फर':'sulphur',
 'लोह':'iron','लोहा':'iron','जस्त':'zinc','जिंक':'zinc',
 'बोरॉन':'boron','बोरान':'boron','तांबे':'copper','तांबा':'copper',
 'मँगनीज':'manganese','मैंगनीज':'manganese'
};
export function normalizedKnowledgeQuery(query:string):string{
 const value=query.trim().toLocaleLowerCase('en-IN');
 return nutrientAliases[value]||inputSearchAliases[value]||value;
}
function includes(value:string,query:string):boolean{
 return !query||value.toLocaleLowerCase('en-IN').includes(query);
}
export function cropByName(name:string){
 const s=name.trim().toLocaleLowerCase('en-IN');
 return knowledgeCrops.find(x=>[x.name,x.id,x.marathi,x.hindi].some(n=>n.toLocaleLowerCase('en-IN')===s));
}
export function filterCropInputTopics(crop:string,search=''){
 const guide=cropByName(crop);
 const query=normalizedKnowledgeQuery(search);
 if(!guide)return [];
 return knowledgeInputTopics.filter(x=>guide.inputTopics.includes(x.id)&&includes([x.name,x.kind,x.overview,x.check].join(' '),query));
}
export function filterPestDiseaseGuides(crop:string,search='',kind='All'){
 const guide=cropByName(crop);
 const query=normalizedKnowledgeQuery(search);
 return knowledgePests.filter(x=>(crop==='All crops'||(guide!==undefined&&x.crop===guide.id))&&
    (kind==='All'||x.kind===kind)&&
    includes([x.name,x.scientific||'',x.signs,x.scout,x.alternatives,
      knowledgeCrops.find(c=>c.id===x.crop)?.name||''].join(' '),query));
}
export function filterNutrientGuides(search='',group='All'){
 const query=normalizedKnowledgeQuery(search);
 return knowledgeNutrients.filter(x=>(group==='All'||x.group===group)&&
   includes([x.name,x.symbol,x.group,x.role,x.possibleSigns,x.firstSeen,x.lookAlikes].join(' '),query));
}
