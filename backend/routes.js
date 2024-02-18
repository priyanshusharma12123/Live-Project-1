const express = require('express');
const router = express.Router();
const axios = require('axios');

// Import your Transaction model
const Transaction = require('./models/Transaction.js');

// ... (previous code)

// Route for statistics
router.get('/statistics/:month', async (req, res) => {
  try {
    const month = req.params.month;

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

// Route for bar chart
router.get('/bar-chart/:month', async (req, res) => {
  try {
    const month = req.params.month;

    const barChartData = await Transaction.aggregate([
      {
        $match: {
          dateOfSale: { $regex: new RegExp(month, 'i') },
        },
      },
      {
        $group: {
          _id: {
            $concat: [
              { $cond: [{ $lte: ['$price', 100] }, '0-100', ''] },
              { $cond: [{ $and: [{ $gt: ['$price', 100] }, { $lte: ['$price', 200] }] }, '101-200', ''] },
              // Add other price ranges as needed
            ],
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const formattedChartData = barChartData.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    res.json(formattedChartData);
  } catch (error) {
    console.error('Error calculating bar chart data:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route for combined data
router.get('/combined-data/:month', async (req, res) => {
  try {
    const month = req.params.month;

    const transactions = await axios.get(`/transactions?search=${month}`);
    const statistics = await axios.get(`/statistics/${month}`);
    const barChart = await axios.get(`/bar-chart/${month}`);

    const combinedData = {
      transactions: transactions.data,
      statistics: statistics.data,
      barChart: barChart.data,
    };

    res.json(combinedData);
  } catch (error) {
    console.error('Error fetching combined data:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;

