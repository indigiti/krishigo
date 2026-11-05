/**
 * Illustrative catalogue data for the database-free KrishiGo staging UI.
 * These are NOT registered commercial products, approved crop uses, laboratory
 * reference ranges, live retail offers or compatibility endorsements.
 */
export type InputCategory = 'Water-soluble fertilizer'|'Micronutrient'|'Insecticide'|'Fungicide'|'Herbicide'|'Biofertilizer'|'Soil amendment'|'Biopesticide';
export type InputReference = {
 id:string; title:string; category:InputCategory; composition:string;
 cropScope:string; evidence:'Unverified example'; description:string;
};
export const inputReferences:readonly InputReference[]=[
 {id:'nutrient-npk',title:'NPK 19:19:19 — example grade',category:'Water-soluble fertilizer',composition:'19% N · 19% P₂O₅ · 19% K₂O (nominal grade)',cropScope:'No crop recommendation',evidence:'Unverified example',description:'Example of a balanced water-soluble fertilizer grade; actual specifications require the manufacturer label.'},
 {id:'nutrient-zinc',title:'Zinc sulphate — example category',category:'Micronutrient',composition:'Zinc and sulphur; analysis depends on formulation',cropScope:'No crop recommendation',evidence:'Unverified example',description:'Micronutrient source category. Confirm specification, grade and soil-test interpretation.'},
 {id:'chemical-fungicide',title:'Fungicide — example record',category:'Fungicide',composition:'Active ingredient not provided',cropScope:'Registration and crop use not verified',evidence:'Unverified example',description:'A registered crop–disease–formulation label must be verified before displaying use advice.'},
 {id:'chemical-herbicide',title:'Herbicide — example record',category:'Herbicide',composition:'Active ingredient not provided',cropScope:'Registration and crop use not verified',evidence:'Unverified example',description:'Crop selectivity and legal uses cannot be inferred from a product category.'},
 {id:'chemical-insecticide',title:'Insecticide — example record',category:'Insecticide',composition:'Active ingredient not provided',cropScope:'Registration and crop use not verified',evidence:'Unverified example',description:'No dose, mixing or treatment instructions without verified locally applicable label.'},
 {id:'biological-bio',title:'Biofertilizer — example category',category:'Biofertilizer',composition:'Organism, viability and storage not specified',cropScope:'No verified claim',evidence:'Unverified example',description:'Biological product records require approved quality and shelf-life evidence.'},
 {id:'biological-pest',title:'Biopesticide — example category',category:'Biopesticide',composition:'Strain and formulation not provided',cropScope:'Registered use not verified',evidence:'Unverified example',description:'Verify registration, claimed uses and storage before recommending.'},
 {id:'soil-amendment',title:'Soil amendment — example category',category:'Soil amendment',composition:'Analysis not supplied',cropScope:'Requires soil-test context',evidence:'Unverified example',description:'Amendments depend on lab analysis and qualified local guidance.'}
];
export const inputCategories=['All',...Array.from(new Set(inputReferences.map(x=>x.category)))];
/** Curated search aliases only, not machine-translated agricultural advice. */
export const inputSearchAliases:Readonly<Record<string,string>>={
 'कीटकनाशक':'insecticide','कीटनाशक':'insecticide','बुरशीनाशक':'fungicide','कवकनाशी':'fungicide',
 'तणनाशक':'herbicide','खरपतवारनाशी':'herbicide','सूक्ष्म अन्नद्रव्य':'micronutrient',
 'सूक्ष्म पोषक तत्व':'micronutrient','खत':'fertilizer','उर्वरक':'fertilizer',
 'जस्त':'zinc','जिंक':'zinc','लोह':'iron','लोहा':'iron','कॅल्शियम':'calcium',
 'नत्र':'nitrogen','नायट्रोजन':'nitrogen','पोटॅश':'potash','पोटाश':'potash'
};
export function filterInputReferences(term:string,category:string):InputReference[]{
 const raw=term.trim().toLocaleLowerCase('en-IN');
 const q=inputSearchAliases[raw]||raw;
 return inputReferences.filter(x=>(category==='All'||x.category===category)&&(!q||[x.title,x.category,x.composition,x.description].join(' ').toLocaleLowerCase('en-IN').includes(q)));
}
export function safeNutrientEquivalent(targetKg:number,percent:number):number|null{
 if(!Number.isFinite(targetKg)||!Number.isFinite(percent)||targetKg<=0||percent<=0||percent>100)return null;
 const answer=targetKg*100/percent;
 return Number.isFinite(answer)&&answer<=1_000_000?answer:null;
}
export function classifyBatchDate(iso:string,today:string):'Expired'|'Review soon'|'Date recorded'|'Invalid date'{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(iso)||!Number.isFinite(Date.parse(iso))||new Date(iso).toISOString().slice(0,10)!==iso)return 'Invalid date';
 if(iso<today)return 'Expired';
 const days=Math.round((Date.parse(iso)-Date.parse(today))/86400000);
 return days<=30?'Review soon':'Date recorded';
}
export type InputFeature={
 id:'crop'|'pests'|'nutrients'|'compare'|'label'|'soil'|'planner'|'history'|'compatibility'|'prices'|'batches'|'expert';
 title:string; summary:string; state:'Interactive preview'|'Intake preview';
};
export const inputFeatures:readonly InputFeature[]=[
 {id:'crop',title:'Crop-wise input discovery',summary:'Explore input categories and crop-use evidence requirements.',state:'Interactive preview'},
 {id:'pests',title:'Pest & disease library',summary:'Understand symptom groups without assuming a diagnosis.',state:'Interactive preview'},
 {id:'nutrients',title:'Nutrient deficiency library',summary:'Learn which observations need soil or tissue tests.',state:'Interactive preview'},
 {id:'compare',title:'Product comparison',summary:'Compare composition, label evidence and claims.',state:'Interactive preview'},
 {id:'label',title:'Label scanner',summary:'Prepare label images for later OCR and validation.',state:'Intake preview'},
 {id:'soil',title:'Soil test interpreter',summary:'Record laboratory values and review missing context.',state:'Intake preview'},
 {id:'planner',title:'Fertilizer planning assistant',summary:'Transparent nutrient-equivalent arithmetic only.',state:'Interactive preview'},
 {id:'history',title:'Application history',summary:'Temporary farm activity entries for review.',state:'Interactive preview'},
 {id:'compatibility',title:'Compatibility reference',summary:'No mixing assertion without label evidence.',state:'Interactive preview'},
 {id:'prices',title:'Price & availability',summary:'Create an unsent local supplier enquiry.',state:'Intake preview'},
 {id:'batches',title:'Expiry & batch tracking',summary:'Record dates and see expiry reminders.',state:'Interactive preview'},
 {id:'expert',title:'Expert consultation',summary:'Prepare an unsent agronomist review case.',state:'Intake preview'}
];
