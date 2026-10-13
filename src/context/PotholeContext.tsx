import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Complaint,
  UserProfile,
  UserRole,
  EngineerProfile,
  PriorityLevel,
  EmailNotificationLog
} from '../types';
import { INITIAL_COMPLAINTS, SAMPLE_ENGINEERS } from '../data/sampleComplaints';
import { emailService } from '../services/emailService';
import { isFirebaseConfigured } from '../firebase';
import { firebaseDataService } from '../services/firebaseService';
import { authService } from '../services/authService';

// Pre-defined demo users for quick role switching during exhibitions
export const DEMO_USERS: Record<UserRole, UserProfile> = {
  citizen: {
    id: 'cit-01',
    name: 'Anand Verma',
    email: 'anand.v@gmail.com',
    role: 'citizen',
    phone: '+91 98765 11223'
  },
  officer: {
    id: 'off-01',
    name: 'S. Ramesh (Ward Commissioner)',
    email: 'commissioner@smartcity.gov',
    role: 'officer',
    department: 'Municipal Corporation Roads Dept',
    ward: 'Central Division Wards 1-25'
  },
  engineer: {
    id: 'eng-1',
    name: 'Eng. Rajesh Kumar',
    email: 'rajesh.kumar@citycorp.gov',
    role: 'engineer',
    department: 'Roads & Asphalt Pavement Div',
    specialization: 'Hot-Mix Bitumen Resurfacing'
  },
  public: {
    id: 'pub-01',
    name: 'Citizen Observer',
    email: 'public@potholeiq.org',
    role: 'public'
  }
};

interface PotholeContextType {
  currentUser: UserProfile;
  userRole: UserRole;
  switchRole: (role: UserRole, specificEngineerId?: string) => void;
  complaints: Complaint[];
  engineers: EngineerProfile[];
  emailLogs: EmailNotificationLog[];
  aiThreshold: number;
  setAiThreshold: (threshold: number) => void;
  isFirebaseActive: boolean;

  // Authentication methods
  loginWithFirebase: (email: string, pass: string) => Promise<UserProfile>;
  registerWithFirebase: (
    email: string,
    pass: string,
    displayName: string,
    role?: UserRole,
    extra?: { ward?: string; department?: string; specialization?: string; phone?: string; staffCode?: string }
  ) => Promise<UserProfile>;
  logoutFirebase: () => Promise<void>;

  // Complaint Workflow Methods
  submitComplaint: (data: Omit<Complaint, 'id' | 'daysIgnored' | 'status' | 'submittedAt' | 'notificationStatus'>) => Promise<Complaint>;
  assignComplaint: (complaintId: string, engineerId: string, deadline: string, priority: PriorityLevel, notes?: string) => Promise<boolean>;
  startRepair: (complaintId: string) => Promise<boolean>;
  completeRepair: (complaintId: string, afterPhotoUrl: string, repairNotes: string, materialsUsed?: string) => Promise<boolean>;
  reopenComplaint: (complaintId: string) => Promise<boolean>;
  rejectComplaint: (complaintId: string, reason: string) => Promise<boolean>;

  // Calculations & Helpers
  calculateDaysIgnored: (complaint: Complaint) => number;
  checkNearbyDuplicates: (lat: number, lng: number, radiusMeters?: number) => Complaint[];
  resetSampleData: () => void;
  selectedComplaintId: string | null;
  setSelectedComplaintId: (id: string | null) => void;
  firestorePermissionWarning: boolean;
  dismissPermissionWarning: () => void;
  retryEmailNotification: (logId: string) => Promise<boolean>;
}

const PotholeContext = createContext<PotholeContextType | undefined>(undefined);

const STORAGE_KEY = 'potholeiq_complaints_v1';
const THRESHOLD_KEY = 'potholeiq_ai_threshold_v1';

