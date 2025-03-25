const pool = require('../config/dbconfig');

class GRADEModel {
  static async initTable() {
    const createGradeTable = `
      CREATE TABLE IF NOT EXISTS GRADE (
        Roll_no INT NOT NULL,
        Subject_Code VARCHAR(10) NOT NULL,
        Sem_no INT NOT NULL,
        Year INT NOT NULL,
        Grade VARCHAR(2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (Roll_no, Subject_Code, Sem_no, Year),
        FOREIGN KEY (Roll_no) REFERENCES Students(Roll_no) ON DELETE CASCADE,
        FOREIGN KEY (Subject_Code) REFERENCES Subjects(Subject_Code) ON DELETE CASCADE,
        FOREIGN KEY (Sem_no, Year) REFERENCES Semesters(Sem_no, Year) ON DELETE CASCADE
      )
    `;

    const createGradeHistoryTable = `
      CREATE TABLE IF NOT EXISTS Grade_History (
        id INT AUTO_INCREMENT PRIMARY KEY,
        Roll_no INT NOT NULL,
        Subject_Code VARCHAR(10) NOT NULL,
        Sem_no INT NOT NULL,
        Year INT NOT NULL,
        Grade VARCHAR(2) NOT NULL,
        Attempt INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (Roll_no) REFERENCES Students(Roll_no) ON DELETE CASCADE,
        FOREIGN KEY (Subject_Code) REFERENCES Subjects(Subject_Code) ON DELETE CASCADE,
        FOREIGN KEY (Sem_no, Year) REFERENCES Semesters(Sem_no, Year) ON DELETE CASCADE
      )
    `;

    try {
      await pool.query(createGradeTable);
      await pool.query(createGradeHistoryTable);
      console.log('GRADE and Grade_History tables initialized');
    } catch (error) {
      console.error('Table initialization failed:', error);
      throw error;
    }
  }

  static async addGrade(Roll_no, Subject_Code, Sem_no, Year, Grade) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [existingGrade] = await connection.query(
        `SELECT Grade FROM GRADE WHERE Roll_no = ? AND Subject_Code = ? AND Sem_no = ? AND Year = ?`,
        [Roll_no, Subject_Code, Sem_no, Year]
      );

      let attempt = 1;
      if (existingGrade.length > 0) {
        const [history] = await connection.query(
          `SELECT MAX(Attempt) as maxAttempt FROM Grade_History 
           WHERE Roll_no = ? AND Subject_Code = ? AND Sem_no = ? AND Year = ?`,
          [Roll_no, Subject_Code, Sem_no, Year]
        );
        attempt = (history[0]?.maxAttempt || 0) + 1;

        await connection.query(
          `INSERT INTO Grade_History (Roll_no, Subject_Code, Sem_no, Year, Grade, Attempt) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [Roll_no, Subject_Code, Sem_no, Year, existingGrade[0].Grade, attempt - 1]
        );

        await connection.query(
          `UPDATE GRADE SET Grade = ?, updated_at = NOW() 
           WHERE Roll_no = ? AND Subject_Code = ? AND Sem_no = ? AND Year = ?`,
          [Grade, Roll_no, Subject_Code, Sem_no, Year]
        );
      } else {
        await connection.query(
          `INSERT INTO GRADE (Roll_no, Subject_Code, Sem_no, Year, Grade) 
           VALUES (?, ?, ?, ?, ?)`,
          [Roll_no, Subject_Code, Sem_no, Year, Grade]
        );
      }

      await connection.query(
        `INSERT INTO Grade_History (Roll_no, Subject_Code, Sem_no, Year, Grade, Attempt) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [Roll_no, Subject_Code, Sem_no, Year, Grade, attempt]
      );

      await connection.commit();
      return { Roll_no, Subject_Code, Sem_no, Year, Grade, attempt };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getGrade(Roll_no, Subject_Code, Sem_no, Year) {
    const [grade] = await pool.query(
      `SELECT * FROM GRADE WHERE Roll_no = ? AND Subject_Code = ? AND Sem_no = ? AND Year = ?`,
      [Roll_no, Subject_Code, Sem_no, Year]
    );
    return grade;
  }
  static async getTotalGrades(Roll_no) {
    const [grades] = await pool.query(
      `SELECT * FROM GRADE WHERE Roll_no = ?`,
      [Roll_no]
    );
    return grades;
  }

  static async getAllGradeHistoryByStudent(Roll_no) {
    const [history] = await pool.query(
      `SELECT * FROM Grade_History WHERE Roll_no = ? ORDER BY Subject_Code, Sem_no, Year, Attempt ASC`,
      [Roll_no]
    );
    return history;
  }
  static async getGradeHistory(Roll_no, Subject_Code, Sem_no, Year) {
    const [history] = await pool.query(
      `SELECT * FROM Grade_History 
       WHERE Roll_no = ? AND Subject_Code = ? AND Sem_no = ? AND Year = ? 
       ORDER BY Attempt ASC`,
      [Roll_no, Subject_Code, Sem_no, Year]
    );
    return history;
  }
}

module.exports = GRADEModel;