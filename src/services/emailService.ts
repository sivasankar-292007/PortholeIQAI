import { Complaint, EmailNotificationLog } from '../types';

/**
 * Service handling municipal email notifications.
 * Implements the standard Firestore 'mail' collection schema compatible with the
 * Firebase "Trigger Email from Firestore" extension and Cloud Functions.
 */

const DEFAULT_OFFICE_EMAIL =
  (import.meta as any).env?.VITE_MUNICIPAL_OFFICE_EMAIL || 'potholes-response@smartcity.gov';

export class EmailNotificationService {
  private logs: EmailNotificationLog[] = [];

  constructor() {
    // Pre-populate with recent notification logs for demo inspection
    this.logs = [
      {
        id: 'mail-01',
        complaintId: 'PIQ-101',
        recipientEmail: DEFAULT_OFFICE_EMAIL,
        subject: '[URGENT] PotholeIQ Alert: Dangerous Pothole Reported (#PIQ-101)',
        body: `A new critical road damage has been reported via PotholeIQ.
Complaint ID: #PIQ-101
Reporter: Anand Verma
Severity: Dangerous
Location: Outer Ring Road, Near Tech Park Junction (12.9716, 77.5946)
Google Maps: https://www.google.com/maps?q=12.9716,77.5946
AI Confidence: 93% (Area coverage: 22%)`,
        sentAt: new Date(Date.now() - 86400000 * 12).toISOString(),
        status: 'simulated',
        eventType: 'complaint_submitted'
      },
      {
        id: 'mail-02',
        complaintId: 'PIQ-104',
        recipientEmail: 'rajesh.kumar@citycorp.gov',
        subject: '[TASK ASSIGNMENT] PotholeIQ: Work Order Assigned (#PIQ-104)',
        body: `You have been assigned to repair pothole #PIQ-104.
Location: Halasuru Main Road, Opposite Post Office (12.9834, 77.6111)
Priority: High
Deadline: In 2 days`,
        sentAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        status: 'simulated',
        eventType: 'engineer_assigned'
      },
      {
        id: 'mail-03',
        complaintId: 'PIQ-103',
        recipientEmail: 'karthik.s@yahoo.com',
        subject: '[REPAIR COMPLETED] PotholeIQ: Your Reported Pothole is Fixed! (#PIQ-103)',
        body: `Dear Karthik,
Your reported pothole #PIQ-103 on 100 Feet Road, Indiranagar has been successfully repaired by Eng. Rajesh Kumar.
The public map pin has turned GREEN. View before-and-after proof on the public portal.`,
        sentAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        status: 'simulated',
        eventType: 'repair_completed'
      }
    ];
  }

  getLogs(): EmailNotificationLog[] {
    return [...this.logs];
  }

  getLogsForComplaint(complaintId: string): EmailNotificationLog[] {
    return this.logs.filter((l) => l.complaintId === complaintId);
  }

  /**
   * Dispatches an email alert when a citizen submits a complaint.
   * Calls secure server-side endpoint which uses EMAIL_API_KEY and MUNICIPAL_EMAIL secrets.
   */
  async notifyMunicipalOfficeOnSubmission(complaint: Complaint): Promise<EmailNotificationLog> {
    const mapsLink = `https://www.google.com/maps?q=${complaint.latitude},${complaint.longitude}`;
    const subject = `[POTHOLE ALERT - ${complaint.estimatedSeverity.toUpperCase()}] New Report #${complaint.id} - ${complaint.address || 'GPS Location'}`;
    const body = `MUNICIPAL ROADS & BRIDGES DEPARTMENT
PotholeIQ Automatic Civic Dispatch

Complaint ID: #${complaint.id}
Reporter: ${complaint.reporterName} (${complaint.reporterEmail || 'N/A'})
Submission Date: ${new Date(complaint.submittedAt).toLocaleString()}
Severity Rating: ${complaint.estimatedSeverity}
AI Confidence: ${(complaint.aiConfidence * 100).toFixed(0)}% (Damage Area: ${complaint.boxCoveragePercent}%)
Address / Ward: ${complaint.address} ${complaint.ward ? `(${complaint.ward})` : ''}
GPS Coordinates: ${complaint.latitude.toFixed(5)}, ${complaint.longitude.toFixed(5)}

Live Location Map: ${mapsLink}
Damage Photograph: ${complaint.photoUrl}
Status: Pending Assignment

Action Required: Please assign a ward maintenance engineer in the PotholeIQ Officer Dashboard.`;

    const complaintData = {
      complaintId: complaint.id,
      reporterName: complaint.reporterName,
      severity: complaint.estimatedSeverity,
      aiConfidence: complaint.aiConfidence,
      latitude: complaint.latitude,
      longitude: complaint.longitude,
      photoUrl: complaint.photoUrl,
      address: complaint.address,
    };

    let logStatus: 'sent' | 'failed' = 'failed';
    let errorMessage: string | undefined = undefined;

    try {
      const response = await fetch('/api/send-complaint-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(complaintData),
      });

      const result = await response.json().catch(() => null);

      if (response.ok && result?.success) {
        logStatus = 'sent';
      } else {
        logStatus = 'failed';
        errorMessage = result?.error || `Email dispatch failed (HTTP ${response.status})`;
      }
    } catch (err: any) {
      logStatus = 'failed';
      errorMessage = err?.message || 'Server connection failed';
    }

