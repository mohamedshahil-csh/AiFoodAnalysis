import { generateMetabolicInsights } from './src/services/metabolicEngine.js';

// Test Data 1: High Glycemic Meal (White Rice)
const highCarbAnalysis = {
    totals: {
        calories: 500,
        carbs: 80,
        protein: 5,
        fiber: 2,
        gl: 25, // High GL
        fat: 10,
        sugar: 15,
        saturatedFat: 2
    },
    mappedIngredients: [{ name: 'White Rice', portionGrams: 300 }],
    clinical: { nova: { group: 4 } }
};

// Test Data 2: Balanced Meal (Chicken Salad)
const balancedAnalysis = {
    totals: {
        calories: 400,
        carbs: 20,
        protein: 35,
        fiber: 12,
        gl: 5, // Low GL
        fat: 15,
        sugar: 3,
        saturatedFat: 2
    },
    mappedIngredients: [
        { name: 'Chicken', portionGrams: 150 },
        { name: 'Salad', portionGrams: 200 }
    ],
    clinical: { nova: { group: 1 } }
};

console.log("--- METABOLIC ENGINE VERIFICATION ---");

console.log("\n[TEST 1: HIGH CARB MEAL]");
const insight1 = generateMetabolicInsights(highCarbAnalysis);
console.log("Risk Level:", insight1.risk.riskLevel);
console.log("Consumption Advice:", insight1.consumptionAdvice.frequency, `(${insight1.consumptionAdvice.rating})`);
console.log("Predicted Spike:", insight1.spike.peakMgdl, "mg/dL");
console.log("Carb:Fiber Ratio:", insight1.features.carbToFiber);
console.log("CGM Correlation:", insight1.correlation.pattern);

console.log("\n[TEST 2: BALANCED MEAL]");
const insight2 = generateMetabolicInsights(balancedAnalysis);
console.log("Risk Level:", insight2.risk.riskLevel);
console.log("Consumption Advice:", insight2.consumptionAdvice.frequency, `(${insight2.consumptionAdvice.rating})`);
console.log("Predicted Spike:", insight2.spike.peakMgdl, "mg/dL");
console.log("Carb:Fiber Ratio:", insight2.features.carbToFiber);
console.log("CGM Correlation:", insight2.correlation.pattern);

console.log("\n--- VERIFICATION END ---");
