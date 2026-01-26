const { v4: uuidv4 } = require('uuid');
const { createStorageService } = require('./storageService');
const { validateVote, formatResults } = require('../utils/pollCalculator');

/**
 * Creates a poll service with business logic for poll operations
 * @param {Object} storage - Storage service instance (optional, for testing)
 * @returns {Object} Poll service methods
 */
function createPollService(storage = null) {
  const storageService = storage || createStorageService();

  /**
   * Creates a new poll
   * @param {string} question - The poll question
   * @param {Array<string>} options - Array of option texts
   * @returns {{ success: boolean, poll?: Object, error?: string }}
   */
  function createPoll(question, options) {
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return { success: false, error: 'Question is required' };
    }

    if (!Array.isArray(options) || options.length < 2) {
      return { success: false, error: 'At least 2 options are required' };
    }

    if (options.length > 10) {
      return { success: false, error: 'Maximum 10 options allowed' };
    }

    const uniqueOptions = [...new Set(options.map(o => o.trim().toLowerCase()))];
    if (uniqueOptions.length !== options.length) {
      return { success: false, error: 'Duplicate options are not allowed' };
    }

    const poll = {
      id: uuidv4(),
      question: question.trim(),
      options: options.map(text => ({
        text: text.trim(),
        votes: 0
      })),
      voters: [],
      createdAt: new Date().toISOString()
    };

    storageService.savePoll(poll);

    return { success: true, poll };
  }

  /**
   * Gets all polls
   * @returns {Array} Array of polls
   */
  function getAllPolls() {
    return storageService.getAllPolls();
  }

  /**
   * Gets a poll by ID with formatted results
   * @param {string} id - The poll ID
   * @returns {Object|null} Formatted poll results or null
   */
  function getPoll(id) {
    const poll = storageService.getPollById(id);
    if (!poll) {
      return null;
    }
    return formatResults(poll);
  }

  /**
   * Gets raw poll data by ID (without formatting)
   * @param {string} id - The poll ID
   * @returns {Object|null} Raw poll or null
   */
  function getRawPoll(id) {
    return storageService.getPollById(id);
  }

  /**
   * Casts a vote on a poll
   * @param {string} pollId - The poll ID
   * @param {number} optionIndex - The index of the selected option
   * @param {string} voterId - The voter's ID
   * @returns {{ success: boolean, poll?: Object, error?: string }}
   */
  function vote(pollId, optionIndex, voterId) {
    const poll = storageService.getPollById(pollId);

    const validation = validateVote(poll, optionIndex, voterId);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    poll.options[optionIndex].votes += 1;
    poll.voters.push(voterId);

    storageService.updatePoll(pollId, poll);

    return { success: true, poll: formatResults(poll) };
  }

  /**
   * Deletes a poll
   * @param {string} id - The poll ID
   * @returns {boolean} True if deleted
   */
  function deletePoll(id) {
    return storageService.deletePoll(id);
  }

  return {
    createPoll,
    getAllPolls,
    getPoll,
    getRawPoll,
    vote,
    deletePoll
  };
}

module.exports = { createPollService };
