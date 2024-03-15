const mongoose = require("mongoose");

const statusEnum = ["Enregistrée", "Livrée"];

const productOrderSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      required: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, "Quantity must be greater than 0"],
    },
    price: {
      type: Number,
      required: true,
      min: [0, "Quantity must be greater than 0"],
    },
    total: {
      type: Number,
      required: true,
      min: [0, "Quantity must be greater than 0"],
    },
    status: {
      type: String,
      required: true,
      validate: {
        validator: function (value) {
          return statusEnum.includes(value); // Check if the value exists in the statusEnum array
        },
        message: (props) => `${props.value} is not a valid status!`,
      },
    },
    specialNote: {
      type: String,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "unpaid"],
      default: "unpaid",
    },
  },
  {
    timestamps: true,
  },
);

const ProductOrder = mongoose.model("ProductOrder", productOrderSchema);

module.exports = ProductOrder;
