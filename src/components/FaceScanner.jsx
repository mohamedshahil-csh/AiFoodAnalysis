import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle, AlertTriangle, Heart, Activity, Droplets, Camera, ShieldCheck, Thermometer, Sun, Wind } from 'lucide-react';
import { analyzeVideo, detectGender, mapVitalsToProfile, checkBackendHealth } from '../services/faceVitalService';
import { FaceMesh } from '@mediapipe/face_mesh';
import * as cam from '@mediapipe/camera_utils';

/**
 * FaceScanner — Webcam-based face vital scanner modal.
 * Records a 15-second video, sends to NeuroVitals backend, displays detected vitals,
 * and allows auto-filling the patient profile.
 */
const FaceScanner = ({ isOpen, onClose, onApplyVitals }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);
    const genderIntervalRef = useRef(null);

    const [phase, setPhase] = useState('idle'); // idle | ready | scanning | processing | results | error
    const [countdown, setCountdown] = useState(15);
    const [progress, setProgress] = useState(0);
    const [detectedDemo, setDetectedDemo] = useState(null); // { gender, age }
    const [results, setResults] = useState(null);
    const [mappedVitals, setMappedVitals] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [backendOnline, setBackendOnline] = useState(null);

    // Advanced Accuracy States
    const [roiStatus, setRoiStatus] = useState('none'); // none | ok | error
    const [lighting, setLighting] = useState('ok'); // ok | low | harsh
    const [stability, setStability] = useState(100); // 0-100 percentage
    const [faceDetected, setFaceDetected] = useState(false);

    // MediaPipe Refs
    const faceMeshRef = useRef(null);
    const lastLandmarksRef = useRef(null);
    const stabilityHistoryRef = useRef([]);
    const cameraRef = useRef(null);

    // -- Start camera when modal opens --
    useEffect(() => {
        if (isOpen) {
            try {
                initFaceMesh();
                startCamera();
            } catch (err) {
                console.error("Scanner init error:", err);
            }
            checkBackendHealth().then(setBackendOnline);
            return () => {
                stopCamera();
                if (faceMeshRef.current) {
                    try { faceMeshRef.current.close(); } catch (e) { }
                }
            };
        } else {
            stopCamera();
            resetState();
        }
    }, [isOpen]);

    // -- Initialize MediaPipe Face Mesh --
    const initFaceMesh = () => {
        try {
            const faceMesh = new FaceMesh({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
            });

            faceMesh.setOptions({
                maxNumFaces: 1,
                refineLandmarks: true,
                minDetectionConfidence: 0.6,
                minTrackingConfidence: 0.6,
            });

            faceMesh.onResults(onFaceResults);
            faceMeshRef.current = faceMesh;
        } catch (err) {
            console.warn("MediaPipe init failed:", err);
        }
    };

    const onFaceResults = (results) => {
        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
            setFaceDetected(false);
            setRoiStatus('none');
            return;
        }

        setFaceDetected(true);
        const landmarks = results.multiFaceLandmarks[0];

        // 1. ROI Validation (Target: Center of face within guide)
        const nose = landmarks[1]; // Nose tip
        const isCentered = nose.x > 0.35 && nose.x < 0.65 && nose.y > 0.3 && nose.y < 0.7;
        setRoiStatus(isCentered ? 'ok' : 'error');

        // 2. Stability Analysis
        if (lastLandmarksRef.current) {
            const movement = Math.sqrt(
                Math.pow(nose.x - lastLandmarksRef.current.x, 2) +
                Math.pow(nose.y - lastLandmarksRef.current.y, 2)
            );

            // Map movement to stability score
            const currentStability = Math.max(0, 100 - (movement * 15000));
            stabilityHistoryRef.current.push(currentStability);
            if (stabilityHistoryRef.current.length > 10) stabilityHistoryRef.current.shift();

            const avgStability = stabilityHistoryRef.current.reduce((a, b) => a + b, 0) / stabilityHistoryRef.current.length;
            setStability(avgStability);
        }
        lastLandmarksRef.current = { x: nose.x, y: nose.y };
    };

    const resetState = () => {
        setPhase('idle');
        setCountdown(15);
        setProgress(0);
        setDetectedDemo(null);
        setResults(null);
        setMappedVitals(null);
        setErrorMsg('');
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720, frameRate: 30, facingMode: 'user' },
                audio: false,
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setPhase('ready');

            // Start MediaPipe Camera Connector
            if (!cameraRef.current) {
                const camera = new cam.Camera(videoRef.current, {
                    onFrame: async () => {
                        if (faceMeshRef.current) {
                            try {
                                await faceMeshRef.current.send({ image: videoRef.current });
                                analyzeLighting();
                            } catch (e) { }
                        }
                    },
                    width: 1280,
                    height: 720,
                });
                cameraRef.current = camera;
                camera.start();
            }

            startGenderDetection();
        } catch (err) {
            console.error('[FaceScanner] Camera error:', err);
            setErrorMsg('Camera access denied. Please allow camera permissions and try again.');
            setPhase('error');
        }
    };

    const analyzeLighting = () => {
        if (!videoRef.current || !videoRef.current.videoWidth) return;
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 40;
            canvas.height = 40;
            ctx.drawImage(videoRef.current, 0, 0, 40, 40);
            const data = ctx.getImageData(0, 0, 40, 40).data;

            let totalBrightness = 0;
            for (let i = 0; i < data.length; i += 4) {
                totalBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
            }
            const avg = totalBrightness / (data.length / 4);

            if (avg < 50) setLighting('low');
            else if (avg > 220) setLighting('harsh');
            else setLighting('ok');
        } catch (e) { }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        if (timerRef.current) clearInterval(timerRef.current);
        if (genderIntervalRef.current) clearInterval(genderIntervalRef.current);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            try { mediaRecorderRef.current.stop(); } catch (e) { /* ignore */ }
        }
    };

    // -- Gender auto-detection (captures frame every 3s) --
    const startGenderDetection = () => {
        if (genderIntervalRef.current) clearInterval(genderIntervalRef.current);
        let samples = [];

        genderIntervalRef.current = setInterval(async () => {
            if (!videoRef.current || !videoRef.current.videoWidth || detectedDemo) return;

            try {
                const canvas = document.createElement('canvas');
                canvas.width = videoRef.current.videoWidth;
                canvas.height = videoRef.current.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.save();
                ctx.scale(-1, 1);
                ctx.drawImage(videoRef.current, -canvas.width, 0, canvas.width, canvas.height);
                ctx.restore();

                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
                const data = await detectGender(blob);

                if (data.success) {
                    samples.push(data);
                    if (samples.length >= 2) {
                        const genders = samples.map(s => s.gender);
                        const finalGender = genders.sort((a, b) =>
                            genders.filter(v => v === a).length - genders.filter(v => v === b).length
                        ).pop();
                        const ages = samples.map(s => s.age).filter(a => a !== null);
                        const finalAge = ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : null;

                        setDetectedDemo({ gender: finalGender, age: finalAge });
                        clearInterval(genderIntervalRef.current);
                    }
                }
            } catch (err) {
                // Silent fail for gender detection
            }
        }, 5000);
    };

    // -- Start 15-second scan --
    const startScan = useCallback(() => {
        if (!streamRef.current) return;

        chunksRef.current = [];
        setPhase('scanning');
        setCountdown(15);
        setProgress(0);

        // Choose MIME type
        const mimeTypes = ['video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
        const mimeType = mimeTypes.find(t => MediaRecorder.isTypeSupported(t)) || '';

        try {
            const recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : {});
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = () => handleAnalysis(mimeType);
            recorder.start(1000);

            // Countdown timer
            let sec = 15;
            timerRef.current = setInterval(() => {
                sec--;
                setCountdown(sec);
                setProgress(((15 - sec) / 15) * 100);
                if (sec <= 0) {
                    clearInterval(timerRef.current);
                    if (recorder.state !== 'inactive') recorder.stop();
                }
            }, 1000);
        } catch (err) {
            setErrorMsg('Failed to start recording: ' + err.message);
            setPhase('error');
        }
    }, []);

    // -- Process the recorded video --
    const handleAnalysis = async (mimeType) => {
        setPhase('processing');

        try {
            const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' });
            console.log("blob", blob);

            if (blob.size < 10000) {
                throw new Error('Video too short. Please try again and stay still during scan.');
            }

            const age = detectedDemo?.age || 25;
            const gender = detectedDemo?.gender || 'auto';
            const metadata = {
                stability: stability.toFixed(1),
                lighting: lighting
            };

            const data = await analyzeVideo(blob, age, gender, metadata);
            console.log("data", data);
            const vitals = mapVitalsToProfile(data);

            setResults(data);
            setMappedVitals(vitals);
            setPhase('results');
        } catch (err) {
            console.error('[FaceScanner] Analysis error:', err);
            setErrorMsg(err.message || 'Analysis failed. Please try again.');
            setPhase('error');
        }
    };

    // -- Apply vitals to patient profile --
    const handleApply = () => {
        if (mappedVitals && onApplyVitals) {
            onApplyVitals(mappedVitals);
        }
        onClose();
    };

    if (!isOpen) return null;

    const feats = results?.ClinicalFeatures || {};

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="face-scanner-overlay"
                onClick={(e) => { if (e.target === e.currentTarget && phase !== 'processing') onClose(); }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 30 }}
                    transition={{ type: 'spring', damping: 25 }}
                    className="face-scanner-modal"
                >
                    {/* Header */}
                    <div className="fs-header">
                        <div className="fs-header-left">
                            <div className="fs-pulse-dot" />
                            <span className="fs-title">NEUROVITALS FACE SCANNER</span>
                        </div>
                        {phase !== 'processing' && (
                            <button onClick={onClose} className="fs-close-btn">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Video Feed */}
                    <div className="fs-video-container">
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="fs-video"
                        />

                        {/* ROI Guide */}
                        <div className={`fs-roi-guide ${roiStatus === 'ok' ? 'fs-roi-active' : roiStatus === 'error' ? 'fs-roi-error' : ''}`} />

                        {/* Advanced Indicators */}
                        <div className="fs-indicator-panel">
                            <div className={`fs-indicator ${lighting === 'ok' ? 'fs-indicator-ok' : 'fs-indicator-warn'}`}>
                                <Sun className="w-3 h-3" />
                                <span>{lighting === 'ok' ? 'Lighting OK' : lighting === 'low' ? 'Too Dark' : 'Harsh Light'}</span>
                            </div>
                            <div className={`fs-indicator ${stability > 80 ? 'fs-indicator-ok' : stability > 50 ? 'fs-indicator-warn' : 'fs-indicator-err'}`}>
                                <Wind className="w-3 h-3" />
                                <div className="flex flex-col gap-0.5">
                                    <span>Stability {stability.toFixed(0)}%</span>
                                    <div className="fs-stability-gauge">
                                        <div className="fs-stability-fill" style={{ width: `${stability}%` }} />
                                    </div>
                                </div>
                            </div>
                            {faceDetected ? (
                                <div className="fs-indicator fs-indicator-ok">
                                    <CheckCircle className="w-3 h-3" />
                                    <span>Face Locked</span>
                                </div>
                            ) : (
                                <div className="fs-indicator fs-indicator-err">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>Face Not Found</span>
                                </div>
                            )}
                        </div>

                        {/* Processing overlay */}
                        {phase === 'processing' && (
                            <div className="fs-processing-overlay">
                                <div className="fs-loader-ring" />
                                <span className="fs-biomarker-label">EXTRACTING CAPILLARY SIGNALS...</span>
                                <span style={{ fontSize: '8px', opacity: 0.6 }}>ALGORITHM: PHYSNET-3D (SOTA)</span>
                            </div>
                        )}

                        {/* Demographics badge */}
                        {detectedDemo && (
                            <div className="fs-demo-badge">
                                <span>{detectedDemo.gender === 'male' ? '👨' : '👩'}</span>
                                <span>{detectedDemo.gender?.charAt(0).toUpperCase() + detectedDemo.gender?.slice(1)}</span>
                                <span className="fs-demo-divider">|</span>
                                <span>Age {detectedDemo.age || '--'}</span>
                            </div>
                        )}

                        {/* Backend status */}
                        {backendOnline === false && (
                            <div className="fs-offline-badge">
                                <AlertTriangle className="w-3 h-3" />
                                Backend Offline
                            </div>
                        )}
                    </div>

                    {/* Progress Bar (during scanning) */}
                    {phase === 'scanning' && (
                        <div className="fs-progress-section">
                            <div className="fs-progress-bar">
                                <motion.div
                                    className="fs-progress-fill"
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                            <div className="fs-progress-info">
                                <span className="fs-recording-dot" />
                                <span>ACQUIRING SIGNAL: {countdown}s</span>
                            </div>
                        </div>
                    )}

                    {phase === 'results' && mappedVitals && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="fs-results-v2"
                        >
                            <div className="fs-results-header">
                                <CheckCircle className="w-5 h-5 text-emerald-500" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black tracking-widest text-[#00f2fe] uppercase">Analysis Complete</span>
                                    <span className="text-xs font-bold text-[var(--foreground)]">Full Neuro-Biometric Profile Generated</span>
                                </div>
                                <div className="ml-auto flex items-center gap-2">
                                    <span className="text-[8px] font-black text-[var(--muted)] uppercase">Risk Class</span>
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                        mappedVitals.riskClass === 'High' ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' :
                                        mappedVitals.riskClass === 'Moderate' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' :
                                        'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                                    }`}>
                                        {mappedVitals.riskClass || 'Low'}
                                    </span>
                                </div>
                            </div>

                            <div className="fs-dashboard-scrollable">
                                <div className="fs-dashboard-grid">
                                    {/* Hemodynamic Suite */}
                                    <div className="fs-clinical-section">
                                        <div className="fs-section-head">
                                            <Activity className="w-3 h-3 text-[#00f2fe]" />
                                            <span>Hemodynamic Expansion</span>
                                        </div>
                                        <div className="fs-metric-row">
                                            <span>MAP</span>
                                            <span className="fs-val">{mappedVitals.map || '--'} <small>mmHg</small></span>
                                        </div>
                                        <div className="fs-metric-row">
                                            <span>Pulse Pressure</span>
                                            <span className="fs-val">{mappedVitals.pulsePressure || '--'} <small>mmHg</small></span>
                                        </div>
                                        <div className="fs-metric-row">
                                            <span>Cardiac Workload</span>
                                            <span className="fs-val">{mappedVitals.cardiacWorkload || '--'}</span>
                                        </div>
                                        <div className="fs-risk-row">
                                            <span>ASCVD Risk</span>
                                            <span className={`fs-badge fs-risk-${(mappedVitals.ascvdRisk || 'Low').toLowerCase()}`}>{mappedVitals.ascvdRisk}</span>
                                        </div>
                                    </div>

                                    {/* Respiratory Suite */}
                                    <div className="fs-clinical-section">
                                        <div className="fs-section-head">
                                            <Wind className="w-3 h-3 text-[#10b981]" />
                                            <span>Respiratory Suite</span>
                                        </div>
                                        <div className="fs-metric-row">
                                            <span>Breathing Rate</span>
                                            <span className="fs-val">{mappedVitals.respirationRate || '--'} <small>BPM</small></span>
                                        </div>
                                        <div className="fs-metric-row">
                                            <span>PRQ</span>
                                            <span className="fs-val">{mappedVitals.prq || '--'}</span>
                                        </div>
                                        <div className="fs-metric-row">
                                            <span>SpO₂</span>
                                            <span className="fs-val">{mappedVitals.spo2 || '--'} <small>%</small></span>
                                        </div>
                                    </div>

                                    {/* Metabolic Risks */}
                                    <div className="fs-clinical-section">
                                        <div className="fs-section-head">
                                            <Droplets className="w-3 h-3 text-orange-400" />
                                            <span>Metabolic Risks</span>
                                        </div>
                                        <div className="fs-metric-row">
                                            <span>Hemoglobin</span>
                                            <span className="fs-val">{mappedVitals.hemoglobin || '--'} <small>g/dL</small></span>
                                        </div>
                                        <div className="fs-metric-row">
                                            <span>HbA1c</span>
                                            <span className="fs-val">{mappedVitals.hba1c || '--'} <small>%</small></span>
                                        </div>
                                        <div className="fs-risk-row">
                                            <span>Glucose Risk</span>
                                            <span className={`fs-badge fs-risk-${(mappedVitals.glucoseRisk || 'Low').toLowerCase()}`}>{mappedVitals.glucoseRisk}</span>
                                        </div>
                                    </div>

                                    {/* Wellness & Safety */}
                                    <div className="fs-clinical-section">
                                        <div className="fs-section-head">
                                            <ShieldCheck className="w-3 h-3 text-violet-400" />
                                            <span>Wellness & Longevity</span>
                                        </div>
                                        <div className="fs-metric-row">
                                            <span>Physiol. Heart Age</span>
                                            <span className="fs-val">{mappedVitals.heartAge || '--'} <small>Yrs</small></span>
                                        </div>
                                        <div className="fs-metric-row">
                                            <span>Wellness Score</span>
                                            <span className="fs-val">{mappedVitals.wellnessScore || '--'} <small>%</small></span>
                                        </div>
                                        <div className="fs-risk-row">
                                            <span>Fall Risk</span>
                                            <span className={`fs-badge fs-risk-${(mappedVitals.fallRisk || 'Low').toLowerCase()}`}>{mappedVitals.fallRisk}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Signal quality / Confidence */}
                            <div className="fs-sqi-compact">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[7px] font-black uppercase tracking-widest text-[var(--muted)]">Signal Quality Index</span>
                                    <span className="text-[8px] font-bold text-[#00f2fe]">{mappedVitals.confidence || '0'}%</span>
                                </div>
                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                        className="h-full bg-gradient-to-r from-[#00f2fe] to-[#4facfe]"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${mappedVitals.confidence || 0}%` }}
                                        transition={{ duration: 1 }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Error Display */}
                    {phase === 'error' && (
                        <div className="fs-error">
                            <AlertTriangle className="w-5 h-5" />
                            <p>{errorMsg}</p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="fs-actions">
                        {(phase === 'ready' || phase === 'idle') && (
                            <button
                                onClick={startScan}
                                disabled={backendOnline === false}
                                className="fs-btn-scan"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                                </svg>
                                {backendOnline === false ? 'Backend Offline' : 'Start Face Scan (15s)'}
                            </button>
                        )}
                        {phase === 'results' && (
                            <div className="fs-result-buttons">
                                <button onClick={() => { resetState(); setPhase('ready'); }} className="fs-btn-retry">
                                    Scan Again
                                </button>
                                <button onClick={handleApply} className="fs-btn-apply">
                                    <CheckCircle className="w-4 h-4" />
                                    Apply Vitals to Profile
                                </button>
                            </div>
                        )}
                        {phase === 'error' && (
                            <button onClick={() => { resetState(); setPhase('ready'); }} className="fs-btn-retry">
                                Try Again
                            </button>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default FaceScanner;
