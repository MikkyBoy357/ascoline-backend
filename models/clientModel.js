const mongoose = require('mongoose')

const clientSchema = mongoose.Schema(
    {
        firstName: {
            type: String,
            required: [true, "Please enter client first name"]
        },
        lastName: {
            type: String,
            required: [true, "Please enter client last name"]
        },
        email: {
            type: String,
            required: [true, "Please enter client email"]
        },
        phone: {
            type: String,
            required: [true, "Please enter client phone number"]
        },
        status: {
            type: String,
            required: false
        },
    },
    {
        timestamps: true
    },
)

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;