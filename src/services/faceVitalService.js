/**
 * Face Vital Service — Connects to NeuroVitals rPPG Backend
 * Handles video analysis and gender detection via the face-vital-inference-engine API.
 */

// Use environment variable for API base, defaulting to the /face-api proxy for development
// Use VITE_FACE_VITAL_API_URL from .env, prioritizing absolute URLs to bypass proxy in production
const API_URL = import.meta.env.VITE_FACE_VITAL_API_URL || import.meta.env.VITE_FACE_API_BASE || '/face-api';
const API_BASE = API_URL.startsWith('http') ? API_URL : API_URL; // Keep logic simple, if it has http it works as absolute.

/**
 * Analyze a recorded video blob via the /analyze endpoint.
 * Returns full clinical features including heart rate, BP, SpO2, hemoglobin, HbA1c, etc.
 */
export async function analyzeVideo(videoBlob, age = 25, gender = 'auto', metadata = {}) {
    const formData = new FormData();
    formData.append('file', videoBlob, 'neuro_acquisition.webm');
    formData.append('age', String(age));
    formData.append('gender', gender);

    if (metadata.stability) formData.append('stability_score', String(metadata.stability));
    if (metadata.lighting) formData.append('lighting_level', String(metadata.lighting));

    const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const detail = errData.detail || `Analysis failed (HTTP ${response.status})`;
        throw new Error(detail);
    }

    return await response.json();
}

/**
 * Detect gender and age from a single frame via /detect_gender endpoint.
 */
export async function detectGender(imageBlob) {
    const formData = new FormData();
    formData.append('file', imageBlob, 'frame.jpg');

    const response = await fetch(`${API_BASE}/detect_gender`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error('Gender detection request failed');
    }

    return await response.json();
}

/**
 * Map the NeuroVitals API response to patient profile fields.
 * Returns an object with keys matching patientProfile state.
 */
export function mapVitalsToProfile(data) {
    const feats = data.ClinicalFeatures || {};
    const mapped = {};

    // Signal Quality/Confidence
    const confidence = data.SignalQualityIndex || data.ConfidenceScore || 0;
    mapped.confidence = (confidence * 100).toFixed(0);

    // Heart Rate
    if (feats.heart_rate_bpm && feats.heart_rate_bpm > 0) {
        mapped.heartRate = Math.round(feats.heart_rate_bpm).toString();
    }

    // Blood Pressure
    if (feats.blood_pressure_sys && feats.blood_pressure_sys > 0) {
        mapped.bpSystolic = Math.round(feats.blood_pressure_sys).toString();
    }
    if (feats.blood_pressure_dia && feats.blood_pressure_dia > 0) {
        mapped.bpDiastolic = Math.round(feats.blood_pressure_dia).toString();
    }

    // SpO2
    if (feats.spo2 && feats.spo2 > 0) {
        mapped.spo2 = feats.spo2.toFixed(1);
    }

    // Metabolic / Hematic (Estimated)
    if (feats.hemoglobin_estimated && feats.hemoglobin_estimated > 0) {
        mapped.hemoglobin = feats.hemoglobin_estimated.toFixed(1);
    }
    if (feats.hba1c_estimated && feats.hba1c_estimated > 0) {
        mapped.hba1c = feats.hba1c_estimated.toFixed(1);
    }

    // Hemodynamics
    if (feats.mean_arterial_pressure) mapped.map = feats.mean_arterial_pressure.toFixed(1);
    if (feats.pulse_pressure) mapped.pulsePressure = feats.pulse_pressure.toFixed(1);
    if (feats.cardiac_workload) mapped.cardiacWorkload = Math.round(feats.cardiac_workload).toString();
    
    // Respiratory
    if (feats.breathing_rate) mapped.respirationRate = feats.breathing_rate.toFixed(1);
    if (feats.pulse_respiration_quotient) mapped.prq = feats.pulse_respiration_quotient.toFixed(2);

    // Risks & Wellness
    if (feats.heart_age) mapped.heartAge = feats.heart_age.toString();
    if (feats.wellness_score) mapped.wellnessScore = (feats.wellness_score * 100).toFixed(0);
    
    // Risk Categories (mapping strings for UI)
    mapped.ascvdRisk = feats.ascvd_risk || 'Low';
    mapped.bpRisk = feats.high_bp_risk > 0.7 ? 'High' : (feats.high_bp_risk > 0.3 ? 'Moderate' : 'Low');
    mapped.glucoseRisk = feats.glucose_risk > 0.7 ? 'High' : (feats.glucose_risk > 0.3 ? 'Moderate' : 'Low');
    mapped.cholesterolRisk = feats.cholesterol_risk > 0.7 ? 'High' : (feats.cholesterol_risk > 0.3 ? 'Moderate' : 'Low');
    mapped.anemiaRisk = feats.anemia_risk > 0.7 ? 'High' : (feats.anemia_risk > 0.3 ? 'Moderate' : 'Low');
    mapped.fallRisk = feats.fall_risk > 0.7 ? 'High' : (feats.fall_risk > 0.3 ? 'Moderate' : 'Low');

    // Mental Health / Stress
    if (data.MentalHealthRiskClass) mapped.riskClass = data.MentalHealthRiskClass;
    if (data.SignalQualityIndex) mapped.confidence = (data.SignalQualityIndex * 100).toFixed(0);

    // Age & Gender from detection
    if (data.DetectedAge && data.DetectedAge > 0) {
        mapped.age = data.DetectedAge.toString();
    }
    if (data.DetectedGender) {
        const g = data.DetectedGender.toLowerCase();
        if (g === 'male') mapped.gender = 'Male';
        else if (g === 'female') mapped.gender = 'Female';
        else mapped.gender = 'Other';
    }

    return mapped;
}

/**
 * Check if the backend is reachable.
 */
export async function checkBackendHealth() {
    try {
        const response = await fetch(`${API_BASE}/`, { method: 'GET' });
        const data = await response.json();
        return data.status === 'ok';
    } catch {
        return false;
    }
}
