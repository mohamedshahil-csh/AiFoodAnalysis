/**
 * OpenAI API Service for food recognition.
 */

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_MODEL = import.meta.env.VITE_OPENAI_API_MODEL || "gpt-4o";

export const analyzeFoodImage = async (base64Image) => {
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
                    ingredients: [
                        { name: "White Rice", portionGrams: 150, ingredientDetails: ["Steamed Basmati Rice", "Water"] },
                        { name: "Dal Fry", portionGrams: 100, ingredientDetails: ["Pigeon Peas", "Onion", "Tomato", "Ghee", "Spices"] },
                        { name: "Paneer Butter Masala", portionGrams: 80, ingredientDetails: ["Paneer", "Tomato Gravy", "Butter", "Cream", "Cashews"] },
                        { name: "Roti", portionGrams: 60, ingredientDetails: ["Whole Wheat Flour", "Water", "Ghee"] },
                        { name: "Salad", portionGrams: 50, ingredientDetails: ["Cucumber", "Tomato", "Onion", "Lemon"] },
                    ],
                    segmentation: "Multi-object segmentation complete: OpenAI vision model detected 5 distinct food regions."
                });
            }, 2000);
        });
    }

    const systemPrompt = `You are a world-class clinical nutritionist and food recognition AI with expertise in identifying foods from photographs with extreme precision. You have deep knowledge of global cuisines, cooking methods, portion sizes, and nutritional composition. 

CRITICAL RULES:
- LOOK CAREFULLY at the image. Identify EXACTLY what food items are visible. Do NOT guess or hallucinate items that are not clearly visible.
- If you see a single item (e.g., one bowl of rice, one sandwich), report ONLY that item. Do NOT invent a full thali or meal platter if only one item is shown.
- Base portion size estimates on visual cues like plate size, bowl depth, and food spread. Be realistic.
- All nutritional values must be evidence-based estimates consistent with USDA/IFCT databases for the identified portions.
- Every numeric value must be a realistic number (not 0 placeholders). Use your clinical knowledge.
- The dishName must accurately reflect what is ACTUALLY in the image, not what you think it might be part of.`;

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
      "segmentation": "Description of identified food regions in the image"
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
                max_tokens: 4096,
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
