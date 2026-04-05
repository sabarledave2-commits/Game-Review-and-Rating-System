const pool = require('../config/db');

exports.getAllPlatforms = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM PLATFORMS');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching platforms' });
    }
};
