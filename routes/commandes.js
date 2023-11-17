const express = require('express');
const router = express.Router();
const Commande = require('../models/commandeModel');

router.get('/', async (req, res) => {
  try {
    const commandes = await Commande.find({});
    res.status(200).json(commandes);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const commande = await Commande.findById(id);
    if (!commande) {
      return res.status(404).json({ message: `Cannot find any Commande with ID ${id}` });
    }
    res.status(200).json(commande);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const newCommande = await Commande.create(req.body);
    res.status(201).json(newCommande);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedCommande = await Commande.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedCommande) {
      return res.status(404).json({ message: `Cannot find any Commande with ID ${id}` });
    }
    res.status(200).json(updatedCommande);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCommande = await Commande.findByIdAndDelete(id);
    if (!deletedCommande) {
      return res.status(404).json({ message: `Cannot find any Commande with ID ${id}` });
    }
    res.status(200).json(deletedCommande);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
