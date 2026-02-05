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
      email: process.env.SENDGRID_FROM_EMAIL || 'liosam614@gmail.com',
      name: process.env.SENDGRID_FROM_NAME || 'Art By Bayshore',
    };
    this.ownerEmail = process.env.OWNER_EMAIL || 'liosam614@gmail.com';
    this.companyName = process.env.COMPANY_NAME || 'Art By Bayshore';
    this.companyAddress = process.env.COMPANY_ADDRESS || '1717 N Bayshore Dr 121, Miami, FL 33132';
    this.supportEmail = process.env.SUPPORT_EMAIL || 'liosam614@gmail.com';
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
}

export default new EmailService();