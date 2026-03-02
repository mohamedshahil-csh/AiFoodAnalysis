import * as clinical from './src/utils/clinicalLogic.js';
import { mapIngredientsToNutrition, calculateTotals } from './src/services/databaseMapping.js';

// Test Data: South Indian Breakfast Thali decomposition
const testIngredients = [
    { name: 'Idli', portionGrams: 150 },
    { name: 'Sambar', portionGrams: 100 },
    { name: 'Vada', portionGrams: 50 },
    { name: 'Chutney', portionGrams: 30 }
];

console.log("--- START VERIFICATION ---");

// 1. Database Mapping & Normalization
const mapped = mapIngredientsToNutrition(testIngredients);
console.log("Mapped Ingredients Count:", mapped.length);
const totals = calculateTotals(mapped);
console.log("Total Calories:", totals.calories, "kcal");
console.log("Total Sodium:", totals.sodium, "mg");

// 2. Clinical Logic - Glycemic Load
const gl = clinical.calculateGlycemicLoad(mapped);
console.log("Glycemic Load:", gl);

// 3. Clinical Logic - Geriatric Insights
const geriatric = clinical.getGeriatricInsights(mapped, totals);
console.log("Geriatric Insights Count:", geriatric.length);
geriatric.forEach(i => console.log(" -", i));

// 4. Clinical Logic - Weight Mgmt Score
const weightScore = clinical.calculateWeightMgmtScore(totals);
console.log("Weight Management Score:", weightScore, "/ 10");

// 5. Clinical Logic - Cardiac & Renal
const cardiac = clinical.getCardiacAlerts(totals);
const renal = clinical.checkRenalCompatibility(totals);
console.log("Cardiac Alerts:", cardiac.length > 0 ? cardiac : "None");
console.log("Renal Compatible:", renal.isCompatible);

console.log("--- VERIFICATION END ---");
