/**
 * Script to create .env file with secure JWT_SECRET
 * Run: node create-env.js
 */

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

// Generate secure JWT secret (64 characters)
const jwtSecret = crypto.randomBytes(32).toString('hex');

const envContent = `# Server Configuration
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# JWT Configuration
# Generated secure secret - keep this secret!
JWT_SECRET=${jwtSecret}
JWT_EXPIRES_IN=24h

# MongoDB Configuration
# Local MongoDB: mongodb://localhost:27017/taskmanager
# MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/taskmanager
MONGODB_URI=mongodb://localhost:27017/taskmanager

# Email Configuration
EMAIL_ENABLED=true
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=Task Management System

# Email Verification Configuration
EMAIL_VERIFICATION_EXPIRATION_HOURS=24

# Reminder Configuration
REMINDER_THRESHOLDS=48,24,1
REMINDER_CHECK_INTERVAL=60
`;

const envPath = path.join(__dirname, '.env');

// Check if .env already exists
if (fs.existsSync(envPath)) {
  console.log('WARNING: .env file already exists!');
  console.log('If you want to regenerate it, delete the existing .env file first.');
  process.exit(1);
}

// Write .env file
fs.writeFileSync(envPath, envContent, 'utf8');

console.log('SUCCESS: .env file created successfully!');
console.log('A secure JWT_SECRET has been generated.');
console.log('\nIMPORTANT:');
console.log('1. Update EMAIL_USER and EMAIL_PASSWORD with your email credentials');
console.log('2. Update MONGODB_URI if using MongoDB Atlas or different connection');
console.log('3. Never commit .env file to version control');
console.log('\nYour JWT_SECRET:', jwtSecret);

