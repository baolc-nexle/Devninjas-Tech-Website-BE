import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import { stripe } from "../config/stripe.js";
import OrderDetail from "../models/OrderDetail.js";
import * as stockService from "../services/stockService.js";
import * as inventoryService from "../services/inventoryService.js";
import * as crypto from "crypto";
import axios from "axios";
import { finalizeVoucher } from "./voucher.js";

// checkout gateway Stripe for international

export const createStripeCheckoutSession = async (orderId) => {
  console.log("DEBUG: Nhận được orderId:", orderId);
  const order = await Order.findById(orderId);
  console.log("DEBUG: Order tìm được từ DB:", order ? "Đã tìm thấy" : "KHÔNG TÌM THẤY");

  if (!order) throw new Error("Order không tồn tại");

  // LOG QUAN TRỌNG: Kiểm tra cấu trúc metadata trước khi gửi
  // Bổ sung thêm orderCode vào metadata để webhook dễ dàng định danh hơn
  const metadataToSent = { 
    orderId: orderId.toString(),
    orderCode: order.orderCode // Bổ sung mới
  };
  console.log("DEBUG: Metadata chuẩn bị gửi cho Stripe:", metadataToSent);
  console.log("DEBUG: Độ dài metadata:", JSON.stringify(metadataToSent).length);

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
      orderId: orderId.toString(),
      orderCode: order.orderCode, // 🔥 Bổ sung: để dùng trong webhook sau này
    },

    // 🔥 Bổ sung: Thay đổi URL để hiển thị orderCode thay vì orderId
    success_url: `${process.env.CLIENT_URL}/checkout/success?order_id=${order.orderCode}`,
    cancel_url: `${process.env.CLIENT_URL}/cancel`,
  });

  return session.url;
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
    // BỔ SUNG: Ném lỗi để Express Controller nhận biết và trả về status 400
    throw new Error(`Webhook Error: ${err.message}`);
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
    // BỔ SUNG: Dùng Promise.all để xử lý song song, nhanh hơn và không bị block
    await Promise.all(
      items.map(async (item) => {
        console.log("➡️ CONFIRM STOCK:", item.variantId);
        await inventoryService.confirmStock(item.variantId, item.quantity);
        console.log("✅ DONE:", item.variantId);
      })
    );

    // 🔥 3. update payment
    await Payment.findOneAndUpdate(
      { orderId },
      {
        status: "success",
        transactionId: session.payment_intent, // Lưu thêm transaction ID để đối soát
        method: "stripe",                      // BỔ SUNG: Ghi rõ phương thức
      },
      { upsert: true },
    );

    // 🔥 4. update order
    order.paymentStatus = "paid";
    order.status = "processing";
    order.paidAt = new Date();

    await order.save();
    if (order.voucherId) {
      await finalizeVoucher(
        order.voucherId,
        order._id,
        order.userId
      );
    }
    console.log("🎉 ORDER UPDATED SUCCESS:", order.orderCode);
  } catch (err) {
    console.error("❌ WEBHOOK PROCESS ERROR:", err.message);
    // BỔ SUNG: Ném lại lỗi để Stripe biết cần gửi lại (Retry) webhook nếu có lỗi database
    throw err; 
  }
};

export const createCODPayment = async (orderId) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Order không tồn tại");
  }

  if (order.paymentStatus === "paid") {
    throw new Error("Order đã thanh toán");
  }

  const items = await OrderDetail.find({ orderId });

  if (!items.length) {
    throw new Error("Order không có sản phẩm");
  }

  // confirm stock luôn vì khách đã đặt hàng
  for (const item of items) {
    await inventoryService.confirmStock(
      item.variantId,
      item.quantity
    );
  }

  const payment = await Payment.create({
    orderId,
    method: "cod",
    status: "pending",
    amount: order.totalPrice,
  });

  order.paymentMethod = "COD";
  order.status = "processing";
  order.paymentStatus = "unpaid";

  await order.save();

  return payment;
};
