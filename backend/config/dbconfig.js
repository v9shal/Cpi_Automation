const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'mysql',
  user: 'root',
  password: 'vishal@43',
  database: 'cpi_database',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0
});

module.exports = pool;