// mainRoutes.js (replacing marksRoute.js)
const express = require('express');
const router = express.Router();
const EnrollmentController = require('../controllers/enrollmentController');
const StudentController = require('../controllers/studentController');
const SubjectController = require('../controllers/subjectController');
const SemesterController = require('../controllers/semesterController');

// Student routes
router.post('/students', StudentController.registerStudent);
router.get('/students/:rollNo', StudentController.getStudent);
router.put('/students/:rollNo', StudentController.updateStudent);
router.delete('/students/:rollNo', StudentController.removeStudent);

// Subject routes
router.post('/subjects', SubjectController.insertSubject);
router.get('/subjects/:subjectCode', SubjectController.getSubject);
router.put('/subjects/:subjectCode', SubjectController.updateSubject);

// Semester routes
router.post('/semesters', SemesterController.insertSemester);
router.get('/semesters/:semNo/:year', SemesterController.getSemester);
router.put('/semesters/:semNo/:year/status', SemesterController.updateSemesterStatus);

// Enrollment routes
router.post('/enrollments', EnrollmentController.enrollStudents);
router.get('/enrollments/:rollNo/:semNo/:year', EnrollmentController.getStudentEnrollments);
router.delete('/enrollments/:rollNo/:subjectCode/:semNo/:year', EnrollmentController.removeEnrollment);

module.exports = router;