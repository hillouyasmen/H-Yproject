-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: יוני 19, 2025 בזמן 05:26 PM
-- גרסת שרת: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `fitness_store`
--

-- --------------------------------------------------------

--
-- מבנה טבלה עבור טבלה `items`
--

CREATE TABLE `items` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- הוצאת מידע עבור טבלה `items`
--

INSERT INTO `items` (`id`, `name`, `description`, `price`, `category`, `image_url`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'dress', 'beauty', 123.00, NULL, NULL, NULL, '2025-06-19 03:31:07', '2025-06-19 03:31:07'),
(2, 'dress', 'beauty', 120.00, 'Clothing', NULL, NULL, '2025-06-19 05:36:03', '2025-06-19 05:36:03'),
(3, 'dress', 'beauty', 122.94, NULL, NULL, NULL, '2025-06-19 05:46:55', '2025-06-19 05:46:55'),
(4, 'dress23', 'beauty', 1232.94, NULL, NULL, NULL, '2025-06-19 06:21:50', '2025-06-19 06:21:50');

-- --------------------------------------------------------

--
-- מבנה טבלה עבור טבלה `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `status` enum('pending','processing','completed','cancelled') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- הוצאת מידע עבור טבלה `orders`
--

INSERT INTO `orders` (`id`, `user_id`, `total_amount`, `status`, `created_at`, `updated_at`) VALUES
(1, 2, 199.80, 'completed', '2025-06-19 01:31:45', '2025-06-19 01:31:45'),
(2, 3, 379.80, 'processing', '2025-06-19 01:31:45', '2025-06-19 01:31:45'),
(3, 4, 129.90, 'pending', '2025-06-19 01:31:45', '2025-06-19 01:31:45'),
(4, 5, 49.90, 'completed', '2025-06-19 01:31:45', '2025-06-19 01:31:45'),
(5, 2, 99.90, 'cancelled', '2025-06-19 01:31:45', '2025-06-19 01:31:45');

-- --------------------------------------------------------

--
-- מבנה טבלה עבור טבלה `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `category` varchar(50) NOT NULL,
  `stock_quantity` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- הוצאת מידע עבור טבלה `products`
--

INSERT INTO `products` (`id`, `name`, `description`, `price`, `category`, `stock_quantity`, `created_at`, `updated_at`) VALUES
(1, 'Yoga Mat', 'High-quality non-slip yoga mat', 99.90, 'Yoga', 50, '2025-06-19 01:31:45', '2025-06-19 01:31:45'),
(2, 'Dumbbells Set', 'Set of 2 adjustable dumbbells', 299.90, 'Weights', 30, '2025-06-19 01:31:45', '2025-06-19 01:31:45'),
(3, 'Resistance Bands', 'Set of 5 resistance bands', 79.90, 'Accessories', 100, '2025-06-19 01:31:45', '2025-06-19 01:31:45'),
(4, 'Foam Roller', 'High-density foam roller', 129.90, 'Recovery', 45, '2025-06-19 01:31:45', '2025-06-19 01:31:45'),
(5, 'Jump Rope', 'Adjustable speed jump rope', 49.90, 'Cardio', 80, '2025-06-19 01:31:45', '2025-06-19 01:31:45');

-- --------------------------------------------------------

