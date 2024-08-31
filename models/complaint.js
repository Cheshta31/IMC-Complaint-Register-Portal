// complaint.js
const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    complaintCode: {
        type: String,
        unique: true,
        required: true
    },
    employeeName: {
        type: String,
        required: true
    },
    employeeCode: {
        type: String,
        required: true
    },
    complaintTitle: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true,
        //enum: ['IT', 'HR', 'Finance', 'Operations', 'Admin']
    },
    email: {
        type: String,
        required: true
    },
    complaintDate: {
        type: Date,
        default: Date.now
    },
    complaintDetails: {
        type: String,
        required: true
    },
    complaintAttachment: {
        type: String  // Assuming the file path or URL will be stored here
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Completed'],
        default: 'Pending'
    }
}, {
    timestamps: true
});

async function generateUniqueComplaintCode() {
    let code;
    let existingComplaint;

    do {
        // Generate a random code
        code = 'CMP-' + Math.floor(Math.random()*10000000);//.toString(36).substr(2, 9).toUpperCase();

        // Check if the code already exists in the database
        existingComplaint = await Complaint.findOne({ complaintCode: code });
    } while (existingComplaint);

    return code;
}

complaintSchema.pre('save', async function(next) {
    // Example condition to change status from Pending to In Progress
    if (this.isModified('status') && this.status === 'Pending') {
        this.status = 'In Progress';
    }

    // Example condition to change status from In Progress to Completed
    if (this.isModified('status') && this.status === 'In Progress') {
        this.status = 'Completed';
    }

    if (!this.isNew) {
        this.complaintCode = await generateUniqueComplaintCode();
    }
    next();
});


const Complaint = mongoose.model('Complaint', complaintSchema);

module.exports = { Complaint, generateUniqueComplaintCode };
