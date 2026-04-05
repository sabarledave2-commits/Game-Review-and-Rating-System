const pool = require('../config/db');

exports.getAllGames = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT g.*, gen.name as genre_name 
            FROM GAMES g 
            LEFT JOIN GENRES gen ON g.genre_id = gen.id
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching games:', error);
        res.status(500).json({ message: 'Error fetching games', details: error.message });
    }
};

exports.getGameById = async (req, res) => {
    const { id } = req.params;
    const gameId = parseInt(id);

    if (isNaN(gameId)) {
        return res.status(400).json({ message: 'Invalid Game ID' });
    }

    try {
        const [gameRows] = await pool.query(`
            SELECT g.*, gen.name as genre_name 
            FROM GAMES g 
            LEFT JOIN GENRES gen ON g.genre_id = gen.id 
            WHERE g.id = ?
        `, [gameId]);

        if (gameRows.length === 0) {
            return res.status(404).json({ message: 'Game not found' });
        }

        const game = gameRows[0];

        const [platformRows] = await pool.query(`
            SELECT p.id, p.name 
            FROM PLATFORMS p 
            JOIN GAME_PLATFORMS gp ON p.id = gp.platform_id 
            WHERE gp.game_id = ?
        `, [gameId]);

        game.platforms = platformRows.map(p => ({ id: p.id, name: p.name }));

        const [reviewRows] = await pool.query(`
            SELECT r.*, u.username 
            FROM REVIEWS r 
            JOIN USERS u ON r.user_id = u.id 
            WHERE r.game_id = ? 
            ORDER BY r.created_at DESC
        `, [gameId]);

        game.reviews = reviewRows;

        res.json(game);
    } catch (error) {
        console.error('Error fetching game details:', error);
        res.status(500).json({ message: 'Error fetching game details', details: error.message });
    }
};

exports.createGame = async (req, res) => {
    const { title, description, release_date, developer, genre_id, platforms, image_url } = req.body;

    if (!title || !genre_id) {
        return res.status(400).json({ message: 'Title and Genre are required' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [result] = await connection.query(`
            INSERT INTO GAMES (title, description, release_date, developer, genre_id, image_url) 
            VALUES (?, ?, ?, ?, ?, ?)
        `, [title, description || null, release_date || null, developer || null, genre_id, image_url || null]);

        const gameId = result.insertId;

        if (platforms && Array.isArray(platforms) && platforms.length > 0) {
            const platformValues = platforms.map(pId => [gameId, parseInt(pId)]);
            await connection.query(`
                INSERT INTO GAME_PLATFORMS (game_id, platform_id) 
                VALUES ?
            `, [platformValues]);
        }

        await connection.commit();
        res.status(201).json({ id: gameId, message: 'Game created successfully' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error creating game:', error);
        res.status(500).json({ message: 'Error creating game', details: error.message });
    } finally {
        if (connection) connection.release();
    }
};

exports.updateGame = async (req, res) => {
    const { id } = req.params;
    const gameId = parseInt(id);
    const { title, description, release_date, developer, genre_id, platforms, image_url } = req.body;

    console.log(`[UPDATE] Request for ID ${gameId}:`, JSON.stringify(req.body));

    if (isNaN(gameId)) {
        return res.status(400).json({ message: 'Invalid Game ID' });
    }

    if (!title || !genre_id) {
        return res.status(400).json({ message: 'Title and Genre are required' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Update the main game record
        const releaseDateValue = (release_date && release_date.trim() !== '') ? release_date : null;
        
        const updateQuery = `
            UPDATE GAMES 
            SET title = ?, 
                description = ?, 
                release_date = ?, 
                developer = ?, 
                genre_id = ?, 
                image_url = ? 
            WHERE id = ?
        `;
        const updateParams = [
            title, 
            description || null, 
            releaseDateValue, 
            developer || null, 
            parseInt(genre_id), 
            image_url || null, 
            gameId
        ];

        console.log('[UPDATE] Executing SQL with params:', updateParams);
        const [updateResult] = await connection.query(updateQuery, updateParams);

        if (updateResult.affectedRows === 0) {
            console.warn(`[UPDATE] No game found with ID ${gameId}`);
            await connection.rollback();
            return res.status(404).json({ message: 'Game not found' });
        }

        // 2. Update platforms if provided
        if (platforms !== undefined && Array.isArray(platforms)) {
            console.log(`[UPDATE] Updating platforms for ${gameId}:`, platforms);
            await connection.query('DELETE FROM GAME_PLATFORMS WHERE game_id = ?', [gameId]);
            
            for (const pId of platforms) {
                const platformId = parseInt(pId);
                if (!isNaN(platformId)) {
                    await connection.query('INSERT INTO GAME_PLATFORMS (game_id, platform_id) VALUES (?, ?)', [gameId, platformId]);
                }
            }
        }

        await connection.commit();
        console.log(`[UPDATE] Successfully updated game ${gameId}`);
        res.json({ message: 'Game updated successfully' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('[UPDATE] FATAL SERVER ERROR:', error);
        res.status(500).json({ 
            message: 'Error updating game', 
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        if (connection) connection.release();
    }
};

exports.deleteGame = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM GAMES WHERE id = ?', [id]);
        res.json({ message: 'Game deleted successfully' });
    } catch (error) {
        console.error('Error deleting game:', error);
        res.status(500).json({ message: 'Error deleting game', details: error.message });
    }
};
