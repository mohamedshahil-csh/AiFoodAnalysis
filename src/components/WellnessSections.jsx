import React from 'react';
import { motion } from 'framer-motion';
import {
    Dumbbell, Leaf, Droplets, Target, Sunrise, Coffee, Moon as MoonIcon,
    Wind, Heart, Smile, Footprints, BedDouble, Sparkles,
    AlertTriangle, ChevronRight, Clock, Zap, Brain, Shield,
    Activity, Timer, TrendingUp, ArrowRight, CheckCircle, Star
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

// ─── Circle Progress Ring ───
const ProgressRing = ({ value, max = 100, size = 80, strokeWidth = 6, color = 'var(--primary)' }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / max) * circumference;
    return (
        <svg width={size} height={size} className="progress-ring">
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border)" strokeWidth={strokeWidth} />
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
                strokeDasharray={circumference} strokeDashoffset={offset} className="progress-ring-circle" />
        </svg>
    );
};

// ─── Score Display with Gauge ───
const ScoreGauge = ({ score, label, size = 72 }) => (
    <div className="flex flex-col items-center gap-2">
        <div className="score-gauge" style={{ '--score': score, width: size, height: size }}>
            <div className="score-gauge-inner">
                <span className="text-lg font-black text-[var(--foreground)]">{score}</span>
            </div>
        </div>
        <span className="text-[8px] font-black uppercase tracking-widest text-[var(--muted)]">{label}</span>
    </div>
);

// ─── Category Icon Resolver ───
const getCategoryIcon = (category) => {
    const icons = {
        Sleep: BedDouble, Stress: Wind, Hydration: Droplets,
        Habits: Target, Movement: Footprints
    };
    return icons[category] || Leaf;
};

const getCategoryColor = (category) => {
    const colors = {
        Sleep: '#818cf8', Stress: '#c084fc', Hydration: '#22d3ee',
        Habits: '#f59e0b', Movement: '#10b981'
    };
    return colors[category] || '#22d3ee';
};

const getPriorityClass = (priority) => {
    return priority === 'High' ? 'priority-high' : priority === 'Medium' ? 'priority-medium' : 'priority-low';
};

/* ═══════════════════════════════════════════════════
   1. EXERCISE & ACTIVITY Rx
   ═══════════════════════════════════════════════════ */
