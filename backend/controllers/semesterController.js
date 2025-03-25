const SemesterModel = require('../models/semesterModel');

class SemesterController {
        static async insertSemester(req, res) {
            try {
                const { Sem_no, Year, Start_Date, End_Date } = req.body;

                if (!Sem_no || !Year || !Start_Date || !End_Date) {
                    return res.status(400).json({ 
                    success: false, 
                    message: "Missing required parameters" 
                    });
                }

                const result = await SemesterModel.createSemester(Sem_no, Year, Start_Date, End_Date);
                res.status(201).json({
                    success: true,
                    message: 'Semester created successfully',
                    data: result,
                });
            } catch (error) {
                if (error.message === 'Semester already exists for this year') {
                    return res.status(409).json({ success: false, message: error.message });
                }
                console.error('Error creating semester:', error);
                res.status(500).json({ success: false, message: 'Internal server error' });
            }
        }
    
    static async getSemester(req, res) {
        try {
            const { semNo, year } = req.params;
            
            if (!semNo || !year) {
                return res.status(400).json({ 
                  success: false, 
                  message: "Missing semester number or year" 
                });
            }
            
            const semester = await SemesterModel.getSemester(semNo, year);
            
            if (!semester) {
                return res.status(404).json({ 
                  success: false, 
                  message: "Semester not found" 
                });
            }
            
            res.status(200).json({
                success: true,
                data: semester
            });
        } catch (error) {
            console.error('Error fetching semester:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
    
    static async updateSemesterStatus(req, res) {
        try {
            const { semNo, year } = req.params;
            const { status } = req.body;
            
            if (!semNo || !year || !status) {
                return res.status(400).json({ 
                  success: false, 
                  message: "Missing required parameters" 
                });
            }
            
            if (!['UPCOMING', 'ONGOING', 'COMPLETED'].includes(status)) {
                return res.status(400).json({ 
                  success: false, 
                  message: "Invalid status value" 
                });
            }
            
            const result = await SemesterModel.updateSemesterStatus(semNo, year, status);
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ 
                  success: false, 
                  message: "Semester not found" 
                });
            }
            
            res.status(200).json({
                success: true,
                message: 'Semester status updated successfully'
            });
        } catch (error) {
            console.error('Error updating semester status:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
}

module.exports = SemesterController;