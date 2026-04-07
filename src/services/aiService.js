/**
 * OpenAI API Service for food recognition + comprehensive wellness intelligence.
 */

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_MODEL = import.meta.env.VITE_OPENAI_API_MODEL || "gpt-4o";

export const analyzeFoodImage = async (base64Image, patientProfile = {}) => {
    if (!OPENAI_API_KEY || OPENAI_API_KEY.includes("your_api_key")) {
        // Demo fallback if no API key is provided
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    dishName: "Classic North Indian Thali (Demo Mode)",
                    cuisine: "Indian",
                    fullMetabolicPrediction: {
                        glucoseExcursion: 35,
                        totalCarbs: 65,
                        carbToProtein: 5.8,
                        carbToFiber: 8.5,
                        dietaryGuidance: {
                            rating: "Moderate",
                            frequency: "2-3 times/week",
                            advice: "The protein from Paneer and Dal helps stabilize the white rice carbs, but the overall Glycemic Load is moderate. Best paired with the provided cucumber salad."
                        },
                        optimalWindow: {
                            time: "Lunch",
                            reason: "High energy density is best processed during peak metabolic hours (11am-2pm)."
                        },
                        timingImpact: "Standard morning/afternoon efficiency minimizes spike risk.",
                        cgmCorrelation: {
                            pattern: "Steady Rise & Plateau",
                            reason: "Mixed fats and proteins from Dal Fry slow down glucose absorption."
                        }
                    },
                    wellnessIntelligence: {
                        gutHealthIndex: 82,
                        satietyScore: 8,
                        satietyHours: "4.5",
                        sleepImpact: "Supports Deep Sleep",
                        brainHealthIndex: 75,
                        wellnessSummary: "High protein and fermented dal support both muscle recovery and microbiome health."
                    },
                    exercisePlan: {
                        preExercise: {
                            recommendation: "Light stretching or yoga 30 minutes before this meal to prime insulin sensitivity",
                            duration: "10-15 min",
                            intensity: "Low"
                        },
                        postExercise: {
                            recommendation: "A brisk walk after eating this thali will significantly blunt the glucose spike from white rice",
                            type: "Brisk Walking",
                            duration: "20-30 min",
                            intensity: "Moderate",
                            timing: "15-30 minutes after eating",
                            estimatedCaloriesBurned: 120
                        },
                        dailyExerciseTarget: {
                            type: "Mixed Cardio + Resistance",
                            totalMinutes: 45,
                            steps: 8000,
                            reason: "The moderate glycemic load of this thali requires consistent daily activity to maintain insulin sensitivity and utilize the 580 kcal effectively."
                        },
                        exerciseWarnings: [
                            "Avoid intense exercise immediately after eating — wait at least 60 min for heavy workouts",
                            "If HbA1c is elevated, prefer low-impact activities like swimming or cycling over HIIT"
                        ]
                    },
                    lifestyleChanges: {
                        recommendations: [
                            {
                                category: "Sleep",
                                icon: "moon",
                                title: "Optimize Sleep Schedule",
                                description: "Eat this thali at least 3 hours before bedtime. The carb-rich rice triggers serotonin production which aids sleep, but late consumption causes overnight glucose spikes.",
                                priority: "High",
                                timeframe: "Immediate"
                            },
                            {
                                category: "Stress",
                                icon: "wind",
                                title: "Post-Meal Mindful Breathing",
                                description: "Practice 5 minutes of diaphragmatic breathing after eating to activate the parasympathetic nervous system, improving digestion of the Paneer and Dal proteins.",
                                priority: "Medium",
                                timeframe: "Daily"
                            },
                            {
                                category: "Hydration",
                                icon: "droplet",
                                title: "Strategic Water Intake",
                                description: "Drink water 30 min before this meal, not during. The sodium content (420mg) requires adequate hydration but drinking during meals dilutes digestive enzymes.",
                                priority: "High",
                                timeframe: "Per Meal"
                            },
                            {
                                category: "Habits",
                                icon: "target",
                                title: "Eat Dal & Salad First",
                                description: "Start with the Dal Fry and Salad before touching the white rice. Fiber-first eating reduces glucose excursion by up to 40% according to clinical studies.",
                                priority: "High",
                                timeframe: "Per Meal"
                            },
                            {
                                category: "Movement",
                                icon: "footprints",
                                title: "Break Sedentary Patterns",
                                description: "If you have a desk job, stand and walk for 2-3 min every hour. This thali provides sustained energy for 4+ hours but sedentary behavior blunts its metabolic benefits.",
                                priority: "Medium",
                                timeframe: "Daily"
                            }
                        ]
                    },
                    dailyWellnessPlan: {
                        morning: {
                            time: "6:00 - 9:00 AM",
                            activities: [
                                "Drink warm water with lemon (aids digestion for later meals)",
                                "15 min morning walk or yoga to prime insulin receptors",
                                "Light breakfast rich in protein — save carb-heavy meals like this thali for lunch"
                            ]
                        },
                        afternoon: {
                            time: "12:00 - 3:00 PM",
                            activities: [
                                "Best window to consume this thali — peak metabolic efficiency",
                                "Eat salad and dal first, then roti, then rice last",
                                "20-min post-lunch walk to blunt glucose spike",
                                "Stay hydrated — aim for 500ml water in the 2 hours after eating"
                            ]
                        },
                        evening: {
                            time: "5:00 - 9:00 PM",
                            activities: [
                                "Light dinner — avoid repeating heavy carbs from this thali",
                                "10-min stretching or meditation to aid digestion",
                                "Herbal tea (chamomile/tulsi) to reduce cortisol before bed",
                                "No screens 30 min before sleep for optimal recovery"
                            ]
                        }
                    },
                    hydrationRecovery: {
                        dailyWaterTarget: "2.8L",
                        preMealWater: "250ml, 30 min before eating",
                        postMealWater: "Sip slowly, 200ml over 1 hour after eating",
                        electrolytes: {
                            sodium: "This meal provides 420mg — moderate. No extra salt needed.",
                            potassium: "Good potassium from Dal (380mg). Add a banana as snack for optimal cardiac function.",
                            magnesium: "58mg from this meal — below daily target. Consider supplementation or add dark leafy greens."
                        },
                        recoveryTips: [
                            "Space meals 4-5 hours apart for optimal metabolic recovery",
                            "Include fermented foods (yogurt/curd) with next meal for gut recovery",
                            "Sleep 7-8 hours to allow full glycogen storage and muscle repair"
                        ]
                    },
                    mentalWellness: {
                        foodMoodScore: 78,
                        moodImpact: "Positive — this meal's tryptophan from Dal and B-vitamins from rice support serotonin synthesis, promoting calm and focus.",
                        stressTips: [
                            "The magnesium in dal helps regulate cortisol — good for stress management",
                            "Avoid caffeine for 2 hours after this meal to prevent anxiogenic interference",
                            "Practice gratitude during meals — mindful eating reduces stress hormones by 25%"
                        ],
                        mindfulnessSuggestions: [
                            "Eat slowly — chew each bite 20-30 times to enhance nutrient absorption",
                            "Put down utensils between bites to practice mindful eating",
                            "Notice the colors, textures, and aromas of each component in the thali"
                        ],
                        cognitivePerformance: {
                            score: 72,
                            insight: "The combination of complex carbs and protein provides sustained brain fuel for 3-4 hours. Best consumed before cognitive tasks rather than after — the post-meal parasympathetic response may cause temporary drowsiness."
                        }
                    },
                    overallHealthScore: 72,
                    healthierAlternatives: [
                        { original: "White Rice", alternative: "Brown Rice or Quinoa", benefit: "3x more fiber, lower glycemic index, better blood sugar control", caloriesSaved: 20 },
                        { original: "Paneer Butter Masala", alternative: "Grilled Paneer Tikka", benefit: "60% less saturated fat, no cream/butter, retains protein", caloriesSaved: 120 },
                        { original: "Ghee on Roti", alternative: "Dry Roti or Multigrain Roti", benefit: "Eliminates 45 kcal of saturated fat per roti, adds fiber", caloriesSaved: 45 },
                        { original: "Full Portion", alternative: "Half Rice + Extra Salad", benefit: "Cuts glycemic load by 40%, doubles fiber intake", caloriesSaved: 100 }
                    ],
                    drugFoodInteractions: [
                        { drug: "Metformin", interaction: "High carb content from rice may counteract glucose-lowering effects", severity: "Moderate", advice: "Reduce rice portion to half and monitor blood sugar 2 hours post-meal" },
                        { drug: "Warfarin", interaction: "Leafy greens in salad contain Vitamin K which opposes anticoagulant action", severity: "High", advice: "Maintain consistent Vitamin K intake; do not suddenly increase salad portions" },
                        { drug: "Statins", interaction: "High-fat paneer butter masala may reduce statin efficacy", severity: "Low", advice: "Take statin at bedtime, not with this meal" }
                    ],
                    ingredients: [
                        { name: "White Rice", portionGrams: 150, ingredientDetails: ["Steamed Basmati Rice", "Water"] },
                        { name: "Dal Fry", portionGrams: 100, ingredientDetails: ["Pigeon Peas", "Onion", "Tomato", "Ghee", "Spices"] },
                        { name: "Paneer Butter Masala", portionGrams: 80, ingredientDetails: ["Paneer", "Tomato Gravy", "Butter", "Cream", "Cashews"] },
                        { name: "Roti", portionGrams: 60, ingredientDetails: ["Whole Wheat Flour", "Water", "Ghee"] },
                        { name: "Salad", portionGrams: 50, ingredientDetails: ["Cucumber", "Tomato", "Onion", "Lemon"] },
                    ],
                    segmentation: "Multi-object segmentation complete: OpenAI vision model detected 5 distinct food regions.",
                    clinicalSuitability: {
                        verdict: "Caution",
                        explanation: "Moderate glycemic load with balanced protein. Monitor portion size for optimal blood sugar control.",
                        markers: [
                            { marker: "HbA1c", impact: "Moderate carb load may affect glucose levels", verdict: "Caution" },
                            { marker: "LDL", impact: "Ghee and butter content contributes to saturated fat", verdict: "Caution" },
                            { marker: "BP", impact: "Moderate sodium from spices and salt", verdict: "Safe" },
                            { marker: "eGFR", impact: "Protein load is within acceptable range", verdict: "Safe" }
                        ]
                    }
                });
            }, 2000);
        });
    }

    // Build patient context for personalized analysis
    const hasProfile = patientProfile.age || patientProfile.gender || patientProfile.occupation;
    const hasBody = patientProfile.weight || patientProfile.height;
    const hasVitals = patientProfile.hba1c || patientProfile.ldl || patientProfile.bpSystolic || patientProfile.egfr ||
        patientProfile.fastingBloodSugar || patientProfile.postprandialSugar || patientProfile.totalCholesterol ||
        patientProfile.hdl || patientProfile.triglycerides || patientProfile.creatinine || patientProfile.uricAcid ||
        patientProfile.tsh || patientProfile.hemoglobin || patientProfile.heartRate || patientProfile.spo2;
    const hasMedical = patientProfile.conditions || patientProfile.medications || patientProfile.allergies;

    let patientContext = '';
    if (hasProfile || hasBody || hasVitals || hasMedical) {
        patientContext = '\n\nPATIENT CLINICAL CONTEXT (use this to personalize your analysis):';

        // Demographics
        if (patientProfile.age) patientContext += `\n- Age: ${patientProfile.age} years`;
        if (patientProfile.gender) patientContext += `\n- Gender: ${patientProfile.gender}`;
        if (patientProfile.occupation) patientContext += `\n- Activity Level: ${patientProfile.occupation}`;

        // Body Metrics
        if (patientProfile.weight) patientContext += `\n- Weight: ${patientProfile.weight} kg`;
        if (patientProfile.height) patientContext += `\n- Height: ${patientProfile.height} cm`;
        if (patientProfile.weight && patientProfile.height) {
            const bmi = (patientProfile.weight / ((patientProfile.height / 100) ** 2)).toFixed(1);
            patientContext += `\n- BMI: ${bmi} ${bmi > 30 ? '(OBESE)' : bmi > 25 ? '(OVERWEIGHT)' : bmi < 18.5 ? '(UNDERWEIGHT)' : '(Normal)'}`;
        }

        // Blood Sugar
        if (patientProfile.hba1c) patientContext += `\n- HbA1c: ${patientProfile.hba1c}% ${parseFloat(patientProfile.hba1c) > 6.5 ? '(ELEVATED - diabetic range)' : parseFloat(patientProfile.hba1c) > 5.7 ? '(PRE-DIABETIC range)' : '(Normal)'}`;
        if (patientProfile.fastingBloodSugar) patientContext += `\n- Fasting Blood Sugar: ${patientProfile.fastingBloodSugar} mg/dL ${parseInt(patientProfile.fastingBloodSugar) > 126 ? '(DIABETIC)' : parseInt(patientProfile.fastingBloodSugar) > 100 ? '(PRE-DIABETIC)' : '(Normal)'}`;
        if (patientProfile.postprandialSugar) patientContext += `\n- Post-Prandial Sugar: ${patientProfile.postprandialSugar} mg/dL ${parseInt(patientProfile.postprandialSugar) > 200 ? '(DIABETIC)' : parseInt(patientProfile.postprandialSugar) > 140 ? '(IMPAIRED)' : '(Normal)'}`;

        // Lipid Panel
        if (patientProfile.totalCholesterol) patientContext += `\n- Total Cholesterol: ${patientProfile.totalCholesterol} mg/dL ${parseInt(patientProfile.totalCholesterol) > 240 ? '(HIGH)' : parseInt(patientProfile.totalCholesterol) > 200 ? '(BORDERLINE)' : '(Desirable)'}`;
        if (patientProfile.ldl) patientContext += `\n- LDL Cholesterol: ${patientProfile.ldl} mg/dL ${parseInt(patientProfile.ldl) > 160 ? '(HIGH)' : parseInt(patientProfile.ldl) > 130 ? '(BORDERLINE HIGH)' : '(Optimal)'}`;
        if (patientProfile.hdl) patientContext += `\n- HDL Cholesterol: ${patientProfile.hdl} mg/dL ${parseInt(patientProfile.hdl) < 40 ? '(LOW - cardiac risk)' : parseInt(patientProfile.hdl) > 60 ? '(PROTECTIVE)' : '(Normal)'}`;
        if (patientProfile.triglycerides) patientContext += `\n- Triglycerides: ${patientProfile.triglycerides} mg/dL ${parseInt(patientProfile.triglycerides) > 200 ? '(HIGH - restrict sugars/refined carbs)' : parseInt(patientProfile.triglycerides) > 150 ? '(BORDERLINE)' : '(Normal)'}`;

        // Cardiovascular
        if (patientProfile.bpSystolic && patientProfile.bpDiastolic) patientContext += `\n- Blood Pressure: ${patientProfile.bpSystolic}/${patientProfile.bpDiastolic} mmHg ${parseInt(patientProfile.bpSystolic) > 140 ? '(HYPERTENSIVE)' : parseInt(patientProfile.bpSystolic) > 120 ? '(ELEVATED)' : '(Normal)'}`;
        if (patientProfile.heartRate) patientContext += `\n- Heart Rate: ${patientProfile.heartRate} bpm ${parseInt(patientProfile.heartRate) > 100 ? '(TACHYCARDIC)' : parseInt(patientProfile.heartRate) < 60 ? '(BRADYCARDIC)' : '(Normal)'}`;
        if (patientProfile.spo2) patientContext += `\n- SpO2: ${patientProfile.spo2}% ${parseInt(patientProfile.spo2) < 94 ? '(LOW - hypoxemia concern)' : '(Normal)'}`;

        // Organ Function
        if (patientProfile.egfr) patientContext += `\n- eGFR: ${patientProfile.egfr} mL/min ${parseInt(patientProfile.egfr) < 60 ? '(REDUCED kidney function - restrict protein/potassium/phosphorus)' : parseInt(patientProfile.egfr) < 90 ? '(Mildly reduced)' : '(Normal)'}`;
        if (patientProfile.creatinine) patientContext += `\n- Creatinine: ${patientProfile.creatinine} mg/dL ${parseFloat(patientProfile.creatinine) > 1.3 ? '(ELEVATED - kidney stress)' : '(Normal)'}`;
        if (patientProfile.uricAcid) patientContext += `\n- Uric Acid: ${patientProfile.uricAcid} mg/dL ${parseFloat(patientProfile.uricAcid) > 7 ? '(HIGH - gout risk, restrict purines)' : '(Normal)'}`;
        if (patientProfile.tsh) patientContext += `\n- TSH: ${patientProfile.tsh} mIU/L ${parseFloat(patientProfile.tsh) > 4.5 ? '(HIGH - hypothyroid, metabolism affected)' : parseFloat(patientProfile.tsh) < 0.4 ? '(LOW - hyperthyroid)' : '(Normal)'}`;
        if (patientProfile.hemoglobin) patientContext += `\n- Hemoglobin: ${patientProfile.hemoglobin} g/dL ${parseFloat(patientProfile.hemoglobin) < 12 ? '(LOW - anemia, prioritize iron-rich foods)' : '(Normal)'}`;

        // Medical History
        if (patientProfile.conditions) patientContext += `\n- Known Conditions: ${patientProfile.conditions}`;
        if (patientProfile.medications) patientContext += `\n- Current Medications: ${patientProfile.medications} (CHECK for drug-nutrient interactions with this food)`;
        if (patientProfile.allergies) patientContext += `\n- Food Allergies: ${patientProfile.allergies} (FLAG if any ingredient in this food matches)`;

        patientContext += '\n\nYou MUST factor ALL these clinical values into your dietaryGuidance, clinicalSuitability verdict, exercise recommendations, lifestyle changes, and ALL recommendations. Be specific about WHY this food is safe/caution/avoid for THIS patient based on EACH abnormal marker.';
    }

    const systemPrompt = `You are a world-class clinical nutritionist, exercise physiologist, and holistic wellness AI with expertise in identifying foods from photographs with extreme precision. You have deep knowledge of global cuisines, cooking methods, portion sizes, nutritional composition, exercise science, lifestyle medicine, and mind-body wellness.${patientContext}

CRITICAL RULES:
- LOOK CAREFULLY at the image. Identify EXACTLY what food items are visible. Do NOT guess or hallucinate items that are not clearly visible.
- If you see a single item (e.g., one bowl of rice, one sandwich), report ONLY that item. Do NOT invent a full thali or meal platter if only one item is shown.
- Base portion size estimates on visual cues like plate size, bowl depth, and food spread. Be realistic.
- All nutritional values must be evidence-based estimates consistent with USDA/IFCT databases for the identified portions.
- Every numeric value must be a realistic number (not 0 placeholders). Use your clinical knowledge.
- The dishName must accurately reflect what is ACTUALLY in the image, not what you think it might be part of.
- You MUST provide a clinicalSuitability section with a verdict (Safe/Caution/Avoid) personalized to the patient's clinical data if provided.
- Exercise recommendations MUST be personalized to the specific food eaten and the patient's clinical profile. Be specific about exercise type, timing relative to the meal, and calorie burn.
- Lifestyle changes must be actionable, food-specific, and tied to the patient's health markers. NOT generic advice.
- Mental wellness advice must reference specific nutrients in the food and their neurochemical effects.`;

    const prompt = `
    Analyze this food image with clinical-grade precision. IMPORTANT: Only identify food items that are ACTUALLY VISIBLE in the image. Do not assume or add items that are not present.

    Your analysis must include:
    1. **Precise Visual Recognition**: Identify EXACTLY what food is shown. If it's a single dish, name that dish. If it's a composite meal/thali, identify each visible component. Be specific about the cuisine and regional variant.
    2. **Ingredient Decomposition Engine**: Break down each visible dish into its individual ingredients (e.g., "French Fries" -> ["Potato", "Vegetable Oil", "Salt"]).
    3. **Granular Ingredient Details**: For each component, list the exact ingredients used to make it.
    4. **Food Processing Classification (NOVA)**: For each component (1: Minimally processed, 3: Processed, 4: Ultra-processed).
    5. **Multi-Object Segmentation**: Describe the spatial layout of detected items in the image.
    6. **Portion Size Estimation**: Estimate weight in grams based on visible plate/bowl size and food volume. Be realistic.
    7. **Comprehensive Nutritional Profiling**: For each component, provide evidence-based estimates:
       - Macros: calories (kcal), protein (g), carbs (g), fat (g), sugar (g).
       - Clinical: sodium (mg), fiber (g), potassium (mg), phosphorus (mg).
       - Minerals: calcium (mg), iron (mg), magnesium (mg), zinc (mg).
       - Vitamins: vitA (mcg), vitC (mg), vitD (mcg).
    8. **Antioxidant & Phytonutrient Scan**: Identify key phytonutrients present (e.g., Lycopene, Anthocyanins, Curcumin).
    9. **Safety Scanning**: Identify potential medicinal interactions or major allergens.
    10. **Full Metabolic Prediction**: Predict these markers for the ENTIRE meal as identified:
        - **Glucose Excursion**: Predicted peak rise in mg/dL.
        - **Dietary Guidance**: Category (Daily/Moderate/Occasional), Frequency, and **dish-specific advice unique to the exact food identified**.
          CRITICAL: Advice MUST reference the SPECIFIC ingredients you identified. NO generic advice.
        - **Total Carbs**: Total grams for the identified portion.
        - **Carb:Protein Ratio**: Precision ratio (e.g., 6.2).
        - **Carb:Fiber Ratio**: Precision ratio.
        - **Optimal Window**: Best time of day and ingredient-based reason.
        - **Meal Timing Impact**: Clinical note on insulin sensitivity.
        - **CGM Correlation**: Predicted CGM pattern and ingredient-based reason.
    11. **Total Wellness Intelligence**:
        - **Gut Health Index**: (0-100) based on prebiotic/probiotic potential.
        - **Satiety & Fullness**: Predicted hours and fullness score (1-10).
        - **Sleep Quality Impact**: Effect on sleep quality.
        - **Cognitive Health (Brain Food)**: Brain health potential score (0-100).
        - **Wellness Summary**: A 1-sentence holistic clinical takeaway specific to this food.
    12. **Exercise & Activity Prescription**: Based on THIS specific food and the patient's clinical profile:
        - Pre-exercise recommendation (before eating this food)
        - Post-exercise recommendation (type, duration, intensity, timing after meal, estimated calories burned)
        - Daily exercise target considering this food's caloric and glycemic profile
        - Exercise warnings or contraindications specific to the patient
    13. **Lifestyle Changes**: 4-6 actionable, food-specific lifestyle modifications:
        - Each with category (Sleep/Stress/Hydration/Habits/Movement), title, description, priority (High/Medium/Low), timeframe (Immediate/Daily/Weekly/Per Meal)
        - Must reference SPECIFIC ingredients from this food and their effects
    14. **Daily Wellness Plan**: Morning/Afternoon/Evening routine suggestions:
        - Time windows and 3-4 specific activities per phase
        - Must be personalized to this food and the patient's needs
    15. **Hydration & Recovery**:
        - Daily water target, pre-meal and post-meal hydration strategy
        - Electrolyte analysis (sodium, potassium, magnesium) based on this food
        - 3 recovery tips specific to this meal
    16. **Mental Wellness & Mind-Body Connection**:
        - Food-Mood Score (0-100) based on nutrients that affect neurotransmitters
        - Mood impact description referencing specific nutrients
        - 3 stress management tips tied to this food's composition
        - 3 mindfulness suggestions for this meal
        - Cognitive performance score (0-100) and insight
    17. **Overall Health Score**: A single 0-100 aggregate score for how healthy this food is for THIS specific patient, considering all clinical markers.
    18. **Healthier Alternatives**: 3-5 specific ingredient swaps that would make this meal healthier, with calories saved per swap.
    19. **Drug-Food Interactions**: If the patient is on any medications, identify specific drug-nutrient interactions with this food. Include severity (High/Moderate/Low) and clinical advice.

    Return ONLY valid JSON in this exact format:
    {
      "dishName": "Exact name of the dish as seen in image",
      "cuisine": "Country/Region",
      "fullMetabolicPrediction": {
        "glucoseExcursion": <number>,
        "totalCarbs": <number>,
        "carbToProtein": <number>,
        "carbToFiber": <number>,
        "dietaryGuidance": { "rating": "Daily|Moderate|Occasional", "frequency": "frequency", "advice": "specific advice referencing identified ingredients" },
        "optimalWindow": { "time": "Meal time", "reason": "ingredient-specific reason" },
        "timingImpact": "Clinical impact note",
        "cgmCorrelation": { "pattern": "Pattern name", "reason": "ingredient-based reason" }
      },
      "wellnessIntelligence": {
        "gutHealthIndex": <number>,
        "satietyScore": <number>,
        "satietyHours": "<number>",
        "sleepImpact": "Impact label",
        "brainHealthIndex": <number>,
        "wellnessSummary": "One sentence takeaway"
      },
      "exercisePlan": {
        "preExercise": { "recommendation": "specific pre-meal exercise advice", "duration": "time", "intensity": "Low|Moderate|High" },
        "postExercise": { "recommendation": "specific post-meal exercise advice", "type": "Exercise type", "duration": "time", "intensity": "Low|Moderate|High", "timing": "when after eating", "estimatedCaloriesBurned": <number> },
        "dailyExerciseTarget": { "type": "Exercise type", "totalMinutes": <number>, "steps": <number>, "reason": "food-specific reason" },
        "exerciseWarnings": ["warning1", "warning2"]
      },
      "lifestyleChanges": {
        "recommendations": [
          { "category": "Sleep|Stress|Hydration|Habits|Movement", "icon": "moon|wind|droplet|target|footprints", "title": "Title", "description": "Specific advice referencing food ingredients", "priority": "High|Medium|Low", "timeframe": "Immediate|Daily|Weekly|Per Meal" }
        ]
      },
      "dailyWellnessPlan": {
        "morning": { "time": "time range", "activities": ["activity1", "activity2", "activity3"] },
        "afternoon": { "time": "time range", "activities": ["activity1", "activity2", "activity3", "activity4"] },
        "evening": { "time": "time range", "activities": ["activity1", "activity2", "activity3", "activity4"] }
      },
      "hydrationRecovery": {
        "dailyWaterTarget": "amount",
        "preMealWater": "recommendation",
        "postMealWater": "recommendation",
        "electrolytes": { "sodium": "analysis", "potassium": "analysis", "magnesium": "analysis" },
        "recoveryTips": ["tip1", "tip2", "tip3"]
      },
      "mentalWellness": {
        "foodMoodScore": <number>,
        "moodImpact": "Description referencing specific nutrients",
        "stressTips": ["tip1", "tip2", "tip3"],
        "mindfulnessSuggestions": ["suggestion1", "suggestion2", "suggestion3"],
        "cognitivePerformance": { "score": <number>, "insight": "Specific cognitive impact description" }
      },
      "ingredients": [
        { 
          "name": "Component Name", 
          "ingredientDetails": ["item1", "item2"],
          "novaGroup": <1|3|4>,
          "phytonutrients": ["nutrient1"],
          "portionGrams": <number>,
          "calories": <number>, "protein": <number>, "carbs": <number>, "fat": <number>, "sugar": <number>,
          "sodium": <number>, "fiber": <number>, "potassium": <number>, "phosphorus": <number>,
          "calcium": <number>, "iron": <number>, "magnesium": <number>, "zinc": <number>,
          "vitA": <number>, "vitC": <number>, "vitD": <number>
        }
      ],
      "segmentation": "Description of identified food regions in the image",
      "overallHealthScore": <number 0-100>,
      "healthierAlternatives": [
        { "original": "ingredient name", "alternative": "healthier swap", "benefit": "why it's better", "caloriesSaved": <number> }
      ],
      "drugFoodInteractions": [
        { "drug": "medication name", "interaction": "description", "severity": "High|Moderate|Low", "advice": "what to do" }
      ],
      "clinicalSuitability": {
        "verdict": "Safe|Caution|Avoid",
        "explanation": "1-2 sentence personalized explanation referencing patient's specific clinical markers",
        "markers": [
          { "marker": "HbA1c", "impact": "specific impact on this marker", "verdict": "Safe|Caution|Avoid" },
          { "marker": "BP", "impact": "specific impact", "verdict": "Safe|Caution|Avoid" },
          { "marker": "LDL", "impact": "specific impact", "verdict": "Safe|Caution|Avoid" },
          { "marker": "eGFR", "impact": "specific impact", "verdict": "Safe|Caution|Avoid" }
        ]
      }
    }
    `;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: OPENAI_MODEL,
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/jpeg;base64,${base64Image}`,
                                    detail: "high"
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 7000,
                temperature: 0.3,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("OpenAI API Error:", errorData);
            throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        console.log("Raw AI Response Content:", content);

        if (!content) {
            throw new Error("AI returned an empty response. Please try again.");
        }

        try {
            const resultJson = JSON.parse(content);
            if (!resultJson) throw new Error("Parsed result is null");
            return resultJson;
        } catch (parseError) {
            console.error("JSON Parse Error:", content);
            throw new Error("Failed to parse AI response into valid clinical data.");
        }
    } catch (error) {
        console.error("OpenAI Analysis error:", error);
        throw error;
    }
};

/**
 * Generate a personalized 7-day meal plan based on the patient's comprehensive clinical profile.
 */
export const generateMealPlan = async (patientProfile = {}, lastAnalysis = null) => {
    const buildPatientVitalsContext = (p) => {
        let ctx = '';
        if (p.age) ctx += ` Age ${p.age},`;
        if (p.gender) ctx += ` ${p.gender},`;
        if (p.weight) ctx += ` ${p.weight}kg,`;
        if (p.height) ctx += ` ${p.height}cm,`;
        if (p.occupation) ctx += ` ${p.occupation} activity level,`;
        if (p.hba1c) ctx += ` HbA1c ${p.hba1c}% (${parseFloat(p.hba1c) > 5.7 ? 'ELEVATED - prioritize glycemic control' : 'Stable'}),`;
        if (p.ldl) ctx += ` LDL ${p.ldl}mg/dL (${parseInt(p.ldl) > 130 ? 'HIGH - restrict saturated fats' : 'Optimal'}),`;
        if (p.bpSystolic) ctx += ` BP ${p.bpSystolic}/${p.bpDiastolic}mmHg (${parseInt(p.bpSystolic) > 130 ? 'ELEVATED - restrict sodium' : 'Normal'}),`;
        if (p.egfr) ctx += ` eGFR ${p.egfr}mL/min (${parseInt(p.egfr) < 60 ? 'REDUCED - moderate protein' : 'Normal'}),`;
        if (p.conditions) ctx += ` Medical Conditions: ${p.conditions},`;
        if (p.medications) ctx += ` Current Medications: ${p.medications},`;
        if (p.allergies) ctx += ` Allergies: ${p.allergies},`;
        return ctx;
    };

    if (!OPENAI_API_KEY || OPENAI_API_KEY.includes("your_api_key")) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const demoDays = Array.from({ length: 7 }, (_, i) => ({
                    day: i + 1,
                    dailyCalorieTarget: 1800 + (Math.random() * 200 - 100),
                    macroSplit: { protein: "25%", carbs: "45%", fat: "30%" },
                    clinicalFocus: i % 2 === 0 ? "Glycemic Stabilization" : "Cardiac Support",
                    meals: [
                        { meal: "Breakfast", time: "7:00 - 8:00 AM", items: ["Oats porridge with berries"], calories: 380, notes: "Low GI start" },
                        { meal: "Lunch", time: "12:30 - 1:30 PM", items: ["Grilled chicken salad", "Quinoa"], calories: 520, notes: "Protein rich" },
                        { meal: "Evening Snack", time: "4:00 PM", items: ["Mixed nuts", "Apple"], calories: 200, notes: "Healthy fats" },
                        { meal: "Dinner", time: "7:00 - 8:00 PM", items: ["Baked fish", "Sautéed spinach"], calories: 480, notes: "Light recovery meal" }
                    ]
                }));
                resolve({ 
                    weeklyPlan: demoDays, 
                    weeklySummary: "Balanced 7-day metabolic support routine.",
                    hydrationTarget: "8-10 glasses of water daily"
                });
            }, 1500);
        });
    }

    const clinicalContext = buildPatientVitalsContext(patientProfile);
    const lastAnalysisNote = lastAnalysis?.dishName ? ` Last food analyzed: ${lastAnalysis.dishName}.` : '';

const userContent = `Generate a 7-day personalized clinical meal plan for: ${clinicalContext}${lastAnalysisNote}
        
        CRITICAL: For every meal, include:
        1. "items": List of specific foods.
        2. "clinicalReason": A hyper-personalized 1-2 sentence explanation. You MUST reference their ACTUAL high lab values if relevant. (e.g., "Since your HbA1c is high at 6.5%, this fiber-rich oatmeal is essential to slow glucose absorption and help bring that number down").
        3. "biomarkerTargets": Array of markers this meal improves (e.g., ["HbA1c", "LDL", "BP"]).

        Return JSON: { 
            "weeklyPlan": [{ 
                "day": <1-7>, 
                "dailyCalorieTarget": 1800, 
                "macroSplit": { "protein": "25%", "carbs": "45%", "fat": "30%" }, 
                "clinicalFocus": "Focus for this day",
                "meals": [{ "meal": "name", "time": "time", "items": [], "calories": 400, "clinicalReason": "string", "biomarkerTargets": [] }]
            }], 
            "metabolicImpact": {
                "glucoseStability": "+15%",
                "lipidReduction": "-5mg/dL",
                "bpImprovement": "Slightly Lower"
            },
            "metabolicBlueprint": {
                "glucoseTrend": [110, 108, 106, 107, 105, 103, 102],
                "lipidTrend": [120, 119, 118, 117, 115, 114, 112],
                "bpTrend": [120, 118, 119, 117, 116, 115, 114],
                "renalSafetyScore": 95,
                "summary": "Projected 7-day recovery path based on metabolic synchronization."
            },
            "weeklySummary": "Total week strategy", 
            "hydrationTarget": "2.8L Daily" 
        }`;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_API_KEY}` },
            body: JSON.stringify({
                model: OPENAI_MODEL,
                messages: [
                    { role: "system", content: "You are a clinical dietitian. Your task is to generate a comprehensive 7-day meal plan with specific evidence-based reasons for every food suggestion. Return ONLY valid JSON." },
                    { role: "user", content: userContent }
                ],
                max_tokens: 4000,
                temperature: 0.4,
                response_format: { type: "json_object" }
            })
        });
        if (!response.ok) throw new Error("7-day plan generation failed");
        const data = await response.json();
        return JSON.parse(data.choices[0].message.content);
    } catch (error) {
        console.error("Meal plan error:", error);
        throw error;
    }
};

