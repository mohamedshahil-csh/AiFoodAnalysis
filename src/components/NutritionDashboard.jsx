import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    Camera, Upload, ChevronRight, Activity, Heart, ShieldAlert,
    Scale, FileText, CheckCircle, AlertTriangle, ShieldCheck,
    Zap, Thermometer, Droplets, ArrowUpRight, Copy, Loader2,
    Sun, Moon, Clock, Brain, Timer, Activity as GutIcon,
    History, Download, UtensilsCrossed, Scan, Save, Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeFoodImage, generateMealPlan } from '../services/aiService';
import { mapIngredientsToNutrition, calculateTotals } from '../services/databaseMapping';
import { generateMetabolicInsights } from '../services/metabolicEngine';
import * as clinical from '../utils/clinicalLogic';
import { interpretVital, interpretBMI, generateVitalsHealthReport } from '../services/vitalsInterpreter';
import { ExerciseSection, LifestyleSection, DailyWellnessPlanSection, HydrationSection, MentalWellnessSection } from './WellnessSections';
import { HealthScoreBadge, HealthierAlternativesSection, DrugInteractionAlerts, MealHistoryPanel, MealPlanModal, exportToPDF, HealthHistoryModal } from './AdvancedFeatures';
import FaceScanner from './FaceScanner';
import { authService } from '../services/authService';

