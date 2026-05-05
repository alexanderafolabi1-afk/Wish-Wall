const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  });
}
const db = admin.firestore();

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const FROM_EMAIL    = 'hello@wishwall.xyz';
const FROM_NAME     = 'The Wish Wall';

async function sendEmail({ to, subject, htmlContent }) {
  const res = await fetch(BREVO_API_URL, {
    method:  'POST',
    headers: {
      'api-key':      process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender:      { name: FROM_NAME, email: FROM_EMAIL },
      to:          [{ email: to }],
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

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: 'Invalid JSON' }; }

  const { wishId, guardianEmail, wishText, name } = body;
  let { wisherEmail } = body;

  if (!wishText) {
    return { statusCode: 400, body: 'Missing wishText' };
  }

  // Look up wisher email from Firebase if not provided
  if (!wisherEmail && wishId) {
    try {
      const snap = await db.collection('wishes').doc(wishId).get();
      if (snap.exists) {
        const data = snap.data();
        wisherEmail = data.email || data.wisherEmail || '';
      }
    } catch (err) {
      console.warn('Could not look up wisher email:', err.message);
    }
  }

  const displayName  = name ? `Hi ${name},` : 'Hi there,';
  const errors       = [];

  // Email 1: to wisher
  if (wisherEmail) {
    try {
      await sendEmail({
        to:          wisherEmail,
        subject:     '🌟 Your wish has been granted!',
        htmlContent: `
          <p>${displayName}</p>
          <p>We have incredible news — your wish has been granted! 🎉</p>
          <blockquote style="border-left:4px solid #a78bfa;padding-left:12px;color:#555;">
            "${wishText}"
          </blockquote>
          <p>Someone believed in your wish and made it happen. We hope this brings you joy.</p>
          <p>With love,<br>The Wish Wall team 💜</p>
        `,
      });
    } catch (err) {
      console.error('Failed to send wisher email:', err);
      errors.push('wisher');
    }
  }

  // Email 2: to guardian
  if (guardianEmail) {
    try {
      await sendEmail({
        to:          guardianEmail,
        subject:     '💙 You granted a wish on The Wish Wall',
        htmlContent: `
          <p>Hi there,</p>
          <p>You just granted a real wish:</p>
          <blockquote style="border-left:4px solid #4DAE7A;padding-left:12px;color:#555;">
            "${wishText}"
          </blockquote>
          <p>The wisher has been notified. You are a Guardian. 🛡️</p>
          <p>With gratitude,<br>The Wish Wall team 💜</p>
        `,
      });
    } catch (err) {
      console.error('Failed to send guardian email:', err);
      errors.push('guardian');
    }
  }

  if (!wisherEmail && !guardianEmail) {
    return { statusCode: 400, body: 'Missing wisherEmail or guardianEmail' };
  }

  if (errors.length === 2) {
    return { statusCode: 502, body: 'Failed to send emails' };
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true, errors }) };
};
