import crypto from "crypto";

const MOMO_CONFIG = {
  partnerCode: process.env.MOMO_PARTNER_CODE!,
  accessKey: process.env.MOMO_ACCESS_KEY!,
  secretKey: process.env.MOMO_SECRET_KEY!,
  apiEndpoint:
    process.env.MOMO_API_ENDPOINT ||
    "https://test-payment.momo.vn/v2/gateway/api",
};

function sign(rawSignature: string): string {
  return crypto
    .createHmac("sha256", MOMO_CONFIG.secretKey)
    .update(rawSignature)
    .digest("hex");
}

export function verifyMomoSignature(body: Record<string, unknown>): boolean {
  const {
    accessKey,
    amount,
    extraData,
    message,
    orderId,
    orderInfo,
    orderType,
    partnerCode,
    payType,
    requestId,
    responseTime,
    resultCode,
    transId,
    signature,
  } = body as Record<string, string>;

  const rawSignature = [
    `accessKey=${accessKey}`,
    `amount=${amount}`,
    `extraData=${extraData}`,
    `message=${message}`,
    `orderId=${orderId}`,
    `orderInfo=${orderInfo}`,
    `orderType=${orderType}`,
    `partnerCode=${partnerCode}`,
    `payType=${payType}`,
    `requestId=${requestId}`,
    `responseTime=${responseTime}`,
    `resultCode=${resultCode}`,
    `transId=${transId}`,
  ].join("&");

  return sign(rawSignature) === signature;
}

export async function createMomoPayment(options: {
  orderId: string;
  orderInfo: string;
  amount: number;
  returnUrl: string;
  notifyUrl: string;
  requestType: "captureWallet" | "payWithATM";
}): Promise<{
  payUrl?: string;
  deeplink?: string;
  qrCodeUrl?: string;
  resultCode?: number;
  message?: string;
}> {
  const requestId = `${MOMO_CONFIG.partnerCode}-${Date.now()}`;

  const rawSignature = [
    `accessKey=${MOMO_CONFIG.accessKey}`,
    `amount=${options.amount}`,
    `extraData=`,
    `ipnUrl=${options.notifyUrl}`,
    `orderId=${options.orderId}`,
    `orderInfo=${options.orderInfo}`,
    `partnerCode=${MOMO_CONFIG.partnerCode}`,
    `redirectUrl=${options.returnUrl}`,
    `requestId=${requestId}`,
    `requestType=${options.requestType}`,
  ].join("&");

  const signature = sign(rawSignature);

  const body = {
    partnerCode: MOMO_CONFIG.partnerCode,
    partnerName: "Shop V2",
    storeId: MOMO_CONFIG.partnerCode,
    requestId,
    amount: options.amount,
    orderId: options.orderId,
    orderInfo: options.orderInfo,
    redirectUrl: options.returnUrl,
    ipnUrl: options.notifyUrl,
    lang: "vi",
    extraData: "",
    requestType: options.requestType,
    signature,
  };

  const response = await fetch(`${MOMO_CONFIG.apiEndpoint}/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return response.json();
}
