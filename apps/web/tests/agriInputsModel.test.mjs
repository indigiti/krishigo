import test from 'node:test';
import assert from 'node:assert/strict';
import {filterInputReferences,inputFeatures,safeNutrientEquivalent,classifyBatchDate} from '../src/features/agriInputsModel.ts';

test('twelve input discovery and field tools remain present',()=>{
 assert.equal(inputFeatures.length,12);
 assert.equal(new Set(inputFeatures.map(x=>x.id)).size,12);
});
test('curated Hindi and Marathi keywords match reference category',()=>{
 const hindi=filterInputReferences('कीटनाशक','All');
 assert.ok(hindi.some(x=>x.category==='Insecticide'));
 const marathi=filterInputReferences('सूक्ष्म अन्नद्रव्य','All');
 assert.ok(marathi.some(x=>x.category==='Micronutrient'));
 assert.equal(filterInputReferences('missing-example-keyword','All').length,0);
});
test('nutrient equivalent is arithmetic, bounded and not a crop recommendation',()=>{
 assert.equal(safeNutrientEquivalent(1.9,19),10);
 assert.equal(safeNutrientEquivalent(-1,19),null);
 assert.equal(safeNutrientEquivalent(1,0),null);
 assert.equal(safeNutrientEquivalent(1,101),null);
});
test('invalid and old batch dates are differentiated',()=>{
 assert.equal(classifyBatchDate('2020-01-01','2026-11-05'),'Expired');
 assert.equal(classifyBatchDate('2026-11-20','2026-11-05'),'Review soon');
 assert.equal(classifyBatchDate('2026-02-30','2026-11-05'),'Invalid date');
});
