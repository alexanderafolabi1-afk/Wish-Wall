const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin  = require('firebase-admin');

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

  const sig    = event.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, secret);
  } catch (err) {
    console.error('Stripe webhook signature error:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (stripeEvent.type === 'checkout.session.completed' ||
      stripeEvent.type === 'payment_intent.succeeded') {

    const session = stripeEvent.data.object;
    const isPaymentIntent = stripeEvent.type === 'payment_intent.succeeded';

    // Extract fields based on event type
    const clientRef = isPaymentIntent
      ? (session.metadata?.client_reference_id || session.metadata?.wishId || '')
      : (session.client_reference_id || session.metadata?.wishId || '');

    const customerEmail = isPaymentIntent
      ? (session.receipt_email || session.metadata?.email || '')
      : (session.customer_details?.email || session.receipt_email || '');

    const amountTotal = isPaymentIntent
      ? ((session.amount_received ?? session.amount ?? 0) / 100).toFixed(2)
      : ((session.amount_total ?? 0) / 100).toFixed(2);

    const currency = (session.currency || 'usd').toUpperCase();

    if (clientRef.startsWith('grant_')) {
      // ── Guardian payment: mark wish as granted ──────────────────────────
      const wishId = clientRef.slice('grant_'.length);
      try {
        const wishRef = db.collection('wishes').doc(wishId);
        await wishRef.update({
          status:    'granted',
          granted:   true,
          grantedAt: admin.firestore.FieldValue.serverTimestamp(),
          grantCost: parseFloat(amountTotal),
        });

        // Update ledger
        const ledgerRef = db.collection('meta').doc('ledger');
        await ledgerRef.set({
          totalGranted:    admin.firestore.FieldValue.increment(1),
          totalDonations:  admin.firestore.FieldValue.increment(parseFloat(amountTotal)),
          updatedAt:       admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        // Fetch wish data for the email
        const wishSnap = await wishRef.get();
        const wishData = wishSnap.exists ? wishSnap.data() : {};
        const wisherEmail   = wishData.email || wishData.wisherEmail || '';
        const wisherName    = wishData.name  || '';
        const wishText      = wishData.wishText || '';

        // Email to wisher
        if (wisherEmail) {
          await sendEmail({
            to:          wisherEmail,
            subject:     '🌟 Your wish has been granted!',
            htmlContent: `
              <p>${wisherName ? 'Hi ' + wisherName + ',' : 'Hi there,'}</p>
              <p>We have incredible news — your wish has been granted! 🎉</p>
              <blockquote style="border-left:4px solid #a78bfa;padding-left:12px;color:#555;">"${wishText}"</blockquote>
              <p>Someone believed in your wish and made it happen. We hope this brings you joy.</p>
              <p>With love,<br>The Wish Wall team 💜</p>
            `,
          }).catch(err => console.error('Failed to send wisher granted email:', err));
        }

        // Email to Guardian
        if (customerEmail) {
          await sendEmail({
            to:          customerEmail,
            subject:     '💙 You granted a wish on The Wish Wall',
            htmlContent: `
              <p>Hi there,</p>
              <p>Thank you! Your payment of <strong>${currency} ${amountTotal}</strong> has been received.</p>
              <p>You just granted a real wish:</p>
              <blockquote style="border-left:4px solid #4DAE7A;padding-left:12px;color:#555;">"${wishText}"</blockquote>
              <p>The wisher has been notified. You are a Guardian. 🛡️</p>
              <p>— The Wish Wall team</p>
            `,
          }).catch(err => console.error('Failed to send guardian receipt email:', err));
        }
      } catch (err) {
        console.error('Error processing guardian grant:', err);
      }

    } else if (clientRef === 'community_pot' || clientRef.startsWith('pot_')) {
      // ── Community Pot contribution ──────────────────────────────────────
      try {
        const ledgerRef = db.collection('meta').doc('ledger');
        await ledgerRef.set({
          potBalance:     admin.firestore.FieldValue.increment(parseFloat(amountTotal)),
          totalDonations: admin.firestore.FieldValue.increment(parseFloat(amountTotal)),
          updatedAt:      admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        if (customerEmail) {
          await sendEmail({
            to:          customerEmail,
            subject:     '🪙 Your Magic Pool contribution was received',
            htmlContent: `
              <p>Hi there,</p>
              <p>Thank you! Your contribution of <strong>${currency} ${amountTotal}</strong> has been added to the Magic Pool.</p>
              <p>It will be used to grant wishes for people who need it most. You are part of the magic. 🌟</p>
              <p>— The Wish Wall team</p>
            `,
          }).catch(err => console.error('Failed to send pot contribution email:', err));
        }
      } catch (err) {
        console.error('Error processing pot contribution:', err);
      }

    } else if (clientRef && !clientRef.startsWith('pot_')) {
      // ── Pin payment: mark wish as approved ─────────────────────────────
      const wishId = clientRef;
      try {
        const wishRef = db.collection('wishes').doc(wishId);
        await wishRef.update({
          status:     'approved',
          approvedAt: admin.firestore.FieldValue.serverTimestamp(),
          paidAt:     admin.firestore.FieldValue.serverTimestamp(),
        });

        // Update ledger fees
        const ledgerRef = db.collection('meta').doc('ledger');
        await ledgerRef.set({
          totalFees: admin.firestore.FieldValue.increment(parseFloat(amountTotal)),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        // Email to wisher
        if (customerEmail) {
          await sendEmail({
            to:          customerEmail,
            subject:     '✨ Your wish is on The Wish Wall!',
            htmlContent: `
              <p>Hi there,</p>
              <p>Thank you! We received your payment of <strong>${currency} ${amountTotal}</strong>.</p>
              <p>Your wish is now live on The Wish Wall. A Guardian may grant it soon. 🌟</p>
              <p>— The Wish Wall team</p>
            `,
          }).catch(err => console.error('Failed to send wisher pin email:', err));
        }
      } catch (err) {
        console.error('Error processing pin payment:', err);
      }

    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
