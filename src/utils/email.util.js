// const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     type: "OAuth2",
//     user: process.env.EMAIL_FROM,
//     clientId: process.env.GOOGLE_CLIENT_ID,
//     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//     refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
//   },
// });

// async function sendEmail({ to, subject, html }) {
//   await transporter.sendMail({
//     from: `"Aaditya Banking" <${process.env.EMAIL_FROM}>`,
//     to,
//     subject,
//     html,
//   });
// }


const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail({ to, subject, html }) {
  const { data, error } = await resend.emails.send({
    from: "Aaditya Banking <onboarding@resend.dev>",
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

function buildEmailTemplate({ name, message, rows }) {
  const rowsHtml = rows
    .map(
      (row, i) => `
      <tr style="background-color: ${i % 2 === 0 ? "#f5f5f5" : "#ffffff"};">
        <td style="padding: 10px; border: 1px solid #ddd;"><strong>${row.label}</strong></td>
        <td style="padding: 10px; border: 1px solid #ddd; ${row.color ? `color: ${row.color};` : ""}">${row.value}</td>
      </tr>`
    )
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h1 style="color: #1a1a2e; border-bottom: 2px solid #1a1a2e; padding-bottom: 10px;">Aaditya Banking</h1>
      <p style="font-size: 16px;">Hi <strong>${name}</strong>,</p>
      <p style="font-size: 15px; color: #333;">${message}</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">${rowsHtml}</table>
      <p style="font-size: 12px; color: #999; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
        This is an automated message from Aaditya Banking.
      </p>
    </div>
  `;
}

async function sendWelcomeEmail({ name, email, accountNumber }) {
  const html = buildEmailTemplate({
    name,
    message: "Welcome aboard! Your account has been created successfully.",
    rows: [
      { label: "Account Holder", value: name },
      { label: "Email", value: email },
      { label: "Account Number", value: accountNumber },
    ],
  });

  return sendEmail({ to: email, subject: "Welcome to Aaditya Banking - Account Created", html });
}

async function sendDebitEmail({ senderName, senderEmail, receiverName, receiverEmail, amount, transactionId }) {
  const html = buildEmailTemplate({
    name: senderName,
    message: "Your transfer was successful. Here are the details:",
    rows: [
      { label: "Amount Debited", value: `- ₹${amount}`, color: "#c0392b" },
      { label: "Sent To", value: `${receiverName} (${receiverEmail})` },
      { label: "Transaction ID", value: transactionId },
      { label: "Date", value: new Date().toLocaleString() },
    ],
  });

  return sendEmail({ to: senderEmail, subject: "Money Sent - Aaditya Banking", html });
}

async function sendCreditEmail({ senderName, senderEmail, receiverName, receiverEmail, amount, transactionId }) {
  const html = buildEmailTemplate({
    name: receiverName,
    message: "You've received a payment. Here are the details:",
    rows: [
      { label: "Amount Credited", value: `+ ₹${amount}`, color: "#27ae60" },
      { label: "Received From", value: `${senderName} (${senderEmail})` },
      { label: "Transaction ID", value: transactionId },
      { label: "Date", value: new Date().toLocaleString() },
    ],
  });

  return sendEmail({ to: receiverEmail, subject: "Money Received - Aaditya Banking", html });
}

module.exports = { sendEmail, sendWelcomeEmail, sendDebitEmail, sendCreditEmail };