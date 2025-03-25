const pool = require('../config/dbconfig');

class SPIModel {
  static async initTable() {
    const createTable = `
      CREATE TABLE IF NOT EXISTS SPI (
        Roll_no INT NOT NULL,
        Sem_no INT NOT NULL,
        Year INT NOT NULL,
        cumulativeSPI FLOAT CHECK (cumulativeSPI BETWEEN 0 AND 10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (Roll_no, Sem_no, Year),
        FOREIGN KEY (Roll_no) REFERENCES Students(Roll_no) ON DELETE CASCADE,
        FOREIGN KEY (Sem_no, Year) REFERENCES Semesters(Sem_no, Year) ON DELETE CASCADE
      )
    `;
    try {
      await pool.query(createTable);
      console.log('SPI table initialized');
    } catch (error) {
      console.error('SPI table initialization failed:', error);
      throw error;
    }
  }

  static async addSPI(Roll_no, Sem_no, Year, cumulativeSPI) {
    try {
      const [result] = await pool.query(
        `INSERT INTO SPI (Roll_no, Sem_no, Year, cumulativeSPI)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE cumulativeSPI = VALUES(cumulativeSPI)`,
        [Roll_no, Sem_no, Year, cumulativeSPI]
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async getSPI(Roll_no, Sem_no) {
    const [SPI] = await pool.query(
      `SELECT * FROM SPI WHERE Roll_no = ? AND Sem_no <= ? `,
      [Roll_no, Sem_no]
    );
    return SPI;
  }

  static async removeSPI(Roll_no, Sem_no, Year) {
    try {
      const [result] = await pool.query(
        `DELETE FROM SPI WHERE Roll_no = ? AND Sem_no = ? AND Year = ?`,
        [Roll_no, Sem_no, Year]
      );
      if (result.affectedRows === 0) {
        throw new Error('SPI record not found');
      }
      return result;
    } catch (error) {
      console.error('Error removing SPI record:', error);
      throw error;
    }
  }
}

module.exports = SPIModel;