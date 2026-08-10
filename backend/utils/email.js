const nodemailer = require('nodemailer');

/**
 * Email utility for sending OTP and other emails using Nodemailer
 * Supports SMTP configuration via environment variables
 */

// Create transporter based on environment configuration
const createTransporter = () => {
  // Check if email configuration is available
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.warn('Email configuration not found. Email features will be disabled.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
};

/**
 * Send OTP email to user
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @param {string} name - Recipient name
 * @returns {Promise<boolean>} - Success status
 */
const sendOTPEmail = async (email, otp, name = 'User') => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.warn('⚠️  Email transporter not configured. SMTP credentials missing in .env file.');
      console.warn('⚠️  Required environment variables: SMTP_HOST, SMTP_USER, SMTP_PASSWORD');
      // In development, log the OTP for testing
      console.log(`[DEV MODE] OTP for ${email}: ${otp}`);
      return false;
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Email Verification - OAMS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Email Verification</h2>
          <p>Dear ${name},</p>
          <p>Thank you for registering with the Online Attendance Management System (OAMS).</p>
          <p>Your verification code is:</p>
          <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This is an automated email. Please do not reply.
          </p>
        </div>
      `
    };

   console.log("=== EMAIL DEBUG ===");
console.log("SMTP_HOST:", process.env.SMTP_HOST);
console.log("SMTP_PORT:", process.env.SMTP_PORT);
console.log("SMTP_USER:", process.env.SMTP_USER);
console.log("SMTP_PASSWORD:", process.env.SMTP_PASSWORD ? "Loaded" : "Missing");
console.log("Sending OTP to:", email);

const info = await transporter.sendMail(mailOptions);
console.log("Email Response:", info.response);
  //  await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending OTP email:', error.message);
    console.error('❌ SMTP Error Details:', {
      code: error.code,
      command: error.command,
      response: error.response
    });
    // Log OTP as fallback
    console.log(`[FALLBACK] OTP for ${email}: ${otp}`);
    return false;
  }
};

/**
 * Send password reset OTP email
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @param {string} name - Recipient name
 * @returns {Promise<boolean>} - Success status
 */
const sendPasswordResetEmail = async (email, otp, name = 'User') => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('Email transporter not configured. Reset OTP would be:', otp);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV MODE] Password Reset OTP for ${email}: ${otp}`);
      }
      return false;
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Password Reset - OAMS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Dear ${name},</p>
          <p>We received a request to reset your password for the Online Attendance Management System (OAMS).</p>
          <p>Your password reset code is:</p>
          <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This is an automated email. Please do not reply.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};

/**
 * Send teacher approval email
 * @param {string} email - Recipient email address
 * @param {string} name - Recipient name
 * @param {string} status - 'approved' or 'rejected'
 * @returns {Promise<boolean>} - Success status
 */
const sendTeacherApprovalEmail = async (email, name, status) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log(`Email transporter not configured. Teacher ${status} notification for ${email}`);
      return false;
    }

    const isApproved = status === 'approved';
    const subject = isApproved ? 'Teacher Account Approved - OAMS' : 'Teacher Account Rejected - OAMS';
    const message = isApproved 
      ? 'Your teacher account has been approved. You can now log in to the system.'
      : 'Your teacher account registration has been rejected by the administrator.';

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: ${isApproved ? '#28a745' : '#dc3545'};">
            ${isApproved ? 'Account Approved' : 'Account Rejected'}
          </h2>
          <p>Dear ${name},</p>
          <p>${message}</p>
          ${isApproved ? '<p>You can now access your dashboard using your registered credentials.</p>' : ''}
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This is an automated email. Please do not reply.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Teacher ${status} email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending teacher approval email:', error);
    return false;
  }
};

module.exports = {
  sendOTPEmail,
  sendPasswordResetEmail,
  sendTeacherApprovalEmail
};
