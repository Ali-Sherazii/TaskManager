/**
 * Session Model
 * 
 * Tracks active user sessions for token revocation.
 */

const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true,
    expires: 0 // MongoDB TTL index - auto-deletes expired sessions
  }
}, {
  timestamps: true
});

// Index for faster queries (token already has unique index from schema)
sessionSchema.index({ userId: 1 });

// Create and export Session model
const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;

