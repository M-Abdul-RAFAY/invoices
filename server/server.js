/**
 * MAIN SERVER FILE (server.js)
 * Initializes Express, applies middlewares, connects routes, and starts the HTTP server.
 */

// Step 1: Import required modules
const express = require('express');
const cors = require('cors');
const orderRoutes = require('./routes/orderRoutes');

// Step 2: Initialize Express application instance
const app = express();

// Step 3: Define Server Port
const PORT = process.env.PORT || 5000;

// Step 4: Configure Middlewares
// Enable Cross-Origin Resource Sharing (CORS) so the client on another port can communicate with this API
app.use(cors());

// Parse incoming requests with JSON payloads (Populates req.body)
app.use(express.json());

// Step 5: Mount API Routes
// All order endpoints will be prefixed with /api/orders
app.use('/api/orders', orderRoutes);

// Root route for quick verification
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

// Step 6: 404 Handler for undefined routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found on this server.`
    });
});

// Step 7: Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error("Unhandled Server Error:", err.stack);
    res.status(500).json({
        success: false,
        message: "An internal server error occurred."
    });
});

// Step 8: Start the HTTP server listener
app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 Server successfully started!`);
    console.log(`📡 Listening on: http://localhost:${PORT}`);
    console.log(`🔍 Test endpoint: http://localhost:${PORT}/api/orders/health`);
    console.log(`=========================================`);
});
