const express = require('express');
const router = express.Router();
const { calculateOrderPreview, submitOrder } = require('../controllers/orderController');

router.get('/health', (req, res) => {
    res.status(200).json({
        status: "OK",
        message: "Order API routes are running properly",
        timestamp: new Date().toISOString()
    });
});

router.post('/preview', calculateOrderPreview);
router.post('/submit', submitOrder);

module.exports = router;
