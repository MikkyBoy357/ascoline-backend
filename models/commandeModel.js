const mongoose = require('mongoose');

const statusEnum = ['Réceptionné en Chine', 'Commande Arrivée'];

const commandeSchema = new mongoose.Schema(
    {
        trackingId: {
            type: String,
            required: true
        },
        typeColis: {
            type: String,
            required: true
        },
        transportType: {
            type: String,
            required: true
        },
        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Client',
            required: true
        },
        description: {
            type: String,
            required: true
        },
        unit: {
            type: String,
            required: true
        },
        pays: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: [1, 'Quantity must be greater than 0']
        },
        ville: {
            type: String,
            required: true
        },
        status: {
            type: String,
            required: true,
            validate: {
                validator: function (value) {
                    return statusEnum.includes(value); // Check if the value exists in the statusEnum array
                },
                message: props => `${props.value} is not a valid status!`
            }
        },
        specialNote: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

const Commande = mongoose.model('Commande', commandeSchema);

module.exports = Commande;