import Razorpay from "razorpay";
import config from "../config/config.js";

const razorpay = new Razorpay({
  key_id: config.razorpay.keyId || "rzp_test_placeholder",
  key_secret: config.razorpay.keySecret || "placeholder_secret",
});

export default razorpay;
