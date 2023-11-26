const express = require('express');
const router = express.Router();
const TransportType = require('../models/transportTypeModel');

const mongoose = require("mongoose");

// GET /transportTypes - Get all transport types
router.get('/', async (req, res) => {
    try {
        const transportTypes = await TransportType.find({});
        res.status(200).json(transportTypes);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: error.message });
    }
});

// GET /transportTypes/:id - Get a specific transport type by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const transportType = await TransportType.findById(id);

        if (!transportType) {
            return res.status(404).json({ message: `Transport type with ID ${id} not found` });
        }

        res.status(200).json(transportType);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: error.message });
    }
});

// POST /transportTypes - Create a new transport type
router.post('/', async (req, res) => {
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
});

// PUT /transportTypes/:id - Update a transport type by ID
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const transportType = await TransportType.findByIdAndUpdate(id, req.body, { new: true });

        if (!transportType) {
            return res.status(404).json({ message: `Cannot find any transport type with ID ${id}` });
        }

        res.status(200).json(transportType);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: error.message });
    }
});

// DELETE /transportTypes/:id - Delete a transport type by ID
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const transportType = await TransportType.findByIdAndDelete(id);

        if (!transportType) {
            return res.status(404).json({ message: `Cannot find any transport type with ID ${id}` });
        }

        res.status(200).json(transportType);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
