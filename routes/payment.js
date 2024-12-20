const express = require('express');
const crypto = require('crypto');

const router = express.Router();

const merchant_id = '1229031';
const merchant_secret = 'MTM2MTQ1MjczMDU5NjYwOTAxNDMwNjU3NjkzNDU0Mjc0NDYy';

router.post('/start', (req, res) => {
  const { order_id, amount, currency } = req.body;
  console.log('Payment request for order:', order_id);

  // Generate the hash value
  const hash = crypto
    .createHash('md5')
    .update(
      merchant_id +
        order_id +
        amount +
        currency +
        crypto
          .createHash('md5')
          .update(merchant_secret)
          .digest('hex')
          .toUpperCase()
    )
    .digest('hex')
    .toUpperCase();

  console.log('Hash generated for order:', order_id);

  res.json({ hash, merchant_id });
});

// Payment notification endpoint
router.post('/notify', (req, res) => {
  console.log('Payment notification received');

  const {
    merchant_id,
    order_id,
    payhere_amount,
    payhere_currency,
    status_code,
    md5sig,
    plan,
  } = req.body;

  const local_md5sig = crypto
    .createHash('md5')
    .update(
      merchant_id +
        order_id +
        payhere_amount +
        payhere_currency +
        status_code +
        crypto
          .createHash('md5')
          .update(merchant_secret)
          .digest('hex')
          .toUpperCase()
    )
    .digest('hex')
    .toUpperCase();

  console.log('Payment notification for order:', order_id);
  console.log('Plan for order:', plan);

  if (local_md5sig === md5sig && status_code == '2') {
    // Payment success - update the database
    console.log('Payment successful for order:', order_id);
    res.sendStatus(200);
  } else {
    // Payment verification failed
    console.log('Payment verification failed for order:', order_id);
    res.sendStatus(400);
  }
});

module.exports = router;
