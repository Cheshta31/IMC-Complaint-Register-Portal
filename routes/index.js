const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const User = require('../models/user');
const Admin = require('../models/admin');
const OTP = require('../models/otp');
const { Complaint, generateUniqueComplaintCode } = require('../models/complaint');
const XLSX= require('xlsx');
const path= require('path');
const fs= require('fs');
const upload = require('./multerConfig');

//middleware to check if user is authenticated or not
function isAuthenticatedUser(req,res,next) {
    if(req.session.user && req.session.user.role == 'User')
    {
        return next();
    }
    else
    {
        res.redirect('/userlogin')
    }
}

//middleware to check if admin is authenticated or not
function isAuthenticatedAdmin(req,res,next) {
    if(req.session.admin && req.session.admin.role == 'Admin')
    {
        return next();
    }
    else
    {
        res.redirect('/userlogin')
    }
}

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

        //store user information in session
        req.session.user = {
            id: existingUser._id,
            username:existingUser.username,
            email:existingUser.email,
            role:'User',
        };

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

        //store user information in session
        req.session.admin = {
            id: existingAdmin._id,
            username:existingAdmin.username,
            email:existingAdmin.email,
            role :'Admin'
        };       

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

//Router to render file complaints page
router.get('/filecomplaint', isAuthenticatedUser, async (req, res) => {
    try {
        console.log(req.session.user);
        const email=req.session.user.email;
        const displayUsers = await User.findOne({email});
        console.log(displayUsers);
        const complaintCode = await generateUniqueComplaintCode();
        res.render('filecomplaint', { complaintCode, displayUsers });
    } catch (error) {
        console.error('Error generating complaint code:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/newcomplaint', upload.single('complaintAttachment'), async (req, res) => {
    const { complaintCode, employeeName, employeeCode, complaintTitle, department, email, complaintDate, complaintDetails } = req.body;

    try {
        const complaintAttachment = req.file ? req.file.path : null; // Store file path if file exists
        const existingUser = await User.findOne({ email });

        if (existingUser && existingUser.username === employeeName && existingUser.employeeID === employeeCode) {
            await Complaint.create({ 
                complaintCode,
                employeeName, 
                employeeCode, 
                complaintTitle, 
                department, 
                email, 
                complaintDate, 
                complaintDetails, 
                complaintAttachment
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

//filter for total complaints page
router.get('/filter-search', async (req, res) => {
    const { department, date, status } = req.query;
    const filter = {
        $and: []
    };

    // Add department condition if it's provided
    if (department) {
        filter.$and.push({ department });
    }

    if (date) {
        const parsedDate = new Date(date);
        if (!isNaN(parsedDate.getTime())) { // Valid date check
            filter.$and.push({ complaintDate: parsedDate });
        }
    }

    // Add status condition if it's provided
    if (status) {
        filter.$and.push({ status });
    }

    // If no filters are provided, use an empty filter
    if (filter.$and.length === 0) {
        delete filter.$and;
    }

    try {
        console.log(req.session.admin);
        const email=req.session.admin.email;
        const displayAdmin = await Admin.findOne({email});
        console.log(displayAdmin);
        // Fetch complaints based on the filter criteria
        const complaints = await Complaint.find(filter);

        // Count the number of pending and solved complaints
        const pendingCount = await Complaint.countDocuments({ status: 'Pending' });
        const solvedCount = await Complaint.countDocuments({ status: 'Completed' });

        // Render the results
        res.render('totalcomplaints', {
            displayAdmin,
            complaints,
            department,
            date,
            status,
            pendingCount,
            solvedCount
        });
    } catch (error) {
        res.status(500).send('Error fetching complaints');
    }
});


router.get('/dashboard', isAuthenticatedUser, async (req, res) => {
    try {
        //const users = await User.find({});
        console.log(req.session.user);
        const email=req.session.user.email;
        const displayUsers = await User.findOne({email});
        console.log(displayUsers);
        const displayComplaints = await Complaint.find({email,status: { $in: ['Pending','In Progress' ,'Completed'  ] }});
        console.log(displayComplaints);
        const admins = await Admin.find({});
        const complaints = await Complaint.find();
        const pendingCount = await Complaint.countDocuments({ email, status: 'Pending' });
        const solvedCount = await Complaint.countDocuments({ email, status: 'Completed' });

        res.render('dashboard', {
            displayUsers,
            displayComplaints,
            admins,
            complaints,
            pendingCount,
            solvedCount
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.get('/mycomplaint', isAuthenticatedUser, async (req, res) => {
    try {
        //const users = await User.find({});
        console.log(req.session.user);
        const email=req.session.user.email;
        const displayUsers = await User.findOne({email});
        console.log(displayUsers);
        const admins = await Admin.find({});
        //const complaints = await Complaint.find();
        const displayComplaints = await Complaint.find({email,status: { $in: ['Pending','In Progress' ,'Completed'  ] }});
        console.log(displayComplaints);
        const pendingCount = await Complaint.countDocuments({ email, status: 'Pending' });
        const solvedCount = await Complaint.countDocuments({ email,status: 'Completed' });
        

        if (!displayUsers) {
            return res.status(404).send('User not found');
        }

        res.render('mycomplaint', {        
            displayUsers,
            displayComplaints,
            admins,        
            pendingCount,
            solvedCount,
            department: '',  // Or null, if that's more appropriate
            date: '',
            status: ''
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

// Route to get a specific complaint by ID
router.get('/mycomplaint/:id', (req, res) => {
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

//filter for my complaint page
router.get('/search-filter', async (req, res) => {
    const { department, date, status } = req.query;
    const filter = {
        $and: [{ email: req.session.user.email }]
    };
    console.log(filter);

    // Add department condition if it's provided
    if (department) {
        filter.$and.push({ department });
    }

    if (date) {
        const parsedDate = new Date(date);
        if (!isNaN(parsedDate.getTime())) { // Valid date check
            filter.$and.push({ complaintDate: parsedDate });
        }
    }

    // Add status condition if it's provided
    if (status) {
        filter.$and.push({ status });
    }

    // If no filters are provided, use an empty filter
    if (filter.$and.length === 0) {
        delete filter.$and;
    }

    try {
        console.log(req.session.user);
        const email=req.session.user.email;
        const displayUsers = await User.findOne({email});
        console.log(displayUsers);
        // Fetch complaints based on the filter criteria
        //const complaints = await Complaint.find(filter);
        const displayComplaints = await Complaint.find({filter});
        
        // Count the number of pending and solved complaints
        const pendingCount = await Complaint.countDocuments({ email, status: 'Pending' });
        const solvedCount = await Complaint.countDocuments({ email, status: 'Completed' });

        // Render the results
        res.render('mycomplaint', {
            displayUsers,
            displayComplaints,
            department,
            date,
            status,
            pendingCount,
            solvedCount
        });
    } catch (error) {
        res.status(500).send('Error fetching complaints');
    }
});

//route to render admin dashboard
router.get('/admindash', isAuthenticatedAdmin, async (req, res) => {
    try {
        const users = await User.find({});
        const admins = await Admin.find({});
        console.log(req.session.admin);
        const email=req.session.admin.email;
        const displayAdmin = await Admin.findOne({email});
        console.log(displayAdmin);
        const complaints = await Complaint.find();
        //const pendingCount = await Complaint.countDocuments({ status: 'Pending' });
        //const solvedCount = await Complaint.countDocuments({ status: 'Completed' });

        res.render('admindash', {
            users,
            admins,
            displayAdmin,
            complaints
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
});


// Route to render the alluser page
router.get('/alluser', isAuthenticatedAdmin, async (req, res) => {
    try {
        console.log(req.session.admin);
        const email=req.session.admin.email;
        const displayAdmin = await Admin.findOne({email});
        console.log(displayAdmin);
        const users = await User.find({});
        res.render('alluser', { users, displayAdmin });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Error fetching users');
    }
});

// Route to render the totaladmin page
router.get('/totaladmin', isAuthenticatedAdmin, async (req, res) => {
    try {
        const admins = await Admin.find({});
        console.log(req.session.admin);
        const email=req.session.admin.email;
        const displayAdmin = await Admin.findOne({email});
        console.log(displayAdmin);
        res.render('totaladmin', { displayAdmin, admins });
    } catch (error) {
        console.error('Error fetching admins:', error);
        res.status(500).send('Error fetching admins');
    }
});

//Router to display complaint data from server to the front end
router.get('/totalcomplaints', isAuthenticatedAdmin, async (req, res) => {
    try {
        console.log(req.session.admin);
        const email=req.session.admin.email;
        const displayAdmin = await Admin.findOne({email});
        console.log(displayAdmin);
        const complaints = await Complaint.find();
        const pendingCount = await Complaint.countDocuments({ status: 'Pending' });
        const solvedCount = await Complaint.countDocuments({ status: 'Completed' });

        res.render('totalcomplaints', {
            displayAdmin,
            complaints,
            pendingCount,
            solvedCount,
            department: '',  // Or null, if that's more appropriate
            date: '',
            status: ''
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

// Update complaint status
router.put('/totalcomplaints/:complaintCode/status', async (req, res) => {
    try {
        const complaintCode = req.params.complaintCode;
        const { status } = req.body;

        const complaint = await Complaint.findOne({ complaintCode: complaintCode });
        if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found' });
        }

        complaint.status = status;
        await complaint.save();

        res.json({ success: true, message: 'Status updated successfully' });
    } catch (error) {
        console.error('Error updating complaint status:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
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

// Route to handle file upload
router.post('/upload', upload.single('file'), (req, res) => {
    try {
      res.send('File uploaded successfully');
    } catch (error) {
      res.status(500).send('Error uploading file');
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
        const complaints = await Complaint.find({} , 'complaintCode employeeName employeeCode complaintTitle department email complaintDetails status').lean();
        console.log(complaints);
        const dataToExport = complaints.map(complaint => ({
            Complaint_Code:complaint.complaintCode,
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
        const complaints = await Complaint.find({status:'Pending'} , 'complaintCode employeeName employeeCode complaintTitle department email complaintDetails status').lean();
        console.log(complaints);
        const dataToExport = complaints.map(complaint => ({
            Complaint_Code:complaint.complaintCode,
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
        const complaints = await Complaint.find({status:'Completed'} , 'complaintCode employeeName employeeCode complaintTitle department email complaintDetails status').lean();
        console.log(complaints);
        const dataToExport = complaints.map(complaint => ({
            Complaint_Code:complaint.complaintCode,
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

router.get('/download/user-excel', async (req,res) => {
    try {
        const users = await User.find({} , 'username employeeID email').lean();
        console.log(users);
        const dataToExport = users.map(user => ({
            User_Name:user.username,
            Employee_Code:user.employeeID,
            Employee_Email:user.email,
        }))
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook,worksheet,'Users');
        const filePath = path.join(__dirname,'total-users.xlsx');
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
        res.status(500).send('Error generating excel file for user');
    }
})

router.get('/download/admin-excel', async (req,res) => {
    try {
        const admins = await Admin.find({} , 'username employeeID email').lean();
        console.log(admins);
        const dataToExport = admins.map(admin => ({
            User_Name:admin.username,
            Employee_Code:admin.employeeID,
            Employee_Email:admin.email,
        }))
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook,worksheet,'Admins');
        const filePath = path.join(__dirname,'total-admins.xlsx');
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
        res.status(500).send('Error generating excel file for admins');
    }
})


module.exports = router;