    const log: EmailNotificationLog = {
      id: `mail-${Date.now()}`,
      complaintId: complaint.id,
      recipientEmail: 'Municipal Dispatch (MUNICIPAL_EMAIL)',
      subject,
      body,
      sentAt: new Date().toISOString(),
      status: logStatus,
      errorMessage,
      complaintData,
      eventType: 'complaint_submitted',
    };

    this.logs.unshift(log);
    return log;
  }

  /**
   * Retries sending a failed municipal email dispatch
   */
  async retryNotification(logId: string): Promise<EmailNotificationLog | null> {
    const log = this.logs.find((l) => l.id === logId);
    if (!log) return null;

    if (!log.complaintData) {
      // Create fallback payload from log body if missing
      log.complaintData = {
        complaintId: log.complaintId,
        reporterName: 'Citizen Reporter',
        severity: 'High',
        aiConfidence: 0.9,
        latitude: 12.9716,
        longitude: 77.5946,
        photoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80',
        address: 'Municipal Road Corridor',
      };
    }

    try {
      const response = await fetch('/api/send-complaint-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(log.complaintData),
      });

      const result = await response.json().catch(() => null);

      if (response.ok && result?.success) {
        log.status = 'sent';
        log.errorMessage = undefined;
        log.sentAt = new Date().toISOString();
      } else {
        log.status = 'failed';
        log.errorMessage = result?.error || `Retry failed (HTTP ${response.status})`;
      }
    } catch (err: any) {
      log.status = 'failed';
      log.errorMessage = err?.message || 'Server connection failed';
    }

    return log;
  }

  /**
   * Dispatches email when municipal officer assigns an engineer
   */
  async notifyEngineerOnAssignment(
    complaint: Complaint,
    engineerEmail: string,
    engineerName: string,
    deadline: string
  ): Promise<EmailNotificationLog> {
    const mapsLink = `https://www.google.com/maps?q=${complaint.latitude},${complaint.longitude}`;
    const subject = `[WORK ORDER] PotholeIQ Repair Assigned: #${complaint.id} (${complaint.priority} Priority)`;
    const body = `Dear ${engineerName},

You have been officially assigned to repair pothole report #${complaint.id}.

Priority: ${complaint.priority}
Deadline: ${deadline}
Severity: ${complaint.estimatedSeverity}
Location: ${complaint.address}
GPS Link: ${mapsLink}

Please inspect the site, start the repair task in your PotholeIQ Engineer Dashboard, and upload the after-repair photograph upon completion.`;

    const log: EmailNotificationLog = {
      id: `mail-${Date.now()}`,
      complaintId: complaint.id,
      recipientEmail: engineerEmail,
      subject,
      body,
      sentAt: new Date().toISOString(),
      status: 'simulated',
      eventType: 'engineer_assigned'
    };

    this.logs.unshift(log);
    return log;
  }

  /**
   * Dispatches email to citizen when repair is completed
   */
  async notifyCitizenOnCompletion(complaint: Complaint): Promise<EmailNotificationLog> {
    const subject = `[REPAIRED] PotholeIQ: Report #${complaint.id} Has Been Fixed!`;
    const body = `Dear ${complaint.reporterName},

Great news! The pothole you reported at "${complaint.address}" has been successfully repaired by ${complaint.assignedEngineerName || 'Municipal Highway Works'}.

The public map status has turned GREEN.
You can view the before-and-after verification photographs on PotholeIQ.

Thank you for contributing to safer roads in our city (SDG 11).`;

    const log: EmailNotificationLog = {
      id: `mail-${Date.now()}`,
      complaintId: complaint.id,
      recipientEmail: complaint.reporterEmail || 'citizen@potholeiq.org',
      subject,
      body,
      sentAt: new Date().toISOString(),
      status: 'simulated',
      eventType: 'repair_completed'
    };

    this.logs.unshift(log);
    return log;
  }
}

export const emailService = new EmailNotificationService();
