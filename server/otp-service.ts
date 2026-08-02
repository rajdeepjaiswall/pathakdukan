import nodemailer from 'nodemailer';
import { db } from './db';
import { otps, type Otp, type InsertOtp } from '@shared/schema';
import { eq, and, lt, desc } from 'drizzle-orm';

// Email configuration
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password'
    }
  });
};

// Fast2SMS configuration
interface Fast2SMSConfig {
  apiKey: string;
  baseUrl: string;
  senderId: string;
  otpTemplateId: string;
  whatsappTemplateId?: string;
  whatsappSenderId?: string;
}

// WhatsApp / Fast2SMS config — IDs can be overridden via env vars
const fast2smsConfig: Fast2SMSConfig = {
  apiKey: process.env.FAST2SMS_API_KEY || '',
  baseUrl: 'https://www.fast2sms.com/dev/bulkV2',
  senderId: 'GETDON',
  otpTemplateId: process.env.FAST2SMS_SMS_TEMPLATE_ID || '206901',
  whatsappTemplateId: process.env.FAST2SMS_WHATSAPP_TEMPLATE_ID || '1709460170014791',
  whatsappSenderId: process.env.FAST2SMS_WHATSAPP_SENDER_ID || '15558471512'
};

export class OTPService {
  
  // Generate a 6-digit OTP
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Create OTP record in database
  async createOTP(identifier: string, type: 'email' | 'whatsapp' | 'sms', purpose: string = 'verification'): Promise<string> {
    // Clean up any existing OTPs for this identifier
    await db.delete(otps).where(
      and(
        eq(otps.identifier, identifier),
        eq(otps.type, type)
      )
    );

    const otpCode = this.generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    const otpData: InsertOtp = {
      identifier,
      otp: otpCode,
      type,
      purpose,
      attempts: 0,
      isVerified: false,
      expiresAt,
    };

    await db.insert(otps).values(otpData);
    return otpCode;
  }

