import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import { stripe } from "../config/stripe.js";
import OrderDetail from "../models/OrderDetail.js";
import * as stockService from "../services/stockService.js";
import * as crypto from "crypto";
import axios from "axios";

// checkout gateway Stripe for international
export const createStripeCheckoutSession = async (orderId) => {
  const order = await Order.findById(orderId);

  if (!order) throw new Error("Order không tồn tại");

  if (order.paymentStatus === "paid") {
    throw new Error("Order đã được thanh toán");
  }

  // 👉 lấy items từ OrderDetail
  const items = await OrderDetail.find({ orderId });

  if (!items.length) {
    throw new Error("Order không có sản phẩm");
  }
  const EXCHANGE_RATE = 24000;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",

    line_items: items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round((item.price / EXCHANGE_RATE) * 100),
      },
      quantity: item.quantity,
    })),

    metadata: {
      orderId: orderId.toString(), // 🔥 quan trọng để webhook map lại
    },

    success_url: `${process.env.CLIENT_URL}/success`,
    cancel_url: `${process.env.CLIENT_URL}/cancel`,
  });

  return session;
};

export const handleStripeWebhook = async (rawBody, headers) => {
  console.log("🔥 WEBHOOK HIT");

  const sig = headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("❌ Webhook verify fail:", err.message);
    return;
  }

  console.log("EVENT TYPE:", event.type);

  // ✅ CHỈ xử lý đúng 1 event duy nhất
  if (event.type !== "checkout.session.completed") {
    console.log("⏭️ SKIP EVENT");
    return;
  }

  const session = event.data.object;
  const orderId = session?.metadata?.orderId;

  if (!orderId) {
    console.log("❌ Missing orderId");
    return;
  }

  console.log("ORDER ID:", orderId);

  const order = await Order.findById(orderId);

  if (!order) {
    console.log("❌ Order not found");
    return;
  }

  // ✅ chống chạy lại nhiều lần (idempotent)
  if (order.paymentStatus === "paid") {
    console.log("⚠️ Order already paid → skip");
    return;
  }

  try {
    // 🔥 1. lấy items
    const items = await OrderDetail.find({ orderId });
    console.log("ITEMS COUNT:", items.length);

    if (!items.length) {
      console.log("❌ No order items found");
      return;
    }

    // 🔥 2. confirm stock
    for (const item of items) {
      console.log("➡️ CONFIRM STOCK:", item.variantId);

      await stockService.confirmStock(item.variantId, item.quantity);

      console.log("✅ DONE:", item.variantId);
    }

    // 🔥 3. update payment
    await Payment.findOneAndUpdate(
      { orderId },
      {
        status: "success",
        transactionId: session.payment_intent,
      },
      { upsert: true },
    );

    // 🔥 4. update order
    order.paymentStatus = "paid";
    order.status = "processing";
    order.paidAt = new Date();

    await order.save();

    console.log("🎉 ORDER UPDATED SUCCESS");
  } catch (err) {
    console.error("❌ WEBHOOK PROCESS ERROR:", err.message);
  }
};

// checkout MOMO
// =========================
// CREATE MOMO PAYMENT
// =========================
export const createMomoPayment = async (orderId) => {
  const order = await Order.findById(orderId);

  if (!order) throw new Error("Order không tồn tại");

  if (order.paymentStatus === "paid") {
    throw new Error("Order đã thanh toán");
  }

  const partnerCode = process.env.MOMO_PARTNER_CODE;
  const accessKey = process.env.MOMO_ACCESS_KEY;
  const secretKey = process.env.MOMO_SECRET_KEY;

  const requestId = partnerCode + new Date().getTime();

  // 🔥 QUAN TRỌNG: dùng orderId thật
  const momoOrderId = order._id.toString();

  const amount = order.totalPrice.toString(); // VND
  const orderInfo = `Thanh toán đơn hàng ${order._id}`;

  const redirectUrl = `${process.env.CLIENT_URL}/success`;
  const ipnUrl = `https://headgear-confining-punisher.ngrok-free.dev/api/payments/momo/webhook`;

  const requestType = "captureWallet";
  const extraData = "";

  // =========================
  // SIGNATURE
  // =========================
  const rawSignature =
    `accessKey=${accessKey}` +
    `&amount=${amount}` +
    `&extraData=${extraData}` +
    `&ipnUrl=${ipnUrl}` +
    `&orderId=${momoOrderId}` +
    `&orderInfo=${orderInfo}` +
    `&partnerCode=${partnerCode}` +
    `&redirectUrl=${redirectUrl}` +
    `&requestId=${requestId}` +
    `&requestType=${requestType}`;

  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");

  const requestBody = {
    partnerCode,
    accessKey,
    requestId,
    amount,
    orderId: momoOrderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    extraData,
    requestType,
    signature,
    lang: "vi",
  };

  const response = await axios.post(
    "https://test-payment.momo.vn/v2/gateway/api/create",
    requestBody,
  );

  // =========================
  // SAVE PAYMENT SESSION
  // =========================
  await Payment.findOneAndUpdate(
    { orderId },
    {
      provider: "momo",
      status: "pending",
      transactionId: momoOrderId,
    },
    { upsert: true },
  );
  console.log("REQUEST BODY:", requestBody);
  console.log("REQUEST BODY:", response.data);
  return response.data;
};

// =========================
// HANDLE MOMO WEBHOOK (IPN)
// =========================
export const handleMomoWebhook = async (req) => {
  const data = req.body;

  const { orderId, resultCode, message, transId, signature } = data;

  // =========================
  // VERIFY SIGNATURE (QUAN TRỌNG)
  // =========================
  const secretKey = process.env.MOMO_SECRET_KEY;

  const rawSignature =
    `accessKey=${data.accessKey}` +
    `&amount=${data.amount}` +
    `&extraData=${data.extraData}` +
    `&message=${message}` +
    `&orderId=${orderId}` +
    `&orderInfo=${data.orderInfo}` +
    `&orderType=${data.orderType}` +
    `&partnerCode=${data.partnerCode}` +
    `&payType=${data.payType}` +
    `&requestId=${data.requestId}` +
    `&responseTime=${data.responseTime}` +
    `&resultCode=${resultCode}` +
    `&transId=${transId}`;

  const checkSignature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");

  if (checkSignature !== signature) {
    throw new Error("Invalid MoMo signature");
  }

  const order = await Order.findById(orderId);

  if (!order) throw new Error("Order không tồn tại");

  // chống duplicate webhook
  if (order.paymentStatus === "paid") return true;

  // =========================
  // SUCCESS
  // =========================
  if (resultCode === 0) {
    await Payment.findOneAndUpdate(
      { orderId },
      {
        status: "success",
        transactionId: transId,
      },
    );

    order.paymentStatus = "paid";
    order.status = "processing";
    order.paidAt = new Date();

    await order.save();
  }

  // =========================
  // FAILED
  // =========================
  else {
    await Payment.findOneAndUpdate(
      { orderId },
      {
        status: "failed",
      },
    );
  }

  return true;
};
