const EnrollmentModel = require('../models/enrollmentModel');

class EnrollmentController {
    static async enrollStudents(req, res) {
        const enrollments = req.body;
    
        if (!Array.isArray(enrollments)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Request body must be an array of enrollment objects' 
            });
        }
    
        try {
            const allResults = [];
            
            for (const enrollment of enrollments) {
                const { Roll_no, Subjects, Sem_no, Year } = enrollment;
                
                if (!Roll_no || !Subjects || !Array.isArray(Subjects) || !Sem_no || !Year) {
                    return res.status(400).json({ 
                        success: false, 
                        message: `Invalid data for Roll_no ${Roll_no || 'unknown'}: Roll_no, Subjects array, Sem_no, and Year are required`
                    });
                }
    
    
                const results = [];
                for (const Subject_Code of Subjects) {
                    const result = await EnrollmentModel.enrollStudent(Roll_no, Subject_Code, Sem_no, Year);
                    results.push(result);
                }
                allResults.push({ Roll_no, results });
            }
    
            res.status(201).json({ 
                success: true, 
                message: 'Students enrolled successfully', 
                data: allResults 
            });
        } catch (error) {
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(400).json({
                    success: false,
                    message: 'One or more subjects do not exist in the Subjects table'
                });
            }
            if (error.message === 'Student is already enrolled in this subject for this semester') {
                return res.status(409).json({ success: false, message: error.message });
            }
            console.error('Error enrolling students:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
    
    static async getStudentEnrollments(req, res) {
        try {
            const { rollNo, semNo, year } = req.params;
            
            if (!rollNo || !semNo || !year) {
                return res.status(400).json({ 
                  success: false, 
                  message: 'Roll number, semester number, and year are required' 
                });
            }
            
            const enrollments = await EnrollmentModel.getStudentEnrollments(rollNo, semNo, year);
            
            res.status(200).json({
                success: true,
                data: enrollments
            });
        } catch (error) {
            console.error('Error fetching enrollments:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
    
    static async removeEnrollment(req, res) {
        try {
            const { rollNo, subjectCode, semNo, year } = req.params;
            
            if (!rollNo || !subjectCode || !semNo || !year) {
                return res.status(400).json({ 
                  success: false, 
                  message: 'All parameters are required' 
                });
            }
            
            await EnrollmentModel.removeEnrollment(rollNo, subjectCode, semNo, year);
            
            res.status(200).json({
                success: true,
                message: 'Enrollment removed successfully'
            });
        } catch (error) {
            if (error.message === 'Enrollment not found') {
                return res.status(404).json({ success: false, message: error.message });
            }
            console.error('Error removing enrollment:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
}

module.exports = EnrollmentController;