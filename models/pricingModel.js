const mongoose = require("mongoose");

const pricingSchema = new mongoose.Schema(
  {
    price: {
      type: Number,
      required: true,
    },
    typeColis: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PackageType",
      required: true,
    },
    transportType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TransportType",
      required: true,
    },
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MeasureUnit",
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, "Quantity must be greater than 0"],
    },
    status: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Pricing = mongoose.model("Pricing", pricingSchema);

module.exports = Pricing;
