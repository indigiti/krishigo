/**
 * KrishiGo educational starter library, version 1.
 * Original short summaries written for staging. These references do NOT verify
 * current Indian product registration, suitability, label directions or dosage.
 */
export type CropGuide={
 id:string;name:string;marathi:string;hindi:string;group:string;summary:string;
 observe:string[];inputTopics:string[];sourceTitle:string;sourceUrl:string;
};
export type InputTopic={
 id:string;name:string;kind:'Crop protection'|'Nutrition'|'Biological'|'Soil & water';
 overview:string;check:string;sourceTitle:string;sourceUrl:string;
};
export const knowledgeCrops:readonly CropGuide[]=[
 {id:'tomato',name:'Tomato',marathi:'टोमॅटो',hindi:'टमाटर',group:'Vegetable',
  summary:'A fruiting vegetable where leaf spots, insect feeding and irregular watering can produce overlapping visible symptoms.',
  observe:['Check upper and lower leaf surfaces','Record growth stage and fruit condition','Note recent rain, humidity and irrigation'],
  inputTopics:['insecticides','fungicides','water-soluble','micronutrients','biologicals','herbicides'],
  sourceTitle:'TNAU · Tomato protection index',sourceUrl:'https://agritech.tnau.ac.in/crop_protection/crop_prot_crop%20diseases_veg_tomato.html'},
 {id:'onion',name:'Onion',marathi:'कांदा',hindi:'प्याज़',group:'Vegetable',
  summary:'An important bulb crop; leaf-tip drying and surface markings can have multiple pest, disease or growing-condition causes.',
  observe:['Inspect silvery leaf streaks and tip drying','Record leaf age and soil moisture','Check bulbs and field drainage separately'],
  inputTopics:['insecticides','fungicides','micronutrients','water-soluble','soil-tests','herbicides'],
  sourceTitle:'TNAU · Onion thrips and diseases',sourceUrl:'https://agritech.tnau.ac.in/crop_protection/crop_prot_crop_insect-veg_onion_pest%26disease.html'},
 {id:'sugarcane',name:'Sugarcane',marathi:'ऊस',hindi:'गन्ना',group:'Cash crop',
  summary:'A long-duration crop in which stand establishment, central-shoot damage and soil or irrigation conditions matter.',
  observe:['Inspect central shoots and basal boreholes','Record cane age and field history','Track irrigation and growth uniformity'],
  inputTopics:['insecticides','fungicides','water-soluble','secondary','soil-tests','biologicals'],
  sourceTitle:'TNAU · Sugarcane crop protection',sourceUrl:'https://agritech.tnau.ac.in/expert_system/sugar/cropprotection.html'},
 {id:'soybean',name:'Soybean',marathi:'सोयाबीन',hindi:'सोयाबीन',group:'Pulse / oilseed',
  summary:'An oilseed legume where leaf-feeding insects, stem injury, root health and nodulation merit separate checks.',
  observe:['Inspect leaves for feeding and egg masses','Check stem girdling or breakage','Record rainfall and root or nodule condition'],
  inputTopics:['insecticides','fungicides','biologicals','micronutrients','soil-tests','herbicides'],
  sourceTitle:'TNAU · Soybean girdle beetle',sourceUrl:'https://www.agritech.tnau.ac.in/crop_protection/soyabean/crop_prot_crop_insect_pulsh_soyabean_8.html'},
 {id:'grapes',name:'Grapes',marathi:'द्राक्ष',hindi:'अंगूर',group:'Fruit',
  summary:'A perennial vine where leaf surface patterns, fruit cluster condition and canopy humidity help distinguish likely causes.',
  observe:['Examine both sides of leaves and bunches','Record canopy humidity and recent rain','Note which vine parts were affected first'],
  inputTopics:['fungicides','insecticides','micronutrients','secondary','water-soluble','soil-tests'],
  sourceTitle:'TNAU · Grapes downy mildew',sourceUrl:'https://agritech.tnau.ac.in/crop_protection/grapes_diseases_1.html'},
 {id:'cotton',name:'Cotton',marathi:'कापूस',hindi:'कपास',group:'Fibre crop',
  summary:'Field scouting considers sucking insects, foliage symptoms and square or boll damage at different crop stages.',
  observe:['Look under leaves for small sucking insects','Check terminals, squares and bolls','Record affected plot area and crop age'],
  inputTopics:['insecticides','biologicals','micronutrients','soil-tests','water-soluble','herbicides'],
  sourceTitle:'TNAU · Cotton IPM reference',sourceUrl:'https://agritech.tnau.ac.in/crop_protection/crop_prot_ipm_cotton.html'},
 {id:'pomegranate',name:'Pomegranate',marathi:'डाळिंब',hindi:'अनार',group:'Fruit',
  summary:'A fruit crop where fruit and leaf spots, insect tunnelling and orchard moisture conditions need careful differentiation.',
  observe:['Inspect fruit surfaces and entry holes','Check leaves, twigs and canopy distribution','Record irrigation, humidity and affected fruit stage'],
  inputTopics:['fungicides','insecticides','micronutrients','secondary','water-soluble','soil-tests'],
  sourceTitle:'TNAU · Pomegranate fruit pests',sourceUrl:'https://agritech.tnau.ac.in/crop_protection/pests%20of%20pome_pest%26disease.html'},
 {id:'chilli',name:'Chilli',marathi:'मिरची',hindi:'मिर्च',group:'Vegetable',
  summary:'A fruiting vegetable; curled leaves and fruit markings require separation of insects, diseases and nutrient or water stress.',
  observe:['Check leaf undersides for insects','Compare young leaves with older growth','Record flower and fruit symptoms separately'],
  inputTopics:['insecticides','fungicides','micronutrients','water-soluble','biologicals','soil-tests'],
  sourceTitle:'CABI · PlantwisePlus crop health reference',sourceUrl:'https://www.cabi.org/plantwiseplus/resources/'}
];
const sourceCrop='https://www.india.gov.in/category/agriculture-rural-environment/subcategory/resources-for-agriculture/details/information-on-integrated-pest-management-package-for-different-crops';
const sourceNutrient='https://www.rhs.org.uk/prevention-protection/nutrient-deficiencies';
export const knowledgeInputTopics:readonly InputTopic[]=[
 {id:'insecticides',name:'Insecticides',kind:'Crop protection',overview:'Products intended for particular insect pests. The active ingredient, formulation, crop and insect must each match an applicable authorized label.',check:'Confirm pest identity, registration, target crop, safety equipment, pre-harvest interval and source date.',sourceTitle:'ICAR-NCIPM · Crop IPM programmes',sourceUrl:sourceCrop},
 {id:'fungicides',name:'Fungicides',kind:'Crop protection',overview:'Products used for certain fungal or oomycete crop diseases. Similar leaf symptoms do not establish the disease or justify a fungicide.',check:'Confirm disease, approved crop claim, mode of action, resistance management and label precautions.',sourceTitle:'ICAR-NCIPM · Crop IPM programmes',sourceUrl:sourceCrop},
 {id:'herbicides',name:'Herbicides',kind:'Crop protection',overview:'Weed-control products differ in selectivity and timing. A general weed label is not a crop-use approval.',check:'Identify weed species, crop, growth stage, neighboring crops and registered label restrictions.',sourceTitle:'TNAU · Crop protection library',sourceUrl:'https://www.agritech.tnau.ac.in/crop_protection/crop_prot.html'},
 {id:'water-soluble',name:'Water-soluble fertilizers',kind:'Nutrition',overview:'Dissolvable plant-nutrient formulations such as NPK grades. Grade numbers usually express nitrogen (N), phosphate (P₂O₅) and potash (K₂O) by percentage.',check:'Read product analysis, water quality, nutrients already supplied and agronomist-validated plan before use.',sourceTitle:'RHS · Nutrient requirements',sourceUrl:sourceNutrient},
 {id:'micronutrients',name:'Micronutrients',kind:'Nutrition',overview:'Iron, zinc, manganese, boron, copper and molybdenum are needed in small quantities. Excess can also harm plants.',check:'Use laboratory values with methods, units and crop-specific ranges; avoid visual-only correction.',sourceTitle:'UC IPM · Nutrient deficiency overview',sourceUrl:'https://ipm.ucanr.edu/home-and-landscape/nutrient-deficiencies/'},
 {id:'secondary',name:'Secondary macronutrients',kind:'Nutrition',overview:'Calcium, magnesium and sulphur support plant growth. Availability may depend on roots, soil pH and water conditions.',check:'Interpret soil and tissue tests and account for other nutrient sources.',sourceTitle:'RHS · Nutrient deficiency guide',sourceUrl:sourceNutrient},
 {id:'biologicals',name:'Biopesticides and biofertilizers',kind:'Biological',overview:'Biological inputs may contain microbes or other biological agents; viability, formulation and authorized claims vary.',check:'Confirm organism/strain, registration or conformity, storage conditions and expiry.',sourceTitle:'CABI · PlantwisePlus resources',sourceUrl:'https://www.cabi.org/plantwiseplus/resources/'},
 {id:'soil-tests',name:'Soil and tissue testing',kind:'Soil & water',overview:'Laboratory tests help distinguish nutrient limitations from problems with soil pH, roots, moisture or crop disease.',check:'Record sample depth, lab, method, units, date and crop stage before interpreting.',sourceTitle:'UC IPM · Nutrient deficiencies in vegetables',sourceUrl:'https://ipm.ucanr.edu/home-and-landscape/nutrient-deficiencies-vegetables/'}
];
