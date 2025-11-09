/**
 * User Model
 * 
 * Defines the structure and validation for user documents in MongoDB.
 * 
 * Mongoose Schema vs SQL Table:
 * - Schema = Table structure
 * - Document = Row/Record
 * - Collection = Table
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: function() {
      // Password is required only if not an admin-created user (has no temp password flag)
      return !this.isAdminCreated;
    },
    minlength: [6, 'Password must be at least 6 characters']
  },
  isAdminCreated: {
    type: Boolean,
    default: false
  },
  requiresPasswordSetup: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'user'],
    default: 'user'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  emailVerificationExpires: {
    type: Date,
    default: null
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Note: unique: true in schema already creates indexes, so we don't need to add them again

// Hash password before saving (pre-save hook)
userSchema.pre('save', async function(next) {
  // Only hash password if it's been modified (or is new) and exists
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  
  try {
    // Hash password with bcrypt (10 rounds)
    const hashedPassword = await bcrypt.hash(this.password, 10);
    this.password = hashedPassword;
    // Clear requiresPasswordSetup flag when password is set
    if (this.requiresPasswordSetup && this.password) {
      this.requiresPasswordSetup = false;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password (instance method)
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to return user without password and sensitive fields (for security)
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.emailVerificationToken;
  delete userObject.emailVerificationExpires;
  return userObject;
};

// Create and export User model
const User = mongoose.model('User', userSchema);

module.exports = User;

