const express = require("express");
const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const axios = require('axios');  // Importing axios
const router = express.Router();

const app = express();

app.use(bodyParser.json());

const SERVER_KEY = "SB-Mid-server-CbJg1WEzeYmzPhzSH4WICQY_";
const CLIENT_KEY = "SB-Mid-client-Ye8zF-MGRfrnuAUv";

router.get('', (req, res) => {
    res.send('Snaptive Payment API');
});

router.post('/generateQR', async (req, res) => {
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
                'Authorization': `Basic ${Buffer.from(`${SERVER_KEY}:`).toString('base64')}`,  // Correctly base64 encode with a colon
                //'X-Override-Notification': 'https://example.com'
            }
        });

        if (chargeResponse.data.status_code !== "201") {  // Correctly check the status code
            throw new Error(`Failed to generate QR code: ${chargeResponse.statusText}`);
        }

        const qrCodeAction = chargeResponse.data.actions.find(action => action.name === 'generate-qr-code');
        if (!qrCodeAction) {
            throw new Error('QR code generation action not found in response');
        }

        const qrCodeURL = qrCodeAction.url;
        res.json({ qrCodeURL });  // Send the QR code URL back to the client
    } catch (error) {
        console.error('Error generating QR code:', error);
        res.status(500).send('Error generating QR code');
    }
});

app.use('/.netlify/functions/api', router);
module.exports.handler = serverless(app);
