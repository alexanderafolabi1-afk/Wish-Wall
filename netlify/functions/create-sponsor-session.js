/**
 * create-sponsor-session.js
 * Creates a Stripe Checkout Session for a Guardian sponsoring a specific wish.
 *
 * POST /.netlify/functions/create-sponsor-session
 * Body: { wishId: string, amount: number }  (amount in cents / pence)
 *
 * Env vars required:
 *   STRIPE_SECRET_KEY — sk_live_... from Stripe dashboard
 */
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PLATFORM_URL = process.env.URL || 'https://wishwall.xyz';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { wishId, amount } = body;

  if (!wishId || !amount || typeof amount !== 'number' || amount < 100) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'wishId and amount (min 100 cents) are required' }),
    };
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY not set');
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Payment service not configured' }),
    };
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode:                 'payment',
      client_reference_id: wishId,
      line_items: [
        {
          price_data: {
            currency:     'usd',
            unit_amount:  amount,
            product_data: {
              name:        'Guardian Wish Sponsorship',
              description: `Sponsoring wish #${wishId} on The Wish Wall`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${PLATFORM_URL}/?sponsored=${wishId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${PLATFORM_URL}/?cancelled=1`,
      metadata: {
        wishId,
        type: 'wish_sponsorship',
      },
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error('Stripe create-sponsor-session error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Failed to create checkout session' }),
    };
  }
};
