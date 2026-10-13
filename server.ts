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

app.use(express.json({ limit: '10mb' }));

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

// Route: Send complaint email to MUNICIPAL_EMAIL using EMAIL_API_KEY
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
