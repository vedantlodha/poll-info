const express = require('express');
const { createPollService } = require('../services/pollService');

const router = express.Router();
const pollService = createPollService();

/**
 * GET /polls
 * List all polls
 */
router.get('/', (req, res) => {
  const polls = pollService.getAllPolls();
  res.json({
    count: polls.length,
    polls: polls.map(p => ({
      id: p.id,
      question: p.question,
      optionCount: p.options.length,
      createdAt: p.createdAt
    }))
  });
});

/**
 * POST /polls
 * Create a new poll
 * Body: { question: string, options: string[] }
 */
router.post('/', (req, res) => {
  const { question, options } = req.body;

  const result = pollService.createPoll(question, options);

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.status(201).json(result.poll);
});

/**
 * GET /polls/:id
 * Get a poll with results
 */
router.get('/:id', (req, res) => {
  const poll = pollService.getPoll(req.params.id);

  if (!poll) {
    return res.status(404).json({ error: 'Poll not found' });
  }

  res.json(poll);
});

/**
 * POST /polls/:id/vote
 * Vote on a poll
 * Body: { optionIndex: number, voterId: string }
 */
router.post('/:id/vote', (req, res) => {
  const { optionIndex, voterId } = req.body;

  const result = pollService.vote(req.params.id, optionIndex, voterId);

  if (!result.success) {
    const status = result.error === 'Poll not found' ? 404 : 400;
    return res.status(status).json({ error: result.error });
  }

  res.json(result.poll);
});

/**
 * DELETE /polls/:id
 * Delete a poll
 */
router.delete('/:id', (req, res) => {
  const deleted = pollService.deletePoll(req.params.id);

  if (!deleted) {
    return res.status(404).json({ error: 'Poll not found' });
  }

  res.status(204).send();
});

module.exports = router;
