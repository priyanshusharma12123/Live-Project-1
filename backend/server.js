const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect('mongodb://localhost:27017/your_database_name', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define MongoDB schema for transactions
const transactionSchema = new mongoose.Schema({
  // Define schema fields
  dateOfSale: Date,
  productTitle: String,
  description: String,
  price: Number,
  // Add other fields as needed
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// Fetch data from the third-party API and initialize the database with seed data
async function initializeDatabase() {
  try {
    const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    const seedData = response.data;

    // Insert seed data into the MongoDB collection
    await Transaction.insertMany(seedData);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error.message);
  }
}

// Initialize the database on server start
initializeDatabase();

app.get('/transactions', async (req, res) => {
  try {
    const { page = 1, perPage = 10, search = '' } = req.query;
    const skip = (page - 1) * perPage;

    let query = {};
    if (search) {
      query = {
        $or: [
          { productTitle: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { price: { $regex: search, $options: 'i' } },
        ],
      };
    }

    const transactions = await Transaction.find(query)
      .skip(skip)
      .limit(Number(perPage));

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/statistics/:month', async (req, res) => {
  try {
    const { month } = req.params;

    const totalSaleAmount = await Transaction.aggregate([
      {
        $match: {
          dateOfSale: { $regex: new RegExp(month, 'i') },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$price' },
          totalSoldItems: { $sum: 1 },
          totalNotSoldItems: { $sum: { $cond: [{ $eq: ['$price', 0] }, 1, 0] } },
        },
      },
    ]);

    res.json(totalSaleAmount[0]);
  } catch (error) {
    console.error('Error calculating statistics:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/bar-chart/:month', async (req, res) => {
  // Implement logic for the bar chart API
  // ...
});

app.get('/pie-chart/:month', async (req, res) => {
  // Implement logic for the pie chart API
  // ...
});

app.get('/combined-data/:month', async (req, res) => {
  try {
    const { month } = req.params;

    const transactions = await axios.get(`/transactions?search=${month}`);
    const statistics = await axios.get(`/statistics/${month}`);
    const barChart = await axios.get(`/bar-chart/${month}`);
    const pieChart = await axios.get(`/pie-chart/${month}`);

    const combinedData = {
      transactions: transactions.data,
      statistics: statistics.data,
      barChart: barChart.data,
      pieChart: pieChart.data,
    };

    res.json(combinedData);
  } catch (error) {
    console.error('Error fetching combined data:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

