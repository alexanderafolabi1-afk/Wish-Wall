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

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: 'Invalid JSON' }; }

  const { email, wishId, scheduledAt } = body;
  if (!email || !wishId) {
    return { statusCode: 400, body: 'Missing email or wishId' };
  }

  try {
    await db.collection('email_queue').add({
      email,
      wishId,
      step:        1,
      sendAfter:   scheduledAt || Date.now(),
      sent:        false,
      createdAt:   admin.firestore.FieldValue.serverTimestamp(),
    });
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('schedule-emails error:', err);
    return { statusCode: 500, body: 'Internal error' };
  }
};
