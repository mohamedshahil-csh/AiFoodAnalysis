/**
 * Clinical nutritional logic for specialized dietary requirements.
 */

// Glycemic Index (GI) database for common food ingredients (simplified)
const GI_DATABASE = {
    'white rice': 73,
    'brown rice': 68,
    'whole wheat bread': 50,
    'white bread': 75,
    'dal': 15,
    'dal fry': 15,
    'chicken': 0,
    'paneer': 0,
    'potato': 78,
    'sweet potato': 63,
    'apple': 36,
    'banana': 51,
    'milk': 31,
    'yogurt': 27,
};

/**
 * Drug-Nutrient Interaction Alerts
 */
export const getDrugNutrientAlerts = (ingredients) => {
    const alerts = [];
    const names = ingredients.map(i => i.name.toLowerCase());

    if (names.some(n => n.includes('spinach') || n.includes('kale') || n.includes('broccoli') || n.includes('leafy'))) {
        alerts.push({ drug: "Warfarin", warning: "High Vitamin K: Maintain consistent intake to avoid clotting risk." });
    }
    if (names.some(n => n.includes('grapefruit'))) {
        alerts.push({ drug: "Statins", warning: "Avoid grapefruit: May increase medication levels in blood." });
    }
    if (names.some(n => n.includes('milk') || n.includes('cheese') || n.includes('yogurt'))) {
        alerts.push({ drug: "Antibiotics (Tetracyclines)", warning: "Calcium can bind to meds; take 2h apart." });
    }
    return alerts;
};

/**
 * Allergen detection based on ingredient names
 */
export const detectAllergens = (ingredients) => {
    const allergens = [];
    const names = ingredients.map(i => i.name.toLowerCase());

    const checks = [
        { key: 'Gluten', terms: ['wheat', 'flour', 'roti', 'bread', 'maida', 'pasta', 'noodle', 'attas', 'chapati'] },
        { key: 'Dairy', terms: ['milk', 'cheese', 'paneer', 'butter', 'ghee', 'cream', 'yogurt', 'curd', 'paneer'] },
        { key: 'Nuts', terms: ['peanut', 'almond', 'cashew', 'walnut', 'pistachio', 'hazelnut'] },
        { key: 'Shellfish', terms: ['shrimp', 'prawn', 'crab', 'lobster'] },
        { key: 'Soy', terms: ['soy', 'tofu', 'edamame'] }
    ];

    checks.forEach(check => {
        if (names.some(name => check.terms.some(term => name.includes(term)))) {
            allergens.push(check.key);
        }
    });

    return allergens;
};

/**
 * Gout Management: Purine content estimation
 */
export const getPurineStatus = (ingredients) => {
    const names = ingredients.map(i => i.name.toLowerCase());
    const highPurine = ['chicken', 'mutton', 'beef', 'fish', 'shrimp', 'organ meat', 'alcohol', 'beer'];

    const matches = names.filter(n => highPurine.some(hp => n.includes(hp)));
    if (matches.length > 0) return { status: 'High', warning: 'Contains purine-rich proteins; monitor uric acid.' };
    return { status: 'Low/Moderate', warning: 'Generally safe for gout management.' };
};

/**
 * Digestive Health: FODMAP Classification
 */
export const getFodmapStatus = (ingredients) => {
    const names = ingredients.map(i => i.name.toLowerCase());
    const highFodmap = ['onion', 'garlic', 'wheat', 'milk', 'apple', 'beans', 'lentils', 'cauliflower', 'mushroom'];

    const matches = names.filter(n => highFodmap.some(hf => n.includes(hf)));
    if (matches.length > 0) return { status: 'High FODMAP', items: matches };
    return { status: 'Low FODMAP', items: [] };
};

/**
 * Chronic Inflammation Index (Qualitative)
 */
export const calculateInflammationScore = (ingredients, totals) => {
    let score = 0; // Negative is anti-inflammatory
    const names = ingredients.map(i => i.name.toLowerCase());

    // Anti-inflammatory boosters
    if (names.some(n => n.includes('turmeric') || n.includes('ginger') || n.includes('garlic'))) score -= 2;
    if (names.some(n => n.includes('berries') || n.includes('leafy greens'))) score -= 2;
    if (names.some(n => n.includes('walnut') || n.includes('fish'))) score -= 1;

    // Pro-inflammatory triggers
    if (totals.sugar > 10) score += 2;
    if (totals.saturatedFat > 5) score += 2;
    if (names.some(n => n.includes('fried') || n.includes('refined'))) score += 3;

    if (score < -2) return "Highly Anti-inflammatory";
    if (score < 1) return "Neutral/Stable";
    return "Pro-inflammatory potential";
};

