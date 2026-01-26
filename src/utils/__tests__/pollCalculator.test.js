const {
  calculatePercentages,
  determineWinner,
  hasVoterVoted,
  validateVote,
  formatResults,
  calculateStats,
  rankOptions,
  hasReachedQuorum,
  getVictoryMargin
} = require('../pollCalculator');

describe('pollCalculator', () => {
  describe('calculatePercentages', () => {
    it('returns empty array for invalid input', () => {
      expect(calculatePercentages(null)).toEqual([]);
      expect(calculatePercentages([])).toEqual([]);
    });

    it('calculates percentages and rounds correctly', () => {
      const options = [
        { text: 'A', votes: 2 },
        { text: 'B', votes: 1 }
      ];

      const res = calculatePercentages(options);
      expect(res).toHaveLength(2);
      expect(res[0].percentage).toBe(67); // 2/3 -> 66.666 -> 67
      expect(res[1].percentage).toBe(33);
    });

    it('handles zero total votes', () => {
      const opts = [{ text: 'A', votes: 0 }, { text: 'B', votes: 0 }];
      const res = calculatePercentages(opts);
      expect(res.every(o => o.percentage === 0)).toBe(true);
    });
  });

  describe('determineWinner', () => {
    it('returns empty for invalid input or no options', () => {
      expect(determineWinner(null)).toEqual([]);
      expect(determineWinner([])).toEqual([]);
    });

    it('returns empty array when max votes is 0', () => {
      const opts = [{ text: 'A', votes: 0 }, { text: 'B', votes: 0 }];
      expect(determineWinner(opts)).toEqual([]);
    });

    it('returns single winner and handles ties', () => {
      const opts = [{ text: 'A', votes: 3 }, { text: 'B', votes: 1 }];
      expect(determineWinner(opts)).toEqual([opts[0]]);

      const tie = [{ text: 'A', votes: 2 }, { text: 'B', votes: 2 }, { text: 'C', votes: 1 }];
      const winners = determineWinner(tie);
      expect(winners).toHaveLength(2);
      expect(winners).toContainEqual(tie[0]);
      expect(winners).toContainEqual(tie[1]);
    });
  });

  describe('hasVoterVoted', () => {
    it('returns false for invalid inputs', () => {
      expect(hasVoterVoted(null, 'v1')).toBe(false);
      expect(hasVoterVoted({}, '')).toBe(false);
    });

    it('detects existing voter', () => {
      const poll = { voters: ['a', 'b'] };
      expect(hasVoterVoted(poll, 'a')).toBe(true);
      expect(hasVoterVoted(poll, 'c')).toBe(false);
    });
  });

  describe('validateVote', () => {
    const basePoll = { options: [{ text: 'A', votes: 0 }, { text: 'B', votes: 0 }], voters: [] };

    it('rejects missing poll', () => {
      expect(validateVote(null, 0, 'v1')).toEqual({ valid: false, error: 'Poll not found' });
    });

    it('rejects invalid voter id', () => {
      expect(validateVote(basePoll, 0, '')).toEqual({ valid: false, error: 'Voter ID is required' });
      expect(validateVote(basePoll, 0, 123)).toEqual({ valid: false, error: 'Voter ID is required' });
    });

    it('rejects invalid option index', () => {
      expect(validateVote(basePoll, -1, 'v1')).toEqual({ valid: false, error: 'Invalid option index' });
      expect(validateVote(basePoll, 5, 'v1')).toEqual({ valid: false, error: 'Option does not exist' });
    });

    it('rejects if voter already voted', () => {
      const poll = { ...basePoll, voters: ['v1'] };
      expect(validateVote(poll, 0, 'v1')).toEqual({ valid: false, error: 'You have already voted on this poll' });
    });

    it('accepts valid vote', () => {
      expect(validateVote(basePoll, 1, 'v1')).toEqual({ valid: true });
    });
  });

  describe('formatResults', () => {
    it('returns null for falsy poll', () => {
      expect(formatResults(null)).toBeNull();
    });

    it('formats correctly and includes winners array and isTied flag', () => {
      const poll = {
        id: 'p1',
        question: 'Q?',
        options: [{ text: 'A', votes: 2 }, { text: 'B', votes: 2 }, { text: 'C', votes: 0 }],
        voters: ['x', 'y'],
        createdAt: '2020-01-01'
      };

      const out = formatResults(poll);
      expect(out.id).toBe('p1');
      expect(out.question).toBe('Q?');
      expect(out.options.every(o => typeof o.percentage === 'number')).toBe(true);
      expect(out.totalVotes).toBe(4);
      expect(out.winners).toEqual(['A', 'B']);
      expect(out.voterCount).toBe(2);
      expect(out.isTied).toBe(true);
    });

    it('handles case where there are no winners (all zero votes)', () => {
      const poll = { id: 'p2', question: 'Q2', options: [{ text: 'A', votes: 0 }], voters: [] };
      const out = formatResults(poll);
      expect(out.winners).toEqual([]);
      expect(out.isTied).toBe(false);
    });
  });

  describe('calculateStats', () => {
    it('returns null for invalid poll', () => {
      expect(calculateStats(null)).toBeNull();
      expect(calculateStats({})).toBeNull();
    });

    it('calculates stats correctly', () => {
      const poll = { options: [{ votes: 3 }, { votes: 1 }, { votes: 0 }], voters: ['a'] };
      const stats = calculateStats(poll);
      expect(stats.totalVotes).toBe(4);
      expect(stats.optionCount).toBe(3);
      expect(stats.averageVotesPerOption).toBeCloseTo(1.3, 1); // 4/3 -> 1.333 -> 1.3 after rounding logic
      expect(stats.maxVotes).toBe(3);
      expect(stats.minVotes).toBe(0);
      expect(stats.spread).toBe(3);
      expect(stats.participation).toBe(1);
    });
  });

  describe('rankOptions', () => {
    it('returns empty for invalid input', () => {
      expect(rankOptions(null)).toEqual([]);
      expect(rankOptions([])).toEqual([]);
    });

    it('ranks options and assigns equal ranks for ties', () => {
      const opts = [{ text: 'A', votes: 5 }, { text: 'B', votes: 5 }, { text: 'C', votes: 3 }];
      const ranked = rankOptions(opts);
      expect(ranked[0].rank).toBe(1);
      expect(ranked[1].rank).toBe(1);
      expect(ranked[2].rank).toBe(3);
    });
  });

  describe('hasReachedQuorum', () => {
    const poll = { options: [{ votes: 2 }, { votes: 1 }] };
    it('returns false for invalid input', () => {
      expect(hasReachedQuorum(null, 1)).toBe(false);
      expect(hasReachedQuorum(poll, 'a')).toBe(false);
    });

    it('evaluates quorum correctly', () => {
      expect(hasReachedQuorum(poll, 4)).toBe(false);
      expect(hasReachedQuorum(poll, 3)).toBe(true);
    });
  });

  describe('getVictoryMargin', () => {
    it('returns 0 for invalid or insufficient options', () => {
      expect(getVictoryMargin(null)).toBe(0);
      expect(getVictoryMargin([{ votes: 1 }])).toBe(0);
    });

    it('returns correct margin', () => {
      const opts = [{ votes: 10 }, { votes: 7 }, { votes: 3 }];
      expect(getVictoryMargin(opts)).toBe(3);
    });
  });
});
