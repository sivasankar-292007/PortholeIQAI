import React, { useState } from 'react';
import { usePothole } from '../context/PotholeContext';
import { AlertTriangle, Copy, Check, ExternalLink, X, ShieldAlert } from 'lucide-react';

export const FirestoreRulesNotice: React.FC = () => {
  const { firestorePermissionWarning, dismissPermissionWarning } = usePothole();
  const [copied, setCopied] = useState(false);

  if (!firestorePermissionWarning) return null;

  const quickRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() { return request.auth != null; }
    function userDocExists() { return exists(/databases/$(database)/documents/users/$(request.auth.uid)); }
    function getUserData() { return get(/databases/$(database)/documents/users/$(request.auth.uid)).data; }
    function isRole(targetRole) { return isAuthenticated() && userDocExists() && getUserData().role == targetRole; }
    function isMunicipalOfficer() { return isRole('officer'); }
    function isEngineer() { return isRole('engineer'); }

    function isAssignedEngineerForReport(reportId) {
      let isPothole = exists(/databases/$(database)/documents/potholes/$(reportId));
      let isComplaint = exists(/databases/$(database)/documents/complaints/$(reportId));
      return isEngineer() && (
        (isPothole && get(/databases/$(database)/documents/potholes/$(reportId)).data.assignedEngineerId == request.auth.uid) ||
        (isComplaint && get(/databases/$(database)/documents/complaints/$(reportId)).data.assignedEngineerId == request.auth.uid)
      );
    }

    match /users/{userId} {
      allow read: if isAuthenticated() && (request.auth.uid == userId || isMunicipalOfficer());
      allow create: if isAuthenticated() && request.auth.uid == userId && request.resource.data.role == 'citizen';
      allow update: if isAuthenticated() && (
        (request.auth.uid == userId && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role'])) ||
        isMunicipalOfficer()
      );
      allow delete: if isMunicipalOfficer();
    }

    match /publicPotholes/{potholeId} {
      allow read: if true;
      allow create: if isAuthenticated() && request.resource.data.status == 'Pending' &&
        request.resource.data.latitude is number && request.resource.data.longitude is number &&
        !('reporterId' in request.resource.data) && !('reporterEmail' in request.resource.data) && !('officerNotes' in request.resource.data);
      allow update: if isAuthenticated() && (
        isMunicipalOfficer() ||
        (isAssignedEngineerForReport(potholeId) && request.resource.data.status in ['In Progress', 'Completed'] &&
         request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'repairStartedAt', 'afterPhotoUrl', 'repairNotes', 'repairMaterialsUsed', 'completedAt', 'updatedAt']))
      );
      allow delete: if isMunicipalOfficer();
    }

    match /publicComplaints/{complaintId} {
      allow read: if true;
      allow create: if isAuthenticated() && request.resource.data.status == 'Pending';
      allow update: if isAuthenticated() && (isMunicipalOfficer() || isAssignedEngineerForReport(complaintId));
      allow delete: if isMunicipalOfficer();
    }

    match /potholes/{potholeId} {
      allow read: if isAuthenticated() && (
        resource.data.reporterId == request.auth.uid || isMunicipalOfficer() ||
        (isEngineer() && resource.data.assignedEngineerId == request.auth.uid)
      );
      allow create: if isAuthenticated() && request.resource.data.reporterId == request.auth.uid && request.resource.data.status == 'Pending';
      allow update: if isAuthenticated() && (
        (isMunicipalOfficer() && request.resource.data.reporterId == resource.data.reporterId) ||
        (isEngineer() && resource.data.assignedEngineerId == request.auth.uid && request.resource.data.status in ['In Progress', 'Completed'] &&
         request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'repairStartedAt', 'afterPhotoUrl', 'repairNotes', 'repairMaterialsUsed', 'completedAt', 'updatedAt']))
      );
      allow delete: if isMunicipalOfficer();
    }

    match /complaints/{complaintId} {
      allow read: if isAuthenticated() && (
        resource.data.reporterId == request.auth.uid || isMunicipalOfficer() ||
        (isEngineer() && resource.data.assignedEngineerId == request.auth.uid)
      );
      allow create: if isAuthenticated() && request.resource.data.reporterId == request.auth.uid;
      allow update: if isAuthenticated() && (
        isMunicipalOfficer() ||
        (isEngineer() && resource.data.assignedEngineerId == request.auth.uid &&
         request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'repairStartedAt', 'afterPhotoUrl', 'repairNotes', 'repairMaterialsUsed', 'completedAt', 'updatedAt']))
      );
      allow delete: if isMunicipalOfficer();
    }

    match /notifications/{notificationId} {
      allow read: if isAuthenticated() && (resource.data.recipientId == request.auth.uid || isMunicipalOfficer());
      allow create: if isAuthenticated() &&
        request.resource.data.recipientId is string && request.resource.data.recipientId.size() > 0 &&
        exists(/databases/$(database)/documents/users/$(request.resource.data.recipientId)) &&
        request.resource.data.senderId == request.auth.uid &&
        request.resource.data.read == false;
      allow update: if isAuthenticated() && resource.data.recipientId == request.auth.uid &&
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read']);
      allow delete: if isAuthenticated() && (resource.data.recipientId == request.auth.uid || isMunicipalOfficer());
    }

    match /mail/{mailId} {
      allow read: if isMunicipalOfficer();
      allow create: if isMunicipalOfficer();
      allow update, delete: if false;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(quickRules);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-amber-500 text-slate-950 px-4 py-2.5 border-b border-amber-600 shadow-sm text-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          <ShieldAlert className="w-5 h-5 text-slate-950 shrink-0" />
          <div>
            <span className="font-extrabold text-slate-950 mr-1.5">
              Firebase Connected · Action Required in Firebase Console:
            </span>
            <span className="text-slate-900 font-medium">
              Firestore returned <em>&quot;Missing or insufficient permissions&quot;</em>. Paste public read rules into your Firebase Console to enable live cloud syncing.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopy}
            className="bg-slate-950 hover:bg-slate-800 text-white font-bold px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer text-[11px]"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Rules Copied!' : 'Copy Firestore Rules'}</span>
          </button>

          <a
            href="https://console.firebase.google.com/project/potholeiq/firestore/rules"
            target="_blank"
            rel="noreferrer"
            className="bg-white/80 hover:bg-white text-slate-950 font-bold px-3 py-1 rounded-lg flex items-center gap-1 transition-colors text-[11px]"
          >
            <span>Open Firebase Rules</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            onClick={dismissPermissionWarning}
            className="text-slate-900 hover:text-slate-950 p-1 rounded hover:bg-amber-600/30 transition-colors cursor-pointer"
            title="Dismiss notice (local cache remains active)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
