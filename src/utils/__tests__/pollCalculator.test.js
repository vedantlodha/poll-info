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
    it('should return empty array for non-array input', () => {
      expect(calculatePercentages(null)).toEqual([]);
      expect(calculatePercentages(undefined)).toEqual([]);
      expect(calculatePercentages('string')).toEqual([]);
      expect(calculatePercentages(123)).toEqual([]);
      expect(calculatePercentages({})).toEqual([]);
      // write test for NaN
        expect(calculatePercentages(NaN)).toEqual([]);
    });

    it('should return empty array for empty array input', () => {
      expect(calculatePercentages([])).toEqual([]);
    });

    it('should calculate correct percentages', () => {
      const options = [
        { text: 'Option A', votes: 50 },
        { text: 'Option B', votes: 30 },
        { text: 'Option C', votes: 20 }
      ];
      const result = calculatePercentages(options);

      expect(result).toHaveLength(3);
      expect(result[0].percentage).toBe(50);
      expect(result[1].percentage).toBe(30);
      expect(result[2].percentage).toBe(20);
    });

    it('should handle zero total votes', () => {
      const options = [
        { text: 'Option A', votes: 0 },
        { text: 'Option B', votes: 0 }
      ];
      const result = calculatePercentages(options);

      expect(result[0].percentage).toBe(0);
      expect(result[1].percentage).toBe(0);
    });

    it('should handle missing votes property', () => {
      const options = [
        { text: 'Option A' },
        { text: 'Option B', votes: 0 }
      ];
      const result = calculatePercentages(options);

      expect(result[0].percentage).toBe(0);
      expect(result[1].percentage).toBe(0);
    });

    it('should round percentages to nearest integer', () => {
      const options = [
        { text: 'Option A', votes: 1 },
        { text: 'Option B', votes: 2 }
      ];
      const result = calculatePercentages(options);

      expect(result[0].percentage).toBe(33);
      expect(result[1].percentage).toBe(67);
    });

    it('should preserve original option properties', () => {
      const options = [
        { text: 'Option A', votes: 10, customProp: 'value' }
      ];
      const result = calculatePercentages(options);

      expect(result[0].text).toBe('Option A');
      expect(result[0].votes).toBe(10);
      expect(result[0].customProp).toBe('value');
      expect(result[0].percentage).toBe(100);
    });
  });

  describe('determineWinner', () => {
    it('should return empty array for non-array input', () => {
      expect(determineWinner(null)).toEqual([]);
      expect(determineWinner(undefined)).toEqual([]);
      expect(determineWinner('string')).toEqual([]);
      expect(determineWinner(123)).toEqual([]);
      expect(determineWinner({})).toEqual([]);
    });

    it('should return empty array for empty array input', () => {
      expect(determineWinner([])).toEqual([]);
    });

    it('should return empty array when all options have zero votes', () => {
      const options = [
        { text: 'Option A', votes: 0 },
        { text: 'Option B', votes: 0 }
      ];
      expect(determineWinner(options)).toEqual([]);
    });

    it('should return single winner', () => {
      const options = [
        { text: 'Option A', votes: 10 },
        { text: 'Option B', votes: 5 }
      ];
      const result = determineWinner(options);

      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Option A');
    });

    it('should handle ties', () => {
      const options = [
        { text: 'Option A', votes: 10 },
        { text: 'Option B', votes: 10 },
        { text: 'Option C', votes: 5 }
      ];
      const result = determineWinner(options);

      expect(result).toHaveLength(2);
      expect(result.map(o => o.text)).toContain('Option A');
      expect(result.map(o => o.text)).toContain('Option B');
    });

    it('should handle missing votes property', () => {
      const options = [
        { text: 'Option A' },
        { text: 'Option B', votes: 5 }
      ];
      const result = determineWinner(options);

      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Option B');
    });
  });

  describe('hasVoterVoted', () => {
    it('should return false for null/undefined poll', () => {
      expect(hasVoterVoted(null, 'voter1')).toBe(false);
      expect(hasVoterVoted(undefined, 'voter1')).toBe(false);
    });

    it('should return false for null/undefined voterId', () => {
      expect(hasVoterVoted({ voters: ['voter1'] }, null)).toBe(false);
      expect(hasVoterVoted({ voters: ['voter1'] }, undefined)).toBe(false);
      expect(hasVoterVoted({ voters: ['voter1'] }, '')).toBe(false);
    });

    it('should return false when poll has no voters array', () => {
      expect(hasVoterVoted({}, 'voter1')).toBe(false);
      expect(hasVoterVoted({ voters: null }, 'voter1')).toBe(false);
      expect(hasVoterVoted({ voters: 'notArray' }, 'voter1')).toBe(false);
    });

    it('should return true when voter has voted', () => {
      const poll = { voters: ['voter1', 'voter2', 'voter3'] };
      expect(hasVoterVoted(poll, 'voter2')).toBe(true);
    });

    it('should return false when voter has not voted', () => {
      const poll = { voters: ['voter1', 'voter2'] };
      expect(hasVoterVoted(poll, 'voter3')).toBe(false);
    });

    it('should return false for empty voters array', () => {
      const poll = { voters: [] };
      expect(hasVoterVoted(poll, 'voter1')).toBe(false);
    });
  });

  describe('validateVote', () => {
    const validPoll = {
      id: '123',
      question: 'Test?',
      options: [
        { text: 'Option A', votes: 0 },
        { text: 'Option B', votes: 0 }
      ],
      voters: []
    };

    it('should return invalid for null/undefined poll', () => {
      expect(validateVote(null, 0, 'voter1')).toEqual({ valid: false, error: 'Poll not found' });
      expect(validateVote(undefined, 0, 'voter1')).toEqual({ valid: false, error: 'Poll not found' });
    });

    it('should return invalid for null/undefined/empty voterId', () => {
      expect(validateVote(validPoll, 0, null)).toEqual({ valid: false, error: 'Voter ID is required' });
      expect(validateVote(validPoll, 0, undefined)).toEqual({ valid: false, error: 'Voter ID is required' });
      expect(validateVote(validPoll, 0, '')).toEqual({ valid: false, error: 'Voter ID is required' });
    });

    it('should return invalid for non-string voterId', () => {
      expect(validateVote(validPoll, 0, 123)).toEqual({ valid: false, error: 'Voter ID is required' });
      expect(validateVote(validPoll, 0, {})).toEqual({ valid: false, error: 'Voter ID is required' });
    });

    it('should return invalid for non-number optionIndex', () => {
      expect(validateVote(validPoll, 'abc', 'voter1')).toEqual({ valid: false, error: 'Invalid option index' });
      expect(validateVote(validPoll, null, 'voter1')).toEqual({ valid: false, error: 'Invalid option index' });
    });

    it('should return invalid for negative optionIndex', () => {
      expect(validateVote(validPoll, -1, 'voter1')).toEqual({ valid: false, error: 'Invalid option index' });
    });

    it('should return invalid for optionIndex out of bounds', () => {
      expect(validateVote(validPoll, 5, 'voter1')).toEqual({ valid: false, error: 'Option does not exist' });
      expect(validateVote(validPoll, 2, 'voter1')).toEqual({ valid: false, error: 'Option does not exist' });
    });

    it('should return invalid when poll has no options', () => {
      const pollNoOptions = { ...validPoll, options: undefined };
      expect(validateVote(pollNoOptions, 0, 'voter1')).toEqual({ valid: false, error: 'Option does not exist' });
    });

    it('should return invalid when voter has already voted', () => {
      const pollWithVoter = { ...validPoll, voters: ['voter1'] };
      expect(validateVote(pollWithVoter, 0, 'voter1')).toEqual({ valid: false, error: 'You have already voted on this poll' });
    });

    it('should return valid for valid vote', () => {
      expect(validateVote(validPoll, 0, 'voter1')).toEqual({ valid: true });
      expect(validateVote(validPoll, 1, 'voter1')).toEqual({ valid: true });
    });
  });

  describe('formatResults', () => {
    it('should return null for null/undefined poll', () => {
      expect(formatResults(null)).toBeNull();
      expect(formatResults(undefined)).toBeNull();
    });

    it('should format poll results correctly', () => {
      const poll = {
        id: '123',
        question: 'Favorite color?',
        options: [
          { text: 'Red', votes: 5 },
          { text: 'Blue', votes: 3 },
          { text: 'Green', votes: 2 }
        ],
        voters: ['voter1', 'voter2', 'voter3'],
        createdAt: '2026-01-26T10:00:00Z'
      };
      const result = formatResults(poll);

      expect(result.id).toBe('123');
      expect(result.question).toBe('Favorite color?');
      expect(result.totalVotes).toBe(10);
      expect(result.voterCount).toBe(3);
      expect(result.createdAt).toBe('2026-01-26T10:00:00Z');
      expect(result.options).toHaveLength(3);
      expect(result.options[0].percentage).toBe(50);
      expect(result.winners).toEqual(['Red']);
      expect(result.isTied).toBe(false);
    });

    it('should handle tied results', () => {
      const poll = {
        id: '123',
        question: 'Test?',
        options: [
          { text: 'A', votes: 5 },
          { text: 'B', votes: 5 }
        ],
        voters: ['v1', 'v2']
      };
      const result = formatResults(poll);

      expect(result.winners).toContain('A');
      expect(result.winners).toContain('B');
      expect(result.isTied).toBe(true);
    });

    it('should handle poll with no options', () => {
      const poll = {
        id: '123',
        question: 'Test?'
      };
      const result = formatResults(poll);

      expect(result.options).toEqual([]);
      expect(result.totalVotes).toBe(0);
      expect(result.winners).toEqual([]);
    });

    it('should handle poll with no voters', () => {
      const poll = {
        id: '123',
        question: 'Test?',
        options: [{ text: 'A', votes: 0 }]
      };
      const result = formatResults(poll);

      expect(result.voterCount).toBe(0);
    });
  });

  describe('calculateStats', () => {
    it('should return null for null/undefined poll', () => {
      expect(calculateStats(null)).toBeNull();
      expect(calculateStats(undefined)).toBeNull();
    });

    it('should return null for poll without options', () => {
      expect(calculateStats({})).toBeNull();
      expect(calculateStats({ options: null })).toBeNull();
    });

    it('should calculate correct statistics', () => {
      const poll = {
        options: [
          { text: 'A', votes: 10 },
          { text: 'B', votes: 5 },
          { text: 'C', votes: 3 }
        ],
        voters: ['v1', 'v2', 'v3']
      };
      const result = calculateStats(poll);

      expect(result.totalVotes).toBe(18);
      expect(result.optionCount).toBe(3);
      expect(result.averageVotesPerOption).toBe(6);
      expect(result.maxVotes).toBe(10);
      expect(result.minVotes).toBe(3);
      expect(result.spread).toBe(7);
      expect(result.participation).toBe(3);
    });

    it('should handle empty options array', () => {
      const poll = { options: [] };
      const result = calculateStats(poll);

      expect(result.totalVotes).toBe(0);
      expect(result.optionCount).toBe(0);
      expect(result.averageVotesPerOption).toBe(0);
      expect(result.maxVotes).toBe(-Infinity);
      expect(result.minVotes).toBe(Infinity);
    });

    it('should handle poll without voters', () => {
      const poll = {
        options: [{ text: 'A', votes: 5 }]
      };
      const result = calculateStats(poll);

      expect(result.participation).toBe(0);
    });

    it('should round average votes to one decimal place', () => {
      const poll = {
        options: [
          { text: 'A', votes: 1 },
          { text: 'B', votes: 2 },
          { text: 'C', votes: 3 }
        ]
      };
      const result = calculateStats(poll);

      expect(result.averageVotesPerOption).toBe(2);
    });

    it('should handle missing votes property in options', () => {
      const poll = {
        options: [
          { text: 'A' },
          { text: 'B', votes: 5 }
        ]
      };
      const result = calculateStats(poll);

      expect(result.totalVotes).toBe(5);
      expect(result.minVotes).toBe(0);
    });
  });

  describe('rankOptions', () => {
    it('should return empty array for non-array input', () => {
      expect(rankOptions(null)).toEqual([]);
      expect(rankOptions(undefined)).toEqual([]);
      expect(rankOptions('string')).toEqual([]);
      expect(rankOptions({})).toEqual([]);
    });

    it('should return empty array for empty array input', () => {
      expect(rankOptions([])).toEqual([]);
    });

    it('should rank options correctly', () => {
      const options = [
        { text: 'A', votes: 5 },
        { text: 'B', votes: 10 },
        { text: 'C', votes: 3 }
      ];
      const result = rankOptions(options);

      expect(result[0].text).toBe('B');
      expect(result[0].rank).toBe(1);
      expect(result[1].text).toBe('A');
      expect(result[1].rank).toBe(2);
      expect(result[2].text).toBe('C');
      expect(result[2].rank).toBe(3);
    });

    it('should handle tied ranks', () => {
      const options = [
        { text: 'A', votes: 10 },
        { text: 'B', votes: 10 },
        { text: 'C', votes: 5 }
      ];
      const result = rankOptions(options);

      expect(result[0].rank).toBe(1);
      expect(result[1].rank).toBe(1);
      expect(result[2].rank).toBe(3);
    });

    it('should not modify original array', () => {
      const options = [
        { text: 'A', votes: 5 },
        { text: 'B', votes: 10 }
      ];
      rankOptions(options);

      expect(options[0].text).toBe('A');
      expect(options[0].rank).toBeUndefined();
    });

    it('should handle missing votes property', () => {
      const options = [
        { text: 'A' },
        { text: 'B', votes: 5 }
      ];
      const result = rankOptions(options);

      expect(result[0].text).toBe('B');
      expect(result[0].rank).toBe(1);
      expect(result[1].text).toBe('A');
      expect(result[1].rank).toBe(2);
    });

    it('should handle all options with same votes', () => {
      const options = [
        { text: 'A', votes: 5 },
        { text: 'B', votes: 5 },
        { text: 'C', votes: 5 }
      ];
      const result = rankOptions(options);

      expect(result[0].rank).toBe(1);
      expect(result[1].rank).toBe(1);
      expect(result[2].rank).toBe(1);
    });

    it('should sort options in descending order by votes', () => {
      const options = [
        { text: 'A', votes: 1 },
        { text: 'B', votes: 10 },
        { text: 'C', votes: 5 },
        { text: 'D', votes: 7 }
      ];
      const result = rankOptions(options);

      expect(result[0].text).toBe('B');
      expect(result[1].text).toBe('D');
      expect(result[2].text).toBe('C');
      expect(result[3].text).toBe('A');
    });

    it('should handle options where a is greater than b in sort', () => {
      const options = [
        { text: 'Z', votes: 100 },
        { text: 'A', votes: 1 }
      ];
      const result = rankOptions(options);

      expect(result[0].text).toBe('Z');
      expect(result[0].rank).toBe(1);
      expect(result[1].text).toBe('A');
      expect(result[1].rank).toBe(2);
    });
  });

  describe('hasReachedQuorum', () => {
    it('should return false for null/undefined poll', () => {
      expect(hasReachedQuorum(null, 5)).toBe(false);
      expect(hasReachedQuorum(undefined, 5)).toBe(false);
    });

    it('should return false for non-number minimumVotes', () => {
      const poll = { options: [{ votes: 10 }] };
      expect(hasReachedQuorum(poll, null)).toBe(false);
      expect(hasReachedQuorum(poll, undefined)).toBe(false);
      expect(hasReachedQuorum(poll, 'five')).toBe(false);
    });

    it('should return true when quorum is reached', () => {
      const poll = {
        options: [
          { text: 'A', votes: 5 },
          { text: 'B', votes: 5 }
        ]
      };
      expect(hasReachedQuorum(poll, 10)).toBe(true);
      expect(hasReachedQuorum(poll, 5)).toBe(true);
    });

    it('should return false when quorum is not reached', () => {
      const poll = {
        options: [
          { text: 'A', votes: 5 },
          { text: 'B', votes: 3 }
        ]
      };
      expect(hasReachedQuorum(poll, 10)).toBe(false);
    });

    it('should handle poll without options', () => {
      const poll = {};
      expect(hasReachedQuorum(poll, 0)).toBe(true);
      expect(hasReachedQuorum(poll, 1)).toBe(false);
    });

    it('should handle missing votes in options', () => {
      const poll = {
        options: [
          { text: 'A' },
          { text: 'B', votes: 5 }
        ]
      };
      expect(hasReachedQuorum(poll, 5)).toBe(true);
      expect(hasReachedQuorum(poll, 6)).toBe(false);
    });
  });

  describe('getVictoryMargin', () => {
    it('should return 0 for non-array input', () => {
      expect(getVictoryMargin(null)).toBe(0);
      expect(getVictoryMargin(undefined)).toBe(0);
      expect(getVictoryMargin('string')).toBe(0);
      expect(getVictoryMargin({})).toBe(0);
    });

    it('should return 0 for empty array', () => {
      expect(getVictoryMargin([])).toBe(0);
    });

    it('should return 0 for single option', () => {
      expect(getVictoryMargin([{ text: 'A', votes: 10 }])).toBe(0);
    });

    it('should calculate correct margin', () => {
      const options = [
        { text: 'A', votes: 10 },
        { text: 'B', votes: 5 }
      ];
      expect(getVictoryMargin(options)).toBe(5);
    });

    it('should return 0 for tied results', () => {
      const options = [
        { text: 'A', votes: 10 },
        { text: 'B', votes: 10 }
      ];
      expect(getVictoryMargin(options)).toBe(0);
    });

    it('should handle multiple options', () => {
      const options = [
        { text: 'A', votes: 3 },
        { text: 'B', votes: 10 },
        { text: 'C', votes: 7 }
      ];
      expect(getVictoryMargin(options)).toBe(3);
    });

    it('should not modify original array', () => {
      const options = [
        { text: 'A', votes: 5 },
        { text: 'B', votes: 10 }
      ];
      getVictoryMargin(options);

      expect(options[0].text).toBe('A');
      expect(options[1].text).toBe('B');
    });

    it('should handle missing votes property', () => {
      const options = [
        { text: 'A' },
        { text: 'B', votes: 5 }
      ];
      expect(getVictoryMargin(options)).toBe(5);
    });

    it('should sort correctly when first option has fewer votes', () => {
      const options = [
        { text: 'A', votes: 2 },
        { text: 'B', votes: 10 }
      ];
      expect(getVictoryMargin(options)).toBe(8);
    });

    it('should handle options with both missing votes', () => {
      const options = [
        { text: 'A' },
        { text: 'B' }
      ];
      expect(getVictoryMargin(options)).toBe(0);
    });
  });
});
