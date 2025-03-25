const express = require('express');
const AcademicService = require('../services/academicService');
const router = express.Router();

// Register student with subjects
router.post('/registerStudentWithSubjects', async (req, res) => {
    try {
        const { Roll_no, subjectCodes, semesterId } = req.body;
        const student = await AcademicService.enrollStudentInSubjects(Roll_no, subjectCodes, semesterId);
        res.status(201).json({ message: 'Student registered successfully', student });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.post('/batchProcessCpiAndSpi',async(req,res)=>{
    try{
        const {Year,Sem_no,Curr_year}=req.body;
        const result=await AcademicService.batchProcessCpiAndSpi(Year,Sem_no,Curr_year);
        res.status(200).json(result);

    }
    catch(error){
        res.status(400).json({error:error.message});
    }
})
router.get('/CpiAndSpiAllSemesters', async (req, res) => {
    try {
      // Fixed: Use req.query instead of req.body for GET requests
      const { Roll_no, Sem_no, Year } = req.query;
      
      if (!Roll_no || !Sem_no || !Year) {
        throw new Error("Roll_no, Sem_no, Year are required");
      }
      
      // Parse string values to numbers
      const rollNo = parseInt(Roll_no);
      const semNo = parseInt(Sem_no);
      const year = parseInt(Year);
      
      const result = await AcademicService.CpiAndSpiAllSemesters(rollNo, semNo, year);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
// Process grades and calculate SPI
router.post('/processGrades', async (req, res) => {
    try {
        const { Roll_no, Sem_no,Year } = req.body;
        const result = await AcademicService.processGradesAndCalculateSPI(Roll_no, Sem_no,Year);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Calculate CPI
router.post('/calcCPI', async (req, res) => {
    try {
        const { Roll_no, Sem_no,Year } = req.body;
        const result = await AcademicService.calculateCPI(Roll_no, Sem_no,Year);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Start a new semester
router.post('/startSemester', async (req, res) => {
    try {
        const { semesterData, studentPromotions } = req.body;
        const semester = await AcademicService.startNewSemester(semesterData, studentPromotions);
        res.status(201).json({ message: 'Semester started successfully', semester });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Generate student report
router.get('/studentReport/:Roll_no/:Sem_no/:Year', async (req, res) => {
    try {
      const { Roll_no, Sem_no, Year } = req.params;
      const report = await AcademicService.generateStudentReport(Roll_no, Sem_no, Year);
      res.status(200).json(report);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

// Process batch results
router.post('/processBatchResults', async (req, res) => {
    try {
        const { semesterId, batchData } = req.body;
        const results = await AcademicService.processBatchResults(semesterId, batchData);
        res.status(200).json(results);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Validate enrollment
router.post('/validateEnrollment', async (req, res) => {
    try {
        const { rollNo, subjectCode, semesterId } = req.body;
        const isValid = await AcademicService.validateEnrollment(rollNo, subjectCode, semesterId);
        res.status(200).json({ valid: isValid });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;