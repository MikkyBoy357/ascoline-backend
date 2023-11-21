const mongoose = require('mongoose');

const pricingSchema = new mongoose.Schema(
    {
        price: {
            type: Number,
            required: true
        },
        typeColis: {
            type: String,
            required: true
        },
        transportType: {
            type: String,
            required: true
        },
        unit: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            required: true
        },
    },
    {
        timestamps: true
    }
);

const Pricing = mongoose.model('Pricing', pricingSchema);

module.exports = Pricing;