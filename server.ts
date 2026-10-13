import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env file if present
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));

// ---------------------------------------------------------------------------
// 1. Robust CORS Configuration
// Allows requests from AI Studio frontend origin and deployed clients
// ---------------------------------------------------------------------------
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // Allow all origins or reflect the incoming origin for credentials
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// ---------------------------------------------------------------------------
// 2. Health Check Endpoint
// ---------------------------------------------------------------------------
app.get('/api/health', (_req: Request, res: Response) => {
  const hasApiKey = Boolean(process.env.EMAIL_API_KEY && process.env.EMAIL_API_KEY.trim());
  const hasMunicipalEmail = Boolean(process.env.MUNICIPAL_EMAIL && process.env.MUNICIPAL_EMAIL.trim());

  return res.json({
    status: 'ok',
    service: 'PotholeIQ Backend',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    corsEnabled: true,
    features: {
      healthCheck: true,
      complaintsApi: true,
      emailDispatch: hasApiKey && hasMunicipalEmail,
    },
  });
});

// ---------------------------------------------------------------------------
// 3. Email Dispatcher Types and Implementation
// ---------------------------------------------------------------------------
interface ComplaintEmailPayload {
  complaintId: string;
  reporterName: string;
  severity: string;
  aiConfidence: number;
  latitude: number;
  longitude: number;
  photoUrl: string;
  address?: string;
}

/**
 * Server-side email dispatcher using EMAIL_API_KEY and MUNICIPAL_EMAIL.
 * Neither secret is ever sent or exposed to browser client code.
 */
async function sendMunicipalComplaintEmail(
  payload: ComplaintEmailPayload
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.EMAIL_API_KEY;
  const municipalEmail = process.env.MUNICIPAL_EMAIL;

  if (!apiKey || !apiKey.trim()) {
    return {
      success: false,
      error: 'EMAIL_API_KEY secret is not configured in server environment (Settings → Secrets)',
    };
  }

  if (!municipalEmail || !municipalEmail.trim()) {
    return {
      success: false,
      error: 'MUNICIPAL_EMAIL secret is not configured in server environment (Settings → Secrets)',
    };
  }

  const {
    complaintId,
    reporterName,
    severity,
    aiConfidence,
    latitude,
    longitude,
    photoUrl,
    address,
  } = payload;

  const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
  const confidencePercent = `${Math.round((aiConfidence || 0) * 100)}%`;
  const subject = `[PotholeIQ Alert] New Road Damage Report #${complaintId} - Severity: ${severity}`;

  const textContent = `MUNICIPAL ROADS & INFRASTRUCTURE ALERT
PotholeIQ Civic Notification System

A new road damage complaint has been submitted:
- Reporter Name: ${reporterName || 'Anonymous Citizen'}
- Severity: ${severity}
- AI Confidence: ${confidencePercent}
- Google Maps Link: ${googleMapsUrl}
- Photo Link: ${photoUrl}

Complaint ID: #${complaintId}
${address ? `Address / Zone: ${address}\n` : ''}Coordinates: ${latitude}, ${longitude}
Timestamp: ${new Date().toISOString()}

Action Required: Please inspect the site and assign a repair engineer in the PotholeIQ Officer Dashboard.`;

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>PotholeIQ Alert</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
    <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 20px 24px; color: #0f172a;">
      <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.025em; color: #0f172a;">
        ⚠️ PotholeIQ — Municipal Civic Dispatch
      </h1>
      <p style="margin: 4px 0 0 0; font-size: 13px; font-weight: 600; opacity: 0.9;">
        New Road Damage Report #${complaintId}
      </p>
    </div>

    <div style="padding: 24px;">
      <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.5; color: #334155;">
        A citizen has submitted a road damage hazard requiring municipal inspection and maintenance assignment:
      </p>

      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; font-weight: 600; width: 140px;">Reporter Name:</td>
          <td style="padding: 10px 0; color: #0f172a; font-weight: 700;">${reporterName || 'Citizen'}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Severity:</td>
          <td style="padding: 10px 0;">
            <span style="display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 800; background-color: ${
              severity === 'Dangerous'
                ? '#ffe4e6; color: #be123c;'
                : severity === 'High'
                ? '#ffedd5; color: #c2410c;'
                : severity === 'Medium'
                ? '#fef3c7; color: #b45309;'
                : '#ecfdf5; color: #047857;'
            }">
              ${severity}
            </span>
          </td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">AI Confidence:</td>
          <td style="padding: 10px 0; color: #0f172a; font-weight: 700;">${confidencePercent}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Google Maps Link:</td>
          <td style="padding: 10px 0;">
            <a href="${googleMapsUrl}" target="_blank" style="color: #2563eb; text-decoration: underline; font-weight: 600;">
              Open in Google Maps (${latitude.toFixed(4)}, ${longitude.toFixed(4)})
            </a>
          </td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Photo Link:</td>
          <td style="padding: 10px 0;">
            <a href="${photoUrl}" target="_blank" style="color: #2563eb; text-decoration: underline; font-weight: 600;">
              View Damage Photo
            </a>
          </td>
        </tr>
        ${
          address
            ? `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Address:</td>
          <td style="padding: 10px 0; color: #0f172a;">${address}</td>
        </tr>`
            : ''
        }
      </table>

      ${
        photoUrl && !photoUrl.startsWith('data:')
          ? `
      <div style="margin-bottom: 24px;">
        <p style="font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 8px;">Damage Photograph:</p>
        <img src="${photoUrl}" alt="Pothole Damage" style="max-width: 100%; height: auto; max-height: 260px; border-radius: 8px; border: 1px solid #e2e8f0; object-fit: cover;" />
      </div>`
          : ''
      }

      <div style="background-color: #f8fafc; border-radius: 8px; padding: 12px 16px; border: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 12px; color: #64748b;">
          <strong>Action Required:</strong> Log in to the PotholeIQ Officer Dashboard to assign a repair engineer and set the repair deadline.
        </p>
      </div>
    </div>

    <div style="background-color: #f1f5f9; padding: 12px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
      PotholeIQ Civic Road Safety Platform · Automated Alert to Municipal Office
    </div>
  </div>
