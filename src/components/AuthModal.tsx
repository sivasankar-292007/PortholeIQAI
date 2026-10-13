import React, { useState } from 'react';
import { usePothole } from '../context/PotholeContext';
import { UserRole } from '../types';
import {
  X,
  Lock,
  Mail,
  User,
  ShieldCheck,
  Wrench,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Database,
  ExternalLink
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    isFirebaseActive,
    loginWithFirebase,
    registerWithFirebase,
    logoutFirebase,
    switchRole
  } = usePothole();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('citizen');
  const [deptOrWard, setDeptOrWard] = useState('');
  const [phone, setPhone] = useState('');
  const [staffCode, setStaffCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (mode === 'login') {
        await loginWithFirebase(email, password);
        setSuccessMsg('Successfully logged in!');
        setTimeout(() => onClose(), 1000);
      } else {
        await registerWithFirebase(email, password, displayName, role, {
          ward: role === 'citizen' ? deptOrWard : undefined,
          department: role !== 'citizen' ? deptOrWard : undefined,
          phone,
          staffCode: role !== 'citizen' ? staffCode : undefined
        });
        setSuccessMsg('Account registered and profile created in Cloud Firestore!');
        setTimeout(() => onClose(), 1200);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoFill = (selectedRole: UserRole) => {
    if (selectedRole === 'citizen') {
      setEmail('anand.v@gmail.com');
      setPassword('CitizenPass123!');
      setDisplayName('Anand Verma');
      setRole('citizen');
    } else if (selectedRole === 'officer') {
      setEmail('commissioner@smartcity.gov');
      setPassword('OfficerPass123!');
      setDisplayName('S. Ramesh (Ward Commissioner)');
      setRole('officer');
    } else if (selectedRole === 'engineer') {
      setEmail('rajesh.kumar@citycorp.gov');
      setPassword('EngineerPass123!');
      setDisplayName('Eng. Rajesh Kumar');
      setRole('engineer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Firebase Authentication & RBAC</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Secure role-based sign-in for Citizens, Officers & Engineers
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Honest Firebase Status Banner */}
          <div
            className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 ${
              isFirebaseActive
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}
          >
            <Database className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
            <div>
              <div className="font-bold flex items-center gap-1.5">
                <span>Firebase Connection:</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-black uppercase ${
                    isFirebaseActive
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-600 text-white'
                  }`}
                >
                  {isFirebaseActive ? 'Live Cloud Connected' : 'Exhibition Demo Mode'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                {isFirebaseActive
                  ? 'Cloud Firestore & Firebase Auth are active. Users authenticate against your live Firebase project.'
                  : 'Firebase API keys are currently unset in .env. The app is running in resilient local demo mode with in-memory role switching.'}
              </p>
            </div>
          </div>

          {/* Current Logged In Profile */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
            <div>
              <span className="text-slate-500 text-[11px] block">Current User Profile:</span>
              <strong className="text-slate-900">{currentUser.name}</strong>
              <span className="text-slate-500 block text-[11px]">{currentUser.email}</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
              {currentUser.role}
            </span>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Register Account
            </button>
          </div>

          {/* Quick Demo Pre-fill shortcuts */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Quick Test Credentials:
            </span>
            <div className="flex gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickDemoFill('citizen')}
                className="flex-1 py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
              >
                Citizen
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoFill('officer')}
                className="flex-1 py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
              >
                Officer
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoFill('engineer')}
                className="flex-1 py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
              >
                Engineer
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Anand Verma"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Ward Number / Locality (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ward 15 East or Central"
                    value={deptOrWard}
                    onChange={(e) => setDeptOrWard(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Public accounts are registered as <strong>Citizen</strong>. Municipal Officer and Engineer privileges are granted by municipal administrators in Cloud Firestore.
                  </span>
                </div>
              </>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@smartcity.gov or email@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{mode === 'login' ? 'Sign In to Account' : 'Register Account'}</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
