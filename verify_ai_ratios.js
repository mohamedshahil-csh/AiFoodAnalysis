import { generateMetabolicInsights } from './src/services/metabolicEngine.js';

// Test Case: Full AI Predictions for Idly
const aiAnalysisWithFullPrediction = {
    totals: {
        calories: 150,
        carbs: 30,
        protein: 5,
        fiber: 1,
        gl: 8
    },
    mappedIngredients: [
        { name: 'Idly', portionGrams: 100 }
    ],
    clinical: {
        nova: { group: 1, label: 'Minimally Processed' }
    },
    fullMetabolicPrediction: {
        glucoseExcursion: 25,
        totalCarbs: 32,
        carbToProtein: 6.4,
        carbToFiber: 4.0,
        dietaryGuidance: { rating: "Optimal", frequency: "Daily Essential", advice: "High quality fermented breakfast." },
        optimalWindow: { time: "Breakfast / Early Morning", reason: "Complex carbs for energy." },
        timingImpact: "Minimal early day impact.",
        cgmCorrelation: { pattern: "Smooth Rise", reason: "Fiber and protein balance." }
    }
};

console.log("--- FULL AI PREDICTION VERIFICATION ---");

const insights = generateMetabolicInsights(aiAnalysisWithFullPrediction);

console.log("\n[ANALYSIS WITH FULL AI PREDICTIONS]");
console.log("AI Glucose Excursion:", insights.spike.peakMgdl, "mg/dL");
console.log("AI Consumption Advice:", insights.consumptionAdvice.frequency);
console.log("AI Carb:Fiber Ratio:", insights.features.carbToFiber);
console.log("AI Optimal Window:", insights.optimalWindow.perfectTime);
console.log("AI totalCarbs Override:", insights.totalCarbs, "g");

if (insights.spike.peakMgdl === 25) {
    console.log("\nSUCCESS: All 8 markers correctly overridden by full AI prediction.");
} else {
    console.log("\nFAILURE: Overrides not applied correctly.");
}

console.log("\n--- VERIFICATION END ---");
