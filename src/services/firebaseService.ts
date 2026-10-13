import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  writeBatch,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Unsubscribe
} from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from '../firebase';
import {
  Complaint,
  UserProfile,
  PriorityLevel,
  EngineerProfile,
  UserRole,
  InAppNotification
} from '../types';

export const POTHOLES_COLLECTION = 'potholes';
export const PUBLIC_POTHOLES_COLLECTION = 'publicPotholes';
export const COMPLAINTS_COLLECTION = 'complaints';
export const NOTIFICATIONS_COLLECTION = 'notifications';

/**
 * Service providing typed Firestore database operations for PotholeIQ.
 * Implements a secure dual-model architecture:
 * 1. /publicPotholes: Sanitized public summary for the map (NO reporterId, NO personal details, NO officer notes)
 * 2. /potholes: Authoritative internal record with restricted access (Officer, Engineer, Reporter only)
 */
export class FirebaseDataService {
  /**
   * Subscribes to real-time reports based on user role:
   * - Public visitors / Citizens: Read strictly from 'publicPotholes' (sanitized, zero PII)
   * - Municipal Officers: Read from authoritative 'potholes' (includes internal notes and reporter info)
   */
  subscribeToComplaints(
    onData: (complaints: Complaint[]) => void,
    onError?: (error: any) => void,
    userRole?: UserRole
  ): Unsubscribe | null {
    if (!isFirebaseConfigured || !db) {
      return null;
    }

    try {
      // If user is a verified Municipal Officer, subscribe to internal records
      if (userRole === 'officer') {
        const officerQuery = query(collection(db, POTHOLES_COLLECTION));
        return onSnapshot(
          officerQuery,
          (snapshot) => {
            const list: Complaint[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              list.push({
                ...(data as any),
                id: docSnap.id
              });
            });

            list.sort((a, b) => {
              const timeA = new Date(a.submittedAt || 0).getTime();
              const timeB = new Date(b.submittedAt || 0).getTime();
              return timeB - timeA;
            });

            onData(list);
          },
          (err: any) => {
            console.warn('[PotholeIQ] Officer listener fallback to public summary:', err.message || err);
            // Fallback to public summary if officer collection is inaccessible
            this.subscribePublicSummaries(onData, onError);
          }
        );
      }

      // Default: Public visitors, citizens, and unauthenticated map view
      return this.subscribePublicSummaries(onData, onError);
    } catch (err: any) {
      console.warn('[PotholeIQ] Failed to initialize complaints listener:', err);
      if (onError) onError(err);
      return null;
    }
  }

  /**
   * Subscribes strictly to sanitized public summary collection (publicPotholes).
   * Safe for unauthenticated visitors and public map pins.
   */
  private subscribePublicSummaries(
    onData: (complaints: Complaint[]) => void,
    onError?: (error: any) => void
  ): Unsubscribe | null {
    if (!db) return null;

    try {
      const q = query(collection(db, PUBLIC_POTHOLES_COLLECTION));
      return onSnapshot(
        q,
        (snapshot) => {
          const list: Complaint[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            list.push({
              ...(data as any),
              id: docSnap.id
            });
          });

          list.sort((a, b) => {
            const timeA = new Date(a.submittedAt || 0).getTime();
            const timeB = new Date(b.submittedAt || 0).getTime();
            return timeB - timeA;
          });

          onData(list);
        },
        (err: any) => {
          if (err.code === 'permission-denied' || err.message?.includes('permission')) {
            console.warn(
              '[PotholeIQ] Firestore rules notice: Public summary collection read error.'
            );
          }
          if (onError) onError(err);
        }
      );
    } catch (err: any) {
      if (onError) onError(err);
      return null;
    }
  }

  /**
   * Creates a new complaint document in Cloud Firestore.
   * 1. Writes full authoritative record to /potholes (includes reporterId, contact, notes)
   * 2. Writes sanitized public summary to /publicPotholes (STRICTLY OMITS reporterId, email, notes)
   */
  async createComplaintDoc(
    complaintData: Omit<Complaint, 'id' | 'daysIgnored' | 'status' | 'submittedAt' | 'notificationStatus'>,
    customId?: string
  ): Promise<Complaint> {
    const nextId = customId || `PTQ-${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString();
    const effectiveReporterId = auth?.currentUser?.uid || complaintData.reporterId;

    const fullComplaint: Complaint = {
      ...complaintData,
      reporterId: effectiveReporterId,
      id: nextId,
      submittedAt: now,
      status: 'Pending',
      daysIgnored: 0,
      notificationStatus: 'sent'
    };

    if (isFirebaseConfigured && db) {
      try {
        const batch = writeBatch(db);

        // 1. Authoritative internal document (restricted to author, officers, assigned engineer)
        const docRef = doc(db, POTHOLES_COLLECTION, nextId);
        batch.set(docRef, {
          ...fullComplaint,
          serverTimestamp: serverTimestamp()
        });

        // 2. Sanitized Public Summary (STRICTLY OMITS reporterId, reporterEmail, reporterName, officerNotes)
        const publicDocRef = doc(db, PUBLIC_POTHOLES_COLLECTION, nextId);
        const publicSummary = {
          id: nextId,
          photoUrl: fullComplaint.photoUrl,
          latitude: fullComplaint.latitude,
          longitude: fullComplaint.longitude,
          address: fullComplaint.address,
          landmark: fullComplaint.landmark || '',
          ward: fullComplaint.ward || '',
          status: 'Pending',
          aiPrediction: fullComplaint.aiPrediction,
          aiConfidence: fullComplaint.aiConfidence,
          estimatedSeverity: fullComplaint.estimatedSeverity,
          boxCoveragePercent: fullComplaint.boxCoveragePercent,
          submittedAt: now,
          daysIgnored: 0,
          priority: fullComplaint.priority,
          serverTimestamp: serverTimestamp()
        };
        batch.set(publicDocRef, publicSummary);

        // Commit both authoritative report and public summary atomically
        await batch.commit();
      } catch (err: any) {
        console.warn('[PotholeIQ] Firestore write restricted by security rules. Saved locally:', err.message || err);
      }
    }

    return fullComplaint;
  }

  /**
   * Assigns an engineer to a complaint (Municipal Officer action).
   * Atomically synchronizes authoritative /potholes record and public summary.
   */
  async assignComplaintDoc(
    complaintId: string,
    engineer: EngineerProfile,
    deadline: string,
    priority: PriorityLevel,
    officerNotes?: string
  ): Promise<void> {
    if (!isFirebaseConfigured || !db) return;

    try {
      const docRef = doc(db, POTHOLES_COLLECTION, complaintId);
      const publicDocRef = doc(db, PUBLIC_POTHOLES_COLLECTION, complaintId);

      const internalUpdates = {
        status: 'Assigned',
        assignedEngineerId: engineer.id,
        assignedEngineerName: engineer.name,
        assignedEngineerEmail: engineer.email,
        assignedAt: new Date().toISOString(),
        repairDeadline: deadline,
        priority,
        officerNotes: officerNotes || '',
        updatedAt: serverTimestamp()
      };

      const publicUpdates = {
        status: 'Assigned',
        priority,
        repairDeadline: deadline,
        assignedEngineerName: engineer.name,
        updatedAt: serverTimestamp()
      };

      const publicSnap = await getDoc(publicDocRef);
      if (publicSnap.exists()) {
        const batch = writeBatch(db);
        batch.update(docRef, internalUpdates);
        batch.update(publicDocRef, publicUpdates);
        await batch.commit();
      } else {
        await updateDoc(docRef, internalUpdates);
      }
    } catch (err: any) {
      console.warn('[PotholeIQ] Firestore assign notice:', err.message || err);
    }
  }

  /**
   * Updates an existing complaint document in Firestore (Municipal Officer action).
   * Atomically synchronizes internal document and public summary if present.
   */
  async updateComplaintDoc(complaintId: string, updates: Partial<Complaint>): Promise<void> {
    if (!isFirebaseConfigured || !db) return;

    try {
      const docRef = doc(db, POTHOLES_COLLECTION, complaintId);
      const publicDocRef = doc(db, PUBLIC_POTHOLES_COLLECTION, complaintId);

      const publicUpdates: Record<string, any> = { updatedAt: serverTimestamp() };
      if (updates.status) publicUpdates.status = updates.status;
      if (updates.priority) publicUpdates.priority = updates.priority;
      if (updates.repairDeadline) publicUpdates.repairDeadline = updates.repairDeadline;

      const publicSnap = await getDoc(publicDocRef);
      if (publicSnap.exists()) {
        const batch = writeBatch(db);
        batch.update(docRef, { ...updates, updatedAt: serverTimestamp() });
        batch.update(publicDocRef, publicUpdates);
        await batch.commit();
      } else {
        await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });
      }
    } catch (err: any) {
      console.warn('[PotholeIQ] Firestore update notice:', err.message || err);
    }
  }

  /**
   * Starts a repair task (Assigned Engineer action).
   * Atomically updates status on both internal and public summary records.
   * Protected fields (reporterId, assignment, priority, deadline) remain untouched.
   */
  async startRepairDoc(complaintId: string): Promise<void> {
    if (!isFirebaseConfigured || !db) return;

    const startedTime = new Date().toISOString();
    try {
      const docRef = doc(db, POTHOLES_COLLECTION, complaintId);
      const publicDocRef = doc(db, PUBLIC_POTHOLES_COLLECTION, complaintId);

      const repairStartedUpdates = {
        status: 'In Progress',
        repairStartedAt: startedTime,
        updatedAt: serverTimestamp()
      };

      const publicSnap = await getDoc(publicDocRef);
      if (publicSnap.exists()) {
        const batch = writeBatch(db);
        batch.update(docRef, repairStartedUpdates);
        batch.update(publicDocRef, repairStartedUpdates);
        await batch.commit();
      } else {
        await updateDoc(docRef, repairStartedUpdates);
      }
    } catch (err: any) {
      console.warn('[PotholeIQ] Firestore start repair notice:', err.message || err);
    }
  }

  /**
   * Completes a repair task (Assigned Engineer action).
   * Strictly updates permitted fields: status, afterPhotoUrl, repairNotes, repairMaterialsUsed, completedAt, updatedAt.
   * Atomically commits updates to both internal and public summary collections.
   */
  async completeRepairDoc(
    complaintId: string,
    afterPhotoSrc: string,
    repairNotes: string,
    materialsUsed?: string
  ): Promise<string> {
    const completedTime = new Date().toISOString();

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, POTHOLES_COLLECTION, complaintId);
        const publicDocRef = doc(db, PUBLIC_POTHOLES_COLLECTION, complaintId);

        const repairCompletedUpdates = {
          status: 'Completed',
          completedAt: completedTime,
          afterPhotoUrl: afterPhotoSrc,
          repairNotes,
          repairMaterialsUsed: materialsUsed || '',
          updatedAt: serverTimestamp()
        };

        const publicSnap = await getDoc(publicDocRef);
        if (publicSnap.exists()) {
          const batch = writeBatch(db);
          batch.update(docRef, repairCompletedUpdates);
          batch.update(publicDocRef, repairCompletedUpdates);
          await batch.commit();
        } else {
          await updateDoc(docRef, repairCompletedUpdates);
        }
      } catch (err: any) {
        console.warn('[PotholeIQ] Firestore completion notice:', err.message || err);
      }
    }

    return afterPhotoSrc;
  }

  /**
   * Reopens a complaint (Municipal Officer action)
   */
  async reopenComplaintDoc(complaintId: string): Promise<void> {
    if (!isFirebaseConfigured || !db) return;

    try {
      const docRef = doc(db, POTHOLES_COLLECTION, complaintId);
      const publicDocRef = doc(db, PUBLIC_POTHOLES_COLLECTION, complaintId);

      const reopenUpdates = {
        status: 'Pending',
        completedAt: null,
        repairStartedAt: null,
        updatedAt: serverTimestamp()
      };

      const publicSnap = await getDoc(publicDocRef);
      if (publicSnap.exists()) {
        const batch = writeBatch(db);
        batch.update(docRef, reopenUpdates);
        batch.update(publicDocRef, reopenUpdates);
        await batch.commit();
      } else {
        await updateDoc(docRef, reopenUpdates);
      }
    } catch (err: any) {
      console.warn('[PotholeIQ] Firestore reopen notice:', err.message || err);
    }
  }

  /**
   * Creates an in-app notification with strict validation of recipientId and permitted fields.
   */
  async createNotificationDoc(
    notification: Omit<InAppNotification, 'id' | 'createdAt' | 'read'>
  ): Promise<InAppNotification | null> {
    if (!isFirebaseConfigured || !db || !auth?.currentUser) return null;

    const notifId = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const fullNotif: InAppNotification = {
      ...notification,
      id: notifId,
      senderId: auth.currentUser.uid,
      read: false,
      createdAt: new Date().toISOString()
    };

    try {
      const notifRef = doc(db, NOTIFICATIONS_COLLECTION, notifId);
      await setDoc(notifRef, {
        ...fullNotif,
        serverTimestamp: serverTimestamp()
      });
      return fullNotif;
    } catch (e: any) {
      console.warn('[PotholeIQ] Notification creation error:', e.message || e);
      return null;
    }
  }

  /**
   * Subscribes to in-app notifications for the authenticated user.
   */
  subscribeToNotifications(
    userId: string,
    onData: (notifications: InAppNotification[]) => void
  ): Unsubscribe | null {
    if (!isFirebaseConfigured || !db) return null;

    try {
      const q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('recipientId', '==', userId)
      );
      return onSnapshot(q, (snapshot) => {
        const list: InAppNotification[] = [];
        snapshot.forEach((snap) => {
          list.push(snap.data() as InAppNotification);
        });
        onData(list);
      });
    } catch (e: any) {
      console.warn('[PotholeIQ] Notification subscription notice:', e.message || e);
      return null;
    }
  }

  /**
   * Marks a notification as read (only permitted update field for recipients)
   */
  async markNotificationRead(notificationId: string): Promise<void> {
    if (!isFirebaseConfigured || !db) return;

    try {
      const notifRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
      await updateDoc(notifRef, { read: true });
    } catch (e: any) {
      console.warn('[PotholeIQ] Mark notification read notice:', e.message || e);
    }
  }

  /**
   * Retrieves user profile from 'users' collection in Firestore
   */
  async getUserProfileDoc(uid: string): Promise<UserProfile | null> {
    if (!isFirebaseConfigured || !db) return null;

    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        return snap.data() as UserProfile;
      }
    } catch (e: any) {
      console.warn('[PotholeIQ] Firestore user profile notice:', e.message || e);
    }
    return null;
  }

  /**
   * Creates or updates user profile in 'users' collection in Firestore
   */
  async saveUserProfileDoc(user: UserProfile): Promise<void> {
    if (!isFirebaseConfigured || !db) return;

    try {
      const userRef = doc(db, 'users', user.id);
      await setDoc(
        userRef,
        {
          ...user,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    } catch (e: any) {
      console.warn('[PotholeIQ] Firestore user save notice:', e.message || e);
    }
  }
}

export const firebaseDataService = new FirebaseDataService();
