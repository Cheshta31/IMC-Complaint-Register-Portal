// multerConfig.js
const multer = require('multer');
const path = require('path');

// Configure storage options for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Directory where files will be saved
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Add a timestamp to avoid overwriting
  }
});

const upload = multer({ storage: storage });

module.exports = upload;
