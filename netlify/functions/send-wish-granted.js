const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const FROM_EMAIL    = 'hello@wishwall.xyz';
const FROM_NAME     = 'The Wish Wall';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: 'Invalid JSON' }; }

  const { email, wishText, name } = body;
  if (!email || !wishText) {
    return { statusCode: 400, body: 'Missing email or wishText' };
  }

  const displayName = name ? `Hi ${name},` : 'Hi there,';

  try {
    const res = await fetch(BREVO_API_URL, {
      method:  'POST',
      headers: {
        'api-key':      process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender:      { name: FROM_NAME, email: FROM_EMAIL },
        to:          [{ email }],
        subject:     '🌟 Your wish has been granted!',
        htmlContent: `
          <p>${displayName}</p>
          <p>We have incredible news — your wish has been granted! 🎉</p>
          <blockquote style="border-left:4px solid #a78bfa;padding-left:12px;color:#555;">
            "${wishText}"
          </blockquote>
          <p>Someone believed in your wish and made it happen. We hope this brings you joy.</p>
          <p>With love,<br>The Wish Wall team 💜</p>
        `,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Brevo error:', res.status, text);
      return { statusCode: 502, body: 'Failed to send email' };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('send-wish-granted error:', err);
    return { statusCode: 500, body: 'Internal error' };
  }
};
