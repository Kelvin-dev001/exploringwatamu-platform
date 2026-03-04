const axios = require('axios');
const Payment = require('../models/Payment');
const GroupBooking = require('../models/GroupBooking');
const GroupTrip = require('../models/GroupTrip');

const MPESA_BASE = process.env.MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

async function getMpesaToken() {
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  const auth = Buffer.from(`${key}:${secret}`).toString('base64');
  const res = await axios.get(`${MPESA_BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  return res.data.access_token;
}

function getTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

// POST /api/mpesa/stkpush
exports.stkPush = async (req, res) => {
  try {
    const { bookingId, phone, amount } = req.body;
    if (!bookingId || !phone || !amount) {
      return res.status(400).json({ error: 'bookingId, phone, and amount are required.' });
    }

    const booking = await GroupBooking.findById(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    const shortcode = process.env.MPESA_SHORTCODE || '174379';
    const passkey = process.env.MPESA_PASSKEY || '';
    const timestamp = getTimestamp();
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

    const token = await getMpesaToken();

    const stkPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.ceil(amount),
      PartyA: phone,
      PartyB: shortcode,
      PhoneNumber: phone,
      CallBackURL: process.env.MPESA_CALLBACK_URL || 'https://yourdomain.com/api/mpesa/callback',
      AccountReference: `GroupTrip-${bookingId}`,
      TransactionDesc: 'Group Trip Payment',
    };

    const stkRes = await axios.post(`${MPESA_BASE}/mpesa/stkpush/v1/processrequest`, stkPayload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const { CheckoutRequestID, MerchantRequestID } = stkRes.data;

    const payment = new Payment({
      booking: booking._id,
      user: req.user._id,
      phone,
      amount: Math.ceil(amount),
      checkoutRequestId: CheckoutRequestID,
      merchantRequestId: MerchantRequestID,
      status: 'pending',
    });
    await payment.save();

    res.json({ success: true, checkoutRequestId: CheckoutRequestID, message: 'STK push sent.' });
  } catch (err) {
    console.error('STK push error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to initiate M-Pesa payment.', details: err.response?.data || err.message });
  }
};

// POST /api/mpesa/callback — M-Pesa webhook (no auth)
exports.mpesaCallback = async (req, res) => {
  try {
    const body = req.body;
    const stkCallback = body?.Body?.stkCallback;
    if (!stkCallback) return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

    const payment = await Payment.findOne({ checkoutRequestId: CheckoutRequestID });
    if (!payment) {
      console.warn('[mpesa callback] Payment not found for checkoutRequestId:', CheckoutRequestID);
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    payment.resultCode = ResultCode;
    payment.resultDesc = ResultDesc;

    if (ResultCode === 0) {
      // Extract metadata
      const items = CallbackMetadata?.Item || [];
      const getItem = (name) => (items.find(i => i.Name === name) || {}).Value;
      const receiptNumber = getItem('MpesaReceiptNumber');
      const transactionDate = String(getItem('TransactionDate') || '');

      payment.status = 'completed';
      payment.mpesaReceiptNumber = receiptNumber;
      payment.transactionDate = transactionDate;
      await payment.save();

      // Update booking
      const booking = await GroupBooking.findById(payment.booking);
      if (booking) {
        booking.status = 'confirmed';
        booking.mpesaReceiptNumber = receiptNumber;
        await booking.save();

        // Atomic slot increment with race condition prevention
        const tripForSlot = await GroupTrip.findById(booking.trip);
        if (tripForSlot) {
          const updatedTrip = await GroupTrip.findOneAndUpdate(
            { _id: booking.trip, confirmedParticipants: { $lt: tripForSlot.maxParticipants } },
            { $inc: { confirmedParticipants: 1 } },
            { new: true }
          );

          if (!updatedTrip) {
            // Fallback: try a direct increment regardless (trip might already be full)
            console.warn('[mpesa callback] Atomic slot update returned null — trip may be full. Attempting direct update.');
            const trip = await GroupTrip.findById(booking.trip);
            if (trip) {
              if (trip.confirmedParticipants < trip.maxParticipants) {
                trip.confirmedParticipants += 1;
                if (trip.confirmedParticipants >= trip.maxParticipants) {
                  trip.status = 'full';
                }
                await trip.save();
              } else {
                console.warn('[mpesa callback] Trip is genuinely full. Booking confirmed but slot not incremented.');
              }
            }
          } else {
            // Check if trip is now full after increment
            if (updatedTrip.confirmedParticipants >= updatedTrip.maxParticipants) {
              await GroupTrip.findByIdAndUpdate(updatedTrip._id, { status: 'full' });
            }
          }
        }

        // TODO: Send confirmation email
        console.log('Email would be sent to:', booking.email);
      }
    } else {
      payment.status = 'failed';
      await payment.save();

      const booking = await GroupBooking.findById(payment.booking);
      if (booking) {
        booking.status = 'cancelled';
        await booking.save();
      }
    }

    res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    console.error('M-Pesa callback error:', err);
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
};

// POST /api/mpesa/query — Query M-Pesa transaction status (authUser required)
exports.queryTransaction = async (req, res) => {
  try {
    const { checkoutRequestId } = req.body;
    if (!checkoutRequestId) return res.status(400).json({ error: 'checkoutRequestId is required.' });

    const shortcode = process.env.MPESA_SHORTCODE || '174379';
    const passkey = process.env.MPESA_PASSKEY || '';
    const timestamp = getTimestamp();
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

    const token = await getMpesaToken();

    const queryRes = await axios.post(
      `${MPESA_BASE}/mpesa/stkpushquery/v1/query`,
      {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    res.json(queryRes.data);
  } catch (err) {
    console.error('M-Pesa query error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to query transaction.', details: err.response?.data || err.message });
  }
};
