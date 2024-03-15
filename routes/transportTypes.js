const express = require("express");
const router = express.Router();
const TransportType = require("../models/transportTypeModel");

const mongoose = require("mongoose");
const { authorizeJwt, verifyAccount } = require("../helpers/verifyAccount");

// GET /transportTypes - Get all transport types
router.get(
  "/",
  authorizeJwt,
  verifyAccount([{ name: "transportType", action: "read" }]),
  async (req, res) => {
    let count;
    const page = parseInt(req.query.page ?? "1");
    const limit = parseInt(req.query.limit ?? "15");

    const filter = {};
    const search = req.query.search;

    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: "i" } },
        { label: { $regex: search, $options: "i" } },
      ];
    }

    try {
      count = await TransportType.countDocuments(filter);
      const transportTypes = await TransportType.find(filter)
        .limit(limit)
        .skip((page - 1) * limit);
      res.status(200).json({
        transportTypes,
        currentPage: page,
        limit: limit,
        totalPages: Math.ceil(count / limit),
        total: count,
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: error.message });
    }
  },
);

// GET /transportTypes/:id - Get a specific transport type by ID
router.get(
  "/:id",
  authorizeJwt,
  verifyAccount([{ name: "transportType", action: "read" }]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const transportType = await TransportType.findById(id);

      if (!transportType) {
        return res
          .status(404)
          .json({ message: `Transport type with ID ${id} not found` });
      }

      res.status(200).json(transportType);
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: error.message });
    }
  },
);

// POST /transportTypes - Create a new transport type
router.post(
  "/",
  authorizeJwt,
  verifyAccount([{ name: "transportType", action: "create" }]),
  async (req, res) => {
    try {
      // Generate a new ObjectId for the _id field
      const newId = new mongoose.Types.ObjectId();

      // Assign the generated _id to req.body
      req.body._id = newId;

      const transportType = await TransportType.create(req.body);
      res.status(201).json(transportType);
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: error.message });
    }
  },
);

// PUT /transportTypes/:id - Update a transport type by ID
router.put(
  "/:id",
  authorizeJwt,
  verifyAccount([{ name: "transportType", action: "update" }]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const transportType = await TransportType.findByIdAndUpdate(
        id,
        req.body,
        { new: true },
      );

      if (!transportType) {
        return res
          .status(404)
          .json({ message: `Cannot find any transport type with ID ${id}` });
      }

      res.status(200).json(transportType);
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: error.message });
    }
  },
);

// DELETE /transportTypes/:id - Delete a transport type by ID
router.delete(
  "/:id",
  authorizeJwt,
  verifyAccount([{ name: "transportType", action: "delete" }]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const transportType = await TransportType.findByIdAndDelete(id);

      if (!transportType) {
        return res
          .status(404)
          .json({ message: `Cannot find any transport type with ID ${id}` });
      }

      res.status(200).json(transportType);
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: error.message });
    }
  },
);

module.exports = router;
