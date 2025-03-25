const pool = require('../config/dbconfig');

class CPIModel {
  static async initTable() {
    const createTable = `
      CREATE TABLE IF NOT EXISTS CPI (
        Roll_no INT NOT NULL,
        Sem_no INT NOT NULL,
        Year INT NOT NULL,
        cumulativeCPI FLOAT CHECK (cumulativeCPI BETWEEN 0 AND 10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (Roll_no, Sem_no, Year),
        FOREIGN KEY (Roll_no) REFERENCES Students(Roll_no) ON DELETE CASCADE,
        FOREIGN KEY (Sem_no, Year) REFERENCES Semesters(Sem_no, Year) ON DELETE CASCADE
      )
    `;
    try {
      await pool.query(createTable);
      console.log('CPI table initialized');
    } catch (error) {
      console.error('CPI table initialization failed:', error);
      throw error;
    }
  }

  static async addCPI(Roll_no, Sem_no, Year, cumulativeCPI) {
    try {
      const [result] = await pool.query(
        `INSERT INTO CPI (Roll_no, Sem_no, Year, cumulativeCPI)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE cumulativeCPI = VALUES(cumulativeCPI)`,
        [Roll_no, Sem_no, Year, cumulativeCPI]
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async getCPI(Roll_no, Sem_no) {
    const [cpi] = await pool.query(
      `SELECT * FROM CPI WHERE Roll_no = ? AND Sem_no <= ? `,
      [Roll_no, Sem_no]
    );
    return cpi;
  }

  static async removeCPI(Roll_no, Sem_no, Year) {
    try {
      const [result] = await pool.query(
        `DELETE FROM CPI WHERE Roll_no = ? AND Sem_no = ? AND Year = ?`,
        [Roll_no, Sem_no, Year]
      );
      if (result.affectedRows === 0) {
        throw new Error('CPI record not found');
      }
      return result;
    } catch (error) {
      console.error('Error removing CPI record:', error);
      throw error;
    }
  }
}

module.exports = CPIModel;