  // Send Email OTP
  async sendEmailOTP(email: string, purpose: string = 'verification'): Promise<{ success: boolean; message: string }> {
    try {
      const otpCode = await this.createOTP(email, 'email', purpose);
      
      const transporter = createEmailTransporter();
      
      const mailOptions = {
        from: process.env.EMAIL_USER || 'Pathak Bhandar <noreply@pathakbhandar.com>',
        to: email,
        subject: 'Your OTP Verification Code - Pathak Bhandar',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0;">Pathak Bhandar</h1>
              <p style="color: #666; margin: 5px 0;">Premium Bakery & Confectionery</p>
            </div>
            
            <h2 style="color: #333; text-align: center;">Email Verification</h2>
            <p style="color: #666; font-size: 16px;">Your OTP verification code is:</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h1 style="color: #2563eb; font-size: 32px; margin: 0; letter-spacing: 8px; font-weight: bold;">\${otpCode}</h1>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              • This code will expire in <strong>5 minutes</strong><br>
              • Use this code to complete your \${purpose} process<br>
              • If you didn't request this code, please ignore this email
            </p>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
              <p style="color: #999; font-size: 12px;">
                This is an automated message from Pathak Bhandar<br>
                Prayagraj, Uttar Pradesh
              </p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      
      return {
        success: true,
        message: 'OTP sent successfully to your email'
      };
    } catch (error) {
      console.error('Email OTP Error:', error);
      return {
        success: false,
        message: 'Failed to send OTP. Please try again.'
      };
    }
  }

  // Send WhatsApp OTP via Fast2SMS (reuses existing OTP if available)
  async sendWhatsAppOTP(phoneNumber: string, customerName: string = 'Customer', purpose: string = 'verification'): Promise<{ success: boolean; message: string }> {
    try {
      if (!fast2smsConfig.apiKey) {
        return {
          success: false,
          message: 'SMS API not configured. Please contact administrator.'
        };
      }

      // Format phone number
      let formattedPhone = phoneNumber.replace(/\D/g, '');
      if (formattedPhone.startsWith('91') && formattedPhone.length > 10) {
        formattedPhone = formattedPhone.slice(2);
      }

      // Try to get existing OTP from database (reuse SMS OTP if exists)
      let otpCode: string | null = null;
      const existingOtp = await db.select().from(otps).where(
        and(
          eq(otps.identifier, phoneNumber),
          eq(otps.isVerified, false)
        )
      ).orderBy(desc(otps.createdAt)).limit(1);

      if (existingOtp.length > 0 && existingOtp[0].expiresAt && new Date(existingOtp[0].expiresAt) > new Date()) {
        // Reuse existing OTP
        otpCode = existingOtp[0].otp;
        console.log(`Reusing existing OTP for WhatsApp delivery: ${phoneNumber}`);
      } else {
        // Create new OTP only if none exists
        otpCode = await this.createOTP(phoneNumber, 'whatsapp', purpose);
        console.log(`Created new OTP for WhatsApp: ${phoneNumber}`);
      }

      // WhatsApp API URL (Fast2SMS WhatsApp endpoint)
      const whatsappApiUrl = 'https://www.fast2sms.com/dev/whatsapp';
      
      // Template "tonasia" (Message ID 15404) — body:
      // "{{1}} is your verification code. For your security, do not share this code."
      // Only ONE variable: the OTP itself.
      const variablesValues = `${otpCode}`;

      const FAST2SMS_PHONE_NUMBER_ID = process.env.FAST2SMS_PHONE_NUMBER_ID || '979454055241619';
      const FAST2SMS_OTP_TEMPLATE_ID = process.env.FAST2SMS_OTP_TEMPLATE_ID || '15404';

      // Build request for WhatsApp
      const params = new URLSearchParams({
        authorization: fast2smsConfig.apiKey,
        message_id: FAST2SMS_OTP_TEMPLATE_ID,
        phone_number_id: FAST2SMS_PHONE_NUMBER_ID,
        numbers: formattedPhone,
        variables_values: variablesValues
      });
      
      const url = `${whatsappApiUrl}?${params.toString()}`;
      console.log(`Sending WhatsApp OTP via Fast2SMS: URL=${url.replace(fast2smsConfig.apiKey, 'HIDDEN')}`);
      
      const response = await fetch(url, {
        method: 'GET'
      });

      const responseData = await response.json();

      if (response.ok && responseData.return) {
        console.log('Fast2SMS WhatsApp OTP sent successfully:', responseData);
        return {
          success: true,
          message: 'OTP sent successfully via WhatsApp'
        };
      } else {
        console.error('Fast2SMS WhatsApp API Error:', responseData);
        return {
          success: false,
          message: 'Failed to send OTP via WhatsApp. Please try again.'
        };
      }
    } catch (error) {
      console.error('WhatsApp OTP Error:', error);
      return {
        success: false,
        message: 'Failed to send OTP via WhatsApp. Please try again.'
      };
    }
  }

  // Send SMS OTP via Fast2SMS using DLT template
  async sendSMSOTP(phoneNumber: string, customerName: string = 'Customer', purpose: string = 'verification', otpType: 'sms' | 'whatsapp' = 'sms'): Promise<{ success: boolean; message: string }> {
    try {
      if (!fast2smsConfig.apiKey) {
        return {
          success: false,
          message: 'SMS API not configured. Please contact administrator.'
        };
      }

      const otpCode = await this.createOTP(phoneNumber, otpType, purpose);
      
      // Format phone number (remove any non-digits, remove leading +91 or 91 if present)
      let formattedPhone = phoneNumber.replace(/\D/g, '');
      if (formattedPhone.startsWith('91') && formattedPhone.length > 10) {
        formattedPhone = formattedPhone.slice(2);
      }
      
      // DLT template variables: Name|OTP
      const variablesValues = `${customerName}|${otpCode}`;
      
      // Build query parameters for DLT template
      const params = new URLSearchParams({
        authorization: fast2smsConfig.apiKey,
        route: 'dlt',
        sender_id: fast2smsConfig.senderId,
        message: fast2smsConfig.otpTemplateId,
        variables_values: variablesValues,
        flash: '0',
        numbers: formattedPhone
      });
      
      // Fast2SMS DLT API request (GET)
      const url = `${fast2smsConfig.baseUrl}?${params.toString()}`;
      console.log(`Sending SMS OTP via Fast2SMS: URL=${url.replace(fast2smsConfig.apiKey, 'HIDDEN')}`);
      
      const response = await fetch(url, {
        method: 'GET'
      });

      const responseData = await response.json();

      if (response.ok && responseData.return) {
        console.log('Fast2SMS OTP sent successfully:', responseData);
        return {
          success: true,
          message: 'OTP sent successfully via SMS to your phone'
        };
      } else {
        console.error('Fast2SMS API Error:', responseData);
        return {
          success: false,
          message: 'Failed to send OTP. Please try again.'
        };
      }
    } catch (error) {
      console.error('SMS OTP Error:', error);
      return {
        success: false,
        message: 'Failed to send OTP. Please try again.'
        };
    }
  }
  
  // Helper method to send order placement SMS with customized message based on payment method
  async sendOrderConfirmation(phoneNumber: string, orderNumber: string, trackingLink: string, paymentMethod?: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!fast2smsConfig.apiKey) {
        return {
          success: false,
          message: 'SMS API not configured.'
        };
      }

      // Format phone number
      let formattedPhone = phoneNumber.replace(/\D/g, '');
      if (formattedPhone.startsWith('91') && formattedPhone.length > 10) {
        formattedPhone = formattedPhone.slice(2);
      }

      // Create customized message based on payment method
      let message = '';
      const trackingUrl = 'https://pathakbhandar.in/customer/orders';
      
      if (paymentMethod === 'cod') {
        // Cash on Delivery - sent instantly
        message = `Your Pathak Bhandar order ${orderNumber} has been placed! Please keep exact change ready for our delivery partner. If you wish to pay online, use the QR code they provide. Track: ${trackingUrl}`;
      } else if (paymentMethod === 'upi' || paymentMethod === 'qr') {
        // UPI/QR payment - sent after order placement
        message = `Your Pathak Bhandar order ${orderNumber} has been recorded! Help us update the payment process by providing the UTR number at: ${trackingUrl} - Navigate to your order and update payment details. Thank you!`;
      } else {
        // Default message for other payment methods
        message = `Your Pathak Bhandar order ${orderNumber} has been placed! Our executive will confirm it shortly. Track your order: ${trackingUrl}`;
      }
      
      // For custom messages, Fast2SMS requires DLT template
      // For now, we'll use a simple notification approach
      const response = await fetch(fast2smsConfig.baseUrl, {
        method: 'POST',
        headers: {
          'authorization': fast2smsConfig.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender_id: 'PATHAK',
          message: message,
          route: 'q',
          numbers: formattedPhone
        })
      });

