/**
 * Poll Calculator Module
 * Provides calculation and analysis functions for poll results.
 *
 * NOTE: This module does not have unit tests yet.
 */

/**
 * Calculates the percentage of votes for each option
 * @param {Array} options - Array of options with vote counts
 * @returns {Array} Options with percentage property added
 */
function calculatePercentages(options) {
  if (!Array.isArray(options) || options.length === 0) {
    return [];
  }

  const totalVotes = options.reduce((sum, opt) => sum + (opt.votes || 0), 0);

  return options.map(option => ({
    ...option,
    percentage: totalVotes === 0 ? 0 : Math.round((option.votes / totalVotes) * 100)
  }));
}


/**
 * Determines the winning option(s) - handles ties
 * @param {Array} options - Array of options with vote counts
 * @returns {Array} Array of winning option(s)
 */
function determineWinner(options) {
  if (!Array.isArray(options) || options.length === 0) {
    return [];
  }

  const maxVotes = Math.max(...options.map(opt => opt.votes || 0));

  if (maxVotes === 0) {
    return [];
  }

  return options.filter(opt => opt.votes === maxVotes);
}

/**
 * Checks if a voter has already voted on a poll
 * @param {Object} poll - The poll object
 * @param {string} voterId - The voter's ID
 * @returns {boolean} True if voter has already voted
 */
function hasVoterVoted(poll, voterId) {
  if (!poll || !voterId) {
    return false;
  }

  if (!Array.isArray(poll.voters)) {
    return false;
  }

  return poll.voters.includes(voterId);
}

/**
 * Validates if a vote is valid
 * @param {Object} poll - The poll object
 * @param {number} optionIndex - The index of the selected option
 * @param {string} voterId - The voter's ID
 * @returns {{ valid: boolean, error?: string }}
 */
function validateVote(poll, optionIndex, voterId) {
  if (!poll) {
    return { valid: false, error: 'Poll not found' };
  }

  if (!voterId || typeof voterId !== 'string') {
    return { valid: false, error: 'Voter ID is required' };
  }

  if (typeof optionIndex !== 'number' || optionIndex < 0) {
    return { valid: false, error: 'Invalid option index' };
  }

  if (!poll.options || optionIndex >= poll.options.length) {
    return { valid: false, error: 'Option does not exist' };
  }

  if (hasVoterVoted(poll, voterId)) {
    return { valid: false, error: 'You have already voted on this poll' };
  }

  return { valid: true };
}

/**
 * Formats poll results for API response
 * @param {Object} poll - The poll object
 * @returns {Object} Formatted poll results
 */
function formatResults(poll) {
  if (!poll) {
    return null;
  }

  const optionsWithPercentages = calculatePercentages(poll.options || []);
  const winners = determineWinner(poll.options || []);
  const totalVotes = (poll.options || []).reduce((sum, opt) => sum + (opt.votes || 0), 0);

  return {
    id: poll.id,
    question: poll.question,
    options: optionsWithPercentages,
    totalVotes,
    winners: winners.map(w => w.text),
    voterCount: (poll.voters || []).length,
    createdAt: poll.createdAt,
    isTied: winners.length > 1
  };
}

/**
 * Calculates statistics for a poll
 * @param {Object} poll - The poll object
 * @returns {Object} Poll statistics
 */
function calculateStats(poll) {
  if (!poll || !poll.options) {
    return null;
  }

  const totalVotes = poll.options.reduce((sum, opt) => sum + (opt.votes || 0), 0);
  const optionCount = poll.options.length;
  const averageVotesPerOption = optionCount > 0 ? totalVotes / optionCount : 0;

  const voteCounts = poll.options.map(opt => opt.votes || 0);
  const maxVotes = Math.max(...voteCounts);
  const minVotes = Math.min(...voteCounts);
  const spread = maxVotes - minVotes;

  return {
    totalVotes,
    optionCount,
    averageVotesPerOption: Math.round(averageVotesPerOption * 10) / 10,
    maxVotes,
    minVotes,
    spread,
    participation: poll.voters ? poll.voters.length : 0
  };
}

/**
 * Ranks options by vote count
 * @param {Array} options - Array of options with vote counts
 * @returns {Array} Options sorted by votes with rank property
 */
function rankOptions(options) {
  if (!Array.isArray(options) || options.length === 0) {
    return [];
  }

  const sorted = [...options].sort((a, b) => (b.votes || 0) - (a.votes || 0));

  let currentRank = 1;
  let previousVotes = null;

  return sorted.map((option, index) => {
    if (previousVotes !== null && option.votes !== previousVotes) {
      currentRank = index + 1;
    }
    previousVotes = option.votes;

    return {
      ...option,
      rank: currentRank
    };
  });
}

/**
 * Checks if a poll has reached a quorum
 * @param {Object} poll - The poll object
 * @param {number} minimumVotes - Minimum votes required
 * @returns {boolean} True if quorum is reached
 */
function hasReachedQuorum(poll, minimumVotes) {
  if (!poll || typeof minimumVotes !== 'number') {
    return false;
  }

  const totalVotes = (poll.options || []).reduce((sum, opt) => sum + (opt.votes || 0), 0);
  return totalVotes >= minimumVotes;
}

/**
 * Gets the margin of victory (difference between 1st and 2nd place)
 * @param {Array} options - Array of options with vote counts
 * @returns {number} The vote margin, or 0 if less than 2 options
 */
function getVictoryMargin(options) {
  if (!Array.isArray(options) || options.length < 2) {
    return 0;
  }

  const sorted = [...options].sort((a, b) => (b.votes || 0) - (a.votes || 0));
  return (sorted[0].votes || 0) - (sorted[1].votes || 0);
}

module.exports = {
  calculatePercentages,
  determineWinner,
  hasVoterVoted,
  validateVote,
  formatResults,
  calculateStats,
  rankOptions,
  hasReachedQuorum,
  getVictoryMargin
};
