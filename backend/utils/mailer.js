// backend/utils/mailer.js
import nodemailer from "nodemailer";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE,
  MAIL_FROM,
  SMTP_FROM,
} = process.env;

const FROM = MAIL_FROM || SMTP_FROM || "no-reply@hy-moda.local";

export const transporter =
  SMTP_HOST && SMTP_PORT
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT || 587),
        secure: String(
          SMTP_SECURE ?? (String(SMTP_PORT) === "465" ? "true" : "false")
        )
          .toLowerCase()
          .includes("true"),
        auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
      })
    : null;

export const isMailEnabled = !!transporter;

export async function sendMail({
  to,
  subject,
  html,
  text,
  replyTo,
  bcc,
  from,
}) {
  if (!to) throw new Error("Missing recipient 'to'");
  if (!transporter) {
    console.warn("[mail] SMTP not configured; skipping send to:", to);
    return { messageId: "disabled-dev", skipped: true };
  }
  const info = await transporter.sendMail({
    from: from || FROM,
    to,
    subject,
    html,
    text,
    replyTo,
    bcc,
  });
  return info;
}
