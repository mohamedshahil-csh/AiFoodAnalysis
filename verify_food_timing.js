import { generateMetabolicInsights } from './src/services/metabolicEngine.js';

// Test Case: Idly (Steamed, Low GL, NOVA 1)
const idlyAnalysis = {
    totals: {
        calories: 150,
        carbs: 30,
        protein: 5,
        fat: 1,
        fiber: 2,
        gl: 8
    },
    mappedIngredients: [
        { name: 'Idly', portionGrams: 100 }
    ],
    clinical: {
        nova: { group: 1, label: 'Minimally Processed' }
    }
};

console.log("--- FOOD-AWARE TIMING VERIFICATION ---");

const insights = generateMetabolicInsights(idlyAnalysis);

console.log("\n[ANALYSIS FOR IDLY]");
console.log("Current Timing Impact:", insights.spike.timingImpact);
console.log("Optimal Meal Window:", insights.optimalWindow.perfectTime);
console.log("Recommendation Reason:", insights.optimalWindow.reason);
console.log("Predicted Spike (Standard):", Math.round((30 * 1.5) - (2 * 2) - (5 * 0.5)), "mg/dL");
console.log("Predicted Spike (Adjusted for Steamed):", insights.spike.peakMgdl, "mg/dL");

if (insights.spike.peakMgdl < (30 * 1.5 - 2 * 2 - 5 * 0.5)) {
    console.log("\nSUCCESS: Spike correctly dampened for steamed preparation.");
}

if (insights.optimalWindow.perfectTime.includes("Dinner")) {
    console.log("SUCCESS: Recommended for Dinner due to high digestibility.");
}

console.log("\n--- VERIFICATION END ---");
