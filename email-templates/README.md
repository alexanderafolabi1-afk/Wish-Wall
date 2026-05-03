# Email Templates

These are the three transactional email templates used by The Wish Wall via **EmailJS**.

Each file is a self-contained HTML email that can be pasted directly into an EmailJS template.

---

## Setup in EmailJS

1. Go to [emailjs.com](https://www.emailjs.com) → **Email Templates**
2. Create a **new template** for each file below
3. Set the **Template ID** to **exactly** the value shown (the code calls these IDs directly)
4. Paste the HTML from the file into the **Content** tab of each template
5. Set the **Subject** line as shown below
6. In Netlify → **Site Settings → Environment Variables**, add:
   - `EMAILJS_PUBLIC_KEY` — your EmailJS public key (Account → API Keys)
   - `EMAILJS_SERVICE_ID` — your EmailJS service ID

---

## Templates

### 1. `wisher_pinned.html`
| Field | Value |
|---|---|
| **Template ID** | `wisher_pinned` |
| **Subject** | `✨ Your wish is on the wall, {{to_name}}!` |
| **When sent** | Immediately after a wisher submits and their wish is pinned to the wall |

**Variables passed by the code:**

| Variable | Description |
|---|---|
| `{{to_email}}` | Wisher's email address |
| `{{to_name}}` | Derived from the email username (e.g. `jane` from `jane@email.com`) |
| `{{wish_text}}` | The full text of the wish |
| `{{wish_code}}` | The wisher's referral/tracking code |
| `{{wall_url}}` | `https://wishwall.xyz` |

---

### 2. `guardian_receipt.html`
| Field | Value |
|---|---|
| **Template ID** | `guardian_receipt` |
| **Subject** | `🙏 You just changed someone's life, {{to_name}}` |
| **When sent** | After a Guardian completes a Stripe payment to grant a wish |

**Variables passed by the code:**

| Variable | Description |
|---|---|
| `{{to_email}}` | Guardian's email address |
| `{{to_name}}` | Guardian's name (or `"Guardian"` if not provided) |
| `{{wish_text}}` | The text of the wish that was granted |
| `{{wall_url}}` | `https://wishwall.xyz` |
| `{{receipt_ref}}` | Auto-generated receipt reference (e.g. `WW-LCX3KABC`) |

---

### 3. `guardian_rewards.html`
| Field | Value |
|---|---|
| **Template ID** | `guardian_rewards` |
| **Subject** | `💫 You're on our Guardian list, {{guardian_name}}!` |
| **When sent** | After a Guardian saves their profile details (name, country) in the rewards panel |

**Variables passed by the code:**

| Variable | Description |
|---|---|
| `{{to_email}}` | Guardian's email address |
| `{{to_name}}` | Guardian's name (or `"Guardian"` if not provided) |
| `{{guardian_name}}` | Guardian's full name |
| `{{guardian_country}}` | Guardian's country |

---

## Design Notes

- Background: `#0a0a0a` (near-black)
- Text: `#f5f0e8` (warm off-white)
- Accent / brand colour: `#D44A1E` (burnt orange)
- All templates use inline styles and a `<table>`-based layout for maximum email client compatibility
