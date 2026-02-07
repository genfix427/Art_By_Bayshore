import sgMail from '@sendgrid/mail';
import logger from '../utils/logger.js';

// Initialize SendGrid
if (!process.env.SENDGRID_API_KEY) {
  console.warn("⚠️ SENDGRID_API_KEY is missing. Emails disabled.");
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log("✅ SendGrid initialized successfully.");
}

class EmailService {
  constructor() {
    this.from = {
      email: process.env.SENDGRID_FROM_EMAIL || 'bayshoredesigncenter@gmail.com',
      name: process.env.SENDGRID_FROM_NAME || 'Art By Bayshore',
    };
    this.ownerEmail = process.env.OWNER_EMAIL || 'bayshoredesigncenter@gmail.com';
    this.companyName = process.env.COMPANY_NAME || 'Art By Bayshore';
    this.companyAddress = process.env.COMPANY_ADDRESS || '1717 N Bayshore Dr 121, Miami, FL 33132';
    this.supportEmail = process.env.SUPPORT_EMAIL || 'bayshoredesigncenter@gmail.com';
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    this.adminUrl = process.env.ADMIN_URL || 'http://localhost:5173/admin';
  }

  async send(to, subject, html, text = null) {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        logger.warn(`Email not sent (SendGrid not configured): ${subject} to ${to}`);
        return { success: false, error: 'SendGrid not configured' };
      }

      const msg = {
        to,
        from: this.from,
        subject,
        html,
        text: text || this.stripHtml(html),
      };

