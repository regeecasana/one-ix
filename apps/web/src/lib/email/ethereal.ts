import nodemailer, { type Transporter } from "nodemailer";
import type { EmailMessage, EmailProvider } from "./provider";

// Lazily provisions a disposable Ethereal inbox on first send -- no account
// setup required. See docs/email-templates.md. On Vercel this re-provisions
// per cold start, which is fine for a demo (each send still logs its own
// preview URL).
let transporterPromise: Promise<Transporter> | null = null;

function getTransporter(): Promise<Transporter> {
  if (!transporterPromise) {
    transporterPromise = nodemailer.createTestAccount().then((account) =>
      nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: { user: account.user, pass: account.pass },
      })
    );
  }
  return transporterPromise;
}

export const etherealEmailProvider: EmailProvider = {
  async send(message: EmailMessage) {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: '"oneix demo" <no-reply@oneix.demo>',
      to: message.to,
      subject: message.subject,
      text: message.text,
    });
    console.log(`[email] to=${message.to} subject="${message.subject}"`);
    console.log(`[email] preview: ${nodemailer.getTestMessageUrl(info)}`);
  },
};
