const mongoose = require('mongoose');

const adminAccessSchema = new mongoose.Schema({
  userRef: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true 
  },
  adminRole: { 
    type: String, 
    enum: ['ROOT_SUPER_ADMIN', 'SUPER_ADMIN', 'ADMIN'], 
    required: true, 
    default: 'ADMIN' 
  },
  permissions: [{ 
    type: String 
  }],
  pinHash: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Active', 'Suspended', 'Revoked'], 
    default: 'Active' 
  },
  failedLoginAttempts: { 
    type: Number, 
    default: 0 
  },
  lockedUntil: { 
    type: Date, 
    default: null 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  lastLoginAt: { 
    type: Date 
  }
}, { timestamps: true });

module.exports = mongoose.model('AdminAccess', adminAccessSchema);
