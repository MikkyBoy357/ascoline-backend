const express = require("express");
const router = express.Router();
const Country = require("../models/countryModel");

const mongoose = require("mongoose");
const { authorizeJwt, verifyAccount } = require("../helpers/verifyAccount");

// GET /countries - Get all countries
router.get(
  "/",
  authorizeJwt,
  verifyAccount([{ name: "country", action: "read" }]),
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
      count = await Country.countDocuments(filter);
      const countries = await Country.find(filter)
        .limit(limit)
        .skip((page - 1) * limit);
      res.status(200).json({
        countries,
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

// GET /countries/:id - Get a specific country by ID
router.get(
  "/:id",
  authorizeJwt,
  verifyAccount([{ name: "country", action: "read" }]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const country = await Country.findById(id);

      console.log(country);

      if (!country) {
        return res
          .status(404)
          .json({ message: `Country with ID ${id} not found` });
      }

      res.status(200).json(country);
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: error.message });
    }
  },
);

// POST /countries - Create a new country
router.post(
  "/",
  authorizeJwt,
  verifyAccount([{ name: "country", action: "create" }]),
  async (req, res) => {
    try {
      // Generate a new ObjectId for the _id field
      const newId = new mongoose.Types.ObjectId();

      // Assign the generated _id to req.body
      req.body._id = newId;

      const country = await Country.create(req.body);
      res.status(201).json(country);
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: error.message });
    }
  },
);

// PUT /countries/:id - Update a country by ID
router.put(
  "/:id",
  authorizeJwt,
  verifyAccount([{ name: "country", action: "update" }]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const country = await Country.findByIdAndUpdate(id, req.body, {
        new: true,
      });

      if (!country) {
        return res
          .status(404)
          .json({ message: `Cannot find any country with ID ${id}` });
      }

      res.status(200).json(country);
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: error.message });
    }
  },
);

// DELETE /countries/:id - Delete a country by ID
router.delete(
  "/:id",
  authorizeJwt,
  verifyAccount([{ name: "country", action: "delete" }]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const country = await Country.findByIdAndDelete(id);

      if (!country) {
        return res
          .status(404)
          .json({ message: `Cannot find any country with ID ${id}` });
      }

      res.status(200).json(country);
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: error.message });
    }
  },
);

module.exports = router;
