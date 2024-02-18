const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  dateOfSale: {
    type: Date,
    required: true,
  },
  productTitle: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  price: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
  },
  // Add other fields as needed
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