--
-- מבנה טבלה עבור טבלה `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `role` enum('user','admin') DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- הוצאת מידע עבור טבלה `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `full_name`, `email`, `phone_number`, `role`, `created_at`, `updated_at`) VALUES
(1, 'admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin User', 'admin@example.com', '0501234567', 'admin', '2025-06-19 01:31:45', '2025-06-19 01:31:45'),
(2, 'user1', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John Doe', 'john@example.com', '0501111111', 'user', '2025-06-19 01:31:45', '2025-06-19 01:31:45'),
(3, 'user2', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jane Smith', 'jane@example.com', '0502222222', 'user', '2025-06-19 01:31:45', '2025-06-19 01:31:45'),
(4, 'user3', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Bob Johnson', 'bob@example.com', '0503333333', 'user', '2025-06-19 01:31:45', '2025-06-19 01:31:45'),
(5, 'user4', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Alice Brown', 'alice@example.com', '0504444444', 'user', '2025-06-19 01:31:45', '2025-06-19 01:31:45'),
(6, 'eve', 'hbhazem2310', 'hazemhb', 'hazemhb2345@gmail.com', NULL, 'user', '2025-06-19 03:08:38', '2025-06-19 04:41:14'),
(7, 'hazemhb', '$2a$10$eA1LO3DgnNvOx8uYoYfoH.ROI6ymo6TbHVgVaVq/vJX.GVM2hulyy', 'hazem', 'hazemhb123@gmail.com', NULL, 'user', '2025-06-19 04:36:02', '2025-06-19 04:36:02'),
(8, 'hazemhssb', '$2a$10$wYacptrQqceLZytBKfJJRO.PFx.lR/JdnCx2Z00YdE8szHNkmK9we', 'hazefm', 'hazemhb1253@gmail.com', NULL, 'user', '2025-06-19 04:36:13', '2025-06-19 04:36:13'),
(9, 'ecve', '$2a$10$lnJarkc0pQnrW6Z70cRe3OXXcBUDlOf9uP.yhxjUbgpcz9Fm0O6lq', 'evigina563', 'taina12@gmail.com', NULL, 'user', '2025-06-19 04:36:31', '2025-06-19 04:36:31'),
(10, 'eveeee', '$2a$10$5Yvxust7OT2shQDoJ3z7HescdrkKaWixfXuBmv8juzoPWETwD1rc6', 'eve', 'eve12@gmail.com', NULL, 'user', '2025-06-19 04:40:17', '2025-06-19 04:40:17'),
(11, 'aya', '$2a$10$su58wKuDzQzaXmyeIkI/pOt5JxPXQOorlJxFmY7Newo0dQT5R6grS', 'aya', 'aya@gmail.com', NULL, 'user', '2025-06-19 04:46:05', '2025-06-19 04:46:05'),
(12, 'tay', '$2a$10$0ZJWnFZ4wzd37mmhu/OTBeGn4HzoWPBIiUYBkd60e3V79XwQMp49q', 'ayahhh', 'ayaee@gmail.com', NULL, 'user', '2025-06-19 04:50:15', '2025-06-19 04:50:15'),
(13, 'roy', '$2a$10$Fz0AQIl6bWZB3VWNe0nr4.2CGigcHblgBzT7vEU61kuVIWqdYQbNi', 'roi', 'roi@gmail.com', NULL, 'user', '2025-06-19 04:56:03', '2025-06-19 04:56:03'),
(14, 'jess', '$2a$10$EVsScVOdboi8hFNIV6agku5XS/wXkchX1yTHySmGiTSkrM9BkAXe2', 'jess', 'DSDSD@gmail.com', NULL, 'user', '2025-06-19 05:18:09', '2025-06-19 05:18:09'),
(15, 'ali', '$2a$10$GXRYoqdoM2tq8tCaASuod.O39lCM7pMznU5jV9badNW/ZnjccghYO', 'ali', 'ali@gmail.com', NULL, 'user', '2025-06-19 05:42:40', '2025-06-19 05:42:40');

--
-- Indexes for dumped tables
--

--
-- אינדקסים לטבלה `items`
--
ALTER TABLE `items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`);

--
-- אינדקסים לטבלה `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- אינדקסים לטבלה `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`);

--
-- אינדקסים לטבלה `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `items`
--
ALTER TABLE `items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- הגבלות לטבלאות שהוצאו
--

--
-- הגבלות לטבלה `items`
--
ALTER TABLE `items`
  ADD CONSTRAINT `items_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- הגבלות לטבלה `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
