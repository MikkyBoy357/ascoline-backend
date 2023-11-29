const express = require('express');
const router = express.Router();
const Commande = require('../models/commandeModel');
const Client = require('../models/clientModel');

const { sendSMS } = require('../helpers/fasterMessageHelper');

router.get('/', async (req, res) => {
  try {
    const commandes = await Commande.find({}).populate('client', 'lastName firstName email phone address');
    res.status(200).json(commandes);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const commande = await Commande.findById(id).populate('client', 'lastName firstName email phone address');
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

    console.log(newCommande.client)

    // Fetch the client information using the client ID from newCommande
    const clientInfo = await Client.findById(newCommande.client);

    if (!clientInfo) {
      return res.status(404).json({ message: `Client with ID ${newCommande.client} not found` });
    }

    // handle sendSMS
    {
      // Get the phone number from the updatedCommande or pass it as part of the request body
      const phoneNumber = `229${clientInfo.phone.toString()}`; // Replace with your field name
      console.log(`Client Phone => ${phoneNumber}`)



      const myMessage = `Votre commande du tracking id: ${newCommande.trackingId.toString()} est enregistrée. Le statut de votre commande est: ${newCommande.status.toString()}`;
      
      console.log(phoneNumber)
      console.log(myMessage)
      // Call the function to send SMS
      sendSMS(phoneNumber, myMessage); // Customize your SMS message
    }

    res.status(201).json(newCommande);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the initial Commande from the database
    const initialCommande = await Commande.findById(id).populate('client');
    if (!initialCommande) {
      return res.status(404).json({ message: `Cannot find any Commande with ID ${id}` });
    }

    // Store the initial status
    const initialStatus = initialCommande.status;

    // Update the Commande and get the updated version
    const updatedCommande = await Commande.findByIdAndUpdate(id, req.body, { new: true, runValidators: true }).populate('client');
    if (!updatedCommande) {
      return res.status(404).json({ message: `Cannot find any Commande with ID ${id}` });
    }

    // Compare the initial status with the updated status
    if (initialStatus !== updatedCommande.status) {
      console.log(`StatusChanges? => from ${initialStatus} to ${updatedCommande.status}`);
      // handle sendSMS
      {
        // Get the phone number from the updatedCommande or pass it as part of the request body
        const phoneNumber = updatedCommande.client.phone; // Replace with your field name
        console.log(`Client Phone => ${phoneNumber}`);

        // Call the function to send SMS
        // sendSMS(phoneNumber, `Your order with tracking id ${updatedCommande.trackingId} : \nOrder status has been  change to ${updatedCommande.status}`); // Customize your SMS message
      }
    } else {
      console.log('Status was not changed')
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
