/**
 * Real-time clinical vitals interpreter.
 * Returns instant clinical interpretation for every vital sign entered.
 * Also provides AI-powered comprehensive health report via GPT model.
 */

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_MODEL = import.meta.env.VITE_OPENAI_API_MODEL || "gpt-4o";

// ─── Static Clinical Ranges ────────────────────────────────────────

const RANGES = {
    bpSystolic: [
        { max: 90, label: 'Hypotension', color: 'violet', tip: 'Below normal — may cause dizziness. Consult your doctor.' },
        { max: 119, label: 'Normal', color: 'emerald', tip: 'Your blood pressure is in the healthy range. Keep it up!' },
        { max: 129, label: 'Elevated', color: 'amber', tip: 'Slightly elevated — reduce sodium intake and increase physical activity.' },
        { max: 139, label: 'Stage 1 Hypertension', color: 'orange', tip: 'High BP — limit salt to <2300mg/day, exercise 30 min daily.' },
        { max: 179, label: 'Stage 2 Hypertension', color: 'rose', tip: 'Dangerously high — medication may be needed. Avoid high-sodium foods immediately.' },
        { max: Infinity, label: '⚠️ Hypertensive Crisis', color: 'rose', tip: 'EMERGENCY — Seek immediate medical attention! Avoid caffeine, salt, and stress.' }
    ],
    bpDiastolic: [
        { max: 60, label: 'Low', color: 'violet', tip: 'Diastolic pressure is low — stay hydrated and avoid standing up quickly.' },
        { max: 79, label: 'Normal', color: 'emerald', tip: 'Diastolic pressure is healthy.' },
        { max: 89, label: 'Stage 1 Hypertension', color: 'orange', tip: 'Mildly elevated diastolic — reduce stress and sodium.' },
        { max: 119, label: 'Stage 2 Hypertension', color: 'rose', tip: 'High diastolic pressure — consult your doctor for treatment.' },
        { max: Infinity, label: '⚠️ Hypertensive Crisis', color: 'rose', tip: 'EMERGENCY — Seek immediate medical care!' }
    ],
    hba1c: [
        { max: 5.6, label: 'Normal', color: 'emerald', tip: 'Excellent glucose control. Maintain a balanced diet.' },
        { max: 6.4, label: 'Pre-Diabetic', color: 'amber', tip: 'At risk for diabetes — reduce refined carbs, increase fiber, exercise 150 min/week.' },
        { max: 8.0, label: 'Diabetic', color: 'rose', tip: 'Diabetes detected — strict carb control needed. Avoid sugary foods and white rice.' },
        { max: Infinity, label: 'Severely Uncontrolled', color: 'rose', tip: 'Very high — risk of complications. Needs immediate medical and dietary intervention.' }
    ],
    fastingBloodSugar: [
        { max: 70, label: 'Low (Hypoglycemia)', color: 'violet', tip: 'Blood sugar too low — eat a small snack with natural sugars.' },
        { max: 99, label: 'Normal', color: 'emerald', tip: 'Fasting blood sugar is in the healthy range.' },
        { max: 125, label: 'Pre-Diabetic', color: 'amber', tip: 'Impaired fasting glucose — reduce sugary foods, increase whole grains.' },
        { max: Infinity, label: 'Diabetic', color: 'rose', tip: 'Fasting sugar is in diabetic range — strict diet control and medication may be needed.' }
    ],
    postprandialSugar: [
        { max: 139, label: 'Normal', color: 'emerald', tip: 'Post-meal sugar is well controlled.' },
        { max: 199, label: 'Impaired Tolerance', color: 'amber', tip: 'Glucose tolerance impaired — eat fiber-rich foods first, walk 15 min after meals.' },
        { max: Infinity, label: 'Diabetic', color: 'rose', tip: 'Post-meal sugar is very high — avoid simple carbs, eat protein-first meals.' }
    ],
    totalCholesterol: [
        { max: 199, label: 'Desirable', color: 'emerald', tip: 'Cholesterol is in a healthy range.' },
        { max: 239, label: 'Borderline High', color: 'amber', tip: 'Slightly elevated — reduce saturated fats, increase omega-3 foods.' },
        { max: Infinity, label: 'High', color: 'rose', tip: 'High cholesterol — avoid fried foods, red meat, and trans fats. Eat oats, nuts, and fish.' }
    ],
    ldl: [
        { max: 99, label: 'Optimal', color: 'emerald', tip: 'LDL is at an ideal level. Great for heart health!' },
        { max: 129, label: 'Near Optimal', color: 'emerald', tip: 'LDL is acceptable. Maintain a heart-healthy diet.' },
        { max: 159, label: 'Borderline High', color: 'amber', tip: 'LDL is creeping up — reduce saturated fats and increase soluble fiber.' },
        { max: 189, label: 'High', color: 'rose', tip: 'High LDL — serious cardiac risk. Cut trans fats, limit red meat, eat more fish and nuts.' },
        { max: Infinity, label: 'Very High', color: 'rose', tip: 'Critical LDL level — statin therapy likely needed alongside strict dietary changes.' }
    ],
    hdl: [
        { max: 39, label: 'Low (Risk)', color: 'rose', tip: 'Low HDL increases cardiac risk — exercise more, eat healthy fats (olive oil, avocado, nuts).' },
        { max: 59, label: 'Acceptable', color: 'amber', tip: 'HDL could be better — add omega-3 foods and regular aerobic exercise.' },
        { max: Infinity, label: 'Optimal (Protective)', color: 'emerald', tip: 'Excellent HDL — this protects your heart. Keep up the healthy lifestyle!' }
    ],
    triglycerides: [
        { max: 149, label: 'Normal', color: 'emerald', tip: 'Triglycerides are in a healthy range.' },
        { max: 199, label: 'Borderline High', color: 'amber', tip: 'Slightly elevated — reduce sugar, refined carbs, and alcohol.' },
        { max: 499, label: 'High', color: 'rose', tip: 'High triglycerides — cut out sugary drinks, white bread, and limit alcohol strictly.' },
        { max: Infinity, label: 'Very High', color: 'rose', tip: 'Dangerously high — risk of pancreatitis. Immediate dietary intervention needed.' }
    ],
    egfr: [
        { max: 14, label: 'Kidney Failure', color: 'rose', tip: 'Severe kidney dysfunction — strict protein/potassium/phosphorus restriction required.' },
        { max: 29, label: 'Stage 4 CKD', color: 'rose', tip: 'Severely reduced function — limit protein to 0.6g/kg, restrict potassium and phosphorus.' },
        { max: 59, label: 'Stage 3 CKD', color: 'orange', tip: 'Moderate kidney disease — limit sodium, moderate protein intake, avoid NSAIDs.' },
        { max: 89, label: 'Mildly Reduced', color: 'amber', tip: 'Slight decline in kidney function — stay hydrated, reduce salt intake.' },
        { max: Infinity, label: 'Normal', color: 'emerald', tip: 'Kidney function is healthy. Stay well-hydrated.' }
    ],
    creatinine: [
        { max: 0.59, label: 'Low', color: 'violet', tip: 'Low creatinine — may indicate low muscle mass. Ensure adequate protein intake.' },
        { max: 1.2, label: 'Normal', color: 'emerald', tip: 'Creatinine is in the normal range — kidneys are functioning well.' },
        { max: 1.5, label: 'Elevated', color: 'amber', tip: 'Mildly elevated — could indicate early kidney stress. Stay hydrated, reduce protein overload.' },
        { max: Infinity, label: 'High', color: 'rose', tip: 'High creatinine — possible kidney impairment. Reduce high-protein foods and consult nephrologist.' }
    ],
    uricAcid: [
        { max: 3.0, label: 'Low', color: 'violet', tip: 'Uric acid is on the lower side — generally not a concern.' },
        { max: 7.0, label: 'Normal', color: 'emerald', tip: 'Uric acid is in the normal range.' },
        { max: 8.0, label: 'Elevated', color: 'amber', tip: 'Slightly high — reduce red meat, organ meats, shellfish, and alcohol.' },
        { max: Infinity, label: 'Hyperuricemia', color: 'rose', tip: 'High gout risk — strictly avoid purine-rich foods (liver, sardines, beer). Drink plenty of water.' }
    ],
    tsh: [
        { max: 0.39, label: 'Hyperthyroid', color: 'violet', tip: 'Low TSH suggests overactive thyroid — avoid excess iodine, limit caffeine.' },
        { max: 4.0, label: 'Normal', color: 'emerald', tip: 'Thyroid function is healthy.' },
        { max: 10.0, label: 'Subclinical Hypothyroid', color: 'amber', tip: 'Mildly underactive thyroid — eat selenium-rich foods (Brazil nuts), ensure iodine intake.' },
        { max: Infinity, label: 'Hypothyroid', color: 'rose', tip: 'Thyroid is significantly underactive — metabolism is slowed. Medication and iodine-rich diet needed.' }
    ],
    hemoglobin: [
        { max: 7.9, label: 'Severe Anemia', color: 'rose', tip: 'Critically low — may need iron infusion or transfusion. Eat iron-rich foods (spinach, liver, lentils).' },
        { max: 10.9, label: 'Moderate Anemia', color: 'orange', tip: 'Low hemoglobin — increase iron-rich foods, pair with Vitamin C for absorption.' },
        { max: 11.9, label: 'Mild Anemia', color: 'amber', tip: 'Slightly low — eat more leafy greens, beans, fortified cereals, and red meat.' },
        { max: 17.5, label: 'Normal', color: 'emerald', tip: 'Hemoglobin is healthy — good oxygen-carrying capacity.' },
        { max: Infinity, label: 'High (Polycythemia)', color: 'rose', tip: 'Unusually high — may indicate dehydration or blood disorder. Consult your doctor.' }
    ],
    heartRate: [
        { max: 49, label: 'Bradycardia', color: 'rose', tip: 'Heart rate too slow — may cause fatigue and dizziness. See a cardiologist.' },
        { max: 59, label: 'Low Normal', color: 'amber', tip: 'Slightly low but may be normal for athletes. Monitor for symptoms.' },
        { max: 100, label: 'Normal', color: 'emerald', tip: 'Heart rate is in the healthy range. Regular exercise maintains this.' },
        { max: 120, label: 'Tachycardia', color: 'orange', tip: 'Elevated heart rate — reduce caffeine, manage stress, practice deep breathing.' },
        { max: Infinity, label: 'Severe Tachycardia', color: 'rose', tip: 'Heart rate is dangerously fast — seek medical evaluation. Avoid stimulants.' }
    ],
    spo2: [
        { max: 89, label: 'Critical Hypoxemia', color: 'rose', tip: 'EMERGENCY — oxygen levels critically low. Seek immediate medical care!' },
        { max: 93, label: 'Low', color: 'orange', tip: 'Below normal — may need supplemental oxygen. Practice deep breathing exercises.' },
        { max: 94, label: 'Borderline', color: 'amber', tip: 'Slightly low — monitor closely. Practice diaphragmatic breathing.' },
        { max: Infinity, label: 'Normal', color: 'emerald', tip: 'Oxygen saturation is excellent.' }
    ],
    weight: [], // Handled via BMI
    height: [], // Handled via BMI
};

