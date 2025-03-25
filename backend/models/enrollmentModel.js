const pool = require('../config/dbconfig');

class EnrollmentModel {
  static async initTable() {
    const createTable = `
      CREATE TABLE IF NOT EXISTS Enrollments (
        Roll_no INT NOT NULL,
        Subject_Code VARCHAR(50) NOT NULL,
        Sem_no INT NOT NULL,
        Year INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (Roll_no, Subject_Code, Sem_no, Year),
        FOREIGN KEY (Roll_no) REFERENCES Students(Roll_no) ON DELETE CASCADE,
        FOREIGN KEY (Subject_Code) REFERENCES Subjects(Subject_Code) ON DELETE CASCADE
      )
    `;
    try {
      await pool.query(createTable);
      console.log('Enrollments table initialized');
    } catch (error) {
      console.error('Enrollments table initialization failed:', error);
      throw error;
    }
  }

  static async enrollStudent(Roll_no, Subject_Code, Sem_no, Year) {
    try {
      const [result] = await pool.query(
        `INSERT INTO Enrollments (Roll_no, Subject_Code, Sem_no, Year)
         VALUES (?, ?, ?, ?)`,
        [Roll_no, Subject_Code, Sem_no, Year]
      );
      return result;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Student is already enrolled in this subject for this semester');
      }
      throw error;
    }
  }

  static async getStudentEnrollments(Roll_no, Sem_no, Year) {
    try {
      const [enrollments] = await pool.query(
        `SELECT e.*, s.Subject_Name, s.Credits 
         FROM Enrollments e
         JOIN Subjects s ON e.Subject_Code = s.Subject_Code
         WHERE e.Roll_no = ? AND e.Sem_no = ? AND e.Year = ?`,
        [Roll_no, Sem_no, Year]
      );
      return enrollments;
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      throw error;
    }
  }

  static async removeEnrollment(Roll_no, Subject_Code, Sem_no, Year) {
    try {
      const [result] = await pool.query(
        `DELETE FROM Enrollments 
         WHERE Roll_no = ? AND Subject_Code = ? AND Sem_no = ? AND Year = ?`,
        [Roll_no, Subject_Code, Sem_no, Year]
      );
      if (result.affectedRows === 0) {
        throw new Error('Enrollment not found');
      }
      return result;
    } catch (error) {
      console.error('Error removing enrollment:', error);
      throw error;
    }
  }
}

module.exports = EnrollmentModel;