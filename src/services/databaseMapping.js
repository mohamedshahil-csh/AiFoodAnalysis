/**
 * Nutrition data mapping to USDA/IFCT.
 * Simplified for this implementation using demo data.
 */

const NUTRITION_DB = {
    // Grains & Breads
    'white rice': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, sodium: 1, fiber: 0.4, potassium: 35, phosphorus: 43, calcium: 10, iron: 0.2, magnesium: 12, zinc: 0.5, vitA: 0, vitC: 0, vitD: 0 },
    'brown rice': { calories: 112, protein: 2.3, carbs: 23.5, fat: 0.8, sodium: 1, fiber: 1.8, potassium: 43, phosphorus: 83, calcium: 10, iron: 0.4, magnesium: 43, zinc: 0.7, vitA: 0, vitC: 0, vitD: 0 },
    'roti': { calories: 264, protein: 9, carbs: 46, fat: 4, sodium: 320, fiber: 7, potassium: 180, phosphorus: 210, calcium: 30, iron: 2.5, magnesium: 80, zinc: 1.5, vitA: 0, vitC: 0, vitD: 0 }, // per 100g
    'idli': { calories: 124, protein: 3.5, carbs: 25, fat: 0.4, sodium: 280, fiber: 1.5, potassium: 60, phosphorus: 70, calcium: 20, iron: 0.7, magnesium: 25, zinc: 0.5, vitA: 0, vitC: 0, vitD: 0 },
    'dosa': { calories: 168, protein: 4, carbs: 29, fat: 3.5, sodium: 340, fiber: 1.2, potassium: 80, phosphorus: 90, calcium: 15, iron: 0.8, magnesium: 30, zinc: 0.6, vitA: 0, vitC: 0, vitD: 0 },
    'poha': { calories: 110, protein: 2.3, carbs: 25, fat: 0.2, sodium: 5, fiber: 0.6, potassium: 120, phosphorus: 60, calcium: 20, iron: 2.0, magnesium: 40, zinc: 0.4, vitA: 10, vitC: 2, vitD: 0 },

    // Mains & Sides
    'dal fry': { calories: 154, protein: 7.5, carbs: 18.5, fat: 5.5, sodium: 450, fiber: 4.5, potassium: 250, phosphorus: 120, calcium: 30, iron: 1.8, magnesium: 45, zinc: 1.2, vitA: 20, vitC: 2, vitD: 0 },
    'sambar': { calories: 75, protein: 3, carbs: 12, fat: 2.5, sodium: 520, fiber: 3, potassium: 180, phosphorus: 60, calcium: 25, iron: 1.1, magnesium: 20, zinc: 0.4, vitA: 150, vitC: 5, vitD: 0 },
    'paneer butter masala': { calories: 340, protein: 12, carbs: 14, fat: 28, sodium: 850, fiber: 2, potassium: 180, phosphorus: 210, calcium: 150, iron: 0.5, magnesium: 20, zinc: 0.8, vitA: 40, vitC: 0.5, vitD: 1.2 },
    'chicken curry': { calories: 240, protein: 28, carbs: 8, fat: 12, sodium: 680, fiber: 2.5, potassium: 320, phosphorus: 240, calcium: 15, iron: 1.2, magnesium: 30, zinc: 1.5, vitA: 30, vitC: 1, vitD: 0.5 },
    'vada': { calories: 195, protein: 6, carbs: 21, fat: 10, sodium: 410, fiber: 4, potassium: 210, phosphorus: 110, calcium: 40, iron: 1.5, magnesium: 35, zinc: 0.8, vitA: 0, vitC: 0, vitD: 0 },

    // Accompaniments
    'salad': { calories: 15, protein: 0.8, carbs: 3, fat: 0.1, sodium: 10, fiber: 1.5, potassium: 140, phosphorus: 20, calcium: 20, iron: 0.5, magnesium: 15, zinc: 0.2, vitA: 150, vitC: 15, vitD: 0 },
    'raita': { calories: 60, protein: 3, carbs: 5, fat: 3, sodium: 120, fiber: 0.5, potassium: 150, phosphorus: 90, calcium: 110, iron: 0.1, magnesium: 12, zinc: 0.4, vitA: 40, vitC: 1, vitD: 0.5 },
};

/**
 * Normalizes ingredient names for database matching
 */
