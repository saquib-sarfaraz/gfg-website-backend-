const mongoose = require('mongoose');

const adminAuditLogSchema = new mongoose.Schema({
  operatorRef: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  operatorEmail: { 
    type: String 
  },
  targetUserRef: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  targetEmail: { 
    type: String 
  },
  action: { 
    type: String, 
    required: true,
    enum: [
      'ADMIN_LOGIN_SUCCESS',
      'ADMIN_LOGIN_FAILED',
      'ADMIN_ACCESS_GRANTED',
      'ADMIN_ACCESS_REVOKED',
      'ADMIN_PIN_RESET',
      'ADMIN_PIN_CHANGED',
      'ADMIN_ROLE_CHANGED',
      'ADMIN_PERMISSION_CHANGED',
      'ADMIN_SUSPENDED',
      'ADMIN_UNSUSPENDED'
    ]
  },
  details: { 
    type: String, 
    default: '' 
  },
  ipAddress: { 
    type: String, 
    default: '' 
  },
  userAgent: { 
    type: String, 
    default: '' 
  }
}, { timestamps: true });

module.exports = mongoose.model('AdminAuditLog', adminAuditLogSchema);