/**
 * Calculates Glycemic Load (GL)
 * GL = (GI * Net Carbs) / 100
 */
export const calculateGlycemicLoad = (ingredients) => {
    let totalGL = 0;
    ingredients.forEach(item => {
        const gi = GI_DATABASE[item.name.toLowerCase()] || 50; // Default to mid-range
        const gl = (gi * (item.carbs || 0)) / 100;
        totalGL += gl;
    });
    return totalGL.toFixed(1);
};

/**
 * Calculates Diabetic Exchange Equivalents
 * 1 starch exchange = 15g carbs
 * 1 fruit exchange = 15g carbs
 * 1 dairy exchange = 12g carbs
 * 1 meat exchange = 7g protein, 3-5g fat
 * 1 veg exchange = 5g carbs, 2g protein
 */
export const calculateDiabeticExchanges = (totals) => {
    return {
        starch: (totals.carbs / 15).toFixed(1),
        meat: (totals.protein / 7).toFixed(1),
        fat: (totals.fat / 5).toFixed(1),
    };
};

/**
 * Cardiac Risk Assessment
 * Alerts for high sodium and saturated fat
 */
export const getCardiacAlerts = (totals) => {
    const alerts = [];
    if (totals.sodium > 2300) alerts.push("High Sodium Content (>2300mg)");
    if (totals.saturatedFat > 13) alerts.push("High Saturated Fat (>13g)"); // Based on 2000 kcal diet
    return alerts;
};

/**
 * Renal Diet Compatibility
 * Checks Potassium, Phosphorus, and Sodium
 */
export const checkRenalCompatibility = (totals) => {
    const issues = [];
    if (totals.potassium > 2000) issues.push("High Potassium");
    if (totals.phosphorus > 1000) issues.push("High Phosphorus");
    if (totals.sodium > 2000) issues.push("High Sodium");
    return {
        isCompatible: issues.length === 0,
        issues
    };
};

/**
 * Geriatric-friendly dietary insights
 */
export const getGeriatricInsights = (ingredients, totals) => {
    const insights = [];
    const proteinDensity = totals.protein / (totals.calories / 4);
    const fiberGrams = totals.fiber || 0;

    if (proteinDensity < 0.25) insights.push("🔴 Muscle Retention Risk: Suggest increasing protein-rich components (dal, paneer, egg).");
    if (fiberGrams < 6) insights.push("🟠 Digestive Health: Low fiber detected. Consider adding whole grains or leafy salads.");
    if (totals.sodium > 1000) insights.push("⚠️ Hypertension Alert: Portion contains >1000mg sodium; check compatibility with BP meds.");

    insights.push("💡 Texture Check: Recommended soft-cooking if swallowing becomes a challenge (mashing/pureeing).");
    insights.push("💧 Hydration: Ensure 200ml water intake with this specific high-protein/sodium meal.");

    return insights;
};

/**
 * Weight Management Scoring (1-10)
 * Evaluates Nutrient Density vs Calorie Load
 */
export const calculateWeightMgmtScore = (totals) => {
    let score = 0;

    // Nutrient Density (Protein & Fiber are positive)
    const pPercent = (totals.protein * 4) / (totals.calories || 1);
    if (pPercent > 0.3) score += 3;
    else if (pPercent > 0.15) score += 1.5;

    if (totals.fiber > 10) score += 3;
    else if (totals.fiber > 5) score += 1.5;

    // Calorie & Sugar Discipline (Negative if high)
    if (totals.calories > 800) score -= 2;
    if (totals.sugar > 15) score -= 2;
    if (totals.saturatedFat > 10) score -= 1;

    // Base shift to 1-10 range
    let finalScore = 5 + score;
    return Math.min(Math.max(Math.round(finalScore), 1), 10);
};

/**
 * NOVA Food Processing Classification (1-4)
 * 1: Unprocessed/Minimally Processed
 * 2: Processed Culinary Ingredients
 * 3: Processed
 * 4: Ultra-processed
 */
