import React, { useState } from 'react';
import { usePothole } from '../context/PotholeContext';
import {
  Play,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Camera,
  Cpu,
  MapPin,
  ShieldCheck,
  Wrench,
  Sparkles,
  RotateCcw
} from 'lucide-react';

interface GuidedDemoProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: 'report' | 'map' | 'complaints' | 'dashboard' | 'sdg') => void;
}

const DEMO_STEPS = [
  {
    step: 1,
    role: 'citizen',
    title: 'Citizen: Snap Road Photo',
    tab: 'report',
    instructions:
      'We begin as citizen Anand Verma. In the Report tab, choose one of the instant test photos (e.g. "Severe Crater") or take a photograph of damaged pavement.',
    highlight: 'Step 1: Add a photo'
  },
  {
    step: 2,
    role: 'citizen',
    title: 'Citizen: Run AI Inference',
    tab: 'report',
    instructions:
      'Click "Run AI check". Watch MobileNetV2 classify the image into "Pothole detected", compute confidence (e.g. 92%), and calculate damage severity (Dangerous). Note that normal roads will be rejected!',
    highlight: 'Step 2: Run AI Check'
  },
  {
    step: 3,
    role: 'citizen',
    title: 'Citizen: Select Location & Submit',
    tab: 'report',
    instructions:
      'Tap a sector on the map or click "Use My GPS". Notice duplicate check. Then click "Submit complaint". An automatic email is dispatched to the Municipal Office!',
    highlight: 'Submit complaint'
  },
  {
    step: 4,
    role: 'public',
    title: 'Public Map: New Complaint is a RED Pin',
    tab: 'map',
    instructions:
      'Navigate to the Public Map. The newly submitted pothole appears immediately as a RED PIN (Pending). Any citizen can tap it to inspect the audit card.',
    highlight: 'Public Map (Red Pin)'
  },
  {
    step: 5,
    role: 'officer',
    title: 'Municipal Officer: Assign to Engineer',
    tab: 'dashboard',
    instructions:
      'Switch to the Municipal Officer role. In the Officer Panel, click "Assign" next to the pending complaint, select Eng. Rajesh Kumar, set a deadline, and dispatch the work order.',
    highlight: 'Officer Panel: Assign Engineer'
  },
  {
    step: 6,
    role: 'engineer',
    title: 'Engineer: Start Repair',
    tab: 'dashboard',
    instructions:
      'Switch to the Engineer role (Eng. Rajesh Kumar). See the assigned work order with GPS coordinates. Click "Start Repair" to set status to In Progress (Amber pin).',
    highlight: 'Engineer: Start Repair'
  },
  {
    step: 7,
    role: 'engineer',
    title: 'Engineer: Upload Proof & Complete',
    tab: 'dashboard',
    instructions:
      'Once asphalt patching is done, click "Upload Proof & Finish", verify the repaired bitumen photograph and materials, and mark Completed!',
    highlight: 'Upload After Photo & Finish'
  },
  {
    step: 8,
    role: 'public',
    title: 'Public Map: Pin Turns GREEN & Audit Proof',
    tab: 'map',
    instructions:
      'Return to the Public Map. The pin has turned GREEN! Tap the pin to reveal the before-and-after photo comparison and verified municipal completion certificate.',
    highlight: 'Public Map (Green Pin) & SDG 11 Impact'
  }
];

export const GuidedDemoWalkthrough: React.FC<GuidedDemoProps> = ({
  isOpen,
  onClose,
  setActiveTab
}) => {
  const { switchRole } = usePothole();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = DEMO_STEPS[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < DEMO_STEPS.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      const next = DEMO_STEPS[nextIndex];
      switchRole(next.role as any);
      setActiveTab(next.tab as any);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      const prev = DEMO_STEPS[prevIndex];
      switchRole(prev.role as any);
      setActiveTab(prev.tab as any);
    }
  };

  const handleJumpToStep = (idx: number) => {
    setCurrentStepIndex(idx);
    const target = DEMO_STEPS[idx];
    switchRole(target.role as any);
    setActiveTab(target.tab as any);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-slate-900 text-white rounded-3xl p-5 shadow-2xl border border-amber-500/50 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs">
            {currentStep.step}
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Exhibition Guided Demo ({currentStepIndex + 1}/{DEMO_STEPS.length})
            </h4>
            <div className="text-sm font-extrabold text-white">
              {currentStep.title}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body instructions */}
      <div className="py-3 text-xs text-slate-300 leading-relaxed">
        {currentStep.instructions}
      </div>

      {/* Role and target highlight */}
      <div className="bg-slate-800/90 rounded-xl p-2.5 mb-3 flex items-center justify-between text-[11px] text-slate-300">
        <span>
          Acting Role: <strong className="text-amber-400 uppercase">{currentStep.role}</strong>
        </span>
        <span className="text-slate-400 font-mono">Tab: {currentStep.tab}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
        <button
          disabled={currentStepIndex === 0}
          onClick={handlePrev}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer ${
            currentStepIndex === 0
              ? 'opacity-30 cursor-not-allowed'
              : 'bg-slate-800 hover:bg-slate-700 text-white'
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <div className="flex gap-1">
          {DEMO_STEPS.map((s, idx) => (
            <button
              key={s.step}
              onClick={() => handleJumpToStep(idx)}
              className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                idx === currentStepIndex
                  ? 'bg-amber-400 w-4'
                  : 'bg-slate-700 hover:bg-slate-500'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>{currentStepIndex === DEMO_STEPS.length - 1 ? 'Finish' : 'Next'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