// BMI interpretation (computed from weight + height)
const BMI_RANGES = [
    { max: 16.0, label: 'Severely Underweight', color: 'rose', tip: 'Critically low weight — risk of malnutrition. Increase caloric intake with nutrient-dense foods.' },
    { max: 18.4, label: 'Underweight', color: 'amber', tip: 'Below healthy weight — eat calorie-dense foods like nuts, avocado, whole grains.' },
    { max: 24.9, label: 'Normal Weight', color: 'emerald', tip: 'Healthy BMI — maintain with balanced diet and regular exercise.' },
    { max: 29.9, label: 'Overweight', color: 'amber', tip: 'Above ideal weight — reduce refined carbs, increase activity to 150 min/week.' },
    { max: 34.9, label: 'Obese (Class I)', color: 'orange', tip: 'Obesity class I — target 5-10% weight loss. Focus on portion control and daily walking.' },
    { max: 39.9, label: 'Obese (Class II)', color: 'rose', tip: 'High obesity risk — structured diet plan needed. Consider consulting a dietitian.' },
    { max: Infinity, label: 'Obese (Class III)', color: 'rose', tip: 'Severe obesity — immediate medical and dietary intervention recommended.' }
];

/**
 * Interpret a single vital sign value instantly (no API call).
 * Returns { label, color, tip } or null if value is empty/invalid.
 */
