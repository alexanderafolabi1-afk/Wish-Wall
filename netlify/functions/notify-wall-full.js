/**
 * notify-wall-full.js
 * Sends an admin notification email when the wall reaches capacity (1,000 wishes).
 * Called by the client-side triggerWallFull() function.
 *
 * POST /.netlify/functions/notify-wall-full
 * Body: { count: number }  (current active wish count)
 *
 * Env vars required:
 *   RESEND_API_KEY — re_... from resend.com
 */
const RESEND_API_URL = 'https://api.resend.com/emails';
const FROM_EMAIL     = 'hello@wishwall.xyz';
const ADMIN_EMAIL    = 'admin@wallwishes.xyz';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set — notify-wall-full skipped');
    return { statusCode: 200, body: 'Email service not configured, notification skipped' };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    body = {};
  }

  const count    = body.count ?? 1000;
  const now      = new Date().toUTCString();

  const emailPayload = {
    from:    `The Wish Wall <${FROM_EMAIL}>`,
    to:      [ADMIN_EMAIL],
    subject: '\uD83D\uDCCC The Wish Wall is FULL \u2014 1,000/1,000 wishes',
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="font-family:monospace;background:#1E2235;color:#FAF8F5;padding:40px 20px;">
<div style="max-width:480px;margin:0 auto;background:#2a2f47;border-radius:8px;padding:32px;border:1px solid rgba(255,255,255,.1);">
  <h1 style="color:#D44A1E;font-size:22px;margin:0 0 20px;">\uD83D\uDCCC Wall capacity reached!</h1>
  <p style="color:#FAF8F5;margin:0 0 12px;">The Wish Wall has reached <strong>${count}/1,000</strong> active wishes.</p>
  <p style="color:#FAF8F5;margin:0 0 12px;">Time: <strong>${now}</strong></p>
  <p style="color:#6B7080;font-size:13px;margin:20px 0 0;">
    New wishes will enter the queue and auto-promote as slots open.<br>
    <a href="https://wishwall.xyz/admin" style="color:#D44A1E;">Open Admin Dashboard</a>
  </p>
</div>
</body>
</html>`,
  };

  try {
    const res = await fetch(RESEND_API_URL, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Resend API error (wall-full notification):', errText);
      return { statusCode: 502, body: 'Failed to send notification' };
    }

    const result = await res.json();
    console.log('Wall-full notification sent. Resend ID:', result.id);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, emailId: result.id }),
    };
  } catch (err) {
    console.error('notify-wall-full error:', err);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};
