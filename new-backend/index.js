require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests
app.use((req, res, next) => {
  console.log('Request Body:', req.body);
  console.log('Request Headers:', req.headers);
  next();
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));

// Health check route
app.get('/', (req, res) => {
  res.send('✅ API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Function to check if a port is available
async function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = require('net').createServer()
    server.once('error', () => resolve(false))
    server.once('listening', () => {
      server.close()
      resolve(true)
    })
    server.listen(port, '0.0.0.0')
  })
}

// Function to find an available port
async function findAvailablePort(startPort) {
  let port = startPort
  while (!(await isPortAvailable(port))) {
    port++
    if (port > startPort + 1000) { // Don't search forever
      throw new Error('No available ports found')
    }
  }
  return port
}

// Start server function
async function startServer() {
  try {
    // First connect to database
    await connectDB();
    console.log('✅ Database Connected');

    // Find an available port starting from the preferred port
    const port = await findAvailablePort(process.env.PORT || 6000);
    
    // Start the server
    const server = await app.listen(port, '0.0.0.0');
    console.log(`✅ Server running on http://localhost:${port}`);
    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
