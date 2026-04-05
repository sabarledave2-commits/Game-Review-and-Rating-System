const pool = require('../config/db');

exports.createReview = async (req, res) => {
    const { game_id, user_id, rating, review_text } = req.body;

    if (!game_id || !user_id || !rating) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const numericRating = parseInt(rating);
        const numericGameId = parseInt(game_id);
        const numericUserId = parseInt(user_id);

        if (isNaN(numericRating) || numericRating < 1 || numericRating > 10) {
            return res.status(400).json({ message: 'Rating must be a number between 1 and 10' });
        }

        await connection.query(`
            INSERT INTO REVIEWS (game_id, user_id, rating, review_text) 
            VALUES (?, ?, ?, ?)
        `, [numericGameId, numericUserId, numericRating, review_text]);

        // Update average rating for the game
        const [avgRows] = await connection.query(`
            SELECT AVG(rating) as average_rating 
            FROM REVIEWS 
            WHERE game_id = ?
        `, [numericGameId]);

        const newAvg = avgRows[0].average_rating || 0;

        await connection.query(`
            UPDATE GAMES 
            SET average_rating = ? 
            WHERE id = ?
        `, [newAvg, numericGameId]);

        await connection.commit();
        res.status(201).json({ message: 'Review created successfully' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error creating review:', error);
        res.status(500).json({ message: 'Error creating review', details: error.message });
    } finally {
        if (connection) connection.release();
    }
};

exports.updateReview = async (req, res) => {
    const { id } = req.params;
    const { rating, review_text } = req.body;

    if (!rating) {
        return res.status(400).json({ message: 'Rating is required' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const numericRating = parseInt(rating);
        const reviewId = parseInt(id);

        if (isNaN(numericRating) || numericRating < 1 || numericRating > 10) {
            return res.status(400).json({ message: 'Rating must be a number between 1 and 10' });
        }

        // Get game_id for this review first
        const [reviewRows] = await connection.query('SELECT game_id FROM REVIEWS WHERE id = ?', [reviewId]);
        if (reviewRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Review not found' });
        }
        const gameId = reviewRows[0].game_id;

        await connection.query(`
            UPDATE REVIEWS 
            SET rating = ?, review_text = ? 
            WHERE id = ?
        `, [numericRating, review_text, reviewId]);

        // Update average rating for the game
        const [avgRows] = await connection.query(`
            SELECT AVG(rating) as average_rating 
            FROM REVIEWS 
            WHERE game_id = ?
        `, [gameId]);

        const newAvg = avgRows[0].average_rating || 0;

        await connection.query(`
            UPDATE GAMES 
            SET average_rating = ? 
            WHERE id = ?
        `, [newAvg, gameId]);

        await connection.commit();
        res.json({ message: 'Review updated successfully' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error updating review:', error);
        res.status(500).json({ message: 'Error updating review', details: error.message });
    } finally {
        if (connection) connection.release();
    }
};
