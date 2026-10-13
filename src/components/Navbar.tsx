import React from 'react';
import { usePothole, DEMO_USERS } from '../context/PotholeContext';
import { UserRole } from '../types';
import {
  MapPin,
  ShieldCheck,
  Wrench,
  User,
  Eye,
  Play,
  Smartphone,
  Info,
  RotateCcw,
  SlidersHorizontal
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'report' | 'map' | 'complaints' | 'dashboard' | 'sdg';
  setActiveTab: (tab: 'report' | 'map' | 'complaints' | 'dashboard' | 'sdg') => void;
  onOpenDemo: () => void;
  onOpenAndroidGuide: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenDemo,
  onOpenAndroidGuide,
  onOpenAuth
}) => {
  const {
    currentUser,
    switchRole,
    resetSampleData,
    aiThreshold,
    setAiThreshold,
    isFirebaseActive,
    backendStatus,
    refreshBackend,
    isLoadingBackend
  } = usePothole();

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      {/* Top Banner: SDG 11 Branding & Role Fast-Switcher for College Presentation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 text-xs">
        {/* SDG 11 Badge, Firebase Status & Render Backend Status */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-[#E5A33D] text-slate-950 font-bold px-2 py-0.5 rounded text-[11px] tracking-wide flex items-center gap-1">
            <span>SDG 11</span>
          </div>
          <span className="text-slate-300 font-medium hidden sm:inline">
            Sustainable Cities and Communities
          </span>
          <span className="text-slate-500 hidden md:inline">·</span>
          {/* Honest Firebase status indicator */}
          <button
            onClick={onOpenAuth}
            className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide flex items-center gap-1 cursor-pointer transition-colors ${
              isFirebaseActive
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900'
                : 'bg-amber-950/80 text-amber-300 border border-amber-800/80 hover:bg-amber-900'
            }`}
            title="Click to view Firebase Auth configuration"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isFirebaseActive ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            ></span>
            <span>{isFirebaseActive ? 'Firebase: Live Cloud' : 'Firebase: Demo Mode'}</span>
          </button>

          {/* Render Backend Connection Status */}
          <button
            onClick={() => refreshBackend()}
            disabled={isLoadingBackend}
            className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide flex items-center gap-1 cursor-pointer transition-colors ${
              backendStatus.isConnected
                ? backendStatus.mode === 'render_direct'
                  ? 'bg-sky-950 text-sky-300 border border-sky-700 hover:bg-sky-900'
                  : 'bg-indigo-950 text-indigo-300 border border-indigo-700 hover:bg-indigo-900'
                : 'bg-amber-950 text-amber-300 border border-amber-800 hover:bg-amber-900'
            }`}
            title={`Backend Base: ${backendStatus.url}\nHealth: ${backendStatus.healthData?.status || 'Testing'}\nMode: ${backendStatus.mode}\nClick to re-ping /api/health`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isLoadingBackend
                  ? 'bg-amber-400 animate-pulse'
                  : backendStatus.isConnected
                  ? 'bg-sky-400'
                  : 'bg-amber-400'
              }`}
            ></span>
            <span>
              {isLoadingBackend
                ? 'Checking Backend...'
                : backendStatus.isConnected
                ? backendStatus.mode === 'render_direct'
                  ? 'Render Backend: Live'
                  : 'Backend: Connected'
                : 'Backend: Retrying'}
            </span>
          </button>
        </div>

        {/* Action Controls: Interactive Guided Demo & Role Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Demo Walkthrough Button */}
          <button
            onClick={onOpenDemo}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-2.5 py-1 rounded text-xs transition-colors shadow-sm cursor-pointer"
            title="Start live guided walkthrough for judges and exhibition"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Interactive Demo</span>
          </button>

          {/* Android Guide */}
          <button
            onClick={onOpenAndroidGuide}
            className="flex items-center gap-1 text-slate-300 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
            title="View Android Capacitor build instructions"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Android / Tech</span>
          </button>

          {/* Role Switcher Pill Container */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider px-2 font-mono hidden lg:inline">
              Role:
            </span>
            {(['citizen', 'officer', 'engineer', 'public'] as UserRole[]).map((role) => {
              const isActive = currentUser.role === role;
              const labels: Record<UserRole, string> = {
                citizen: 'Citizen',
                officer: 'Officer',
                engineer: 'Engineer',
                public: 'Public'
              };

              return (
                <button
                  key={role}
                  onClick={() => {
                    switchRole(role);
                    if (role === 'officer' || role === 'engineer') {
                      setActiveTab('dashboard');
                    } else if (role === 'citizen') {
                      setActiveTab('report');
                    }
                  }}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                >
                  {labels[role]}
                </button>
              );
            })}
          </div>

          {/* Reset Demo Data Button */}
          <button
            onClick={() => {
              if (confirm('Reset all pothole complaints to default demo state?')) {
                resetSampleData();
              }
            }}
            className="text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-colors"
            title="Reset complaints to initial sample state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          onClick={() => setActiveTab('map')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 shadow-md group-hover:scale-105 transition-transform">
            <MapPin className="w-6 h-6 fill-slate-950 stroke-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-white group-hover:text-amber-400 transition-colors">
                Pothole<span className="text-amber-400">IQ</span>
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700 font-mono">
                v1.2 AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Smart Road Monitoring Platform
            </p>
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('report')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'report'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-200 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Report
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'map'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-200 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Public Map
          </button>

          <button
            onClick={() => setActiveTab('complaints')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'complaints'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-200 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Complaints
          </button>

          {/* Role-Specific Dashboard Tab */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-200 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {currentUser.role === 'officer' && <ShieldCheck className="w-4 h-4" />}
            {currentUser.role === 'engineer' && <Wrench className="w-4 h-4" />}
            {currentUser.role === 'citizen' && <User className="w-4 h-4" />}
            {currentUser.role === 'public' && <Eye className="w-4 h-4" />}
            <span>
              {currentUser.role === 'officer'
                ? 'Officer Panel'
                : currentUser.role === 'engineer'
                ? 'Engineer Tasks'
                : currentUser.role === 'citizen'
                ? 'My Reports'
                : 'Portal'}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('sdg')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all hidden md:flex items-center gap-1 cursor-pointer ${
              activeTab === 'sdg'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-200 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>SDG 11 & AI</span>
          </button>
        </nav>

        {/* Current Active User Profile & Auth Trigger */}
        <button
          onClick={onOpenAuth}
          className="flex items-center gap-2.5 bg-slate-800/80 hover:bg-slate-800 pl-2 pr-3 py-1.5 rounded-xl border border-slate-700/80 transition-colors cursor-pointer group text-left"
          title="Click to sign in or manage Firebase user profile"
        >
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 group-hover:bg-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-xs transition-colors">
            {currentUser.name.charAt(0)}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-semibold text-slate-100 leading-tight truncate max-w-[130px]">
              {currentUser.name}
            </div>
            <div className="text-[10px] text-amber-400 capitalize leading-none font-medium">
              {currentUser.role} · Auth
            </div>
          </div>
        </button>
      </div>
    </header>
  );
};
