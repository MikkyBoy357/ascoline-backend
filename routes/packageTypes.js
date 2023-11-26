const express = require('express');
const router = express.Router();
const PackageType = require('../models/packageTypeModel');

const mongoose = require("mongoose");

// GET /packageTypes - Get all package types
router.get('/', async (req, res) => {
    try {
        const packageTypes = await PackageType.find({});
        res.status(200).json(packageTypes);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: error.message });
    }
});

// GET /packageTypes/:id - Get a specific package type by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const packageType = await PackageType.findById(id);

        if (!packageType) {
            return res.status(404).json({ message: `Package type with ID ${id} not found` });
        }

        res.status(200).json(packageType);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: error.message });
    }
});

// POST /packageTypes - Create a new package type
router.post('/', async (req, res) => {
    try {
        // Generate a new ObjectId for the _id field
        const newId = new mongoose.Types.ObjectId();

        // Assign the generated _id to req.body
        req.body._id = newId;

        const packageType = await PackageType.create(req.body);
        res.status(201).json(packageType);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: error.message });
    }
});

// PUT /packageTypes/:id - Update a package type by ID
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const packageType = await PackageType.findByIdAndUpdate(id, req.body, { new: true });

        if (!packageType) {
            return res.status(404).json({ message: `Cannot find any package type with ID ${id}` });
        }

        res.status(200).json(packageType);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: error.message });
    }
});

// DELETE /packageTypes/:id - Delete a package type by ID
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const packageType = await PackageType.findByIdAndDelete(id);

        if (!packageType) {
            return res.status(404).json({ message: `Cannot find any package type with ID ${id}` });
        }

        res.status(200).json(packageType);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
