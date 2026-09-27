const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST) {
    // No SMTP configured yet — fail loudly and clearly rather than silently no-op,
    // so a missing .env value doesn't look like a successful send.
    throw new Error('SMTP not configured — set SMTP_HOST, SMTP_USER, SMTP_PASS in .env');
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false, // STARTTLS on 587 — standard for Brevo and most SMTP relays
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

async function sendSheetEmail({ to, cc, sheetNo, partyName, pdfBuffer }) {
  const t = getTransporter();

  await t.sendMail({
    from: process.env.EMAIL_FROM || 'reports@example.com',
    to,
    cc: cc || undefined,
    subject: `Calibration Data Sheet ${sheetNo}${partyName ? ` — ${partyName}` : ''}`,
    text: `Attached is the calibration data sheet ${sheetNo}.`,
    attachments: [
      {
        filename: `calibration-sheet-${sheetNo}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
}

module.exports = { sendSheetEmail };