const normalizeName = (name) => {
    const n = name.toLowerCase();
    if (n.includes('rice') && !n.includes('brown')) return 'white rice';
    if (n.includes('dal') || n.includes('lentil')) return 'dal fry';
    if (n.includes('paneer')) return 'paneer butter masala';
    if (n.includes('chicken')) return 'chicken curry';
    if (n.includes('bread') || n.includes('chapati')) return 'roti';
    return n;
};

export const mapIngredientsToNutrition = (ingredients) => {
    return ingredients.map(item => {
        const normalized = normalizeName(item.name);
        const dbEntry = NUTRITION_DB[normalized] || NUTRITION_DB[item.name.toLowerCase()] || {
            calories: 100, protein: 5, carbs: 15, fat: 2, sodium: 100, fiber: 1, potassium: 100, phosphorus: 50,
            calcium: 20, iron: 1, magnesium: 20, zinc: 0.5, vitA: 0, vitC: 0, vitD: 0
        };

        const factor = item.portionGrams / 100;

        return {
            name: item.name,
            portionGrams: item.portionGrams,
            ingredientDetails: item.ingredientDetails || [],
            novaGroup: item.novaGroup || dbEntry.novaGroup || 1,
            phytonutrients: item.phytonutrients || dbEntry.phytonutrients || [],
            calories: Math.round(dbEntry.calories * factor),
            protein: Math.round(dbEntry.protein * factor * 10) / 10,
            carbs: Math.round(dbEntry.carbs * factor * 10) / 10,
            fat: Math.round(dbEntry.fat * factor * 10) / 10,
            sodium: Math.round(dbEntry.sodium * factor),
            fiber: Math.round(dbEntry.fiber * factor * 10) / 10,
            potassium: Math.round(dbEntry.potassium * factor),
            phosphorus: Math.round(dbEntry.phosphorus * factor),
            calcium: Math.round((item.calcium || dbEntry.calcium * factor) * 10) / 10,
            iron: Math.round((item.iron || dbEntry.iron * factor) * 10) / 10,
            magnesium: Math.round((item.magnesium || dbEntry.magnesium * factor) * 10) / 10,
            zinc: Math.round((item.zinc || dbEntry.zinc * factor) * 10) / 10,
            vitA: Math.round((item.vitA || dbEntry.vitA * factor) * 10) / 10,
            vitC: Math.round((item.vitC || dbEntry.vitC * factor) * 10) / 10,
            vitD: Math.round((item.vitD || dbEntry.vitD * factor) * 10) / 10
        };
    });
};

export const calculateTotals = (mappedIngredients) => {
    return mappedIngredients.reduce((acc, curr) => ({
        calories: Math.round(acc.calories + (curr.calories || 0)),
        protein: Math.round(acc.protein + (curr.protein || 0)),
        carbs: Math.round(acc.carbs + (curr.carbs || 0)),
        fat: Math.round(acc.fat + (curr.fat || 0)),
        sodium: Math.round(acc.sodium + (curr.sodium || 0)),
        fiber: Math.round(acc.fiber + (curr.fiber || 0)),
        potassium: Math.round(acc.potassium + (curr.potassium || 0)),
        phosphorus: Math.round(acc.phosphorus + (curr.phosphorus || 0)),
        calcium: Math.round(acc.calcium + (curr.calcium || 0)),
        iron: Number((acc.iron + (curr.iron || 0)).toFixed(1)),
        magnesium: Math.round(acc.magnesium + (curr.magnesium || 0)),
        zinc: Number((acc.zinc + (curr.zinc || 0)).toFixed(1)),
        vitA: Math.round(acc.vitA + (curr.vitA || 0)),
        vitC: Math.round(acc.vitC + (curr.vitC || 0)),
        vitD: Number((acc.vitD + (curr.vitD || 0)).toFixed(1)),
        saturatedFat: Number((acc.saturatedFat + (curr.saturatedFat || curr.fat * 0.3 || 0)).toFixed(1)),
        sugar: Math.round(acc.sugar + (curr.sugar || 0))
    }), {
        calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0, fiber: 0, potassium: 0, phosphorus: 0,
        calcium: 0, iron: 0, magnesium: 0, zinc: 0, vitA: 0, vitC: 0, vitD: 0, saturatedFat: 0, sugar: 0
    });
};
