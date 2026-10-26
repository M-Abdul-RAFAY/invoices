/**
 * ORDER ROUTES
 * Defines the endpoints and maps them to their respective controller functions.
 */

const express = require('express');
const router = express.Router();
const { calculateOrderPreview, submitOrder } = require('../controllers/orderController');

// Route 1: Health check endpoint
// Method: GET | URL: /api/orders/health
router.get('/health', (req, res) => {
    res.status(200).json({
        status: "OK",
        message: "Order API routes are running properly",
        timestamp: new Date().toISOString()
    });
});

// Route 2: Preview Order and Calculate Bill Sum
// Method: POST | URL: /api/orders/preview
router.post('/preview', calculateOrderPreview);

// Route 3: Finalize / Submit Order
// Method: POST | URL: /api/orders/submit
router.post('/submit', submitOrder);

module.exports = router;
