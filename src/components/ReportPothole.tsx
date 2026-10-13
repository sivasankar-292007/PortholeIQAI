import React, { useState, useRef } from 'react';
import { usePothole } from '../context/PotholeContext';
import { AIDetectionResult, RoadClassification, SeverityLevel } from '../types';
import { SAMPLE_IMAGES } from '../data/sampleImages';
import { runLocalMobileNetInference } from '../services/aiDetection';
import {
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Sparkles,
  Loader2,
  ArrowRight,
  ShieldAlert,
  Info,
  RotateCcw,
  Navigation
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ReportPotholeProps {
  onSuccess: (complaintId: string) => void;
}

export const ReportPothole: React.FC<ReportPotholeProps> = ({ onSuccess }) => {
  const {
    currentUser,
    submitComplaint,
    checkNearbyDuplicates,
    aiThreshold
  } = usePothole();

  // Form State
  const [photoSrc, setPhotoSrc] = useState<string>('');
  const [photoName, setPhotoName] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<AIDetectionResult | null>(null);
  const [aiChecked, setAiChecked] = useState<boolean>(false);

  // Location State
  const [latitude, setLatitude] = useState<number>(12.9716);
  const [longitude, setLongitude] = useState<number>(77.5946);
  const [locationSelected, setLocationSelected] = useState<boolean>(false);
  const [address, setAddress] = useState<string>('');
  const [landmark, setLandmark] = useState<string>('');
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [nearbyDuplicates, setNearbyDuplicates] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Handle file upload / camera
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPhotoSrc(result);
      setAiResult(null);
      setAiChecked(false);
    };
    reader.readAsDataURL(file);
  };

  // 1-Click test samples (matches poster & presentation test cases)
  const loadSampleImage = (type: 'severe' | 'moderate' | 'normal' | 'cleanStreet') => {
    let src = '';
    let name = '';
    if (type === 'severe') {
      src = SAMPLE_IMAGES.severePothole;
      name = 'pothole_crater_arterial.jpg';
    } else if (type === 'moderate') {
      src = SAMPLE_IMAGES.moderatePothole;
      name = 'moderate_bitumen_fracture.jpg';
    } else if (type === 'normal') {
      src = SAMPLE_IMAGES.normalRoad;
      name = 'normal_smooth_highway.jpg';
    } else {
      src = SAMPLE_IMAGES.cleanStreet;
      name = 'clean_residential_lane.jpg';
    }
    setPhotoSrc(src);
    setPhotoName(name);
    setAiResult(null);
    setAiChecked(false);
  };

  // 2. Run AI Check (MobileNetV2 edge pipeline)
  const handleRunAICheck = async () => {
    if (!photoSrc) return;
    setIsAnalyzing(true);

    try {
      // Simulate real neural network inference delay for realistic demonstration
      await new Promise((r) => setTimeout(r, 650));
      const result = await runLocalMobileNetInference(photoSrc, aiThreshold);
      setAiResult(result);
      setAiChecked(true);
    } catch (err) {
      console.error('AI check error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 3. Location Capture: Browser Geolocation or Interactive Tap
  const handleGetGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        setLocationSelected(true);
        setIsLocating(false);
        setAddress(`GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        // Check for duplicates
        const dupes = checkNearbyDuplicates(lat, lng, 75);
        setNearbyDuplicates(dupes);
      },
      (err) => {
        setIsLocating(false);
        // Default to demo city location with slight random offset
        const fallbackLat = 12.9716 + (Math.random() - 0.5) * 0.015;
        const fallbackLng = 77.5946 + (Math.random() - 0.5) * 0.015;
        setLatitude(fallbackLat);
        setLongitude(fallbackLng);
        setLocationSelected(true);
        setAddress(`City Sector 4 (${fallbackLat.toFixed(4)}, ${fallbackLng.toFixed(4)})`);
        const dupes = checkNearbyDuplicates(fallbackLat, fallbackLng, 75);
        setNearbyDuplicates(dupes);
      },
      { timeout: 7000 }
    );
  };

  // Interactive tap on the schematic city grid (matches video demo step 3)
  const handleGridTap = (sectorName: string, latOffset: number, lngOffset: number) => {
    const lat = 12.9716 + latOffset;
    const lng = 77.5946 + lngOffset;
    setLatitude(lat);
    setLongitude(lng);
    setLocationSelected(true);
    setAddress(`${sectorName}, Smart City Zone`);
    const dupes = checkNearbyDuplicates(lat, lng, 75);
    setNearbyDuplicates(dupes);
  };

  // 4. Submit Complaint
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!photoSrc) {
      alert('Please add a pothole photograph first.');
      return;
    }

    if (!aiChecked || !aiResult) {
      alert('Please run the AI Check first to verify the image.');
      return;
    }

    // Rejection rule: If AI classifies as normal road, do not submit as a pothole!
    if (aiResult.classification === 'normal_road') {
      alert(
        'Submission Rejected: The AI classifier verified this image as a NORMAL ROAD with no significant damage. SDG 11 maintenance resources are reserved for active road hazards.'
      );
      return;
    }

    if (!locationSelected) {
      alert('Please tap a location on the map or capture GPS coordinates.');
      return;
    }

    setIsSubmitting(true);

    try {
      const created = await submitComplaint({
        reporterId: currentUser.id,
        reporterName: currentUser.name,
        reporterEmail: currentUser.email,
        photoUrl: photoSrc,
        latitude,
        longitude,
        address: address || `Roadway at (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
        landmark: landmark || undefined,
        aiPrediction: aiResult.classification,
        aiConfidence: aiResult.confidence,
        estimatedSeverity: aiResult.severity,
        boxCoveragePercent: aiResult.boxCoveragePercent,
        aiDetails: {
          estimatedDepthCm: aiResult.estimatedDepthCm,
          hazardRisk: aiResult.hazardRisk,
          analysisMode: aiResult.analysisMode,
          featuresFound: aiResult.featuresFound
        },
        priority: aiResult.severity === 'Dangerous' ? 'Urgent' : aiResult.severity === 'Medium' ? 'High' : 'Normal'
      });

      setSubmittedId(created.id);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (err) {
      console.error('Submission failed', err);
      alert('Failed to submit complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const handleResetForm = () => {
    setPhotoSrc('');
    setPhotoName('');
    setAiResult(null);
    setAiChecked(false);
    setLocationSelected(false);
    setAddress('');
    setLandmark('');
    setSubmittedId(null);
    setNearbyDuplicates([]);
  };

  // If already submitted, show success receipt
  if (submittedId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl p-8 border border-emerald-200 shadow-lg text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Complaint Submitted Successfully!
          </h2>
          <div className="inline-block bg-slate-900 text-amber-400 font-mono text-base font-extrabold px-4 py-1.5 rounded-xl my-3">
            Complaint ID: {submittedId}
          </div>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Your complaint has been automatically registered and dispatched to the Municipal Roads Office. It is now tracked on the public map as a <strong>RED PIN</strong>.
          </p>

          <div className="bg-slate-50 rounded-2xl p-4 my-6 text-left border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Estimated Severity:</span>
              <span className="font-bold text-rose-600">{aiResult?.severity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">AI Confidence:</span>
              <span className="font-bold text-slate-800">
                {aiResult ? (aiResult.confidence * 100).toFixed(0) : '92'}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Location:</span>
              <span className="font-semibold text-slate-800 truncate max-w-[240px]">{address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Municipal Dispatch:</span>
              <span className="font-bold text-emerald-700">Auto Email Notification Sent</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onSuccess(submittedId)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <span>View on Public Map</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetForm}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors cursor-pointer"
            >
              Report Another Pothole
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-4">
      {/* Step Guide / Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-5">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Report a Pothole
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Take a photo, verify with AI, select location, and make the complaint visible on the public repair map.
        </p>

        {/* 1-Click Preset Samples for Instant Exhibition Testing */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Instant Test Presets (For Exhibition Evaluation):</span>
            <span className="text-amber-600 font-normal">Click to load</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <button
              type="button"
              onClick={() => loadSampleImage('severe')}
              className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-semibold text-left transition-colors cursor-pointer"
            >
              <div className="font-bold">Severe Crater</div>
              <div className="text-[10px] text-rose-600">High hazard pothole</div>
            </button>

            <button
              type="button"
              onClick={() => loadSampleImage('moderate')}
              className="p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold text-left transition-colors cursor-pointer"
            >
              <div className="font-bold">Moderate Pothole</div>
              <div className="text-[10px] text-amber-600">Medium severity</div>
            </button>

            <button
              type="button"
              onClick={() => loadSampleImage('normal')}
              className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-left transition-colors cursor-pointer"
            >
              <div className="font-bold">Normal Road</div>
              <div className="text-[10px] text-emerald-600">Tests AI Rejection</div>
            </button>

            <button
              type="button"
              onClick={() => loadSampleImage('cleanStreet')}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-semibold text-left transition-colors cursor-pointer"
            >
              <div className="font-bold">Clean Concrete</div>
              <div className="text-[10px] text-slate-600">Tests Normal Pass</div>
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Step 1: Add a Photo (Matching the exact video design) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">
                1
              </span>
              <span>Add a photo</span>
            </h2>
            {photoSrc && (
              <button
                type="button"
                onClick={() => {
                  setPhotoSrc('');
                  setPhotoName('');
                  setAiResult(null);
                  setAiChecked(false);
                }}
                className="text-xs text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Change photo
              </button>
            )}
          </div>

          {/* Photo File Input & Native Camera trigger */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Choose File / Take Photo</span>
            </button>

            <span className="text-xs text-slate-500 font-mono truncate max-w-[220px]">
              {photoName || 'No file chosen'}
            </span>
          </div>

          {/* Image Preview Canvas */}
          {photoSrc ? (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 mb-3">
              <img
                src={photoSrc}
                alt="Pothole capture preview"
                className="w-full max-h-72 object-contain mx-auto"
              />
              <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2 py-0.5 rounded">
                224×224 Input Ready
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center text-slate-400 hover:border-amber-400 hover:text-amber-600 cursor-pointer transition-colors mb-3"
            >
              <Camera className="w-10 h-10 mx-auto mb-2 opacity-60" />
              <div className="text-xs font-bold text-slate-700">
                Tap to photograph road damage or select an image
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Supports camera snapshot, JPG, PNG, or sample presets above
              </div>
            </div>
          )}

          {/* Run AI Check Button (Matching video design) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!photoSrc || isAnalyzing}
                onClick={handleRunAICheck}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  !photoSrc
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : isAnalyzing
                    ? 'bg-slate-800 text-amber-400'
                    : 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Checking photo...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Run AI check</span>
                  </>
                )}
              </button>

              <span className="text-xs text-slate-500">
                {!photoSrc
                  ? 'Choose a photo first.'
                  : isAnalyzing
                  ? 'Analyzing luminance & edge tensors...'
                  : aiChecked
                  ? 'Done.'
                  : 'Ready.'}
              </span>
            </div>
          </div>

          {/* AI Result Card (Shown after Run AI Check) */}
          {aiResult && (
            <div
              className={`mt-4 p-4 rounded-xl border text-xs ${
                aiResult.classification === 'pothole'
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : 'bg-rose-50/80 border-rose-200'
              }`}
            >
              {/* Badges matching video: [Pothole detected] [dangerous] */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                    aiResult.classification === 'pothole'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  {aiResult.classification === 'pothole'
                    ? 'Pothole detected'
                    : 'Normal road detected'}
                </span>

                {aiResult.classification === 'pothole' && (
                  <span
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs lowercase ${
                      aiResult.severity === 'Dangerous'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : aiResult.severity === 'Medium'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-slate-100 text-slate-800 border border-slate-200'
                    }`}
                  >
                    {aiResult.severity}
                  </span>
                )}
              </div>

              {/* Confidence Bar matching video */}
              <div className="mb-2">
                <div className="flex justify-between font-semibold text-slate-800 mb-1">
                  <span>Confidence {(aiResult.confidence * 100).toFixed(0)}%</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Model: MobileNetV2
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      aiResult.classification === 'pothole'
                        ? 'bg-emerald-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${aiResult.confidence * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Damage coverage description matching video */}
              {aiResult.classification === 'pothole' ? (
                <div className="text-slate-600 text-[11px]">
                  Box covers {aiResult.boxCoveragePercent}% of the photo: under 5% small, 5 to 15% medium, over 15% dangerous.
                  <div className="mt-1 text-slate-500 italic">
                    Estimated depth: ~{aiResult.estimatedDepthCm} cm · Hazard: {aiResult.hazardRisk}
                  </div>
                </div>
              ) : (
                <div className="text-rose-800 font-medium">
                  {aiResult.rejectionReason}
                  <div className="mt-1 text-[11px] text-rose-600">
                    Normal roads will not be accepted for municipal repair work orders.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Tap Location on the Map (Matching video layout) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">
                2
              </span>
              <span>Tap the location on the map</span>
            </h2>

            {/* GPS Locate Button */}
            <button
              type="button"
              disabled={isLocating}
              onClick={handleGetGPS}
              className="text-xs font-semibold text-slate-700 hover:text-slate-950 flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5 text-amber-600" />
              <span>{isLocating ? 'Locating...' : 'Use My GPS'}</span>
            </button>
          </div>

          {/* Schematic Interactive Map Canvas matching video layout */}
          <div className="bg-slate-100 rounded-xl p-4 border border-slate-200/90 relative min-h-[220px]">
            {/* Simulated city blocks */}
            <div className="grid grid-cols-3 gap-3 h-[180px]">
              <button
                type="button"
                onClick={() => handleGridTap('Outer Ring Road', 0.002, -0.003)}
                className="bg-slate-200/80 hover:bg-amber-100/60 rounded-lg p-2 border border-slate-300 flex flex-col items-center justify-center text-center transition-colors cursor-pointer group"
              >
                <MapPin className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-slate-600 mt-1">Sector A</span>
              </button>

              <button
                type="button"
                onClick={() => handleGridTap('Cubbon Boulevard', 0.005, 0.001)}
                className="bg-emerald-100/80 hover:bg-emerald-200/80 rounded-lg p-2 border border-emerald-300 flex flex-col items-center justify-center text-center transition-colors cursor-pointer group"
              >
                <MapPin className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-emerald-800 mt-1">Park Zone</span>
              </button>

              <button
                type="button"
                onClick={() => handleGridTap('Indiranagar 100ft Rd', -0.004, 0.006)}
                className="bg-slate-200/80 hover:bg-amber-100/60 rounded-lg p-2 border border-slate-300 flex flex-col items-center justify-center text-center transition-colors cursor-pointer group"
              >
                <MapPin className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-slate-600 mt-1">Sector C</span>
              </button>

              <button
                type="button"
                onClick={() => handleGridTap('Halasuru Junction', -0.001, 0.008)}
                className="bg-slate-200/80 hover:bg-amber-100/60 rounded-lg p-2 border border-slate-300 flex flex-col items-center justify-center text-center transition-colors cursor-pointer group"
              >
                <MapPin className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-slate-600 mt-1">Metro Road</span>
              </button>

              <button
                type="button"
                onClick={() => handleGridTap('MG Road Promenade', 0.007, -0.001)}
                className="bg-slate-200/80 hover:bg-amber-100/60 rounded-lg p-2 border border-slate-300 flex flex-col items-center justify-center text-center transition-colors cursor-pointer group"
              >
                <MapPin className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-slate-600 mt-1">Center Plaza</span>
              </button>

              <button
                type="button"
                onClick={() => handleGridTap('South Highway Link', -0.008, -0.005)}
                className="bg-slate-200/80 hover:bg-amber-100/60 rounded-lg p-2 border border-slate-300 flex flex-col items-center justify-center text-center transition-colors cursor-pointer group"
              >
                <MapPin className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-slate-600 mt-1">Sector F</span>
              </button>
            </div>

            {/* Target pin indicator if location selected */}
            {locationSelected && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                <div className="relative">
                  <span className="w-6 h-6 rounded-full bg-blue-500/30 animate-ping absolute -inset-1"></span>
                  <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md"></div>
                </div>
              </div>
            )}
          </div>

          {/* Location Selected Indicator matching video */}
          <div className="mt-3 text-xs flex items-center justify-between text-slate-600">
            <div>
              {locationSelected ? (
                <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    Location set ({latitude.toFixed(2)}, {longitude.toFixed(2)}) · {address}
                  </span>
                </span>
              ) : (
                <span className="text-slate-400">No location chosen yet.</span>
              )}
            </div>
          </div>

          {/* Nearby Duplicate Report Warning */}
          {nearbyDuplicates.length > 0 && (
            <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Duplicate Warning:</strong> Another complaint (#{nearbyDuplicates[0].id}) was already reported within 75m of this location. Your report will be linked to the same municipal work order cluster.
              </div>
            </div>
          )}

          {/* Optional Landmark / Note input */}
          <div className="mt-3">
            <input
              type="text"
              placeholder="Optional landmark (e.g. Opposite Metro Pillar 140 or Bus Stop)"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Submit Complaint Button matching video */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={
              !photoSrc ||
              !aiChecked ||
              aiResult?.classification === 'normal_road' ||
              !locationSelected ||
              isSubmitting
            }
            className={`w-full py-3.5 rounded-2xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
              !photoSrc ||
              !aiChecked ||
              aiResult?.classification === 'normal_road' ||
              !locationSelected
                ? 'bg-amber-200 text-amber-800 cursor-not-allowed opacity-75'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 hover:shadow-lg'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Registering Complaint & Notifying Office...</span>
              </>
            ) : (
              <span>Submit complaint</span>
            )}
          </button>

          {aiResult?.classification === 'normal_road' && (
            <p className="text-center text-xs text-rose-600 font-semibold mt-2">
              Cannot submit normal road as a pothole complaint.
            </p>
          )}
        </div>
      </form>
    </div>
  );
};
