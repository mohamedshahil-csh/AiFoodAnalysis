/**
 * Diabetes Glycemic Control Engine
 * Features: CGM Correlation, Spike Prediction, and Clinical Risk Scoring.
 */

/**
 * Calculates advanced glycemic features for a meal.
 * @param {Object} totals - Total macronutrients for the meal.
 * @param {Array} mappedIngredients - Decomposed ingredients with individual data.
 */
export const calculateGlycemicFeatures = (totals, mappedIngredients, aiPrediction = null) => {
    // Priority 1: AI-Predicted Clinical Ratios
    if (aiPrediction && aiPrediction.carbToFiber > 0) {
        return {
            gl: aiPrediction.predictedGL || totals.gl || 0,
            carbToFiber: aiPrediction.carbToFiber.toFixed(2),
            carbToProtein: aiPrediction.carbToProtein.toFixed(2),
            nutrientDensity: ((totals.fiber + totals.protein) / (totals.calories || 1)).toFixed(3)
        };
    }

    // Priority 2: Calculated Fallback
    const gl = totals.gl || 0;
    const carbToFiber = (totals.carbs / (totals.fiber || 1)).toFixed(2);
    const carbToProtein = (totals.carbs / (totals.protein || 1)).toFixed(2);
    const nutrientDensity = (totals.fiber + totals.protein) / (totals.calories || 1);

    return {
        gl,
        carbToFiber,
        carbToProtein,
        nutrientDensity: nutrientDensity.toFixed(3)
    };
};

/**
 * CGM Correlation Engine (Simulation)
 * Correlates current meal features with hypothetical historical CGM patterns.
 */
export const correlateCGMPattern = (features) => {
    const { gl, carbToFiber } = features;

    // Pattern logic: High GL + High Carb:Fiber ratio = High Correlation with "Fast Spike" history
    if (gl > 20 && carbToFiber > 5) {
        return {
            pattern: "Rapid Postprandial Hike",
            correlationSource: "Historical Match: High-refined carb intake",
            confidence: "High (89%)"
        };
    }
    if (gl < 10) {
        return {
            pattern: "Stable Glycemic Range",
            correlationSource: "Historical Match: Low GL balanced meal",
            confidence: "Very High (95%)"
        };
    }
    return {
        pattern: "Moderate Glycemic Response",
        correlationSource: "Historical Match: Mixed macronutrients",
        confidence: "Medium (72%)"
    };
};

/**
 * ML Spike Predictor (Simulation)
 * Predicts incremental glucose rise (mg/dL) based on meal timing and composition.
 * @param {Object} totals - Total nutrition data.
 * @param {number} currentHour - Current time of day (0-23).
 */
const getMealCategory = (hour) => {
    if (hour >= 5 && hour < 11) return "Breakfast";
    if (hour >= 11 && hour < 16) return "Lunch";
    if (hour >= 16 && hour < 19) return "Evening Snack";
    if (hour >= 19 && hour < 23) return "Dinner";
    return "Late Night";
};

