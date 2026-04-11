/**
 * stripe-webhook.js
 * Listens for Stripe webhook events and updates wish status in Firestore.
 *
 * Env vars required (set in Netlify dashboard):
 *   STRIPE_SECRET_KEY      — sk_live_... from Stripe dashboard
 *   STRIPE_WEBHOOK_SECRET  — whsec_... from Stripe webhook endpoint settings
 *   FIREBASE_SERVICE_ACCOUNT — JSON string of Firebase service account key
 */
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin  = require('firebase-admin');

// Initialise Firebase Admin once (survives warm Lambda invocations)
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  // Handle checkout completion
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    const wishId  = session.client_reference_id;

    if (!wishId) {
      console.warn('No client_reference_id on session:', session.id);
      return { statusCode: 200, body: 'OK (no wishId)' };
    }

    try {
      const wishRef = db.collection('wishes').doc(wishId);
      const snap    = await wishRef.get();

      if (!snap.exists) {
        console.warn('Wish not found in Firestore:', wishId);
        return { statusCode: 200, body: 'OK (wish not found)' };
      }

      const wish = snap.data();

      // Determine new status based on wall capacity
      const approvedSnap = await db.collection('wishes')
        .where('status', 'in', ['approved', 'granted'])
        .get();

      const WALL_CAPACITY = 1000;
      const newStatus = approvedSnap.size < WALL_CAPACITY ? 'approved' : 'queued';

      await wishRef.update({
        status:     newStatus,
        paidAt:     admin.firestore.FieldValue.serverTimestamp(),
        stripeSessionId: session.id,
        paymentEmail: session.customer_email || wish.email || null,
      });

      console.log(`Wish ${wishId} updated to status: ${newStatus}`);

      // If a slot was available and wish is now approved, trigger queue fill
      // (handled client-side via autoFillFromQueue; nothing extra needed here)
    } catch (err) {
      console.error('Firestore update error:', err);
      return { statusCode: 500, body: 'Internal Server Error' };
    }
  }

  return { statusCode: 200, body: 'OK' };
};
