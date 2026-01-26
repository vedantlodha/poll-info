const fs = require('fs');
const path = require('path');

const DEFAULT_DATA_PATH = path.join(__dirname, '../../data/polls.json');

/**
 * Creates a storage service for JSON file persistence
 * @param {string} filePath - Path to the JSON file
 * @returns {Object} Storage service methods
 */
function createStorageService(filePath = DEFAULT_DATA_PATH) {
  /**
   * Ensures the data directory and file exist
   */
  function ensureFileExists() {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({ polls: [] }, null, 2));
    }
  }

  /**
   * Reads all data from the JSON file
   * @returns {Object} The parsed data
   */
  function readData() {
    ensureFileExists();
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Writes data to the JSON file
   * @param {Object} data - The data to write
   */
  function writeData(data) {
    ensureFileExists();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  /**
   * Gets all polls from storage
   * @returns {Array} Array of polls
   */
  function getAllPolls() {
    const data = readData();
    return data.polls || [];
  }

  /**
   * Gets a single poll by ID
   * @param {string} id - The poll ID
   * @returns {Object|null} The poll or null if not found
   */
  function getPollById(id) {
    const polls = getAllPolls();
    return polls.find(poll => poll.id === id) || null;
  }

  /**
   * Saves a new poll to storage
   * @param {Object} poll - The poll to save
   * @returns {Object} The saved poll
   */
  function savePoll(poll) {
    const data = readData();
    data.polls.push(poll);
    writeData(data);
    return poll;
  }

  /**
   * Updates an existing poll
   * @param {string} id - The poll ID
   * @param {Object} updatedPoll - The updated poll data
   * @returns {Object|null} The updated poll or null if not found
   */
  function updatePoll(id, updatedPoll) {
    const data = readData();
    const index = data.polls.findIndex(poll => poll.id === id);

    if (index === -1) {
      return null;
    }

    data.polls[index] = { ...data.polls[index], ...updatedPoll };
    writeData(data);
    return data.polls[index];
  }

  /**
   * Deletes a poll by ID
   * @param {string} id - The poll ID
   * @returns {boolean} True if deleted, false if not found
   */
  function deletePoll(id) {
    const data = readData();
    const initialLength = data.polls.length;
    data.polls = data.polls.filter(poll => poll.id !== id);

    if (data.polls.length === initialLength) {
      return false;
    }

    writeData(data);
    return true;
  }

  /**
   * Clears all polls from storage
   */
  function clearAll() {
    writeData({ polls: [] });
  }

  return {
    readData,
    writeData,
    getAllPolls,
    getPollById,
    savePoll,
    updatePoll,
    deletePoll,
    clearAll
  };
}

module.exports = { createStorageService };