</body>
</html>`;

  try {
    // 1. SendGrid API if key matches 'SG.'
    if (apiKey.startsWith('SG.')) {
      const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: municipalEmail }] }],
          from: { email: 'alerts@potholeiq.org', name: 'PotholeIQ Civic Alerts' },
          subject,
          content: [
            { type: 'text/plain', value: textContent },
            { type: 'text/html', value: htmlContent },
          ],
        }),
      });

      if (sgRes.ok || sgRes.status === 202) {
        return { success: true };
      }
      const sgText = await sgRes.text();
      return { success: false, error: `SendGrid error (${sgRes.status}): ${sgText || sgRes.statusText}` };
    }

    // 2. Brevo API if key matches 'xkeysib-'
    if (apiKey.startsWith('xkeysib-')) {
      const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'PotholeIQ Civic Alerts', email: 'alerts@potholeiq.org' },
          to: [{ email: municipalEmail }],
          subject,
          htmlContent,
          textContent,
        }),
      });

      if (brevoRes.ok) {
        const data = await brevoRes.json();
        return { success: true, messageId: data?.messageId };
      }
      const brevoData = await brevoRes.json().catch(() => ({}));
      return { success: false, error: (brevoData as any)?.message || `Brevo HTTP ${brevoRes.status}` };
    }

    // 3. Default / Resend API (standard for modern server-side apps)
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'PotholeIQ <onboarding@resend.dev>',
        to: [municipalEmail],
        subject,
        html: htmlContent,
        text: textContent,
      }),
    });

    if (resendRes.ok) {
      const data = await resendRes.json();
      return { success: true, messageId: data?.id };
    }

    const errData = await resendRes.json().catch(() => ({}));
    const errMsg = (errData as any)?.message || `Email API error (${resendRes.status}): ${resendRes.statusText}`;
    return { success: false, error: errMsg };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network exception while dispatching email' };
  }
}

// ---------------------------------------------------------------------------
// 4. Complaints Store & Endpoints
// ---------------------------------------------------------------------------
interface ComplaintRecord {
  id: string;
  reporterId?: string;
  reporterName: string;
  reporterEmail?: string;
  photoUrl: string;
  latitude: number;
  longitude: number;
  address: string;
  landmark?: string;
  ward?: string;
  aiPrediction: string;
  aiConfidence: number;
  estimatedSeverity: string;
  boxCoveragePercent?: number;
  aiDetails?: any;
  status: 'Pending' | 'Assigned' | 'In Progress' | 'Completed' | 'Rejected';
  priority?: string;
  submittedAt: string;
  daysIgnored?: number;
  assignedEngineerId?: string;
  assignedEngineerName?: string;
  assignedEngineerEmail?: string;
  assignedAt?: string;
  repairDeadline?: string;
  repairStartedAt?: string;
  completedAt?: string;
  afterPhotoUrl?: string;
  repairNotes?: string;
  repairMaterialsUsed?: string;
  rejectionReason?: string;
  officerNotes?: string;
  notificationStatus?: 'sent' | 'pending' | 'failed';
}

const complaintsStore: Map<string, ComplaintRecord> = new Map();

function seedInitialComplaints() {
  if (complaintsStore.size > 0) return;
  const initialData: ComplaintRecord[] = [
    {
      id: 'PIQ-101',
      reporterId: 'cit-01',
      reporterName: 'Anand Verma',
      reporterEmail: 'anand.v@gmail.com',
      photoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
      latitude: 12.9716,
      longitude: 77.5946,
      address: 'Outer Ring Road, Near Tech Park Junction, Ward 15',
      landmark: 'Opposite Metro Pillar 142',
      ward: 'Ward 15 - East Zone',
      aiPrediction: 'pothole',
      aiConfidence: 0.94,
      estimatedSeverity: 'Dangerous',
      boxCoveragePercent: 22,
      status: 'Pending',
      priority: 'Urgent',
      submittedAt: new Date(Date.now() - 86400000 * 12).toISOString(),
      daysIgnored: 12,
      notificationStatus: 'sent',
    },
    {
      id: 'PIQ-102',
      reporterId: 'cit-02',
      reporterName: 'Pooja Hegde',
      reporterEmail: 'pooja.h@outlook.com',
      photoUrl: 'https://images.unsplash.com/photo-1584463699039-387b99c75128?auto=format&fit=crop&w=800&q=80',
      latitude: 12.9352,
      longitude: 77.6245,
      address: 'Koramangala 4th Block, 80 Feet Road',
      landmark: 'Near Sony World Signal',
      ward: 'Ward 68 - South Zone',
      aiPrediction: 'pothole',
      aiConfidence: 0.88,
      estimatedSeverity: 'Medium',
      boxCoveragePercent: 12,
      status: 'Pending',
      priority: 'High',
      submittedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
      daysIgnored: 8,
      notificationStatus: 'sent',
    },
    {
      id: 'PIQ-103',
      reporterId: 'cit-03',
      reporterName: 'Karthik Srinivasan',
      reporterEmail: 'karthik.s@yahoo.com',
      photoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?auto=format&fit=crop&w=800&q=80',
      latitude: 12.9784,
      longitude: 77.6408,
      address: '100 Feet Road, Indiranagar, Near Metro',
      landmark: 'In front of 12th Main Crossing',
      ward: 'Ward 24 - East Zone',
      aiPrediction: 'pothole',
      aiConfidence: 0.91,
      estimatedSeverity: 'Dangerous',
      boxCoveragePercent: 19,
      status: 'Completed',
      priority: 'Urgent',
      submittedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      completedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      assignedEngineerId: 'eng-1',
      assignedEngineerName: 'Eng. Rajesh Kumar',
      afterPhotoUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80',
      repairNotes: 'Excavated 10cm base, filled cold-mix bitumen and tamped to road grade.',
      daysIgnored: 3,
      notificationStatus: 'sent',
    },
    {
      id: 'PIQ-104',
      reporterId: 'cit-04',
      reporterName: 'Meera Nambiar',
      reporterEmail: 'meera.n@gmail.com',
      photoUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80',
      latitude: 12.9834,
      longitude: 77.6111,
      address: 'Halasuru Main Road, Opposite Post Office',
      landmark: 'Near Halasuru Lake Gate',
      ward: 'Ward 31 - East Zone',
      aiPrediction: 'pothole',
      aiConfidence: 0.86,
      estimatedSeverity: 'High',
      boxCoveragePercent: 15,
      status: 'Assigned',
      priority: 'High',
      assignedEngineerId: 'eng-1',
      assignedEngineerName: 'Eng. Rajesh Kumar',
      assignedEngineerEmail: 'rajesh.kumar@citycorp.gov',
      assignedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      repairDeadline: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
      submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      daysIgnored: 2,
      notificationStatus: 'sent',
    },
  ];
  for (const c of initialData) {
    complaintsStore.set(c.id, c);
  }
}
seedInitialComplaints();

// Route: Retrieve all complaints
app.get('/api/complaints', (_req: Request, res: Response) => {
  const list = Array.from(complaintsStore.values()).sort((a, b) => {
    return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
  });
  return res.json({
    success: true,
    count: list.length,
    complaints: list,
  });
});

// Route: Retrieve single complaint by ID
app.get('/api/complaints/:id', (req: Request, res: Response) => {
  const item = complaintsStore.get(req.params.id);
  if (!item) {
    return res.status(404).json({ success: false, error: `Complaint #${req.params.id} not found` });
  }
  return res.json({ success: true, complaint: item });
});

