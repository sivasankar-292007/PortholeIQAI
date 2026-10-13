import React, { useState } from 'react';
import { PotholeProvider, usePothole } from './context/PotholeContext';
import { Navbar } from './components/Navbar';
import { StatsBar } from './components/StatsBar';
import { PublicMap } from './components/PublicMap';
import { ReportPothole } from './components/ReportPothole';
import { ComplaintsList } from './components/ComplaintsList';
import { OfficerDashboard } from './components/OfficerDashboard';
import { EngineerDashboard } from './components/EngineerDashboard';
import { ComplaintDetailModal } from './components/ComplaintDetailModal';
import { SDGImpactView } from './components/SDGImpactView';
import { GuidedDemoWalkthrough } from './components/GuidedDemoWalkthrough';
import { AndroidGuideModal } from './components/AndroidGuideModal';
import { AuthModal } from './components/AuthModal';
import { FirestoreRulesNotice } from './components/FirestoreRulesNotice';
import { Complaint } from './types';
import {
  MapPin,
  Camera,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Wrench,
  User,
  Heart,
  ExternalLink
} from 'lucide-react';

function MainApp() {
  const { currentUser, complaints } = usePothole();

  const [activeTab, setActiveTab] = useState<'report' | 'map' | 'complaints' | 'dashboard' | 'sdg'>('report');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState<boolean>(false);
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const handleSelectComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
  };

  const handleReportSuccess = (complaintId: string) => {
    // Switch to map view to show the new Red pin!
    setActiveTab('map');
    const created = complaints.find((c) => c.id === complaintId);
    if (created) {
      setSelectedComplaint(created);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans antialiased selection:bg-amber-400 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDemo={() => setIsDemoModalOpen(true)}
        onOpenAndroidGuide={() => setIsAndroidModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Firestore Permissions Notification Banner if remote rules need updating */}
      <FirestoreRulesNotice />

      {/* KPI Stats Bar (matching video demo top numbers) */}
      <StatsBar />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'report' && (
          <ReportPothole onSuccess={handleReportSuccess} />
        )}

        {activeTab === 'map' && (
          <PublicMap onSelectComplaint={handleSelectComplaint} />
        )}

        {activeTab === 'complaints' && (
          <ComplaintsList onSelectComplaint={handleSelectComplaint} />
        )}

        {activeTab === 'dashboard' && (
          <div>
            {currentUser.role === 'officer' && (
              <OfficerDashboard onSelectComplaint={handleSelectComplaint} />
            )}

            {currentUser.role === 'engineer' && (
              <EngineerDashboard onSelectComplaint={handleSelectComplaint} />
            )}

            {currentUser.role === 'citizen' && (
              <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-900">
                        My Citizen Reports: {currentUser.name}
                      </h2>
                      <p className="text-xs text-slate-500">
                        Track your submitted road damage complaints and verified municipal repairs.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('report')}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Report New Pothole
                  </button>
                </div>
                <ComplaintsList onSelectComplaint={handleSelectComplaint} />
              </div>
            )}

            {currentUser.role === 'public' && (
              <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Public Road Maintenance Transparency Portal
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Every road repair in our municipality is logged with before-and-after photographic evidence and days-ignored tracking under SDG 11.
                  </p>
                </div>
                <ComplaintsList onSelectComplaint={handleSelectComplaint} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'sdg' && <SDGImpactView />}
      </main>

      {/* Detail / Audit Modal */}
      <ComplaintDetailModal
        complaint={selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
      />

      {/* Guided Walkthrough Floating Controller for College Exhibition */}
      <GuidedDemoWalkthrough
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        setActiveTab={setActiveTab}
      />

      {/* Android Packaging & Deployment Guide Modal */}
      <AndroidGuideModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
      />

      {/* Firebase Authentication & RBAC Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Footer matching Poster footer: "PotholeIQ — Safer Roads | Stronger Communities" */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 tracking-tight">
              Pothole<span className="text-amber-500">IQ</span>
            </span>
            <span>—</span>
            <span className="font-semibold text-slate-700">
              Safer Roads | Stronger Communities
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <button
              onClick={() => setActiveTab('sdg')}
              className="hover:text-slate-900 transition-colors cursor-pointer font-medium"
            >
              SDG 11 Impact
            </button>
            <button
              onClick={() => setIsAndroidModalOpen(true)}
              className="hover:text-slate-900 transition-colors cursor-pointer font-medium"
            >
              Capacitor Android Build
            </button>
            <span className="text-slate-300">|</span>
            <span>College Project Exhibition Edition</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <PotholeProvider>
      <MainApp />
    </PotholeProvider>
  );
}
