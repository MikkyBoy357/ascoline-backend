const express = require("express");
const router = express.Router();
const Client = require("../models/clientModel");
const User = require("../models/userModel");
const Commande = require("../models/commandeModel");
const Transaction = require("../models/transactionModel");

const { authorizeJwt, verifyAccount } = require("../helpers/verifyAccount");

router.get(
  "/",
  authorizeJwt,
  verifyAccount([{ name: "client", action: "read" }]),
  async (req, res) => {
    let count;
    const page = parseInt(req.query.page ?? "1");
    const limit = parseInt(req.query.limit ?? "15");

    const filter = {};
    const search = req.query.search;

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
      ];
    }

    try {
      count = await Client.countDocuments(filter);
      const clients = await Client.find(filter)
        .limit(limit)
        .skip((page - 1) * limit);
      res.status(200).json({
        clients,
        currentPage: page,
        limit: limit,
        totalPages: Math.ceil(count / limit),
        total: count,
      });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: error.message });
    }
  },
);

router.get(
  "/:id",
  authorizeJwt,
  verifyAccount([{ name: "client", action: "read" }]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const client = await Client.findById(id);

      if (!client) {
        return res
          .status(404)
          .json({ message: `Client with ID ${id} not found` });
      }

      res.status(200).json(client);
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: error.message });
    }
  },
);

router.post(
  "/",
  authorizeJwt,
  verifyAccount([{ name: "client", action: "create" }]),
  async (req, res) => {
    try {
      const client = await Client.create(req.body);
      res.status(201).json(client);
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: error.message });
    }
  },
);

router.put(
  "/:id",
  authorizeJwt,
  verifyAccount([{ name: "client", action: "update" }]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const client = await Client.findByIdAndUpdate(id, req.body, {
        new: true,
      });
      if (!client) {
        return res
          .status(404)
          .json({ message: `Cannot find any client with ID ${id}` });
      }
      res.status(200).json(client);
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: error.message });
    }
  },
);

router.delete(
  "/:id",
  authorizeJwt,
  verifyAccount([{ name: "client", action: "delete" }]),
  async (req, res) => {
    try {
      const { id } = req.params;

      const client = await Client.findById(id);
      if (!client) {
        return res
          .status(404)
          .json({ message: `Cannot find any client with ID ${id}` });
      }

      const deletedClient = await Client.deleteOne({ _id: id });
      const deletedUser = await User.deleteOne({ email: client.email });
      const deletedCommandes = await Commande.deleteMany({ client: id });
      const deletedTransactions = await Transaction.deleteMany({ client: id });

      res.status(200).json({ client, message: "client supprimé avec succès" });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: error.message });
    }
  },
);

module.exports = router;
