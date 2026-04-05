const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const gameRoutes = require('./routes/games');
const reviewRoutes = require('./routes/reviews');
const genreRoutes = require('./routes/genres');
const platformRoutes = require('./routes/platforms');
const authRoutes = require('./routes/auth');

// Explicitly load .env from the server directory
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/games', gameRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/genres', genreRoutes);
app.use('/api/platforms', platformRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.send('Game Review API is running');
});

// Test DB Connection and perform migrations
const pool = require('./config/db');
pool.getConnection()
    .then(async conn => {
        console.log('Database connected successfully to:', process.env.DB_NAME);
        
        // Migration: Ensure necessary columns exist in GAMES table
        try {
            const [columns] = await conn.query('DESCRIBE GAMES');
            const columnNames = columns.map(col => col.Field);

            if (!columnNames.includes('image_url')) {
                console.log('Migration: Adding image_url column to GAMES table...');
                await conn.query('ALTER TABLE GAMES ADD COLUMN image_url VARCHAR(2048)');
                console.log('Migration: image_url column added successfully.');
            }

            if (!columnNames.includes('average_rating')) {
                console.log('Migration: Adding average_rating column to GAMES table...');
                await conn.query('ALTER TABLE GAMES ADD COLUMN average_rating DECIMAL(4, 2) DEFAULT 0');
                console.log('Migration: average_rating column added successfully.');
            } else {
                console.log('Migration: Updating average_rating column precision...');
                await conn.query('ALTER TABLE GAMES MODIFY COLUMN average_rating DECIMAL(4, 2) DEFAULT 0');
                console.log('Migration: average_rating column precision updated.');
            }

            console.log('Migration: All columns verified.');
        } catch (migrationErr) {
            console.error('MIGRATION ERROR:', migrationErr.message);
        }

        conn.release();
    })
    .catch(err => {
        console.error('DATABASE CONNECTION ERROR:', err.message);
    });

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
