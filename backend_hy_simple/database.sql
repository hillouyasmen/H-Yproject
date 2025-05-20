-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS hy_project;
USE hy_project;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  role ENUM('admin', 'customer') DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create default admin user (password: admin123)
INSERT INTO users (username, password, full_name, email, phone_number, role)
VALUES 
('admin', '$2b$10$8K1p/a0dL1LXMIZoZxqkP.UHBP1EFLSEJDy0FX1RVH8ALHIhNz4DO', 'Admin User', 'admin@example.com', '1234567890', 'admin')
ON DUPLICATE KEY UPDATE username=username;