export const swapMeal = async (originalMeal, userData, clinicalFocus) => {
    const userContent = `
        ACT AS A CLINICAL DIETITIANS. 
        USER PROFILE: ${JSON.stringify(userData)}
        SWAP REQUEST: Provide ONE alternative meal for "${originalMeal.meal}" (${originalMeal.time}).
        CLINICAL CONSTRAINT: Must maintain clinical focus: "${clinicalFocus}" and similar calorie/macro profile.
        
        RETURN ONLY JSON:
        {
            "meal": "Dish Name",
            "time": "Time",
            "calories": 450,
            "macroSplit": { "protein": "30g", "carbs": "45g", "fat": "15g" },
            "biomarkerTargets": ["HbA1c", "LDL"],
            "items": ["Ingredient 1", "Ingredient 2"],
            "clinicalReason": "Reason why this alternative still supports health goals."
        }`;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_API_KEY}` },
            body: JSON.stringify({
                model: OPENAI_MODEL,
                messages: [
                    { role: "system", content: "You are a senior clinical dietitian. provide a medically sound meal alternative. return only JSON." },
                    { role: "user", content: userContent }
                ],
                max_tokens: 1000,
                temperature: 0.3,
                response_format: { type: "json_object" }
            })
        });
        if (!response.ok) throw new Error("Meal swap failed");
        const data = await response.json();
        return JSON.parse(data.choices[0].message.content);
    } catch (error) {
        console.error("Swap error:", error);
        return null;
    }
};
