import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const FROM = `"Shop V2" <${process.env.GMAIL_USER}>`;

// ── Shared layout ──────────────────────────────────────────────

function emailLayout(content: string) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; padding: 12px 20px; background: linear-gradient(135deg, #a855f7, #ec4899); border-radius: 16px;">
          <span style="color: white; font-size: 20px; font-weight: bold;">Shop V2</span>
        </div>
      </div>
      ${content}
      <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          &copy; ${new Date().getFullYear()} Shop V2. All rights reserved.
        </p>
      </div>
    </div>
  `;
}

// ── OTP Email ──────────────────────────────────────────────────

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

  const html = emailLayout(`
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
  `);

  await transporter.sendMail({ from: FROM, to, subject, html });
}

// ── Types ──────────────────────────────────────────────────────

type OrderItemEmail = {
  name: string;
  quantity: number;
  price: number;
  variantLabel?: string;
};

type OrderEmailData = {
  orderNumber: string;
  orderId: string;
  items: OrderItemEmail[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  discountAmount: number;
  total: number;
  address?: {
    name: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  } | null;
};

// ── Helpers ────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return `$${amount.toFixed(2)}`;
}

function orderUrl(orderId: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/orders/${orderId}`;
}

function shortOrderNumber(orderNumber: string) {
  return orderNumber.slice(-8).toUpperCase();
}

function itemsTableHtml(items: OrderItemEmail[]) {
  const rows = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
          <span style="color: #1f2937; font-size: 14px; font-weight: 500;">${item.name}</span>
          ${item.variantLabel ? `<br/><span style="color: #9ca3af; font-size: 12px;">${item.variantLabel}</span>` : ""}
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; text-align: center; color: #6b7280; font-size: 14px;">
          x${item.quantity}
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; text-align: right; color: #1f2937; font-size: 14px; font-weight: 500;">
          ${formatCurrency(item.price * item.quantity)}
        </td>
      </tr>`
    )
    .join("");

  return `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
      <thead>
        <tr>
          <th style="text-align: left; padding: 8px 0; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 12px; text-transform: uppercase;">Item</th>
          <th style="text-align: center; padding: 8px 0; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 12px; text-transform: uppercase;">Qty</th>
          <th style="text-align: right; padding: 8px 0; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 12px; text-transform: uppercase;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function totalsHtml(order: OrderEmailData) {
  let html = `
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 4px 0; color: #6b7280; font-size: 14px;">Subtotal</td>
        <td style="padding: 4px 0; text-align: right; color: #1f2937; font-size: 14px;">${formatCurrency(order.subtotal)}</td>
      </tr>`;

  if (order.discountAmount > 0) {
    html += `
      <tr>
        <td style="padding: 4px 0; color: #16a34a; font-size: 14px;">Discount</td>
        <td style="padding: 4px 0; text-align: right; color: #16a34a; font-size: 14px;">-${formatCurrency(order.discountAmount)}</td>
      </tr>`;
  }

  html += `
      <tr>
        <td style="padding: 4px 0; color: #6b7280; font-size: 14px;">Shipping</td>
        <td style="padding: 4px 0; text-align: right; color: #1f2937; font-size: 14px;">${order.shippingCost === 0 ? "Free" : formatCurrency(order.shippingCost)}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: #6b7280; font-size: 14px;">Tax</td>
        <td style="padding: 4px 0; text-align: right; color: #1f2937; font-size: 14px;">${formatCurrency(order.tax)}</td>
      </tr>
      <tr>
        <td style="padding: 12px 0 0; color: #1f2937; font-size: 16px; font-weight: bold; border-top: 2px solid #e5e7eb;">Total</td>
        <td style="padding: 12px 0 0; text-align: right; color: #7c3aed; font-size: 16px; font-weight: bold; border-top: 2px solid #e5e7eb;">${formatCurrency(order.total)}</td>
      </tr>
    </table>`;

  return html;
}

function addressHtml(address: NonNullable<OrderEmailData["address"]>) {
  return `
    <div style="background: #f9fafb; border-radius: 12px; padding: 16px; margin-top: 16px;">
      <p style="color: #6b7280; font-size: 12px; text-transform: uppercase; margin: 0 0 8px; font-weight: 600;">Shipping Address</p>
      <p style="color: #1f2937; font-size: 14px; margin: 0; line-height: 1.6;">
        ${address.name}<br/>
        ${address.street}<br/>
        ${address.city}, ${address.state} ${address.zipCode}<br/>
        ${address.country}
      </p>
    </div>
  `;
}

