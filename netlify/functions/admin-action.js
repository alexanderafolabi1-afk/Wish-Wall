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
const FieldValue = admin.firestore.FieldValue;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const pw = event.headers['x-admin-password'] || '';
  if (!process.env.ADMIN_PASSWORD || pw !== process.env.ADMIN_PASSWORD) {
    return { statusCode: 401, body: 'Unauthorized' };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: 'Invalid JSON' }; }

  const { action, wishId, data = {} } = body;

  try {
    switch (action) {

      case 'approve': {
        await db.collection('wishes').doc(wishId).update({
          status:     'approved',
          approvedAt: FieldValue.serverTimestamp(),
        });
        break;
      }

      case 'reject': {
        await db.collection('wishes').doc(wishId).update({
          status:     'rejected',
          rejectedAt: FieldValue.serverTimestamp(),
        });
        break;
      }

      case 'grant': {
        await db.collection('wishes').doc(wishId).update({
          status:    'granted',
          granted:   true,
          grantedAt: FieldValue.serverTimestamp(),
          grantCost: parseFloat(data.cost) || 0,
        });
        await db.collection('meta').doc('ledger').set({
          totalGranted: FieldValue.increment(1),
          updatedAt:    FieldValue.serverTimestamp(),
        }, { merge: true });
        break;
      }

      case 'delete': {
        await db.collection('wishes').doc(wishId).delete();
        break;
      }

      case 'respond': {
        await db.collection('wishes').doc(wishId).update({
          cheekyResponse: data.response || '',
          respondedAt:    FieldValue.serverTimestamp(),
        });
        break;
      }

      case 'setConfig': {
        await db.collection('meta').doc('config').set(
          { ...data, updatedAt: FieldValue.serverTimestamp() },
          { merge: true }
        );
        break;
      }

      case 'updateLedger': {
        await db.collection('meta').doc('ledger').set(
          { ...data, updatedAt: FieldValue.serverTimestamp() },
          { merge: true }
        );
        break;
      }

      case 'flushQueue': {
        const snap = await db.collection('wishes').where('status', '==', 'queued').get();
        let total = 0;
        const CHUNK = 500;
        for (let i = 0; i < snap.docs.length; i += CHUNK) {
          const batch = db.batch();
          snap.docs.slice(i, i + CHUNK).forEach(d => batch.update(d.ref, {
            status:     'approved',
            approvedAt: FieldValue.serverTimestamp(),
          }));
          await batch.commit();
          total += Math.min(CHUNK, snap.docs.length - i);
        }
        return { statusCode: 200, body: JSON.stringify({ ok: true, count: total }) };
      }

      case 'getEmailQueue': {
        const snap = await db.collection('email_queue')
          .orderBy('createdAt', 'desc').limit(200).get();
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data(),
          createdAt: d.data().createdAt?.toDate?.()?.toISOString() || null,
          sendAfter:  d.data().sendAfter?.toDate?.()?.toISOString()  || null,
        }));
        return { statusCode: 200, body: JSON.stringify({ ok: true, docs }) };
      }

      default:
        return { statusCode: 400, body: 'Unknown action: ' + action };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('admin-action [' + action + '] error:', err);
    return { statusCode: 500, body: err.message };
  }
};
