import React, { useState, useRef } from 'react';
import {
    Camera, Upload, ChevronRight, Activity, Heart, ShieldAlert,
    Scale, FileText, CheckCircle, AlertTriangle, ShieldCheck,
    Zap, Thermometer, Droplets, ArrowUpRight, Copy, Loader2,
    Sun, Moon, Clock, Brain, Timer, Activity as GutIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeFoodImage } from '../services/aiService';
import { mapIngredientsToNutrition, calculateTotals } from '../services/databaseMapping';
import { generateMetabolicInsights } from '../services/metabolicEngine';
import * as clinical from '../utils/clinicalLogic';

const NutritionDashboard = () => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [base64Data, setBase64Data] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [theme, setTheme] = useState('dark');
    const [debugMsg, setDebugMsg] = useState('');
    const [patientProfile, setPatientProfile] = useState({
        age: '', gender: '', occupation: '',
        hba1c: '', bpSystolic: '', bpDiastolic: '',
        ldl: '', egfr: ''
    });
    const [showProfile, setShowProfile] = useState(true);
    const fileInputRef = useRef(null);

    const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

    const updateProfile = (field, value) => {
        setPatientProfile(prev => ({ ...prev, [field]: value }));
    };

    // MOBILE FIX: Use createImageBitmap (most efficient mobile API) to load
    // the image directly from the File, compress via canvas, then set preview.
    // This avoids the 7-15MB raw dataURL that crashes mobile Chrome.
    const handleFileUpload = (e) => {
        try {
            const f = e.target.files?.[0];
            if (!f) { setDebugMsg('No file selected'); return; }

            const name = f.name;
            const sizeKB = (f.size / 1024).toFixed(0);
            setDebugMsg(`[1/3] Selected: ${name} (${sizeKB}KB, ${f.type})`);

            // Try createImageBitmap first (best for mobile - no FileReader needed)
            if (typeof createImageBitmap === 'function') {
                createImageBitmap(f).then(bitmap => {
                    setDebugMsg(`[2/3] Loaded: ${bitmap.width}x${bitmap.height} — compressing...`);
                    let w = bitmap.width, h = bitmap.height;
                    const maxDim = 1024;
                    if (w > maxDim || h > maxDim) {
                        if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
                        else { w = Math.round(w * maxDim / h); h = maxDim; }
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
                    bitmap.close(); // free memory
                    const compressed = canvas.toDataURL('image/jpeg', 0.7);

                    // Set ALL state at once — compressed image is small enough for mobile
                    setPreview(compressed);
                    setBase64Data(compressed);
                    setFile(f);
                    setDebugMsg(`[3/3] ✅ Ready! ${w}x${h} (${(compressed.length / 1024).toFixed(0)}KB)`);
                }).catch(err => {
                    setDebugMsg(`createImageBitmap failed: ${err.message} — trying fallback...`);
                    fallbackReadFile(f, name, sizeKB);
                });
            } else {
                setDebugMsg('No createImageBitmap — using fallback...');
                fallbackReadFile(f, name, sizeKB);
            }
        } catch (err) {
            setDebugMsg('UPLOAD ERROR: ' + err.message);
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
        } catch (err) {
            console.error(err);
            alert(`Analysis failed: ${err.message}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className={`${theme} min-h-screen transition-colors duration-500`}>
            <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-cyan-500/30">
                <div className="max-w-[1400px] mx-auto px-6 py-12 lg:py-20">

                    {/* Header: Minimalist Precision */}
                    <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-20 border-b border-[var(--border)] pb-12">
                        <div className="space-y-2">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-3 text-cyan-500 font-black tracking-[0.2em] text-[10px] uppercase">
                                    <span className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                                    Diagnostic Terminal v4.0.2
                                </div>
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
                                <p className="text-xs font-mono text-zinc-400 mt-1">GPT-4.1 Vision · Precision Mode</p>
                            </div>
                        </div>
                    </header>

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

                                {/* Preview Area — pure display, no embedded inputs */}
                                <div className="group relative aspect-square rounded-2xl border border-dashed border-[var(--border)] hover:border-[var(--primary)] transition-all duration-300 overflow-hidden bg-[var(--card)]">
                                    {preview ? (
                                        <img src={preview} alt="Specimen" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full gap-4 text-[var(--muted)]">
                                            <div className="p-4 rounded-full border border-[var(--border)] bg-[var(--background)]">
                                                <Camera className="w-6 h-6" />
                                            </div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest">Awaiting Specimen</p>
                                            <p className="text-[9px] text-[var(--muted)] opacity-60">Use buttons below to upload</p>
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

                                {/* Mobile Debug Info */}
                                {debugMsg && (
                                    <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[10px] font-mono break-all">
                                        DEBUG: {debugMsg}
                                    </div>
                                )}

                                {/* Patient Profile Section */}
                                <div className="border border-[var(--border)] bg-[var(--card)] rounded-2xl overflow-hidden">
                                    <button
                                        onClick={() => setShowProfile(!showProfile)}
                                        className="w-full flex items-center justify-between p-5 hover:bg-[var(--card-hover)] transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Heart className="w-4 h-4 text-[var(--primary)]" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">Patient Profile</span>
                                        </div>
                                        <ChevronRight className={`w-4 h-4 text-[var(--muted)] transition-transform ${showProfile ? 'rotate-90' : ''}`} />
                                    </button>
                                    {showProfile && (
                                        <div className="px-5 pb-5 space-y-4">
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
                                                    <label className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest">Occupation</label>
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
                                            <div className="border-t border-[var(--border)] pt-3">
                                                <p className="text-[8px] font-black text-[var(--primary)] uppercase tracking-widest mb-3">Clinical Vitals (Optional)</p>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest">HbA1c %</label>
                                                        <input type="number" step="0.1" placeholder="e.g. 6.5" value={patientProfile.hba1c} onChange={e => updateProfile('hba1c', e.target.value)}
                                                            className="w-full p-2.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest">LDL mg/dL</label>
                                                        <input type="number" placeholder="e.g. 130" value={patientProfile.ldl} onChange={e => updateProfile('ldl', e.target.value)}
                                                            className="w-full p-2.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest">BP (Sys/Dia)</label>
                                                        <div className="flex gap-1">
                                                            <input type="number" placeholder="120" value={patientProfile.bpSystolic} onChange={e => updateProfile('bpSystolic', e.target.value)}
                                                                className="w-full p-2.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors" />
                                                            <span className="text-[var(--muted)] self-center text-xs">/</span>
                                                            <input type="number" placeholder="80" value={patientProfile.bpDiastolic} onChange={e => updateProfile('bpDiastolic', e.target.value)}
                                                                className="w-full p-2.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest">eGFR mL/min</label>
                                                        <input type="number" placeholder="e.g. 90" value={patientProfile.egfr} onChange={e => updateProfile('egfr', e.target.value)}
                                                            className="w-full p-2.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

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
                                            <DiagnosticCard
                                                title="Metabolic Profile"
                                                items={[
                                                    { label: 'Glycemic Load', value: analysis.clinical.gl, status: analysis.clinical.gl > 20 ? 'High' : analysis.clinical.gl > 10 ? 'Caution' : 'Optimal', type: analysis.clinical.gl > 20 ? 'danger' : analysis.clinical.gl > 10 ? 'warn' : 'success' },
                                                    { label: 'Purine Content', value: analysis.clinical.purine.status, status: analysis.clinical.purine.status === 'High' ? 'Caution' : 'Optimal', type: analysis.clinical.purine.status === 'High' ? 'warn' : 'success' },
                                                    { label: 'Inflammation', value: analysis.clinical.inflammation, status: 'Indicator', type: 'info' }
                                                ]}
                                            />
                                            <DiagnosticCard
                                                title="Geriatric Insights"
                                                items={analysis.clinical.geriatric.map(insight => ({
                                                    label: 'Clinical Insight',
                                                    value: insight,
                                                    status: insight.includes('🔴') || insight.includes('⚠️') ? 'Action' : 'Info',
                                                    type: insight.includes('🔴') || insight.includes('⚠️') ? 'danger' : 'info'
                                                }))}
                                            />
                                            <DiagnosticCard
                                                title="Structural Insights"
                                                items={[
                                                    { label: 'Cuisine', value: analysis.findings.cuisine, status: 'Detected', type: 'info' },
                                                    { label: 'FODMAP Risk', value: analysis.clinical.fodmap.status, status: analysis.clinical.fodmap.status.includes('High') ? 'Caution' : 'Safe', type: analysis.clinical.fodmap.status.includes('High') ? 'warn' : 'success' },
                                                    { label: 'Renal Sync', value: analysis.clinical.renal.isCompatible ? 'Stable' : 'Conflict', status: analysis.clinical.renal.isCompatible ? 'Approved' : 'Review', type: analysis.clinical.renal.isCompatible ? 'success' : 'danger' },
                                                    { label: 'Metabolism Eq', value: `${analysis.clinical.weightScore}/10`, status: 'Rating', type: 'info' }
                                                ]}
                                            />
                                        </div>

                                        {/* Clinical Suitability Verdict */}
                                        {analysis.findings.clinicalSuitability && (
                                            <section className="space-y-4">
                                                <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
                                                    <ShieldCheck className="w-4 h-4 text-[var(--primary)]" />
                                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--muted)]">Clinical Suitability</h3>
                                                </div>
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
                                                        <div className="grid grid-cols-2 gap-3">
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
                                            </section>
                                        )}

                                        {/* Metabolic Control Center: AI Spike Prediction */}
                                        <section className="space-y-8">
                                            <div className="flex items-center justify-between border-b border-[var(--border)] pb-6">
                                                <div className="space-y-1">
                                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--muted)]">Metabolic Control Center</h3>
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

                                                    {/* Simple ASCII/Sparkline representation of the curve */}
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

                                                {/* Clinical Markers */}
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
                                                            <p className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest mb-1">Carb : Protein</p>
                                                            <p className="text-xl font-black text-[var(--foreground)]">{analysis.clinical.metabolic.features.carbToProtein}<span className="text-[10px] ml-1 opacity-40">(:1)</span></p>
                                                        </div>
                                                    </div>
                                                    <div className="p-6 border border-[var(--border)] bg-[var(--card)] rounded-xl">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <p className="text-[9px] font-black text-[var(--muted)] uppercase tracking-widest">Optimal Consumption Window</p>
                                                            <span className="text-[8px] px-1.5 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full font-black uppercase tracking-tighter">Clinical Recommendation</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                                                            <p className="text-sm font-black text-[var(--foreground)]">{analysis.clinical.metabolic.optimalWindow.perfectTime}</p>
                                                        </div>
                                                        <p className="text-[10px] text-[var(--muted)] mt-2 leading-relaxed italic border-l-2 border-[var(--border)] pl-3">
                                                            {analysis.clinical.metabolic.optimalWindow.reason}
                                                        </p>
                                                    </div>
                                                    <div className="p-6 border border-[var(--border)] bg-[var(--card)] rounded-xl">
                                                        <p className="text-[9px] font-black text-[var(--muted)] uppercase tracking-widest mb-1">Meal Timing Impact</p>
                                                        <div className="flex items-center gap-2">
                                                            <Sun className="w-3 h-3 text-amber-500" />
                                                            <p className="text-sm font-bold text-[var(--foreground)]">{analysis.clinical.metabolic.spike.timingImpact}</p>
                                                        </div>
                                                        <p className="text-[9px] text-[var(--muted)] mt-1 opacity-60 font-medium">Effect based on current analysis time (4:35 PM)</p>
                                                    </div>
                                                    <div className="p-6 border border-[var(--border)] bg-[var(--card)] rounded-xl">
                                                        <p className="text-[9px] font-black text-[var(--muted)] uppercase tracking-widest mb-1">CGM Correlation</p>
                                                        <p className="text-sm font-bold text-[var(--foreground)]">{analysis.clinical.metabolic.correlation.pattern}</p>
                                                        <p className="text-[10px] text-[var(--muted)] mt-1 italic">{analysis.clinical.metabolic.correlation.correlationSource}</p>
                                                    </div>
                                                    <div className="p-6 border border-[var(--border)] bg-[var(--card)] rounded-xl">
                                                        <p className="text-[9px] font-black text-[var(--muted)] uppercase tracking-widest mb-1">Carb : Fiber Ratio</p>
                                                        <p className="text-lg font-black text-[var(--foreground)]">{analysis.clinical.metabolic.features.carbToFiber} <span className="text-[10px] opacity-40">(:1)</span></p>
                                                        <div className="w-full h-1 bg-[var(--border)] mt-2 rounded-full overflow-hidden">
                                                            <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (1 / (parseFloat(analysis.clinical.metabolic.features.carbToFiber) || 1)) * 100)}%` }} />
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
                                        </section>

                                        {/* Micronutrient Intelligence */}
                                        <section className="space-y-8">
                                            <div className="flex items-center justify-between border-b border-[var(--border)] pb-6">
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--muted)]">Micronutrient Intelligence</h3>
                                                <div className="text-[10px] font-mono text-[var(--primary)] bg-[var(--primary)]/5 px-3 py-1 border border-[var(--primary)]/20">BIO-MARKER SYNC: ACTIVE</div>
                                            </div>
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
                                        </section>

                                        {/* Total Health Intelligence: Advanced Bio-Markers */}
                                        <section className="space-y-8">
                                            <div className="flex items-center justify-between border-b border-[var(--border)] pb-6">
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--muted)]">Total Health Intelligence</h3>
                                                <ShieldCheck className="w-4 h-4 text-[var(--primary)]" />
                                            </div>

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
                                        </section>

                                        {/* Total Wellness & Performance: Advanced AI Insights */}
                                        {analysis.clinical.wellness && (
                                            <section className="space-y-8 mb-12">
                                                <div className="flex items-center justify-between border-b border-[var(--border)] pb-6">
                                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--muted)]">Total Wellness & Performance</h3>
                                                    <div className="flex items-center gap-2">
                                                        <span className="relative flex h-2 w-2">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--primary)]"></span>
                                                        </span>
                                                        <span className="text-[9px] font-mono text-[var(--primary)] font-black uppercase tracking-widest">Live Bio-AI Sync</span>
                                                    </div>
                                                </div>

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
                                                        <p className="text-[9px] text-[var(--muted)] mt-4 leading-relaxed font-medium italic border-l border-[var(--border)] pl-2">Predicted energy availability.</p>
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
                                            </section>
                                        )}

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
                                            <h2 className="text-lg font-bold text-[var(--muted)]">Diagnostic Module Offline</h2>
                                            <p className="text-xs font-medium max-w-[280px] leading-relaxed opacity-80">System standby. Awaiting food specimen upload for clinical sequencing.</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
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

export default NutritionDashboard;
