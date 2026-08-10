const nodemailer = require('nodemailer');

// Email transporter configuration
const createTransporter = () => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER;

  // Require SMTP credentials - no simulation fallback
  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    throw new Error(
      'SMTP credentials not configured. Please set the following environment variables:\n' +
      '- SMTP_HOST\n' +
      '- SMTP_PORT\n' +
      '- SMTP_USER\n' +
      '- SMTP_PASS\n' +
      '- SMTP_FROM (optional, defaults to SMTP_USER)\n\n' +
      'Example for Gmail:\n' +
      'SMTP_HOST=smtp.gmail.com\n' +
      'SMTP_PORT=587\n' +
      'SMTP_USER=your_email@gmail.com\n' +
      'SMTP_PASS=your_app_specific_password\n' +
      'SMTP_FROM=your_email@gmail.com'
    );
  }

  console.log('Creating SMTP transporter with:', {
    host: smtpHost,
    port: smtpPort,
    user: smtpUser,
    from: smtpFrom
  });

  return nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort),
    secure: smtpPort === '465', // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });
};

// Send email function
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments
    };

    console.log('Sending email with options:', {
      to: mailOptions.to,
      subject: mailOptions.subject,
      hasAttachments: !!mailOptions.attachments && mailOptions.attachments.length > 0
    });

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully. Message ID:', info.messageId);
    console.log('Accepted by:', info.accepted.join(', '));
    
    return { success: true, messageId: info.messageId, accepted: info.accepted };
  } catch (error) {
    console.error('Error sending email:', error.message);
    console.error('Error code:', error.code);
    throw error;
  }
};

// Validate email address
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

module.exports = {
  sendEmail,
  validateEmail,
  createTransporter
};
