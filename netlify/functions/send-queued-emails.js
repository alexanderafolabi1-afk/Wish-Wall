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
const MAX_BATCH = 50;
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

  try {
    const now = Date.now();
    const queueSnap = await db
      .collection('email_queue')
      .where('sent', '==', false)
      .get();

    const dueDocs = queueSnap.docs
      .filter((d) => {
        const data = d.data() || {};
        const sendAfter = Number(data.sendAfter || 0);
        return sendAfter <= now;
      })
      .sort((a, b) => Number(a.data().sendAfter || 0) - Number(b.data().sendAfter || 0))
      .slice(0, MAX_BATCH);

    if (dueDocs.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ ok: true, sent: 0 }) };
    }

    let sent = 0;
    for (const docSnap of dueDocs) {
      const data = docSnap.data() || {};
      const to = String(data.email || '').trim();
      if (!EMAIL_RE.test(to)) {
        console.warn(`Skipping invalid queued email recipient on ${docSnap.id}: ${to || '<empty>'}`);
        continue;
      }

      let wishText = 'Your wish';
      if (data.wishId) {
        try {
          const wishSnap = await db.collection('wishes').doc(String(data.wishId)).get();
          if (wishSnap.exists) {
            wishText = String(wishSnap.data().wishText || wishText);
          }
        } catch (err) {
          console.warn(`Could not load wish ${data.wishId} for queued email ${docSnap.id}:`, err.message);
        }
      }

      const rawStep = Number(data.step || 1);
      const step = rawStep === 2 ? 2 : 1;
      const subject = step === 1
        ? '💛 Your wish is now on The Wish Wall'
        : '✨ We are still rooting for your wish';
      const htmlContent = step === 1
        ? `<p>Hi there,</p><p>Your wish is now live on The Wish Wall.</p><blockquote style="border-left:4px solid #a78bfa;padding-left:12px;color:#555;">"${wishText}"</blockquote><p>A Guardian may grant it soon.</p><p>— The Wish Wall team</p>`
        : `<p>Hi there,</p><p>Just a little update from The Wish Wall — your wish is still active.</p><blockquote style="border-left:4px solid #a78bfa;padding-left:12px;color:#555;">"${wishText}"</blockquote><p>Thank you for being here.</p><p>— The Wish Wall team</p>`;

      try {
        await sendEmail({ to, subject, htmlContent });
        await docSnap.ref.set({
          sent: true,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          processedBy: 'send-queued-emails',
        }, { merge: true });
        sent += 1;
      } catch (err) {
        await docSnap.ref.set({
          lastError: String(err.message || err),
          attempts: admin.firestore.FieldValue.increment(1),
          lastAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, sent }) };
  } catch (err) {
    console.error('send-queued-emails error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
