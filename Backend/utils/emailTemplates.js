// Add order confirmation email template to emailService
import dotenv from 'dotenv';
dotenv.config();

export const orderConfirmationEmail = (order, user) => {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        ${item.title} x ${item.quantity}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        $${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('');

  const subject = `Order Confirmation - ${order.orderNumber}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body>
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Thank you for your order!</h1>
          <p>Hi ${user.firstName},</p>
          <p>Your order has been confirmed and will be processed shortly.</p>
          
          <h2>Order Details</h2>
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
          
          <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="padding: 10px; text-align: left;">Item</th>
                <th style="padding: 10px; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr>
                <td style="padding: 10px;"><strong>Subtotal</strong></td>
                <td style="padding: 10px; text-align: right;">$${order.subtotal.toFixed(2)}</td>
              </tr>
              ${order.discount > 0 ? `
                <tr>
                  <td style="padding: 10px;">Discount</td>
                  <td style="padding: 10px; text-align: right; color: green;">-$${order.discount.toFixed(2)}</td>
                </tr>
              ` : ''}
              <tr>
                <td style="padding: 10px;">Shipping</td>
                <td style="padding: 10px; text-align: right;">$${order.shippingCost.toFixed(2)}</td>
              </tr>
              <tr style="background-color: #f5f5f5;">
                <td style="padding: 10px;"><strong>Total</strong></td>
                <td style="padding: 10px; text-align: right;"><strong>$${order.total.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
          
          <h3>Shipping Address</h3>
          <p>
            ${order.shippingAddress.fullName}<br>
            ${order.shippingAddress.addressLine1}<br>
            ${order.shippingAddress.addressLine2 ? order.shippingAddress.addressLine2 + '<br>' : ''}
            ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}
          </p>
          
          <p>We'll send you another email when your order ships.</p>
          <p>If you have any questions, please contact us at ${process.env.SUPPORT_EMAIL}</p>
          
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
  
  return emailService.send(user.email, subject, html);
};