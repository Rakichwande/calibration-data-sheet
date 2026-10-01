const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST) {
    throw new Error('SMTP not configured — set SMTP_HOST, SMTP_USER, SMTP_PASS in the environment');
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
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
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
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
