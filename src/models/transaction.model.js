const mongoose = require('mongoose')


const transactionSchema = new mongoose.Schema({
  toAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account', 
    required: true
  },
  fromAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount must be a positive number']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  idempotencyKey: {
    type: String,
    required: true,
    unique: true
  }
},{
  timestamps: true
})

const transactionModel = mongoose.model('Transaction', transactionSchema)

module.exports = transactionModel