const pool = require('./server/config/db');

async function checkSchema() {
    try {
        const [columns] = await pool.query('DESCRIBE GAMES');
        console.log('GAMES table structure:');
        console.table(columns);

        const [platformColumns] = await pool.query('DESCRIBE GAME_PLATFORMS');
        console.log('GAME_PLATFORMS table structure:');
        console.table(platformColumns);
        
        const [games] = await pool.query('SELECT * FROM GAMES WHERE id = 2');
        console.log('Game with ID 2:', games[0]);

        process.exit(0);
    } catch (error) {
        console.error('Error checking schema:', error);
        process.exit(1);
    }
}

checkSchema();
