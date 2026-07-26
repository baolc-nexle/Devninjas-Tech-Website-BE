import * as paymentService from "../services/paymentService.js";

// =========================
// CREATE CHECKOUT SESSION
// =========================
export const createStripePayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: "Thiếu orderId" });
    }

    // Nếu service của bạn trả về thẳng session.url
    const sessionUrl = await paymentService.createStripeCheckoutSession(orderId);

    res.status(200).json({ 
      success: true, 
      url: sessionUrl 
    });
  } catch (err) {
    console.error("Lỗi Stripe Controller:", err); // Log lỗi để dễ debug trên Terminal
    res.status(500).json({ success: false, message: err.message });
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

export const checkoutCOD = async (req, res) => {
  try {
    const { orderId } = req.body;

    const payment =
      await paymentService.createCODPayment(orderId);

    res.status(200).json({
      success: true,
      payment,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};
