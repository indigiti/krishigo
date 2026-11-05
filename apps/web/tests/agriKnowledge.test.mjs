import test from 'node:test';
import assert from 'node:assert/strict';
import {knowledgeCrops,knowledgeInputTopics} from '../src/features/agriKnowledgeCore.ts';
import {knowledgePests} from '../src/features/agriKnowledgePests.ts';
import {knowledgeNutrients} from '../src/features/agriKnowledgeNutrients.ts';
import {cropByName,filterCropInputTopics,filterPestDiseaseGuides,filterNutrientGuides} from '../src/features/agriKnowledgeSearch.ts';

test('starter guide inventory is complete, uniquely identified and source-linked',()=>{
 assert.equal(knowledgeCrops.length,8);
 assert.equal(knowledgeInputTopics.length,8);
 assert.equal(knowledgePests.length,15);
 assert.equal(knowledgeNutrients.length,11);
 for(const list of [knowledgeCrops,knowledgeInputTopics,knowledgePests,knowledgeNutrients]){
  assert.equal(new Set(list.map(x=>x.id)).size,list.length);
  for(const item of list){
   const source=new URL(item.sourceUrl);
   assert.equal(source.protocol,'https:');
   assert.ok(['agritech.tnau.ac.in','www.agritech.tnau.ac.in','www.rhs.org.uk','www.cabi.org',
    'www.india.gov.in','ipm.ucanr.edu','blogs.cornell.edu','extension.arizona.edu'].includes(source.host),source.host);
   assert.ok(item.sourceTitle.trim().length>7);
  }
 }
});
test('every crop issue references a seeded crop and each crop has at least one issue',()=>{
 for(const issue of knowledgePests)assert.ok(knowledgeCrops.some(x=>x.id===issue.crop),issue.id);
 for(const crop of knowledgeCrops)assert.ok(knowledgePests.some(x=>x.crop===crop.id),crop.id);
 for(const crop of knowledgeCrops)for(const topic of crop.inputTopics)
  assert.ok(knowledgeInputTopics.some(x=>x.id===topic),topic);
});
test('crop and group filters provide meaningful connected results',()=>{
 assert.equal(cropByName('कांदा')?.name,'Onion');
 assert.ok(filterCropInputTopics('Tomato','fungicide').some(x=>x.id==='fungicides'));
 assert.equal(filterCropInputTopics('Other').length,0);
 assert.ok(filterPestDiseaseGuides('Onion','thrips').some(x=>x.name==='Onion thrips'));
 assert.ok(filterPestDiseaseGuides('All crops','whitefly','Insect or mite').length>=2);
 assert.equal(filterPestDiseaseGuides('Onion','','Disease').length,1);
});
test('nutrient library supports multilingual keywords and symptom searches',()=>{
 assert.equal(filterNutrientGuides('जस्त')[0]?.name,'Zinc');
 assert.equal(filterNutrientGuides('लोह')[0]?.name,'Iron');
 assert.ok(filterNutrientGuides('yellow','Micronutrient').length>=1);
 assert.equal(filterNutrientGuides('','Micronutrient').length,5);
 assert.equal(filterNutrientGuides('nonsense').length,0);
});
test('no knowledge record contains pesticide application instructions or doses',()=>{
 for(const issue of knowledgePests){
  const value=[issue.signs,issue.scout,issue.alternatives].join(' ');
  assert.ok(!/(?:\d+\s*(?:ml|g|kg)\s*\/\s*(?:l|lit|ha|acre))|(?:spray at)|(?:apply at)/i.test(value),issue.id);
 }
});
