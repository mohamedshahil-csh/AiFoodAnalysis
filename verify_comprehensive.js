import { calculateDashScore, calculateImmuneIndex, getNovaClassification, getAntioxidantProfile } from './src/utils/clinicalLogic.js';

// Test Case 1: Ultra-processed High Sodium (Deep Fried Chips + Soda)
const ultraProcessedMeal = [
    { name: 'Deep Fried Potato Chips', portionGrams: 100 },
    { name: 'Soda', portionGrams: 330 }
];
const ultraTotals = {
    calories: 600,
    carbs: 80,
    protein: 2,
    fat: 35,
    sodium: 1200, // Very high
    potassium: 100,
    magnesium: 10,
    calcium: 20,
    fiber: 1,
    sugar: 40,
    saturatedFat: 12
};

// Test Case 2: Immune-Boosting Low-Processed (Kale Salad + Turmeric Chicken)
const immuneMeal = [
    { name: 'Kale Salad', portionGrams: 200 },
    { name: 'Turmeric Chicken', portionGrams: 150 },
    { name: 'Tomato', portionGrams: 50 }
];
const immuneTotals = {
    calories: 350,
    carbs: 10,
    protein: 35,
    fat: 15,
    sodium: 250,
    potassium: 1200, // High
    magnesium: 150, // High
    calcium: 400, // High
    fiber: 12, // High
    sugar: 2,
    saturatedFat: 2,
    vitC: 90, // High
    vitA: 800, // High
    zinc: 8, // High
    vitD: 10 // High
};

console.log("--- COMPREHENSIVE HEALTH DATA VERIFICATION ---");

console.log("\n[TEST 1: ULTRA-PROCESSED MEAL]");
const nova1 = getNovaClassification(ultraProcessedMeal);
const dash1 = calculateDashScore(ultraTotals);
const immune1 = calculateImmuneIndex(ultraTotals);
const anti1 = getAntioxidantProfile(ultraProcessedMeal);
console.log("NOVA Group:", nova1.group, `(${nova1.label})`);
console.log("DASH Score:", dash1.score, `(${dash1.status})`);
console.log("Immune Support:", immune1.rating);
console.log("Antioxidants Found:", anti1.detected.length);

console.log("\n[TEST 2: IMMUNE-BOOSTING BALANCED MEAL]");
const nova2 = getNovaClassification(immuneMeal);
const dash2 = calculateDashScore(immuneTotals);
const immune2 = calculateImmuneIndex(immuneTotals);
const anti2 = getAntioxidantProfile(immuneMeal);
console.log("NOVA Group:", nova2.group, `(${nova2.label})`);
console.log("DASH Score:", dash2.score, `(${dash2.status})`);
console.log("Immune Support:", immune2.rating);
console.log("Antioxidants Found:", anti2.detected.length, "(Details:", anti2.detected.join(', '), ")");

console.log("\n--- VERIFICATION END ---");
