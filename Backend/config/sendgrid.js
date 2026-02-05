import sgMail from '@sendgrid/mail';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';
dotenv.config();

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
console.log('SendGrid API Key Loaded:', process.env.SENDGRID_API_KEY);

class EmailService {
  constructor() {
    this.from = {
      email: process.env.SENDGRID_FROM_EMAIL,
      name: process.env.SENDGRID_FROM_NAME,
    };
  }

  async send(to, subject, html, text = null) {
    try {
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

  // Welcome email template
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
}

export default new EmailService();