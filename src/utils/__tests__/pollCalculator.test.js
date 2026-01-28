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

describe('PollCalculator', () => {
  describe('calculatePercentages', () => {
    it('should return empty array for non-array input', () => {
      expect(calculatePercentages(null)).toEqual([]);
      expect(calculatePercentages(undefined)).toEqual([]);
      expect(calculatePercentages('string')).toEqual([]);
      expect(calculatePercentages(123)).toEqual([]);
      expect(calculatePercentages({})).toEqual([]);
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

    it('should return 0 percentage when total votes is 0', () => {
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
        { text: 'Option B', votes: 10 }
      ];
      const result = calculatePercentages(options);

      expect(result[0].percentage).toBe(0);
      expect(result[1].percentage).toBe(100);
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
        { text: 'Option A', votes: 5, customProp: 'test' }
      ];
      const result = calculatePercentages(options);

      expect(result[0].text).toBe('Option A');
      expect(result[0].votes).toBe(5);
      expect(result[0].customProp).toBe('test');
      expect(result[0].percentage).toBe(100);
    });
  });

  describe('determineWinner', () => {
    it('should return empty array for non-array input', () => {
      expect(determineWinner(null)).toEqual([]);
      expect(determineWinner(undefined)).toEqual([]);
      expect(determineWinner('string')).toEqual([]);
      expect(determineWinner({})).toEqual([]);
    });

    it('should return empty array for empty array input', () => {
      expect(determineWinner([])).toEqual([]);
    });

    it('should return empty array when all options have 0 votes', () => {
      const options = [
        { text: 'Option A', votes: 0 },
        { text: 'Option B', votes: 0 }
      ];
      expect(determineWinner(options)).toEqual([]);
    });

    it('should return single winner', () => {
      const options = [
        { text: 'Option A', votes: 10 },
        { text: 'Option B', votes: 5 },
        { text: 'Option C', votes: 3 }
      ];
      const result = determineWinner(options);

      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Option A');
    });

    it('should return multiple winners on tie', () => {
      const options = [
        { text: 'Option A', votes: 10 },
        { text: 'Option B', votes: 10 },
        { text: 'Option C', votes: 5 }
      ];
      const result = determineWinner(options);

      expect(result).toHaveLength(2);
      expect(result.map(w => w.text)).toContain('Option A');
      expect(result.map(w => w.text)).toContain('Option B');
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
    it('should return false for null poll', () => {
      expect(hasVoterVoted(null, 'voter1')).toBe(false);
    });

    it('should return false for undefined poll', () => {
      expect(hasVoterVoted(undefined, 'voter1')).toBe(false);
    });

    it('should return false for null/undefined voterId', () => {
      const poll = { voters: ['voter1'] };
      expect(hasVoterVoted(poll, null)).toBe(false);
      expect(hasVoterVoted(poll, undefined)).toBe(false);
    });

    it('should return false for empty voterId', () => {
      const poll = { voters: ['voter1'] };
      expect(hasVoterVoted(poll, '')).toBe(false);
    });

    it('should return false when poll has no voters array', () => {
      const poll = { question: 'Test?' };
      expect(hasVoterVoted(poll, 'voter1')).toBe(false);
    });

    it('should return false when voters is not an array', () => {
      const poll = { voters: 'not-an-array' };
      expect(hasVoterVoted(poll, 'voter1')).toBe(false);
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

    it('should return error for null poll', () => {
      const result = validateVote(null, 0, 'voter1');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Poll not found');
    });

    it('should return error for undefined poll', () => {
      const result = validateVote(undefined, 0, 'voter1');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Poll not found');
    });

    it('should return error for null voterId', () => {
      const result = validateVote(validPoll, 0, null);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Voter ID is required');
    });

    it('should return error for undefined voterId', () => {
      const result = validateVote(validPoll, 0, undefined);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Voter ID is required');
    });

    it('should return error for non-string voterId', () => {
      const result = validateVote(validPoll, 0, 123);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Voter ID is required');
    });

    it('should return error for negative option index', () => {
      const result = validateVote(validPoll, -1, 'voter1');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid option index');
    });

    it('should return error for non-number option index', () => {
      const result = validateVote(validPoll, 'string', 'voter1');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid option index');
    });

    it('should return error for option index out of bounds', () => {
      const result = validateVote(validPoll, 5, 'voter1');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Option does not exist');
    });

    it('should return error when poll has no options', () => {
      const pollWithoutOptions = { ...validPoll, options: undefined };
      const result = validateVote(pollWithoutOptions, 0, 'voter1');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Option does not exist');
    });

    it('should return error when voter has already voted', () => {
      const pollWithVoter = { ...validPoll, voters: ['voter1'] };
      const result = validateVote(pollWithVoter, 0, 'voter1');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('You have already voted on this poll');
    });

    it('should return valid for a valid vote', () => {
      const result = validateVote(validPoll, 0, 'voter1');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return valid for last option index', () => {
      const result = validateVote(validPoll, 1, 'voter1');
      expect(result.valid).toBe(true);
    });
  });

  describe('formatResults', () => {
    it('should return null for null poll', () => {
      expect(formatResults(null)).toBeNull();
    });

    it('should return null for undefined poll', () => {
      expect(formatResults(undefined)).toBeNull();
    });

    it('should format poll results correctly', () => {
      const poll = {
        id: '123',
        question: 'Favorite color?',
        options: [
          { text: 'Red', votes: 5 },
          { text: 'Blue', votes: 10 },
          { text: 'Green', votes: 5 }
        ],
        voters: ['voter1', 'voter2', 'voter3'],
        createdAt: '2026-01-28T12:00:00Z'
      };

      const result = formatResults(poll);

      expect(result.id).toBe('123');
      expect(result.question).toBe('Favorite color?');
      expect(result.options).toHaveLength(3);
      expect(result.options[1].percentage).toBe(50);
      expect(result.totalVotes).toBe(20);
      expect(result.winners).toEqual(['Blue']);
      expect(result.voterCount).toBe(3);
      expect(result.createdAt).toBe('2026-01-28T12:00:00Z');
      expect(result.isTied).toBe(false);
    });

    it('should indicate tie when there are multiple winners', () => {
      const poll = {
        id: '123',
        question: 'Test?',
        options: [
          { text: 'A', votes: 10 },
          { text: 'B', votes: 10 }
        ],
        voters: []
      };

      const result = formatResults(poll);

      expect(result.isTied).toBe(true);
      expect(result.winners).toEqual(['A', 'B']);
    });

    it('should handle poll with no options', () => {
      const poll = {
        id: '123',
        question: 'Test?',
        voters: []
      };

      const result = formatResults(poll);

      expect(result.options).toEqual([]);
      expect(result.totalVotes).toBe(0);
      expect(result.winners).toEqual([]);
    });

    it('should handle poll with no voters array', () => {
      const poll = {
        id: '123',
        question: 'Test?',
        options: [{ text: 'A', votes: 5 }]
      };

      const result = formatResults(poll);

      expect(result.voterCount).toBe(0);
    });
  });

  describe('calculateStats', () => {
    it('should return null for null poll', () => {
      expect(calculateStats(null)).toBeNull();
    });

    it('should return null for undefined poll', () => {
      expect(calculateStats(undefined)).toBeNull();
    });

    it('should return null for poll without options', () => {
      expect(calculateStats({ id: '123' })).toBeNull();
    });

    it('should calculate stats correctly', () => {
      const poll = {
        options: [
          { text: 'A', votes: 10 },
          { text: 'B', votes: 20 },
          { text: 'C', votes: 30 }
        ],
        voters: ['v1', 'v2', 'v3', 'v4']
      };

      const result = calculateStats(poll);

      expect(result.totalVotes).toBe(60);
      expect(result.optionCount).toBe(3);
      expect(result.averageVotesPerOption).toBe(20);
      expect(result.maxVotes).toBe(30);
      expect(result.minVotes).toBe(10);
      expect(result.spread).toBe(20);
      expect(result.participation).toBe(4);
    });

    it('should handle poll with no voters array', () => {
      const poll = {
        options: [{ text: 'A', votes: 5 }]
      };

      const result = calculateStats(poll);

      expect(result.participation).toBe(0);
    });

    it('should handle poll with zero votes', () => {
      const poll = {
        options: [
          { text: 'A', votes: 0 },
          { text: 'B', votes: 0 }
        ],
        voters: []
      };

      const result = calculateStats(poll);

      expect(result.totalVotes).toBe(0);
      expect(result.averageVotesPerOption).toBe(0);
      expect(result.maxVotes).toBe(0);
      expect(result.minVotes).toBe(0);
      expect(result.spread).toBe(0);
    });

    it('should round averageVotesPerOption to one decimal place', () => {
      const poll = {
        options: [
          { text: 'A', votes: 1 },
          { text: 'B', votes: 2 },
          { text: 'C', votes: 3 }
        ],
        voters: []
      };

      const result = calculateStats(poll);

      expect(result.averageVotesPerOption).toBe(2);
    });

    it('should handle missing votes property in options', () => {
      const poll = {
        options: [
          { text: 'A' },
          { text: 'B', votes: 10 }
        ],
        voters: []
      };

      const result = calculateStats(poll);

      expect(result.totalVotes).toBe(10);
      expect(result.minVotes).toBe(0);
    });

    it('should handle empty options array', () => {
      const poll = {
        options: [],
        voters: []
      };

      const result = calculateStats(poll);

      expect(result.totalVotes).toBe(0);
      expect(result.optionCount).toBe(0);
      expect(result.averageVotesPerOption).toBe(0);
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

    it('should rank options by vote count', () => {
      const options = [
        { text: 'A', votes: 5 },
        { text: 'B', votes: 20 },
        { text: 'C', votes: 10 }
      ];

      const result = rankOptions(options);

      expect(result[0].text).toBe('B');
      expect(result[0].rank).toBe(1);
      expect(result[1].text).toBe('C');
      expect(result[1].rank).toBe(2);
      expect(result[2].text).toBe('A');
      expect(result[2].rank).toBe(3);
    });

    it('should handle ties with same rank', () => {
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

    it('should handle all options with same votes', () => {
      const options = [
        { text: 'A', votes: 10 },
        { text: 'B', votes: 10 },
        { text: 'C', votes: 10 }
      ];

      const result = rankOptions(options);

      expect(result[0].rank).toBe(1);
      expect(result[1].rank).toBe(1);
      expect(result[2].rank).toBe(1);
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

    it('should preserve original option properties', () => {
      const options = [
        { text: 'A', votes: 10, customProp: 'test' }
      ];

      const result = rankOptions(options);

      expect(result[0].customProp).toBe('test');
      expect(result[0].rank).toBe(1);
    });

    it('should not mutate original array', () => {
      const options = [
        { text: 'A', votes: 5 },
        { text: 'B', votes: 10 }
      ];
      const originalFirst = options[0].text;

      rankOptions(options);

      expect(options[0].text).toBe(originalFirst);
    });
  });

  describe('hasReachedQuorum', () => {
    it('should return false for null poll', () => {
      expect(hasReachedQuorum(null, 10)).toBe(false);
    });

    it('should return false for undefined poll', () => {
      expect(hasReachedQuorum(undefined, 10)).toBe(false);
    });

    it('should return false for non-number minimumVotes', () => {
      const poll = { options: [{ votes: 10 }] };
      expect(hasReachedQuorum(poll, 'ten')).toBe(false);
      expect(hasReachedQuorum(poll, null)).toBe(false);
      expect(hasReachedQuorum(poll, undefined)).toBe(false);
    });

    it('should return true when total votes equals minimum', () => {
      const poll = {
        options: [
          { text: 'A', votes: 5 },
          { text: 'B', votes: 5 }
        ]
      };
      expect(hasReachedQuorum(poll, 10)).toBe(true);
    });

    it('should return true when total votes exceeds minimum', () => {
      const poll = {
        options: [
          { text: 'A', votes: 10 },
          { text: 'B', votes: 10 }
        ]
      };
      expect(hasReachedQuorum(poll, 10)).toBe(true);
    });

    it('should return false when total votes is below minimum', () => {
      const poll = {
        options: [
          { text: 'A', votes: 3 },
          { text: 'B', votes: 2 }
        ]
      };
      expect(hasReachedQuorum(poll, 10)).toBe(false);
    });

    it('should handle poll with no options', () => {
      const poll = {};
      expect(hasReachedQuorum(poll, 0)).toBe(true);
      expect(hasReachedQuorum(poll, 1)).toBe(false);
    });

    it('should handle missing votes property in options', () => {
      const poll = {
        options: [
          { text: 'A' },
          { text: 'B', votes: 5 }
        ]
      };
      expect(hasReachedQuorum(poll, 5)).toBe(true);
      expect(hasReachedQuorum(poll, 6)).toBe(false);
    });

    it('should handle zero as minimum votes', () => {
      const poll = { options: [] };
      expect(hasReachedQuorum(poll, 0)).toBe(true);
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
      const options = [{ text: 'A', votes: 10 }];
      expect(getVictoryMargin(options)).toBe(0);
    });

    it('should calculate margin between first and second place', () => {
      const options = [
        { text: 'A', votes: 30 },
        { text: 'B', votes: 20 },
        { text: 'C', votes: 10 }
      ];
      expect(getVictoryMargin(options)).toBe(10);
    });

    it('should return 0 for tie between first and second', () => {
      const options = [
        { text: 'A', votes: 20 },
        { text: 'B', votes: 20 }
      ];
      expect(getVictoryMargin(options)).toBe(0);
    });

    it('should handle missing votes property', () => {
      const options = [
        { text: 'A' },
        { text: 'B', votes: 10 }
      ];
      expect(getVictoryMargin(options)).toBe(10);
    });

    it('should not mutate original array', () => {
      const options = [
        { text: 'A', votes: 5 },
        { text: 'B', votes: 10 }
      ];
      const originalFirst = options[0].text;

      getVictoryMargin(options);

      expect(options[0].text).toBe(originalFirst);
    });

    it('should handle options not in sorted order', () => {
      const options = [
        { text: 'A', votes: 5 },
        { text: 'B', votes: 15 },
        { text: 'C', votes: 10 }
      ];
      expect(getVictoryMargin(options)).toBe(5);
    });

    it('should handle when both options have undefined votes', () => {
      const options = [
        { text: 'A' },
        { text: 'B' }
      ];
      expect(getVictoryMargin(options)).toBe(0);
    });
  });
});
