const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

router.post('/', reviewController.createReview);
router.put('/:id', reviewController.updateReview);

module.exports = router;