      const result = await sgMail.send(msg);
      logger.info(`Email sent successfully to ${to}`);
      return { success: true, messageId: result[0].headers['x-message-id'] };
    } catch (error) {
      logger.error(`Email sending failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async sendMultiple(emails) {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        logger.warn('Bulk emails not sent (SendGrid not configured)');
        return { success: false, error: 'SendGrid not configured' };
      }

      const result = await sgMail.send(emails);
      logger.info(`Bulk emails sent successfully: ${emails.length} recipients`);
      return { success: true, count: emails.length };
    } catch (error) {
      logger.error(`Bulk email sending failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>?/gm, '');
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  }

  formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  // Base email template wrapper
  getEmailWrapper(content, preheader = '') {
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>${this.companyName}</title>
          <!--[if mso]>
          <style type="text/css">
            table {border-collapse: collapse;}
            .fallback-font {font-family: Arial, sans-serif;}
          </style>
          <![endif]-->
        </head>
        <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden;">${preheader}</div>` : ''}
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 20px 10px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse;">
                  ${content}
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  // Generate invoice HTML
  generateInvoiceHtml(order, user, isOwnerCopy = false) {
    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 15px 10px; border-bottom: 1px solid #E5E7EB; vertical-align: top;">
          <table role="presentation" style="border-collapse: collapse;">
            <tr>
              ${item.image ? `
                <td style="padding-right: 15px; vertical-align: top;">
                  <img src="${item.image}" alt="${item.title}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 4px; display: block;">
                </td>
              ` : ''}
              <td style="vertical-align: top;">
                <p style="margin: 0; font-weight: 600; color: #111827; font-size: 15px;">${item.title}</p>
                ${item.dimensions && item.dimensions.length ? `
                  <p style="margin: 5px 0 0; font-size: 13px; color: #6B7280;">
                    Size: ${item.dimensions.length}" × ${item.dimensions.width}"
                  </p>
                ` : ''}
                <p style="margin: 5px 0 0; font-size: 13px; color: #6B7280;">Qty: ${item.quantity}</p>
              </td>
            </tr>
          </table>
        </td>
        <td style="padding: 15px 10px; border-bottom: 1px solid #E5E7EB; text-align: right; vertical-align: top; font-weight: 600; color: #111827; font-size: 15px;">
          ${this.formatCurrency(item.price * item.quantity)}
        </td>
      </tr>
    `).join('');

    const content = `
      <!-- Header -->
      <tr>
        <td style="background-color: #111827; padding: 35px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 26px; letter-spacing: 3px; font-weight: 300;">
            ${this.companyName.toUpperCase()}
          </h1>
          <p style="color: #9CA3AF; margin: 10px 0 0; font-size: 13px; letter-spacing: 1px;">
            Fine Art & Curated Collections
          </p>
        </td>
      </tr>

      <!-- Main Content -->
      <tr>
        <td style="background-color: #ffffff; padding: 40px 30px;">
          
          ${isOwnerCopy ? `
            <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
              <tr>
                <td style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px;">
                  <p style="margin: 0; color: #92400E; font-weight: 600; font-size: 15px;">
                    🔔 NEW ORDER RECEIVED
                  </p>
                  <p style="margin: 8px 0 0; color: #92400E; font-size: 14px;">
                    Customer: ${user.firstName} ${user.lastName} (${user.email})
                  </p>
                </td>
              </tr>
            </table>
          ` : ''}

          <!-- Thank You -->
          <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 35px;">
            <tr>
              <td style="text-align: center;">
                <h2 style="color: #111827; margin: 0 0 10px; font-size: 24px; font-weight: 600;">
                  ${isOwnerCopy ? 'New Order Received!' : 'Thank You for Your Order!'}
                </h2>
                <p style="color: #6B7280; margin: 0; font-size: 16px;">
                  ${isOwnerCopy
        ? 'A new order has been placed and is ready for processing.'
        : 'Your order has been confirmed and is being processed.'
      }
                </p>
              </td>
            </tr>
          </table>

          <!-- Order Info Box -->
          <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px; background-color: #F9FAFB; border-radius: 8px;">
            <tr>
              <td style="padding: 25px;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="width: 50%; padding-bottom: 15px; vertical-align: top;">
                      <p style="margin: 0 0 5px; font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 1px;">
                        Order Number
                      </p>
                      <p style="margin: 0; font-size: 18px; font-weight: 700; color: #111827;">
                        ${order.orderNumber}
                      </p>
                    </td>
                    <td style="width: 50%; padding-bottom: 15px; vertical-align: top;">
                      <p style="margin: 0 0 5px; font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 1px;">
                        Order Date
                      </p>
                      <p style="margin: 0; font-size: 16px; color: #374151;">
                        ${this.formatDate(order.createdAt)}
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="width: 50%; vertical-align: top;">
                      <p style="margin: 0 0 5px; font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 1px;">
                        Payment Status
                      </p>
                      <p style="margin: 0; font-size: 16px; color: #059669; font-weight: 600;">
                        ✓ ${order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                      </p>
                    </td>
                    <td style="width: 50%; vertical-align: top;">
                      <p style="margin: 0 0 5px; font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 1px;">
                        Order Status
                      </p>
                      <p style="margin: 0; font-size: 16px; color: #374151;">
                        ${order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Invoice Title -->
          <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
            <tr>
              <td style="border-bottom: 2px solid #111827; padding-bottom: 10px;">
                <h3 style="margin: 0; color: #111827; font-size: 18px; letter-spacing: 2px; font-weight: 600;">
                  INVOICE
                </h3>
              </td>
            </tr>
          </table>

          <!-- Addresses -->
          <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <tr>
              <td style="width: 50%; padding-right: 15px; vertical-align: top;">
                <p style="margin: 0 0 12px; color: #111827; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                  Bill To
                </p>
                <p style="margin: 0; color: #374151; line-height: 1.7; font-size: 14px;">
                  <strong>${user.firstName} ${user.lastName}</strong><br>
                  ${user.email}<br>
                  ${user.phoneNumber || order.shippingAddress.phoneNumber || ''}
                </p>
              </td>
              <td style="width: 50%; padding-left: 15px; vertical-align: top;">
                <p style="margin: 0 0 12px; color: #111827; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                  Ship To
                </p>
                <p style="margin: 0; color: #374151; line-height: 1.7; font-size: 14px;">
                  <strong>${order.shippingAddress.fullName}</strong><br>
                  ${order.shippingAddress.addressLine1}<br>
                  ${order.shippingAddress.addressLine2 ? order.shippingAddress.addressLine2 + '<br>' : ''}
                  ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
                  ${order.shippingAddress.country || 'United States'}
                </p>
              </td>
            </tr>
          </table>

          <!-- Order Items -->
          <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
            <tr style="background-color: #111827;">
              <td style="padding: 14px 10px; color: #ffffff; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                Item
              </td>
              <td style="padding: 14px 10px; color: #ffffff; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; text-align: right; font-weight: 600;">
                Total
              </td>
            </tr>
            ${itemsHtml}
          </table>

          <!-- Totals -->
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="width: 60%;"></td>
              <td style="width: 40%;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Subtotal</td>
                    <td style="padding: 8px 0; text-align: right; color: #374151; font-size: 14px;">${this.formatCurrency(order.subtotal)}</td>
                  </tr>
                  ${order.discount > 0 ? `
                    <tr>
                      <td style="padding: 8px 0; color: #059669; font-size: 14px;">
                        Discount ${order.couponUsed?.code ? `(${order.couponUsed.code})` : ''}
                      </td>
                      <td style="padding: 8px 0; text-align: right; color: #059669; font-size: 14px;">
                        -${this.formatCurrency(order.discount)}
                      </td>
                    </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Shipping</td>
                    <td style="padding: 8px 0; text-align: right; color: #374151; font-size: 14px;">${this.formatCurrency(order.shippingCost)}</td>
                  </tr>
                  ${order.tax > 0 ? `
                    <tr>
                      <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Tax</td>
                      <td style="padding: 8px 0; text-align: right; color: #374151; font-size: 14px;">${this.formatCurrency(order.tax)}</td>
                    </tr>
                  ` : ''}
                  <tr>
                    <td colspan="2" style="padding-top: 10px;">
                      <table role="presentation" style="width: 100%; background-color: #111827; border-collapse: collapse;">
                        <tr>
                          <td style="padding: 15px; color: #ffffff; font-weight: 700; font-size: 16px;">TOTAL</td>
                          <td style="padding: 15px; text-align: right; color: #ffffff; font-weight: 700; font-size: 18px;">${this.formatCurrency(order.total)}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          ${!isOwnerCopy ? `
            <!-- What's Next -->
            <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 35px;">
              <tr>
                <td style="background-color: #F0FDF4; border-radius: 8px; padding: 25px;">
                  <h4 style="margin: 0 0 15px; color: #166534; font-size: 16px; font-weight: 600;">
                    📦 What's Next?
                  </h4>
                  <table role="presentation" style="border-collapse: collapse;">
                    <tr><td style="color: #15803D; font-size: 14px; padding: 5px 0;">1. We're preparing your order for shipment</td></tr>
                    <tr><td style="color: #15803D; font-size: 14px; padding: 5px 0;">2. You'll receive a shipping confirmation email with tracking details</td></tr>
                    <tr><td style="color: #15803D; font-size: 14px; padding: 5px 0;">3. Your artwork will be carefully packaged and shipped</td></tr>
                    <tr><td style="color: #15803D; font-size: 14px; padding: 5px 0;">4. Estimated delivery: 5-7 business days</td></tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Track Order Button -->
            <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 30px;">
              <tr>
                <td style="text-align: center;">
                  <a href="${this.frontendUrl}/orders/${order._id}" 
                     style="display: inline-block; background-color: #111827; color: #ffffff; padding: 16px 45px; text-decoration: none; font-weight: 600; letter-spacing: 1px; font-size: 14px;">
                    TRACK YOUR ORDER
                  </a>
                </td>
              </tr>
            </table>
          ` : `
            <!-- Admin Actions -->
            <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 35px;">
              <tr>
                <td style="background-color: #EFF6FF; border-radius: 8px; padding: 25px;">
                  <h4 style="margin: 0 0 15px; color: #1E40AF; font-size: 16px; font-weight: 600;">
                    🛠️ Action Required
                  </h4>
                  <table role="presentation" style="border-collapse: collapse;">
                    <tr><td style="color: #1E3A8A; font-size: 14px; padding: 5px 0;">• Review order details</td></tr>
                    <tr><td style="color: #1E3A8A; font-size: 14px; padding: 5px 0;">• Prepare items for shipment</td></tr>
                    <tr><td style="color: #1E3A8A; font-size: 14px; padding: 5px 0;">• Create shipping label</td></tr>
                    <tr><td style="color: #1E3A8A; font-size: 14px; padding: 5px 0;">• Update order status</td></tr>
                  </table>
                  <table role="presentation" style="border-collapse: collapse; margin-top: 20px;">
                    <tr>
                      <td>
                        <a href="${this.adminUrl}/orders/${order._id}" 
                           style="display: inline-block; background-color: #1E40AF; color: #ffffff; padding: 12px 30px; text-decoration: none; font-weight: 600; font-size: 14px; border-radius: 4px;">
                          VIEW IN ADMIN PANEL
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          `}

          <!-- Contact -->
          <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 35px; border-top: 1px solid #E5E7EB;">
            <tr>
              <td style="text-align: center; padding-top: 25px;">
                <p style="margin: 0 0 8px; color: #6B7280; font-size: 14px;">Questions about your order?</p>
                <p style="margin: 0;">
                  <a href="mailto:${this.supportEmail}" style="color: #111827; font-weight: 600; text-decoration: none;">${this.supportEmail}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background-color: #111827; padding: 30px; text-align: center;">
          <p style="margin: 0 0 8px; color: #ffffff; font-size: 15px; font-weight: 600;">
            ${this.companyName}
          </p>
          <p style="margin: 0 0 15px; color: #9CA3AF; font-size: 13px;">
            ${this.companyAddress}
          </p>
          <p style="margin: 0; color: #6B7280; font-size: 12px;">
            © ${new Date().getFullYear()} ${this.companyName}. All rights reserved.
          </p>
        </td>
      </tr>
    `;

    return this.getEmailWrapper(content, isOwnerCopy ? 'New order received!' : 'Thank you for your order!');
  }

  // Send order confirmation to customer
  async orderConfirmationEmail(order, user) {
    const subject = `Order Confirmation - ${order.orderNumber} | ${this.companyName}`;
    const html = this.generateInvoiceHtml(order, user, false);

    const result = await this.send(user.email, subject, html);

    if (result.success) {
      logger.info(`Order confirmation email sent to customer: ${user.email}`);
    }

    return result;
  }

  // Send order notification to owner
  async orderNotificationToOwner(order, user) {
    const subject = `🛒 New Order - ${order.orderNumber} | ${this.formatCurrency(order.total)}`;
    const html = this.generateInvoiceHtml(order, user, true);

    const result = await this.send(this.ownerEmail, subject, html);

    if (result.success) {
      logger.info(`Order notification sent to owner: ${this.ownerEmail}`);
    }

    return result;
  }

  // Send both order emails
  async sendOrderEmails(order, user) {
    try {
      const customerEmailResult = await this.orderConfirmationEmail(order, user);
      const ownerEmailResult = await this.orderNotificationToOwner(order, user);

      return {
        success: true,
        customerEmail: customerEmailResult,
        ownerEmail: ownerEmailResult,
      };
    } catch (error) {
      logger.error(`Failed to send order emails: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Shipping confirmation email
  async shippingConfirmationEmail(order, user) {
    const trackingUrl = order.fedexShipment?.trackingNumber
      ? `https://www.fedex.com/fedextrack/?trknbr=${order.fedexShipment.trackingNumber}`
      : `${this.frontendUrl}/orders/${order._id}`;

    const subject = `Your Order Has Shipped! - ${order.orderNumber}`;

    const content = `
      <!-- Header -->
      <tr>
        <td style="background-color: #111827; padding: 35px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 3px; font-weight: 300;">
            ${this.companyName.toUpperCase()}
          </h1>
        </td>
      </tr>

      <!-- Main Content -->
      <tr>
        <td style="background-color: #ffffff; padding: 40px 30px;">
          
          <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <tr>
              <td style="text-align: center;">
                <div style="font-size: 60px; line-height: 1;">📦</div>
                <h2 style="color: #111827; margin: 20px 0 10px; font-size: 24px; font-weight: 600;">
                  Your Order is On Its Way!
                </h2>
                <p style="color: #6B7280; margin: 0; font-size: 16px;">
                  Great news! Your order has been shipped and is heading to you.
                </p>
              </td>
            </tr>
          </table>

          <!-- Tracking Info -->
          <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px; background-color: #F9FAFB; border-radius: 8px;">
            <tr>
              <td style="padding: 25px;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding-bottom: 15px;">
                      <p style="margin: 0 0 5px; font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 1px;">
                        Order Number
                      </p>
                      <p style="margin: 0; font-size: 16px; font-weight: 600; color: #111827;">
                        ${order.orderNumber}
                      </p>
                    </td>
                  </tr>
                  ${order.fedexShipment?.trackingNumber ? `
                    <tr>
                      <td style="padding-bottom: 15px;">
                        <p style="margin: 0 0 5px; font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 1px;">
                          Tracking Number
                        </p>
                        <p style="margin: 0; font-size: 16px; font-weight: 600; color: #111827;">
                          ${order.fedexShipment.trackingNumber}
                        </p>
                      </td>
                    </tr>
                  ` : ''}
                  ${order.fedexShipment?.estimatedDelivery ? `
                    <tr>
                      <td>
                        <p style="margin: 0 0 5px; font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 1px;">
                          Estimated Delivery
                        </p>
                        <p style="margin: 0; font-size: 16px; font-weight: 600; color: #059669;">
                          ${this.formatDate(order.fedexShipment.estimatedDelivery)}
                        </p>
                      </td>
                    </tr>
                  ` : ''}
                </table>
              </td>
            </tr>
          </table>

          <!-- Track Button -->
          <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <tr>
              <td style="text-align: center;">
                <a href="${trackingUrl}" 
                   style="display: inline-block; background-color: #111827; color: #ffffff; padding: 16px 45px; text-decoration: none; font-weight: 600; letter-spacing: 1px; font-size: 14px;">
                  TRACK YOUR PACKAGE
                </a>
              </td>
            </tr>
          </table>

          <!-- Shipping Address -->
          <table role="presentation" style="width: 100%; border-collapse: collapse; border-top: 1px solid #E5E7EB; padding-top: 25px;">
            <tr>
              <td style="padding-top: 25px;">
                <p style="margin: 0 0 12px; color: #111827; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                  Shipping To
                </p>
                <p style="margin: 0; color: #374151; line-height: 1.7; font-size: 14px;">
                  ${order.shippingAddress.fullName}<br>
                  ${order.shippingAddress.addressLine1}<br>
                  ${order.shippingAddress.addressLine2 ? order.shippingAddress.addressLine2 + '<br>' : ''}
                  ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background-color: #111827; padding: 25px; text-align: center;">
          <p style="margin: 0 0 8px; color: #ffffff; font-size: 14px; font-weight: 600;">
            ${this.companyName}
          </p>
          <p style="margin: 0; color: #9CA3AF; font-size: 12px;">
            ${this.companyAddress}
          </p>
        </td>
      </tr>
    `;

    const html = this.getEmailWrapper(content, 'Your order has shipped!');
    return this.send(user.email, subject, html);
  }

  // Owner shipment notification
  async ownerShipmentNotification(order) {
    const subject = `📦 Order Shipped - ${order.orderNumber}`;

    const html = this.getEmailWrapper(`
      <tr>
        <td style="background-color: #111827; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Order Shipped</h1>
        </td>
      </tr>
      <tr>
        <td style="background-color: #ffffff; padding: 30px;">
          <p style="margin: 0 0 15px; font-size: 16px; color: #111827;">
            <strong>Order ${order.orderNumber}</strong> has been shipped.
          </p>
          <p style="margin: 0 0 10px; font-size: 14px; color: #374151;">
            <strong>Tracking:</strong> ${order.fedexShipment?.trackingNumber || 'N/A'}
          </p>
          <p style="margin: 0 0 20px; font-size: 14px; color: #374151;">
            <strong>Service:</strong> ${order.fedexShipment?.serviceType || 'N/A'}
          </p>
          <a href="${this.adminUrl}/orders/${order._id}" 
             style="display: inline-block; background-color: #111827; color: #ffffff; padding: 12px 25px; text-decoration: none; font-size: 14px;">
            View Order
          </a>
        </td>
      </tr>
    `);

    return this.send(this.ownerEmail, subject, html);
  }

  // Delivery confirmation email
  async deliveryConfirmationEmail(order, user) {
    const subject = `Your Order Has Been Delivered! - ${order.orderNumber}`;

    const content = `
      <!-- Header -->
      <tr>
        <td style="background-color: #111827; padding: 35px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 3px; font-weight: 300;">
            ${this.companyName.toUpperCase()}
          </h1>
        </td>
      </tr>

      <!-- Main Content -->
      <tr>
        <td style="background-color: #ffffff; padding: 40px 30px; text-align: center;">
          
          <div style="font-size: 60px; line-height: 1; margin-bottom: 20px;">🎉</div>
          <h2 style="color: #111827; margin: 0 0 10px; font-size: 24px; font-weight: 600;">
            Your Order Has Been Delivered!
          </h2>
          <p style="color: #6B7280; margin: 0 0 30px; font-size: 16px;">
            We hope you love your new artwork!
          </p>

          <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <tr>
              <td style="background-color: #F0FDF4; border-radius: 8px; padding: 20px;">
                <p style="margin: 0; color: #166534; font-size: 16px;">
                  <strong>Order ${order.orderNumber}</strong> has been delivered.
                </p>
              </td>
            </tr>
          </table>

          <p style="color: #374151; font-size: 14px; line-height: 1.6; margin-bottom: 30px;">
            Thank you for shopping with ${this.companyName}. We'd love to hear about your experience!
          </p>

          <a href="${this.frontendUrl}/orders/${order._id}" 
             style="display: inline-block; background-color: #111827; color: #ffffff; padding: 16px 45px; text-decoration: none; font-weight: 600; font-size: 14px;">
            VIEW ORDER DETAILS
          </a>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background-color: #111827; padding: 25px; text-align: center;">
          <p style="margin: 0; color: #9CA3AF; font-size: 12px;">
            ${this.companyName} | ${this.companyAddress}
          </p>
        </td>
      </tr>
    `;

    const html = this.getEmailWrapper(content, 'Your order has been delivered!');
    return this.send(user.email, subject, html);
  }

  // Owner delivery notification
  async ownerDeliveryNotification(order) {
    const subject = `✅ Order Delivered - ${order.orderNumber}`;

    const html = this.getEmailWrapper(`
      <tr>
        <td style="background-color: #059669; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Order Delivered</h1>
        </td>
      </tr>
      <tr>
        <td style="background-color: #ffffff; padding: 30px;">
          <p style="margin: 0 0 15px; font-size: 16px; color: #111827;">
            <strong>Order ${order.orderNumber}</strong> has been delivered successfully.
          </p>
          <p style="margin: 0 0 20px; font-size: 14px; color: #374151;">
            Total: ${this.formatCurrency(order.total)}
          </p>
          <a href="${this.adminUrl}/orders/${order._id}" 
             style="display: inline-block; background-color: #111827; color: #ffffff; padding: 12px 25px; text-decoration: none; font-size: 14px;">
            View Order
          </a>
        </td>
      </tr>
    `);

    return this.send(this.ownerEmail, subject, html);
  }

  // Order cancellation email
  async orderCancellationEmail(order, user) {
    const subject = `Order Cancelled - ${order.orderNumber}`;

    const content = `
      <!-- Header -->
      <tr>
        <td style="background-color: #111827; padding: 35px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 3px; font-weight: 300;">
            ${this.companyName.toUpperCase()}
          </h1>
        </td>
      </tr>

      <!-- Main Content -->
      <tr>
        <td style="background-color: #ffffff; padding: 40px 30px;">
          
          <h2 style="color: #111827; margin: 0 0 20px; font-size: 22px; font-weight: 600;">
            Order Cancelled
          </h2>
          
          <p style="color: #374151; margin: 0 0 20px; font-size: 16px; line-height: 1.6;">
            Hi ${user.firstName},<br><br>
            Your order <strong>${order.orderNumber}</strong> has been cancelled as requested.
          </p>

          ${order.paymentStatus === 'refunded' ? `
            <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
              <tr>
                <td style="background-color: #F0FDF4; border-radius: 8px; padding: 20px;">
                  <p style="margin: 0; color: #166534; font-size: 15px;">
                    <strong>✓ Refund Processed</strong><br>
                    <span style="font-size: 14px;">
                      Amount: ${this.formatCurrency(order.refundDetails?.amount || order.total)}<br>
                      Please allow 5-10 business days for the refund to appear in your account.
                    </span>
                  </p>
                </td>
              </tr>
            </table>
          ` : ''}

          <p style="color: #6B7280; margin: 0 0 25px; font-size: 14px;">
            If you have any questions, please contact us at 
            <a href="mailto:${this.supportEmail}" style="color: #111827;">${this.supportEmail}</a>
          </p>

          <a href="${this.frontendUrl}/shop" 
             style="display: inline-block; background-color: #111827; color: #ffffff; padding: 14px 35px; text-decoration: none; font-weight: 600; font-size: 14px;">
            CONTINUE SHOPPING
          </a>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background-color: #111827; padding: 25px; text-align: center;">
          <p style="margin: 0; color: #9CA3AF; font-size: 12px;">
            ${this.companyName} | ${this.companyAddress}
          </p>
        </td>
      </tr>
    `;

    const html = this.getEmailWrapper(content, 'Your order has been cancelled');
    return this.send(user.email, subject, html);
  }

  // Welcome email
  welcomeEmail(user) {
    const subject = `Welcome to ${this.companyName}!`;
    const content = `
      <tr>
        <td style="background-color: #111827; padding: 35px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 26px; letter-spacing: 3px;">
            ${this.companyName.toUpperCase()}
          </h1>
        </td>
      </tr>
      <tr>
        <td style="background-color: #ffffff; padding: 40px 30px;">
          <h2 style="color: #111827; margin: 0 0 20px;">Welcome ${user.firstName}!</h2>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Thank you for joining ${this.companyName}. We're excited to have you as part of our community of art enthusiasts.
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Explore our curated collection of unique artworks and paintings from talented artists around the world.
          </p>
          <a href="${this.frontendUrl}/shop" 
             style="display: inline-block; background-color: #111827; color: #ffffff; padding: 14px 35px; text-decoration: none; font-weight: 600; margin-top: 20px;">
            EXPLORE COLLECTION
          </a>
        </td>
      </tr>
      <tr>
        <td style="background-color: #111827; padding: 25px; text-align: center;">
          <p style="margin: 0; color: #9CA3AF; font-size: 12px;">
            ${this.companyName} | ${this.companyAddress}
          </p>
        </td>
      </tr>
    `;
    const html = this.getEmailWrapper(content);
    return this.send(user.email, subject, html);
  }

  // Email verification
  // In sendgrid.js - emailVerificationEmail method
  emailVerificationEmail(user, verificationUrl) {
    console.log('📧 Sending verification email:');
    console.log('To:', user.email);
    console.log('URL:', verificationUrl);

    const subject = `Verify Your Email - ${process.env.COMPANY_NAME}`;
    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body>
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <!-- ... other content ... -->
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #111827; 
                      color: white; 
                      padding: 16px 40px; 
                      text-decoration: none; 
                      font-weight: 600;
                      display: inline-block;
                      letter-spacing: 0.5px;">
              VERIFY EMAIL ADDRESS
            </a>
          </div>
          
          <p style="color: #6B7280; font-size: 14px; line-height: 1.6;">
            Or copy and paste this link in your browser:
          </p>
          <p style="color: #3B82F6; font-size: 14px; word-break: break-all;">
            ${verificationUrl}
          </p>
          
          <!-- ... rest of email ... -->
        </div>
      </body>
    </html>
  `;
    return this.send(user.email, subject, html);
  }

  // Password reset
  passwordResetEmail(user, resetUrl) {
    const subject = `Password Reset Request - ${this.companyName}`;
    const content = `
      <tr>
        <td style="background-color: #111827; padding: 35px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Password Reset</h1>
        </td>
      </tr>
      <tr>
        <td style="background-color: #ffffff; padding: 40px 30px; text-align: center;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
            Hi ${user.firstName}, click the button below to reset your password:
          </p>
          <a href="${resetUrl}" 
             style="display: inline-block; background-color: #111827; color: #ffffff; padding: 16px 45px; text-decoration: none; font-weight: 600;">
            RESET PASSWORD
          </a>
          <p style="color: #DC2626; font-size: 14px; margin-top: 25px;">
            This link expires in 1 hour. If you didn't request this, please ignore this email.
          </p>
        </td>
      </tr>
      <tr>
        <td style="background-color: #111827; padding: 25px; text-align: center;">
          <p style="margin: 0; color: #9CA3AF; font-size: 12px;">${this.companyName} | ${this.companyAddress}</p>
        </td>
      </tr>
    `;
    const html = this.getEmailWrapper(content);
    return this.send(user.email, subject, html);
  }

  welcomeEmail(user) {
    const subject = `Welcome to ${process.env.COMPANY_NAME}!`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Welcome ${user.firstName}!</h1>
            <p>Thank you for registering with ${process.env.COMPANY_NAME}.</p>
            <p>We're excited to have you as part of our community of art enthusiasts.</p>
            <p>Explore our curated collection of unique artworks and paintings from talented artists around the world.</p>
            <p>If you have any questions, feel free to reach out to our support team at ${process.env.SUPPORT_EMAIL}</p>
            <p>Best regards,<br>The ${process.env.COMPANY_NAME} Team</p>
            <hr>
            <p style="font-size: 12px; color: #666;">
              ${process.env.COMPANY_NAME}<br>
              ${process.env.COMPANY_ADDRESS}
            </p>
          </div>
        </body>
      </html>
    `;
    return this.send(user.email, subject, html);
  }

  // Inquiry confirmation email
  inquiryConfirmationEmail(inquiry, product) {
    const subject = `We received your inquiry - ${inquiry.inquiryNumber}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Thank you for your inquiry!</h1>
            <p>Hi ${inquiry.customerInfo.firstName},</p>
            <p>We have received your inquiry about:</p>
            <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0;">
              <h3>${product.title}</h3>
              <p><strong>Inquiry Number:</strong> ${inquiry.inquiryNumber}</p>
              <p><strong>Your Message:</strong></p>
              <p>${inquiry.message}</p>
            </div>
            <p>Our team will review your inquiry and respond within 24-48 hours.</p>
            <p>If you need immediate assistance, please contact us at ${process.env.SUPPORT_EMAIL}</p>
            <p>Best regards,<br>The ${process.env.COMPANY_NAME} Team</p>
            <hr>
            <p style="font-size: 12px; color: #666;">
              ${process.env.COMPANY_NAME}<br>
              ${process.env.COMPANY_ADDRESS}
            </p>
          </div>
        </body>
      </html>
    `;
    return this.send(inquiry.customerInfo.email, subject, html);
  }

  // Inquiry response email
  inquiryResponseEmail(inquiry, response) {
    const subject = `Response to your inquiry - ${inquiry.inquiryNumber}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>We have responded to your inquiry</h1>
            <p>Hi ${inquiry.customerInfo.firstName},</p>
            <p><strong>Inquiry Number:</strong> ${inquiry.inquiryNumber}</p>
            ${inquiry.quotedPrice ? `<p><strong>Quoted Price:</strong> $${inquiry.quotedPrice.toFixed(2)}</p>` : ''}
            <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0;">
              <p><strong>Our Response:</strong></p>
              <p>${response}</p>
            </div>
            <p>If you have any additional questions, please don't hesitate to contact us.</p>
            <p>Best regards,<br>The ${process.env.COMPANY_NAME} Team</p>
            <hr>
            <p style="font-size: 12px; color: #666;">
              ${process.env.COMPANY_NAME}<br>
              ${process.env.COMPANY_ADDRESS}<br>
              Email: ${process.env.SUPPORT_EMAIL}
            </p>
          </div>
        </body>
      </html>
    `;
    return this.send(inquiry.customerInfo.email, subject, html);
  }

  // Newsletter subscription confirmation
  newsletterSubscriptionEmail(subscriber) {
    const unsubscribeUrl = `${process.env.FRONTEND_URL}/newsletter/unsubscribe/${subscriber.unsubscribeToken}`;
    const subject = `Subscription Confirmed - ${process.env.COMPANY_NAME}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Subscription Confirmed!</h1>
            <p>Hi${subscriber.firstName ? ' ' + subscriber.firstName : ''},</p>
            <p>Thank you for subscribing to the ${process.env.COMPANY_NAME} newsletter!</p>
            <p>You'll now receive updates about:</p>
            <ul>
              <li>New artwork arrivals</li>
              <li>Featured artists</li>
              <li>Exclusive promotions</li>
              <li>Art world news</li>
            </ul>
            <p>We respect your inbox and will only send you relevant content.</p>
            <p style="font-size: 12px; color: #666; margin-top: 30px;">
              Don't want to receive these emails? <a href="${unsubscribeUrl}">Unsubscribe</a>
            </p>
            <hr>
            <p style="font-size: 12px; color: #666;">
              ${process.env.COMPANY_NAME}<br>
              ${process.env.COMPANY_ADDRESS}
            </p>
          </div>
        </body>
      </html>
    `;
    return this.send(subscriber.email, subject, html);
  }

  // Admin notification for new inquiry
  adminInquiryNotification(inquiry, product) {
    const subject = `New Inquiry Received - ${inquiry.inquiryNumber}`;
    const adminUrl = `${process.env.ADMIN_URL}/inquiries/${inquiry._id}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>New Inquiry Received</h1>
            <p><strong>Inquiry Number:</strong> ${inquiry.inquiryNumber}</p>
            <p><strong>Product:</strong> ${product.title}</p>
            <p><strong>Customer:</strong> ${inquiry.customerInfo.firstName} ${inquiry.customerInfo.lastName}</p>
            <p><strong>Email:</strong> ${inquiry.customerInfo.email}</p>
            ${inquiry.customerInfo.phoneNumber ? `<p><strong>Phone:</strong> ${inquiry.customerInfo.phoneNumber}</p>` : ''}
            <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0;">
              <p><strong>Message:</strong></p>
              <p>${inquiry.message}</p>
            </div>
            <p><a href="${adminUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; display: inline-block;">View in Admin Panel</a></p>
          </div>
        </body>
      </html>
    `;
    return this.send(process.env.SUPPORT_EMAIL, subject, html);
  }

  async sendNewsletterCampaign(campaign, subscribers) {
    try {
      const results = {
        sentCount: 0,
        failedCount: 0,
        failedEmails: [],
      };

      console.log(`📧 Starting to send campaign "${campaign.name}" to ${subscribers.length} subscribers`);

      // Send emails in smaller batches to avoid rate limits
      const batchSize = 10;

      for (let i = 0; i < subscribers.length; i += batchSize) {
        const batch = subscribers.slice(i, i + batchSize);
        console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(subscribers.length / batchSize)}`);

        const batchPromises = batch.map(async (subscriber) => {
          try {
            // Generate beautiful black and white email
            const emailContent = this.generateBlackWhiteNewsletter(
              campaign,
              subscriber
            );

            console.log(`Sending to: ${subscriber.email}`);

            // Send email using the class method
            const result = await this.send(
              subscriber.email,
              campaign.subject,
              emailContent.html,
              emailContent.text
            );

            if (result.success) {
              results.sentCount++;
              console.log(`✓ Sent to ${subscriber.email}`);
              return { success: true, email: subscriber.email };
            } else {
              results.failedCount++;
              results.failedEmails.push({
                email: subscriber.email,
                error: result.error,
              });
              console.log(`✗ Failed to send to ${subscriber.email}: ${result.error}`);
              return { success: false, email: subscriber.email, error: result.error };
            }
          } catch (error) {
            results.failedCount++;
            results.failedEmails.push({
              email: subscriber.email,
              error: error.message,
            });
            console.log(`✗ Error sending to ${subscriber.email}: ${error.message}`);
            return { success: false, email: subscriber.email, error: error.message };
          }
        });

        // Wait for current batch to complete
        await Promise.all(batchPromises);

        // Small delay between batches
        if (i + batchSize < subscribers.length) {
          console.log(`⏳ Waiting 2 seconds before next batch...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      console.log(`📊 Campaign complete: ${results.sentCount} sent, ${results.failedCount} failed`);
      return results;
    } catch (error) {
      console.error('Campaign sending error:', error);
      throw error;
    }
  }

  generateBlackWhiteNewsletter(campaign, subscriber) {
    // Personalize the HTML content
    let personalizedHtml = campaign.content.html
      .replace(/\{\{firstName\}\}/g, subscriber.firstName || 'Subscriber')
      .replace(/\{\{email\}\}/g, subscriber.email);

    // Generate unsubscribe URL
    const unsubscribeUrl = `${this.frontendUrl}/newsletter/unsubscribe/${subscriber.unsubscribeToken}`;
    const viewInBrowserUrl = `${this.frontendUrl}/newsletter/campaign/${campaign._id}`;

    // Create beautiful black and white template wrapper
    const wrappedHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="x-apple-disable-message-reformatting">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>${campaign.subject}</title>
      <style type="text/css">
        /* Reset for email clients */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #000000;
          background-color: #ffffff;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          margin: 0;
          padding: 20px 0;
        }
        
        /* Email wrapper */
        .email-wrapper {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border: 1px solid #e0e0e0;
        }
        
        /* Header */
        .header {
          background-color: #000000;
          color: #ffffff;
          padding: 30px 20px;
          text-align: center;
        }
        
        .header h1 {
          font-size: 28px;
          font-weight: 300;
          letter-spacing: 1px;
          margin: 0;
          text-transform: uppercase;
        }
        
        .header p {
          font-size: 14px;
          opacity: 0.8;
          margin-top: 8px;
          letter-spacing: 0.5px;
        }
        
        /* Preheader */
        .preheader {
          font-size: 0;
          line-height: 0;
          color: transparent;
          display: none;
          max-height: 0;
          overflow: hidden;
        }
        
        /* Content container */
        .content {
          padding: 40px 30px;
        }
        
        /* Campaign content */
        .campaign-content {
          margin-bottom: 40px;
        }
        
        /* Typography */
        h2 {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 20px;
          color: #000000;
        }
        
        h3 {
          font-size: 18px;
          font-weight: 600;
          margin: 25px 0 15px;
          color: #000000;
        }
        
        p {
          margin-bottom: 20px;
          font-size: 16px;
          color: #333333;
          line-height: 1.7;
        }
        
        a {
          color: #000000;
          text-decoration: underline;
        }
        
        /* Quote block */
        .quote {
          border-left: 3px solid #000000;
          padding-left: 20px;
          margin: 30px 0;
          font-style: italic;
          color: #666666;
        }
        
        /* Divider */
        .divider {
          height: 1px;
          background-color: #e0e0e0;
          margin: 40px 0;
        }
        
        /* Footer */
        .footer {
          background-color: #f8f8f8;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e0e0e0;
        }
        
        .footer-logo {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 2px;
          margin-bottom: 15px;
          text-transform: uppercase;
        }
        
        .footer-address {
          font-size: 14px;
          color: #666666;
          margin-bottom: 20px;
          line-height: 1.5;
        }
        
        .footer-links {
          margin: 20px 0;
        }
        
        .footer-links a {
          color: #666666;
          text-decoration: none;
          font-size: 14px;
          margin: 0 10px;
        }
        
        .footer-links a:hover {
          text-decoration: underline;
        }
        
        .unsubscribe {
          font-size: 12px;
          color: #999999;
          margin-top: 25px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
        }
        
        .unsubscribe a {
          color: #999999;
          text-decoration: underline;
        }
        
        /* Button */
        .btn {
          display: inline-block;
          background-color: #000000;
          color: #ffffff;
          text-decoration: none;
          padding: 14px 30px;
          font-weight: 600;
          letter-spacing: 0.5px;
          border: none;
          cursor: pointer;
          margin: 10px 0;
          text-align: center;
          font-size: 15px;
        }
        
        .btn:hover {
          background-color: #333333;
        }
        
        /* Info box */
        .info-box {
          background-color: #f8f8f8;
          border: 1px solid #e0e0e0;
          padding: 20px;
          margin: 30px 0;
        }
        
        .info-box h4 {
          font-size: 16px;
          margin-bottom: 10px;
          color: #000000;
        }
        
        /* Lists */
        ul, ol {
          margin: 20px 0 20px 20px;
          color: #333333;
        }
        
        li {
          margin-bottom: 10px;
          font-size: 16px;
          line-height: 1.6;
        }
        
        /* Image styling */
        img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 20px 0;
        }
        
        /* Responsive */
        @media only screen and (max-width: 600px) {
          .content {
            padding: 30px 20px;
          }
          
          .header {
            padding: 25px 15px;
          }
          
          .header h1 {
            font-size: 24px;
          }
          
          h2 {
            font-size: 20px;
          }
          
          h3 {
            font-size: 16px;
          }
          
          p {
            font-size: 15px;
          }
          
          .footer {
            padding: 25px 20px;
          }
        }
      </style>
    </head>
    <body>
      <!-- Preheader text for email clients -->
      <div class="preheader">
        ${campaign.subject} - ${this.companyName} Newsletter
      </div>
      
      <div class="email-wrapper">
        <!-- Header -->
        <div class="header">
          <h1>${this.companyName}</h1>
          <p>Art & Culture Newsletter</p>
        </div>
        
        <!-- Main Content -->
        <div class="content">
          <!-- Greeting -->
          <h2>Dear ${subscriber.firstName || 'Art Enthusiast'},</h2>
          
          <p>Welcome to this edition of our newsletter. We're excited to share the latest from ${this.companyName}.</p>
          
          <!-- Campaign Content -->
          <div class="campaign-content">
            ${personalizedHtml}
          </div>
          
          <!-- Divider -->
          <div class="divider"></div>
          
          <!-- Additional Resources -->
          <div class="info-box">
            <h4>📚 Additional Resources</h4>
            <p>Explore more from our collection:</p>
            <ul>
              <li><a href="${this.frontendUrl}/shop">Browse Our Gallery</a></li>
              <li><a href="${this.frontendUrl}/artists">Meet Our Artists</a></li>
              <li><a href="${this.frontendUrl}/exhibitions">Upcoming Exhibitions</a></li>
              <li><a href="${this.frontendUrl}/blog">Art Insights Blog</a></li>
            </ul>
          </div>
          
          <!-- Call to Action -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${this.frontendUrl}/shop" class="btn">
              EXPLORE THE COLLECTION
            </a>
            <p style="font-size: 14px; color: #666666; margin-top: 15px;">
              <a href="${viewInBrowserUrl}">View this email in your browser</a>
            </p>
          </div>
          
          <!-- Quote -->
          <div class="quote">
            "Every artist dips his brush in his own soul, and paints his own nature into his pictures."<br>
            <span style="font-size: 14px; color: #999999;">- Henry Ward Beecher</span>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <div class="footer-logo">${this.companyName}</div>
          <div class="footer-address">
            ${this.companyAddress}<br>
            Miami, Florida
          </div>
          
          <div class="footer-links">
            <a href="${this.frontendUrl}">Website</a> • 
            <a href="${this.frontendUrl}/about">About</a> • 
            <a href="${this.frontendUrl}/contact">Contact</a> • 
            <a href="${this.frontendUrl}/privacy">Privacy</a>
          </div>
          
          <div class="unsubscribe">
            You're receiving this email because you subscribed to ${this.companyName} newsletter.<br>
            <a href="${unsubscribeUrl}">Unsubscribe from this list</a> • 
            <a href="${this.frontendUrl}/preferences">Update preferences</a>
          </div>
          
          <div style="font-size: 12px; color: #999999; margin-top: 20px;">
            &copy; ${new Date().getFullYear()} ${this.companyName}. All rights reserved.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

    // Generate plain text version
    const plainText = `
${campaign.subject}

Dear ${subscriber.firstName || 'Art Enthusiast'},

Welcome to this edition of our newsletter. We're excited to share the latest from ${this.companyName}.

${this.stripHtml(personalizedHtml)}

---
Explore more from our collection:
- Browse Our Gallery: ${this.frontendUrl}/shop
- Meet Our Artists: ${this.frontendUrl}/artists
- Upcoming Exhibitions: ${this.frontendUrl}/exhibitions
- Art Insights Blog: ${this.frontendUrl}/blog

"Every artist dips his brush in his own soul, and paints his own nature into his pictures."
- Henry Ward Beecher

---
${this.companyName}
${this.companyAddress}
Miami, Florida

Website: ${this.frontendUrl}
About: ${this.frontendUrl}/about
Contact: ${this.frontendUrl}/contact
Privacy: ${this.frontendUrl}/privacy

You're receiving this email because you subscribed to ${this.companyName} newsletter.
Unsubscribe: ${unsubscribeUrl}
Update preferences: ${this.frontendUrl}/preferences

© ${new Date().getFullYear()} ${this.companyName}. All rights reserved.
  `;

    return {
      html: wrappedHtml,
      text: plainText
    };
  }

}

export default new EmailService();