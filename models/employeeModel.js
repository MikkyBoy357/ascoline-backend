const mongoose = require('mongoose')

const employeeSchema = mongoose.Schema(
    {
        firstName: {
            type: String,
            required: [true, "Please enter employee first name"]
        },
        lastName: {
            type: String,
            required: [true, "Please enter employee last name"]
        },
        email: {
            type: String,
            required: [true, "Please enter employee email"]
        },
        phone: {
            type: String,
            required: [true, "Please enter employee phone number"]
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

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;