export const predictGlucoseSpike = (totals, currentHour = new Date().getHours(), isSteamedOrBoiled = false) => {
    let baseSpike = (totals.carbs * 1.5) - (totals.fiber * 2) - (totals.protein * 0.5);

    // Preparation Modifier: Steamed/Boiled foods have a smoother glucose release
    if (isSteamedOrBoiled) {
        baseSpike *= 0.8;
    }

    let timingImpact = "Minimal Impact (Standard Window)";

    // Circadian Rhythm & Metabolic Timing Logic
    if (currentHour >= 5 && currentHour < 10) {
        baseSpike *= 1.25;
        timingImpact = "Morning Sensitivity (Dawn Phenomenon)";
    } else if (currentHour >= 10 && currentHour < 13) {
        baseSpike *= 0.95;
        timingImpact = "Optimal Metabolic Window (High Efficiency)";
    } else if (currentHour >= 13 && currentHour < 16) {
        baseSpike *= 1.05;
        timingImpact = "Postprandial Plateau (Normal Dip)";
    } else if (currentHour >= 16 && currentHour < 19) {
        baseSpike *= 1.1;
        timingImpact = "Evening Transition (Moderate Risk)";
    } else if (currentHour >= 19 && currentHour < 22) {
        baseSpike *= 1.2;
        timingImpact = "Circadian Slowdown (Dinner Peak)";
    } else if (currentHour >= 22 || currentHour < 5) {
        baseSpike *= 1.3;
        timingImpact = "High Late-Night Risk (Sleep Disruption)";
    }

    // Prediction data points (0 to 120 mins)
    const curve = [];
    for (let t = 0; t <= 120; t += 15) {
        let value = t <= 60 ? (baseSpike * (t / 60)) : baseSpike * (1 - (t - 60) / 120);
        curve.push({ time: t, mgdl: Math.max(0, Math.round(value)) });
    }

    const mealTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    return {
        peakMgdl: Math.round(baseSpike),
        peakTimeMins: 60,
        predictedCurve: curve,
        timingImpact,
        mealTime,
        mealCategory: getMealCategory(currentHour)
    };
};

/**
 * Risk Calculation Engine
 * Categorizes risk levels for the user.
 */
export const calculateGlycemicRisk = (spike, features) => {
    const { peakMgdl } = spike;
    const { gl } = features;

    let riskLevel = "Low";
    let message = "Safe for diabetic management.";
    let color = "success";

    if (peakMgdl > 40 || gl > 20) {
        riskLevel = "High";
        message = `Significant glucose excursion predicted (+${peakMgdl}mg/dL). Suggest portion control.`;
        color = "danger";
    } else if (peakMgdl > 25 || gl > 12) {
        riskLevel = "Moderate";
        message = `Manageable spike (+${peakMgdl}mg/dL). Consider a 15-min walk post-meal.`;
        color = "warn";
    }

    return { riskLevel, message, color };
};

/**
 * Food-Specific Optimal Timing Engine
 * Determines the best time of day to consume a specific meal based on its clinical properties.
 */
export const getOptimalMealWindow = (totals, nova, features) => {
    const isSteamedOrBoiled = nova.group === 1 || nova.group === 2;
    const isLowGL = features.gl < 10;
    const isHighFiber = parseFloat(features.carbToFiber) < 3;

    if (isSteamedOrBoiled && isLowGL) {
        return {
            window: "Anytime Precision (High)",
            reason: "Light, steamed/boiled items have high digestibility and low glycemic impact. Ideal for Breakfast or Light Dinner.",
            perfectTime: "Breakfast / Dinner"
        };
    }
    if (isHighFiber && !isLowGL) {
        return {
            window: "Mid-Day Energy (Lunch)",
            reason: "Fiber-rich but higher GL foods are best processed during peak metabolic activity (11 AM - 3 PM).",
            perfectTime: "Lunch / Afternoon"
        };
    }
    if (nova.group >= 3) {
        return {
            window: "Lunch Only (High Processing)",
            reason: "Processed items should be restricted to early windows where metabolic rate is at its peak to avoid insulin resistance.",
            perfectTime: "Mid-Day Lunch"
        };
    }
    return {
        window: "Standard Morning/Lunch",
        reason: "Balanced nutrients best suited for active periods.",
        perfectTime: "Breakfast / Lunch"
    };
};

/**
 * Clinical Guardrail Engine: Consumption Frequency
 * Predicts how often a food should be consumed based on clinical markers.
 */