export function interpretVital(field, value) {
    const v = parseFloat(value);
    if (isNaN(v) || value === '' || value === null || value === undefined) return null;

    const ranges = RANGES[field];
    if (!ranges || ranges.length === 0) return null;

    for (const range of ranges) {
        if (v <= range.max) {
            return { label: range.label, color: range.color, tip: range.tip };
        }
    }
    return null;
}

/**
 * Interpret BMI computed from weight and height.
 */
export function interpretBMI(weight, height) {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (isNaN(w) || isNaN(h) || h === 0) return null;

    const bmi = w / ((h / 100) ** 2);
    for (const range of BMI_RANGES) {
        if (bmi <= range.max) {
            return { label: range.label, color: range.color, tip: range.tip, bmi: bmi.toFixed(1) };
        }
    }
    return null;
}


// ─── AI-Powered Vitals Health Report ───────────────────────────────

/**
 * Generate a comprehensive AI health report based on ALL entered vitals.
 * Uses the same GPT model as the food analysis.
 * Returns: { summary, foodRecommendations[], exercisePlan, lifestyleChanges[], riskAlerts[] }
 */
export const generateVitalsHealthReport = async (patientProfile = {}) => {
    // Build a clinical summary from entered vitals
    const vitals = [];
    if (patientProfile.age) vitals.push(`Age: ${patientProfile.age} years`);
    if (patientProfile.gender) vitals.push(`Gender: ${patientProfile.gender}`);
    if (patientProfile.occupation) vitals.push(`Activity Level: ${patientProfile.occupation}`);
    if (patientProfile.weight) vitals.push(`Weight: ${patientProfile.weight} kg`);
    if (patientProfile.height) vitals.push(`Height: ${patientProfile.height} cm`);
    if (patientProfile.weight && patientProfile.height) {
        const bmi = (patientProfile.weight / ((patientProfile.height / 100) ** 2)).toFixed(1);
        vitals.push(`BMI: ${bmi}`);
    }
    if (patientProfile.hba1c) vitals.push(`HbA1c: ${patientProfile.hba1c}%`);
    if (patientProfile.fastingBloodSugar) vitals.push(`Fasting Blood Sugar: ${patientProfile.fastingBloodSugar} mg/dL`);
    if (patientProfile.postprandialSugar) vitals.push(`Post-Prandial Sugar: ${patientProfile.postprandialSugar} mg/dL`);
    if (patientProfile.bpSystolic && patientProfile.bpDiastolic) vitals.push(`Blood Pressure: ${patientProfile.bpSystolic}/${patientProfile.bpDiastolic} mmHg`);
    if (patientProfile.totalCholesterol) vitals.push(`Total Cholesterol: ${patientProfile.totalCholesterol} mg/dL`);
    if (patientProfile.ldl) vitals.push(`LDL: ${patientProfile.ldl} mg/dL`);
    if (patientProfile.hdl) vitals.push(`HDL: ${patientProfile.hdl} mg/dL`);
    if (patientProfile.triglycerides) vitals.push(`Triglycerides: ${patientProfile.triglycerides} mg/dL`);
    if (patientProfile.egfr) vitals.push(`eGFR: ${patientProfile.egfr} mL/min`);
    if (patientProfile.creatinine) vitals.push(`Creatinine: ${patientProfile.creatinine} mg/dL`);
    if (patientProfile.uricAcid) vitals.push(`Uric Acid: ${patientProfile.uricAcid} mg/dL`);
    if (patientProfile.tsh) vitals.push(`TSH: ${patientProfile.tsh} mIU/L`);
    if (patientProfile.hemoglobin) vitals.push(`Hemoglobin: ${patientProfile.hemoglobin} g/dL`);
    if (patientProfile.heartRate) vitals.push(`Heart Rate: ${patientProfile.heartRate} bpm`);
    if (patientProfile.spo2) vitals.push(`SpO2: ${patientProfile.spo2}%`);
    if (patientProfile.conditions) vitals.push(`Known Conditions: ${patientProfile.conditions}`);
    if (patientProfile.medications) vitals.push(`Medications: ${patientProfile.medications}`);
    if (patientProfile.allergies) vitals.push(`Allergies: ${patientProfile.allergies}`);

    if (vitals.length < 2) return null; // Need at least some vitals

    // Demo fallback
    if (!OPENAI_API_KEY || OPENAI_API_KEY.includes("your_api_key")) {
        return {
            summary: "Based on your vitals, you show signs of elevated blood pressure and borderline blood sugar. Focus on a low-sodium, high-fiber diet with regular exercise.",
            riskAlerts: [
                { condition: "Hypertension Stage 1", severity: "moderate", icon: "🫀", advice: "Reduce sodium to <1500mg/day. Avoid processed foods, pickles, and canned soups." },
                { condition: "Pre-Diabetes Risk", severity: "moderate", icon: "🩸", advice: "Cut refined carbs. Eat whole grains, legumes, and green vegetables." }
            ],
            foodRecommendations: {
                superfoods: [
                    { name: "Leafy Greens (Spinach, Kale)", reason: "Rich in potassium and magnesium — naturally lowers blood pressure", icon: "🥬" },
                    { name: "Oats & Barley", reason: "Beta-glucan fiber reduces cholesterol and stabilizes blood sugar", icon: "🌾" },
                    { name: "Fatty Fish (Salmon, Mackerel)", reason: "Omega-3 reduces inflammation, lowers triglycerides, protects heart", icon: "🐟" },
                    { name: "Berries (Blueberries, Strawberries)", reason: "Anthocyanins improve insulin sensitivity and reduce BP", icon: "🫐" },
                    { name: "Nuts (Almonds, Walnuts)", reason: "Heart-healthy fats, magnesium, and fiber for glycemic control", icon: "🥜" }
                ],
                foodsToAvoid: [
                    { name: "White Rice / White Bread", reason: "High glycemic index spikes blood sugar rapidly", icon: "🍚" },
                    { name: "Processed Meats (Sausage, Bacon)", reason: "High sodium and saturated fat worsens hypertension", icon: "🥓" },
                    { name: "Sugary Drinks / Sodas", reason: "Empty calories spike blood sugar and increase triglycerides", icon: "🥤" },
                    { name: "Fried Foods", reason: "Trans fats raise LDL and increase cardiac risk", icon: "🍟" },
                    { name: "Excess Salt / Pickles", reason: "Sodium retention increases blood pressure further", icon: "🧂" }
                ]
            },
            exercisePlan: {
                daily: { type: "Brisk Walking + Yoga", duration: "30-45 min", timing: "Morning (6-8 AM)", reason: "Morning exercise lowers BP for the entire day and improves insulin sensitivity" },
                weekly: [
                    { day: "Mon/Wed/Fri", activity: "Brisk Walking 30 min", intensity: "Moderate" },
                    { day: "Tue/Thu", activity: "Yoga / Stretching 30 min", intensity: "Low" },
                    { day: "Sat", activity: "Swimming or Cycling 40 min", intensity: "Moderate" },
                    { day: "Sun", activity: "Rest / Light Walk", intensity: "Low" }
                ],
                warnings: ["Avoid heavy lifting if BP > 140/90", "Stay hydrated during exercise"]
            },
            lifestyleChanges: [
                { category: "Sleep", icon: "🌙", title: "Sleep 7-8 Hours", description: "Poor sleep raises cortisol, increasing blood sugar and blood pressure. Aim for consistent sleep/wake times." },
                { category: "Stress", icon: "🧘", title: "Daily Meditation", description: "10 min of deep breathing daily reduces systolic BP by 5-10 mmHg. Use box breathing technique." },
                { category: "Hydration", icon: "💧", title: "Drink 2.5-3L Water Daily", description: "Proper hydration supports kidney function and helps regulate blood pressure." },
                { category: "Habits", icon: "🍽️", title: "Eat in 10-Hour Window", description: "Time-restricted eating (e.g., 8AM-6PM) improves metabolic markers and weight management." },
                { category: "Movement", icon: "🚶", title: "Walk After Every Meal", description: "A 10-15 min walk after eating reduces post-meal glucose spikes by 30%." }
            ]
        };
    }

    // Real API call
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
                        content: `You are a world-class clinical nutritionist, exercise physiologist, and preventive medicine specialist. Based on the patient's clinical vitals, provide a comprehensive personalized health report.

CRITICAL RULES:
- Every recommendation must be SPECIFIC to the patient's actual numbers — do NOT give generic advice.
- Reference the patient's exact vital values in your advice (e.g., "Your BP of 160/100 indicates Stage 2 Hypertension").
- Food recommendations must include specific foods with reasons tied to their clinical markers.
- Exercise must account for their conditions (e.g., avoid heavy lifting with high BP).
- Be medically accurate and evidence-based. Use clinical guidelines (AHA, ADA, KDIGO, etc.).`
                    },
                    {
                        role: "user",
                        content: `Analyze these patient vitals and provide a comprehensive health report:

PATIENT VITALS:
${vitals.map(v => `- ${v}`).join('\n')}

Return ONLY valid JSON in this exact structure:
{
    "summary": "2-3 sentence clinical summary referencing their specific vital values and key risks",
    "riskAlerts": [
        { "condition": "specific condition name", "severity": "low|moderate|high|critical", "icon": "emoji", "advice": "specific actionable advice for THIS patient" }
    ],
    "foodRecommendations": {
        "superfoods": [
            { "name": "specific food", "reason": "why it helps THIS patient's specific markers", "icon": "emoji" }
        ],
        "foodsToAvoid": [
            { "name": "specific food", "reason": "why it's harmful for THIS patient's markers", "icon": "emoji" }
        ]
    },
    "exercisePlan": {
        "daily": { "type": "exercise type", "duration": "time", "timing": "best time", "reason": "why this exercise for their condition" },
        "weekly": [
            { "day": "Day(s)", "activity": "specific activity", "intensity": "Low|Moderate|High" }
        ],
        "warnings": ["exercise warnings specific to their vitals"]
    },
    "lifestyleChanges": [
        { "category": "Sleep|Stress|Hydration|Habits|Movement", "icon": "emoji", "title": "change title", "description": "specific advice tied to their vitals" }
    ]
}`
                    }
                ],
                max_tokens: 3000,
                temperature: 0.3,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) throw new Error("Empty AI response");

        return JSON.parse(content);
    } catch (error) {
        console.error("Vitals AI report error:", error);
        throw error;
    }
};
