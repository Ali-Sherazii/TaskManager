/**
 * Email Setup Helper Script
 * 
 * This script helps you add email credentials to .env file
 * Usage: node setup-email.js <app-password>
 * 
 * Example: node setup-email.js abcdefghijklmnop
 */

const fs = require('fs');
const path = require('path');

const appPassword = process.argv[2];

if (!appPassword) {
  console.log('\nError: App password is required!');
  console.log('\nUsage: node setup-email.js <your-16-character-app-password>');
  console.log('\nExample: node setup-email.js abcdefghijklmnop');
  console.log('\nTo get your Gmail App Password:');
  console.log('1. Go to: https://myaccount.google.com/apppasswords');
  console.log('2. Generate a new app password for "Mail"');
  console.log('3. Copy the 16-character password (remove spaces)');
  console.log('4. Run this script with that password\n');
  process.exit(1);
}

if (appPassword.length < 16) {
  console.log('\nWarning: App password should be 16 characters long');
  console.log('Make sure you removed all spaces from the password\n');
}

const envPath = path.join(__dirname, '.env');
let envContent = '';

// Read existing .env if it exists
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
} else {
  // Create base .env content
  envContent = `# Server Configuration
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long-change-in-production
JWT_EXPIRES_IN=24h

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/taskmanager

`;
}

// Remove old email configuration if exists
const lines = envContent.split('\n');
const filteredLines = lines.filter(line => 
  !line.startsWith('EMAIL_ENABLED') &&
  !line.startsWith('EMAIL_SERVICE') &&
  !line.startsWith('EMAIL_USER') &&
  !line.startsWith('EMAIL_PASSWORD') &&
  !line.startsWith('EMAIL_FROM') &&
  !line.startsWith('EMAIL_FROM_NAME') &&
  !line.trim().startsWith('# Email')
);

// Add email configuration
const emailConfig = `
# Email Configuration - Gmail Setup for sheraziihassan@gmail.com
EMAIL_ENABLED=true
EMAIL_SERVICE=gmail
EMAIL_USER=sheraziihassan@gmail.com
EMAIL_PASSWORD=${appPassword}
EMAIL_FROM=sheraziihassan@gmail.com
EMAIL_FROM_NAME=Task Management System
`;

const newContent = filteredLines.join('\n') + emailConfig;

// Write to .env file
fs.writeFileSync(envPath, newContent, 'utf8');

console.log('\nEmail configuration added to .env file!');
console.log('\nEmail Settings:');
console.log('   Email: sheraziihassan@gmail.com');
console.log('   Service: Gmail');
console.log('   App Password: ' + appPassword.substring(0, 2) + '***' + appPassword.substring(appPassword.length - 2));
console.log('\nNext steps:');
console.log('   1. Restart your server: npm start');
console.log('   2. Test by registering a user');
console.log('   3. Check your email inbox!\n');

