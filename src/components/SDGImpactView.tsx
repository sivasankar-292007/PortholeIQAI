import React from 'react';
import {
  ShieldCheck,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Layers,
  ArrowRight,
  TrendingDown,
  Car,
  HeartPulse,
  Scale
} from 'lucide-react';

export const SDGImpactView: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
      {/* Hero Banner matching Poster & PPT Slide 1 */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden border border-slate-700">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-[#E5A33D] text-slate-950 font-black px-3 py-1 rounded-lg text-xs uppercase tracking-wider mb-4 shadow-sm">
            <span>UN SDG 11: Sustainable Cities & Communities</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-3">
            Pothole<span className="text-amber-400">IQ</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 font-medium mb-6 leading-relaxed">
            AI-powered pothole reporting with a transparent public repair map.
            <br />
            <span className="text-amber-400 font-bold">
              Better Roads — Brighter Futures!
            </span>
          </p>

          <div className="flex flex-wrap gap-3 text-xs">
            <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Red = Pending</span>
            </div>
            <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Amber = Assigned / In Work</span>
            </div>
            <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Green = Repaired & Verified</span>
            </div>
          </div>
        </div>

        {/* Decorative background badge */}
        <div className="absolute right-4 -bottom-10 opacity-15 pointer-events-none hidden md:block">
          <div className="text-[200px] font-black text-amber-400 leading-none select-none">
            11
          </div>
        </div>
      </div>

      {/* The Problem: Why Broken Roads Hurt People Every Day (Slide 2) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mb-2">
          The Problem: Broken roads hurt people every day
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          Every year, thousands of fatal accidents and major vehicle repair expenses are caused by unattended road craters.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-rose-50/70 p-5 rounded-2xl border border-rose-200 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center">
              <HeartPulse className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm">
              Accidents & Injuries
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Two-wheelers and cars lose balance or brake suddenly on damaged roads, leading to severe highway collisions.
            </p>
          </div>

          <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center">
              <Car className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm">
              Vehicle Damage
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tyres puncture, wheel rims bend, and suspension systems crack, causing enormous recurring financial loss to citizens.
            </p>
          </div>

          <div className="bg-slate-100 p-5 rounded-2xl border border-slate-200 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm">
              Complaints Vanish
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Traditional complaints disappear into a black hole with no tracking, no public visibility, and no accountability.
            </p>
          </div>
        </div>
      </div>

      {/* Comparison: Today vs With PotholeIQ (Slide 3) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mb-4">
          Today a complaint disappears vs With PotholeIQ
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Today */}
          <div className="space-y-3">
            <div className="font-extrabold text-slate-500 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200">
              Traditional Broken System
            </div>
            <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200 flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                ✕
              </div>
              <div>
                <strong className="text-slate-900">No Tracking:</strong>
                <p className="text-slate-600 mt-0.5">The complaint goes into an administrative black hole.</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200 flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                ✕
              </div>
              <div>
                <strong className="text-slate-900">No Proof:</strong>
                <p className="text-slate-600 mt-0.5">No photographic evidence, no verified GPS coordinates.</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200 flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                ✕
              </div>
              <div>
                <strong className="text-slate-900">No Pressure:</strong>
                <p className="text-slate-600 mt-0.5">Nobody sees how long the road hazard has been left unattended.</p>
              </div>
            </div>
          </div>

          {/* With PotholeIQ */}
          <div className="space-y-3">
            <div className="font-extrabold text-emerald-700 uppercase tracking-wider text-[11px] pb-1 border-b border-emerald-200">
              With PotholeIQ
            </div>
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                ✓
              </div>
              <div>
                <strong className="text-slate-900">Live Status:</strong>
                <p className="text-slate-600 mt-0.5">Submitted, Assigned, In Progress, Fixed publicly visible.</p>
              </div>
            </div>

            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                ✓
              </div>
              <div>
                <strong className="text-slate-900">Photo + GPS + AI Check:</strong>
                <p className="text-slate-600 mt-0.5">The complaint is verified by computer vision before dispatch.</p>
              </div>
            </div>

            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                ✓
              </div>
              <div>
                <strong className="text-slate-900">Days-Ignored Counter:</strong>
                <p className="text-slate-600 mt-0.5">Delays become public knowledge, creating civic accountability.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Step Solution (Slide 4) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mb-2">
          Our Solution in Five Steps
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          Report a pothole with one photo and watch its repair in public.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col items-center text-center">
            <span className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center mb-2">
              1
            </span>
            <strong className="text-slate-900 mb-1">Snap a photo</strong>
            <span className="text-slate-600 text-[11px]">
              Open the app and photograph the damaged road section.
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col items-center text-center">
            <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mb-2">
              2
            </span>
            <strong className="text-slate-900 mb-1">AI confirms</strong>
            <span className="text-slate-600 text-[11px]">
              MobileNetV2 verifies pothole vs normal road. GPS added.
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 flex flex-col items-center text-center">
            <span className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center mb-2">
              3
            </span>
            <strong className="text-slate-900 mb-1">Auto-send</strong>
            <span className="text-slate-600 text-[11px]">
              Complaint automatically reaches the municipal roads office.
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col items-center text-center">
            <span className="w-8 h-8 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center mb-2">
              4
            </span>
            <strong className="text-slate-900 mb-1">Public map</strong>
            <span className="text-slate-600 text-[11px]">
              Red pin = pending. Green pin = fixed. Visible to all citizens.
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col items-center text-center">
            <span className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center mb-2">
              5
            </span>
            <strong className="text-slate-900 mb-1">Days ignored</strong>
            <span className="text-slate-600 text-[11px]">
              Live counter shows how long repair has waited.
            </span>
          </div>
        </div>
      </div>

      {/* Inside the AI Model: 5 Parts (Slide 9 & 10) */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <Cpu className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl font-extrabold tracking-tight">
            Inside the AI Architecture: MobileNetV2
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-6">
          Pre-trained on ImageNet millions of images, fine-tuned in Google Colab on Kaggle pothole datasets.
        </p>

        {/* 5-layer pipeline diagram */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs mb-6">
          <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 text-center">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 font-mono font-bold flex items-center justify-center mx-auto mb-2 text-xs">
              224²
            </div>
            <strong className="block text-slate-200">Input Photo</strong>
            <span className="text-slate-400 text-[11px]">224 × 224 pixels, RGB channels</span>
          </div>

          <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 text-center">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 font-mono font-bold flex items-center justify-center mx-auto mb-2 text-xs">
              Conv
            </div>
            <strong className="block text-slate-200">MobileNetV2</strong>
            <span className="text-slate-400 text-[11px]">Feature extractor (edges, cavities)</span>
          </div>

          <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 text-center">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 font-mono font-bold flex items-center justify-center mx-auto mb-2 text-xs">
              Pool
            </div>
            <strong className="block text-slate-200">Global Pooling</strong>
            <span className="text-slate-400 text-[11px]">Squeezes findings into summary vector</span>
          </div>

          <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 text-center">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 font-mono font-bold flex items-center justify-center mx-auto mb-2 text-xs">
              20%
            </div>
            <strong className="block text-slate-200">Dropout (0.2)</strong>
            <span className="text-slate-400 text-[11px]">Prevents memorization / overfitting</span>
          </div>

          <div className="bg-slate-800 p-4 rounded-2xl border border-amber-500 text-center">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono font-bold flex items-center justify-center mx-auto mb-2 text-xs">
              Sigmoid
            </div>
            <strong className="block text-amber-400">Dense (1 neuron)</strong>
            <span className="text-slate-400 text-[11px]">0.0 to 1.0 (Above 0.5 = Pothole)</span>
          </div>
        </div>

        {/* Severity Classification Rules */}
        <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 text-xs">
          <strong className="text-amber-400">PotholeIQ Severity Metric:</strong>
          <ul className="mt-2 space-y-1 text-slate-300 text-[11px]">
            <li>• <strong>Low Severity:</strong> Cavity area &lt; 5% of photo frame, shallow depth (&lt; 4 cm).</li>
            <li>• <strong>Medium Severity:</strong> Cavity area 5%–15%, depth 4–8 cm. Moderate vehicle damage risk.</li>
            <li>• <strong>Dangerous / Critical:</strong> Cavity area &gt; 15%, depth &gt; 8 cm. High two-wheeler crash hazard. Dispatches urgent priority alert.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
