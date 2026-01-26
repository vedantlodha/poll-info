# Poll API

A REST API for creating and voting on polls. Built with Express.js.

## Installation

```bash
npm install
```

## Running the Server

```bash
# Start the server
npm start

# Start with auto-reload (development)
npm run dev
```

The server runs on `http://localhost:3000` by default.

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## API Endpoints

### Health Check

```
GET /health
```

Returns server status.

### List All Polls

```
GET /polls
```

**Response:**
```json
{
  "count": 2,
  "polls": [
    {
      "id": "abc-123",
      "question": "Favorite color?",
      "optionCount": 3,
      "createdAt": "2025-01-26T10:00:00.000Z"
    }
  ]
}
```

### Create a Poll

```
POST /polls
Content-Type: application/json

{
  "question": "What's your favorite programming language?",
  "options": ["JavaScript", "Python", "Go", "Rust"]
}
```

**Response:** `201 Created`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "question": "What's your favorite programming language?",
  "options": [
    { "text": "JavaScript", "votes": 0 },
    { "text": "Python", "votes": 0 },
    { "text": "Go", "votes": 0 },
    { "text": "Rust", "votes": 0 }
  ],
  "voters": [],
  "createdAt": "2025-01-26T10:00:00.000Z"
}
```

### Get Poll Results

```
GET /polls/:id
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "question": "What's your favorite programming language?",
  "options": [
    { "text": "JavaScript", "votes": 5, "percentage": 50 },
    { "text": "Python", "votes": 3, "percentage": 30 },
    { "text": "Go", "votes": 1, "percentage": 10 },
    { "text": "Rust", "votes": 1, "percentage": 10 }
  ],
  "totalVotes": 10,
  "winners": ["JavaScript"],
  "voterCount": 10,
  "isTied": false,
  "createdAt": "2025-01-26T10:00:00.000Z"
}
```

### Vote on a Poll

```
POST /polls/:id/vote
Content-Type: application/json

{
  "optionIndex": 0,
  "voterId": "user-123"
}
```

- `optionIndex`: Zero-based index of the option to vote for
- `voterId`: Unique identifier for the voter (prevents duplicate votes)

**Response:** Returns updated poll results (same format as GET /polls/:id)

### Delete a Poll

```
DELETE /polls/:id
```

**Response:** `204 No Content`

## Project Structure

```
poll-api/
├── src/
│   ├── index.js                 # Express server entry point
│   ├── routes/
│   │   └── polls.js             # Poll route handlers
│   ├── services/
│   │   ├── pollService.js       # Poll business logic
│   │   ├── storageService.js    # JSON file persistence
│   │   └── __tests__/
│   │       ├── pollService.test.js
│   │       └── storageService.test.js
│   └── utils/
│       └── pollCalculator.js    # Results calculation (NO TESTS)
├── data/
│   └── polls.json               # Poll data storage
├── package.json
└── README.md
```

## Example Usage

```bash
# Create a poll
curl -X POST http://localhost:3000/polls \
  -H "Content-Type: application/json" \
  -d '{"question": "Best pizza topping?", "options": ["Pepperoni", "Mushrooms", "Pineapple"]}'

# Vote on a poll
curl -X POST http://localhost:3000/polls/<poll-id>/vote \
  -H "Content-Type: application/json" \
  -d '{"optionIndex": 0, "voterId": "user-abc"}'

# Get results
curl http://localhost:3000/polls/<poll-id>

# List all polls
curl http://localhost:3000/polls

# Delete a poll
curl -X DELETE http://localhost:3000/polls/<poll-id>
```

## License

MIT
