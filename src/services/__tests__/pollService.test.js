const path = require('path');
const fs = require('fs');
const { createPollService } = require('../pollService');
const { createStorageService } = require('../storageService');

const TEST_FILE_PATH = path.join(__dirname, '../../../data/test-poll-service.json');

describe('PollService', () => {
  let pollService;
  let storage;

  beforeEach(() => {
    storage = createStorageService(TEST_FILE_PATH);
    storage.clearAll();
    pollService = createPollService(storage);
  });

  afterAll(() => {
    if (fs.existsSync(TEST_FILE_PATH)) {
      fs.unlinkSync(TEST_FILE_PATH);
    }
  });

  describe('createPoll', () => {
    it('should create a valid poll', () => {
      const result = pollService.createPoll('Favorite color?', ['Red', 'Blue', 'Green']);

      expect(result.success).toBe(true);
      expect(result.poll).toBeDefined();
      expect(result.poll.question).toBe('Favorite color?');
      expect(result.poll.options).toHaveLength(3);
      expect(result.poll.options[0].text).toBe('Red');
      expect(result.poll.options[0].votes).toBe(0);
      expect(result.poll.id).toBeDefined();
      expect(result.poll.voters).toEqual([]);
    });

    it('should reject empty question', () => {
      const result = pollService.createPoll('', ['A', 'B']);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Question is required');
    });

    it('should reject non-string question', () => {
      const result = pollService.createPoll(123, ['A', 'B']);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Question is required');
    });

    it('should reject less than 2 options', () => {
      const result = pollService.createPoll('Question?', ['Only one']);
      expect(result.success).toBe(false);
      expect(result.error).toBe('At least 2 options are required');
    });

    it('should reject more than 10 options', () => {
      const options = Array.from({ length: 11 }, (_, i) => `Option ${i + 1}`);
      const result = pollService.createPoll('Question?', options);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Maximum 10 options allowed');
    });

    it('should reject duplicate options', () => {
      const result = pollService.createPoll('Question?', ['Same', 'same', 'Different']);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Duplicate options are not allowed');
    });

    it('should trim whitespace from question and options', () => {
      const result = pollService.createPoll('  Question?  ', ['  Red  ', '  Blue  ']);
      expect(result.poll.question).toBe('Question?');
      expect(result.poll.options[0].text).toBe('Red');
    });
  });

  describe('getAllPolls', () => {
    it('should return empty array when no polls exist', () => {
      const polls = pollService.getAllPolls();
      expect(polls).toEqual([]);
    });

    it('should return all created polls', () => {
      pollService.createPoll('Poll 1?', ['A', 'B']);
      pollService.createPoll('Poll 2?', ['X', 'Y']);

      const polls = pollService.getAllPolls();
      expect(polls).toHaveLength(2);
    });
  });

  describe('getPoll', () => {
    it('should return formatted poll results', () => {
      const { poll } = pollService.createPoll('Test?', ['Yes', 'No']);
      const result = pollService.getPoll(poll.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(poll.id);
      expect(result.question).toBe('Test?');
      expect(result.totalVotes).toBe(0);
      expect(result.options[0].percentage).toBe(0);
    });

    it('should return null for non-existent poll', () => {
      const result = pollService.getPoll('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('vote', () => {
    it('should successfully cast a vote', () => {
      const { poll } = pollService.createPoll('Vote test?', ['A', 'B']);
      const result = pollService.vote(poll.id, 0, 'voter-1');

      expect(result.success).toBe(true);
      expect(result.poll.totalVotes).toBe(1);
      expect(result.poll.options[0].votes).toBe(1);
      expect(result.poll.options[0].percentage).toBe(100);
    });

    it('should prevent duplicate voting', () => {
      const { poll } = pollService.createPoll('Vote test?', ['A', 'B']);
      pollService.vote(poll.id, 0, 'voter-1');

      const result = pollService.vote(poll.id, 1, 'voter-1');
      expect(result.success).toBe(false);
      expect(result.error).toBe('You have already voted on this poll');
    });

    it('should allow different voters to vote', () => {
      const { poll } = pollService.createPoll('Vote test?', ['A', 'B']);
      pollService.vote(poll.id, 0, 'voter-1');
      pollService.vote(poll.id, 1, 'voter-2');

      const result = pollService.getPoll(poll.id);
      expect(result.totalVotes).toBe(2);
    });

    it('should reject invalid option index', () => {
      const { poll } = pollService.createPoll('Vote test?', ['A', 'B']);
      const result = pollService.vote(poll.id, 5, 'voter-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Option does not exist');
    });

    it('should reject vote on non-existent poll', () => {
      const result = pollService.vote('fake-id', 0, 'voter-1');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Poll not found');
    });

    it('should reject vote without voter ID', () => {
      const { poll } = pollService.createPoll('Vote test?', ['A', 'B']);
      const result = pollService.vote(poll.id, 0, '');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Voter ID is required');
    });
  });

  describe('deletePoll', () => {
    it('should delete an existing poll', () => {
      const { poll } = pollService.createPoll('Delete me?', ['Yes', 'No']);
      const result = pollService.deletePoll(poll.id);

      expect(result).toBe(true);
      expect(pollService.getPoll(poll.id)).toBeNull();
    });

    it('should return false for non-existent poll', () => {
      const result = pollService.deletePoll('fake-id');
      expect(result).toBe(false);
    });
  });
});
