const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

async function checkDb() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });

    try {
        const [games] = await connection.query('SELECT * FROM GAMES');
        console.log('GAMES:', games);
        const [users] = await connection.query('SELECT * FROM USERS');
        console.log('USERS:', users);
        const [reviews] = await connection.query('SELECT * FROM REVIEWS');
        console.log('REVIEWS:', reviews);
    } catch (err) {
        console.error('Error checking DB:', err.message);
    } finally {
        await connection.end();
    }
}

checkDb();
