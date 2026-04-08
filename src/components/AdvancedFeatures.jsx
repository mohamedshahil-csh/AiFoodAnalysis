import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, ArrowRightLeft, AlertTriangle, Clock, History, Download,
    UtensilsCrossed, Loader2, ChevronRight, Trash2, Eye, X,
    Flame, Pill, ShieldAlert, Sparkles, TrendingUp, Calendar,
    Droplets, Star, CheckCircle, ArrowRight, Zap, FileText, Activity, RefreshCw
} from 'lucide-react';
import { swapMeal } from '../services/aiService';

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
   4. MEAL HISTORY JOURNAL (Backend API)
   ═══════════════════════════════════════════════════ */
export const MealHistoryPanel = ({ isOpen, onClose, userId, authService }) => {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isShowingAll, setIsShowingAll] = useState(false);
    const [expandedMealId, setExpandedMealId] = useState(null);

    const fetchHistory = useCallback(async (showAll = false) => {
        if (!userId) return;
        setIsLoading(true);
        try {
            const data = showAll
                ? await authService.getMealHistory(userId)
                : await authService.getLatestMeals(userId, 10);
            setHistory(data);
            setIsShowingAll(showAll);
        } catch (err) {
            console.error("Failed to fetch meal history:", err);
        } finally {
            setIsLoading(false);
        }
    }, [userId, authService]);

    useEffect(() => {
        if (isOpen) {
            fetchHistory(false);
        } else {
            setIsShowingAll(false);
        }
    }, [isOpen, fetchHistory]);

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
                                <button onClick={onClose} className="p-1 hover:bg-[var(--border)] rounded-lg transition-colors">
                                    <X className="w-4 h-4 text-[var(--muted)]" />
                                </button>
                            </div>
                        </div>
                        <div className="overflow-y-auto flex-1 p-5 space-y-3">
                            {isLoading && history.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-3">
                                    <Loader2 className="w-6 h-6 text-[var(--primary)] animate-spin" />
                                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--muted)]">Retrieving Bio-Logs...</p>
                                </div>
                            ) : history.length === 0 ? (
                                <div className="text-center py-12">
                                    <History className="w-8 h-8 text-[var(--muted)] mx-auto mb-3 opacity-30" />
                                    <p className="text-xs text-[var(--muted)] hover:text-white transition-colors cursor-default">No meals analyzed yet</p>
                                </div>
                            ) : (
                                <>
                                    {history.map((entry, i) => {
                                        const isExpanded = expandedMealId === entry.id;
                                        const explanation = entry.caution_reason || entry.full_json?.clinicalSuitability?.explanation;

                                        return (
                                            <motion.div
                                                key={entry.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className={`flex flex-col border border-[var(--border)] rounded-xl overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-1 ring-[var(--primary)]/30 shadow-lg' : 'hover:bg-[var(--card-hover)]'}`}
                                            >
                                                <div
                                                    onClick={() => setExpandedMealId(isExpanded ? null : entry.id)}
                                                    className="flex items-center gap-4 p-4 cursor-pointer"
                                                >
                                                    <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${verdictColor(entry.verdict)}15`, border: `1px solid ${verdictColor(entry.verdict)}30` }}>
                                                        <span className="text-sm font-black" style={{ color: verdictColor(entry.verdict) }}>{entry.health_score || entry.overallHealthScore || '—'}</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-[var(--foreground)] truncate">{entry.dish_name || entry.dishName}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[8px] font-bold text-[var(--muted)]">{new Date(entry.created_at || entry.timestamp).toLocaleDateString()}</span>
                                                            <span className="text-[8px] font-bold text-[var(--muted)]">{new Date(entry.created_at || entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            {(entry.calories > 0) && <span className="text-[8px] font-bold text-[var(--primary)]">{entry.calories} kcal</span>}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[7px] font-black uppercase px-2 py-0.5 rounded-full border" style={{ color: verdictColor(entry.verdict), borderColor: `${verdictColor(entry.verdict)}30`, background: `${verdictColor(entry.verdict)}10` }}>{entry.verdict}</span>
                                                        <ChevronRight className={`w-3 h-3 text-[var(--muted)] transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                                                    </div>
                                                </div>

                                                <AnimatePresence>
                                                    {isExpanded && explanation && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden bg-[var(--background)]/50"
                                                        >
                                                            <div className="p-4 pt-0 border-t border-[var(--border)] border-dashed mx-4 mt-1 pb-4">
                                                                <div className="mt-3 p-3 bg-rose-500/5 border border-rose-500/10 rounded-lg flex gap-3 items-start">
                                                                    <div className="shrink-0 p-1.5 rounded-md bg-rose-500/10">
                                                                        <AlertTriangle className="w-3 h-3 text-rose-500" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[8px] font-black uppercase tracking-widest text-rose-500/60 mb-1">Clinical Insight</p>
                                                                        <p className="text-[10px] font-bold text-[var(--foreground)] leading-relaxed">{explanation}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        );
                                    })}

                                    {!isShowingAll && history.length >= 10 && (
                                        <button
                                            onClick={() => fetchHistory(true)}
                                            className="w-full py-3 mt-2 text-[9px] font-black uppercase tracking-widest text-[var(--primary)] hover:bg-[var(--primary)]/5 border border-dashed border-[var(--primary)]/30 rounded-xl transition-all active:scale-[0.98]"
                                        >
                                            {isLoading ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'View Full Archive →'}
                                        </button>
                                    )}
                                </>
                            )}
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
export const MealPlanModal = ({ isOpen, onClose, mealPlan, isLoading, userData }) => {
    const [selectedDay, setSelectedDay] = useState(1);
    const [localMealPlan, setLocalMealPlan] = useState(mealPlan);
    const [swappingMealIdx, setSwappingMealIdx] = useState(null);
    
    useEffect(() => {
        if (mealPlan) setLocalMealPlan(mealPlan);
    }, [mealPlan]);

    const mealIcons = { Breakfast: '🌅', 'Mid-Morning Snack': '🍎', Lunch: '🍽️', 'Evening Snack': '🥜', Dinner: '🌙', Snacks: '🍎' };
    const mealColors = { Breakfast: '#f59e0b', Lunch: '#22d3ee', Dinner: '#6366f1', Snacks: '#8b5cf6' };

    const handleSwapMeal = async (dayIdx, mealIdx, originalMeal) => {
        if (swappingMealIdx !== null) return;
        setSwappingMealIdx(mealIdx);
        try {
            const currentDayPlan = localMealPlan.weeklyPlan[dayIdx];
            const result = await swapMeal(originalMeal, userData, currentDayPlan.clinicalFocus);
            if (result) {
                const updatedPlan = JSON.parse(JSON.stringify(localMealPlan));
                updatedPlan.weeklyPlan[dayIdx].meals[mealIdx] = {
                    ...result,
                    swapped: true
                };
                setLocalMealPlan(updatedPlan);
            }
        } catch (error) {
            console.error("Clinical Swap failed:", error);
        } finally {
            setSwappingMealIdx(null);
        }
    };

    const isWeekly = !!localMealPlan?.weeklyPlan;
    const currentDayPlan = isWeekly 
        ? localMealPlan.weeklyPlan[selectedDay - 1] 
        : (selectedDay === 1 ? localMealPlan : null);

    const days = [1, 2, 3, 4, 5, 6, 7];

    const getImpactStyle = (tag) => {
        const markers = {
            'HbA1c': { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400', icon: '⚡' },
            'LDL': { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', icon: '❤️' },
            'BP': { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', icon: '🩺' },
            'eGFR': { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', icon: '💧' },
            'High': { bg: 'bg-rose-500/20', border: 'border-rose-500/30', text: 'text-rose-400', icon: '🔥' },
            'Medium': { bg: 'bg-amber-500/20', border: 'border-amber-500/30', text: 'text-amber-400', icon: '⚖️' },
            'Low': { bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: '🌱' }
        };
        return markers[tag] || { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', icon: '✨' };
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={onClose}>
                    <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="w-full max-w-3xl max-h-[90vh] bg-[#0c0c0e] border border-white/5 rounded-[2rem] overflow-hidden flex flex-col shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] relative"
                        onClick={e => e.stopPropagation()}>
                        
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-50" />
                        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[var(--primary)]/10 blur-[100px] rounded-full" />
                        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 blur-[100px] rounded-full" />

                        <div className="flex items-center justify-between p-6 border-b border-white/5 relative z-10 backdrop-blur-md bg-black/20">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/20">
                                    <UtensilsCrossed className="w-5 h-5 text-[var(--primary)]" />
                                </div>
                                <div>
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--muted)]">Clinical Optimizer</h2>
                                    <p className="text-sm font-black text-white uppercase tracking-tight">AI Nutrition Strategy</p>
                                </div>
                            </div>

                            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-all active:scale-90 bg-white/[0.02] border border-white/5">
                                <X className="w-5 h-5 text-[var(--muted)]" />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 p-5 text-white">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-4">
                                    <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
                                    <p className="text-[10px] text-[var(--muted)] font-black uppercase tracking-widest animate-pulse">Synchronizing clinical data with your metabolic profile...</p>
                                </div>
                            ) : localMealPlan ? (
                                <div className="space-y-6 relative z-10">
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {[
                                            { label: 'Glucose Stability', value: localMealPlan.metabolicImpact?.glucoseStability || '+12%', icon: Zap, color: 'text-amber-400' },
                                            { label: 'Lipid Reduction', value: localMealPlan.metabolicImpact?.lipidReduction || '-8 mg/dL', icon: TrendingUp, color: 'text-cyan-400' },
                                            { label: 'BP Optimization', value: localMealPlan.metabolicImpact?.bpImprovement || 'Active', icon: Activity, color: 'text-emerald-400' }
                                        ].map((stat, i) => (
                                            <div key={i} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between group hover:border-white/10 transition-colors">
                                                <div>
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-[var(--muted)] mb-1">{stat.label}</p>
                                                    <p className={`text-sm font-black ${stat.color}`}>{stat.value}</p>
                                                </div>
                                                <stat.icon className={`w-5 h-5 ${stat.color} opacity-20 group-hover:opacity-100 transition-opacity`} />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-8">
                                        {isWeekly && (
                                            <div className="flex items-center gap-3 pb-2 overflow-x-auto no-scrollbar scroll-smooth">
                                                {days.map(d => (
                                                    <button
                                                        key={d}
                                                        onClick={() => setSelectedDay(d)}
                                                        className={`shrink-0 flex flex-col items-center justify-center w-14 h-16 rounded-xl border-2 transition-all duration-500 overflow-hidden relative group ${selectedDay === d ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]' : 'bg-white/[0.02] border-white/[0.05] text-[var(--muted)]'}`}
                                                    >
                                                        <span className="text-[6px] font-black uppercase tracking-[0.2em]">Day</span>
                                                        <span className="text-base font-black">{d}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {currentDayPlan && (
                                            <div className="space-y-6">
                                                <div className="p-6 bg-gradient-to-br from-white/[0.03] to-transparent border border-white/[0.05] rounded-[1.5rem]">
                                                    <div className="flex items-center gap-4 mb-4">
                                                        <div className="p-3 bg-[var(--primary)]/10 rounded-xl border border-[var(--primary)]/20">
                                                            <Droplets className="w-5 h-5 text-[var(--primary)]" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-[var(--muted)] mb-0.5">Biomarker Focus</p>
                                                            <h3 className="text-lg font-black text-white uppercase">{currentDayPlan.clinicalFocus || 'Metabolic Base'}</h3>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[7px] font-black uppercase text-[var(--muted)]">Target</span>
                                                            <span className="text-xs font-black text-white">{currentDayPlan.dailyCalorieTarget} kcal</span>
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[7px] font-black uppercase text-[var(--muted)]">Prot/Carb/Fat</span>
                                                            <span className="text-xs font-black text-emerald-400">{currentDayPlan.macroSplit?.protein} / {currentDayPlan.macroSplit?.carbs} / {currentDayPlan.macroSplit?.fat || 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 gap-4">
                                                    {currentDayPlan.meals?.map((meal, i) => {
                                                        const color = mealColors[meal.meal] || '#22d3ee';
                                                        const icon = mealIcons[meal.meal] || '🍽️';
                                                        const isSwapping = swappingMealIdx === i;
                                                        
                                                        return (
                                                            <div key={i} className="p-5 bg-white/[0.01] border border-white/5 rounded-2xl group hover:bg-white/[0.03] transition-all relative overflow-hidden">
                                                                {isSwapping && (
                                                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-20 flex items-center justify-center gap-3">
                                                                        <RefreshCw className="w-4 h-4 text-[var(--primary)] animate-spin" />
                                                                        <span className="text-[8px] font-black text-white uppercase tracking-widest">Clinical Swap in progress...</span>
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center justify-between mb-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-xl">{icon}</span>
                                                                        <div>
                                                                            <h4 className="text-xs font-black text-white flex items-center gap-2">
                                                                                {meal.meal}
                                                                                {meal.swapped && <span className="text-[6px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded uppercase">Swapped</span>}
                                                                            </h4>
                                                                            <p className="text-[8px] font-bold uppercase tracking-widest opacity-60" style={{ color }}>{meal.time}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        <button 
                                                                            onClick={() => handleSwapMeal(selectedDay - 1, i, meal)}
                                                                            className="p-2 bg-white/5 border border-white/10 rounded-xl text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/30 transition-all active:scale-95 group/btn"
                                                                            title="Clinical Swap"
                                                                        >
                                                                            <RefreshCw className="w-3.5 h-3.5 group-hover/btn:rotate-180 transition-transform duration-500" />
                                                                        </button>
                                                                        <div className="text-right">
                                                                            <p className="text-xs font-black text-white">{meal.calories} kcal</p>
                                                                            <div className="flex gap-1 mt-1">
                                                                                {meal.biomarkerTargets?.map((tag, j) => {
                                                                                    const style = getImpactStyle(tag);
                                                                                    return <span key={j} className={`text-[6px] font-black px-1.5 py-0.5 rounded border ${style.bg} ${style.border} ${style.text}`}>{style.icon} {tag}</span>;
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-wrap gap-1.5 mb-4">
                                                                    {meal.items?.map((item, j) => (
                                                                        <span key={j} className="text-[9px] font-bold px-2 py-1 bg-white/5 rounded-lg text-white/70">{item}</span>
                                                                    ))}
                                                                </div>
                                                                {meal.clinicalReason && (
                                                                    <div className="p-3 bg-[var(--primary)]/5 border border-[var(--primary)]/10 rounded-xl flex items-start gap-3">
                                                                        <Sparkles className="w-3 h-3 text-[var(--primary)] mt-0.5" />
                                                                        <p className="text-[10px] font-medium text-white/80 leading-relaxed italic">"{meal.clinicalReason}"</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <UtensilsCrossed className="w-8 h-8 text-[var(--muted)] mx-auto mb-3 opacity-30" />
                                    <p className="text-xs text-[var(--muted)] text-white/40">Select a day or generate a plan to view clinical recommendations.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

/* ═══════════════════════════════════════════════════
   7. HEALTH HISTORY RECORDS (Modal)
   ═══════════════════════════════════════════════════ */
export const HealthHistoryModal = ({ isOpen, onClose, userId, authService }) => {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && userId) {
            setIsLoading(true);
            authService.getProfileHistory(userId)
                .then(data => setHistory(Array.isArray(data) ? data : []))
                .catch(err => {
                    console.error("Failed to fetch history:", err);
                    setHistory([]);
                })
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, userId, authService]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={onClose}>
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                        className="w-full max-w-4xl max-h-[85vh] bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden flex flex-col shadow-2xl"
                        onClick={e => e.stopPropagation()}>

                        <div className="flex items-center justify-between p-6 border-b border-[var(--border)] bg-[var(--background)]">
                            <div className="flex items-center gap-3">
                                <History className="w-5 h-5 text-[var(--primary)]" />
                                <div>
                                    <h2 className="text-xs font-black uppercase tracking-[0.25em] text-[var(--foreground)]">Clinical Health Records</h2>
                                    <p className="text-[9px] text-[var(--muted)] font-bold uppercase tracking-widest mt-0.5">Historical Vitals & Multi-Domain Analytics</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-[var(--border)] rounded-xl transition-all active:scale-95 shadow-sm">
                                <X className="w-5 h-5 text-[var(--muted)]" />
                            </button>
                        </div>

                        <div className="overflow-x-auto flex-1 p-6">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-24 gap-4">
                                    <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
                                    <p className="text-[10px] text-[var(--muted)] font-black uppercase tracking-widest">Sequencing Historical Data...</p>
                                </div>
                            ) : history.length === 0 ? (
                                <div className="text-center py-24 flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-[var(--border)] flex items-center justify-center opacity-30">
                                        <History className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest">Archive Empty</p>
                                        <p className="text-[9px] text-[var(--muted)] opacity-60 mt-1 max-w-[200px] mx-auto uppercase tracking-tighter">No historical clinical records were found in the bio-repository.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-6 pb-4">
                                    {history.map((record, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="p-6 border border-[var(--border)] bg-[var(--card)] rounded-2xl hover:border-[var(--primary)]/30 transition-all group shadow-sm hover:shadow-xl"
                                        >
                                            {(() => {
                                                const dateObj = new Date(record.created_at || record.createdAt || record.timestamp);
                                                const isValidDate = !isNaN(dateObj.getTime());
                                                const formattedDate = isValidDate 
                                                    ? dateObj.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
                                                    : 'Manual Entry / Date Unknown';
                                                const formattedTime = isValidDate
                                                    ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                    : '';
                                                
                                                const weight = parseFloat(record.weight);
                                                const height = parseFloat(record.height);
                                                const bmi = (weight > 0 && height > 0) 
                                                    ? (weight / ((height / 100) ** 2)).toFixed(1)
                                                    : null;

                                                return (
                                                    <>
                                                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-[var(--border)]">
                                                            <div className="flex items-center gap-4">
                                                                <div className="p-3 rounded-xl bg-[var(--primary)]/5 border border-[var(--primary)]/10">
                                                                    <Calendar className="w-5 h-5 text-[var(--primary)]" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-black text-[var(--foreground)]">
                                                                        {formattedDate}
                                                                    </p>
                                                                    <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mt-0.5">
                                                                        {formattedTime ? `Analyzed at ${formattedTime}` : 'Historical Observation'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {bmi && (
                                                                <div className="flex items-center gap-6">
                                                                    <div className="text-right">
                                                                        <p className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest mb-1">Body Metrics</p>
                                                                        <p className="text-lg font-black text-[var(--foreground)]">
                                                                            {bmi} <span className="text-[10px] text-[var(--muted)] uppercase">BMI</span>
                                                                        </p>
                                                                        <p className="text-[9px] font-bold text-[var(--primary)] uppercase tracking-tighter">
                                                                            {record.weight}kg | {record.height}cm
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                                            <div className="space-y-4">
                                                                <h4 className="text-[9px] font-black text-[var(--muted)] uppercase tracking-[0.2em] flex items-center gap-2">
                                                                    <div className="w-1 h-3 bg-amber-500 rounded-full" /> Metabolic Panel
                                                                </h4>
                                                                <div className="space-y-3">
                                                                    <HistoryItem label="HbA1c" value={record.hba1c} unit="%" color="rose" />
                                                                    <HistoryItem label="Fasting Sugar" value={record.fastingBloodSugar} unit="mg/dL" color="amber" />
                                                                    <HistoryItem label="PP Sugar" value={record.postprandialSugar} unit="mg/dL" color="amber" />
                                                                </div>
                                                            </div>

                                                            <div className="space-y-4">
                                                                <h4 className="text-[9px] font-black text-[var(--muted)] uppercase tracking-[0.2em] flex items-center gap-2">
                                                                    <div className="w-1 h-3 bg-cyan-500 rounded-full" /> Lipid Profile
                                                                </h4>
                                                                <div className="space-y-3">
                                                                    <HistoryItem label="Total Cholesterol" value={record.totalCholesterol} unit="mg/dL" color="cyan" />
                                                                    <HistoryItem label="LDL" value={record.ldl} unit="mg/dL" color="cyan" />
                                                                    <HistoryItem label="HDL" value={record.hdl} unit="mg/dL" color="emerald" />
                                                                    <HistoryItem label="Triglycerides" value={record.triglycerides} unit="mg/dL" color="blue" />
                                                                </div>
                                                            </div>

                                                            <div className="space-y-4">
                                                                <h4 className="text-[9px] font-black text-[var(--muted)] uppercase tracking-[0.2em] flex items-center gap-2">
                                                                    <div className="w-1 h-3 bg-violet-500 rounded-full" /> Renal Metrics
                                                                </h4>
                                                                <div className="space-y-3">
                                                                    <HistoryItem label="eGFR" value={record.egfr} unit="mL/min" color="violet" />
                                                                    <HistoryItem label="Creatinine" value={record.creatinine} unit="mg/dL" color="violet" />
                                                                    <HistoryItem label="Uric Acid" value={record.uricAcid} unit="mg/dL" color="violet" />
                                                                </div>
                                                            </div>

                                                            <div className="space-y-4">
                                                                <h4 className="text-[9px] font-black text-[var(--muted)] uppercase tracking-[0.2em] flex items-center gap-2">
                                                                    <div className="w-1 h-3 bg-emerald-500 rounded-full" /> Core Vitals
                                                                </h4>
                                                                <div className="space-y-3">
                                                                    <HistoryItem label="Blood Pressure" value={record.bpSystolic && record.bpDiastolic ? `${record.bpSystolic}/${record.bpDiastolic}` : null} unit="mmHg" color="foreground" />
                                                                    <HistoryItem label="Heart Rate" value={record.heartRate} unit="BPM" color="rose" />
                                                                    <HistoryItem label="SpO2" value={record.spo2} unit="%" color="cyan" />
                                                                    <HistoryItem label="Hemoglobin" value={record.hemoglobin} unit="g/dL" color="rose" />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mt-8 pt-6 border-t border-[var(--border)] flex flex-wrap gap-4 items-center">
                                                            <div className="flex flex-wrap gap-2 flex-1">
                                                                <ClinicalBadge label="Condition" value={record.conditions} color="rose" />
                                                                <ClinicalBadge label="Medication" value={record.medications} color="blue" />
                                                                <ClinicalBadge label="Allergy" value={record.allergies} color="amber" />
                                                                <ClinicalBadge label="Occupation" value={record.occupation} color="muted" />
                                                                <ClinicalBadge label="Gender" value={record.gender} color="muted" />
                                                            </div>
                                                            <div className="text-[9px] font-mono text-[var(--muted)] uppercase tracking-widest bg-[var(--background)] px-3 py-1.5 border border-[var(--border)] rounded-lg">
                                                                Record ID: #{record.id || record._id || 'UNK'}-{record.user_id || 'UNK'}
                                                            </div>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-[var(--border)] bg-[var(--background)] flex items-center justify-between">
                            <p className="text-[9px] text-[var(--muted)] font-bold uppercase tracking-widest flex items-center gap-2">
                                <Activity className="w-3 h-3 text-emerald-500" />
                                Synchronized With Bio-Archive Node
                            </p>
                            <button onClick={onClose} className="px-6 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[var(--primary)] hover:text-white transition-all shadow-lg active:scale-95">
                                Dismiss Archive
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const HistoryItem = ({ label, value, unit, color }) => {
    if (!value && value !== 0) return null;
    const colorMap = {
        rose: 'text-rose-500',
        amber: 'text-amber-500',
        cyan: 'text-cyan-400',
        emerald: 'text-emerald-500',
        blue: 'text-blue-400',
        violet: 'text-violet-400',
        foreground: 'text-[var(--foreground)]'
    };
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-tighter">{label}</span>
            <div className="flex items-baseline gap-1">
                <span className={`text-[11px] font-black ${colorMap[color] || 'text-[var(--foreground)]'}`}>{value}</span>
                <span className="text-[8px] font-bold text-[var(--muted)]/60 uppercase tracking-tighter">{unit}</span>
            </div>
        </div>
    );
};

const ClinicalBadge = ({ label, value, color }) => {
    if (!value || value === 'None') return null;
    const colorMap = {
        rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        muted: 'bg-[var(--border)] text-[var(--muted)] border-transparent'
    };
    return (
        <span className={`text-[9px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${colorMap[color]}`}>
            <span className="opacity-60 text-[8px] uppercase">{label}:</span> {value}
        </span>
    );
};
