import express, { Router } from "express"
import ServerlessHttp from "serverless-http"
import bodyParser from "body-parser"

const api = express();
const router = Router();

api.use=(bodyParser);

router.post("/generateQR", async (req, res) =>{
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

    api.use("/.netlify/functions/api", router);

    module.exports = api;
    module.exports.handler = ServerlessHttp(app);