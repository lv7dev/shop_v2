import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendOtpEmail(
  to: string,
  otp: string,
  type: "registration" | "password_reset",
) {
  const subject =
    type === "registration"
      ? "Verify your email - Shop V2"
      : "Password reset code - Shop V2";

  const heading =
    type === "registration" ? "Verify Your Email" : "Reset Your Password";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 420px; margin: 0 auto; padding: 32px 24px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; padding: 12px 20px; background: linear-gradient(135deg, #a855f7, #ec4899); border-radius: 16px;">
          <span style="color: white; font-size: 20px; font-weight: bold;">Shop V2</span>
        </div>
      </div>
      <h2 style="color: #1f2937; text-align: center; margin-bottom: 8px;">${heading}</h2>
      <p style="color: #6b7280; text-align: center; font-size: 14px; margin-bottom: 24px;">
        Use the code below to ${type === "registration" ? "verify your email address" : "reset your password"}
      </p>
      <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 20px; background: #f3f4f6; border-radius: 16px; margin: 0 0 24px; color: #7c3aed;">
        ${otp}
      </div>
      <p style="color: #9ca3af; font-size: 13px; text-align: center; line-height: 1.5;">
        This code expires in <strong>5 minutes</strong>.<br/>
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Shop V2" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}
