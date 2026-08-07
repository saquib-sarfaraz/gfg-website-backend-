const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  communityId: { type: String, default: 'gfg-jamia-hamdard', index: true },
  operatorRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  operatorRole: { type: String, default: 'User' },
  action: { type: String, required: true }, // e.g. 'POST_PERMANENT_DELETE', 'EVENT_PERMANENT_DELETE'
  targetType: { type: String, required: true }, // 'post', 'event', 'gallery', 'comment'
  targetId: { type: String, required: true },
  targetTitle: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  ipAddress: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