// Route: Submit new complaint
app.post('/api/complaints', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (!body || body.latitude === undefined || body.longitude === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required complaint coordinates (latitude and longitude are required)',
      });
    }

    const complaintId = body.id || `PIQ-${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString();

    const newRecord: ComplaintRecord = {
      id: complaintId,
      reporterId: body.reporterId || 'cit-anonymous',
      reporterName: body.reporterName || 'Citizen Reporter',
      reporterEmail: body.reporterEmail,
      photoUrl: body.photoUrl || '',
      latitude: Number(body.latitude),
      longitude: Number(body.longitude),
      address: body.address || `Roadway at (${body.latitude}, ${body.longitude})`,
      landmark: body.landmark,
      ward: body.ward,
      aiPrediction: body.aiPrediction || 'pothole',
      aiConfidence: Number(body.aiConfidence) || 0.9,
      estimatedSeverity: body.estimatedSeverity || 'Medium',
      boxCoveragePercent: body.boxCoveragePercent || 15,
      aiDetails: body.aiDetails,
      status: 'Pending',
      priority: body.priority || 'High',
      submittedAt: now,
      daysIgnored: 0,
      notificationStatus: 'sent',
    };

    complaintsStore.set(complaintId, newRecord);

    // If email secrets are configured, dispatch municipal alert email
    let emailResult = null;
    if (process.env.EMAIL_API_KEY && process.env.MUNICIPAL_EMAIL) {
      emailResult = await sendMunicipalComplaintEmail({
        complaintId,
        reporterName: newRecord.reporterName,
        severity: newRecord.estimatedSeverity,
        aiConfidence: newRecord.aiConfidence,
        latitude: newRecord.latitude,
        longitude: newRecord.longitude,
        photoUrl: newRecord.photoUrl,
        address: newRecord.address,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      complaint: newRecord,
      emailDispatched: emailResult?.success ?? false,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error submitting complaint',
    });
  }
});

// Route: Update complaint status / assignment / repair
const handleComplaintUpdate = (req: Request, res: Response) => {
  const id = req.params.id;
  const existing = complaintsStore.get(id);

  if (!existing) {
    const upserted: ComplaintRecord = {
      id,
      reporterName: req.body.reporterName || 'Citizen Reporter',
      photoUrl: req.body.photoUrl || '',
      latitude: req.body.latitude || 12.9716,
      longitude: req.body.longitude || 77.5946,
      address: req.body.address || 'Roadway',
      aiPrediction: 'pothole',
      aiConfidence: 0.9,
      estimatedSeverity: 'Medium',
      submittedAt: new Date().toISOString(),
      status: req.body.status || 'Pending',
      ...req.body,
    };
    complaintsStore.set(id, upserted);
    return res.json({ success: true, complaint: upserted });
  }

  const updated: ComplaintRecord = {
    ...existing,
    ...req.body,
    id, // protect immutable ID
  };

  complaintsStore.set(id, updated);
  return res.json({ success: true, complaint: updated });
};

app.patch('/api/complaints/:id/status', handleComplaintUpdate);
app.patch('/api/complaints/:id', handleComplaintUpdate);
app.put('/api/complaints/:id/status', handleComplaintUpdate);
app.put('/api/complaints/:id', handleComplaintUpdate);

// Route: Send complaint email directly to MUNICIPAL_EMAIL using EMAIL_API_KEY
app.post('/api/send-complaint-email', async (req: Request, res: Response) => {
  try {
    const payload: ComplaintEmailPayload = req.body;

    if (!payload || !payload.complaintId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required complaint payload',
      });
    }

    const result = await sendMunicipalComplaintEmail(payload);

    if (result.success) {
      return res.json({
        success: true,
        message: 'Email sent successfully',
        messageId: result.messageId,
      });
    } else {
      return res.json({
        success: false,
        error: result.error || 'Failed to dispatch email to municipal office',
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error while dispatching email',
    });
  }
});

// Route: Check whether email secrets are configured without exposing secrets to client
app.get('/api/email-config-status', (_req: Request, res: Response) => {
  const hasApiKey = Boolean(process.env.EMAIL_API_KEY && process.env.EMAIL_API_KEY.trim());
  const hasMunicipalEmail = Boolean(process.env.MUNICIPAL_EMAIL && process.env.MUNICIPAL_EMAIL.trim());

  return res.json({
    configured: hasApiKey && hasMunicipalEmail,
    hasApiKey,
    hasMunicipalEmail,
  });
});

// ---------------------------------------------------------------------------
// 5. App Startup & Static/Vite Mounting
// ---------------------------------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`PotholeIQ Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start PotholeIQ server:', err);
  process.exit(1);
});
