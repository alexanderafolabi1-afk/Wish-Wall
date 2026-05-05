const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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

  const sig     = event.headers['stripe-signature'];
  const secret  = process.env.STRIPE_WEBHOOK_SECRET;
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, secret);
  } catch (err) {
    console.error('Stripe webhook signature error:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session     = stripeEvent.data.object;
    const customerEmail = session.customer_details?.email;
    const amountTotal   = (session.amount_total / 100).toFixed(2);
    const currency      = (session.currency || 'usd').toUpperCase();

    if (customerEmail) {
      try {
        await sendEmail({
          to:          customerEmail,
          subject:     '✨ Your Wish Wall payment was received',
          htmlContent: `
            <p>Hi there,</p>
            <p>Thank you! We received your payment of <strong>${currency} ${amountTotal}</strong>.</p>
            <p>Your wish is now on The Wish Wall. We hope it comes true soon. 🌟</p>
            <p>— The Wish Wall team</p>
          `,
        });
      } catch (err) {
        console.error('Failed to send receipt email:', err);
      }
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