export const ExerciseSection = ({ exercisePlan }) => {
    if (!exercisePlan) return null;
    const { preExercise, postExercise, dailyExerciseTarget, exerciseWarnings } = exercisePlan;

    return (
        <section className="space-y-8">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <Dumbbell className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--muted)]">Exercise & Activity Rx</h3>
                        <p className="text-[9px] text-[var(--muted)] opacity-60 mt-0.5">Personalized to your meal & clinical profile</p>
                    </div>
                </div>
                <div className="text-[9px] font-mono text-emerald-500 bg-emerald-500/5 px-3 py-1 border border-emerald-500/20 rounded-full">
                    AI PRESCRIBED
                </div>
            </div>

            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Pre-Exercise */}
                {preExercise && (
                    <motion.div variants={fadeUp} custom={0} className="glass-card rounded-2xl p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <Sunrise className="w-4 h-4 text-amber-500" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">Pre-Meal</span>
                        </div>
                        <p className="text-xs text-[var(--foreground)] font-medium leading-relaxed">{preExercise.recommendation}</p>
                        <div className="flex gap-3">
                            <span className="text-[8px] font-black uppercase px-2 py-1 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20">{preExercise.duration}</span>
                            <span className="text-[8px] font-black uppercase px-2 py-1 bg-[var(--border)] text-[var(--muted)] rounded-full">{preExercise.intensity}</span>
                        </div>
                    </motion.div>
                )}

                {/* Post-Exercise */}
                {postExercise && (
                    <motion.div variants={fadeUp} custom={1} className="glass-card rounded-2xl p-6 space-y-4 gradient-border">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-[var(--primary)]" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--primary)]">Post-Meal</span>
                            </div>
                            <span className="text-[8px] font-black uppercase px-2 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full border border-[var(--primary)]/20">{postExercise.type}</span>
                        </div>
                        <p className="text-xs text-[var(--foreground)] font-medium leading-relaxed">{postExercise.recommendation}</p>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 bg-[var(--background)] rounded-lg">
                                <p className="text-[8px] font-black text-[var(--muted)] uppercase">Duration</p>
                                <p className="text-sm font-black text-[var(--foreground)]">{postExercise.duration}</p>
                            </div>
                            <div className="p-2 bg-[var(--background)] rounded-lg">
                                <p className="text-[8px] font-black text-[var(--muted)] uppercase">Timing</p>
                                <p className="text-sm font-black text-[var(--foreground)]">{postExercise.timing}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                            <Zap className="w-3 h-3 text-emerald-500" />
                            <span className="text-[10px] font-bold text-emerald-500">~{postExercise.estimatedCaloriesBurned} kcal burn</span>
                        </div>
                    </motion.div>
                )}

                {/* Daily Target */}
                {dailyExerciseTarget && (
                    <motion.div variants={fadeUp} custom={2} className="glass-card rounded-2xl p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-violet-500" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-violet-500">Daily Target</span>
                        </div>
                        <div className="flex items-center justify-center py-2">
                            <ProgressRing value={dailyExerciseTarget.totalMinutes} max={60} size={90} color="#8b5cf6" />
                        </div>
                        <div className="text-center">
                            <p className="text-xl font-black text-[var(--foreground)]">{dailyExerciseTarget.totalMinutes}<span className="text-xs ml-1 opacity-40">min</span></p>
                            <p className="text-[9px] font-bold text-[var(--muted)] uppercase">{dailyExerciseTarget.type}</p>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-violet-500/5 rounded-lg border border-violet-500/10">
                            <Footprints className="w-3 h-3 text-violet-500" />
                            <span className="text-[10px] font-bold text-violet-500">{dailyExerciseTarget.steps?.toLocaleString()} steps target</span>
                        </div>
                        <p className="text-[9px] text-[var(--muted)] leading-relaxed italic">{dailyExerciseTarget.reason}</p>
                    </motion.div>
                )}
            </motion.div>

            {/* Exercise Warnings */}
            {exerciseWarnings?.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                    className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-xl space-y-2">
                    {exerciseWarnings.map((w, i) => (
                        <div key={i} className="flex items-start gap-2">
                            <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-amber-200 font-medium leading-relaxed">{w}</p>
                        </div>
                    ))}
                </motion.div>
            )}
        </section>
    );
};

/* ═══════════════════════════════════════════════════
   2. LIFESTYLE CHANGES
   ═══════════════════════════════════════════════════ */
