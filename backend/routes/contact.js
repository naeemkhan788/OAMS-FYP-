const express = require('express');
const { body } = require('express-validator');
const nodemailer = require('nodemailer');
const router = express.Router();

// Contact form validation
const contactValidation = [
  body('name').notEmpty().withMessage('Name is required').trim().escape(),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('subject').notEmpty().withMessage('Subject is required').trim().escape(),
  body('message').notEmpty().withMessage('Message is required').trim().escape()
];

// POST /api/contact - Submit contact form
router.post('/', contactValidation, async (req, res) => {
  try {
    const errors = require('express-validator').validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, subject, message } = req.body;

    // Log the contact submission
    console.log('=== New Contact Form Submission ===');
    console.log('From:', name);
    console.log('Email:', email);
    console.log('Subject:', subject);
    console.log('Message:', message);
    console.log('===================================');

    // Check if email credentials are configured
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    const smtpFrom = process.env.SMTP_FROM || process.env.EMAIL_FROM || 'zeb9504972@gmail.com';

    console.log('=== Email Configuration Debug ===');
    console.log('SMTP_USER:', smtpUser);
    console.log('SMTP_PASS:', smtpPass ? '***CONFIGURED***' : 'MISSING');
    console.log('SMTP_FROM:', smtpFrom);
    console.log('All env vars:', {
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASS: process.env.SMTP_PASS ? 'SET' : 'NOT SET',
      SMTP_FROM: process.env.SMTP_FROM
    });
    console.log('================================');

    if (!smtpUser || !smtpPass) {
      console.error('Email credentials not configured. Please set SMTP_USER and SMTP_PASS in .env file');
      return res.status(500).json({
        success: false,
        message: 'Email service not configured. Please contact administrator.'
      });
    }

    // Create email transporter with proper Gmail settings
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify transporter configuration (optional - try to send even if this fails)
    try {
      await transporter.verify();
      console.log('SMTP transporter verified successfully');
    } catch (verifyError) {
      console.error('SMTP verification failed, but will attempt to send anyway:', verifyError.message);
      // Don't return error here - try to send anyway
    }

    // Email content
    const mailOptions = {
      from: smtpFrom,
      to: 'zeb9504972@gmail.com', // Send to administrator
      subject: `Contact Form: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Contact Form Submission</h2>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin-top: 20px;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <div style="margin-top: 15px;">
              <strong>Message:</strong>
              <p style="white-space: pre-wrap;">${message}</p>
            </div>
          </div>
          <p style="margin-top: 20px; color: #666; font-size: 12px;">
            This message was sent from the OAMS contact form.
          </p>
        </div>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    console.log('Email sent successfully to zeb9504972@gmail.com');

    res.status(200).json({
      success: true,
      message: 'Thank you for contacting us! We will get back to you soon.'
    });
  } catch (error) {
    console.error('Contact form submission error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      response: error.response
    });
    res.status(500).json({
      success: false,
      message: 'Failed to submit contact form. Please try again.'
    });
  }
});

module.exports = router;
