import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, ArrowRightLeft, AlertTriangle, Clock, History, Download,
    UtensilsCrossed, Loader2, ChevronRight, Trash2, Eye, X,
    Flame, Pill, ShieldAlert, Sparkles, TrendingUp, Calendar,
    Droplets, Star, CheckCircle, ArrowRight, Zap, FileText
} from 'lucide-react';

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }
    })
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

/* ═══════════════════════════════════════════════════
   1. OVERALL FOOD HEALTH SCORE (Animated Badge)
   ═══════════════════════════════════════════════════ */
export const HealthScoreBadge = ({ score }) => {
    if (score === undefined || score === null) return null;
    const [animatedScore, setAnimatedScore] = useState(0);

    useEffect(() => {
        let start = 0;
        const duration = 1500;
        const step = (timestamp) => {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            setAnimatedScore(Math.floor(progress * score));
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [score]);

    const getColor = (s) => s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : s >= 40 ? '#f97316' : '#ef4444';
    const getLabel = (s) => s >= 80 ? 'EXCELLENT' : s >= 60 ? 'GOOD' : s >= 40 ? 'FAIR' : 'POOR';
    const color = getColor(score);
    const radius = 54;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (animatedScore / 100) * circumference;

    return (
        <motion.section initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-6 mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                        <Trophy className="w-4 h-4" style={{ color }} />
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--muted)]">Overall Food Health Score</h3>
                        <p className="text-[9px] text-[var(--muted)] opacity-60 mt-0.5">AI-computed aggregate health rating</p>
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-center gap-8">
                <div className="relative">
                    <svg width="130" height="130" className="progress-ring">
                        <circle cx="65" cy="65" r={radius} fill="none" stroke="var(--border)" strokeWidth="8" />
                        <circle cx="65" cy="65" r={radius} fill="none" stroke={color} strokeWidth="8"
                            strokeDasharray={circumference} strokeDashoffset={offset}
                            className="progress-ring-circle" style={{ filter: `drop-shadow(0 0 8px ${color}60)` }} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-black text-[var(--foreground)]">{animatedScore}</span>
                        <span className="text-[8px] font-black uppercase tracking-widest" style={{ color }}>{getLabel(score)}</span>
                    </div>
                </div>
                <div className="space-y-3">
                    {[
                        { label: 'Nutrition Balance', value: Math.min(score + 5, 100) },
                        { label: 'Clinical Safety', value: Math.min(score + 10, 100) },
                        { label: 'Metabolic Impact', value: Math.max(score - 8, 0) },
                    ].map((item, i) => (
                        <div key={i} className="space-y-1">
                            <div className="flex items-center justify-between gap-8">
                                <span className="text-[8px] font-bold text-[var(--muted)] uppercase tracking-widest">{item.label}</span>
                                <span className="text-[9px] font-black text-[var(--foreground)]">{item.value}%</span>
                            </div>
                            <div className="w-40 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${item.value}%` }}
                                    transition={{ delay: 0.5 + i * 0.2, duration: 1 }}
                                    className="h-full rounded-full" style={{ background: getColor(item.value) }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.section>
    );
};

/* ═══════════════════════════════════════════════════
   2. AI HEALTHIER ALTERNATIVES
   ═══════════════════════════════════════════════════ */
export const HealthierAlternativesSection = ({ alternatives }) => {
    if (!alternatives?.length) return null;
    const totalSaved = alternatives.reduce((sum, a) => sum + (a.caloriesSaved || 0), 0);

    return (
        <section className="space-y-8">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                        <ArrowRightLeft className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--muted)]">Healthier Alternatives</h3>
                        <p className="text-[9px] text-[var(--muted)] opacity-60 mt-0.5">AI-suggested ingredient swaps</p>
                    </div>
                </div>
                <div className="text-[9px] font-mono text-green-500 bg-green-500/5 px-3 py-1 border border-green-500/20 rounded-full">
                    SAVE ~{totalSaved} KCAL
                </div>
            </div>
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
                {alternatives.map((alt, i) => (
                    <motion.div key={i} variants={fadeUp} custom={i}
                        className="glass-card rounded-xl p-5 flex items-center gap-5 group">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold text-rose-400 line-through opacity-70">{alt.original}</span>
                                <ArrowRight className="w-3 h-3 text-[var(--muted)]" />
                                <span className="text-xs font-bold text-green-400">{alt.alternative}</span>
                            </div>
                            <p className="text-[10px] text-[var(--muted)] leading-relaxed">{alt.benefit}</p>
                        </div>
                        <div className="shrink-0 text-center px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <p className="text-sm font-black text-green-500">-{alt.caloriesSaved}</p>
                            <p className="text-[7px] font-black uppercase tracking-widest text-green-500/60">kcal</p>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </section>
    );
};

/* ═══════════════════════════════════════════════════
   3. DRUG-FOOD INTERACTION ALERTS
   ═══════════════════════════════════════════════════ */
export const DrugInteractionAlerts = ({ interactions }) => {
    if (!interactions?.length) return null;
    const sevColors = { High: '#ef4444', Moderate: '#f59e0b', Low: '#10b981' };
    const sevIcons = { High: ShieldAlert, Moderate: AlertTriangle, Low: CheckCircle };

    return (
        <section className="space-y-8">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                        <Pill className="w-4 h-4 text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--muted)]">Drug-Food Interactions</h3>
                        <p className="text-[9px] text-[var(--muted)] opacity-60 mt-0.5">Medication safety analysis</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span className="text-[9px] font-mono text-red-500 font-black uppercase tracking-widest">ALERT</span>
                </div>
            </div>
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
                {interactions.map((item, i) => {
                    const color = sevColors[item.severity] || '#f59e0b';
                    const Icon = sevIcons[item.severity] || AlertTriangle;
                    return (
                        <motion.div key={i} variants={fadeUp} custom={i}
                            className="rounded-xl p-5 space-y-3" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Icon className="w-4 h-4" style={{ color }} />
                                    <span className="text-sm font-bold text-[var(--foreground)]">{item.drug}</span>
                                </div>
                                <span className="text-[7px] font-black uppercase px-2 py-0.5 rounded-full border" style={{ color, borderColor: `${color}40`, background: `${color}10` }}>{item.severity}</span>
                            </div>
                            <p className="text-[10px] text-[var(--foreground)] leading-relaxed">{item.interaction}</p>
                            <div className="flex items-start gap-2 p-2 bg-[var(--background)] rounded-lg">
                                <Sparkles className="w-3 h-3 shrink-0 mt-0.5" style={{ color }} />
                                <p className="text-[9px] font-bold leading-relaxed" style={{ color }}>{item.advice}</p>
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>
        </section>
    );
};

/* ═══════════════════════════════════════════════════
   4. MEAL HISTORY JOURNAL (LocalStorage)
   ═══════════════════════════════════════════════════ */
const MEAL_HISTORY_KEY = 'nutriclinical_meal_history';

export const getMealHistory = () => {
    try {
        return JSON.parse(localStorage.getItem(MEAL_HISTORY_KEY) || '[]');
    } catch { return []; }
};

export const saveMealToHistory = (analysis) => {
    const history = getMealHistory();
    const entry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        dishName: analysis.dishName,
        cuisine: analysis.cuisine,
        overallHealthScore: analysis.overallHealthScore,
        verdict: analysis.clinicalSuitability?.verdict,
        calories: analysis.ingredients?.reduce((sum, ing) => sum + (ing.calories || 0), 0) || 0
    };
    history.unshift(entry);
    if (history.length > 30) history.pop();
    localStorage.setItem(MEAL_HISTORY_KEY, JSON.stringify(history));
    return history;
};

export const clearMealHistory = () => {
    localStorage.removeItem(MEAL_HISTORY_KEY);
};

export const MealHistoryPanel = ({ isOpen, onClose, onViewMeal }) => {
    const [history, setHistory] = useState([]);
    useEffect(() => { if (isOpen) setHistory(getMealHistory()); }, [isOpen]);

    const handleClear = () => { clearMealHistory(); setHistory([]); };
    const verdictColor = (v) => v === 'Safe' ? '#10b981' : v === 'Caution' ? '#f59e0b' : '#ef4444';

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={onClose}>
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                        className="w-full max-w-lg max-h-[80vh] bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden flex flex-col"
                        onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
                            <div className="flex items-center gap-3">
                                <History className="w-4 h-4 text-[var(--primary)]" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">Meal History Journal</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {history.length > 0 && (
                                    <button onClick={handleClear} className="text-[8px] font-black uppercase text-rose-500 hover:text-rose-400 px-2 py-1 border border-rose-500/20 rounded-lg transition-colors">
                                        <Trash2 className="w-3 h-3 inline mr-1" />Clear
                                    </button>
                                )}
                                <button onClick={onClose} className="p-1 hover:bg-[var(--border)] rounded-lg transition-colors">
                                    <X className="w-4 h-4 text-[var(--muted)]" />
                                </button>
                            </div>
                        </div>
                        <div className="overflow-y-auto flex-1 p-5 space-y-3">
                            {history.length === 0 ? (
                                <div className="text-center py-12">
                                    <History className="w-8 h-8 text-[var(--muted)] mx-auto mb-3 opacity-30" />
                                    <p className="text-xs text-[var(--muted)]">No meals analyzed yet</p>
                                </div>
                            ) : history.map((entry, i) => (
                                <motion.div key={entry.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                    className="flex items-center gap-4 p-4 border border-[var(--border)] rounded-xl hover:bg-[var(--card-hover)] transition-colors group cursor-pointer">
                                    <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${verdictColor(entry.verdict)}15`, border: `1px solid ${verdictColor(entry.verdict)}30` }}>
                                        <span className="text-sm font-black" style={{ color: verdictColor(entry.verdict) }}>{entry.overallHealthScore || '—'}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-[var(--foreground)] truncate">{entry.dishName}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[8px] font-bold text-[var(--muted)]">{new Date(entry.timestamp).toLocaleDateString()}</span>
                                            <span className="text-[8px] font-bold text-[var(--muted)]">{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            {entry.calories > 0 && <span className="text-[8px] font-bold text-[var(--primary)]">{entry.calories} kcal</span>}
                                        </div>
                                    </div>
                                    <span className="text-[7px] font-black uppercase px-2 py-0.5 rounded-full border" style={{ color: verdictColor(entry.verdict), borderColor: `${verdictColor(entry.verdict)}30`, background: `${verdictColor(entry.verdict)}10` }}>{entry.verdict}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

/* ═══════════════════════════════════════════════════
   5. PDF CLINICAL REPORT EXPORT
   ═══════════════════════════════════════════════════ */
export const exportToPDF = async (dashboardRef, dishName) => {
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    const element = dashboardRef.current;
    if (!element) return;

    const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#09090b',
        logging: false,
        windowWidth: 1200
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Header
    pdf.setFillColor(9, 9, 11);
    pdf.rect(0, 0, pdfWidth, 30, 'F');
    pdf.setTextColor(34, 211, 238);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('NUTRICLINICAL', 10, 12);
    pdf.setTextColor(113, 113, 122);
    pdf.setFontSize(8);
    pdf.text('AI Clinical Nutrition Report', 10, 18);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 10, 24);
    pdf.text(`Dish: ${dishName || 'Unknown'}`, pdfWidth - 10 - pdf.getTextWidth(`Dish: ${dishName || 'Unknown'}`), 24);

    let yOffset = 35;
    let remainingHeight = imgHeight;

    while (remainingHeight > 0) {
        const pageImgHeight = Math.min(remainingHeight, pdfHeight - yOffset - 10);
        pdf.addImage(imgData, 'PNG', 10, yOffset, imgWidth, imgHeight, undefined, 'FAST',
            0, 0, canvas.width, (pageImgHeight / imgHeight) * canvas.height);
        remainingHeight -= pageImgHeight;
        if (remainingHeight > 0) {
            pdf.addPage();
            yOffset = 10;
        }
    }

    pdf.save(`NutriClinical_Report_${(dishName || 'Analysis').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
};

/* ═══════════════════════════════════════════════════
   6. AI MEAL PLAN GENERATOR (Modal)
   ═══════════════════════════════════════════════════ */
export const MealPlanModal = ({ isOpen, onClose, mealPlan, isLoading }) => {
    const mealIcons = { Breakfast: '🌅', 'Mid-Morning Snack': '🍎', Lunch: '🍽️', 'Evening Snack': '🥜', Dinner: '🌙' };
    const mealColors = { Breakfast: '#f59e0b', 'Mid-Morning Snack': '#10b981', Lunch: '#22d3ee', 'Evening Snack': '#8b5cf6', Dinner: '#6366f1' };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={onClose}>
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                        className="w-full max-w-2xl max-h-[85vh] bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden flex flex-col"
                        onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
                            <div className="flex items-center gap-3">
                                <UtensilsCrossed className="w-4 h-4 text-[var(--primary)]" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">AI Meal Plan Generator</span>
                            </div>
                            <button onClick={onClose} className="p-1 hover:bg-[var(--border)] rounded-lg transition-colors">
                                <X className="w-4 h-4 text-[var(--muted)]" />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-5">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-4">
                                    <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
                                    <p className="text-xs text-[var(--muted)] font-bold">Generating your personalized meal plan...</p>
                                </div>
                            ) : mealPlan ? (
                                <div className="space-y-6">
                                    {/* Summary */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="p-4 bg-[var(--background)] rounded-xl text-center border border-[var(--border)]">
                                            <Flame className="w-5 h-5 text-[var(--primary)] mx-auto mb-2" />
                                            <p className="text-xl font-black text-[var(--foreground)]">{mealPlan.dailyCalorieTarget}</p>
                                            <p className="text-[8px] font-black uppercase tracking-widest text-[var(--muted)]">Daily Calories</p>
                                        </div>
                                        <div className="p-4 bg-[var(--background)] rounded-xl text-center border border-[var(--border)]">
                                            <TrendingUp className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
                                            <div className="flex justify-center gap-2">
                                                <span className="text-[9px] font-black text-emerald-500">P:{mealPlan.macroSplit?.protein}</span>
                                                <span className="text-[9px] font-black text-amber-500">C:{mealPlan.macroSplit?.carbs}</span>
                                                <span className="text-[9px] font-black text-rose-500">F:{mealPlan.macroSplit?.fat}</span>
                                            </div>
                                            <p className="text-[8px] font-black uppercase tracking-widest text-[var(--muted)] mt-1">Macro Split</p>
                                        </div>
                                        <div className="p-4 bg-[var(--background)] rounded-xl text-center border border-[var(--border)]">
                                            <Droplets className="w-5 h-5 text-cyan-500 mx-auto mb-2" />
                                            <p className="text-[10px] font-bold text-[var(--foreground)]">{mealPlan.hydrationPlan?.slice(0, 30)}</p>
                                            <p className="text-[8px] font-black uppercase tracking-widest text-[var(--muted)] mt-1">Hydration</p>
                                        </div>
                                    </div>

                                    {/* Meals Timeline */}
                                    <div className="space-y-3">
                                        {mealPlan.meals?.map((meal, i) => {
                                            const color = mealColors[meal.meal] || '#22d3ee';
                                            const icon = mealIcons[meal.meal] || '🍽️';
                                            return (
                                                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                                                    className="p-5 rounded-xl border border-[var(--border)] space-y-3" style={{ background: `${color}08` }}>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xl">{icon}</span>
                                                            <div>
                                                                <p className="text-sm font-bold text-[var(--foreground)]">{meal.meal}</p>
                                                                <p className="text-[8px] font-bold uppercase tracking-widest" style={{ color }}>{meal.time}</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-sm font-black" style={{ color }}>{meal.calories} kcal</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {meal.items?.map((item, j) => (
                                                            <span key={j} className="text-[9px] font-bold px-2.5 py-1 bg-[var(--background)] border border-[var(--border)] rounded-full text-[var(--foreground)]">{item}</span>
                                                        ))}
                                                    </div>
                                                    {meal.notes && (
                                                        <p className="text-[9px] italic text-[var(--muted)] leading-relaxed">{meal.notes}</p>
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </div>

                                    {mealPlan.specialNotes && (
                                        <div className="p-4 bg-[var(--primary)]/5 border border-[var(--primary)]/10 rounded-xl">
                                            <div className="flex items-start gap-2">
                                                <Star className="w-3 h-3 text-[var(--primary)] shrink-0 mt-0.5" />
                                                <p className="text-[10px] text-[var(--primary)] font-bold leading-relaxed">{mealPlan.specialNotes}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <UtensilsCrossed className="w-8 h-8 text-[var(--muted)] mx-auto mb-3 opacity-30" />
                                    <p className="text-xs text-[var(--muted)]">Click "Generate Meal Plan" to start</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
