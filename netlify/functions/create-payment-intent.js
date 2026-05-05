const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: 'Invalid JSON' }; }

  const { amount, wishId } = body;

  if (!amount || typeof amount !== 'number' || amount < 50) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid amount (minimum 50 cents)' }) };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount:   Math.round(amount),
      currency: 'usd',
      metadata: {
        wishId:         wishId || '',
        client_reference_id: wishId ? (wishId === 'community_pot' ? 'community_pot' : 'grant_' + wishId) : '',
        source:         'wish-wall',
      },
      automatic_payment_methods: { enabled: true },
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientSecret: paymentIntent.client_secret }),
    };
  } catch (err) {
    console.error('create-payment-intent error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
