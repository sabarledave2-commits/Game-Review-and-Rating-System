const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDB() {
    // Connect without a database first
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
    });

    try {
        console.log('Starting Database Initialization...');

        // 1. Create the database if it doesn't exist
        const dbName = process.env.DB_NAME || 'game_review_and_rating_system_db';
        console.log(`Ensuring database '${dbName}' exists...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
        await connection.query(`USE ${dbName}`);
        console.log(`Switched to database: ${dbName}`);

        // 2. Read and execute schema.sql to ensure tables exist
        console.log('Applying schema...');
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        
        // Split by semicolon to run multiple statements, but filter out empty ones
        const statements = schemaSql.split(';').map(s => s.trim()).filter(s => s.length > 0);
        
        for (let statement of statements) {
            // Skip the CREATE DATABASE/USE lines from schema.sql if they already exist, 
            // as we handled them above to be safe.
            if (statement.toUpperCase().startsWith('CREATE DATABASE') || statement.toUpperCase().startsWith('USE ')) {
                continue;
            }
            await connection.query(statement);
        }
        console.log('Schema applied successfully.');

        // 3. Clear existing data safely
        console.log('Cleaning existing data...');
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        
        const tables = ['GAME_PLATFORMS', 'REVIEWS', 'GAMES', 'USERS', 'PLATFORMS', 'GENRES'];
        for (const table of tables) {
            await connection.query(`DELETE FROM ${table}`);
            await connection.query(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
        }
        
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        // 4. Seed Genres
        console.log('Seeding genres...');
        await connection.query(`
            INSERT INTO GENRES (name) VALUES 
            ('RPG'), ('Action'), ('Shooter'), ('Adventure'), ('Sports'), ('Strategy')
        `);
        const genreMap = { RPG: 1, Action: 2, Shooter: 3, Adventure: 4, Sports: 5, Strategy: 6 };

        // 5. Seed Platforms
        console.log('Seeding platforms...');
        await connection.query(`
            INSERT INTO PLATFORMS (name) VALUES 
            ('PC'), ('PlayStation 5'), ('Xbox Series X'), ('Nintendo Switch')
        `);
        const platformMap = { PC: 1, PS5: 2, Xbox: 3, Switch: 4 };

        // 6. Seed Users
        console.log('Seeding users...');
        const passwordHash = await bcrypt.hash('password123', 10);
        await connection.query(`
            INSERT INTO USERS (username, email, password_hash) VALUES 
            ('GamerOne', 'gamer1@example.com', ?),
            ('ProCritic', 'critic@example.com', ?),
            ('CasualPlayer', 'casual@example.com', ?)
        `, [passwordHash, passwordHash, passwordHash]);

        // 7. Seed Games
        console.log('Seeding games...');
        const games = [
            { 
                title: 'The Witcher 3: Wild Hunt', 
                description: 'Geralt of Rivia, a monster hunter, searches for his missing adopted daughter.', 
                release_date: '2015-05-19', 
                developer: 'CD Projekt Red', 
                genre_id: genreMap.RPG, 
                platforms: [platformMap.PC, platformMap.PS5, platformMap.Xbox],
                image_url: 'https://cdn.akamai.steamstatic.com/steam/apps/292030/header.jpg'
            },
            { 
                title: 'Elden Ring', 
                description: 'Rise, Tarnished, and be guided by grace to brandish the power of the Elden Ring.', 
                release_date: '2022-02-25', 
                developer: 'FromSoftware', 
                genre_id: genreMap.RPG, 
                platforms: [platformMap.PC, platformMap.PS5, platformMap.Xbox],
                image_url: 'https://cdn.akamai.steamstatic.com/steam/apps/1245620/header.jpg'
            },
            { 
                title: 'Cyberpunk 2077', 
                description: 'Become a mercenary outlaw in the megalopolis of Night City.', 
                release_date: '2020-12-10', 
                developer: 'CD Projekt Red', 
                genre_id: genreMap.Action, 
                platforms: [platformMap.PC, platformMap.PS5, platformMap.Xbox],
                image_url: 'https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg'
            },
            { 
                title: 'God of War Ragnarök', 
                description: 'Kratos and Atreus embark on a mythic journey for answers before Ragnarök arrives.', 
                release_date: '2022-11-09', 
                developer: 'Santa Monica Studio', 
                genre_id: genreMap.Action, 
                platforms: [platformMap.PS5],
                image_url: 'https://gmedia.playstation.com/is/image/SIEPDC/god-of-war-ragnarok-listing-thumb-01-09sep21$en'
            },
            { 
                title: 'Red Dead Redemption 2', 
                description: 'The story of outlaw Arthur Morgan and the Van der Linde gang.', 
                release_date: '2018-10-26', 
                developer: 'Rockstar Games', 
                genre_id: genreMap.Adventure, 
                platforms: [platformMap.PC, platformMap.PS5, platformMap.Xbox],
                image_url: 'https://cdn.akamai.steamstatic.com/steam/apps/1174180/header.jpg'
            }
        ];

        for (const game of games) {
            const [res] = await connection.query(`
                INSERT INTO GAMES (title, description, release_date, developer, genre_id, image_url) 
                VALUES (?, ?, ?, ?, ?, ?)
            `, [game.title, game.description, game.release_date, game.developer, game.genre_id, game.image_url]);
            const gameId = res.insertId;

            // Platforms assignment
            for (const platformId of game.platforms) {
                await connection.query('INSERT INTO GAME_PLATFORMS (game_id, platform_id) VALUES (?, ?)', [gameId, platformId]);
            }
        }

        // 8. Seed Reviews
        console.log('Seeding reviews...');
        await connection.query(`
            INSERT INTO REVIEWS (game_id, user_id, rating, review_text) VALUES 
            (1, 1, 10, 'One of the best games ever made!'),
            (1, 2, 9, 'Incredible storytelling and world-building.'),
            (2, 2, 10, 'A masterpiece of exploration and challenge.'),
            (3, 3, 7, 'Great visuals, but still has some bugs.'),
            (4, 1, 9, 'Emotional journey and satisfying combat.')
        `);

        // 9. Update Average Ratings
        console.log('Calculating average ratings...');
        const [gamesList] = await connection.query('SELECT id FROM GAMES');
        for (const game of gamesList) {
            const [avgRows] = await connection.query('SELECT AVG(rating) as avg_rating FROM REVIEWS WHERE game_id = ?', [game.id]);
            const avg = avgRows[0].avg_rating || 0;
            await connection.query('UPDATE GAMES SET average_rating = ? WHERE id = ?', [avg, game.id]);
        }

        console.log('Database initialized and seeded successfully!');
    } catch (error) {
        console.error('Error during database initialization:', error);
        process.exit(1);
    } finally {
        await connection.end();
        process.exit();
    }
}

initDB();
