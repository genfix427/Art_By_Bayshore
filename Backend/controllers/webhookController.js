import express from 'express';
import stripe from '../config/stripe.js';
import Order from '../models/Order.js';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';
dotenv.config();


// @desc    Handle Stripe webhooks
// @route   POST /api/v1/webhooks/stripe
// @access  Public (Stripe)
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    logger.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;

      case 'customer.created':
        logger.info(`Customer created: ${event.data.object.id}`);
        break;

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error(`Webhook handler failed: ${error.message}`);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};

// Handle successful payment
const handlePaymentIntentSucceeded = async (paymentIntent) => {
  logger.info(`Payment succeeded: ${paymentIntent.id}`);

  const order = await Order.findOne({ paymentIntentId: paymentIntent.id });

  if (order) {
    order.paymentStatus = 'paid';
    order.stripeChargeId = paymentIntent.latest_charge;
    await order.save();

    logger.info(`Order ${order.orderNumber} payment confirmed`);
  }
};

// Handle failed payment
const handlePaymentIntentFailed = async (paymentIntent) => {
  logger.error(`Payment failed: ${paymentIntent.id}`);

  const order = await Order.findOne({ paymentIntentId: paymentIntent.id });

  if (order) {
    order.paymentStatus = 'failed';
    await order.save();

    logger.info(`Order ${order.orderNumber} payment failed`);
  }
};

// Handle refund
const handleChargeRefunded = async (charge) => {
  logger.info(`Charge refunded: ${charge.id}`);

  const order = await Order.findOne({ stripeChargeId: charge.id });

  if (order) {
    const refundAmount = charge.amount_refunded / 100;
    const isFullRefund = charge.amount_refunded === charge.amount;

    order.paymentStatus = isFullRefund ? 'refunded' : 'partially-refunded';
    
    if (!order.refundDetails) {
      order.refundDetails = {};
    }
    
    order.refundDetails.amount = refundAmount;
    order.refundDetails.refundedAt = new Date();
    
    await order.save();

    logger.info(`Order ${order.orderNumber} refunded: $${refundAmount}`);
  }
};