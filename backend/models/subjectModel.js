const pool = require('../config/dbconfig');

class SubjectModel {
  static async initTable() {
    const createTable = `
      CREATE TABLE IF NOT EXISTS Subjects (
        Subject_Code VARCHAR(50) PRIMARY KEY,
        Subject_Name VARCHAR(100) NOT NULL,
        Credits INT NOT NULL,
        Is_Elective BOOLEAN DEFAULT FALSE,
        Department VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    try {
      await pool.query(createTable);
      console.log('Subjects table initialized');
    } catch (error) {
      console.error('Subjects table initialization failed:', error);
      throw error;
    }
  }

  static async insertSubject(Subject_Code, Subject_Name, Credits, Is_Elective = false, Department = null) {
    try {
      const [result] = await pool.query(
        `INSERT INTO Subjects (Subject_Code, Subject_Name, Credits, Is_Elective, Department)
        VALUES (?, ?, ?, ?, ?)`,
        [Subject_Code, Subject_Name, Credits, Is_Elective, Department]
      );
      return result;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Subject with this code already exists');
      }
      throw error;
    }
  }

  static async getSubjectByCode(Subject_Code) {
    if (!Subject_Code) {
      throw new Error("Subject_Code is required");
    }
    
    try {
      const [result] = await pool.query(
        'SELECT * FROM Subjects WHERE Subject_Code = ?',
        [Subject_Code]
      );
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error(`Database error while fetching subject ${Subject_Code}:`, error);
      throw error;
    }
  }

  static async updateSubject(Subject_Code, updateData) {
    const allowedFields = ['Subject_Name', 'Credits', 'Is_Elective', 'Department'];
    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) return null;

    values.push(Subject_Code);
    try {
      const [result] = await pool.query(
        `UPDATE Subjects SET ${updates.join(', ')} WHERE Subject_Code = ?`,
        values
      );
      return result;
    } catch (error) {
      console.error('Error updating subject:', error);
      throw error;
    }
  }
}

module.exports = SubjectModel;