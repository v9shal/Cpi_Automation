const pool = require('../config/dbconfig');

class StudentModel {
  static async initTable() {
    const createTable = `
      CREATE TABLE IF NOT EXISTS Students (
        Roll_no INT NOT NULL,
        Name VARCHAR(100) NOT NULL,
        Department VARCHAR(50) NOT NULL,
        Year INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (Roll_no)
      )
    `;
    try {
      await pool.query(createTable);
      console.log('Students table initialized');
    } catch (error) {
      console.error('Students table initialization failed:', error);
      throw error;
    }
  }

  static async addStudent(Roll_no, Name, Department, Year) {
    try {
      const [result] = await pool.query(
        `INSERT INTO Students (Roll_no, Name, Department, Year) VALUES (?, ?, ?, ?)`,
        [Roll_no, Name, Department, Year]
      );
      return result;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Student with this Roll Number already exists');
      }
      throw error;
    }
  }

  static async getStudent(Roll_no) {
    try {
      const student = await pool.query(
        `SELECT * FROM Students WHERE Roll_no = ?`,
        [Roll_no]
      );
      return student;
    } catch (error) {
      console.error('Error fetching student:', error);
      throw error;
    }
  }

  static async updateStudent(Roll_no, updateData) {
    const allowedFields = ['Name', 'Department', 'Year'];
    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) return null;

    values.push(Roll_no);
    try {
      const [result] = await pool.query(
        `UPDATE Students SET ${updates.join(', ')} WHERE Roll_no = ?`,
        values
      );
      return result;
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  }

  static async removeStudent(Roll_no) {
    try {
      const [result] = await pool.query(
        `DELETE FROM Students WHERE Roll_no = ?`,
        [Roll_no]
      );
      if (result.affectedRows === 0) {
        throw new Error('Student not found');
      }
      return result;
    } catch (error) {
      console.error('Error removing student:', error);
      throw error;
    }
  }
}

module.exports = StudentModel;