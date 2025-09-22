import express, { Request, Response } from 'express';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const PAYU_BASE_URL = process.env.PAYU_BASE_URL!;
const MERCHANT_KEY = process.env.PAYU_MERCHANT_KEY!;
const MERCHANT_SALT = process.env.PAYU_MERCHANT_SALT!;

router.post('/payu/initiate', (req: Request, res: Response) => {
  const { amount, productinfo, firstname, email, phone, txnid } = req.body;

  const hashString = `${MERCHANT_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${MERCHANT_SALT}`;
  const hash = crypto.createHash('sha512').update(hashString).digest('hex');

  const payload = {
    key: MERCHANT_KEY,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    phone,
    surl: `${req.protocol}://${req.get('host')}/api/payu/success`,
    furl: `${req.protocol}://${req.get('host')}/api/payu/failure`,
    hash,
    service_provider: 'payu_paisa',
  };

  res.json({
    success: true,
    payuUrl: PAYU_BASE_URL,
    data: payload,
  });
});

router.post('/payu/success', (req, res) => {
  // Handle successful payment here
  res.send('Payment success');
});

router.post('/payu/failure', (req, res) => {
  // Handle failed payment here
  res.send('Payment failed');
});

export default router;
