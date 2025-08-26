// backend/mailer.js
import nodemailer from "nodemailer";

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_SECURE } =
  process.env;

export const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT || 587),
  secure: String(SMTP_SECURE || "false") === "true", // true للمنفذ 465
  auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

export async function sendMail({ to, subject, html, text }) {
  if (!to) throw new Error("Missing recipient");
  const info = await transporter.sendMail({
    from: SMTP_FROM || "no-reply@hymoda.local",
    to,
    subject,
    text,
    html,
  });
  return info;
}
