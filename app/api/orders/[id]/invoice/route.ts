import { NextRequest, NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import { getSession } from "@/lib/auth";
import { getOrderById } from "@/services/orders";
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/constants";

function fmt(amount: number, currency: string = "USD") {
  if (currency === "VND") return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const order = await getOrderById(id, session.userId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  // ── Header ──────────────────────────────────────────
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(124, 58, 237); // purple-600
  doc.text("Shop V2", margin, y);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128); // gray-500
  doc.text("INVOICE", pageWidth - margin, y, { align: "right" });
  y += 12;

  // ── Order info ──────────────────────────────────────
  const displayNumber = order.orderNumber.slice(-8).toUpperCase();
  const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  doc.setFontSize(10);
  doc.setTextColor(55, 65, 81); // gray-700
  doc.setFont("helvetica", "bold");
  doc.text(`Order #${displayNumber}`, margin, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128);
  doc.text(`Date: ${orderDate}`, pageWidth - margin, y, { align: "right" });
  y += 6;
  doc.text(
    `Status: ${ORDER_STATUS_LABELS[order.status] ?? order.status}`,
    margin,
    y
  );
  doc.text(
    `Payment: ${PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}`,
    pageWidth - margin,
    y,
    { align: "right" }
  );
  y += 4;

  // ── Divider ─────────────────────────────────────────
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ── Customer info ───────────────────────────────────
  if (order.user) {
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text("BILL TO", margin, y);
    y += 5;
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    doc.setFont("helvetica", "bold");
    doc.text(order.user.name ?? "Customer", margin, y);
    doc.setFont("helvetica", "normal");
    y += 5;
    doc.text(order.user.email, margin, y);
    y += 4;
  }

  // Shipping address on the right
  if (order.address) {
    const addrX = pageWidth / 2 + 10;
    let addrY = y - (order.user ? 14 : 0);
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text("SHIP TO", addrX, addrY);
    addrY += 5;
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    doc.setFont("helvetica", "bold");
    doc.text(order.address.name, addrX, addrY);
    doc.setFont("helvetica", "normal");
    addrY += 5;
    doc.text(order.address.street, addrX, addrY);
    addrY += 5;
    doc.text(
      `${order.address.city}, ${order.address.state} ${order.address.zipCode}`,
      addrX,
      addrY
    );
    addrY += 5;
    doc.text(order.address.country, addrX, addrY);
    if (order.address.phone) {
      addrY += 5;
      doc.text(order.address.phone, addrX, addrY);
    }
    y = Math.max(y, addrY) + 4;
  }

  y += 4;

  // ── Divider ─────────────────────────────────────────
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ── Items table header ──────────────────────────────
  const colItem = margin;
  const colQty = margin + contentWidth * 0.55;
  const colPrice = margin + contentWidth * 0.7;
  const colTotal = pageWidth - margin;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(107, 114, 128);
  doc.text("ITEM", colItem, y);
  doc.text("QTY", colQty, y);
  doc.text("PRICE", colPrice, y);
  doc.text("TOTAL", colTotal, y, { align: "right" });
  y += 3;
  doc.setDrawColor(229, 231, 235);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // ── Items ───────────────────────────────────────────
  doc.setFontSize(10);
  doc.setTextColor(55, 65, 81);

  for (const item of order.items) {
    // Check if we need a new page
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    doc.setFont("helvetica", "normal");
    const name = item.product.name;
    // Truncate long names
    const displayName = name.length > 40 ? name.slice(0, 37) + "..." : name;
    doc.text(displayName, colItem, y);
    doc.text(String(item.quantity), colQty, y);
    doc.text(fmt(Number(item.price), order.currency), colPrice, y);
    doc.text(
      fmt(Number(item.price) * item.quantity, order.currency),
      colTotal,
      y,
      { align: "right" }
    );
    y += 7;
  }

  y += 2;
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ── Totals ──────────────────────────────────────────
  const labelX = pageWidth - margin - 60;
  const valueX = pageWidth - margin;

  function addTotalLine(
    label: string,
    value: string,
    bold = false,
    color?: [number, number, number]
  ) {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 11 : 10);
    if (color) {
      doc.setTextColor(...color);
    } else {
      doc.setTextColor(55, 65, 81);
    }
    doc.text(label, labelX, y);
    doc.text(value, valueX, y, { align: "right" });
    y += 6;
  }

  addTotalLine("Subtotal", fmt(Number(order.subtotal), order.currency));

  if (Number(order.discountAmount) > 0) {
    const discountLabel = order.discountCode
      ? `Discount (${order.discountCode})`
      : "Discount";
    addTotalLine(
      discountLabel,
      `-${fmt(Number(order.discountAmount), order.currency)}`,
      false,
      [22, 163, 74] // green-600
    );
  }

  addTotalLine(
    "Shipping",
    Number(order.shippingCost) === 0
      ? "Free"
      : fmt(Number(order.shippingCost), order.currency)
  );
  addTotalLine("Tax", fmt(Number(order.tax), order.currency));

  y += 2;
  doc.setDrawColor(124, 58, 237);
  doc.setLineWidth(1);
  doc.line(labelX, y, pageWidth - margin, y);
  y += 6;
  addTotalLine("Total", fmt(Number(order.total), order.currency), true, [
    124, 58, 237,
  ]);

  // ── Order note ──────────────────────────────────────
  if (order.note) {
    y += 6;
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text("ORDER NOTES", margin, y);
    y += 5;
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    doc.setFont("helvetica", "normal");
    const noteLines = doc.splitTextToSize(order.note, contentWidth);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 5;
  }

  // ── Footer ──────────────────────────────────────────
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text(
    `Invoice generated on ${new Date().toLocaleDateString("en-US")} | Shop V2`,
    pageWidth / 2,
    footerY,
    { align: "center" }
  );

  // ── Return PDF ──────────────────────────────────────
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(pdfBuffer.byteLength),
      "Content-Disposition": `attachment; filename="invoice-${displayNumber}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
