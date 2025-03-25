const multer = require("multer");

// Set up multer storage and file filter if needed
const storage = multer.memoryStorage(); // Store file in memory
const upload = multer({ storage: storage });

module.exports = upload.single("file"); // Assuming the file input field is named "file"