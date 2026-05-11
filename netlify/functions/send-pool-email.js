const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const FROM_EMAIL = 'hello@wallwishes.xyz';
const FROM_NAME = 'The Wish Wall';
const MAX_RECIPIENTS = 250;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function sendEmail({ to, subject, htmlContent }) {
  const res = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: FROM_NAME, email: FROM_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Brevo error ${res.status}: ${text}`);
  }
  return res.json();
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (!process.env.BREVO_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'BREVO_API_KEY is not configured' }),
    };
  }

  let balance = 0;
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const parsed = Number(body.balance || 0);
    balance = Number.isFinite(parsed) ? parsed : 0;
  } catch (err) {
    console.warn('send-pool-email: invalid JSON body, defaulting balance to 0:', err.message);
  }

  try {
    const snap = await db.collection('subscribers').limit(MAX_RECIPIENTS).get();
    const recipients = snap.docs
      .map((d) => String((d.data() || {}).email || '').trim())
      .filter((email) => EMAIL_RE.test(email));

    let sent = 0;
    for (const to of recipients) {
      try {
        await sendEmail({
          to,
          subject: '🪙 Magic Pool update from The Wish Wall',
          htmlContent: `<p>Hi there,</p><p>The Magic Pool current balance is <strong>£${balance.toLocaleString()}</strong>.</p><p>Thank you for following the journey and supporting real wishes.</p><p>— The Wish Wall team</p>`,
        });
        sent += 1;
      } catch (err) {
        console.warn(`Failed to send pool update to ${to}:`, err.message);
      }
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, sent, total: recipients.length }) };
  } catch (err) {
    console.error('send-pool-email error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
