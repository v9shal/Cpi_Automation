const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const generateReportCard=require('../controllers/reportGeneration');
const gradeController = require("../controllers/gradeController");

// Correct route definition by passing the method directly
router.post("/upload-grades", upload, gradeController.uploadGrades);
router.get("/fullgradehistory", gradeController.getFullGradeHistory);
router.get('/report-card/:Roll_no',generateReportCard);

module.exports = router;