function viewOrderButton(orderId: string) {
  return `
    <div style="text-align: center; margin-top: 24px;">
      <a href="${orderUrl(orderId)}" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #a855f7, #ec4899); color: white; text-decoration: none; border-radius: 12px; font-size: 14px; font-weight: 600;">
        View Order
      </a>
    </div>
  `;
}

// ── Welcome Email ──────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string) {
  const html = emailLayout(`
    <h2 style="color: #1f2937; text-align: center; margin-bottom: 8px;">Welcome to Shop V2!</h2>
    <p style="color: #6b7280; text-align: center; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
      Hi <strong>${name}</strong>, thanks for creating an account. We're excited to have you on board!
    </p>
    <div style="background: #f9fafb; border-radius: 12px; padding: 20px; text-align: center;">
      <p style="color: #4b5563; font-size: 14px; margin: 0 0 16px; line-height: 1.6;">
        Start exploring our products and enjoy your shopping experience.
      </p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #a855f7, #ec4899); color: white; text-decoration: none; border-radius: 12px; font-size: 14px; font-weight: 600;">
        Start Shopping
      </a>
    </div>
  `);

  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Welcome to Shop V2!",
    html,
  });
}

// ── Order Confirmation Email ───────────────────────────────────

export async function sendOrderConfirmationEmail(
  to: string,
  order: OrderEmailData,
) {
  const displayNumber = shortOrderNumber(order.orderNumber);

  let content = `
    <h2 style="color: #1f2937; text-align: center; margin-bottom: 4px;">Order Confirmed!</h2>
    <p style="color: #6b7280; text-align: center; font-size: 14px; margin-bottom: 24px;">
      Thank you for your order <strong>#${displayNumber}</strong>
    </p>
    ${itemsTableHtml(order.items)}
    ${totalsHtml(order)}
  `;

  if (order.address) {
    content += addressHtml(order.address);
  }

  content += viewOrderButton(order.orderId);

  const html = emailLayout(content);

  await transporter.sendMail({
    from: FROM,
    to,
    subject: `Order Confirmed #${displayNumber} - Shop V2`,
    html,
  });
}

// ── Shipping Update Email ──────────────────────────────────────

export async function sendShippingUpdateEmail(
  to: string,
  orderNumber: string,
  orderId: string,
) {
  const displayNumber = shortOrderNumber(orderNumber);

  const html = emailLayout(`
    <h2 style="color: #1f2937; text-align: center; margin-bottom: 8px;">Your Order Has Shipped!</h2>
    <p style="color: #6b7280; text-align: center; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
      Great news! Order <strong>#${displayNumber}</strong> is on its way to you.
    </p>
    <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 16px;">
      <p style="color: #166534; font-size: 14px; margin: 0;">
        You can track your delivery in real-time from your order page.
      </p>
    </div>
    ${viewOrderButton(orderId)}
  `);

  await transporter.sendMail({
    from: FROM,
    to,
    subject: `Order #${displayNumber} Shipped - Shop V2`,
    html,
  });
}

// ── Delivery Confirmation Email ────────────────────────────────

export async function sendDeliveryConfirmationEmail(
  to: string,
  orderNumber: string,
  orderId: string,
) {
  const displayNumber = shortOrderNumber(orderNumber);

  const html = emailLayout(`
    <h2 style="color: #1f2937; text-align: center; margin-bottom: 8px;">Your Order Has Been Delivered!</h2>
    <p style="color: #6b7280; text-align: center; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
      Order <strong>#${displayNumber}</strong> has arrived at the destination.
    </p>
    <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 16px;">
      <p style="color: #166534; font-size: 14px; margin: 0;">
        We hope you enjoy your purchase! If you have any questions, feel free to reach out.
      </p>
    </div>
    ${viewOrderButton(orderId)}
  `);

  await transporter.sendMail({
    from: FROM,
    to,
    subject: `Order #${displayNumber} Delivered - Shop V2`,
    html,
  });
}
