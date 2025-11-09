# Email Service Setup Guide

## Overview

The Task Management System uses Nodemailer to send emails for:
- Welcome emails when users register
- Task reminders for upcoming due dates

## Supported Email Services

The system supports multiple email providers:

1. **Gmail** (Recommended for development)
2. **SendGrid** (Recommended for production)
3. **Mailgun** (Production-ready)
4. **Generic SMTP** (Any SMTP server)

---

## Configuration

Add the following environment variables to your `.env` file:

### Basic Configuration

```env
# Enable/disable email service
EMAIL_ENABLED=true

# Email service provider: 'gmail', 'sendgrid', 'mailgun', or 'smtp'
EMAIL_SERVICE=gmail

# Sender information
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=Task Management System
```

---

## Gmail Setup (Development)

### Step 1: Enable 2-Factor Authentication

1. Go to your Google Account settings
2. Enable 2-Factor Authentication

### Step 2: Generate App Password

1. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" and "Other (Custom name)"
3. Enter "Task Management System"
4. Click "Generate"
5. Copy the 16-character password

### Step 3: Configure Environment Variables

```env
EMAIL_ENABLED=true
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=Task Management System
```

Note: Use the App Password, not your regular Gmail password.

---

## SendGrid Setup (Production Recommended)

### Step 1: Create SendGrid Account

1. Sign up at [SendGrid](https://sendgrid.com/)
2. Verify your email address

### Step 2: Create API Key

1. Go to Settings → API Keys
2. Click "Create API Key"
3. Choose "Full Access" or "Restricted Access" (Mail Send permission)
4. Copy the API key (you won't see it again)

### Step 3: Verify Sender Identity

1. Go to Settings → Sender Authentication
2. Verify Single Sender or Domain
3. Follow the verification steps

### Step 4: Configure Environment Variables

```env
EMAIL_ENABLED=true
EMAIL_SERVICE=sendgrid
EMAIL_API_KEY=SG.your-api-key-here
EMAIL_FROM=verified-sender@yourdomain.com
EMAIL_FROM_NAME=Task Management System
```

SendGrid Free Tier:
- 100 emails per day
- Perfect for development and small projects

---

## Mailgun Setup (Production)

### Step 1: Create Mailgun Account

1. Sign up at [Mailgun](https://www.mailgun.com/)
2. Verify your email address

### Step 2: Get SMTP Credentials

1. Go to Sending → Domain Settings
2. Copy SMTP credentials:
   - SMTP hostname
   - SMTP port
   - SMTP username
   - SMTP password

### Step 3: Configure Environment Variables

```env
EMAIL_ENABLED=true
EMAIL_SERVICE=mailgun
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-smtp-username
EMAIL_PASSWORD=your-smtp-password
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Task Management System
```

Mailgun Free Tier:
- 5,000 emails per month
- 100 emails per day
- Great for production use

---

## Generic SMTP Setup

### Configuration for Any SMTP Server

```env
EMAIL_ENABLED=true
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@yourdomain.com
EMAIL_PASSWORD=your-password
EMAIL_FROM=your-email@yourdomain.com
EMAIL_FROM_NAME=Task Management System
EMAIL_REJECT_UNAUTHORIZED=true
```

### Common SMTP Providers

**Outlook/Hotmail:**
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

**Yahoo:**
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

**Custom SMTP:**
- Use your hosting provider's SMTP settings
- Check with your provider for correct configuration

---

## Testing Email Configuration

### Test Email Service

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Register a new user:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "username": "testuser",
       "email": "your-email@example.com",
       "password": "password123"
     }'
   ```

3. **Check your email inbox** for the welcome email

4. **Create a task with due date within 48 hours:**
   ```bash
   curl -X POST http://localhost:3000/api/tasks \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <token>" \
     -d '{
       "title": "Test Task",
       "dueDate": "2024-12-31T23:59:59.000Z",
       "assignedTo": "<user-id>"
     }'
   ```

5. **Wait for reminder** (runs every hour) or trigger manually

### Verify Email Sending

Check server logs for:
- `✅ Email server is ready to send messages`
- `✅ Email sent successfully to <email>`
- `✅ Welcome email sent to <email>`
- `✅ Reminder email sent to <email>`

---

## Disable Email Service (Development)

If you want to disable email sending during development:

```env
EMAIL_ENABLED=false
```

When disabled, emails will be logged to the console instead of being sent.

---

## Troubleshooting

### Common Issues

1. **"Invalid login" error:**
   - Check username and password
   - For Gmail, use App Password, not regular password
   - Verify 2FA is enabled for Gmail

2. **"Connection timeout" error:**
   - Check firewall settings
   - Verify SMTP host and port
   - Check network connectivity

3. **"Authentication failed" error:**
   - Verify credentials are correct
   - Check if account is locked or suspended
   - For Gmail, ensure App Password is used

4. **"Email not received":**
   - Check spam folder
   - Verify sender email is verified
   - Check email service logs
   - Verify EMAIL_ENABLED is set to true

5. **"Rate limit exceeded":**
   - Check email service limits
   - Reduce email frequency
   - Upgrade email service plan

### Gmail Specific Issues

- **"Less secure app access":** Use App Password instead
- **"Access blocked":** Enable 2FA and use App Password
- **"Quota exceeded":** Gmail has daily sending limits

### SendGrid Specific Issues

- **"Unauthorized":** Verify API key is correct
- **"Sender not verified":** Verify sender identity
- **"Domain not verified":** Complete domain verification

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

This will show detailed email sending logs.

---

## Production Recommendations

1. **Use SendGrid or Mailgun** for production
2. **Verify sender domain** for better deliverability
3. **Set up SPF and DKIM** records
4. **Monitor email delivery** rates
5. **Handle bounces and complaints** properly
6. **Use dedicated IP** for high volume
7. **Implement email queue** for reliability
8. **Set up email templates** for consistency

---

## Email Templates

The system includes HTML email templates for:
- **Welcome emails:** Sent on user registration
- **Task reminders:** Sent for upcoming tasks

Templates are customizable in `backend/services/emailService.js`.

---

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use environment variables** for sensitive data
3. **Rotate API keys** regularly
4. **Use App Passwords** for Gmail
5. **Enable 2FA** on email accounts
6. **Monitor email logs** for suspicious activity
7. **Implement rate limiting** to prevent abuse

---

## Additional Resources

- [Nodemailer Documentation](https://nodemailer.com/about/)
- [SendGrid Documentation](https://docs.sendgrid.com/)
- [Mailgun Documentation](https://documentation.mailgun.com/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)

---

## Support

For issues or questions:
- Check server logs
- Review email service documentation
- Verify configuration
- Test with a simple email first

