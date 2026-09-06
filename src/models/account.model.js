const mongoose = require('mongoose')

const accountSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  bonusClaimed: {
    type: Boolean,
    default: false,
  }
},{
  timestamps: true,
})
    
const accountModel = mongoose.model('Account', accountSchema)

module.exports = accountModel