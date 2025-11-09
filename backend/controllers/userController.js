/**
 * User Management Controller
 * 
 * Handles user management operations using MongoDB/Mongoose.
 */

const User = require('../models/User');

/**
 * Create User
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

    // Create user (password will be hashed by pre-save hook)
    const user = new User({
      username,
      email,
      password,
      role
    });

    await user.save();

    // Format user with id field
    const formattedUser = {
      ...user.toJSON(),
      id: user._id.toString()
    };

    res.status(201).json({
      message: 'User created successfully',
      user: formattedUser
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
