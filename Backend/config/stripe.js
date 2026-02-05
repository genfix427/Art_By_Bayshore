import Stripe from 'stripe';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';
dotenv.config();

const stripeMode = process.env.STRIPE_MODE || 'test';
const stripeKey = stripeMode === 'live' 
  ? process.env.STRIPE_SECRET_KEY_LIVE 
  : process.env.STRIPE_SECRET_KEY_TEST;

if (!stripeKey) {
  logger.error('Stripe API key not configured');
  throw new Error('Stripe API key is required');
}

const stripe = new Stripe(stripeKey, {
  apiVersion: '2023-10-16',
  typescript: false,
});

logger.info(`Stripe initialized in ${stripeMode} mode`);

export default stripe;