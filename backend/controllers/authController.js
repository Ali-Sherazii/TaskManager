/**
 * Authentication Controller
 * 
 * Handles user authentication operations using MongoDB/Mongoose.
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/config');
const User = require('../models/User');
const Session = require('../models/Session');
const { sendVerificationEmail, sendWelcomeEmail } = require('../services/emailService');

/**
 * User Registration
 */
const register = async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;

    // Check for existing user
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + config.emailVerification.tokenExpirationHours);

    // Create new user (password will be hashed by pre-save hook)
    const user = new User({
      username,
      email,
      password,
      role,
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires
    });

    await user.save();

    // Send verification email (don't wait for it to complete)
    sendVerificationEmail(user.email, user.username, verificationToken)
      .then(result => {
        if (result.success) {
          console.log(`Verification email sent to ${user.email}`);
        } else {
          console.error(`Failed to send verification email to ${user.email}:`, result.error);
        }
      })
      .catch(error => {
        console.error(`Error sending verification email to ${user.email}:`, error);
        // Don't fail registration if email fails
      });

    // Return user without password (toJSON removes password)
    res.status(201).json({
      message: 'User registered successfully. Please check your email to verify your account.',
      user: {
        ...user.toJSON(),
        emailVerificationToken: undefined // Don't send token in response
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ error: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists` });
    }
    
    // Handle CastError (invalid role, etc.)
    if (error.name === 'CastError') {
      return res.status(400).json({ error: `Invalid ${error.path}: ${error.value}` });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * User Login
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password using model method
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({ 
        error: 'Email not verified. Please check your email and verify your account before logging in.',
        requiresVerification: true
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    // Calculate expiration date
    let expiresInMs = 24 * 60 * 60 * 1000; // default 24 hours
    const expiresIn = config.jwtExpiresIn.toLowerCase();
    
    if (expiresIn.endsWith('h')) {
      expiresInMs = parseInt(expiresIn) * 60 * 60 * 1000;
    } else if (expiresIn.endsWith('d')) {
      expiresInMs = parseInt(expiresIn) * 24 * 60 * 60 * 1000;
    } else if (expiresIn.endsWith('m')) {
      expiresInMs = parseInt(expiresIn) * 60 * 1000;
    } else if (expiresIn.endsWith('s')) {
      expiresInMs = parseInt(expiresIn) * 1000;
    } else {
      const num = parseInt(expiresIn);
      if (!isNaN(num)) {
        expiresInMs = num * 60 * 60 * 1000;
      }
    }
    
    const expiresAt = new Date(Date.now() + expiresInMs);

    // Store session in database
    const session = new Session({
      userId: user._id,
      token,
      expiresAt
    });
    await session.save();

    // Return token and user info
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * User Logout
 */
const logout = async (req, res) => {
  try {
    const token = req.token;

    // Delete session from database
    await Session.deleteOne({ token });

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Revoke User Sessions
 */
const revokeSession = async (req, res) => {
  try {
    const { userId } = req.params;

    // Authorization check
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Delete all sessions for the user
    await Session.deleteMany({ userId });

    res.json({ message: 'All sessions revoked successfully' });
  } catch (error) {
    console.error('Revoke session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Verify Email
 * 
 * Verifies user's email address using the verification token.
 */
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    // Find user with matching token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    // Verify email
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    // Send welcome email after verification
    sendWelcomeEmail(user.email, user.username)
      .then(result => {
        if (result.success) {
          console.log(`Welcome email sent to ${user.email}`);
        } else {
          console.error(`Failed to send welcome email to ${user.email}:`, result.error);
        }
      })
      .catch(error => {
        console.error(`Error sending welcome email to ${user.email}:`, error);
      });

    res.json({
      message: 'Email verified successfully. You can now log in.',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Resend Verification Email
 * 
 * Resends the verification email to the user.
 */
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if email exists for security
      return res.status(200).json({ 
        message: 'If an account exists with this email, a verification email has been sent.' 
      });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Generate new verification token
    const crypto = require('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + config.emailVerification.tokenExpirationHours);

    // Update user with new token
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    await user.save();

    // Send verification email
    const result = await sendVerificationEmail(user.email, user.username, verificationToken);
    
    if (result.success) {
      res.json({ 
        message: 'Verification email sent successfully. Please check your email.' 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to send verification email. Please try again later.' 
      });
    }
  } catch (error) {
    console.error('Resend verification email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  register,
  login,
  logout,
  revokeSession,
  verifyEmail,
  resendVerificationEmail
};
