import { sendWelcomeEmail, sendOrderConfirmation } from './services/emailService';

const runEmailTest = async () => {
  console.log("🚀 Starting Email Test...");

  const testEmail = "deetechcomputers01@gmail.com";
  const testName = "Tech Support Test";

  // 1. Test Welcome Email
  const welcome = await sendWelcomeEmail(testEmail, testName);
  console.log("Welcome Test Status:", welcome.success ? "✅ Success" : "❌ Failed");

  // 2. Mock Order Data
  const mockOrder = {
    customerName: testName,
    orderId: "ORD-2025-XYZ",
    total: 1250.50,
    items: [
      { name: "HP EliteBook 840 G5", quantity: 1, price: 850.00 },
      { name: "Logitech Wireless Mouse", quantity: 2, price: 200.25 }
    ],
    shippingAddress: "Block G, Kumasi Hive, Ashanti Region, Ghana",
    paymentMethod: "Mobile Money (MTN)",
    deliveryEstimate: "24-48 Hours"
  };

  // 3. Test Order Confirmation
  const order = await sendOrderConfirmation(testEmail, mockOrder);
  console.log("Order Test Status:", order.success ? "✅ Success" : "❌ Failed");
};