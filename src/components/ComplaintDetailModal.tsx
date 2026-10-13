import React, { useState } from 'react';
import { Complaint } from '../types';
import { usePothole } from '../context/PotholeContext';
import {
  X,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Wrench,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';

interface ComplaintDetailModalProps {
  complaint: Complaint | null;
  onClose: () => void;
}

export const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({
  complaint,
  onClose
}) => {
  const { calculateDaysIgnored } = usePothole();
  const [activePhotoTab, setActivePhotoTab] = useState<'sideBySide' | 'slider' | 'before' | 'after'>('sideBySide');
  const [sliderPos, setSliderPos] = useState<number>(50);

  if (!complaint) return null;

  const days = calculateDaysIgnored(complaint);
  const isFixed = complaint.status === 'Completed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black text-amber-400">
              {complaint.id}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isFixed
                  ? 'bg-emerald-500 text-white'
                  : complaint.status === 'In Progress'
                  ? 'bg-blue-500 text-white'
                  : complaint.status === 'Assigned'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-rose-500 text-white'
              }`}
            >
              {complaint.status}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded font-semibold ${
                complaint.estimatedSeverity === 'Dangerous'
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}
            >
              Severity: {complaint.estimatedSeverity}
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Photo Section: Before and After Comparison if Fixed */}
          {isFixed && complaint.afterPhotoUrl ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Before & After Road Repair Audit</span>
                </span>
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
                  <button
                    onClick={() => setActivePhotoTab('sideBySide')}
                    className={`px-2 py-1 rounded font-semibold transition-all cursor-pointer ${
                      activePhotoTab === 'sideBySide'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600'
                    }`}
                  >
                    Side by Side
                  </button>
                  <button
                    onClick={() => setActivePhotoTab('slider')}
                    className={`px-2 py-1 rounded font-semibold transition-all cursor-pointer ${
                      activePhotoTab === 'slider'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600'
                    }`}
                  >
                    Interactive Slider
                  </button>
                </div>
              </div>

              {activePhotoTab === 'sideBySide' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900">
                    <img
                      src={complaint.photoUrl}
                      alt="Before"
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      BEFORE (Reported Pothole)
                    </div>
                  </div>
                  <div className="relative rounded-2xl overflow-hidden border border-emerald-300 bg-slate-900">
                    <img
                      src={complaint.afterPhotoUrl}
                      alt="After"
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      AFTER (Repaired Bitumen)
                    </div>
                  </div>
                </div>
              )}

              {activePhotoTab === 'slider' && (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 h-56 select-none">
                  {/* After photo (background) */}
                  <img
                    src={complaint.afterPhotoUrl}
                    alt="After"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {/* Before photo (clipped by slider) */}
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${sliderPos}%` }}
                  >
                    <img
                      src={complaint.photoUrl}
                      alt="Before"
                      className="absolute inset-0 w-full h-full object-cover max-w-none"
                      style={{ width: '100%', height: '100%' }}
                    />
                  </div>

                  {/* Vertical separator line */}
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-xl cursor-ew-resize pointer-events-none"
                    style={{ left: `${sliderPos}%` }}
                  >
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center text-[10px] font-bold text-slate-800">
                      ↔
                    </div>
                  </div>

                  {/* Range slider input overlay */}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderPos}
                    onChange={(e) => setSliderPos(parseFloat(e.target.value))}
                    className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-10"
                  />

                  <div className="absolute bottom-2 left-2 bg-rose-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    Before
                  </div>
                  <div className="absolute bottom-2 right-2 bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    After
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900">
              <img
                src={complaint.photoUrl}
                alt="Reported Road Damage"
                className="w-full h-60 object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-amber-300 text-xs font-semibold px-2.5 py-1 rounded">
                AI Confidence: {(complaint.aiConfidence * 100).toFixed(0)}% · Damage Coverage: {complaint.boxCoveragePercent}%
              </div>
            </div>
          )}

          {/* AI Inspection Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>MobileNetV2 Edge Tensor Assessment</span>
              </span>
              <span className="text-slate-500 font-mono">
                Input: 224×224 RGB
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
              <div className="bg-white p-2 rounded-xl border border-slate-200">
                <div className="text-slate-400 text-[10px]">Predicted Class</div>
                <div className="font-bold text-slate-900 uppercase">
                  {complaint.aiPrediction}
                </div>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200">
                <div className="text-slate-400 text-[10px]">Confidence</div>
                <div className="font-bold text-emerald-600">
                  {(complaint.aiConfidence * 100).toFixed(0)}%
                </div>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200">
                <div className="text-slate-400 text-[10px]">Est. Depth</div>
                <div className="font-bold text-slate-900">
                  {complaint.aiDetails?.estimatedDepthCm || 8.5} cm
                </div>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200">
                <div className="text-slate-400 text-[10px]">Area Coverage</div>
                <div className="font-bold text-slate-900">
                  {complaint.boxCoveragePercent}%
                </div>
              </div>
            </div>
          </div>

          {/* Location & Public Tracking */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-500" />
                <span>Location Coordinates</span>
              </div>
              <div className="text-slate-700 font-medium">
                {complaint.address}
              </div>
              <div className="text-slate-400 font-mono text-[11px]">
                Latitude: {complaint.latitude.toFixed(5)}
                <br />
                Longitude: {complaint.longitude.toFixed(5)}
              </div>
              <a
                href={`https://www.google.com/maps?q=${complaint.latitude},${complaint.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-amber-600 font-semibold hover:underline pt-1 text-[11px]"
              >
                <span>View on Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Days-Ignored Tracker</span>
              </div>
              <div className="text-2xl font-black text-amber-600 font-mono">
                {days} days
              </div>
              <div className="text-slate-500 text-[11px]">
                {isFixed
                  ? 'Resolved and locked on public ledger'
                  : 'Time elapsed since citizen photograph submission'}
              </div>
              <div className="text-[11px] text-slate-400">
                Reporter: {complaint.reporterName || 'Verified Citizen (Identity Protected)'}
              </div>
            </div>
          </div>

          {/* Engineering Repair Report if completed */}
          {complaint.repairNotes && (
            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 text-xs space-y-2">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-emerald-700" />
                <span>Municipal Repair Completion Report</span>
              </div>
              <div className="text-emerald-800">
                <strong>Description:</strong> {complaint.repairNotes}
              </div>
              {complaint.repairMaterialsUsed && (
                <div className="text-emerald-700 text-[11px]">
                  <strong>Materials:</strong> {complaint.repairMaterialsUsed}
                </div>
              )}
              {complaint.assignedEngineerName && (
                <div className="text-emerald-700 text-[11px]">
                  <strong>Certified by:</strong> {complaint.assignedEngineerName}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
