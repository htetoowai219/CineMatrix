import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

let transporter: Transporter | null = null;
let warnedMissingConfig = false;

const getTransporter = (): Transporter | null => {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST) {
    if (!warnedMissingConfig) {
      console.warn(
        "[mailer] SMTP_HOST is not configured; booking emails are disabled. " +
          "Set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS to enable.",
      );
      warnedMissingConfig = true;
    }
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Number(SMTP_PORT || 587) === 465,
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
  return transporter;
};

type BookingEmailArgs = {
  to: string;
  name: string;
  status: "confirmed" | "rejected" | "cancelled";
  movieTitle: string;
  cinemaName: string;
  roomName: string;
  startTime: Date;
  seats: string[];
  totalPrice: number;
};

const STATUS_COPY: Record<BookingEmailArgs["status"], { subject: string; heading: string; tone: string }> = {
  confirmed: {
    subject: "Your CineMatrix booking is confirmed",
    heading: "Booking Confirmed",
    tone: "Your tickets are ready. Show your booking reference at the cinema to collect them.",
  },
  rejected: {
    subject: "Your CineMatrix booking was rejected",
    heading: "Booking Rejected",
    tone: "We're sorry — the cinema could not confirm your booking and the seats have been released.",
  },
  cancelled: {
    subject: "Your CineMatrix booking was cancelled",
    heading: "Booking Cancelled",
    tone: "Your booking was cancelled and the seats have been released back to availability.",
  },
};

export const sendBookingStatusEmail = async (args: BookingEmailArgs): Promise<void> => {
  const transport = getTransporter();
  if (!transport) return;

  const copy = STATUS_COPY[args.status];
  const time = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(args.startTime));

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
      <div style="background:#0f172a;color:#fff;padding:24px 28px;border-radius:12px 12px 0 0">
        <h1 style="margin:0;font-size:20px">${copy.heading}</h1>
        <p style="margin:6px 0 0;font-size:13px;opacity:.8">CineMatrix · ${args.cinemaName}</p>
      </div>
      <div style="border:1px solid #e2e8f0;border-top:0;padding:24px 28px;border-radius:0 0 12px 12px">
        <p>Hi ${args.name},</p>
        <p>${copy.tone}</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:6px 0;color:#64748b">Movie</td><td style="padding:6px 0;font-weight:600">${args.movieTitle}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Cinema</td><td style="padding:6px 0;font-weight:600">${args.cinemaName}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Room</td><td style="padding:6px 0;font-weight:600">${args.roomName}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Showtime</td><td style="padding:6px 0;font-weight:600">${time}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Seats</td><td style="padding:6px 0;font-weight:600">${args.seats.join(", ")}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Total</td><td style="padding:6px 0;font-weight:600">$${args.totalPrice.toFixed(2)}</td></tr>
        </table>
        <p style="font-size:12px;color:#94a3b8;margin-top:20px">This is an automated message — please don't reply to this email.</p>
      </div>
    </div>`;

  await transport.sendMail({
    from: process.env.EMAIL_FROM || "CineMatrix <no-reply@cinematrix.app>",
    to: args.to,
    subject: copy.subject,
    html,
  });
};
