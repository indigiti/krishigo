# M18 — Agricultural Inputs Starter Knowledge Library

Status: educational static dataset in KrishiGo Module 11 (staging). Not a crop diagnosis service or a currently verified pesticide, fertilizer or retailer product catalogue.

## Scope shipped
- 8 crop profiles: Tomato, Onion, Sugarcane, Soybean, Grapes, Cotton, Pomegranate, Chilli.
- 15 crop-linked pest and disease recognition guides with common signs, suggested observation steps and lookalike causes.
- 11 primary, secondary and micronutrient reference guides explaining nutrient roles, possible signs, plant location, tests and lookalikes.
- 8 informational input-class guides: insecticides, fungicides, herbicides, water-soluble fertilizers, micronutrients, secondary macronutrients, biological inputs, and soil/tissue testing.
- Crop selectors, group selectors, keyword search and curated Marathi/Hindi search aliases; crop display names in English, Marathi and Hindi.
- Original-source outbound URLs from TNAU agricultural extension, ICAR-NCIPM public portal, CABI PlantwisePlus, UC IPM, Cornell, RHS and Arizona Extension.
- Responsive educational cards with clear staging disclosures and no chemical doses, treatment plans, product registration approvals or AI diagnoses.

## Source controls
Each guide carries an HTTPS primary extension or educational reference. Linked source pages may include older pesticide active ingredients and doses that are NOT imported into KrishiGo and must NOT be followed without checking the current official Indian label and regulator information. The source link is evidence for an educational symptom description, not a current legal verification of a product.

The supplied English summaries are independent short paraphrases. Local-language crop names and keyword aliases do not constitute translated, agronomist-reviewed full regional-language guides.

## Implementation
- agriKnowledgeCore.ts — crops and basic input category guides
- agriKnowledgePests.ts — crop-linked field issue summaries
- agriKnowledgeNutrients.ts — nutrient facts
- agriKnowledgeSearch.ts — small pure search/filter functions
- AgriKnowledgeLibrary.tsx — searchable accessible reference UI embedded in existing crop, pest and nutrient workspaces
- AgriInputs.tsx — integrates all three library sections; no additional sidebar item or module duplication
- styles.css — Forest, Sand and Night design tokens, mobile and tablet responsive cards
- agriKnowledge.test.mjs and agri-inputs.spec.ts — data coverage, links, filters, browser interactions

## Publication gates
Before calling this library a verified agronomic knowledge service:
1. Verify each source and its current relevance against local conditions and authoritative Indian guidance.
2. Obtain qualified agronomist/editor review per crop/topic and save review metadata.
3. Implement full professionally reviewed Hindi and Marathi content, not machine-only translation.
4. Add versioned citations, revision dates, stale-data alerts and a review/unpublish workflow.
5. Source any real registered plant-protection products separately through official current approved labels, crop/pest claims, registration and legal checks.
6. Conduct real farmer usability, accessibility and mobile acceptance tests on the deployed Cloudways environment.

The library is available in the static staging build; it does not require the protected JSON API or external accounts. It intentionally does not send any notification or make a farm management decision.
