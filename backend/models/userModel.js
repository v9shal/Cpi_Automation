const pool = require('../config/dbconfig');

class UserModel {
  static async initTable() {
    const createTable = `
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    try {
      await pool.query(createTable);
      console.log('Users table initialized');
    } catch (error) {
      console.error('Table initialization failed:', error);
      throw error;
    }
  }

  static async createUser(username, password) {
    const [result] = await pool.query(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, password]
    );
    return result;
  }

  static async getUserByUsername(username) {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0];
  }

  static async deleteUser(username) {
    const [result] = await pool.query('DELETE FROM users WHERE username = ?', [username]);
    return result;
  }
}

module.exports = UserModel;