const NutritionDashboard = ({ user, onLogout }) => {
    const [userName, setUserName] = useState(user?.name || '');
    const [userEmail, setUserEmail] = useState(user?.email || '');
    const [theme, setTheme] = useState('dark');
    const [debugMsg, setDebugMsg] = useState('');
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [base64Data, setBase64Data] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [showProfile, setShowProfile] = useState(true);
    const [showMealHistory, setShowMealHistory] = useState(false);
    const [showMealPlan, setShowMealPlan] = useState(false);
    const [mealPlan, setMealPlan] = useState(null);
    const [showHealthHistory, setShowHealthHistory] = useState(false);
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
    const [healthReport, setHealthReport] = useState(null);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [showHealthReport, setShowHealthReport] = useState(false);
    const [showFaceScanner, setShowFaceScanner] = useState(false);

    const [patientProfile, setPatientProfile] = useState({
        age: '', gender: '', occupation: '',
        weight: '', height: '',
        hba1c: '', fastingBloodSugar: '', postprandialSugar: '',
        bpSystolic: '', bpDiastolic: '',
        totalCholesterol: '', ldl: '', hdl: '', triglycerides: '',
        egfr: '', creatinine: '', uricAcid: '',
        tsh: '', hemoglobin: '', heartRate: '', spo2: '',
        conditions: '', medications: '', allergies: '',
        map: '', pulsePressure: '', cardiacWorkload: '',
        respirationRate: '', prq: '', heartAge: '',
        wellnessScore: '', riskClass: '', confidence: '',
        ascvdRisk: '', bpRisk: '', glucoseRisk: '',
        cholesterolRisk: '', anemiaRisk: '', fallRisk: ''
    });

    const fileInputRef = useRef(null);
    const dashboardRef = useRef(null);

    const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

    const updateProfile = (field, value) => {
        setPatientProfile(prev => ({ ...prev, [field]: value }));
    };

    // ── Persistence: Save Draft Profile & Image to localStorage ──
    useEffect(() => {
        if (patientProfile.age || patientProfile.weight || patientProfile.height) {
            localStorage.setItem('draftProfile', JSON.stringify(patientProfile));
        }
    }, [patientProfile]);

    useEffect(() => {
        if (base64Data) {
            localStorage.setItem('draftPhoto', base64Data);
        }
    }, [base64Data]);

    // ── Persistence: Restore Draft on Mount (as fallback) ──
    const restoreDraft = useCallback(() => {
        // Restore Profile
        const savedProfile = localStorage.getItem('draftProfile');
        if (savedProfile) {
            try {
                const parsed = JSON.parse(savedProfile);
                setPatientProfile(prev => ({ ...prev, ...parsed }));
            } catch (e) { }
        }

        // Restore Photo
        const savedPhoto = localStorage.getItem('draftPhoto');
        if (savedPhoto) {
            setBase64Data(savedPhoto);
            setPreview(savedPhoto);
            setDebugMsg("Last capture recovered.");
        }
    }, []);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // 1. Restore from Draft first for speed/offline resiliency
                restoreDraft();

                // 2. Fetch User Basic Info
                const userData = await authService.getMe();
                setUserName(userData.name || userData.email);
                setUserEmail(userData.email || '');

                // 3. Fetch Latest Vitals Profile from DB
                const profileData = await authService.getLatestProfile(userData.id);

                if (profileData) {
                    setPatientProfile(prev => ({
                        ...prev,
                        ...profileData,
                        weight: profileData.weight || userData.weight || '',
                        height: profileData.height || userData.height || ''
                    }));
                }
            } catch (error) {
                console.error("Initialization error:", error);
                const cached = authService.getUser();
                if (cached) {
                    setUserName(cached.name || cached.email);
                    setUserEmail(cached.email || '');
                }
            }
        };

        loadInitialData();
    }, [restoreDraft]);

    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const handleUpdateProfile = async () => {
        setIsUpdatingProfile(true);
        let userUpdateSuccess = false;
        let vitalSaveSuccess = false;
        let errorMessage = '';

        try {
            const user = authService.getUser();
            if (!user?.id) throw new Error('User session not found. Please log in again.');

            // 1. Try to Save Clinical Vitals (The most important part)
            try {
                console.log("[Dashboard] Attempting to save clinical vitals to /api/profile...");
                await authService.saveProfile({
                    user_id: user.id,
                    ...patientProfile
                });
                vitalSaveSuccess = true;
            } catch (vitalErr) {
                console.error("Clinical Vitals save failed:", vitalErr);
                errorMessage += `Vitals Save: ${vitalErr.message}. `;
            }

            // 2. Try to Update Basic User Info (Optional fallback)
            try {
                console.log("[Dashboard] Attempting to update user record to /api/users/...");
                await authService.updateProfile({
                    name: userName,
                    email: userEmail,
                    weight: patientProfile.weight,
                    height: patientProfile.height
                });
                userUpdateSuccess = true;

                // Refresh cached user data
                const freshUser = await authService.getMe();
                setUserName(freshUser.name);
            } catch (userErr) {
                console.error("User record update failed:", userErr);
                errorMessage += `User Update: ${userErr.message}. `;
            }

            if (vitalSaveSuccess || userUpdateSuccess) {
                alert('Success: ' +
                    (vitalSaveSuccess ? 'Clinical Vitals saved. ' : '') +
                    (userUpdateSuccess ? 'User profile updated.' : ''));
            } else {
                throw new Error(errorMessage || 'Both updates failed.');
            }

        } catch (err) {
            console.error(err);
            alert('Update Error: ' + err.message);
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    // MOBILE FIX: Use createImageBitmap (most efficient mobile API) to load
    // the image directly from the File, compress via canvas, then set preview.
    // This avoids the 7-15MB raw dataURL that crashes mobile Chrome.
    const handleFileUpload = (e) => {
        try {
            const f = e.target.files?.[0];
            if (!f) return;

            // 1. Memory-Safe UI Preview
            const objUrl = URL.createObjectURL(f);
            setPreview(objUrl);
            setFile(f);
            setBase64Data(null);

            setDebugMsg(`Analyzing specimen: ${(f.size / 1024).toFixed(0)}KB...`);

            // 2. Aggressive Resize & Background Storage
            const processImage = (imgSource) => {
                const w_orig = imgSource.width;
                const h_orig = imgSource.height;

                let w = w_orig, h = h_orig;
                const maxDim = 1024;
                if (w > maxDim || h > maxDim) {
                    if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
                    else { w = Math.round(w * maxDim / h); h = maxDim; }
                }

                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(imgSource, 0, 0, w, h);

                const b64 = canvas.toDataURL('image/jpeg', 0.8);
                setBase64Data(b64);

                // Cleanup
                if (imgSource.close) imgSource.close();
                setDebugMsg(`Specimen stabilized (${w}x${h}). Ready for analysis.`);
            };

            if (typeof createImageBitmap === 'function') {
                createImageBitmap(f).then(processImage).catch(() => fallbackReadFile(f));
            } else {
                fallbackReadFile(f);
            }
        } catch (err) {
            setDebugMsg('ERROR: ' + err.message);
        }
    };

    // Fallback: FileReader → Image → Canvas → compressed dataURL
    const fallbackReadFile = (f, name, sizeKB) => {
        const reader = new FileReader();
        reader.onload = () => {
            setDebugMsg(`[2/3] Read OK (${(reader.result.length / 1024).toFixed(0)}KB) — compressing...`);
            const img = new Image();
            img.onload = () => {
                let w = img.width, h = img.height;
                const maxDim = 1024;
                if (w > maxDim || h > maxDim) {
                    if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
                    else { w = Math.round(w * maxDim / h); h = maxDim; }
                }
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                const compressed = canvas.toDataURL('image/jpeg', 0.7);
                setPreview(compressed);
                setBase64Data(compressed);
                setFile(f);
                setDebugMsg(`[3/3] ✅ Ready! ${w}x${h} (${(compressed.length / 1024).toFixed(0)}KB)`);
            };
            img.onerror = () => {
                // Last resort: use raw dataURL directly
                setPreview(reader.result);
                setBase64Data(reader.result);
                setFile(f);
                setDebugMsg(`[3/3] ⚠️ Using raw image (${sizeKB}KB)`);
            };
            img.src = reader.result;
        };
        reader.onerror = () => {
            setDebugMsg('❌ FileReader FAILED: ' + (reader.error?.message || 'unknown'));
        };
        reader.readAsDataURL(f);
    };

    // Trigger the hidden file input
    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.click();
        }
    };

    const runAnalysis = async () => {
        if (!preview && !file) return;
        setIsAnalyzing(true);
        setAnalysis(null);

        try {
            // Get base64 data for AI analysis
            let b64;
            if (base64Data) {
                b64 = base64Data.split(',')[1];
            } else if (preview?.startsWith('data:')) {
                b64 = preview.split(',')[1];
            } else if (file) {
                // preview is an objectURL and base64 not ready yet, convert now
                const dataUrl = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = () => reject(reader.error);
                    reader.readAsDataURL(file);
                });
                b64 = dataUrl.split(',')[1];
            } else {
                throw new Error('No image data available. Please re-select the photo.');
            }
            const findings = await analyzeFoodImage(b64, patientProfile);
            console.log("RAW AI ANALYSIS RESPONSE:", findings);

            if (!findings || !findings.ingredients) {
                throw new Error("AI failed to identify ingredients. Please try a clearer photo.");
            }

            const mapped = (findings.ingredients[0] && findings.ingredients[0].calories !== undefined)
                ? findings.ingredients
                : mapIngredientsToNutrition(findings.ingredients);

            const totals = calculateTotals(mapped);
            const novaClassification = clinical.getNovaClassification(mapped);

            setAnalysis({
                findings,
                mapped,
                totals,
                clinical: {
                    gl: clinical.calculateGlycemicLoad(mapped),
                    exchanges: clinical.calculateDiabeticExchanges(totals),
                    cardiac: clinical.getCardiacAlerts(totals),
                    renal: clinical.checkRenalCompatibility(totals),
                    geriatric: clinical.getGeriatricInsights(mapped, totals),
                    weightScore: clinical.calculateWeightMgmtScore(totals),
                    drugAlerts: clinical.getDrugNutrientAlerts(mapped),
                    allergens: clinical.detectAllergens(mapped),
                    purine: clinical.getPurineStatus(mapped),
                    fodmap: clinical.getFodmapStatus(mapped),
                    inflammation: clinical.calculateInflammationScore(mapped, totals),
                    metabolic: generateMetabolicInsights({
                        totals,
                        mappedIngredients: mapped,
                        clinical: { nova: novaClassification },
                        fullMetabolicPrediction: findings.fullMetabolicPrediction
                    }),
                    nova: novaClassification,
                    dash: clinical.calculateDashScore(totals),
                    immune: clinical.calculateImmuneIndex(totals),
                    antioxidants: clinical.getAntioxidantProfile(mapped),
                    wellness: findings.wellnessIntelligence,
                    emr: clinical.generateEMREntry({
                        totals, findings, clinical: {
                            gl: clinical.calculateGlycemicLoad(mapped),
                            nova: novaClassification,
                            dash: clinical.calculateDashScore(totals),
                            immune: clinical.calculateImmuneIndex(totals),
                            metabolic: generateMetabolicInsights({
                                totals,
                                mappedIngredients: mapped,
                                clinical: { nova: novaClassification },
                                fullMetabolicPrediction: findings.fullMetabolicPrediction
                            }),
                            inflammation: clinical.calculateInflammationScore(mapped, totals),
                            drugAlerts: clinical.getDrugNutrientAlerts(mapped)
                        }
                    })
                }
            });

            // Auto-save to backend meal history
            try {
                const user = authService.getUser();
                if (user?.id) {
                    await authService.saveMeal({
                        user_id: user.id,
                        dishName: findings.dishName,
                        overallHealthScore: findings.overallHealthScore,
                        clinicalSuitability: {
                            verdict: findings.clinicalSuitability?.verdict,
                            explanation: findings.clinicalSuitability?.explanation
                        },
                        ingredients: mapped.map(ing => ({
                            name: ing.name,
                            calories: ing.calories,
                            protein: ing.protein,
                            carbs: ing.carbs,
                            fat: ing.fat
                        })),
                        full_json: findings // Store full analysis for deep-dive
                    });
                }
            } catch (saveErr) {
                console.error("Auto-save failed:", saveErr);
            }
        } catch (err) {
            console.error(err);
            alert(`Analysis failed: ${err.message}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleExportPDF = () => {
        if (dashboardRef.current && analysis) {
            exportToPDF(dashboardRef, analysis.findings.dishName);
        }
    };

    const handleGenerateMealPlan = async () => {
        setShowMealPlan(true);
        setIsGeneratingPlan(true);
        try {
            // ALWAYS fetch the absolute latest clinical profile for the meal plan
            const latestProfile = await authService.getLatestProfile(user.id);
            const plan = await generateMealPlan(latestProfile || patientProfile, analysis?.findings);
            setMealPlan(plan);
        } catch (err) {
            console.error("Meal plan profile fetch failed, falling back to local state:", err);
            try {
                const plan = await generateMealPlan(patientProfile, analysis?.findings);
                setMealPlan(plan);
            } catch (fallbackErr) {
                console.error(fallbackErr);
                alert('Failed to generate meal plan: ' + fallbackErr.message);
            }
        } finally {
            setIsGeneratingPlan(false);
        }
    };

    const handleGenerateHealthReport = async () => {
        setIsGeneratingReport(true);
        setShowHealthReport(true);
        setHealthReport(null);
        try {
            const report = await generateVitalsHealthReport(patientProfile);
            setHealthReport(report);
        } catch (err) {
            console.error(err);
            alert('Failed to generate health report: ' + err.message);
        } finally {
            setIsGeneratingReport(false);
        }
    };

    // Inline VitalFeedback badge component
    const VitalFeedback = ({ field, value }) => {
        const result = interpretVital(field, value);
        if (!result) return null;
        const colorMap = {
            emerald: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', text: '#10b981' },
            amber: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: '#f59e0b' },
            orange: { bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)', text: '#f97316' },
            rose: { bg: 'rgba(244,63,94,0.12)', border: 'rgba(244,63,94,0.3)', text: '#f43f5e' },
            violet: { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.3)', text: '#8b5cf6' },
        };
        const c = colorMap[result.color] || colorMap.amber;
        return (
            <motion.div
                initial={{ opacity: 0, y: -4, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -4, height: 0 }}
                transition={{ duration: 0.25 }}
                className={`mt-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-bold leading-snug ${result.color === 'rose' ? 'vital-badge-pulse' : ''}`}
                style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}
            >
                <span className="font-black uppercase tracking-wider">{result.label}</span>
                <span className="block mt-0.5 opacity-80 font-medium" style={{ fontSize: '8px' }}>{result.tip}</span>
            </motion.div>
        );
    };

    const BMIFeedback = () => {
        const result = interpretBMI(patientProfile.weight, patientProfile.height);
        if (!result) return null;
        const colorMap = {
            emerald: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', text: '#10b981' },
            amber: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: '#f59e0b' },
            orange: { bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)', text: '#f97316' },
            rose: { bg: 'rgba(244,63,94,0.12)', border: 'rgba(244,63,94,0.3)', text: '#f43f5e' },
        };
        const c = colorMap[result.color] || colorMap.amber;
        return (
            <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-bold leading-snug"
                style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}
            >
                <span className="font-black uppercase tracking-wider">{result.label}</span>
                <span className="block mt-0.5 opacity-80 font-medium" style={{ fontSize: '8px' }}>{result.tip}</span>
            </motion.div>
        );
    };

    return (
        <div className={`${theme} min-h-screen transition-colors duration-500`}>
            <div ref={dashboardRef} className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-cyan-500/30">
                <div className="max-w-[1400px] mx-auto px-6 py-12 lg:py-20">

                    {/* Header: Minimalist Precision */}
                    <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-20 border-b border-[var(--border)] pb-12">
                        <div className="space-y-2">
                            <div className="flex items-center gap-6">

                                <button
                                    onClick={toggleTheme}
                                    className="p-2 rounded-full hover:bg-[var(--border)] transition-colors group"
                                    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                                >
                                    {theme === 'dark' ? (
                                        <Sun className="w-4 h-4 text-amber-500 group-hover:rotate-45 transition-transform" />
                                    ) : (
                                        <Moon className="w-4 h-4 text-indigo-500 group-hover:-rotate-12 transition-transform" />
                                    )}
                                </button>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter">
                                NUTRI<span className="text-zinc-500 font-light uppercase tracking-widest">clinical</span>
                            </h1>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Metadata Engine</p>
                                <p className="text-xs font-mono text-zinc-400 mt-1">GPT-4o Vision · Precision Mode</p>
                            </div>
                            {/* User Profile & Logout */}
                            <div className="flex items-center gap-3 pl-6 border-l border-[var(--border)]">
                                <div className="user-avatar-badge cursor-pointer hover:ring-2 hover:ring-[var(--primary)] transition-all" onClick={() => setShowProfile(true)}>
                                    {(userName || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col items-end">
                                    <button
                                        onClick={() => {
                                            setShowProfile(true);
                                            // Smooth scroll to profile
                                            const el = document.getElementById('patient-profile-section');
                                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        className="flex items-center gap-2 group mb-0.5"
                                    >
                                        <p className="text-xs font-bold text-[var(--foreground)] leading-tight group-hover:text-[var(--primary)] transition-colors">
                                            {userName || 'User'}
                                        </p>
                                        <Edit2 className="w-3 h-3 text-[var(--muted)] group-hover:text-[var(--primary)] transition-colors" />
                                    </button>
                                    <button
                                        onClick={onLogout}
                                        className="text-[9px] font-bold text-rose-400 hover:text-rose-300 uppercase tracking-widest transition-colors"
                                        id="logout-btn"
                                    >
                                        Logout →
                                    </button>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Action Bar */}
                    <div className="flex flex-wrap gap-3 mb-8 -mt-12 pb-6 border-b border-[var(--border)]">
                        <button
                            onClick={() => setShowMealHistory(true)}
                            className="flex items-center gap-2 px-4 py-2.5 text-[9px] font-black uppercase tracking-widest bg-[var(--card)] border border-[var(--border)] rounded-xl hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all">
                            <History className="w-3.5 h-3.5" /> Meal History
                        </button>
                        <button
                            onClick={handleExportPDF}
                            disabled={!analysis}
                            className={`flex items-center gap-2 px-4 py-2.5 text-[9px] font-black uppercase tracking-widest bg-[var(--card)] border border-[var(--border)] rounded-xl hover:border-emerald-500 hover:text-emerald-500 transition-all ${!analysis ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}>
                            <Download className="w-3.5 h-3.5" /> Export PDF
                        </button>
                        <button
                            onClick={handleGenerateMealPlan}
                            className="flex items-center gap-2 px-4 py-2.5 text-[9px] font-black uppercase tracking-widest bg-[var(--primary)]/10 border border-[var(--primary)]/30 rounded-xl text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-all active:scale-95 shadow-lg shadow-[var(--primary)]/5">
                            <UtensilsCrossed className="w-3.5 h-3.5" /> Generate Meal Plan
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

                        {/* Control Column */}
                        <div className="lg:col-span-4 space-y-12">
                            <section className="space-y-8">
                                {/* HIDDEN file input — outside the preview area so re-renders don't affect it */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                />


                                {/* Preview Area — shows detected food name */}
                                <div className="group relative aspect-square rounded-2xl border border-dashed border-[var(--border)] hover:border-[var(--primary)] transition-all duration-300 overflow-hidden bg-[var(--card)]">
                                    {preview ? (
                                        <>
                                            <img src={preview} alt={analysis?.findings?.dishName || 'Food photo'} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                            {/* Food Name Overlay */}
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-8">
                                                <p className="text-white text-sm font-extrabold tracking-tight drop-shadow-lg">
                                                    {analysis?.findings?.dishName || 'Photo ready — tap Analyze'}
                                                </p>
                                                {analysis?.findings?.cuisine && (
                                                    <p className="text-cyan-300 text-[10px] font-bold uppercase tracking-widest mt-1 drop-shadow">
                                                        {analysis.findings.cuisine} Cuisine
                                                    </p>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full gap-4 text-[var(--muted)]">
                                            <div className="p-4 rounded-full border border-[var(--border)] bg-[var(--background)]">
                                                <Camera className="w-6 h-6" />
                                            </div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest">Upload Food Photo</p>
                                            <p className="text-[9px] text-[var(--muted)] opacity-60">Burger, Pizza, Thali & more</p>
                                        </div>
                                    )}
                                </div>

                                {/* Upload Buttons — clearly visible and tappable on mobile */}
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={triggerFileInput}
                                        className="flex items-center justify-center gap-2 py-4 px-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--card-hover)] hover:border-[var(--primary)] transition-all active:scale-[0.97] text-[var(--foreground)]"
                                    >
                                        <Upload className="w-4 h-4 text-[var(--primary)]" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Upload Photo</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (fileInputRef.current) {
                                                fileInputRef.current.value = '';
                                                fileInputRef.current.setAttribute('capture', 'environment');
                                                fileInputRef.current.click();
                                                // Remove capture after click so gallery still works
                                                setTimeout(() => fileInputRef.current?.removeAttribute('capture'), 500);
                                            }
                                        }}
                                        className="flex items-center justify-center gap-2 py-4 px-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--card-hover)] hover:border-[var(--primary)] transition-all active:scale-[0.97] text-[var(--foreground)]"
                                    >
                                        <Camera className="w-4 h-4 text-[var(--primary)]" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Take Photo</span>
                                    </button>
                                </div>

                                {/* Initialize Diagnostic Button — Moved here for better UX */}
                                <button
                                    onClick={runAnalysis}
                                    disabled={!preview || isAnalyzing}
                                    className={`w-full py-5 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${isAnalyzing
                                        ? 'bg-[var(--border)] text-[var(--muted)] border border-[var(--border)]'
                                        : 'bg-[var(--foreground)] text-[var(--background)] hover:bg-[var(--primary)] hover:text-white border border-transparent shadow-[0_0_20px_rgba(34,211,238,0.1)]'
                                        }`}
                                >
                                    {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" /> : <Activity className="w-4 h-4" />}
                                    {isAnalyzing ? 'Sequencing...' : 'Initialize Diagnostic'}
                                </button>

                                {/* Mobile Debug Info */}
                                {debugMsg && (
                                    <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[10px] font-mono break-all">
                                        DEBUG: {debugMsg}
                                    </div>
                                )}

                                {/* Patient Profile Section */}
                                <div id="patient-profile-section" className={`border border-[var(--border)] bg-[var(--card)] rounded-2xl overflow-hidden transition-all duration-500 ${showProfile ? 'ring-1 ring-[var(--primary)]/20 shadow-lg' : ''}`}>
                                    <button
                                        onClick={() => setShowProfile(!showProfile)}
                                        className="w-full flex items-center justify-between p-5 hover:bg-[var(--card-hover)] transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Heart className="w-4 h-4 text-[var(--primary)]" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">Patient Profile & Vitals</span>
                                        </div>
                                        <ChevronRight className={`w-4 h-4 text-[var(--muted)] transition-transform ${showProfile ? 'rotate-90' : ''}`} />
                                    </button>
                                    {showProfile && (
                                        <div className="px-5 pb-5 space-y-5">
                                            <div className="grid grid-cols-1 gap-3 mb-2">
                                                {/* <button
                                                    onClick={() => setShowFaceScanner(true)}
                                                    className="w-full py-3.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2 active:scale-[0.98] bg-gradient-to-r from-cyan-600 to-violet-500 text-white hover:from-cyan-700 hover:to-violet-600 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                                                >
                                                    <Scan className="w-4 h-4" />
                                                    🧬 Scan Face
                                                </button> */}

                                                {/* <button
                                                    onClick={() => setShowHealthHistory(true)}
                                                    className="w-full py-3.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2 active:scale-[0.98] border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--card-hover)]"
                                                >
                                                    <History className="w-4 h-4" />
                                                    📈 View History
                                                </button> */}
                                            </div>

                                            <button
                                                onClick={handleUpdateProfile}
                                                disabled={isUpdatingProfile}
                                                className="w-full py-3.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2 active:scale-[0.98] border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 mb-6"
                                            >
                                                {isUpdatingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                💾 Save Profile to Database
                                            </button>

                                            {/* ── Demographics ── */}
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest">Full Name</label>
                                                        <input type="text" placeholder="Your Name" value={userName} onChange={e => setUserName(e.target.value)}
                                                            className="w-full p-2.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest">Email Address</label>
                                                        <input type="email" value={userEmail} disabled
                                                            className="w-full p-2.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--muted)] cursor-not-allowed opacity-70" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest">Age</label>
                                                        <input type="number" placeholder="e.g. 45" value={patientProfile.age} onChange={e => updateProfile('age', e.target.value)}
                                                            className="w-full p-2.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest">Gender</label>
                                                        <select value={patientProfile.gender} onChange={e => updateProfile('gender', e.target.value)}
                                                            className="w-full p-2.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors">
                                                            <option value="">Select</option>
                                                            <option value="Male">Male</option>
                                                            <option value="Female">Female</option>
                                                            <option value="Other">Other</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest">Activity Level</label>
                                                        <select value={patientProfile.occupation} onChange={e => updateProfile('occupation', e.target.value)}
                                                            className="w-full p-2.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors">
                                                            <option value="">Select</option>
                                                            <option value="Sedentary">Sedentary/Desk</option>
                                                            <option value="Moderate">Moderate Activity</option>
                                                            <option value="Active">Active/Manual</option>
                                                            <option value="Athlete">Athlete</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ── Body Metrics ── */}
                                            <div className="border-t border-[var(--border)] pt-3">
                                                <p className="text-[8px] font-black text-violet-500 uppercase tracking-widest mb-3">📐 Body Metrics</p>
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest">Weight (kg)</label>
                                                        <input type="number" step="0.1" placeholder="e.g. 72" value={patientProfile.weight} onChange={e => updateProfile('weight', e.target.value)}
                                                            className="w-full p-2.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest">Height (cm)</label>
                                                        <input type="number" placeholder="e.g. 170" value={patientProfile.height} onChange={e => updateProfile('height', e.target.value)}
                                                            className="w-full p-2.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest">BMI</label>
                                                        <div className="w-full p-2.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--primary)] font-bold">
                                                            {patientProfile.weight && patientProfile.height
                                                                ? (patientProfile.weight / ((patientProfile.height / 100) ** 2)).toFixed(1)
                                                                : '—'}
                                                        </div>
                                                        <AnimatePresence><BMIFeedback /></AnimatePresence>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ── Blood Sugar Panel ── */}
                                            <div className="border-t border-[var(--border)] pt-3">
                                                <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest mb-3">🩸 Blood Sugar</p>
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest">HbA1c %</label>
                                                        <input type="number" step="0.1" placeholder="e.g. 6.5" value={patientProfile.hba1c} onChange={e => updateProfile('hba1c', e.target.value)}
                                                            className="w-full p-2.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors" />
                                                        <AnimatePresence><VitalFeedback field="hba1c" value={patientProfile.hba1c} /></AnimatePresence>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest">Fasting BS</label>
                                                        <input type="number" placeholder="mg/dL" value={patientProfile.fastingBloodSugar} onChange={e => updateProfile('fastingBloodSugar', e.target.value)}
                                                            className="w-full p-2.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors" />
                                                        <AnimatePresence><VitalFeedback field="fastingBloodSugar" value={patientProfile.fastingBloodSugar} /></AnimatePresence>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest">PP Sugar</label>
                                                        <input type="number" placeholder="mg/dL" value={patientProfile.postprandialSugar} onChange={e => updateProfile('postprandialSugar', e.target.value)}
                                                            className="w-full p-2.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors" />
                                                        <AnimatePresence><VitalFeedback field="postprandialSugar" value={patientProfile.postprandialSugar} /></AnimatePresence>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ── Lipid Panel ── */}
                                            <div className="border-t border-[var(--border)] pt-3">
                                                <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest mb-3">💛 Lipid Panel</p>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest">Total Cholesterol</label>
                                                        <input type="number" placeholder="mg/dL" value={patientProfile.totalCholesterol} onChange={e => updateProfile('totalCholesterol', e.target.value)}
                                                            className="w-full p-2.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors" />
                                                        <AnimatePresence><VitalFeedback field="totalCholesterol" value={patientProfile.totalCholesterol} /></AnimatePresence>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest">LDL mg/dL</label>
                                                        <input type="number" placeholder="e.g. 130" value={patientProfile.ldl} onChange={e => updateProfile('ldl', e.target.value)}
                                                            className="w-full p-2.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors" />
                                                        <AnimatePresence><VitalFeedback field="ldl" value={patientProfile.ldl} /></AnimatePresence>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest">HDL mg/dL</label>
                                                        <input type="number" placeholder="e.g. 55" value={patientProfile.hdl} onChange={e => updateProfile('hdl', e.target.value)}
                                                            className="w-full p-2.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors" />
                                                        <AnimatePresence><VitalFeedback field="hdl" value={patientProfile.hdl} /></AnimatePresence>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest">Triglycerides</label>
                                                        <input type="number" placeholder="mg/dL" value={patientProfile.triglycerides} onChange={e => updateProfile('triglycerides', e.target.value)}
                                                            className="w-full p-2.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors" />
                                                        <AnimatePresence><VitalFeedback field="triglycerides" value={patientProfile.triglycerides} /></AnimatePresence>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ── BP & Organ Function ── */}
                                            <div className="border-t border-[var(--border)] pt-3">
                                                <p className="text-[8px] font-black text-[var(--primary)] uppercase tracking-widest mb-3">🫀 Cardiovascular & Organ Function</p>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest">BP (Sys/Dia)</label>
                                                        <div className="flex gap-1">
                                                            <input type="number" placeholder="120" value={patientProfile.bpSystolic} onChange={e => updateProfile('bpSystolic', e.target.value)}
                                                                className="w-full p-2.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors" />
                                                            <span className="text-[var(--muted)] self-center text-xs">/</span>
                                                            <input type="number" placeholder="80" value={patientProfile.bpDiastolic} onChange={e => updateProfile('bpDiastolic', e.target.value)}
                                                                className="w-full p-2.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors" />
                                                        </div>
                                                        <AnimatePresence><VitalFeedback field="bpSystolic" value={patientProfile.bpSystolic} /></AnimatePresence>
                                                        <AnimatePresence><VitalFeedback field="bpDiastolic" value={patientProfile.bpDiastolic} /></AnimatePresence>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest">eGFR mL/min</label>
                                                        <input type="number" placeholder="e.g. 90" value={patientProfile.egfr} onChange={e => updateProfile('egfr', e.target.value)}
                                                            className="w-full p-2.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors" />
                                                        <AnimatePresence><VitalFeedback field="egfr" value={patientProfile.egfr} /></AnimatePresence>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest">Creatinine</label>
                                                        <input type="number" step="0.1" placeholder="mg/dL" value={patientProfile.creatinine} onChange={e => updateProfile('creatinine', e.target.value)}
                                                            className="w-full p-2.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors" />
                                                        <AnimatePresence><VitalFeedback field="creatinine" value={patientProfile.creatinine} /></AnimatePresence>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest">Uric Acid</label>
                                                        <input type="number" step="0.1" placeholder="mg/dL" value={patientProfile.uricAcid} onChange={e => updateProfile('uricAcid', e.target.value)}
                                                            className="w-full p-2.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors" />
                                                        <AnimatePresence><VitalFeedback field="uricAcid" value={patientProfile.uricAcid} /></AnimatePresence>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ── Additional Vitals ── */}
                                            <div className="border-t border-[var(--border)] pt-3">
                                                <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-3">🩺 Additional Vitals</p>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest">TSH (Thyroid)</label>
                                                        <input type="number" step="0.01" placeholder="mIU/L" value={patientProfile.tsh} onChange={e => updateProfile('tsh', e.target.value)}
                                                            className="w-full p-2.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors" />
                                                        <AnimatePresence><VitalFeedback field="tsh" value={patientProfile.tsh} /></AnimatePresence>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest">Hemoglobin</label>
                                                        <input type="number" step="0.1" placeholder="g/dL" value={patientProfile.hemoglobin} onChange={e => updateProfile('hemoglobin', e.target.value)}
                                                            className="w-full p-2.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors" />
                                                        <AnimatePresence><VitalFeedback field="hemoglobin" value={patientProfile.hemoglobin} /></AnimatePresence>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest">Heart Rate</label>
                                                        <input type="number" placeholder="bpm" value={patientProfile.heartRate} onChange={e => updateProfile('heartRate', e.target.value)}
                                                            className="w-full p-2.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors" />
                                                        <AnimatePresence><VitalFeedback field="heartRate" value={patientProfile.heartRate} /></AnimatePresence>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest">SpO₂ %</label>
                                                        <input type="number" placeholder="e.g. 98" value={patientProfile.spo2} onChange={e => updateProfile('spo2', e.target.value)}
                                                            className="w-full p-2.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors" />
                                                        <AnimatePresence><VitalFeedback field="spo2" value={patientProfile.spo2} /></AnimatePresence>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ── Conditions, Medications, Allergies ── */}
                                            <div className="border-t border-[var(--border)] pt-3">
                                                <p className="text-[8px] font-black text-pink-500 uppercase tracking-widest mb-3">📋 Medical History</p>
                                                <div className="space-y-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest">Conditions</label>
                                                        <input type="text" placeholder="e.g. Type 2 Diabetes, Hypertension, PCOS" value={patientProfile.conditions} onChange={e => updateProfile('conditions', e.target.value)}
                                                            className="w-full p-2.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest">Medications</label>
                                                        <input type="text" placeholder="e.g. Metformin 500mg, Amlodipine 5mg" value={patientProfile.medications} onChange={e => updateProfile('medications', e.target.value)}
                                                            className="w-full p-2.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest">Food Allergies</label>
                                                        <input type="text" placeholder="e.g. Peanuts, Shellfish, Gluten" value={patientProfile.allergies} onChange={e => updateProfile('allergies', e.target.value)}
                                                            className="w-full p-2.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ── AI Health Report Button ── */}
                                            <div className="border-t border-[var(--border)] pt-4">
                                                <button
                                                    onClick={handleGenerateHealthReport}
                                                    disabled={isGeneratingReport}
                                                    className="w-full py-4 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 active:scale-[0.98] bg-gradient-to-r from-violet-600 to-cyan-500 text-white hover:from-violet-700 hover:to-cyan-600 shadow-[0_0_25px_rgba(139,92,246,0.3)] disabled:opacity-50"
                                                >
                                                    {isGeneratingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                                                    {isGeneratingReport ? 'Generating AI Report...' : '🧠 Generate AI Health Report'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* ── AI Health Report Panel ── */}
                                <AnimatePresence>
                                    {showHealthReport && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 20 }}
                                            className="border border-[var(--border)] bg-[var(--card)] rounded-2xl overflow-hidden"
                                        >
                                            <div className="flex items-center justify-between p-5 border-b border-[var(--border)] bg-gradient-to-r from-violet-500/10 to-cyan-500/10">
                                                <div className="flex items-center gap-3">
                                                    <Brain className="w-4 h-4 text-violet-500" />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">AI Health Report</span>
                                                </div>
                                                <button onClick={() => setShowHealthReport(false)} className="text-[var(--muted)] hover:text-[var(--foreground)] text-xs">✕</button>
                                            </div>

                                            {isGeneratingReport ? (
                                                <div className="p-8 flex flex-col items-center gap-4">
                                                    <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                                                    <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Analyzing your vitals with AI...</p>
                                                </div>
                                            ) : healthReport ? (
                                                <div className="p-5 space-y-5">
                                                    {/* Summary */}
                                                    <div className="p-4 rounded-xl bg-[var(--background)] border border-[var(--border)]">
                                                        <p className="text-xs leading-relaxed text-[var(--foreground)] font-medium">{healthReport.summary}</p>
                                                    </div>

                                                    {/* Risk Alerts */}
                                                    {healthReport.riskAlerts?.length > 0 && (
                                                        <div className="space-y-2">
                                                            <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest">⚠️ Risk Alerts</p>
                                                            {healthReport.riskAlerts.map((alert, i) => (
                                                                <div key={i} className={`p-3 rounded-lg border ${alert.severity === 'high' || alert.severity === 'critical' ? 'border-rose-500/30 bg-rose-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span>{alert.icon}</span>
                                                                        <span className="text-[10px] font-black text-[var(--foreground)]">{alert.condition}</span>
                                                                        <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full ${alert.severity === 'high' || alert.severity === 'critical' ? 'text-rose-500 bg-rose-500/10' : 'text-amber-500 bg-amber-500/10'}`}>{alert.severity}</span>
                                                                    </div>
                                                                    <p className="text-[9px] text-[var(--muted)] leading-relaxed">{alert.advice}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Superfoods */}
                                                    {healthReport.foodRecommendations?.superfoods?.length > 0 && (
                                                        <div className="space-y-2">
                                                            <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">✅ Superfoods For You</p>
                                                            <div className="grid grid-cols-1 gap-2">
                                                                {healthReport.foodRecommendations.superfoods.map((food, i) => (
                                                                    <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                                                                        <span className="text-sm">{food.icon}</span>
                                                                        <div>
                                                                            <span className="text-[9px] font-black text-emerald-500">{food.name}</span>
                                                                            <p className="text-[8px] text-[var(--muted)] leading-relaxed mt-0.5">{food.reason}</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Foods to Avoid */}
                                                    {healthReport.foodRecommendations?.foodsToAvoid?.length > 0 && (
                                                        <div className="space-y-2">
                                                            <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest">🚫 Foods to Avoid</p>
                                                            <div className="grid grid-cols-1 gap-2">
                                                                {healthReport.foodRecommendations.foodsToAvoid.map((food, i) => (
                                                                    <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg border border-rose-500/20 bg-rose-500/5">
                                                                        <span className="text-sm">{food.icon}</span>
                                                                        <div>
                                                                            <span className="text-[9px] font-black text-rose-500">{food.name}</span>
                                                                            <p className="text-[8px] text-[var(--muted)] leading-relaxed mt-0.5">{food.reason}</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Exercise Plan */}
                                                    {healthReport.exercisePlan && (
                                                        <div className="space-y-2">
                                                            <p className="text-[8px] font-black text-cyan-500 uppercase tracking-widest">🏃 Exercise Plan</p>
                                                            <div className="p-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5">
                                                                <p className="text-[10px] font-black text-[var(--foreground)]">{healthReport.exercisePlan.daily?.type}</p>
                                                                <p className="text-[9px] text-[var(--muted)] mt-1">{healthReport.exercisePlan.daily?.duration} · {healthReport.exercisePlan.daily?.timing}</p>
                                                                <p className="text-[8px] text-[var(--muted)] mt-1 italic">{healthReport.exercisePlan.daily?.reason}</p>
                                                            </div>
                                                            {healthReport.exercisePlan.weekly?.map((day, i) => (
                                                                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                                                                    <span className="text-[9px] font-bold text-[var(--foreground)]">{day.day}</span>
                                                                    <span className="text-[9px] text-[var(--muted)]">{day.activity}</span>
                                                                    <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500">{day.intensity}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Lifestyle Changes */}
                                                    {healthReport.lifestyleChanges?.length > 0 && (
                                                        <div className="space-y-2">
                                                            <p className="text-[8px] font-black text-violet-500 uppercase tracking-widest">💡 Lifestyle Changes</p>
                                                            {healthReport.lifestyleChanges.map((change, i) => (
                                                                <div key={i} className="p-3 rounded-lg border border-violet-500/20 bg-violet-500/5">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span>{change.icon}</span>
                                                                        <span className="text-[9px] font-black text-violet-400">{change.title}</span>
                                                                    </div>
                                                                    <p className="text-[8px] text-[var(--muted)] leading-relaxed">{change.description}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : null}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                            </section>

                            {/* High-Risk Interactions */}
                            <AnimatePresence>
                                {analysis && analysis.clinical.drugAlerts.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="p-8 border border-[var(--danger)]/20 bg-[var(--danger)]/5 rounded-2xl space-y-6"
                                    >
                                        <div className="flex items-center gap-3 text-[var(--danger)]">
                                            <ShieldAlert className="w-5 h-5 shadow-[0_0_15px_rgba(239,68,68,0.3)]" />
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Clinical Interaction Warning</h3>
                                        </div>
                                        <div className="space-y-4">
                                            {analysis.clinical.drugAlerts.map((alert, i) => (
                                                <div key={i} className="text-xs leading-relaxed">
                                                    <span className="font-bold text-[var(--danger)] block mb-1 underline decoration-[var(--danger)]/30 underline-offset-4">{alert.drug}</span>
                                                    <p className="text-[var(--muted)] font-medium">{alert.warning}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Result Column */}
                        <div className="lg:col-span-8 space-y-16">
                            <AnimatePresence mode="wait">
                                {analysis ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-10"
                                    >
                                        {/* Primary Vital Grid */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <MetricTile label="Energy" value={analysis.totals.calories} unit="kcal" />
                                            <MetricTile label="Protein" value={analysis.totals.protein} unit="g" accent />
                                            <MetricTile label="Carbs" value={analysis.totals.carbs} unit="g" />
                                            <MetricTile label="Lipids" value={analysis.totals.fat} unit="g" />
                                        </div>

                                        {/* Metabolic & Clinical Reports */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <CollapsibleSection title="Metabolic Profile" icon={Activity}>
                                                <DiagnosticCard
                                                    title="Metabolic Profile"
                                                    items={[
                                                        { label: 'Glycemic Load', value: analysis.clinical.gl, status: analysis.clinical.gl > 20 ? 'High' : analysis.clinical.gl > 10 ? 'Caution' : 'Optimal', type: analysis.clinical.gl > 20 ? 'danger' : analysis.clinical.gl > 10 ? 'warn' : 'success' },
                                                        { label: 'Purine Content', value: analysis.clinical.purine.status, status: analysis.clinical.purine.status === 'High' ? 'Caution' : 'Optimal', type: analysis.clinical.purine.status === 'High' ? 'warn' : 'success' },
                                                        { label: 'Inflammation', value: analysis.clinical.inflammation, status: 'Indicator', type: 'info' }
                                                    ]}
                                                />
                                            </CollapsibleSection>
                                            <CollapsibleSection title="Geriatric Insights" icon={Heart}>
                                                <DiagnosticCard
                                                    title="Geriatric Insights"
                                                    items={analysis.clinical.geriatric.map(insight => ({
                                                        label: 'Clinical Insight',
                                                        value: insight,
                                                        status: insight.includes('🔴') || insight.includes('⚠️') ? 'Action' : 'Info',
                                                        type: insight.includes('🔴') || insight.includes('⚠️') ? 'danger' : 'info'
                                                    }))}
                                                />
                                            </CollapsibleSection>
                                            <CollapsibleSection title="Structural Insights" icon={Scale}>
                                                <DiagnosticCard
                                                    title="Structural Insights"
                                                    items={[
                                                        { label: 'Cuisine', value: analysis.findings.cuisine, status: 'Detected', type: 'info' },
                                                        { label: 'FODMAP Risk', value: analysis.clinical.fodmap.status, status: analysis.clinical.fodmap.status.includes('High') ? 'Caution' : 'Safe', type: analysis.clinical.fodmap.status.includes('High') ? 'warn' : 'success' },
                                                        { label: 'Renal Sync', value: analysis.clinical.renal.isCompatible ? 'Stable' : 'Conflict', status: analysis.clinical.renal.isCompatible ? 'Approved' : 'Review', type: analysis.clinical.renal.isCompatible ? 'success' : 'danger' },
                                                        { label: 'Metabolism Eq', value: `${analysis.clinical.weightScore}/10`, status: 'Rating', type: 'info' }
                                                    ]}
                                                />
                                            </CollapsibleSection>
                                        </div>

                                        {/* Clinical Suitability Verdict */}
                                        {analysis.findings.clinicalSuitability && (
                                            <CollapsibleSection title="Clinical Suitability" icon={ShieldCheck} defaultOpen={true}>
                                                <div className={`p-6 rounded-2xl border-2 ${analysis.findings.clinicalSuitability.verdict === 'Safe' ? 'border-emerald-500/30 bg-emerald-500/5' :
                                                    analysis.findings.clinicalSuitability.verdict === 'Avoid' ? 'border-rose-500/30 bg-rose-500/5' :
                                                        'border-amber-500/30 bg-amber-500/5'
                                                    }`}>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <span className={`text-2xl font-black ${analysis.findings.clinicalSuitability.verdict === 'Safe' ? 'text-emerald-500' :
                                                            analysis.findings.clinicalSuitability.verdict === 'Avoid' ? 'text-rose-500' :
                                                                'text-amber-500'
                                                            }`}>{analysis.findings.clinicalSuitability.verdict === 'Safe' ? '✅' : analysis.findings.clinicalSuitability.verdict === 'Avoid' ? '🚫' : '⚠️'} {analysis.findings.clinicalSuitability.verdict}</span>
                                                    </div>
                                                    <p className="text-xs text-[var(--foreground)] leading-relaxed font-medium mb-4">{analysis.findings.clinicalSuitability.explanation}</p>
                                                    {analysis.findings.clinicalSuitability.markers && (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {analysis.findings.clinicalSuitability.markers.map((m, i) => (
                                                                <div key={i} className="p-3 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <span className="text-[9px] font-black text-[var(--muted)] uppercase tracking-widest">{m.marker}</span>
                                                                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${m.verdict === 'Safe' ? 'text-emerald-500 bg-emerald-500/10' :
                                                                            m.verdict === 'Avoid' ? 'text-rose-500 bg-rose-500/10' :
                                                                                'text-amber-500 bg-amber-500/10'
                                                                            }`}>{m.verdict}</span>
                                                                    </div>
                                                                    <p className="text-[9px] text-[var(--muted)] leading-relaxed">{m.impact}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </CollapsibleSection>
                                        )}

                                        {/* Metabolic Control Center */}
                                        <CollapsibleSection title="Metabolic Control Center" icon={Clock}>
                                            <div className="space-y-8">
                                                <div className="flex items-center justify-between border-b border-[var(--border)] pb-6">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-3 h-3 text-[var(--primary)]" />
                                                            <p className="text-[10px] font-bold text-[var(--foreground)] uppercase tracking-tight">
                                                                Analyzed: {analysis.clinical.metabolic.spike.mealTime}
                                                                <span className="mx-2 opacity-30">|</span>
                                                                {analysis.clinical.metabolic.spike.mealCategory}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className={`text-[10px] font-mono px-3 py-1 border ${analysis.clinical.metabolic.risk.color === 'danger' ? 'text-rose-500 bg-rose-500/5 border-rose-500/20' :
                                                        analysis.clinical.metabolic.risk.color === 'warn' ? 'text-amber-500 bg-amber-500/5 border-amber-500/20' :
                                                            'text-emerald-500 bg-emerald-500/5 border-emerald-500/20'
                                                        }`}>
                                                        GLYCEMIC RISK: {analysis.clinical.metabolic.risk.riskLevel.toUpperCase()}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    {/* Spike Prediction Visual */}
                                                    <div className="md:col-span-2 p-6 border border-[var(--border)] bg-[var(--card)] rounded-2xl space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="space-y-1">
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Predicted Glucose Excursion</p>
                                                                <p className="text-2xl font-black text-[var(--foreground)]">+{analysis.clinical.metabolic.spike.peakMgdl} <span className="text-xs uppercase opacity-50">mg/dL</span></p>
                                                            </div>
                                                            <Activity className={`w-8 h-8 ${analysis.clinical.metabolic.risk.color === 'danger' ? 'text-rose-500' : 'text-[var(--primary)]'}`} />
                                                        </div>

                                                        <div className="h-20 flex items-end gap-0.5">
                                                            {analysis.clinical.metabolic.spike.predictedCurve.map((p, i) => (
                                                                <div
                                                                    key={i}
                                                                    className={`flex-1 rounded-t-sm transition-all duration-1000 ${analysis.clinical.metabolic.risk.color === 'danger' ? 'bg-rose-500' : 'bg-[var(--primary)]'}`}
                                                                    style={{ height: `${(p.mgdl / (analysis.clinical.metabolic.spike.peakMgdl || 1)) * 100}%` }}
                                                                />
                                                            ))}
                                                        </div>
                                                        <div className="flex justify-between text-[8px] font-bold text-[var(--muted)] uppercase tracking-widest pt-2 border-t border-[var(--border)]">
                                                            <span>0m</span>
                                                            <span>60m (Peak)</span>
                                                            <span>120m</span>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div className="p-6 border border-[var(--border)] bg-[var(--card)] rounded-xl relative overflow-hidden">
                                                            <div className={`absolute top-0 right-0 w-1 h-full bg-${analysis.clinical.metabolic.consumptionAdvice.color}-500`} />
                                                            <div className="flex justify-between items-start mb-2">
                                                                <p className="text-[9px] font-black text-[var(--muted)] uppercase tracking-widest">Dietary Guidance</p>
                                                                <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter bg-${analysis.clinical.metabolic.consumptionAdvice.color}-500/10 text-${analysis.clinical.metabolic.consumptionAdvice.color}-500`}>
                                                                    {analysis.clinical.metabolic.consumptionAdvice.rating}
                                                                </span>
                                                            </div>
                                                            <p className="text-xl font-black text-[var(--foreground)] mb-1">{analysis.clinical.metabolic.consumptionAdvice.frequency}</p>
                                                            <p className="text-[10px] text-[var(--muted)] leading-relaxed">
                                                                {analysis.clinical.metabolic.consumptionAdvice.advice}
                                                            </p>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="p-4 border border-[var(--border)] bg-[var(--card)] rounded-xl">
                                                                <p className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest mb-1">Total Carbs</p>
                                                                <p className="text-xl font-black text-[var(--foreground)]">{analysis.clinical.metabolic.totalCarbs}<span className="text-[10px] ml-1 opacity-40">g</span></p>
                                                            </div>
                                                            <div className="p-4 border border-[var(--border)] bg-[var(--card)] rounded-xl">
                                                                <p className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest mb-1">C : P Ratio</p>
                                                                <p className="text-xl font-black text-[var(--foreground)]">{analysis.clinical.metabolic.features.carbToProtein}<span className="text-[10px] ml-1 opacity-40">(:1)</span></p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={`p-4 border rounded-xl text-xs font-medium flex items-start gap-3 ${analysis.clinical.metabolic.risk.color === 'danger' ? 'bg-rose-500/10 border-rose-500/20 text-rose-200' :
                                                    analysis.clinical.metabolic.risk.color === 'warn' ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' :
                                                        'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                                                    }`}>
                                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                                    {analysis.clinical.metabolic.risk.message}
                                                </div>
                                            </div>
                                        </CollapsibleSection>

                                        {/* Micronutrient Intelligence */}
                                        <CollapsibleSection title="Micronutrient Intelligence" icon={Droplets}>
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                                <MicroTile label="Calcium" value={analysis.totals.calcium} unit="mg" />
                                                <MicroTile label="Iron" value={analysis.totals.iron} unit="mg" />
                                                <MicroTile label="Magnesium" value={analysis.totals.magnesium} unit="mg" />
                                                <MicroTile label="Zinc" value={analysis.totals.zinc} unit="mg" />
                                                <MicroTile label="Vit A" value={analysis.totals.vitA} unit="mcg" />
                                                <MicroTile label="Vit C" value={analysis.totals.vitC} unit="mg" />
                                                <MicroTile label="Vit D" value={analysis.totals.vitD} unit="mcg" />
                                                <MicroTile label="Phosphorus" value={analysis.totals.phosphorus} unit="mg" />
                                            </div>
                                        </CollapsibleSection>

                                        {/* Total Health Intelligence */}
                                        <CollapsibleSection title="Total Health Intelligence" icon={ShieldCheck}>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                {/* NOVA Processing Card */}
                                                <div className="p-6 border border-[var(--border)] bg-[var(--card)] rounded-2xl space-y-4">
                                                    <div className="flex justify-between items-start">
                                                        <p className="text-[9px] font-black text-[var(--muted)] uppercase tracking-widest">Processing Level</p>
                                                        <span className={`text-[8px] px-2 py-0.5 rounded-full font-black ${analysis.clinical.nova.group === 4 ? 'bg-rose-500/20 text-rose-500' :
                                                            analysis.clinical.nova.group === 3 ? 'bg-amber-500/20 text-amber-500' :
                                                                'bg-emerald-500/20 text-emerald-500'
                                                            }`}>NOVA {analysis.clinical.nova.group}</span>
                                                    </div>
                                                    <p className="text-lg font-black text-[var(--foreground)]">{analysis.clinical.nova.label}</p>
                                                    <p className="text-[10px] text-[var(--muted)] leading-relaxed italic">{analysis.clinical.nova.warning}</p>
                                                </div>

                                                {/* DASH Diet Card */}
                                                <div className="p-6 border border-[var(--border)] bg-[var(--card)] rounded-2xl space-y-4">
                                                    <p className="text-[9px] font-black text-[var(--muted)] uppercase tracking-widest">DASH Compatibility</p>
                                                    <div className="flex items-baseline gap-2">
                                                        <p className="text-3xl font-black text-[var(--foreground)]">{analysis.clinical.dash.score}</p>
                                                        <p className="text-[10px] font-bold text-[var(--muted)] uppercase">/ 10</p>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-tighter">{analysis.clinical.dash.status}</p>
                                                </div>

                                                {/* Immune Resilience Card */}
                                                <div className="p-6 border border-[var(--border)] bg-[var(--card)] rounded-2xl space-y-4">
                                                    <p className="text-[9px] font-black text-[var(--muted)] uppercase tracking-widest">Immune Resilience</p>
                                                    <div className="flex items-baseline gap-2">
                                                        <p className="text-3xl font-black text-[var(--foreground)]">{analysis.clinical.immune.score}</p>
                                                        <p className="text-[10px] font-bold text-[var(--muted)] uppercase">/ 10</p>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-tighter">{analysis.clinical.immune.rating}</p>
                                                </div>

                                                {/* Antioxidant Card */}
                                                <div className="p-6 border border-[var(--border)] bg-[var(--card)] rounded-2xl space-y-4">
                                                    <p className="text-[9px] font-black text-[var(--muted)] uppercase tracking-widest">Phytonutrient Variety</p>
                                                    <div className="flex items-baseline gap-2">
                                                        <p className="text-3xl font-black text-[var(--foreground)]">{analysis.clinical.antioxidants.varietyScore}</p>
                                                        <p className="text-[10px] font-bold text-[var(--muted)] uppercase">Score</p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {analysis.clinical.antioxidants.detected.map((p, i) => (
                                                            <span key={i} className="text-[7px] font-black px-1.5 py-0.5 bg-[var(--border)] text-[var(--muted)] rounded-sm uppercase tracking-tighter">{p.split(' ')[0]}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </CollapsibleSection>

                                        {/* Total Wellness & Performance */}
                                        {analysis.clinical.wellness && (
                                            <CollapsibleSection title="Total Wellness & Performance" icon={Zap}>
                                                <div className="space-y-8">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                        {/* Gut Health Card */}
                                                        <div className="p-6 border border-[var(--border)] bg-[var(--card)] rounded-2xl relative overflow-hidden group hover:border-[var(--primary)]/50 transition-all duration-500">
                                                            <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                                                                <GutIcon className="w-16 h-16" />
                                                            </div>
                                                            <p className="text-[9px] font-black text-[var(--muted)] uppercase tracking-widest mb-2">Gut Health Index</p>
                                                            <div className="flex items-baseline gap-2 mb-4">
                                                                <p className="text-3xl font-black text-[var(--foreground)]">{analysis.clinical.wellness.gutHealthIndex}</p>
                                                                <p className="text-[10px] font-bold text-[var(--muted)]">/ 100</p>
                                                            </div>
                                                            <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
                                                                <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${analysis.clinical.wellness.gutHealthIndex}%` }} />
                                                            </div>
                                                            <p className="text-[9px] text-[var(--muted)] mt-4 leading-relaxed font-black uppercase tracking-tighter opacity-60">Microbiome & Prebiotic</p>
                                                        </div>

                                                        {/* Satiety Card */}
                                                        <div className="p-6 border border-[var(--border)] bg-[var(--card)] rounded-2xl relative overflow-hidden group hover:border-[var(--primary)]/50 transition-all duration-500">
                                                            <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                                                                <Timer className="w-16 h-16" />
                                                            </div>
                                                            <p className="text-[9px] font-black text-[var(--muted)] uppercase tracking-widest mb-2">Satiety Duration</p>
                                                            <p className="text-2xl font-black text-[var(--foreground)] mb-1">{analysis.clinical.wellness.satietyHours}</p>
                                                            <p className="text-[9px] font-bold text-[var(--primary)] uppercase tracking-widest italic opacity-70">Saturation: {analysis.clinical.wellness.satietyScore}/10</p>
                                                        </div>

                                                        {/* Sleep Card */}
                                                        <div className="p-6 border border-[var(--border)] bg-[var(--card)] rounded-2xl relative overflow-hidden group hover:border-[var(--primary)]/50 transition-all duration-500">
                                                            <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                                                                <Moon className="w-16 h-16" />
                                                            </div>
                                                            <p className="text-[9px] font-black text-[var(--muted)] uppercase tracking-widest mb-2">Sleep Resilience</p>
                                                            <p className="text-lg font-black text-[var(--foreground)] mb-1">{analysis.clinical.wellness.sleepImpact}</p>
                                                            <div className="flex items-center gap-1.5 mt-4">
                                                                <div className={`w-1.5 h-1.5 rounded-full ${analysis.clinical.wellness.sleepImpact.toLowerCase().includes('support') ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`} />
                                                                <p className="text-[9px] font-black text-[var(--muted)] uppercase tracking-tighter">Circadian Alignment</p>
                                                            </div>
                                                        </div>

                                                        {/* Brain Health Card */}
                                                        <div className="p-6 border border-[var(--border)] bg-[var(--card)] rounded-2xl relative overflow-hidden group hover:border-[var(--primary)]/50 transition-all duration-500">
                                                            <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                                                                <Brain className="w-16 h-16" />
                                                            </div>
                                                            <p className="text-[9px] font-black text-[var(--muted)] uppercase tracking-widest mb-2">Cognitive & Focus</p>
                                                            <div className="flex items-baseline gap-2 mb-4">
                                                                <p className="text-3xl font-black text-[var(--foreground)]">{analysis.clinical.wellness.brainHealthIndex}</p>
                                                                <p className="text-[10px] font-bold text-[var(--muted)]">/ 100</p>
                                                            </div>
                                                            <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
                                                                <div className="h-full bg-[var(--primary)] transition-all duration-1000" style={{ width: `${analysis.clinical.wellness.brainHealthIndex}%` }} />
                                                            </div>
                                                            <p className="text-[9px] text-[var(--muted)] mt-4 leading-relaxed font-black uppercase tracking-tighter opacity-60">Neuro-Nutritional Sync</p>
                                                        </div>
                                                    </div>

                                                    <div className="p-5 bg-[var(--primary)]/5 border border-[var(--primary)]/10 rounded-2xl">
                                                        <div className="flex gap-4 items-center">
                                                            <div className="p-2 bg-[var(--primary)]/10 rounded-lg">
                                                                <Zap className="w-4 h-4 text-[var(--primary)]" />
                                                            </div>
                                                            <p className="text-[11px] font-bold text-[var(--foreground)] leading-relaxed italic opacity-80">
                                                                "{analysis.clinical.wellness.wellnessSummary}"
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CollapsibleSection>
                                        )}

                                        {/* ═══ NEW WELLNESS SECTIONS ═══ */}
                                        <CollapsibleSection title="Exercise & Activity Rx" icon={Activity}>
                                            <ExerciseSection exercisePlan={analysis.findings.exercisePlan} />
                                        </CollapsibleSection>

                                        <CollapsibleSection title="Lifestyle Changes" icon={Sun}>
                                            <LifestyleSection lifestyleChanges={analysis.findings.lifestyleChanges} />
                                        </CollapsibleSection>

                                        <CollapsibleSection title="Daily Wellness Plan" icon={Clock}>
                                            <DailyWellnessPlanSection dailyWellnessPlan={analysis.findings.dailyWellnessPlan} />
                                        </CollapsibleSection>

                                        <CollapsibleSection title="Hydration & Recovery" icon={Droplets}>
                                            <HydrationSection hydrationRecovery={analysis.findings.hydrationRecovery} />
                                        </CollapsibleSection>

                                        <CollapsibleSection title="Mental Wellness" icon={Brain}>
                                            <MentalWellnessSection mentalWellness={analysis.findings.mentalWellness} />
                                        </CollapsibleSection>


                                        {/* === ADVANCED FEATURES === */}
                                        <HealthScoreBadge score={analysis.findings.overallHealthScore} />


                                        <HealthierAlternativesSection alternatives={analysis.findings.healthierAlternatives} />


                                        <DrugInteractionAlerts interactions={analysis.findings.drugFoodInteractions} />


                                        {/* Composition Analysis */}
                                        <section className="space-y-8">
                                            <div className="flex items-center justify-between border-b border-[var(--border)] pb-6">
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--muted)]">Specimen Composition Analysis</h3>
                                                <div className="flex gap-4">
                                                    <div className="flex items-center gap-2 text-[10px] text-[var(--muted)] font-bold uppercase"><div className="w-2 h-2 rounded-full border border-[var(--primary)]/50" /> Estimated</div>
                                                    <div className="flex items-center gap-2 text-[10px] text-[var(--foreground)] font-bold uppercase"><div className="w-2 h-2 rounded-full bg-[var(--primary)] shadow-[0_0_5px_var(--primary)]" /> Validated</div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {analysis.mapped.map((item, i) => (
                                                    <div key={i} className="p-6 border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)] transition-colors group">
                                                        <div className="flex justify-between items-start mb-6">
                                                            <p className="text-sm font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors tracking-tight uppercase">{item.name}</p>
                                                            <ArrowUpRight className="w-3 h-3 text-[var(--muted)] group-hover:text-[var(--primary)] transition-colors" />
                                                        </div>
                                                        <div className="flex items-baseline gap-2 mb-2 font-mono">
                                                            <span className="text-2xl font-black text-[var(--foreground)]">{item.portionGrams}</span>
                                                            <span className="text-[10px] text-[var(--muted)] uppercase font-black tracking-widest">grams</span>
                                                        </div>
                                                        {item.ingredientDetails && (
                                                            <div className="flex flex-wrap gap-1.5 mb-4">
                                                                {item.ingredientDetails.map((detail, idx) => (
                                                                    <span key={idx} className="text-[8px] font-bold px-1.5 py-0.5 rounded-sm bg-[var(--border)] text-[var(--muted)] uppercase tracking-tighter">
                                                                        {detail}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                        <div className="flex flex-wrap gap-4 border-t border-[var(--border)] pt-4 opacity-70 group-hover:opacity-100 transition-opacity">
                                                            <IngredientMetric label="P" value={item.protein} unit="g" />
                                                            <IngredientMetric label="C" value={item.carbs} unit="g" />
                                                            <IngredientMetric label="F" value={item.fat} unit="g" />
                                                            <IngredientMetric label="Ca" value={item.calcium} unit="mg" />
                                                            <IngredientMetric label="Fe" value={item.iron} unit="mg" />
                                                            <IngredientMetric label="Na" value={item.sodium} unit="mg" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>

                                        {/* EMR Artifact */}
                                        <section className="p-1 border border-[var(--border)] bg-[var(--card)] rounded-xl">
                                            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">EMR Diagnostic Artifact</span>
                                                </div>
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(analysis.clinical.emr)}
                                                    className="p-2 hover:bg-[var(--card-hover)] rounded-lg transition-colors group"
                                                >
                                                    <Copy className="w-4 h-4 text-[var(--muted)] group-hover:text-[var(--primary)]" />
                                                </button>
                                            </div>
                                            <pre className="p-8 text-[12px] font-mono text-[var(--foreground)] leading-relaxed whitespace-pre-wrap overflow-x-auto selection:bg-cyan-500/30">
                                                {analysis.clinical.emr}
                                            </pre>
                                        </section>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="h-[600px] border border-[var(--border)] border-dashed rounded-3xl flex flex-col items-center justify-center space-y-8 text-[var(--muted)]"
                                    >
                                        <div className="p-6 rounded-3xl border border-[var(--border)] bg-[var(--background)] text-[var(--muted)]">
                                            <Camera className="w-12 h-12" />
                                        </div>
                                        <div className="text-center space-y-2 px-12">
                                            <h2 className="text-lg font-bold text-[var(--muted)]">Awaiting Specimen Analysis</h2>
                                            <p className="text-xs font-medium max-w-[280px] leading-relaxed opacity-80">System standby. Upload a food photo to initialize clinical sequencing.</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <MealHistoryPanel
                isOpen={showMealHistory}
                onClose={() => setShowMealHistory(false)}
                userId={authService.getUser()?.id}
                authService={authService}
            />
            <MealPlanModal isOpen={showMealPlan} onClose={() => setShowMealPlan(false)} mealPlan={mealPlan} isLoading={isGeneratingPlan} />

            <FaceScanner
                isOpen={showFaceScanner}
                onClose={() => setShowFaceScanner(false)}
                onApplyVitals={(vitals) => {
                    setPatientProfile(prev => ({ ...prev, ...vitals }));
                    setShowFaceScanner(false);
                }}
            />
            <HealthHistoryModal
                isOpen={showHealthHistory}
                onClose={() => setShowHealthHistory(false)}
                userId={authService.getUser()?.id}
                authService={authService}
            />
        </div>
    );
};

const MetricTile = ({ label, value, unit, accent }) => (
    <div className={`p-8 border ${accent ? 'border-[var(--primary)]/20 bg-[var(--primary)]/5 shadow-[0_0_15px_rgba(34,211,238,0.03)]' : 'border-[var(--border)] bg-[var(--card)]'} flex flex-col items-baseline gap-1`}>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)] mb-4">{label}</span>
        <span className={`text-4xl font-extrabold tracking-tighter tabular-nums ${accent ? 'text-[var(--primary)]' : 'text-[var(--foreground)]'}`}>
            {value}
        </span>
        <span className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-70">{unit}</span>
    </div>
);

const MicroTile = ({ label, value, unit }) => (
    <div className="p-5 border border-[var(--border)] bg-[var(--card)] flex flex-col justify-between h-28 hover:bg-[var(--card-hover)] transition-colors">
        <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted)]">{label}</span>
        <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-[var(--foreground)] tracking-tighter">{value}</span>
            <span className="text-[8px] font-bold uppercase tracking-tighter opacity-60">{unit}</span>
        </div>
    </div>
);

const DiagnosticCard = ({ title, items }) => (
    <div className="border border-[var(--border)] bg-[var(--card)] p-8 space-y-8">
        <h3 className="text-[10px] font-black text-[var(--muted)] uppercase tracking-[0.3em] font-mono mb-10 flex items-center gap-3">
            <div className="w-1 h-3 bg-[var(--primary)] shadow-[0_0_8px_rgba(34,211,238,0.4)]" /> {title}
        </h3>
        <div className="space-y-8">
            {items.map((item, i) => (
                <div key={i} className="flex justify-between items-end border-b border-[var(--border)] pb-4 last:border-0 last:pb-0">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-tight">{item.label}</span>
                        <p className="text-sm font-extrabold text-[var(--foreground)] tracking-tight">{item.value}</p>
                    </div>
                    <StatusBadge label={item.status} type={item.type} />
                </div>
            ))}
        </div>
    </div>
);

const StatusBadge = ({ label, type }) => {
    const styles = {
        success: 'text-[var(--accent)] border-[var(--accent)]/20 bg-[var(--accent)]/5',
        danger: 'text-[var(--danger)] border-[var(--danger)]/20 bg-[var(--danger)]/5',
        warn: 'text-amber-500 border-amber-500/20 bg-amber-500/5',
        info: 'text-[var(--primary)] border-[var(--primary)]/20 bg-[var(--primary)]/5',
    };
    return (
        <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border ${styles[type]}`}>
            {label}
        </span>
    );
};

const IngredientMetric = ({ label, value, unit }) => (
    <div className="flex flex-col gap-0.5 min-w-[35px]">
        <span className="text-[8px] font-black opacity-60 uppercase">{label}</span>
        <span className="text-[10px] font-mono font-bold text-[var(--foreground)]">{value}{unit}</span>
    </div>
);

const CollapsibleSection = ({ title, children, icon: Icon, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-[var(--border)] bg-[var(--card)] rounded-2xl overflow-hidden mb-6">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-5 hover:bg-[var(--card-hover)] transition-colors group"
            >
                <div className="flex items-center gap-3">
                    {Icon && <Icon className="w-4 h-4 text-[var(--primary)] group-hover:scale-110 transition-transform" />}
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)] group-hover:text-[var(--primary)] transition-colors">
                        {title}
                    </span>
                </div>
                <ChevronRight className={`w-4 h-4 text-[var(--muted)] transition-transform duration-300 ${isOpen ? 'rotate-90 text-[var(--primary)]' : ''}`} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-6">
                            <motion.div
                                initial={{ y: 5, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                            >
                                {children}
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NutritionDashboard;
