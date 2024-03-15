const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    reference: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, "Amount must be greater than 0"],
    },
    status: {
      type: String,
      enum: ["failed", "pending", "success"],
      default: "pending",
      required: true,
    },
    transactionType: {
      type: String,
      enum: ["product", "order"],
      required: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    transactionPhone: {
      network: {
        type: String,
        enum: ["MTN", "MOOV"],
        required: true,
      },
      value: {
        type: String,
        required: true,
      },
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: function () {
        return this.transactionType === "order" ? "Commande" : "ProductOrder";
      },
    },
    step: {
      type: String,
      enum: ["1", "2"],
      default: "1",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
