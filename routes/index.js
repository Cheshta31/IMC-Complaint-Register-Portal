const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const User = require('../models/user');
const Admin = require('../models/admin');
const OTP = require('../models/otp');
const Complaint = require('../models/complaint');
const XLSX= require('xlsx');
const path= require('path');
const fs= require('fs');

router.post('/logout', (req,res)=>{
    req.session.destroy(err=>{
        if(err){
            return res.status(500).send('Failed to log out');
        }
        res.clearCookie('connect.sid');
        res.redirect('/userlogin');
    })
});

router.post('/loginuser', async (req, res) => {
    const { username, employeeID, email, password, otp } = req.body;
  
    try {
        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(400).json({ message: 'User does not exist' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, existingUser.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        // Check OTP
        const otpRecord = await OTP.findOne({ email });
        if (!otpRecord) {
            return res.status(400).json({ message: 'OTP not found' });
        }

        // Validate OTP
        if (otpRecord.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Check if OTP is expired
        const currentTime = new Date();
        if (currentTime > otpRecord.expireAt) {
            return res.status(400).json({ message: 'OTP has expired' });
        }

        res.status(200).json({ message: 'User logged in successfully' });
    } catch (error) {
        console.error('Error during user login:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/loginadmin', async (req, res) => {
    const { username, employeeID, email, password, otp } = req.body;
  
    try {
        // Check if user exists
        const existingAdmin = await Admin.findOne({ email });
        if (!existingAdmin) {
            return res.status(400).json({ message: 'Admin does not exist' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, existingAdmin.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        // Check OTP
        const otpRecord = await OTP.findOne({ email });
        if (!otpRecord) {
            return res.status(400).json({ message: 'OTP not found' });
        }

        // Validate OTP
        if (otpRecord.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Check if OTP is expired
        const currentTime = new Date();
        if (currentTime > otpRecord.expireAt) {
            return res.status(400).json({ message: 'OTP has expired' });
        }

        res.status(200).json({ message: 'Admin logged in successfully' });
    } catch (error) {
        console.error('Error during admin login:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/register', async (req, res) => {
    const { username, employeeID, email, password } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 12);


  await User.create({ username, employeeID, email, password: hashedPassword });

  res.status(201).json({ message: "User registered successfully" });
});

router.post('/newcomplaint', async (req, res) => {
    const { employeeName, employeeCode, complaintTitle, department, email, complaintDate, complaintDetails, complaintAttachment } = req.body;

    try {
        const attachmentString = typeof complaintAttachment === 'object' ? JSON.stringify(complaintAttachment) : complaintAttachment;
        const existingUser = await User.findOne({ email });

        if (existingUser && existingUser.username === employeeName && existingUser.employeeID === employeeCode) {
            await Complaint.create({ 
                employeeName, 
                employeeCode, 
                complaintTitle, 
                department, 
                email, 
                complaintDate, 
                complaintDetails, 
                complaintAttachment: attachmentString
            });
            res.status(200).json({ message: 'Complaint submitted successfully' });
        } else {
            res.status(400).json({ message: 'User does not exist or credentials do not match' });
        }
    } catch (error) {
        console.error('Error submitting complaint:', error);
        res.status(500).json({ message: 'Error submitting complaint' });
    }
});

router.get('/dashboard', async (req, res) => {
    try {
        const users = await User.find({});
        const admins = await Admin.find({});
        const complaints = await Complaint.find();
        const pendingCount = await Complaint.countDocuments({ status: 'Pending' });
        const solvedCount = await Complaint.countDocuments({ status: 'Completed' });

        res.render('dashboard', {
            users,
            admins,
            complaints,
            pendingCount,
            solvedCount
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.get('/mycomplaint', async (req, res) => {
    try {
        const users = await User.find({});
        const admins = await Admin.find({});
        const complaints = await Complaint.find();
        const pendingCount = await Complaint.countDocuments({ status: 'Pending' });
        const solvedCount = await Complaint.countDocuments({ status: 'Completed' });

        res.render('mycomplaint', {
            users,
            admins,
            complaints,
            pendingCount,
            solvedCount
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Route to get complaints for a specific user
router.get('/mycomplaints/:employeeID', async (req, res) => {
    try {
        const employeeID = req.params.employeeID;
        const user = await User.findById(employeeID);
        
        if (!user) {
            return res.status(404).send('User not found');
        }

        const complaints = await Complaint.find({ employeeCode: user.employeeCode });
        res.render('userComplaints', { user, complaints });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.get('/admindash', async (req, res) => {
    try {
        const users = await User.find({});
        const admins = await Admin.find({});
        const complaints = await Complaint.find();
        //const pendingCount = await Complaint.countDocuments({ status: 'Pending' });
        //const solvedCount = await Complaint.countDocuments({ status: 'Completed' });

        res.render('admindash', {
            users,
            admins,
            complaints
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
});


// Route to render the alluser page
router.get('/alluser', async (req, res) => {
    try {
        const users = await User.find({});
        res.render('alluser', { users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Error fetching users');
    }
});

// Route to render the totaladmin page
router.get('/totaladmin', async (req, res) => {
    try {
        const admins = await Admin.find({});
        res.render('totaladmin', { admins });
    } catch (error) {
        console.error('Error fetching admins:', error);
        res.status(500).send('Error fetching admins');
    }
});

//Router to display complaint data from server to the front end
router.get('/totalcomplaints', async (req, res) => {
    try {
        const complaints = await Complaint.find();
        const pendingCount = await Complaint.countDocuments({ status: 'Pending' });
        const solvedCount = await Complaint.countDocuments({ status: 'Completed' });

        res.render('totalcomplaints', {
            complaints,
            pendingCount,
            solvedCount
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Route to get a specific complaint by ID
router.get('/totalcomplaints/:id', (req, res) => {
    const complaintId = req.params.id;
    Complaint.findById(complaintId)
        .then(complaint => {
            if (!complaint) {
                return res.status(404).send('Complaint not found');
            }
            res.json(complaint);
        })
        .catch(err => res.status(500).send('Error retrieving complaint data'));
});

//route to get complaint counts for displaying in the chart
router.get('/complaint-counts', async (req, res) => {
    try {
        const pendingCount = await Complaint.countDocuments({ status: 'Pending' });
        const completedCount = await Complaint.countDocuments({ status: 'Completed' });
        const inProgressCount = await Complaint.countDocuments({ status: 'In Progress' });

        res.json({
            pendingCount,
            completedCount,
            inProgressCount
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

//Route for deleting the user
router.delete('/alluser/:employeeID', async (req, res) => {
    const { employeeID } = req.params;
    try {
        const deletedUser = await User.findOneAndDelete({ employeeID:employeeID });
        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Error deleting user' });
    }
});

//Route for deleting the admin
router.delete('/totaladmin/:employeeID', async (req, res) => {
    const { employeeID } = req.params;
    try {
        const deletedAdmin = await Admin.findOneAndDelete({ employeeID:employeeID });
        if (!deletedAdmin) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        res.status(200).json({ message: 'Admin deleted successfully' });
    } catch (error) {
        console.error('Error deleting admin:', error);
        res.status(500).json({ message: 'Error deleting admin' });
    }
});

router.get('/download/excel', async (req,res) => {
    try {
        const complaints = await Complaint.find({} , 'employeeName employeeCode complaintTitle department email complaintDetails status').lean();
        console.log(complaints);
        const dataToExport = complaints.map(complaint => ({
            Employee_Name:complaint.employeeName,
            Employee_Code:complaint.employeeCode,
            Complaint_Title:complaint.complaintTitle,
            Department:complaint.department,
            Employee_Email:complaint.email,
            Complaint_Details:complaint.complaintDetails,
            Status:complaint.status,
        }))
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook,worksheet,'Complaints');
        const filePath = path.join(__dirname,'complaints.xlsx');
        XLSX.writeFile(workbook,filePath);
        res.download(filePath,(err) => 
        {
            if(err)
            {
                console.log(err);
            }
            fs.unlinkSync(filePath);
        });
    }
    catch(err){
        console.log(err);
        res.status(500).send('Error generating excel file');
    }
})

//download excel file for pending complaints
router.get('/download/pending-excel', async (req,res) => {
    try {
        const complaints = await Complaint.find({status:'Pending'} , 'employeeName employeeCode complaintTitle department email complaintDetails status').lean();
        console.log(complaints);
        const dataToExport = complaints.map(complaint => ({
            Employee_Name:complaint.employeeName,
            Employee_Code:complaint.employeeCode,
            Complaint_Title:complaint.complaintTitle,
            Department:complaint.department,
            Employee_Email:complaint.email,
            Complaint_Details:complaint.complaintDetails,
            Status:complaint.status,
        }))
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook,worksheet,'Complaints');
        const filePath = path.join(__dirname,'pending-complaints.xlsx');
        XLSX.writeFile(workbook,filePath);
        res.download(filePath,(err) => 
        {
            if(err)
            {
                console.log(err);
            }
            fs.unlinkSync(filePath);
        });
    }
    catch(err){
        console.log(err);
        res.status(500).send('Error generating pending complaints excel file');
    }
})

//download excel file for solved complaints
router.get('/download/solved-excel', async (req,res) => {
    try {
        const complaints = await Complaint.find({status:'Completed'} , 'employeeName employeeCode complaintTitle department email complaintDetails status').lean();
        console.log(complaints);
        const dataToExport = complaints.map(complaint => ({
            Employee_Name:complaint.employeeName,
            Employee_Code:complaint.employeeCode,
            Complaint_Title:complaint.complaintTitle,
            Department:complaint.department,
            Employee_Email:complaint.email,
            Complaint_Details:complaint.complaintDetails,
            Status:complaint.status,
        }))
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook,worksheet,'Complaints');
        const filePath = path.join(__dirname,'solved-complaints.xlsx');
        XLSX.writeFile(workbook,filePath);
        res.download(filePath,(err) => 
        {
            if(err)
            {
                console.log(err);
            }
            fs.unlinkSync(filePath);
        });
    }
    catch(err){
        console.log(err);
        res.status(500).send('Error generating solved complaints excel file');
    }
})

module.exports = router;
