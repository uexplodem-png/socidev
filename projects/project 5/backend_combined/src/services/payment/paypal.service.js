import paypal from '@paypal/checkout-server-sdk';
import { ApiError } from '../../utils/ApiError.js';
import logger from '../../config/logger.js';

export class PayPalService {
  constructor() {
    const environment = process.env.NODE_ENV === 'production'
      ? new paypal.core.LiveEnvironment(
          process.env.PAYPAL_CLIENT_ID,
          process.env.PAYPAL_CLIENT_SECRET
        )
      : new paypal.core.SandboxEnvironment(
          process.env.PAYPAL_CLIENT_ID,
          process.env.PAYPAL_CLIENT_SECRET
        );

    this.client = new paypal.core.PayPalHttpClient(environment);
  }

  async createOrder(amount, currency = 'USD', metadata = {}) {
    try {
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer("return=representation");
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency,
            value: amount.toFixed(2)
          },
          custom_id: metadata.orderId,
          description: metadata.description
        }]
      });

      const order = await this.client.execute(request);
      return {
        id: order.result.id,
        status: order.result.status,
        links: order.result.links
      };
    } catch (error) {
      logger.error('PayPal order creation failed:', error);
      throw new ApiError(500, 'Payment processing failed');
    }
  }

  async captureOrder(orderId) {
    try {
      const request = new paypal.orders.OrdersCaptureRequest(orderId);
      const capture = await this.client.execute(request);

      return {
        id: capture.result.id,
        status: capture.result.status,
        amount: capture.result.purchase_units[0].payments.captures[0].amount.value
      };
    } catch (error) {
      logger.error('PayPal order capture failed:', error);
      throw new ApiError(500, 'Payment capture failed');
    }
  }

  async createRefund(captureId, amount) {
    try {
      const request = new paypal.payments.CapturesRefundRequest(captureId);
      request.requestBody({
        amount: {
          value: amount.toFixed(2),
          currency_code: 'USD'
        }
      });

      const refund = await this.client.execute(request);
      return {
        id: refund.result.id,
        status: refund.result.status
      };
    } catch (error) {
      logger.error('PayPal refund creation failed:', error);
      throw new ApiError(500, 'Refund processing failed');
    }
  }

  async handleWebhook(payload) {
    try {
      const event = JSON.parse(payload);
      
      switch (event.event_type) {
        case 'PAYMENT.CAPTURE.COMPLETED':
          await this.handlePaymentSuccess(event.resource);
          break;
        case 'PAYMENT.CAPTURE.DENIED':
          await this.handlePaymentFailure(event.resource);
          break;
        case 'PAYMENT.CAPTURE.REFUNDED':
          await this.handleRefund(event.resource);
          break;
      }

      return { received: true };
    } catch (error) {
      logger.error('PayPal webhook handling failed:', error);
      throw new ApiError(400, 'Webhook handling failed');
    }
  }

  private async handlePaymentSuccess(resource) {
    // Implement payment success handling
    logger.info('Payment succeeded:', resource.id);
  }

  private async handlePaymentFailure(resource) {
    // Implement payment failure handling
    logger.error('Payment failed:', resource.id);
  }

  private async handleRefund(resource) {
    // Implement refund handling
    logger.info('Refund processed:', resource.id);
  }
}