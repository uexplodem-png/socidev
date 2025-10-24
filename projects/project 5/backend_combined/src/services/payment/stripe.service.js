import Stripe from 'stripe';
import { ApiError } from '../../utils/ApiError.js';
import logger from '../../config/logger.js';

export class StripeService {
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  async createPaymentIntent(amount, currency = 'usd', metadata = {}) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        clientSecret: paymentIntent.client_secret,
        id: paymentIntent.id
      };
    } catch (error) {
      logger.error('Stripe payment intent creation failed:', error);
      throw new ApiError(500, 'Payment processing failed');
    }
  }

  async confirmPayment(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        return {
          status: 'completed',
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          paymentMethod: paymentIntent.payment_method_types[0]
        };
      }

      return {
        status: paymentIntent.status,
        error: paymentIntent.last_payment_error?.message
      };
    } catch (error) {
      logger.error('Stripe payment confirmation failed:', error);
      throw new ApiError(500, 'Payment confirmation failed');
    }
  }

  async createRefund(paymentIntentId, amount) {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: Math.round(amount * 100)
      });

      return {
        id: refund.id,
        status: refund.status,
        amount: refund.amount / 100
      };
    } catch (error) {
      logger.error('Stripe refund creation failed:', error);
      throw new ApiError(500, 'Refund processing failed');
    }
  }

  async handleWebhook(payload, signature) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object);
          break;
        case 'charge.refunded':
          await this.handleRefund(event.data.object);
          break;
      }

      return { received: true };
    } catch (error) {
      logger.error('Stripe webhook handling failed:', error);
      throw new ApiError(400, 'Webhook handling failed');
    }
  }

  private async handlePaymentSuccess(paymentIntent) {
    // Implement payment success handling
    logger.info('Payment succeeded:', paymentIntent.id);
  }

  private async handlePaymentFailure(paymentIntent) {
    // Implement payment failure handling
    logger.error('Payment failed:', paymentIntent.id);
  }

  private async handleRefund(charge) {
    // Implement refund handling
    logger.info('Refund processed:', charge.id);
  }
}