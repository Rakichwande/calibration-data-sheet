// Sends the calibration sheet PDF through Brevo's HTTPS API (not SMTP).
// Railway blocks outbound SMTP ports on Free/Trial/Hobby plans, but HTTPS works everywhere.
//
// Env vars:
//   BREVO_API_KEY  - from Brevo: SMTP & API -> API Keys (starts with "xkeysib-")
//   EMAIL_FROM     - "Lab Name <verified-sender@example.com>" (sender must be verified in Brevo)

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

function parseAddress(value) {
  const match = /^\s*(.*?)\s*<(.+)>\s*$/.exec(value || '');
  if (match) return { name: match[1].replace(/^"|"$/g, '') || undefined, email: match[2].trim() };
  return { email: (value || '').trim() };
}

function parseList(value) {
  return (value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((email) => ({ email }));
}

async function sendSheetEmail({ to, cc, sheetNo, partyName, pdfBuffer }) {
  if (!process.env.BREVO_API_KEY) {
    throw new Error('Email not configured — set BREVO_API_KEY in the environment');
  }
  if (!process.env.EMAIL_FROM) {
    throw new Error('Email not configured — set EMAIL_FROM in the environment');
  }

  const payload = {
    sender: parseAddress(process.env.EMAIL_FROM),
    to: parseList(to),
    subject: `Calibration Data Sheet ${sheetNo}${partyName ? ` — ${partyName}` : ''}`,
    textContent: `Attached is the calibration data sheet ${sheetNo}.`,
    attachment: [
      {
        name: `calibration-sheet-${sheetNo}.pdf`,
        content: pdfBuffer.toString('base64'),
      },
    ],
  };

  const ccList = parseList(cc);
  if (ccList.length > 0) payload.cc = ccList;

  const res = await fetch(BREVO_URL, {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20000), // never hang the request for more than 20s
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Brevo API error ${res.status}`);
  }
}

module.exports = { sendSheetEmail };