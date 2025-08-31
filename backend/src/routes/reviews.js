const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const authUser = require('../middleware/authUser'); // Only users can post/edit/delete reviews

// Get all reviews for an accommodation (public)
router.get('/:accommodationId', async (req, res) => {
  try {
    const reviews = await Review.find({ accommodationId: req.params.accommodationId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
});

// Add a review (Authenticated user)
router.post('/', authUser, async (req, res) => {
  const { accommodationId, rating, text } = req.body;
  if (!accommodationId || !rating || !text || rating < 1 || rating > 5 || text.trim().length === 0) {
    return res.status(400).json({ error: 'Accommodation ID, rating (1-5), and non-empty text required.' });
  }
  try {
    const review = new Review({
      accommodationId,
      userId: req.user._id,
      userName: req.user.name,
      rating,
      text
    });
    await review.save();
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save review.' });
  }
});

// Edit review (Authenticated user, Own Review Only)
router.put('/:id', authUser, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found.' });
    if (review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You do not have permission to edit this review.' });
    }
    const { rating, text } = req.body;
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
      review.rating = rating;
    }
    if (text !== undefined) {
      if (text.trim().length === 0) return res.status(400).json({ error: 'Review text cannot be empty.' });
      review.text = text;
    }
    await review.save();
    res.json(review);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update review.' });
  }
});

// Delete review (Authenticated user, Own Review Only)
router.delete('/:id', authUser, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found.' });
    if (review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You do not have permission to delete this review.' });
    }
    await review.remove();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete review.' });
  }
});

module.exports = router;