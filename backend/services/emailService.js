/**
 * Email Service
 * 
 * Handles sending emails using Nodemailer.
 * Supports multiple email providers (Gmail, SendGrid, Mailgun, etc.)
 */

const nodemailer = require('nodemailer');
const config = require('../config/config');

/**
 * Create Email Transporter
 * 
 * Creates a nodemailer transporter based on configuration.
 * Supports SMTP, Gmail, SendGrid, Mailgun, and other services.
 */
const createTransporter = () => {
  // If using Gmail
  if (config.email.service === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.email.user,
        pass: config.email.password // App-specific password for Gmail
      }
    });
  }

  // If using SendGrid
  if (config.email.service === 'sendgrid') {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: config.email.apiKey // SendGrid API key
      }
    });
  }

  // If using Mailgun
  if (config.email.service === 'mailgun') {
    return nodemailer.createTransport({
      host: config.email.host || 'smtp.mailgun.org',
      port: config.email.port || 587,
      secure: config.email.secure || false,
      auth: {
        user: config.email.user,
        pass: config.email.password // Mailgun SMTP password
      }
    });
  }

  // Generic SMTP configuration
  return nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port || 587,
    secure: config.email.secure || false, // true for 465, false for other ports
    auth: {
      user: config.email.user,
      pass: config.email.password
    },
    tls: {
      rejectUnauthorized: config.email.rejectUnauthorized !== false
    }
  });
};

/**
 * Send Email
 * 
 * Sends an email using the configured transporter.
 * 
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML email content
 * @param {string} options.text - Plain text email content (optional)
 * @returns {Promise} Promise that resolves when email is sent
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    // Check if email service is configured
    if (!config.email.enabled) {
      console.log('Email service is disabled. Email would have been sent:');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content: ${text || html}`);
      return { success: true, message: 'Email service disabled (logged to console)' };
    }

    const transporter = createTransporter();

    // Verify transporter configuration
    if (config.nodeEnv === 'production') {
      await transporter.verify();
      console.log('Email server is ready to send messages');
    }

    // Send email
    const info = await transporter.sendMail({
      from: `"${config.email.fromName}" <${config.email.from}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML tags for text version
    });

    console.log(`Email sent successfully to ${to}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw error in production to prevent breaking the application
    // Log the error instead
    if (config.nodeEnv === 'production') {
      console.error('Email sending failed, but continuing execution');
      return { success: false, error: error.message };
    }
    throw error;
  }
};

/**
 * Send Welcome Email
 * 
 * Sends a welcome email to a newly registered user.
 * 
 * @param {string} email - User email address
 * @param {string} username - User username
 * @returns {Promise} Promise that resolves when email is sent
 */
const sendWelcomeEmail = async (email, username) => {
  const subject = 'Welcome to Task Management System!';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background-color: #f9f9f9;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          background-color: #4CAF50;
          color: white;
          padding: 20px;
          border-radius: 5px;
          text-align: center;
          margin-bottom: 20px;
        }
        .content {
          background-color: white;
          padding: 20px;
          border-radius: 5px;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #4CAF50;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin-top: 20px;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Task Management System!</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${username}</strong>,</p>
          <p>Thank you for registering with our Task Management System. We're excited to have you on board!</p>
          <p>Your account has been successfully created. You can now:</p>
          <ul>
            <li>Login to your account</li>
            <li>View and manage your tasks</li>
            <li>Stay organized and productive</li>
          </ul>
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          <p>Best regards,<br>The Task Management Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `
Welcome to Task Management System!

Hello ${username},

Thank you for registering with our Task Management System. We're excited to have you on board!

Your account has been successfully created. You can now:
- Login to your account
- View and manage your tasks
- Stay organized and productive

If you have any questions or need assistance, please don't hesitate to contact our support team.

Best regards,
The Task Management Team

---
This is an automated email. Please do not reply to this message.
  `;

  return await sendEmail({ to: email, subject, html, text });
};

/**
 * Send Task Assignment Email
 * 
 * Sends an email when a task is assigned to a user.
 * 
 * @param {string} email - User email address
 * @param {string} username - User username
 * @param {Object} task - Task object
 * @returns {Promise} Promise that resolves when email is sent
 */
