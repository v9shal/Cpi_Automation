const pool = require('../config/dbconfig');

class SemesterModel {
    static async initTable() {
        const createTable = `
            CREATE TABLE IF NOT EXISTS Semesters (
                Sem_no INT NOT NULL,
                Year INT NOT NULL,
                Start_Date DATE NOT NULL,
                End_Date DATE NOT NULL,
                Status ENUM('UPCOMING', 'ONGOING', 'COMPLETED') DEFAULT 'UPCOMING',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (Sem_no, Year)
            )
        `;
        try {
            await pool.query(createTable);
            console.log('Semesters table initialized');
        } catch (error) {
            console.error('Semesters table initialization failed:', error);
            throw error;
        }
    }

    static async createSemester(Sem_no, Year, Start_Date, End_Date) {
        try {
            const [result] = await pool.query(
                `INSERT INTO Semesters (Sem_no, Year, Start_Date, End_Date)
                 VALUES (?, ?, ?, ?)`,
                [Sem_no, Year, Start_Date, End_Date]
            );
            return result;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Semester already exists for this year');
            }
            throw error;
        }
    }
    
    static async getSemester(Sem_no, Year) {
        try {
            const [semester] = await pool.query(
                `SELECT * FROM Semesters WHERE Sem_no = ? AND Year = ?`,
                [Sem_no, Year]
            );
            return semester.length > 0 ? semester[0] : null;
        } catch (error) {
            console.error('Error fetching semester:', error);
            throw error;
        }
    }
    
    static async updateSemesterStatus(Sem_no, Year, Status) {
        try {
            const [result] = await pool.query(
                `UPDATE Semesters SET Status = ? WHERE Sem_no = ? AND Year = ?`,
                [Status, Sem_no, Year]
            );
            return result;
        } catch (error) {
            console.error('Error updating semester status:', error);
            throw error;
        }
    }
}

module.exports = SemesterModel;