export const PotholeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEMO_USERS.citizen);
  const [firestorePermissionWarning, setFirestorePermissionWarning] = useState<boolean>(false);
  const [aiThreshold, setAiThresholdState] = useState<number>(() => {
    const saved = localStorage.getItem(THRESHOLD_KEY);
    return saved ? parseFloat(saved) : 0.50;
  });
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [emailLogs, setEmailLogs] = useState<EmailNotificationLog[]>(() => emailService.getLogs());

  // Complaints state
  const [complaints, setComplaints] = useState<Complaint[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: Complaint[] = JSON.parse(saved);
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved complaints, using initial defaults', e);
    }
    return INITIAL_COMPLAINTS;
  });

  // Keep localStorage updated when in local/demo mode
  useEffect(() => {
    if (!isFirebaseConfigured) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
      } catch (e) {
        console.warn('Failed to save complaints to localStorage', e);
      }
    }
  }, [complaints]);

  // Real-time Firestore synchronization when Firebase is configured
  useEffect(() => {
    if (isFirebaseConfigured) {
      const unsubscribe = firebaseDataService.subscribeToComplaints(
        (remoteComplaints) => {
          if (remoteComplaints.length > 0) {
            setComplaints(remoteComplaints);
          }
          setFirestorePermissionWarning(false);
        },
        (err) => {
          // When remote rules block read access, keep existing complaints state intact and notify user
          setFirestorePermissionWarning(true);
        },
        currentUser?.role
      );

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [currentUser?.role]);

  // Firebase Auth state listener when configured
  useEffect(() => {
    if (isFirebaseConfigured) {
      const unsubscribe = authService.onAuthStateListener((user) => {
        if (user) {
          setCurrentUser(user);
        }
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, []);

  const setAiThreshold = (val: number) => {
    setAiThresholdState(val);
    localStorage.setItem(THRESHOLD_KEY, val.toString());
  };

  /**
   * Dynamically calculates days ignored.
   * If unresolved: Days between submittedAt and now.
   * If completed: Days between submittedAt and completedAt.
   */
  const calculateDaysIgnored = (complaint: Complaint): number => {
    const submitTime = new Date(complaint.submittedAt).getTime();
    const endTime = complaint.completedAt ? new Date(complaint.completedAt).getTime() : Date.now();
    const diffMs = Math.max(0, endTime - submitTime);
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  };

  /**
   * Distance calculation via Haversine formula
   */
  const checkNearbyDuplicates = (lat: number, lng: number, radiusMeters: number = 75): Complaint[] => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371e3; // Earth radius in meters

    return complaints.filter((c) => {
      if (c.status === 'Completed' || c.status === 'Rejected') return false;
      const dLat = toRad(c.latitude - lat);
      const dLng = toRad(c.longitude - lng);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat)) * Math.cos(toRad(c.latitude)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return d <= radiusMeters;
    });
  };

  /**
   * Switches active role (works in demo mode & presentation mode)
   */
  const switchRole = (role: UserRole, specificEngineerId?: string) => {
    if (role === 'engineer' && specificEngineerId) {
      const eng = SAMPLE_ENGINEERS.find((e) => e.id === specificEngineerId) || SAMPLE_ENGINEERS[0];
      setCurrentUser({
        id: eng.id,
        name: eng.name,
        email: eng.email,
        role: 'engineer',
        department: eng.department,
        specialization: eng.specialization
      });
    } else {
      setCurrentUser(DEMO_USERS[role]);
    }
  };

  /**
   * Sign In via Firebase Auth
   */
  const loginWithFirebase = async (email: string, pass: string): Promise<UserProfile> => {
    if (isFirebaseConfigured) {
      const profile = await authService.signIn(email, pass);
      setCurrentUser(profile);
      return profile;
    } else {
      // Demo authentication simulation
      const foundRole: UserRole = email.includes('commissioner') || email.includes('officer')
        ? 'officer'
        : email.includes('rajesh') || email.includes('engineer')
        ? 'engineer'
        : 'citizen';

      const demoUser: UserProfile = {
        id: `demo-${Date.now()}`,
        email,
        name: email.split('@')[0],
        role: foundRole
      };
      setCurrentUser(demoUser);
      return demoUser;
    }
  };

  /**
   * Register via Firebase Auth
   */
  const registerWithFirebase = async (
    email: string,
    pass: string,
    displayName: string,
    role: UserRole = 'citizen',
    extra?: { ward?: string; department?: string; specialization?: string; phone?: string; staffCode?: string }
  ): Promise<UserProfile> => {
    if (isFirebaseConfigured) {
      const profile = await authService.signUp(email, pass, displayName, role, extra);
      setCurrentUser(profile);
      return profile;
    } else {
      const demoUser: UserProfile = {
        id: `demo-${Date.now()}`,
        email,
        name: displayName,
        role,
        ward: extra?.ward,
        department: extra?.department,
        specialization: extra?.specialization,
        phone: extra?.phone
      };
      setCurrentUser(demoUser);
      return demoUser;
    }
  };

  /**
   * Sign out
   */
  const logoutFirebase = async () => {
    if (isFirebaseConfigured) {
      await authService.signOut();
    }
    setCurrentUser(DEMO_USERS.public);
  };

  /**
   * Citizen submits new complaint
   */
  const submitComplaint = async (
    data: Omit<Complaint, 'id' | 'daysIgnored' | 'status' | 'submittedAt' | 'notificationStatus'>
  ): Promise<Complaint> => {
    const nextNum = complaints.length + 101;
    const assignedId = `PIQ-${nextNum}`;

    // Delegate to Firestore & Storage service
    const createdComplaint = await firebaseDataService.createComplaintDoc(data, assignedId);

    // Dispatch municipal office email alert log
    await emailService.notifyMunicipalOfficeOnSubmission(createdComplaint);
    setEmailLogs(emailService.getLogs());

    if (!isFirebaseConfigured) {
      setComplaints((prev) => [createdComplaint, ...prev]);
    }

    return createdComplaint;
  };

  /**
   * Municipal officer assigns complaint to engineer
   */
  const assignComplaint = async (
    complaintId: string,
    engineerId: string,
    deadline: string,
    priority: PriorityLevel,
    notes?: string
  ): Promise<boolean> => {
    const engineer = SAMPLE_ENGINEERS.find((e) => e.id === engineerId);
    if (!engineer) return false;

    await firebaseDataService.assignComplaintDoc(complaintId, engineer, deadline, priority, notes);

    let targetComplaint: Complaint | null = null;
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id === complaintId) {
          const updated: Complaint = {
            ...c,
            status: 'Assigned',
            assignedEngineerId: engineer.id,
            assignedEngineerName: engineer.name,
            assignedEngineerEmail: engineer.email,
            assignedAt: new Date().toISOString(),
            repairDeadline: deadline,
            priority,
            officerNotes: notes
          };
          targetComplaint = updated;
          return updated;
        }
        return c;
      })
    );

    if (targetComplaint) {
      await emailService.notifyEngineerOnAssignment(
        targetComplaint,
        engineer.email,
        engineer.name,
        deadline
      );
      setEmailLogs(emailService.getLogs());
    }

    return true;
  };

  /**
   * Engineer starts repair work
   */
  const startRepair = async (complaintId: string): Promise<boolean> => {
    const target = complaints.find((c) => c.id === complaintId);
    if (!target) return false;

    // RBAC: Check assigned engineer permission
    if (currentUser.role === 'engineer' && target.assignedEngineerId && target.assignedEngineerId !== currentUser.id) {
      alert(`Access Restricted: This task is assigned to ${target.assignedEngineerName}. You cannot modify other engineers' work orders.`);
      return false;
    }

    await firebaseDataService.startRepairDoc(complaintId);

    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id === complaintId) {
          return {
            ...c,
            status: 'In Progress',
            repairStartedAt: new Date().toISOString()
          };
        }
        return c;
      })
    );
    return true;
  };

  /**
   * Engineer completes repair with after-photo
   */
  const completeRepair = async (
    complaintId: string,
    afterPhotoUrl: string,
    repairNotes: string,
    materialsUsed?: string
  ): Promise<boolean> => {
    const target = complaints.find((c) => c.id === complaintId);
    if (!target) return false;

    // RBAC check
    if (currentUser.role === 'engineer' && target.assignedEngineerId && target.assignedEngineerId !== currentUser.id) {
      alert(`Access Restricted: Only assigned engineer ${target.assignedEngineerName} can submit repair completion proof.`);
      return false;
    }

    const uploadedUrl = await firebaseDataService.completeRepairDoc(
      complaintId,
      afterPhotoUrl,
      repairNotes,
      materialsUsed
    );

    const now = new Date().toISOString();
    let updatedComplaint: Complaint | null = null;

    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id === complaintId) {
          const updated: Complaint = {
            ...c,
            status: 'Completed',
            completedAt: now,
            afterPhotoUrl: uploadedUrl,
            repairNotes,
            repairMaterialsUsed: materialsUsed,
            daysIgnored: Math.max(0, Math.floor((new Date(now).getTime() - new Date(c.submittedAt).getTime()) / 86400000))
          };
          updatedComplaint = updated;
          return updated;
        }
        return c;
      })
    );

    if (updatedComplaint) {
      await emailService.notifyCitizenOnCompletion(updatedComplaint);
      setEmailLogs(emailService.getLogs());
    }

    return true;
  };

  /**
   * Reopen complaint (Officer action)
   */
  const reopenComplaint = async (complaintId: string): Promise<boolean> => {
    await firebaseDataService.reopenComplaintDoc(complaintId);

    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id === complaintId) {
          return {
            ...c,
            status: 'Pending',
            completedAt: undefined,
            repairStartedAt: undefined
          };
        }
        return c;
      })
    );
    return true;
  };

  /**
   * Reject invalid report
   */
  const rejectComplaint = async (complaintId: string, reason: string): Promise<boolean> => {
    await firebaseDataService.updateComplaintDoc(complaintId, {
      status: 'Rejected',
      rejectionReason: reason
    });

    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id === complaintId) {
          return {
            ...c,
            status: 'Rejected',
            rejectionReason: reason
          };
        }
        return c;
      })
    );
    return true;
  };

  const resetSampleData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setComplaints(INITIAL_COMPLAINTS);
  };

  const retryEmailNotification = async (logId: string): Promise<boolean> => {
    const updated = await emailService.retryNotification(logId);
    setEmailLogs(emailService.getLogs());
    return updated?.status === 'sent';
  };

  return (
    <PotholeContext.Provider
      value={{
        currentUser,
        userRole: currentUser.role,
        switchRole,
        complaints,
        engineers: SAMPLE_ENGINEERS,
        emailLogs,
        aiThreshold,
        setAiThreshold,
        isFirebaseActive: isFirebaseConfigured,
        loginWithFirebase,
        registerWithFirebase,
        logoutFirebase,
        submitComplaint,
        assignComplaint,
        startRepair,
        completeRepair,
        reopenComplaint,
        rejectComplaint,
        calculateDaysIgnored,
        checkNearbyDuplicates,
        resetSampleData,
        retryEmailNotification,
        selectedComplaintId,
        setSelectedComplaintId,
        firestorePermissionWarning,
        dismissPermissionWarning: () => setFirestorePermissionWarning(false)
      }}
    >
      {children}
    </PotholeContext.Provider>
  );
};

export const usePothole = () => {
  const context = useContext(PotholeContext);
  if (!context) {
    throw new Error('usePothole must be used within a PotholeProvider');
  }
  return context;
};