      const responseData = await response.json();

      if (response.ok && responseData.return) {
        console.log(`Order confirmation SMS sent for ${paymentMethod || 'default'} payment:`, orderNumber);
        return {
          success: true,
          message: 'Order confirmation sent successfully'
        };
      } else {
        console.error('Fast2SMS Order Confirmation Error:', responseData);
        return {
          success: false,
          message: 'Failed to send order confirmation SMS'
        };
      }
    } catch (error) {
      console.error('Order Confirmation SMS Error:', error);
      return {
        success: false,
        message: 'Failed to send order confirmation SMS'
      };
    }
  }

  // Helper method to send order status update SMS
  async sendOrderStatusUpdate(phoneNumber: string, orderNumber: string, status: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!fast2smsConfig.apiKey) {
        return {
          success: false,
          message: 'SMS API not configured.'
        };
      }

      // Format phone number
      let formattedPhone = phoneNumber.replace(/\D/g, '');
      if (formattedPhone.startsWith('91') && formattedPhone.length > 10) {
        formattedPhone = formattedPhone.slice(2);
      }

      // Create appropriate message based on status
      let message = '';
      const trackingUrl = 'https://pathakbhandar.in/customer/orders';
      
      // Map status to friendly display name for the message
      switch (status) {
        case 'pending':
          message = `Your Pathak Bhandar order ${orderNumber} is pending. Our executive will confirm it shortly. Track: ${trackingUrl}`;
          break;
        case 'order_received':
          message = `Your Pathak Bhandar order ${orderNumber} has been received and confirmed! Our team is now processing it. Track: ${trackingUrl}`;
          break;
        case 'getting_ready':
          message = `Good news! Your Pathak Bhandar order ${orderNumber} is getting ready with care. Track: ${trackingUrl}`;
          break;
        case 'preparing':
          message = `Good news! Your Pathak Bhandar order ${orderNumber} is now being prepared with care. Track: ${trackingUrl}`;
          break;
        case 'dispatched':
          message = `Your Pathak Bhandar order ${orderNumber} has been dispatched and is on its way! Track: ${trackingUrl}`;
          break;
        case 'out_for_delivery':
          message = `Exciting! Your Pathak Bhandar order ${orderNumber} is out for delivery and will reach you soon. Track: ${trackingUrl}`;
          break;
        case 'delivered':
          message = `Your Pathak Bhandar order ${orderNumber} has been delivered successfully! Thank you for shopping with us. Track: ${trackingUrl}`;
          break;
        case 'cancelled':
          message = `Your Pathak Bhandar order ${orderNumber} has been cancelled. If you have any questions, please contact us. Track: ${trackingUrl}`;
          break;
        default:
          message = `Your Pathak Bhandar order ${orderNumber} status has been updated to: ${status}. Track: ${trackingUrl}`;
      }
      
      const response = await fetch(fast2smsConfig.baseUrl, {
        method: 'POST',
        headers: {
          'authorization': fast2smsConfig.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender_id: 'PATHAK',
          message: message,
          route: 'q',
          numbers: formattedPhone
        })
      });

      const responseData = await response.json();

      if (response.ok && responseData.return) {
        return {
          success: true,
          message: 'Order status update sent successfully'
        };
      } else {
        console.error('Fast2SMS Order Status Update Error:', responseData);
        return {
          success: false,
          message: 'Failed to send order status update SMS'
        };
      }
    } catch (error) {
      console.error('Order Status Update SMS Error:', error);
      return {
        success: false,
        message: 'Failed to send order status update SMS'
      };
    }
  }

  // Send WhatsApp notification for "Out for Delivery" status
  async sendOutForDeliveryWhatsApp(phoneNumber: string, customerName: string, orderNumber: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!fast2smsConfig.apiKey) {
        return {
          success: false,
          message: 'WhatsApp API not configured.'
        };
      }

      // Format phone number
      let formattedPhone = phoneNumber.replace(/\D/g, '');
      if (formattedPhone.startsWith('91') && formattedPhone.length > 10) {
        formattedPhone = formattedPhone.slice(2);
      }

      // WhatsApp API URL
      const whatsappApiUrl = 'https://www.fast2sms.com/dev/whatsapp';
      
      const FAST2SMS_PHONE_NUMBER_ID = process.env.FAST2SMS_PHONE_NUMBER_ID || '979454055241619';

      // Template variables: Var1=customer name, Var2=order number
      const variablesValues = `${customerName}|${orderNumber}`;

      // Build request for WhatsApp (template ID: 9781 - orderstatus)
      const params = new URLSearchParams({
        authorization: fast2smsConfig.apiKey,
        message_id: process.env.FAST2SMS_ORDER_STATUS_TEMPLATE_ID || '9781',
        phone_number_id: FAST2SMS_PHONE_NUMBER_ID,
        numbers: formattedPhone,
        variables_values: variablesValues
      });
      
      const url = `${whatsappApiUrl}?${params.toString()}`;
      console.log(`Sending Out for Delivery WhatsApp: URL=${url.replace(fast2smsConfig.apiKey, 'HIDDEN')}`);
      
      const response = await fetch(url, {
        method: 'GET'
      });

      const responseData = await response.json();

      if (response.ok && responseData.return) {
        console.log('Out for Delivery WhatsApp sent successfully:', responseData);
        return {
          success: true,
          message: 'Out for delivery notification sent via WhatsApp'
        };
      } else {
        console.error('Fast2SMS WhatsApp Out for Delivery Error:', responseData);
        return {
          success: false,
          message: 'Failed to send WhatsApp notification'
        };
      }
    } catch (error) {
      console.error('Out for Delivery WhatsApp Error:', error);
      return {
        success: false,
        message: 'Failed to send WhatsApp notification'
      };
    }
  }

  // Send WhatsApp notification when a payment completes successfully
  // Template: payment_completed (Message ID 9625)
  // Body: "Dear user, Your last payment completed successfully\n\namount: {{1}}\n\nThank you."
  async sendPaymentCompletedWhatsApp(phoneNumber: string, amount: string | number): Promise<{ success: boolean; message: string }> {
    try {
      if (!fast2smsConfig.apiKey) {
        return {
          success: false,
          message: 'WhatsApp API not configured.'
        };
      }

      // Format phone number
      let formattedPhone = phoneNumber.replace(/\D/g, '');
      if (formattedPhone.startsWith('91') && formattedPhone.length > 10) {
        formattedPhone = formattedPhone.slice(2);
      }

      // Format amount as ₹<value> with up to 2 decimals, no trailing zeros
      const num = typeof amount === 'string' ? parseFloat(amount) : amount;
      const formattedAmount = isFinite(num)
        ? `\u20B9${num.toFixed(2).replace(/\.00$/, '')}`
        : `${amount}`;

      // WhatsApp API URL
      const whatsappApiUrl = 'https://www.fast2sms.com/dev/whatsapp';

      const FAST2SMS_PHONE_NUMBER_ID = process.env.FAST2SMS_PHONE_NUMBER_ID || '979454055241619';

      // Template variables: Var1=amount
      const variablesValues = `${formattedAmount}`;

      const params = new URLSearchParams({
        authorization: fast2smsConfig.apiKey,
        message_id: process.env.FAST2SMS_PAYMENT_TEMPLATE_ID || '9625',
        phone_number_id: FAST2SMS_PHONE_NUMBER_ID,
        numbers: formattedPhone,
        variables_values: variablesValues
      });

      const url = `${whatsappApiUrl}?${params.toString()}`;
      console.log(`Sending Payment Completed WhatsApp: URL=${url.replace(fast2smsConfig.apiKey, 'HIDDEN')}`);

      const response = await fetch(url, { method: 'GET' });
      const responseData = await response.json();

      if (response.ok && responseData.return) {
        console.log('Payment Completed WhatsApp sent successfully:', responseData);
        return {
          success: true,
          message: 'Payment confirmation sent via WhatsApp'
        };
      } else {
        console.error('Fast2SMS WhatsApp Payment Completed Error:', responseData);
        return {
          success: false,
          message: 'Failed to send payment WhatsApp notification'
        };
      }
    } catch (error) {
      console.error('Payment Completed WhatsApp Error:', error);
      return {
        success: false,
        message: 'Failed to send payment WhatsApp notification'
      };
    }
  }

  // Send WhatsApp notification when rider is assigned to order
  async sendRiderAssignedWhatsApp(
    customerPhone: string, 
    customerName: string, 
    orderNumber: string, 
    riderName: string, 
    riderPhone: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!fast2smsConfig.apiKey) {
        return {
          success: false,
          message: 'WhatsApp API not configured.'
        };
      }

      // Format customer phone number
      let formattedPhone = customerPhone.replace(/\D/g, '');
      if (formattedPhone.startsWith('91') && formattedPhone.length > 10) {
        formattedPhone = formattedPhone.slice(2);
      }

      // WhatsApp API URL
      const whatsappApiUrl = 'https://www.fast2sms.com/dev/whatsapp';
      
      const FAST2SMS_PHONE_NUMBER_ID = process.env.FAST2SMS_PHONE_NUMBER_ID || '979454055241619';

      // Template variables: Var1=customer name, Var2=order number, Var3=rider name, Var4=rider phone
      const variablesValues = `${customerName}|${orderNumber}|${riderName}|${riderPhone}`;

      // Build request for WhatsApp (template ID: 10639 - dilivery_pb)
      const params = new URLSearchParams({
        authorization: fast2smsConfig.apiKey,
        message_id: process.env.FAST2SMS_DELIVERY_TEMPLATE_ID || '10639',
        phone_number_id: FAST2SMS_PHONE_NUMBER_ID,
        numbers: formattedPhone,
        variables_values: variablesValues
      });
      
      const url = `${whatsappApiUrl}?${params.toString()}`;
      console.log(`Sending Rider Assigned WhatsApp: URL=${url.replace(fast2smsConfig.apiKey, 'HIDDEN')}`);
      
      const response = await fetch(url, {
        method: 'GET'
      });

      const responseData = await response.json();

      if (response.ok && responseData.return) {
        console.log('Rider Assigned WhatsApp sent successfully:', responseData);
        return {
          success: true,
          message: 'Rider assignment notification sent via WhatsApp'
        };
      } else {
        console.error('Fast2SMS WhatsApp Rider Assigned Error:', responseData);
        return {
          success: false,
          message: 'Failed to send WhatsApp notification'
        };
      }
    } catch (error) {
      console.error('Rider Assigned WhatsApp Error:', error);
      return {
        success: false,
        message: 'Failed to send WhatsApp notification'
      };
    }
  }

  // Send SMS when order is placed - customized based on status and payment method
  async sendOrderPlacedSMS(
    phoneNumber: string,
    orderNumber: string,
    orderStatus: string,
    paymentMethod: string,
    customerName: string = 'Customer'
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!fast2smsConfig.apiKey) {
        return {
          success: false,
          message: 'SMS API not configured.'
        };
      }

      // Format phone number
      let formattedPhone = phoneNumber.replace(/\D/g, '');
      if (formattedPhone.startsWith('91') && formattedPhone.length > 10) {
        formattedPhone = formattedPhone.slice(2);
      }

      // Extract first name from customer name
      const firstName = customerName.split(' ')[0] || 'Customer';
      const trackingUrl = 'https://pathakbhandar.in/customer/orders';
      let message = '';

      // Customize message based on order status and payment method
      if (paymentMethod === 'gateway') {
        // PhonePe/Online payment - status will be pending_payment initially
        if (orderStatus === 'pending_payment') {
          message = `Dear ${firstName}, your Pathak Bhandar order ${orderNumber} has been received! Complete your payment to confirm the order. Track: ${trackingUrl}`;
        } else if (orderStatus === 'payment_success' || orderStatus === 'pending') {
          message = `Dear ${firstName}, thank you! Your payment for Pathak Bhandar order ${orderNumber} is successful. Our team will process it shortly. Track: ${trackingUrl}`;
        } else if (orderStatus === 'payment_failed') {
          message = `Dear ${firstName}, payment for your Pathak Bhandar order ${orderNumber} failed. Please try again or choose a different payment method. If money was deducted, it will be refunded within 3 days.`;
        } else {
          message = `Dear ${firstName}, your Pathak Bhandar order ${orderNumber} status: ${orderStatus}. Track: ${trackingUrl}`;
        }
      } else if (paymentMethod === 'cod') {
        // Cash on Delivery
        message = `Dear ${firstName}, your Pathak Bhandar order ${orderNumber} has been placed! Please keep exact change ready. Our executive will confirm your order soon. Track: ${trackingUrl}`;
      } else if (paymentMethod === 'upi' || paymentMethod === 'qr') {
        // UPI/QR payment
        message = `Dear ${firstName}, your Pathak Bhandar order ${orderNumber} has been recorded! Please update the UTR number at: ${trackingUrl} - Navigate to your order to complete payment verification.`;
      } else {
        // Default message
        message = `Dear ${firstName}, your Pathak Bhandar order ${orderNumber} has been placed! Our executive will confirm it shortly. Track: ${trackingUrl}`;
      }

      const response = await fetch(fast2smsConfig.baseUrl, {
        method: 'POST',
        headers: {
          'authorization': fast2smsConfig.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender_id: 'PATHAK',
          message: message,
          route: 'q',
          numbers: formattedPhone
        })
      });

      const responseData = await response.json();

      if (response.ok && responseData.return) {
        console.log(`Order placed SMS sent for ${paymentMethod} payment, status ${orderStatus}:`, orderNumber);
        return {
          success: true,
          message: 'Order SMS sent successfully'
        };
      } else {
        console.error('Fast2SMS Order Placed SMS Error:', responseData);
        return {
          success: false,
          message: 'Failed to send order SMS'
        };
      }
    } catch (error) {
      console.error('Order Placed SMS Error:', error);
      return {
        success: false,
        message: 'Failed to send order SMS'
      };
    }
  }

  // Send PhonePe payment status SMS - only for payment gateway responses
  async sendPhonePePaymentSMS(
    phoneNumber: string, 
    orderNumber: string, 
    paymentStatus: 'success' | 'pending' | 'failed',
    customerName: string = 'Customer'
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!fast2smsConfig.apiKey) {
        return {
          success: false,
          message: 'SMS API not configured.'
        };
      }

      // Format phone number
      let formattedPhone = phoneNumber.replace(/\D/g, '');
      if (formattedPhone.startsWith('91') && formattedPhone.length > 10) {
        formattedPhone = formattedPhone.slice(2);
      }

      // Extract first name from customer name
      const firstName = customerName.split(' ')[0] || 'Customer';

      const orderPageLink = `https://pathakbhandar.in/customer/orders`;
      let message = '';

      switch (paymentStatus) {
        case 'success':
          message = `Dear ${firstName}, thank you for your payment! Your Pathak Bhandar order ${orderNumber} is placed and will be processed by our executive soon. Check your order status: ${orderPageLink}`;
          break;
        case 'pending':
          message = `Dear ${firstName}, your payment for Pathak Bhandar order ${orderNumber} is being processed. If payment is deducted from your account, please share the UTR number at: ${orderPageLink} - Navigate to your order to update payment details.`;
          break;
        case 'failed':
          message = `Dear ${firstName}, your payment for Pathak Bhandar order ${orderNumber} has failed. Please try again later. If money was deducted, it will be refunded to your account within 3 working days.`;
          break;
      }

      const response = await fetch(fast2smsConfig.baseUrl, {
        method: 'POST',
        headers: {
          'authorization': fast2smsConfig.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender_id: 'PATHAK',
          message: message,
          route: 'q',
          numbers: formattedPhone
        })
      });

      const responseData = await response.json();

      if (response.ok && responseData.return) {
        console.log(`PhonePe payment ${paymentStatus} SMS sent for order:`, orderNumber);
        return {
          success: true,
          message: `Payment ${paymentStatus} SMS sent successfully`
        };
      } else {
        console.error('Fast2SMS PhonePe Payment SMS Error:', responseData);
        return {
          success: false,
          message: 'Failed to send payment status SMS'
        };
      }
    } catch (error) {
      console.error('PhonePe Payment SMS Error:', error);
      return {
        success: false,
        message: 'Failed to send payment status SMS'
      };
    }
  }

  // Verify OTP
  async verifyOTP(identifier: string, inputOTP: string, type: 'email' | 'whatsapp' | 'sms'): Promise<{ success: boolean; message: string }> {
    try {
      // Master OTP - works for any number/email
      if (inputOTP === '565656') {
        return {
          success: true,
          message: 'OTP verified successfully'
        };
      }

      // Find the OTP record
      const [otpRecord] = await db
        .select()
        .from(otps)
        .where(
          and(
            eq(otps.identifier, identifier),
            eq(otps.type, type),
            eq(otps.isVerified, false)
          )
        )
        .limit(1);

      console.log(`Verifying OTP for ${identifier} (${type}): Record found? ${otpRecord ? 'Yes' : 'No'}`);

      if (!otpRecord) {
        return {
          success: false,
          message: 'OTP not found or already verified. Please request a new one.'
        };
      }

      // Detailed logging for expiration check
      const now = new Date();
      console.log(`Checking expiration: Now=${now.toISOString()}, ExpiresAt=${otpRecord.expiresAt.toISOString()}`);

      // Check if OTP is expired
      if (now > otpRecord.expiresAt) {
        // Delete expired OTP
        await db.delete(otps).where(eq(otps.id, otpRecord.id));
        return {
          success: false,
          message: 'OTP has expired. Please request a new one.'
        };
      }

      // Check if OTP matches
      if (otpRecord.otp !== inputOTP) {
        const currentAttempts = otpRecord.attempts ?? 0;
        const remainingAttempts = Math.max(0, 3 - (currentAttempts + 1));
        
        // Increment attempts
        await db
          .update(otps)
          .set({ attempts: currentAttempts + 1 })
          .where(eq(otps.id, otpRecord.id));

        if (remainingAttempts === 0) {
          // Delete exhausted OTP
          await db.delete(otps).where(eq(otps.id, otpRecord.id));
          return {
            success: false,
            message: 'Maximum attempts reached. Please request a new OTP.'
          };
        }

        return {
          success: false,
          message: `Invalid OTP. ${remainingAttempts} attempts remaining.`
        };
      }

      // Mark as verified
      await db
        .update(otps)
        .set({ isVerified: true })
        .where(eq(otps.id, otpRecord.id));

      return {
        success: true,
        message: 'OTP verified successfully'
      };
    } catch (error) {
      console.error('Verify OTP Error:', error);
      return {
        success: false,
        message: 'An error occurred during verification. Please try again.'
      };
    }
  }

  // Resend OTP with cooldown check
  async resendOTP(identifier: string, type: 'email' | 'whatsapp' | 'sms', customerName: string = 'Customer', purpose: string = 'verification'): Promise<{ success: boolean; message: string; waitTime?: number }> {
    try {
      // Check for existing OTP and cooldown
      const [existingOTP] = await db
        .select()
        .from(otps)
        .where(
          and(
            eq(otps.identifier, identifier),
            eq(otps.type, type)
          )
        )
        .limit(1);

      if (existingOTP) {
        const timeDiff = Date.now() - existingOTP.createdAt!.getTime();
        const cooldownPeriod = 60000; // 1 minute cooldown

        if (timeDiff < cooldownPeriod) {
          const waitTime = Math.ceil((cooldownPeriod - timeDiff) / 1000);
          return {
            success: false,
            message: `Please wait ${waitTime} seconds before requesting a new OTP`,
            waitTime
          };
        }
      }

      // Send new OTP based on type
      if (type === 'email') {
        return await this.sendEmailOTP(identifier, purpose);
      } else if (type === 'sms') {
        return await this.sendSMSOTP(identifier, customerName, purpose, 'sms');
      } else {
        return await this.sendWhatsAppOTP(identifier, customerName, purpose);
      }
    } catch (error) {
      console.error('Resend OTP Error:', error);
      return {
        success: false,
        message: 'Failed to resend OTP. Please try again.'
      };
    }
  }

  // Cleanup expired OTPs (run this periodically)
  async cleanupExpiredOTPs(): Promise<void> {
    try {
      await db.delete(otps).where(lt(otps.expiresAt, new Date()));
      console.log('Cleaned up expired OTPs');
    } catch (error) {
      console.error('Cleanup expired OTPs error:', error);
    }
  }
}

export const otpService = new OTPService();
