const StudentModel = require('../models/studentModel');

class StudentController {
  static async registerStudent(req, res) {
    try {
      const { Roll_no, Name, Department, Year } = req.body;

      // Validate required fields
      if (!Roll_no || !Name || !Department || !Year) {
        return res.status(400).json({ success: false, message: 'Missing required student information' });
      }

      // Create the student
      const result = await StudentModel.addStudent(Roll_no, Name, Department, Year);

      res.status(201).json({
        success: true,
        message: 'Student registered successfully',
        data: result,
      });
    } catch (error) {
      if (error.message === 'Student with this Roll Number already exists') {
        return res.status(409).json({ success: false, message: error.message });
      }
      console.error('Error registering student:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
  
  static async getStudent(req, res) {
    try {
      const { rollNo } = req.params;
      
      const student = await StudentModel.getStudent(rollNo);
      
      if (!student || student.length === 0) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }
      
      res.status(200).json({
        success: true,
        data: student[0]
      });
    } catch (error) {
      console.error('Error fetching student:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
  
  static async updateStudent(req, res) {
    try {
      const { rollNo } = req.params;
      const updateData = req.body;
      
      const result = await StudentModel.updateStudent(rollNo, updateData);
      
      if (!result) {
        return res.status(400).json({ success: false, message: 'No valid fields to update' });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }
      
      res.status(200).json({
        success: true,
        message: 'Student updated successfully'
      });
    } catch (error) {
      console.error('Error updating student:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
  
  static async removeStudent(req, res) {
    try {
      const { rollNo } = req.params;
      
      await StudentModel.removeStudent(rollNo);
      
      res.status(200).json({
        success: true,
        message: 'Student removed successfully'
      });
    } catch (error) {
      if (error.message === 'Student not found') {
        return res.status(404).json({ success: false, message: error.message });
      }
      console.error('Error removing student:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}

module.exports = StudentController;