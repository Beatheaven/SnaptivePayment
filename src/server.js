import express, { Router } from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import crypto from 'crypto';
import ServerlessHttp from 'serverless-http';

const api = express();


api.use(bodyParser.json());

const SERVER_KEY = "SB-Mid-server-CbJg1WEzeYmzPhzSH4WICQY_";
const CLIENT_KEY = "SB-Mid-client-Ye8zF-MGRfrnuAUv";
const password = '';

const router = Router()
api.post('/generateQR', async (req, res) => {
  try {
    const { order_id, gross_amount } = req.body;

    const chargeResponse = await axios.post('https://api.sandbox.midtrans.com/v2/charge', {
      payment_type: 'qris',
      transaction_details: {
        order_id,
        gross_amount
      }
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${SERVER_KEY}`).toString('base64')}`,
        //'X-Override-Notification': 'https://example.com'
      }
    });

    if (!chargeResponse.data.status_code === "201") {
      throw new Error(`Failed to generate QR code: ${chargeResponse.statusText}`);
    }

    const qrCodeURL = chargeResponse.data.actions.find(action => action.name === 'generate-qr-code').url;
    console.log({ qrCodeURL });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).send('Error generating QR code');
  }
});

api.post('/midtransNotification', async (req, res) => {
  try {
    const receivedSignatureKey = req.headers['signature-key'];
    const requestBody = JSON.stringify(req.body);
    const expectedSignatureKey = crypto
      .createHmac('sha512', CLIENT_KEY)
      .update(requestBody)
      .digest('hex');

    if (receivedSignatureKey !== expectedSignatureKey) {
      console.error('Invalid signature key');
      return res.status(400).json({ error: 'Invalid signature key' });
    }

    const {
      transaction_status,
      fraud_status,
      order_id,
      transaction_id
    } = req.body;

    console.log('Received notification for transaction:', transaction_id);
    console.log('Transaction status:', transaction_status);
    console.log('Fraud status:', fraud_status);

    if (transaction_status === 'settlement' && fraud_status === 'accept') {
      console.log('Payment successful for order:', order_id);
    } else if (transaction_status === 'expire' && fraud_status === 'accept') {
      console.log('Payment expired for order:', order_id);
    }

    res.status(200).send('Notification received');
  } catch (error) {
    console.error('Error handling notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


api.use(".netlify/functions/api", router);

module.exports.handler = serverless(api);