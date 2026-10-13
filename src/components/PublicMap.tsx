import React, { useState, useEffect, useRef } from 'react';
import { usePothole } from '../context/PotholeContext';
import { chennaiSampleComplaints } from './chennaiSampleComplaints';
import { Complaint, ComplaintStatus } from '../types';
import {
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  List,
  Layers,
  ChevronRight,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Eye
} from 'lucide-react';
import L from 'leaflet';

interface PublicMapProps {
  onSelectComplaint?: (complaint: Complaint) => void;
}

export const PublicMap: React.FC<PublicMapProps> = ({ onSelectComplaint }) => {
  const { complaints, calculateDaysIgnored, setSelectedComplaintId } = usePothole();

const mapComplaints =
  complaints.length > 0 ? complaints : chennaiSampleComplaints;
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [filterStatus, setFilterStatus] = useState<'All' | ComplaintStatus>('All');
  const [viewMode, setViewMode] = useState<'realMap' | 'stylizedGrid' | 'list'>('realMap');
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Filter complaints based on status
  const filteredComplaints = mapComplaints.filter((c) => {
    if (filterStatus === 'All') return true;
    return c.status === filterStatus;
  });

  // Create custom pin icons for Leaflet map
  const createPinIcon = (status: ComplaintStatus) => {
    const isCompleted = status === 'Completed';
    const isAssignedOrProgress = status === 'Assigned' || status === 'In Progress';
    
    const pinColor = isCompleted
      ? '#10b981' // Green
      : isAssignedOrProgress
      ? '#f59e0b' // Amber
      : '#ef4444'; // Red

    const svgHtml = `
      <div style="position: relative; width: 34px; height: 42px; transform: translate(-50%, -100%);">
        <svg viewBox="0 0 384 512" width="34" height="42" fill="${pinColor}" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35));">
          <path d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0z"/>
        </svg>
        <div style="position: absolute; top: 8px; left: 50%; transform: translateX(-50%); width: 14px; height: 14px; border-radius: 50%; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>
      </div>
    `;

    return L.divIcon({
      className: 'custom-pothole-pin',
      html: svgHtml,
      iconSize: [34, 42],
      iconAnchor: [17, 42]
    });
  };

  // Initialize or update Leaflet map
  useEffect(() => {
    if (viewMode !== 'realMap' || !mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [13.0827, 80.2707],
        zoom: 13,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | PotholeIQ'
      }).addTo(map);

      leafletMapRef.current = map;
    }

    const map = leafletMapRef.current;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add markers for complaints
    filteredComplaints.forEach((c) => {
      const marker = L.marker([c.latitude, c.longitude], {
        icon: createPinIcon(c.status)
      }).addTo(map);

      marker.on('click', () => {
        setSelectedComplaint(c);
        setSelectedComplaintId(c.id);
      });

      markersRef.current.push(marker);
    });

    // Auto-fit bounds only when complaint coordinates are available
if (filteredComplaints.length > 0) {
  const bounds = L.latLngBounds(
    filteredComplaints.map((c) => [c.latitude, c.longitude])
  );

  // Keep the map in Chennai if the complaints are far away
  const chennai = L.latLng(13.0827, 80.2707);

  if (bounds.getCenter().distanceTo(chennai) < 50000) {
    map.setView([13.0827, 80.2707], 12);
  } else {
    map.setView(chennai, 12);
  }
}

    return () => {
      // Keep map instance alive across filter toggles
    };
  }, [viewMode, filteredComplaints, complaints]);

  // Clean up Leaflet on unmount
  useEffect(() => {
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  const handleCardClick = (c: Complaint) => {
    setSelectedComplaint(c);
    setSelectedComplaintId(c.id);
    if (onSelectComplaint) onSelectComplaint(c);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
      {/* Map Header & Controls */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Public Repair Map</span>
              <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full border border-slate-200">
                SDG 11 Transparency
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Every complaint is tracked publicly. Pins turn from Red (Pending) to Green (Fixed).
            </p>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('realMap')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMode === 'realMap'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Live Map
            </button>
            <button
              onClick={() => setViewMode('stylizedGrid')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMode === 'stylizedGrid'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Demo City Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              List View
            </button>
          </div>
        </div>

        {/* Legend & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100 text-xs">
          {/* Legend */}
          <div className="flex items-center gap-4">
            <span className="text-slate-500 font-medium">Pin Legend:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm"></span>
              <span className="font-semibold text-slate-700">Red = Pending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm"></span>
              <span className="font-semibold text-slate-700">Amber = Assigned</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></span>
              <span className="font-semibold text-slate-700">Green = Fixed</span>
            </div>
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Filter:</span>
            {(['All', 'Pending', 'In Progress', 'Completed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  filterStatus === st
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Map Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map Canvas / Grid (Left 2 cols on desktop) */}
        <div className="lg:col-span-2">
          {viewMode === 'realMap' && (
            <div className="bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative h-[480px]">
              <div ref={mapContainerRef} className="w-full h-full z-10" />
              <div className="absolute top-3 right-3 z-20 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-medium text-slate-700 shadow-sm">
                Tap any marker to view public audit card
              </div>
            </div>
          )}

          {viewMode === 'stylizedGrid' && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500 mb-2 font-medium flex items-center justify-between">
                <span>City Sector Grid (Demonstration Presentation Layout)</span>
                <span>{filteredComplaints.length} markers plotted</span>
              </div>
              {/* Stylized schematic grid matching the video demo layout */}
              <div className="bg-slate-100 rounded-xl p-4 border border-slate-200/80 relative min-h-[420px] flex flex-col justify-between">
                {/* Simulated city blocks */}
                <div className="grid grid-cols-3 gap-4 h-[380px] w-full">
                  <div className="bg-slate-200/90 rounded-lg relative p-2 border border-slate-300/60 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Guindy Transit Hub
                    </span>
                  </div>
                  <div className="bg-emerald-100/90 rounded-lg relative p-2 border border-emerald-200 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
                      Mount Road
                    </span>
                  </div>
                  <div className="bg-slate-200/90 rounded-lg relative p-2 border border-slate-300/60 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Adyar Zone
                    </span>
                  </div>
                  <div className="bg-slate-200/90 rounded-lg relative p-2 border border-slate-300/60 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Metro Transit Hub
                    </span>
                  </div>
                  <div className="bg-slate-200/90 rounded-lg relative p-2 border border-slate-300/60 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Central Boulevard
                    </span>
                  </div>
                  <div className="bg-slate-200/90 rounded-lg relative p-2 border border-slate-300/60 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      South Highway
                    </span>
                  </div>
                </div>

                {/* Overlaid Pins based on complaint coordinates */}
                <div className="absolute inset-0 p-6 pointer-events-none">
                  {filteredComplaints.map((c, idx) => {
                    // Position pins spread out across the schematic canvas
                    const positions = [
                      { top: '22%', left: '26%' },
                      { top: '34%', left: '68%' },
                      { top: '64%', left: '46%' },
                      { top: '74%', left: '76%' },
                      { top: '48%', left: '56%' },
                      { top: '20%', left: '78%' }
                    ];
                    const pos = positions[idx % positions.length];
                    const isCompleted = c.status === 'Completed';
                    const isAssigned = c.status === 'Assigned' || c.status === 'In Progress';
                    const isSelected = selectedComplaint?.id === c.id;

                    return (
                      <button
                        key={c.id}
                        onClick={() => handleCardClick(c)}
                        style={{ top: pos.top, left: pos.left }}
                        className={`absolute pointer-events-auto transform -translate-x-1/2 -translate-y-full transition-transform hover:scale-125 focus:outline-none cursor-pointer group ${
                          isSelected ? 'scale-125 z-30' : 'z-20'
                        }`}
                      >
                        <div className="relative">
                          {isSelected && (
                            <span className="absolute -inset-2 rounded-full bg-amber-400/40 animate-ping"></span>
                          )}
                          <MapPin
                            className={`w-9 h-9 drop-shadow-md ${
                              isCompleted
                                ? 'fill-emerald-500 text-emerald-700'
                                : isAssigned
                                ? 'fill-amber-500 text-amber-700'
                                : 'fill-rose-500 text-rose-700'
                            }`}
                          />
                          <span className="absolute top-1.5 left-1/2 transform -translate-x-1/2 text-[10px] font-black text-white">
                            {c.id.replace('PIQ-', '#')}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {viewMode === 'list' && (
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Public Complaints Roster ({filteredComplaints.length})
              </div>
              {filteredComplaints.map((c) => {
                const days = calculateDaysIgnored(c);
                const isFixed = c.status === 'Completed';

                return (
                  <div
                    key={c.id}
                    onClick={() => handleCardClick(c)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      selectedComplaint?.id === c.id
                        ? 'bg-amber-50/70 border-amber-300 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={c.photoUrl}
                        alt="pothole thumbnail"
                        className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm">
                            {c.id}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              isFixed
                                ? 'bg-emerald-100 text-emerald-800'
                                : c.status === 'In Progress'
                                ? 'bg-blue-100 text-blue-800'
                                : c.status === 'Assigned'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {c.status}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                              c.estimatedSeverity === 'Dangerous'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {c.estimatedSeverity}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 truncate max-w-sm mt-0.5">
                          {c.address}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          AI confidence {(c.aiConfidence * 100).toFixed(0)}% · Ignored for {days} days
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Complaint Detail Panel (Right col) */}
        <div className="lg:col-span-1">
          {selectedComplaint ? (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm sticky top-24">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-slate-900">
                    {selectedComplaint.id}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold ${
                      selectedComplaint.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedComplaint.status === 'Assigned' ||
                          selectedComplaint.status === 'In Progress'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {selectedComplaint.status}
                  </span>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    selectedComplaint.estimatedSeverity === 'Dangerous'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {selectedComplaint.estimatedSeverity}
                </span>
              </div>

              {/* Before Photo */}
              <div className="relative rounded-xl overflow-hidden border border-slate-200 mb-3 bg-slate-900">
                <img
                  src={selectedComplaint.photoUrl}
                  alt="Original Pothole"
                  className="w-full h-44 object-cover"
                />
                <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  Reported Damage
                </div>
                <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-xs text-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded">
                  AI Confidence: {(selectedComplaint.aiConfidence * 100).toFixed(0)}%
                </div>
              </div>

              {/* If completed, show after photo preview */}
              {selectedComplaint.status === 'Completed' && selectedComplaint.afterPhotoUrl && (
                <div className="mb-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mb-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Verified Repair Proof Available</span>
                  </div>
                  <img
                    src={selectedComplaint.afterPhotoUrl}
                    alt="Repaired Asphalt"
                    className="w-full h-32 object-cover rounded-lg border border-emerald-300"
                  />
                  <div className="text-[11px] text-emerald-800 mt-2 line-clamp-2">
                    {selectedComplaint.repairNotes || 'Repaired with hot-mix asphalt and compacted.'}
                  </div>
                </div>
              )}

              {/* Metadata rows */}
              <div className="space-y-2 text-xs text-slate-600 pt-1 border-t border-slate-100">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-slate-800">
                      {selectedComplaint.address}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      GPS: {selectedComplaint.latitude.toFixed(4)}, {selectedComplaint.longitude.toFixed(4)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1 bg-slate-50 px-2.5 rounded-lg">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    Days Ignored:
                  </span>
                  <span className="font-bold text-slate-900 font-mono text-sm">
                    {calculateDaysIgnored(selectedComplaint)} days
                  </span>
                </div>

                {selectedComplaint.assignedEngineerName && (
                  <div className="flex items-center justify-between text-[11px] px-1">
                    <span className="text-slate-500">Assigned Engineer:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedComplaint.assignedEngineerName}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] px-1">
                  <span className="text-slate-500">Submitted:</span>
                  <span className="text-slate-700">
                    {new Date(selectedComplaint.submittedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* External Google Maps Button */}
              <a
                href={`https://www.google.com/maps?q=${selectedComplaint.latitude},${selectedComplaint.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Google Maps</span>
              </a>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl p-6 border border-dashed border-slate-300 text-center text-slate-500 text-xs">
              <MapPin className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No Pothole Selected</p>
              <p className="mt-1 text-slate-400">
                Click on any map pin or select from the list to view live citizen and municipal repair audit details.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
