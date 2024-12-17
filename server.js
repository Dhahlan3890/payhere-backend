const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Verify PayHere signature
const verifyPayhereSignature = (payload, signature) => {
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
  const computedSignature = crypto
    .createHmac('md5', merchantSecret)
    .update(Buffer.from(payload, 'utf-8'))
    .digest('base64');
  
  return computedSignature === signature;
};

// PayHere notification handler
app.post('/api/payment/notify', (req, res) => {
  const payload = req.body;
  const payhereSignature = req.headers['x-payhere-signature'];

  // Verify the signature
  if (!verifyPayhereSignature(JSON.stringify(payload), payhereSignature)) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Handle different payment statuses
  switch (payload.status_code) {
    case 2: // Success
      console.log('Payment successful:', {
        orderId: payload.order_id,
        paymentId: payload.payment_id,
        amount: payload.payhere_amount,
        status: 'SUCCESS'
      });
      
      // TODO: Update your database with subscription details
      // - Store payment information
      // - Update user's subscription status
      // - Send confirmation email
      break;

    case -2: // Failed
      console.log('Payment failed:', {
        orderId: payload.order_id,
        paymentId: payload.payment_id,
        status: 'FAILED'
      });
      break;

    case -3: // Charged Back
      console.log('Payment charged back:', {
        orderId: payload.order_id,
        paymentId: payload.payment_id,
        status: 'CHARGED_BACK'
      });
      // TODO: Handle subscription cancellation
      break;

    default:
      console.log('Unknown status:', payload.status_code);
  }

  res.status(200).json({ status: 'Notification received' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});