const sendTaskAssignmentEmail = async (email, username, task) => {
  const dueDate = new Date(task.dueDate);
  const priorityColors = {
    high: '#f44336',
    medium: '#ff9800',
    low: '#4CAF50'
  };

  const priorityColor = priorityColors[task.priority] || '#666';

  const subject = `New Task Assigned: ${task.title}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Task Assigned</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background-color: #f9f9f9;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          background-color: #2196F3;
          color: white;
          padding: 20px;
          border-radius: 5px;
          text-align: center;
          margin-bottom: 20px;
        }
        .content {
          background-color: white;
          padding: 20px;
          border-radius: 5px;
        }
        .task-info {
          background-color: #f5f5f5;
          padding: 15px;
          border-radius: 5px;
          margin: 15px 0;
        }
        .task-title {
          font-size: 20px;
          font-weight: bold;
          color: #2196F3;
          margin-bottom: 10px;
        }
        .task-detail {
          margin: 8px 0;
        }
        .task-detail strong {
          color: #666;
        }
        .priority-badge {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 3px;
          color: white;
          font-weight: bold;
          text-transform: uppercase;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Task Assigned</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${username}</strong>,</p>
          <p>You have been assigned a new task:</p>
          
          <div class="task-info">
            <div class="task-title">${task.title}</div>
            ${task.description ? `<p>${task.description}</p>` : ''}
            <div class="task-detail">
              <strong>Due Date:</strong> ${dueDate.toLocaleString()}
            </div>
            <div class="task-detail">
              <strong>Priority:</strong> 
              <span class="priority-badge" style="background-color: ${priorityColor}">
                ${task.priority}
              </span>
            </div>
            <div class="task-detail">
              <strong>Status:</strong> ${task.status}
            </div>
          </div>

          <p>Please log in to your account to view and work on this task.</p>
          <p>Best regards,<br>The Task Management Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `
New Task Assigned

Hello ${username},

You have been assigned a new task:

Task: ${task.title}
${task.description ? `Description: ${task.description}` : ''}
Due Date: ${dueDate.toLocaleString()}
Priority: ${task.priority.toUpperCase()}
Status: ${task.status}

Please log in to your account to view and work on this task.

Best regards,
The Task Management Team

---
This is an automated email. Please do not reply to this message.
  `;

  return await sendEmail({ to: email, subject, html, text });
};

/**
 * Send Task Reminder Email
 * 
 * Sends a reminder email for an upcoming task.
 * 
 * @param {string} email - User email address
 * @param {string} username - User username
 * @param {Object} task - Task object
 * @returns {Promise} Promise that resolves when email is sent
 */
const sendTaskReminderEmail = async (email, username, task) => {
  const dueDate = new Date(task.dueDate);
  const now = new Date();
  const hoursUntilDue = Math.round((dueDate - now) / (1000 * 60 * 60));
  const daysUntilDue = Math.round(hoursUntilDue / 24);

  let timeRemaining;
  if (daysUntilDue > 1) {
    timeRemaining = `${daysUntilDue} days`;
  } else if (hoursUntilDue > 1) {
    timeRemaining = `${hoursUntilDue} hours`;
  } else {
    timeRemaining = 'less than an hour';
  }

  const priorityColors = {
    high: '#f44336',
    medium: '#ff9800',
    low: '#4CAF50'
  };

  const priorityColor = priorityColors[task.priority] || '#666';

  const subject = `🔔 Task Reminder: ${task.title}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Task Reminder</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background-color: #f9f9f9;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          background-color: #2196F3;
          color: white;
          padding: 20px;
          border-radius: 5px;
          text-align: center;
          margin-bottom: 20px;
        }
        .content {
          background-color: white;
          padding: 20px;
          border-radius: 5px;
        }
        .task-info {
          background-color: #f5f5f5;
          padding: 15px;
          border-radius: 5px;
          margin: 15px 0;
        }
        .task-title {
          font-size: 20px;
          font-weight: bold;
          color: #2196F3;
          margin-bottom: 10px;
        }
        .task-detail {
          margin: 8px 0;
        }
        .task-detail strong {
          color: #666;
        }
        .priority-badge {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 3px;
          color: white;
          font-weight: bold;
          text-transform: uppercase;
        }
        .status-badge {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 3px;
          background-color: #e0e0e0;
          color: #333;
          text-transform: capitalize;
        }
        .urgent {
          background-color: #f44336;
          color: white;
          padding: 10px;
          border-radius: 5px;
          margin: 15px 0;
          text-align: center;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔔 Task Reminder</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${username}</strong>,</p>
          <p>This is a reminder that you have an upcoming task:</p>
          
          <div class="task-info">
            <div class="task-title">${task.title}</div>
            ${task.description ? `<p>${task.description}</p>` : ''}
            <div class="task-detail">
              <strong>Due Date:</strong> ${dueDate.toLocaleString()}
            </div>
            <div class="task-detail">
              <strong>Time Remaining:</strong> ${timeRemaining}
            </div>
            <div class="task-detail">
              <strong>Priority:</strong> 
              <span class="priority-badge" style="background-color: ${priorityColor}">
                ${task.priority}
              </span>
            </div>
            <div class="task-detail">
              <strong>Status:</strong> 
              <span class="status-badge">${task.status}</span>
            </div>
          </div>

          ${hoursUntilDue < 24 ? `
          <div class="urgent">
            ⚠️ This task is due soon! Please take action.
          </div>
          ` : ''}

          <p>Please log in to your account to view and update this task.</p>
          <p>Best regards,<br>The Task Management Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `
Task Reminder

Hello ${username},

This is a reminder that you have an upcoming task:

Task: ${task.title}
${task.description ? `Description: ${task.description}` : ''}
Due Date: ${dueDate.toLocaleString()}
Time Remaining: ${timeRemaining}
Priority: ${task.priority.toUpperCase()}
Status: ${task.status}

${hoursUntilDue < 24 ? '⚠️ This task is due soon! Please take action.' : ''}

Please log in to your account to view and update this task.

Best regards,
The Task Management Team

---
This is an automated email. Please do not reply to this message.
  `;

  return await sendEmail({ to: email, subject, html, text });
};

