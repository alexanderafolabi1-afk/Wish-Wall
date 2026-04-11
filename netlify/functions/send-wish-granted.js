/**
 * send-wish-granted.js
 * Sends transactional emails to the wisher and (optionally) the guardian
 * when a wish is marked as granted in the admin dashboard.
 *
 * Called by: admin dashboard "Grant" action (POST /.netlify/functions/send-wish-granted)
 *
 * Env vars required (set in Netlify dashboard):
 *   RESEND_API_KEY    — re_... from resend.com
 *
 * Body params (JSON):
 *   wishId      {string}  Firestore wish document ID
 *   wisherEmail {string}  Email of the wisher
 *   wisherName  {string}  Display name (or "a community member" if anonymous)
 *   wishText    {string}  The wish content (truncated in email)
 *   grantAmount {number}  Amount granted in USD
 *   guardianName {string} (optional) Name of the guardian who granted the wish
 */
const RESEND_API_URL  = 'https://api.resend.com/emails';
const FROM_EMAIL      = 'hello@wishwall.xyz';
const PLATFORM_EMAIL  = 'admin@wallwishes.xyz';

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

  const { wisherEmail, wisherName, wishText, grantAmount, guardianName, wishId } = body;

  if (!wisherEmail || !wishText) {
    return { statusCode: 400, body: 'Missing required fields: wisherEmail, wishText' };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY not set');
    return { statusCode: 500, body: 'Email service not configured' };
  }

  const displayName    = wisherName || 'Friend';
  const truncatedWish  = wishText.length > 120 ? wishText.slice(0, 117) + '...' : wishText;
  const amountDisplay  = grantAmount ? `$${Number(grantAmount).toFixed(2)}` : 'your full wish amount';
  const grantedBy      = guardianName || 'a generous Guardian';

  // Email to wisher
  const wisherEmailPayload = {
    from:    `The Wish Wall <${FROM_EMAIL}>`,
    to:      [wisherEmail],
    subject: '\uD83C\uDF1F Your wish has been granted! \u2014 The Wish Wall',
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Your Wish Was Granted!</title>
</head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#FAF8F5;margin:0;padding:40px 20px;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(30,34,53,.1);">
  <div style="background:#D44A1E;padding:40px 40px 32px;text-align:center;">
    <div style="font-size:48px;margin-bottom:16px;">\uD83C\uDF1F</div>
    <h1 style="color:#fff;font-size:28px;margin:0;line-height:1.2;">Your wish was granted!</h1>
  </div>
  <div style="padding:40px;">
    <p style="font-size:17px;color:#1E2235;margin:0 0 20px;">Hi ${displayName},</p>
    <p style="font-size:15px;color:#6B7080;margin:0 0 20px;line-height:1.7;">
      Amazing news &mdash; ${grantedBy} has granted your wish! ${amountDisplay} will be sent to you shortly.
    </p>
    <div style="background:#EEE9E2;border-left:4px solid #D44A1E;border-radius:4px;padding:16px 20px;margin:24px 0;">
      <p style="font-size:13px;color:#6B7080;margin:0 0 6px;text-transform:uppercase;letter-spacing:1px;">Your wish</p>
      <p style="font-size:15px;color:#1E2235;margin:0;font-style:italic;">&ldquo;${truncatedWish}&rdquo;</p>
    </div>
    <p style="font-size:15px;color:#6B7080;margin:20px 0;line-height:1.7;">
      We will be in touch within <strong>2 business days</strong> to arrange your payout via bank transfer or PayPal.
      Please keep an eye on your inbox (and spam folder).
    </p>
    <p style="font-size:15px;color:#6B7080;margin:20px 0;line-height:1.7;">
      Want to pay it forward? Visit <a href="https://wishwall.xyz" style="color:#D44A1E;">wishwall.xyz</a> and become a Guardian yourself.
    </p>
    <p style="font-size:14px;color:#6B7080;margin:32px 0 0;">With warmth,<br><strong style="color:#1E2235;">The Wish Wall Team</strong></p>
  </div>
  <div style="padding:20px 40px;background:#EEE9E2;font-size:12px;color:#6B7080;text-align:center;">
    &copy; 2024 The Wish Wall &middot; <a href="https://wishwall.xyz" style="color:#D44A1E;">wishwall.xyz</a>
    &middot; <a href="mailto:${PLATFORM_EMAIL}" style="color:#D44A1E;">Contact us</a>
    &middot; Wish ID: ${wishId || 'N/A'}
  </div>
</div>
</body>
</html>`,
  };

  try {
    const res = await fetch(RESEND_API_URL, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify(wisherEmailPayload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Resend API error (wisher email):', errText);
      return { statusCode: 502, body: 'Failed to send email' };
    }

    const result = await res.json();
    console.log('Wish-granted email sent. Resend ID:', result.id);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, emailId: result.id }),
    };
  } catch (err) {
    console.error('send-wish-granted error:', err);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};
