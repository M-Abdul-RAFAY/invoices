const express = require('express');
const cors = require('cors');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/orders', orderRoutes);

app.get('/', (req, res) => {
    res.json({
        message: "E-Commerce Order Management API is active and running!",
        routes: {
            health: "GET /api/orders/health",
            preview: "POST /api/orders/preview",
            submit: "POST /api/orders/submit"
        }
    });
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found on this server.`
    });
});

app.use((err, req, res, next) => {
    console.error("Server Error:", err.stack);
    res.status(500).json({
        success: false,
        message: "An internal server error occurred."
    });
});

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
