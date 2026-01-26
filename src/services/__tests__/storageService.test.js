const fs = require('fs');
const path = require('path');
const { createStorageService } = require('../storageService');

const TEST_FILE_PATH = path.join(__dirname, '../../../data/test-polls.json');

describe('StorageService', () => {
  let storage;

  beforeEach(() => {
    storage = createStorageService(TEST_FILE_PATH);
    storage.clearAll();
  });

  afterAll(() => {
    if (fs.existsSync(TEST_FILE_PATH)) {
      fs.unlinkSync(TEST_FILE_PATH);
    }
  });

  describe('readData / writeData', () => {
    it('should read and write data correctly', () => {
      const testData = { polls: [{ id: '1', question: 'Test?' }] };
      storage.writeData(testData);
      const result = storage.readData();
      expect(result).toEqual(testData);
    });

    it('should create file if it does not exist', () => {
      const newPath = path.join(__dirname, '../../../data/new-test.json');
      const newStorage = createStorageService(newPath);
      const data = newStorage.readData();
      expect(data).toEqual({ polls: [] });
      fs.unlinkSync(newPath);
    });
  });

  describe('getAllPolls', () => {
    it('should return empty array when no polls exist', () => {
      const polls = storage.getAllPolls();
      expect(polls).toEqual([]);
    });

    it('should return all polls', () => {
      const poll1 = { id: '1', question: 'Poll 1' };
      const poll2 = { id: '2', question: 'Poll 2' };
      storage.savePoll(poll1);
      storage.savePoll(poll2);

      const polls = storage.getAllPolls();
      expect(polls).toHaveLength(2);
      expect(polls[0].question).toBe('Poll 1');
      expect(polls[1].question).toBe('Poll 2');
    });
  });

  describe('getPollById', () => {
    it('should return poll when found', () => {
      const poll = { id: 'abc123', question: 'Found me?' };
      storage.savePoll(poll);

      const result = storage.getPollById('abc123');
      expect(result).toEqual(poll);
    });

    it('should return null when poll not found', () => {
      const result = storage.getPollById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('savePoll', () => {
    it('should save a new poll', () => {
      const poll = {
        id: 'new-poll',
        question: 'Is this saved?',
        options: [{ text: 'Yes', votes: 0 }]
      };

      const result = storage.savePoll(poll);
      expect(result).toEqual(poll);

      const retrieved = storage.getPollById('new-poll');
      expect(retrieved).toEqual(poll);
    });
  });

  describe('updatePoll', () => {
    it('should update an existing poll', () => {
      const poll = { id: 'update-me', question: 'Original', votes: 0 };
      storage.savePoll(poll);

      const updated = storage.updatePoll('update-me', { votes: 5 });
      expect(updated.votes).toBe(5);
      expect(updated.question).toBe('Original');
    });

    it('should return null when poll not found', () => {
      const result = storage.updatePoll('nonexistent', { votes: 10 });
      expect(result).toBeNull();
    });
  });

  describe('deletePoll', () => {
    it('should delete an existing poll', () => {
      storage.savePoll({ id: 'delete-me', question: 'Gone soon' });

      const result = storage.deletePoll('delete-me');
      expect(result).toBe(true);

      const poll = storage.getPollById('delete-me');
      expect(poll).toBeNull();
    });

    it('should return false when poll not found', () => {
      const result = storage.deletePoll('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('clearAll', () => {
    it('should remove all polls', () => {
      storage.savePoll({ id: '1', question: 'Q1' });
      storage.savePoll({ id: '2', question: 'Q2' });

      storage.clearAll();
      const polls = storage.getAllPolls();
      expect(polls).toEqual([]);
    });
  });
});
