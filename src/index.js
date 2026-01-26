const express = require('express');
const pollRoutes = require('./routes/polls');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use('/polls', pollRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Poll API server running on http://localhost:${PORT}`);
  console.log(`\nEndpoints:`);
  console.log(`  GET    /health       - Health check`);
  console.log(`  GET    /polls        - List all polls`);
  console.log(`  POST   /polls        - Create a poll`);
  console.log(`  GET    /polls/:id    - Get poll results`);
  console.log(`  POST   /polls/:id/vote - Vote on a poll`);
  console.log(`  DELETE /polls/:id    - Delete a poll`);
});

module.exports = app;