export const getNovaClassification = (ingredients) => {
    const names = ingredients.map(i => i.name.toLowerCase());
    const ultraTerms = ['soda', 'chips', 'noodle', 'instant', 'fried', 'refined', 'artificial', 'preservative', 'emulsifier'];
    const processedTerms = ['canned', 'salted', 'sweetened', 'bread', 'cheese'];

    if (names.some(n => ultraTerms.some(term => n.includes(term)))) {
        return { group: 4, label: "Ultra-processed", warning: "High risk for metabolic disease. Contains industrial formulations." };
    }
    if (names.some(n => processedTerms.some(term => n.includes(term)))) {
        return { group: 3, label: "Processed", warning: "Modified with salt, sugar, or fats to increase durability." };
    }
    return { group: 1, label: "Minimally Processed", warning: "Healthy choice. Natural state preserved." };
};

/**
 * DASH Diet Compatibility Score (Hypertension Management)
 */
export const calculateDashScore = (totals) => {
    let score = 0;
    // Positive markers: High Potassium, Magnesium, Calcium, Fiber
    if (totals.potassium > 1000) score += 2;
    if (totals.magnesium > 100) score += 2;
    if (totals.calcium > 300) score += 2;
    if (totals.fiber > 10) score += 2;

    // Negative markers: High Sodium, Sugar, Saturated Fat
    if (totals.sodium > 800) score -= 2;
    if (totals.sugar > 10) score -= 2;
    if (totals.saturatedFat > 5) score -= 1;

    const final = Math.min(Math.max(5 + score, 1), 10);
    return { score: final, status: final > 7 ? "DASH Compliant" : final > 4 ? "Borderline" : "Non-Compliant" };
};

/**
 * Immune Support Index
 */
export const calculateImmuneIndex = (totals) => {
    let score = 0;
    // Weighted micronutrients for immune function
    if (totals.vitC > 50) score += 2.5;
    if (totals.vitA > 500) score += 2.5;
    if (totals.zinc > 5) score += 2.5;
    if (totals.vitD > 5) score += 2.5;

    const final = Math.min(Math.max(Math.round(score), 1), 10);
    return { score: final, rating: final > 7 ? "High Resilience" : final > 4 ? "Moderately Supportive" : "Baseline Support" };
};

/**
 * Antioxidant & Phytonutrient Profile
 */
export const getAntioxidantProfile = (ingredients) => {
    const names = ingredients.map(i => i.name.toLowerCase());
    const phytonutrients = [];

    if (names.some(n => n.includes('tomato'))) phytonutrients.push("Lycopene (Heart Health)");
    if (names.some(n => n.includes('berry') || n.includes('onion') || n.includes('kale'))) phytonutrients.push("Flavonoids (Anti-inflammatory)");
    if (names.some(n => n.includes('carrot') || n.includes('spinach') || n.includes('sweet potato'))) phytonutrients.push("Beta-carotene (Immune/Vision)");
    if (names.some(n => n.includes('turmeric'))) phytonutrients.push("Curcumin (Potent Antioxidant)");

    return {
        varietyScore: phytonutrients.length,
        detected: phytonutrients
    };
};

/**
 * Structured EMR entry generation
 */
export const generateEMREntry = (analysis) => {
    const { totals, findings, clinical: c } = analysis;
    return `DIETARY DIAGNOSTIC REPORT: ${findings.dishName.toUpperCase()}
--------------------------------------------------
PORTION ANALYSIS:
Calories: ${totals.calories} kcal | Glycemic Load: ${c.gl}
Macros: P: ${totals.protein}g, C: ${totals.carbs}g, F: ${totals.fat}g
Micros: Fiber: ${totals.fiber}g, Sodium: ${totals.sodium}mg, Pot: ${totals.potassium}mg
Minerals: Ca: ${totals.calcium}mg, Fe: ${totals.iron}mg, Mag: ${totals.magnesium}mg

CLINICAL BIOMETRICS:
- Processing Index: NOVA Group ${c.nova.group} (${c.nova.label})
- DASH Compliance: ${c.dash.score}/10 (${c.dash.status})
- Immune Resilience: ${c.immune.score}/10
- Metabolic Risk: ${c.metabolic.risk.riskLevel.toUpperCase()}
- Inflammation: ${c.inflammation}

ARCHIVE METADATA:
Dish: ${findings.dishName} | Cuisine: ${findings.cuisine}
Interaction Alerts: ${c.drugAlerts.length > 0 ? c.drugAlerts.map(a => a.drug).join(', ') : 'None'}`;
};
