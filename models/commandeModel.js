const mongoose = require('mongoose');

const commandeSchema = new mongoose.Schema(
    {
        client: {
            type: String,
            required: true
        },
        pays: {
            type: String,
            required: true
        },
        villes: {
            type: String,
            required: true
        },
        typeColis: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        trackingId: {
            type: String,
            required: true
        },
        poids: {
            type: Number,
            required: true
        },
        transportType: {
            type: String,
            required: true
        },
        status: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    });

const Commande = mongoose.model('Commande', commandeSchema);

module.exports = Commande;