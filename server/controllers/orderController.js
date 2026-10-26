const calculateOrderPreview = (req, res) => {
    try {
        const { personalInfo, items } = req.body;

        if (!personalInfo || !personalInfo.fullName || !personalInfo.email || !personalInfo.phone || !personalInfo.address) {
            return res.status(400).json({
                success: false,
                message: "Missing required personal information."
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(personalInfo.email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email address format provided."
            });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please include at least one purchased item."
            });
        }

        let subtotal = 0;
        const processedItems = items.map((item, index) => {
            const name = (item.name || "").trim() || `Item #${index + 1}`;
            const price = parseFloat(item.price);
            const quantity = parseInt(item.quantity, 10);

            if (isNaN(price) || price < 0) {
                throw new Error(`Invalid price for item "${name}". Must be a positive number.`);
            }
            if (isNaN(quantity) || quantity <= 0) {
                throw new Error(`Invalid quantity for item "${name}". Must be at least 1.`);
            }

            const itemTotal = Number((price * quantity).toFixed(2));
            subtotal += itemTotal;

            return {
                id: index + 1,
                name,
                price: Number(price.toFixed(2)),
                quantity,
                total: itemTotal
            };
        });

        subtotal = Number(subtotal.toFixed(2));

        const taxRate = 0.05;
        const taxAmount = Number((subtotal * taxRate).toFixed(2));
        const shippingFee = subtotal > 100 || subtotal === 0 ? 0.00 : 10.00;
        const totalBillAmount = Number((subtotal + taxAmount + shippingFee).toFixed(2));

        const previewId = "PREV-" + Math.floor(100000 + Math.random() * 900000);
        const orderDate = new Date().toLocaleString();

        return res.status(200).json({
            success: true,
            message: "Order preview calculated successfully",
            data: {
                previewId,
                orderDate,
                personalInfo: {
                    fullName: personalInfo.fullName.trim(),
                    email: personalInfo.email.trim(),
                    phone: personalInfo.phone.trim(),
                    address: personalInfo.address.trim(),
                    city: personalInfo.city ? personalInfo.city.trim() : "N/A",
                    paymentMethod: personalInfo.paymentMethod || "Credit/Debit Card",
                    notes: personalInfo.notes ? personalInfo.notes.trim() : ""
                },
                items: processedItems,
                summary: {
                    itemCount: processedItems.reduce((acc, curr) => acc + curr.quantity, 0),
                    subtotal,
                    taxRate: "5%",
                    taxAmount,
                    shippingFee,
                    totalBillAmount
                }
            }
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to process order calculation."
        });
    }
};

const submitOrder = (req, res) => {
    try {
        const { previewId, personalInfo, items, summary } = req.body;

        if (!personalInfo || !items || !summary) {
            return res.status(400).json({
                success: false,
                message: "Incomplete order data provided for final submission."
            });
        }

        const orderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);
        const confirmationTimestamp = new Date().toISOString();

        return res.status(201).json({
            success: true,
            message: "Order placed and confirmed successfully!",
            data: {
                orderId,
                status: "CONFIRMED",
                confirmedAt: confirmationTimestamp,
                customer: personalInfo.fullName,
                totalPaid: summary.totalBillAmount
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error occurred while confirming order."
        });
    }
};

module.exports = {
    calculateOrderPreview,
    submitOrder
};
