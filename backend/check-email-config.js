/**
 * Email Configuration Checker
 * 
 * This script checks if email configuration is set up correctly.
 * Run: node check-email-config.js
 */

require('dotenv').config();

console.log('\nEmail Configuration Checker\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Check required environment variables
const requiredVars = {
  'EMAIL_ENABLED': process.env.EMAIL_ENABLED,
  'EMAIL_SERVICE': process.env.EMAIL_SERVICE,
  'EMAIL_USER': process.env.EMAIL_USER,
  'EMAIL_PASSWORD': process.env.EMAIL_PASSWORD,
  'EMAIL_FROM': process.env.EMAIL_FROM
};

let allSet = true;

console.log('Checking environment variables:\n');

for (const [key, value] of Object.entries(requiredVars)) {
  if (value) {
    // Mask password for security
    if (key === 'EMAIL_PASSWORD') {
      const masked = value.length > 4 
        ? value.substring(0, 2) + '***' + value.substring(value.length - 2)
        : '***';
      console.log(`[OK] ${key}: ${masked}`);
    } else {
      console.log(`[OK] ${key}: ${value}`);
    }
  } else {
    console.log(`[MISSING] ${key}: NOT SET`);
    allSet = false;
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (allSet) {
  console.log('All email configuration variables are set!');
  console.log('\nNext steps:');
  console.log('1. Make sure EMAIL_PASSWORD is your Gmail App Password (16 characters)');
  console.log('2. Restart your server: npm start');
  console.log('3. Test by registering a user');
} else {
  console.log('Some email configuration variables are missing!');
  console.log('\nPlease add these to your .env file:');
  console.log('\nEMAIL_ENABLED=true');
  console.log('EMAIL_SERVICE=gmail');
  console.log('EMAIL_USER=sheraziihassan@gmail.com');
  console.log('EMAIL_PASSWORD=your-16-character-app-password');
  console.log('EMAIL_FROM=sheraziihassan@gmail.com');
  console.log('EMAIL_FROM_NAME=Task Management System');
  console.log('\nSee SETUP_GMAIL_EMAIL.md for detailed instructions.');
}

console.log('\n');

