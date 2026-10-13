import React, { useState } from 'react';
import {
  Smartphone,
  X,
  Copy,
  Check,
  Terminal,
  Shield,
  Layers,
  Code2,
  FileCode
} from 'lucide-react';

interface AndroidGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidGuideModal: React.FC<AndroidGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const capacitorCommands = `npm install @capacitor/core @capacitor/cli @capacitor/camera @capacitor/geolocation
npx cap init PotholeIQ org.potholeiq.app --web-dir dist
npm run build
npx cap add android
npx cap sync
npx cap open android`;

  const androidManifestXml = `<!-- Add inside android/app/src/main/AndroidManifest.xml -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Internet Connectivity for Firebase sync & Public Map tiles -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- Camera Access for Pothole Snap & After-Repair Proof -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-feature android:name="android.hardware.camera" android:required="false" />

    <!-- GPS Geolocation for Accurate Pothole Pin Coordinates -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-feature android:name="android.hardware.location.gps" android:required="false" />
</manifest>`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6">
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Android Packaging & Mobile Deployment Guide
              </h3>
              <p className="text-xs text-slate-400">
                Turn PotholeIQ into a native Android APK using Capacitor and Android Studio
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs text-slate-700">
          {/* Section 1: Quick commands */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                <Terminal className="w-4 h-4 text-amber-600" />
                <span>1. Capacitor CLI Commands</span>
              </span>
              <button
                onClick={() => handleCopy(capacitorCommands, 'cmd')}
                className="text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
              >
                {copiedSection === 'cmd' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSection === 'cmd' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="bg-slate-900 text-amber-300 p-3.5 rounded-xl overflow-x-auto font-mono text-[11px] leading-relaxed">
              {capacitorCommands}
            </pre>
          </div>

          {/* Section 2: AndroidManifest Permissions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>2. Android Hardware Permissions (`AndroidManifest.xml`)</span>
              </span>
              <button
                onClick={() => handleCopy(androidManifestXml, 'xml')}
                className="text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
              >
                {copiedSection === 'xml' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSection === 'xml' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="bg-slate-900 text-slate-200 p-3.5 rounded-xl overflow-x-auto font-mono text-[11px] leading-relaxed">
              {androidManifestXml}
            </pre>
          </div>

          {/* Section 3: Offline AI Inference vs Cloud Synchronization */}
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 space-y-1.5 text-amber-950">
            <h4 className="font-bold text-xs flex items-center gap-1.5 text-amber-900">
              <span>Offline Architecture Note (SDG College Evaluation):</span>
            </h4>
            <p className="text-[11px] leading-relaxed">
              <strong>Offline AI Inference:</strong> The MobileNetV2 edge pipeline operates 100% locally on the device (via browser canvas tensor processing or converted `pothole.tflite`). No internet connection is needed for a citizen to photograph and test a road.
            </p>
            <p className="text-[11px] leading-relaxed">
              <strong>Cloud Sync:</strong> When connectivity is restored, the complaint record, high-resolution photo, and GPS coordinate payload are synchronized to Firebase Firestore & Storage.
            </p>
          </div>

          {/* Section 4: Testing on Physical Android Phone */}
          <div>
            <h4 className="font-bold text-slate-900 mb-1.5 text-sm">
              3. Testing on a Physical Android Smartphone:
            </h4>
            <ol className="list-decimal pl-4 space-y-1 text-slate-600">
              <li>Enable <strong>Developer Options</strong> on Android phone (tap Build Number 7 times).</li>
              <li>Enable <strong>USB Debugging</strong>.</li>
              <li>Connect phone via USB cable and select device target in Android Studio.</li>
              <li>Click <strong>Run &lsquo;app&rsquo;</strong> to install the APK directly on the physical phone.</li>
              <li>When prompted by Android OS, allow <strong>Camera</strong> and <strong>Precise Location</strong>.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
