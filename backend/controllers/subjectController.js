const SubjectModel = require('../models/subjectModel');

class SubjectController {
  static async insertSubject(req, res) {
    try {
      const subjects = Array.isArray(req.body) ? req.body : [req.body]; 
  
      if (!subjects.length) {
        return res.status(400).json({ success: false, message: "No subjects provided" });
      }
  
      const results = [];
      const errors = [];
  
      for (const subject of subjects) {
        const { Subject_Code, Subject_Name, Credits, Is_Elective, Department } = subject;
  
        // Validate required fields
        if (!Subject_Code || !Subject_Name || !Credits) {
          errors.push({
            Subject_Code: Subject_Code || 'unknown',
            message: "Missing required parameters",
          });
          continue;
        }
  
        try {
          const result = await SubjectModel.insertSubject(
            Subject_Code,
            Subject_Name,
            Credits,
            Is_Elective || false,
            Department || null
          );
          results.push({ Subject_Code, success: true, data: result });
        } catch (error) {
          if (error.message === 'Subject with this code already exists') {
            errors.push({ Subject_Code, message: error.message });
          } else {
            throw error;
          }
        }
      }
  
      if (errors.length > 0 && results.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No subjects were inserted",
          errors,
        });
      } else if (errors.length > 0) {
        return res.status(207).json({
          success: true,
          message: "Some subjects were inserted, some failed",
          data: results,
          errors,
        });
      } else {
        return res.status(201).json({
          success: true,
          message: "All subjects inserted successfully",
          data: results,
        });
      }
    } catch (error) {
      console.error("Error while inserting subjects:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
  
  static async getSubject(req, res) {
    const { subjectCode } = req.params;
    
    try {
      const subject = await SubjectModel.getSubjectByCode(subjectCode);
      
      if (!subject) {
        return res.status(404).json({ success: false, message: "Subject not found" });
      }
      
      return res.status(200).json({ success: true, data: subject });
    } catch (error) {
      console.error("Error fetching subject:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
  
  static async updateSubject(req, res) {
    const { subjectCode } = req.params;
    const updateData = req.body;
    
    try {
      const result = await SubjectModel.updateSubject(subjectCode, updateData);
      
      if (!result) {
        return res.status(400).json({ success: false, message: "No valid fields to update" });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Subject not found" });
      }
      
      return res.status(200).json({ success: true, message: "Subject updated successfully" });
    } catch (error) {
      console.error("Error updating subject:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
}

module.exports = SubjectController;