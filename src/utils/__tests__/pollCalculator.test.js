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
    it('should calculate correct percentages for options', () => {
      const options = [
        { text: 'A', votes: 50 },
        { text: 'B', votes: 30 },
        { text: 'C', votes: 20 }
      ];

      const result = calculatePercentages(options);

      expect(result[0].percentage).toBe(50);
      expect(result[1].percentage).toBe(30);
      expect(result[2].percentage).toBe(20);
    });

    it('should return empty array for non-array input', () => {
      expect(calculatePercentages(null)).toEqual([]);
      expect(calculatePercentages(undefined)).toEqual([]);
      expect(calculatePercentages('string')).toEqual([]);
      expect(calculatePercentages(123)).toEqual([]);
    });

    it('should return empty array for empty array', () => {
      expect(calculatePercentages([])).toEqual([]);
    });

    it('should return 0% for all options when no votes', () => {
      const options = [
        { text: 'A', votes: 0 },
        { text: 'B', votes: 0 }
      ];

      const result = calculatePercentages(options);

      expect(result[0].percentage).toBe(0);
      expect(result[1].percentage).toBe(0);
    });

    it('should handle options without votes property', () => {
      const options = [
        { text: 'A' },
        { text: 'B', votes: 10 }
      ];

      const result = calculatePercentages(options);

      expect(result[0].percentage).toBe(0);
      expect(result[1].percentage).toBe(100);
    });

    it('should round percentages to nearest integer', () => {
      const options = [
        { text: 'A', votes: 1 },
        { text: 'B', votes: 2 }
      ];

      const result = calculatePercentages(options);

      expect(result[0].percentage).toBe(33); // 33.33% rounds to 33
      expect(result[1].percentage).toBe(67); // 66.66% rounds to 67
    });

    it('should preserve original option properties', () => {
      const options = [
        { text: 'A', votes: 5, customProp: 'test' }
      ];

      const result = calculatePercentages(options);

      expect(result[0].text).toBe('A');
      expect(result[0].votes).toBe(5);
      expect(result[0].customProp).toBe('test');
      expect(result[0].percentage).toBe(100);
    });
  });

  describe('determineWinner', () => {
    it('should return the option with most votes', () => {
      const options = [
        { text: 'A', votes: 10 },
        { text: 'B', votes: 20 },
        { text: 'C', votes: 5 }
      ];

      const result = determineWinner(options);

      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('B');
    });

    it('should return multiple winners when tied', () => {
      const options = [
        { text: 'A', votes: 20 },
        { text: 'B', votes: 20 },
        { text: 'C', votes: 5 }
      ];

      const result = determineWinner(options);

      expect(result).toHaveLength(2);
      expect(result.map(w => w.text)).toContain('A');
      expect(result.map(w => w.text)).toContain('B');
    });

    it('should return empty array for non-array input', () => {
      expect(determineWinner(null)).toEqual([]);
      expect(determineWinner(undefined)).toEqual([]);
      expect(determineWinner('string')).toEqual([]);
    });

    it('should return empty array for empty array', () => {
      expect(determineWinner([])).toEqual([]);
    });

    it('should return empty array when all votes are 0', () => {
      const options = [
        { text: 'A', votes: 0 },
        { text: 'B', votes: 0 }
      ];

      expect(determineWinner(options)).toEqual([]);
    });

    it('should handle options without votes property (treated as 0)', () => {
      const options = [
        { text: 'A' },
        { text: 'B', votes: 5 }
      ];

      const result = determineWinner(options);

      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('B');
    });
  });

  describe('hasVoterVoted', () => {
    it('should return true if voter has voted', () => {
      const poll = {
        voters: ['voter1', 'voter2', 'voter3']
      };

      expect(hasVoterVoted(poll, 'voter2')).toBe(true);
    });

    it('should return false if voter has not voted', () => {
      const poll = {
        voters: ['voter1', 'voter2']
      };

      expect(hasVoterVoted(poll, 'voter3')).toBe(false);
    });

    it('should return false if poll is null or undefined', () => {
      expect(hasVoterVoted(null, 'voter1')).toBe(false);
      expect(hasVoterVoted(undefined, 'voter1')).toBe(false);
    });

    it('should return false if voterId is null or undefined', () => {
      const poll = { voters: ['voter1'] };

      expect(hasVoterVoted(poll, null)).toBe(false);
      expect(hasVoterVoted(poll, undefined)).toBe(false);
      expect(hasVoterVoted(poll, '')).toBe(false);
    });

    it('should return false if poll.voters is not an array', () => {
      expect(hasVoterVoted({ voters: null }, 'voter1')).toBe(false);
      expect(hasVoterVoted({ voters: 'string' }, 'voter1')).toBe(false);
      expect(hasVoterVoted({}, 'voter1')).toBe(false);
    });
  });

  describe('validateVote', () => {
    const validPoll = {
      id: 'poll1',
      options: [
        { text: 'A', votes: 0 },
        { text: 'B', votes: 0 }
      ],
      voters: []
    };

    it('should return valid for valid vote', () => {
      const result = validateVote(validPoll, 0, 'voter1');

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid if poll is null', () => {
      const result = validateVote(null, 0, 'voter1');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Poll not found');
    });

    it('should return invalid if voterId is missing', () => {
      expect(validateVote(validPoll, 0, null).error).toBe('Voter ID is required');
      expect(validateVote(validPoll, 0, undefined).error).toBe('Voter ID is required');
      expect(validateVote(validPoll, 0, '').error).toBe('Voter ID is required');
    });

    it('should return invalid if voterId is not a string', () => {
      expect(validateVote(validPoll, 0, 123).error).toBe('Voter ID is required');
      expect(validateVote(validPoll, 0, {}).error).toBe('Voter ID is required');
    });

    it('should return invalid if optionIndex is not a number', () => {
      expect(validateVote(validPoll, 'a', 'voter1').error).toBe('Invalid option index');
      expect(validateVote(validPoll, null, 'voter1').error).toBe('Invalid option index');
    });

    it('should return invalid if optionIndex is negative', () => {
      const result = validateVote(validPoll, -1, 'voter1');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid option index');
    });

    it('should return invalid if option does not exist', () => {
      const result = validateVote(validPoll, 5, 'voter1');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Option does not exist');
    });

    it('should return invalid if poll.options is missing', () => {
      const pollNoOptions = { id: 'poll1', voters: [] };
      const result = validateVote(pollNoOptions, 0, 'voter1');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Option does not exist');
    });

    it('should return invalid if voter has already voted', () => {
      const pollWithVoter = {
        ...validPoll,
        voters: ['voter1']
      };

      const result = validateVote(pollWithVoter, 0, 'voter1');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('You have already voted on this poll');
    });
  });

  describe('formatResults', () => {
    it('should format poll results correctly', () => {
      const poll = {
        id: 'poll1',
        question: 'Test question?',
        options: [
          { text: 'A', votes: 10 },
          { text: 'B', votes: 5 }
        ],
        voters: ['voter1', 'voter2'],
        createdAt: '2026-01-01'
      };

      const result = formatResults(poll);

      expect(result.id).toBe('poll1');
      expect(result.question).toBe('Test question?');
      expect(result.totalVotes).toBe(15);
      expect(result.voterCount).toBe(2);
      expect(result.winners).toEqual(['A']);
      expect(result.isTied).toBe(false);
      expect(result.createdAt).toBe('2026-01-01');
      expect(result.options[0].percentage).toBe(67);
      expect(result.options[1].percentage).toBe(33);
    });

    it('should return null for null poll', () => {
      expect(formatResults(null)).toBeNull();
      expect(formatResults(undefined)).toBeNull();
    });

    it('should handle poll without options', () => {
      const poll = {
        id: 'poll1',
        question: 'Test?'
      };

      const result = formatResults(poll);

      expect(result.options).toEqual([]);
      expect(result.totalVotes).toBe(0);
      expect(result.winners).toEqual([]);
    });

    it('should handle poll without voters', () => {
      const poll = {
        id: 'poll1',
        question: 'Test?',
        options: [{ text: 'A', votes: 1 }]
      };

      const result = formatResults(poll);

      expect(result.voterCount).toBe(0);
    });

    it('should indicate tied results', () => {
      const poll = {
        id: 'poll1',
        question: 'Test?',
        options: [
          { text: 'A', votes: 10 },
          { text: 'B', votes: 10 }
        ],
        voters: []
      };

      const result = formatResults(poll);

      expect(result.isTied).toBe(true);
      expect(result.winners).toHaveLength(2);
    });
  });

  describe('calculateStats', () => {
    it('should calculate stats correctly', () => {
      const poll = {
        options: [
          { text: 'A', votes: 10 },
          { text: 'B', votes: 20 },
          { text: 'C', votes: 30 }
        ],
        voters: ['v1', 'v2', 'v3']
      };

      const result = calculateStats(poll);

      expect(result.totalVotes).toBe(60);
      expect(result.optionCount).toBe(3);
      expect(result.averageVotesPerOption).toBe(20);
      expect(result.maxVotes).toBe(30);
      expect(result.minVotes).toBe(10);
      expect(result.spread).toBe(20);
      expect(result.participation).toBe(3);
    });

    it('should return null for null or undefined poll', () => {
      expect(calculateStats(null)).toBeNull();
      expect(calculateStats(undefined)).toBeNull();
    });

    it('should return null for poll without options', () => {
      expect(calculateStats({})).toBeNull();
      expect(calculateStats({ question: 'Test?' })).toBeNull();
    });

    it('should handle options without votes property', () => {
      const poll = {
        options: [
          { text: 'A' },
          { text: 'B', votes: 10 }
        ]
      };

      const result = calculateStats(poll);

      expect(result.totalVotes).toBe(10);
      expect(result.minVotes).toBe(0);
    });

    it('should handle poll without voters', () => {
      const poll = {
        options: [{ text: 'A', votes: 5 }]
      };

      const result = calculateStats(poll);

      expect(result.participation).toBe(0);
    });

    it('should round averageVotesPerOption to one decimal place', () => {
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

    it('should handle empty options array', () => {
      const poll = { options: [] };

      const result = calculateStats(poll);

      expect(result.totalVotes).toBe(0);
      expect(result.optionCount).toBe(0);
      expect(result.averageVotesPerOption).toBe(0);
    });
  });

  describe('rankOptions', () => {
    it('should rank options by votes', () => {
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

    it('should return empty array for non-array input', () => {
      expect(rankOptions(null)).toEqual([]);
      expect(rankOptions(undefined)).toEqual([]);
      expect(rankOptions('string')).toEqual([]);
    });

    it('should return empty array for empty array', () => {
      expect(rankOptions([])).toEqual([]);
    });

    it('should handle options without votes property', () => {
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
        { text: 'A', votes: 5, customProp: 'test' }
      ];

      const result = rankOptions(options);

      expect(result[0].customProp).toBe('test');
    });

    it('should handle single option', () => {
      const options = [{ text: 'A', votes: 10 }];

      const result = rankOptions(options);

      expect(result).toHaveLength(1);
      expect(result[0].rank).toBe(1);
    });

    it('should handle all options with same votes (all tied)', () => {
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

    it('should handle options with undefined votes consistently', () => {
      const options = [
        { text: 'A' },
        { text: 'B' },
        { text: 'C', votes: 5 }
      ];

      const result = rankOptions(options);

      // C with 5 votes should be first
      expect(result[0].text).toBe('C');
      expect(result[0].rank).toBe(1);
      // A and B without votes (undefined) should be tied
      expect(result[1].rank).toBe(2);
      expect(result[2].rank).toBe(2);
      // check for NaN handling
        expect(isNaN(result[1].votes)).toBe(true);
        expect(isNaN(result[2].votes)).toBe(true);
    });
  });

  describe('hasReachedQuorum', () => {
    it('should return true when votes meet minimum', () => {
      const poll = {
        options: [
          { text: 'A', votes: 10 },
          { text: 'B', votes: 10 }
        ]
      };

      expect(hasReachedQuorum(poll, 20)).toBe(true);
      expect(hasReachedQuorum(poll, 15)).toBe(true);
    });

    it('should return false when votes below minimum', () => {
      const poll = {
        options: [
          { text: 'A', votes: 5 },
          { text: 'B', votes: 5 }
        ]
      };

      expect(hasReachedQuorum(poll, 20)).toBe(false);
    });

    it('should return false for null or undefined poll', () => {
      expect(hasReachedQuorum(null, 10)).toBe(false);
      expect(hasReachedQuorum(undefined, 10)).toBe(false);
    });

    it('should return false for invalid minimumVotes', () => {
      const poll = { options: [{ votes: 10 }] };

      expect(hasReachedQuorum(poll, null)).toBe(false);
      expect(hasReachedQuorum(poll, undefined)).toBe(false);
      expect(hasReachedQuorum(poll, 'ten')).toBe(false);
    });

    it('should handle poll without options', () => {
      const poll = {};

      expect(hasReachedQuorum(poll, 0)).toBe(true);
      expect(hasReachedQuorum(poll, 1)).toBe(false);
    });

    it('should handle options without votes property', () => {
      const poll = {
        options: [{ text: 'A' }]
      };

      expect(hasReachedQuorum(poll, 0)).toBe(true);
      expect(hasReachedQuorum(poll, 1)).toBe(false);
    });
  });

  describe('getVictoryMargin', () => {
    it('should return correct margin between 1st and 2nd place', () => {
      const options = [
        { text: 'A', votes: 30 },
        { text: 'B', votes: 20 },
        { text: 'C', votes: 10 }
      ];

      expect(getVictoryMargin(options)).toBe(10);
    });

    it('should return 0 for tied first place', () => {
      const options = [
        { text: 'A', votes: 20 },
        { text: 'B', votes: 20 }
      ];

      expect(getVictoryMargin(options)).toBe(0);
    });

    it('should return 0 for less than 2 options', () => {
      expect(getVictoryMargin([])).toBe(0);
      expect(getVictoryMargin([{ text: 'A', votes: 10 }])).toBe(0);
    });

    it('should return 0 for non-array input', () => {
      expect(getVictoryMargin(null)).toBe(0);
      expect(getVictoryMargin(undefined)).toBe(0);
      expect(getVictoryMargin('string')).toBe(0);
    });

    it('should handle options without votes property', () => {
      const options = [
        { text: 'A', votes: 10 },
        { text: 'B' }
      ];

      expect(getVictoryMargin(options)).toBe(10);
    });

    it('should correctly sort and find margin', () => {
      const options = [
        { text: 'A', votes: 5 },
        { text: 'B', votes: 15 },
        { text: 'C', votes: 10 }
      ];

      // B (15) - C (10) = 5
      expect(getVictoryMargin(options)).toBe(5);
    });

    it('should handle both options without votes property', () => {
      const options = [
        { text: 'A' },
        { text: 'B' }
      ];

      expect(getVictoryMargin(options)).toBe(0);
    });

    it('should handle first option without votes property', () => {
      const options = [
        { text: 'A' },
        { text: 'B', votes: 10 }
      ];

      // B has 10 votes, A has 0 (default). B is first, A is second.
      // 10 - 0 = 10
      expect(getVictoryMargin(options)).toBe(10);
    });

    it('should handle second option without votes property', () => {
      const options = [
        { text: 'A', votes: 10 },
        { text: 'B' }
      ];

      // A has 10 votes, B has 0 (default). A is first, B is second.
      // 10 - 0 = 10
      expect(getVictoryMargin(options)).toBe(10);
    });
  });
});