/**
 * Send Email Verification Email
 * 
 * Sends an email with verification token to verify user's email address.
 * 
 * @param {string} email - User email address
 * @param {string} username - User username
 * @param {string} verificationToken - Email verification token
 * @returns {Promise} Promise that resolves when email is sent
 */
const sendVerificationEmail = async (email, username, verificationToken) => {
  const config = require('../config/config');
  const verificationUrl = `${config.emailVerification.frontendUrl}/verify-email?token=${verificationToken}`;
  
  const subject = 'Verify Your Email Address - Task Management System';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background-color: #f9f9f9;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          background-color: #2196F3;
          color: white;
          padding: 20px;
          border-radius: 5px;
          text-align: center;
          margin-bottom: 20px;
        }
        .content {
          background-color: white;
          padding: 20px;
          border-radius: 5px;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #2196F3;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
          text-align: center;
        }
        .button:hover {
          background-color: #1976D2;
        }
        .token-info {
          background-color: #f5f5f5;
          padding: 15px;
          border-radius: 5px;
          margin: 15px 0;
          word-break: break-all;
          font-family: monospace;
          font-size: 0.9rem;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          color: #666;
          font-size: 12px;
        }
        .warning {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 10px;
          margin: 15px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Verify Your Email Address</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${username}</strong>,</p>
          <p>Thank you for registering with the Task Management System!</p>
          <p>To complete your registration and activate your account, please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <div class="token-info">${verificationUrl}</div>
          
          <div class="warning">
            <strong>Important:</strong> This verification link will expire in 24 hours. If you didn't create an account, please ignore this email.
          </div>
          
          <p>If the button doesn't work, you can also verify by visiting the link above.</p>
          <p>Once verified, you'll be able to log in and start managing your tasks.</p>
          <p>Best regards,<br>The Task Management Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>If you didn't register for this account, you can safely ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `
Verify Your Email Address - Task Management System

Hello ${username},

Thank you for registering with the Task Management System!

To complete your registration and activate your account, please verify your email address by visiting this link:

${verificationUrl}

Important: This verification link will expire in 24 hours. If you didn't create an account, please ignore this email.

Once verified, you'll be able to log in and start managing your tasks.

Best regards,
The Task Management Team

---
This is an automated email. Please do not reply to this message.
If you didn't register for this account, you can safely ignore this email.
  `;

  return await sendEmail({ to: email, subject, html, text });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendVerificationEmail,
  sendTaskAssignmentEmail,
  sendTaskReminderEmail
};

