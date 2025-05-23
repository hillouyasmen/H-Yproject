const express = require('express');
const cors = require('cors');
const { pool, testConnection } = require('./db');
const userRoutes = require('./routes/users');
const ordersRoutes = require('./routes/orders');
const favoritesRoutes = require('./routes/favorites');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/favorites', favoritesRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Backend is running' });
});

// Start server
const PORT = 4000;

const tryPort = async (port) => {
  return new Promise((resolve) => {
    const server = app.listen(port)
      .on('listening', () => {
        server.close();
        resolve(true);
      })
      .on('error', () => {
        resolve(false);
      });
  });
};

const findAvailablePort = async (startPort) => {
  let port = startPort;
  while (!(await tryPort(port))) {
    port++;
    if (port > startPort + 100) {
      throw new Error('No available ports found');
    }
  }
  return port;
};

const startServer = async () => {
  try {
    // Test database connection first
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('Failed to connect to database. Server will not start.');
      process.exit(1);
    }

    // Find available port
    const availablePort = await findAvailablePort(4000);
    console.log(`Found available port: ${availablePort}`);

    // Start server on available port
    app.listen(availablePort, () => {
      console.log(`✅ Server running on http://localhost:${availablePort}`);
    }).on('error', (err) => {
      console.error('❌ Server failed to start:', err.message);
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Error starting server:', error.message);
    process.exit(1);
  }
};

startServer();
