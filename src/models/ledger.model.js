const mongoose = require('mongoose')

const ledgerSchema = new mongoose.Schema({
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount must be a positive number']
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true
  }
},{
  timestamps: true
})

const ledgerModel = mongoose.model('Ledger', ledgerSchema)

module.exports = ledgerModel