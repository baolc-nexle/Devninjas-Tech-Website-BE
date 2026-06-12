import * as paymentService from "../services/paymentService.js";

// =========================
// CREATE CHECKOUT SESSION
// =========================
export const createStripePayment = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "Thiếu orderId" });
    }

    const session = await paymentService.createStripeCheckoutSession(orderId);

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =========================
// STRIPE WEBHOOK
// =========================
export const stripeWebhook = async (req, res) => {
  console.log("🔥 WEBHOOK HIT");

  try {
    await paymentService.handleStripeWebhook(req.body, req.headers);

    return res.json({ received: true });
  } catch (err) {
    console.log("❌ WEBHOOK ERROR:", err.message);
    return res.status(400).send(err.message);
  }
};

// =========================
// CREATE MOMO PAYMENT
// =========================
export const createMomoPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "Thiếu orderId" });
    }

    const momo = await paymentService.createMomoPayment(orderId);

    res.json({
      payUrl: momo.payUrl, // 🔥 link thanh toán
    });
  } catch (err) {
    console.error("Create MoMo Error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// =========================
// MOMO WEBHOOK (IPN)
// =========================
export const momoWebhook = async (req, res) => {
  try {
    await paymentService.handleMomoWebhook(req.body);

    // ⚠️ MoMo yêu cầu trả về 200 OK
    res.status(200).json({ message: "Received" });
  } catch (err) {
    console.error("MoMo Webhook Error:", err.message);

    // vẫn nên trả 200 để MoMo không spam lại
    res.status(200).json({ message: "Error handled" });
  }
};