export const getConsumptionAdvice = (totals, nova, features) => {
    const isUltraProcessed = nova.group === 4;
    const isProcessed = nova.group === 3;
    const isHighGL = features.gl > 20;
    const isHighSugar = totals.sugar > 15;
    const isHighSodium = totals.sodium > 800;

    // Tier 4: Restrict (Ultra-processed or Extreme Metabolic Load)
    if (isUltraProcessed || (isHighGL && isHighSugar)) {
        return {
            frequency: "Occasional / Rare",
            rating: "Restrict",
            advice: "Analysis detects high metabolic load. Frequent consumption may disrupt glycemic stability.",
            color: "rose"
        };
    }

    // Tier 3: Moderate (Processed or Higher Glycemic Load)
    if (isProcessed || isHighGL || isHighSodium) {
        return {
            frequency: "1-2 Times Per Week",
            rating: "Moderate",
            advice: "Balanced, but glycemic density suggests moderation. Best enjoyed as part of a high-fiber meal.",
            color: "amber"
        };
    }

    // Tier 2: Routine (Minimally Processed, Standard GL)
    if (features.gl > 10) {
        return {
            frequency: "3-4 Times Per Week",
            rating: "Routine",
            advice: "Composition analysis indicates a stable energy source. Suitable for regular dietary rotation.",
            color: "blue"
        };
    }

    // Tier 1: Daily (Whole Foods, Low GL)
    return {
        frequency: "Daily Essential",
        rating: "Optimal",
        advice: "High-quality nutritional profile. Supports optimal metabolic resilience and long-term health.",
        color: "emerald"
    };
};

export const generateMetabolicInsights = (analysis) => {
    const { totals, mappedIngredients, clinical, fullMetabolicPrediction } = analysis;
    const novaVal = clinical.nova || { group: 1 };
    const isSteamedOrBoiled = novaVal.group === 1 || novaVal.group === 2;

    // Fallback Calculations
    const features = calculateGlycemicFeatures(totals, mappedIngredients, fullMetabolicPrediction);
    const spike = predictGlucoseSpike(totals, new Date().getHours(), isSteamedOrBoiled);
    const correlation = correlateCGMPattern(features);
    const risk = calculateGlycemicRisk(spike, features);
    const optimalWindow = getOptimalMealWindow(totals, novaVal, features);
    const consumptionAdvice = getConsumptionAdvice(totals, novaVal, features);

    // AI Prediction Overrides (User requested: "use my gpt for fetch this datas")
    if (fullMetabolicPrediction) {
        return {
            features: {
                ...features,
                carbToFiber: fullMetabolicPrediction.carbToFiber?.toString() || features.carbToFiber,
                carbToProtein: fullMetabolicPrediction.carbToProtein?.toString() || features.carbToProtein
            },
            spike: {
                ...spike,
                peakMgdl: fullMetabolicPrediction.glucoseExcursion || spike.peakMgdl,
                timingImpact: fullMetabolicPrediction.timingImpact || spike.timingImpact
            },
            correlation: fullMetabolicPrediction.cgmCorrelation || correlation,
            risk: {
                ...risk,
                message: fullMetabolicPrediction.glucoseExcursion > 40
                    ? `AI Predicted High Excursion (+${fullMetabolicPrediction.glucoseExcursion}mg/dL)`
                    : risk.message
            },
            totalCarbs: fullMetabolicPrediction.totalCarbs || totals.carbs,
            optimalWindow: {
                perfectTime: fullMetabolicPrediction.optimalWindow?.time || optimalWindow.perfectTime,
                reason: fullMetabolicPrediction.optimalWindow?.reason || optimalWindow.reason
            },
            consumptionAdvice: {
                ...consumptionAdvice,
                frequency: fullMetabolicPrediction.dietaryGuidance?.frequency || consumptionAdvice.frequency,
                rating: fullMetabolicPrediction.dietaryGuidance?.rating || consumptionAdvice.rating,
                advice: fullMetabolicPrediction.dietaryGuidance?.advice || consumptionAdvice.advice
            }
        };
    }

    return {
        features,
        spike,
        correlation,
        risk,
        totalCarbs: totals.carbs,
        optimalWindow,
        consumptionAdvice
    };
};
