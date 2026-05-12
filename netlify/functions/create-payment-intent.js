const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: 'Invalid JSON' }; }

  const { amount, wishId, donorName, donorEmail, anonymous } = body;

  if (!amount || typeof amount !== 'number' || amount < 50) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid amount (minimum 50 cents)' }) };
  }

  const clientRef = wishId
    ? (wishId === 'community_pot' ? 'community_pot' : 'grant_' + wishId)
    : '';

  const metadata = clientRef ? { wishId, client_reference_id: clientRef } : {};
  if (donorName)  metadata.name      = String(donorName).slice(0, 200);
  if (anonymous)  metadata.anonymous = 'true';

  try {
    const intentParams = {
      amount:   Math.round(amount),
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
    };
    if (Object.keys(metadata).length) intentParams.metadata = metadata;
    if (donorEmail) intentParams.receipt_email = String(donorEmail).slice(0, 200);

    const paymentIntent = await stripe.paymentIntents.create(intentParams);

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
