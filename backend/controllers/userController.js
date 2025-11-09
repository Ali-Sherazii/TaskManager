/**
 * User Management Controller
 * 
 * Handles user management operations using MongoDB/Mongoose.
 */

const crypto = require('crypto');
const User = require('../models/User');
const config = require('../config/config');
const { sendAdminCreatedUserEmail } = require('../services/emailService');

/**
 * Create User
 * 
 * Creates a new user and sends verification email.
 * When admin creates a user, the user must verify their email before logging in.
 */
const createUser = async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Generate random 6-character password for admin-created user
    const generateRandomPassword = (length = 6) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let password = '';
      for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };

    const generatedPassword = generateRandomPassword(6);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + config.emailVerification.tokenExpirationHours);

    // Create user with generated password (password will be hashed by pre-save hook)
    const user = new User({
      username,
      email,
      password: generatedPassword,
      role,
      isEmailVerified: true, // Auto-verify admin-created users
      emailVerificationToken: null,
      emailVerificationExpires: null,
      isAdminCreated: true,
      requiresPasswordSetup: false
    });

    await user.save();

    // Send admin-created user email with credentials (don't wait for it to complete)
    sendAdminCreatedUserEmail(user.email, user.username, generatedPassword)
      .then(result => {
        if (result.success) {
          console.log(`Activation email sent to ${user.email} for admin-created user`);
        } else {
          console.error(`Failed to send activation email to ${user.email}:`, result.error);
        }
      })
      .catch(error => {
        console.error(`Error sending activation email to ${user.email}:`, error);
      });

    // Format user with id field
    const formattedUser = {
      ...user.toJSON(),
      id: user._id.toString()
    };

    res.status(201).json({
      message: 'User created successfully. Login credentials have been sent to the user via email.',
      user: formattedUser,
      emailSent: true
    });
  } catch (error) {
    console.error('Create user error:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get All Users
 */
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Parse pagination parameters
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 10, 100); // Max 100 items per page
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const total = await User.countDocuments();

    // Get users with pagination
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    // Format users with id field (MongoDB uses _id)
    const formattedUsers = users.map(user => ({
      ...user.toObject(),
      id: user._id.toString()
    }));
    
    res.json({
      users: formattedUsers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get User by ID
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Format user with id field
    const formattedUser = {
      ...user.toObject(),
      id: user._id.toString()
    };

    res.json({ user: formattedUser });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update User Role
 */
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'manager', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Format user with id field
    const formattedUser = {
      ...user.toObject(),
      id: user._id.toString()
    };

    res.json({
      message: 'User role updated successfully',
      user: formattedUser
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUserRole
};
