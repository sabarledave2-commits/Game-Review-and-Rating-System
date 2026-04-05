const pool = require('../config/db');

exports.getAllGenres = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM GENRES');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching genres' });
    }
};