export const LifestyleSection = ({ lifestyleChanges }) => {
    if (!lifestyleChanges?.recommendations?.length) return null;

    return (
        <section className="space-y-8">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                        <Leaf className="w-4 h-4 text-violet-500" />
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--muted)]">Lifestyle Changes</h3>
                        <p className="text-[9px] text-[var(--muted)] opacity-60 mt-0.5">Actionable modifications for your health</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                    </span>
                    <span className="text-[9px] font-mono text-violet-500 font-black uppercase tracking-widest">Personalized</span>
                </div>
            </div>

            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lifestyleChanges.recommendations.map((rec, i) => {
                    const Icon = getCategoryIcon(rec.category);
                    const catColor = getCategoryColor(rec.category);
                    return (
                        <motion.div key={i} variants={fadeUp} custom={i}
                            className="glass-card rounded-2xl p-6 space-y-4 group hover:border-opacity-50 transition-all duration-500"
                            style={{ '--cat-color': catColor }}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg" style={{ background: `${catColor}15`, border: `1px solid ${catColor}30` }}>
                                        <Icon className="w-3.5 h-3.5" style={{ color: catColor }} />
                                    </div>
                                    <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: catColor }}>{rec.category}</span>
                                </div>
                                <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full border ${getPriorityClass(rec.priority)}`}>{rec.priority}</span>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-[var(--foreground)] mb-2 group-hover:text-[var(--primary)] transition-colors">{rec.title}</h4>
                                <p className="text-[10px] text-[var(--muted)] leading-relaxed">{rec.description}</p>
                            </div>
                            <div className="flex items-center gap-1.5 pt-2 border-t border-[var(--border)]">
                                <Clock className="w-2.5 h-2.5 text-[var(--muted)]" />
                                <span className="text-[8px] font-bold text-[var(--muted)] uppercase tracking-widest">{rec.timeframe}</span>
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>
        </section>
    );
};

/* ═══════════════════════════════════════════════════
   3. DAILY WELLNESS PLAN
   ═══════════════════════════════════════════════════ */
export const DailyWellnessPlanSection = ({ dailyWellnessPlan }) => {
    if (!dailyWellnessPlan) return null;
    const phases = [
        { key: 'morning', data: dailyWellnessPlan.morning, icon: Sunrise, label: 'Morning', gradient: 'from-amber-500/10 to-orange-500/5', color: '#f59e0b', borderColor: 'border-amber-500/20' },
        { key: 'afternoon', data: dailyWellnessPlan.afternoon, icon: Coffee, label: 'Afternoon', gradient: 'from-cyan-500/10 to-blue-500/5', color: '#22d3ee', borderColor: 'border-cyan-500/20' },
        { key: 'evening', data: dailyWellnessPlan.evening, icon: MoonIcon, label: 'Evening', gradient: 'from-violet-500/10 to-indigo-500/5', color: '#8b5cf6', borderColor: 'border-violet-500/20' },
    ];

    return (
        <section className="space-y-8">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20">
                        <Clock className="w-4 h-4 text-[var(--primary)]" />
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--muted)]">Daily Wellness Plan</h3>
                        <p className="text-[9px] text-[var(--muted)] opacity-60 mt-0.5">Your optimized daily routine</p>
                    </div>
                </div>
            </div>

            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {phases.map(({ key, data, icon: PhaseIcon, label, gradient, color, borderColor }, i) => {
                    if (!data) return null;
                    return (
                        <motion.div key={key} variants={fadeUp} custom={i}
                            className={`rounded-2xl p-6 space-y-5 bg-gradient-to-b ${gradient} border ${borderColor}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <PhaseIcon className="w-5 h-5" style={{ color }} />
                                    <div>
                                        <p className="text-sm font-black text-[var(--foreground)]">{label}</p>
                                        <p className="text-[8px] font-bold uppercase tracking-widest" style={{ color }}>{data.time}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {data.activities?.map((activity, idx) => (
                                    <div key={idx} className="flex items-start gap-2.5">
                                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}60` }} />
                                        <p className="text-[10px] text-[var(--foreground)] leading-relaxed font-medium">{activity}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>
        </section>
    );
};

/* ═══════════════════════════════════════════════════
   4. HYDRATION & RECOVERY
   ═══════════════════════════════════════════════════ */
export const HydrationSection = ({ hydrationRecovery }) => {
    if (!hydrationRecovery) return null;

    return (
        <section className="space-y-8">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                        <Droplets className="w-4 h-4 text-cyan-500" />
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--muted)]">Hydration & Recovery</h3>
                        <p className="text-[9px] text-[var(--muted)] opacity-60 mt-0.5">Optimize fluid balance & recovery</p>
                    </div>
                </div>
            </div>

            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
                {/* Top Row: Water Target + Pre/Post */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <motion.div variants={fadeUp} custom={0} className="glass-card rounded-2xl p-6 text-center space-y-3 pulse-glow">
                        <Droplets className="w-8 h-8 text-cyan-500 mx-auto float-animation" />
                        <p className="text-3xl font-black text-[var(--foreground)]">{hydrationRecovery.dailyWaterTarget}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-cyan-500">Daily Water Target</p>
                    </motion.div>
                    <motion.div variants={fadeUp} custom={1} className="glass-card rounded-2xl p-6 space-y-3">
                        <div className="flex items-center gap-2">
                            <ArrowRight className="w-3 h-3 text-amber-500" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">Before Meal</span>
                        </div>
                        <p className="text-xs text-[var(--foreground)] font-medium leading-relaxed">{hydrationRecovery.preMealWater}</p>
                    </motion.div>
                    <motion.div variants={fadeUp} custom={2} className="glass-card rounded-2xl p-6 space-y-3">
                        <div className="flex items-center gap-2">
                            <ArrowRight className="w-3 h-3 text-emerald-500 rotate-180" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">After Meal</span>
                        </div>
                        <p className="text-xs text-[var(--foreground)] font-medium leading-relaxed">{hydrationRecovery.postMealWater}</p>
                    </motion.div>
                </div>

                {/* Electrolytes */}
                {hydrationRecovery.electrolytes && (
                    <motion.div variants={fadeUp} custom={3} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.entries(hydrationRecovery.electrolytes).map(([key, val], i) => (
                            <div key={key} className="p-5 border border-[var(--border)] bg-[var(--card)] rounded-xl space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-[var(--primary)] shadow-[0_0_6px_var(--primary)]" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--muted)]">{key}</span>
                                </div>
                                <p className="text-[10px] text-[var(--foreground)] leading-relaxed font-medium">{val}</p>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* Recovery Tips */}
                {hydrationRecovery.recoveryTips?.length > 0 && (
                    <motion.div variants={fadeUp} custom={4} className="p-5 bg-[var(--primary)]/5 border border-[var(--primary)]/10 rounded-2xl space-y-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-[var(--primary)]">Recovery Protocol</p>
                        {hydrationRecovery.recoveryTips.map((tip, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <CheckCircle className="w-3 h-3 text-[var(--primary)] shrink-0 mt-0.5" />
                                <p className="text-[10px] text-[var(--foreground)] font-medium leading-relaxed">{tip}</p>
                            </div>
                        ))}
                    </motion.div>
                )}
            </motion.div>
        </section>
    );
};

/* ═══════════════════════════════════════════════════
   5. MENTAL WELLNESS & MIND-BODY CONNECTION
   ═══════════════════════════════════════════════════ */
export const MentalWellnessSection = ({ mentalWellness }) => {
    if (!mentalWellness) return null;

    return (
        <section className="space-y-8">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/20">
                        <Brain className="w-4 h-4 text-pink-500" />
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--muted)]">Mind-Body Connection</h3>
                        <p className="text-[9px] text-[var(--muted)] opacity-60 mt-0.5">Food-mood intelligence & cognitive wellness</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-pink-500" />
                    <span className="text-[9px] font-mono text-pink-500 font-black uppercase tracking-widest">Neuro-AI</span>
                </div>
            </div>

            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
                {/* Score Gauges */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div variants={fadeUp} custom={0} className="glass-card rounded-2xl p-6 flex items-center gap-6">
                        <ScoreGauge score={mentalWellness.foodMoodScore} label="Food-Mood" size={80} />
                        <div className="flex-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-pink-500 mb-2">Mood Impact</p>
                            <p className="text-[10px] text-[var(--foreground)] leading-relaxed font-medium">{mentalWellness.moodImpact}</p>
                        </div>
                    </motion.div>

                    {mentalWellness.cognitivePerformance && (
                        <motion.div variants={fadeUp} custom={1} className="glass-card rounded-2xl p-6 flex items-center gap-6">
                            <ScoreGauge score={mentalWellness.cognitivePerformance.score} label="Cognitive" size={80} />
                            <div className="flex-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-[var(--primary)] mb-2">Brain Performance</p>
                                <p className="text-[10px] text-[var(--foreground)] leading-relaxed font-medium">{mentalWellness.cognitivePerformance.insight}</p>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Stress Tips + Mindfulness */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mentalWellness.stressTips?.length > 0 && (
                        <motion.div variants={fadeUp} custom={2} className="p-6 border border-violet-500/15 bg-violet-500/5 rounded-2xl space-y-4">
                            <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-violet-500" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-violet-500">Stress Management</span>
                            </div>
                            <div className="space-y-3">
                                {mentalWellness.stressTips.map((tip, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                        <Wind className="w-3 h-3 text-violet-400 shrink-0 mt-0.5" />
                                        <p className="text-[10px] text-[var(--foreground)] font-medium leading-relaxed">{tip}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {mentalWellness.mindfulnessSuggestions?.length > 0 && (
                        <motion.div variants={fadeUp} custom={3} className="p-6 border border-pink-500/15 bg-pink-500/5 rounded-2xl space-y-4">
                            <div className="flex items-center gap-2">
                                <Smile className="w-4 h-4 text-pink-500" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-pink-500">Mindful Eating</span>
                            </div>
                            <div className="space-y-3">
                                {mentalWellness.mindfulnessSuggestions.map((s, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                        <Star className="w-3 h-3 text-pink-400 shrink-0 mt-0.5" />
                                        <p className="text-[10px] text-[var(--foreground)] font-medium leading-relaxed">{s}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </section>
    );
};
