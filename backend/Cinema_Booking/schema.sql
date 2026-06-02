-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 21, 2026 at 02:13 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `cinema_booking`
CREATE DATABASE IF NOT EXISTS `cinema_booking`;
USE `cinema_booking`;
--

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `showtime_id` int(11) NOT NULL,
  `total_price` decimal(10,0) NOT NULL,
  `status` enum('PENDING','CONFIRMED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `held_until` datetime NOT NULL,
  `confirmed_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`id`, `user_id`, `showtime_id`, `total_price`, `status`, `held_until`, `confirmed_at`, `cancelled_at`, `created_at`) VALUES
(1, 2, 2, 350000, 'CANCELLED', '2026-04-06 19:54:45', NULL, '2026-04-06 19:48:01', '2026-04-06 19:44:45'),
(2, 2, 2, 240000, 'CONFIRMED', '2026-04-06 19:59:00', '2026-04-06 19:50:46', NULL, '2026-04-06 19:49:00'),
(3, 2, 2, 350000, 'CONFIRMED', '2026-04-07 12:46:25', '2026-04-07 12:41:07', NULL, '2026-04-07 12:36:25'),
(4, 2, 2, 240000, 'CONFIRMED', '2026-04-07 12:53:06', '2026-04-07 12:47:06', NULL, '2026-04-07 12:43:06'),
(5, 2, 2, 240000, 'CONFIRMED', '2026-04-09 21:16:39', '2026-04-09 21:07:27', NULL, '2026-04-09 21:06:39'),
(6, 2, 2, 160000, 'CONFIRMED', '2026-04-10 10:19:54', '2026-04-10 10:10:33', NULL, '2026-04-10 10:09:54'),
(8, 2, 2, 450000, 'PENDING', '2026-04-16 23:02:40', NULL, NULL, '2026-04-16 22:52:40'),
(9, 2, 2, 450000, 'PENDING', '2026-04-16 23:06:25', NULL, NULL, '2026-04-16 22:56:25'),
(10, 2, 2, 450000, 'CONFIRMED', '2026-04-16 23:18:30', '2026-04-16 23:10:49', NULL, '2026-04-16 23:08:30');

-- --------------------------------------------------------

--
-- Table structure for table `booking_combos`
--

CREATE TABLE `booking_combos` (
  `id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `combo_id` int(11) NOT NULL,
  `combo_name` varchar(100) NOT NULL,
  `quantity` tinyint(4) NOT NULL DEFAULT 1,
  `price` decimal(10,0) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `booking_combos`
--

INSERT INTO `booking_combos` (`id`, `booking_id`, `combo_id`, `combo_name`, `quantity`, `price`) VALUES
(1, 8, 1, 'Combo 1 Bắp 2 Nước', 1, 90000),
(2, 8, 3, 'Combo 2 Bắp phô mai', 2, 100000),
(3, 9, 1, 'Combo 1 Bắp 2 Nước', 1, 90000),
(4, 9, 3, 'Combo 2 Bắp phô mai', 2, 100000),
(5, 10, 1, 'Combo 1 Bắp 2 Nước', 1, 90000),
(6, 10, 3, 'Combo 2 Bắp phô mai', 2, 100000);

-- --------------------------------------------------------

--
-- Table structure for table `booking_seats`
--

CREATE TABLE `booking_seats` (
  `id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `seat_id` int(11) NOT NULL,
  `seat_label` varchar(10) NOT NULL,
  `seat_type` enum('NORMAL','VIP','COUPLE') NOT NULL,
  `price` decimal(10,0) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `booking_seats`
--

INSERT INTO `booking_seats` (`id`, `booking_id`, `seat_id`, `seat_label`, `seat_type`, `price`) VALUES
(1, 1, 97, 'A1', 'VIP', 120000),
(2, 1, 100, 'A4', 'NORMAL', 80000),
(3, 1, 99, 'A3', 'COUPLE', 150000),
(4, 2, 101, 'A5', 'NORMAL', 80000),
(5, 2, 100, 'A4', 'NORMAL', 80000),
(6, 2, 102, 'A6', 'NORMAL', 80000),
(7, 3, 97, 'A1', 'VIP', 120000),
(8, 3, 99, 'A3', 'COUPLE', 150000),
(9, 3, 105, 'A9', 'NORMAL', 80000),
(10, 4, 106, 'A10', 'NORMAL', 80000),
(11, 4, 107, 'A11', 'NORMAL', 80000),
(12, 4, 108, 'A12', 'NORMAL', 80000),
(13, 5, 109, 'A13', 'NORMAL', 80000),
(14, 5, 110, 'A14', 'NORMAL', 80000),
(15, 5, 111, 'A15', 'NORMAL', 80000),
(16, 6, 112, 'B1', 'NORMAL', 80000),
(17, 6, 113, 'B2', 'NORMAL', 80000),
(20, 8, 114, 'B3', 'NORMAL', 80000),
(21, 8, 115, 'B4', 'NORMAL', 80000),
(22, 9, 116, 'B5', 'NORMAL', 80000),
(23, 9, 117, 'B6', 'NORMAL', 80000),
(24, 10, 116, 'B5', 'NORMAL', 80000),
(25, 10, 117, 'B6', 'NORMAL', 80000);

-- --------------------------------------------------------

--
-- Table structure for table `cinemas`
--

CREATE TABLE `cinemas` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `address` text NOT NULL,
  `city` varchar(60) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cinemas`
--

INSERT INTO `cinemas` (`id`, `name`, `address`, `city`, `phone`, `image_url`, `created_at`) VALUES
(1, 'CGV Vincom Center', '72 Lê Thánh Tôn, Bến Nghé', 'Hồ Chí Minh', '1900 6018', 'https://example.com/cgv.jpg', '2026-04-04 20:43:02');

-- --------------------------------------------------------

--
-- Table structure for table `combos`
--

CREATE TABLE `combos` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,0) NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `combos`
--

INSERT INTO `combos` (`id`, `name`, `description`, `price`, `image_url`, `is_active`, `created_at`) VALUES
(1, 'Combo 1 Bắp 2 Nước', '1 Bắp ngọt lớn + 2 Nước ngọt cỡ vừa', 90000, 'https://res.cloudinary.com/demo/image/upload/v1/combo1.jpg', 1, '2026-04-16 22:28:14'),
(3, 'Combo 2 Bắp phô mai', '2 Bắp phô mai cỡ lớn', 100000, NULL, 1, '2026-04-16 22:46:33');

-- --------------------------------------------------------

--
-- Table structure for table `movies`
--

CREATE TABLE `movies` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `duration` int(10) UNSIGNED NOT NULL,
  `genres` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`genres`)),
  `directors` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`directors`)),
  `release_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `poster_url` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `age_rating` enum('P','K','T13','T16','T18') DEFAULT 'P',
  `language` enum('Vietsub','Lồng tiếng','Nguyên bản') DEFAULT 'Vietsub',
  `created_at` datetime DEFAULT current_timestamp()
) ;

--
-- Dumping data for table `movies`
--

INSERT INTO `movies` (`id`, `title`, `duration`, `genres`, `directors`, `release_date`, `end_date`, `poster_url`, `description`, `age_rating`, `language`, `created_at`) VALUES
(1, 'Dune: Part Two', 166, '[\"Action\",\"Adventure\",\"Sci-Fi\"]', '[\"Denis Villeneuve\"]', '2024-03-01 07:00:00', '2024-05-01 07:00:00', 'https://example.com/dune-poster.jpg', 'Paul Atreides unites with Chani and the Fremen while on a warpath of revenge.', 'T13', 'Vietsub', '2026-04-04 11:22:35'),
(3, 'Tên mới', 160, '[\"Hành động\",\"Phiêu lưu\"]', '[\"Joe Russo\"]', '2026-04-01 07:00:00', '2026-06-30 07:00:00', 'https://example.com/poster.jpg', 'Mô tả phim...', 'T16', 'Vietsub', '2026-04-04 20:39:59');

-- --------------------------------------------------------

CREATE TABLE `ratings` (
  `id`         int(11)     NOT NULL AUTO_INCREMENT,
  `user_id`    int(11)     NOT NULL,
  `movie_id`   bigint(20) UNSIGNED NOT NULL,
  `score`      tinyint(2)  NOT NULL COMMENT '1-10',
  `review`     text        DEFAULT NULL,
  `created_at` datetime    NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_movie` (`user_id`, `movie_id`),
  KEY `idx_movie_id` (`movie_id`),
  KEY `idx_user_id`  (`user_id`),
  CONSTRAINT `ratings_ibfk_1` FOREIGN KEY (`user_id`)  REFERENCES `users`  (`id`) ON DELETE CASCADE,
  CONSTRAINT `ratings_ibfk_2` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `amount` decimal(12,0) NOT NULL,
  `status` enum('PENDING','SUCCESS','FAILED') NOT NULL DEFAULT 'PENDING',
  `provider` enum('MOCK','VNPAY','MOMO') NOT NULL DEFAULT 'MOCK',
  `transaction_id` varchar(100) DEFAULT NULL,
  `expired_at` datetime NOT NULL,
  `paid_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `booking_id`, `user_id`, `amount`, `status`, `provider`, `transaction_id`, `expired_at`, `paid_at`, `created_at`) VALUES
(1, 3, 2, 350000, 'SUCCESS', 'MOCK', 'b366f5ce-e372-4aa4-9c46-f88a3b8594fe', '2026-04-07 12:53:20', '2026-04-07 12:41:07', '2026-04-07 12:38:20'),
(2, 4, 2, 240000, 'FAILED', 'MOCK', NULL, '2026-04-07 12:59:26', NULL, '2026-04-07 12:44:26'),
(3, 4, 2, 240000, 'SUCCESS', 'MOCK', 'ce606726-256e-403a-83db-cef84aab59a8', '2026-04-07 13:01:28', '2026-04-07 12:47:06', '2026-04-07 12:46:28'),
(4, 5, 2, 240000, 'SUCCESS', 'MOCK', 'c35fb135-aab4-42d5-8227-85f74c9a1c35', '2026-04-09 21:22:14', '2026-04-09 21:07:27', '2026-04-09 21:07:14'),
(5, 6, 2, 160000, 'SUCCESS', 'MOCK', '1fb26cfe-2be0-4aaa-b058-4480b2ab82df', '2026-04-10 10:25:11', '2026-04-10 10:10:33', '2026-04-10 10:10:11'),
(6, 10, 2, 450000, 'SUCCESS', 'MOCK', '34ceb1c3-67ff-495e-b7b2-53767bb21865', '2026-04-16 23:24:28', '2026-04-16 23:10:49', '2026-04-16 23:09:28');

-- --------------------------------------------------------

--
-- Table structure for table `refresh_tokens`
--

CREATE TABLE `refresh_tokens` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(512) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `refresh_tokens`
--

INSERT INTO `refresh_tokens` (`id`, `user_id`, `token`, `expires_at`, `created_at`) VALUES
(9, 2, 'b9415d3a1f93fc4e6fc1285ae4c1da376cc66c5aab499e35b9017758d1a29ce88a073a2f7d4034327c5b1eeb36d6e6ab5c6aec9c771931402c97468ac3898790', '2026-05-16 09:39:42', '2026-04-16 09:39:42');

-- --------------------------------------------------------

--
-- Table structure for table `rooms`
--

CREATE TABLE `rooms` (
  `id` int(11) NOT NULL,
  `cinema_id` int(11) NOT NULL,
  `name` varchar(20) NOT NULL,
  `type` enum('STANDARD','VIP','IMAX') NOT NULL DEFAULT 'STANDARD',
  `total_rows` int(11) NOT NULL,
  `seats_per_row` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rooms`
--

INSERT INTO `rooms` (`id`, `cinema_id`, `name`, `type`, `total_rows`, `seats_per_row`, `created_at`) VALUES
(1, 1, 'Phòng 2', 'VIP', 10, 15, '2026-04-04 20:50:22'),
(2, 1, 'Phòng 1', 'IMAX', 8, 10, '2026-04-04 22:08:00');

-- --------------------------------------------------------

--
-- Table structure for table `seats`
--

CREATE TABLE `seats` (
  `id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `row` char(1) NOT NULL,
  `number` int(11) NOT NULL,
  `type` enum('NORMAL','VIP','COUPLE') NOT NULL DEFAULT 'NORMAL',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `seats`
--

INSERT INTO `seats` (`id`, `room_id`, `row`, `number`, `type`, `is_active`, `created_at`) VALUES
(97, 1, 'A', 1, 'VIP', 1, '2026-04-04 22:03:29'),
(98, 1, 'A', 2, 'NORMAL', 0, '2026-04-04 22:03:29'),
(99, 1, 'A', 3, 'COUPLE', 1, '2026-04-04 22:03:29'),
(100, 1, 'A', 4, 'NORMAL', 1, '2026-04-04 22:03:29'),
(101, 1, 'A', 5, 'NORMAL', 1, '2026-04-04 22:03:29'),
(102, 1, 'A', 6, 'NORMAL', 1, '2026-04-04 22:03:29'),
(103, 1, 'A', 7, 'NORMAL', 1, '2026-04-04 22:03:29'),
(104, 1, 'A', 8, 'NORMAL', 1, '2026-04-04 22:03:29'),
(105, 1, 'A', 9, 'NORMAL', 1, '2026-04-04 22:03:29'),
(106, 1, 'A', 10, 'NORMAL', 1, '2026-04-04 22:03:29'),
(107, 1, 'A', 11, 'NORMAL', 1, '2026-04-04 22:03:29'),
(108, 1, 'A', 12, 'NORMAL', 1, '2026-04-04 22:03:29'),
(109, 1, 'A', 13, 'NORMAL', 1, '2026-04-04 22:03:29'),
(110, 1, 'A', 14, 'NORMAL', 1, '2026-04-04 22:03:29'),
(111, 1, 'A', 15, 'NORMAL', 1, '2026-04-04 22:03:29'),
(112, 1, 'B', 1, 'NORMAL', 1, '2026-04-04 22:03:29'),
(113, 1, 'B', 2, 'NORMAL', 1, '2026-04-04 22:03:29'),
(114, 1, 'B', 3, 'NORMAL', 1, '2026-04-04 22:03:29'),
(115, 1, 'B', 4, 'NORMAL', 1, '2026-04-04 22:03:29'),
(116, 1, 'B', 5, 'NORMAL', 1, '2026-04-04 22:03:29'),
(117, 1, 'B', 6, 'NORMAL', 1, '2026-04-04 22:03:29'),
(118, 1, 'B', 7, 'NORMAL', 1, '2026-04-04 22:03:29'),
(119, 1, 'B', 8, 'NORMAL', 1, '2026-04-04 22:03:29'),
(120, 1, 'B', 9, 'NORMAL', 1, '2026-04-04 22:03:29'),
(121, 1, 'B', 10, 'NORMAL', 1, '2026-04-04 22:03:29'),
(122, 1, 'B', 11, 'NORMAL', 1, '2026-04-04 22:03:29'),
(123, 1, 'B', 12, 'NORMAL', 1, '2026-04-04 22:03:29'),
(124, 1, 'B', 13, 'NORMAL', 1, '2026-04-04 22:03:29'),
(125, 1, 'B', 14, 'NORMAL', 1, '2026-04-04 22:03:29'),
(126, 1, 'B', 15, 'NORMAL', 1, '2026-04-04 22:03:29'),
(127, 1, 'C', 1, 'NORMAL', 1, '2026-04-04 22:03:29'),
(128, 1, 'C', 2, 'NORMAL', 1, '2026-04-04 22:03:29'),
(129, 1, 'C', 3, 'NORMAL', 1, '2026-04-04 22:03:29'),
(130, 1, 'C', 4, 'NORMAL', 1, '2026-04-04 22:03:29'),
(131, 1, 'C', 5, 'NORMAL', 1, '2026-04-04 22:03:29'),
(132, 1, 'C', 6, 'NORMAL', 1, '2026-04-04 22:03:29'),
(133, 1, 'C', 7, 'NORMAL', 1, '2026-04-04 22:03:29'),
(134, 1, 'C', 8, 'NORMAL', 1, '2026-04-04 22:03:29'),
(135, 1, 'C', 9, 'NORMAL', 1, '2026-04-04 22:03:29'),
(136, 1, 'C', 10, 'NORMAL', 1, '2026-04-04 22:03:29'),
(137, 1, 'C', 11, 'NORMAL', 1, '2026-04-04 22:03:29'),
(138, 1, 'C', 12, 'NORMAL', 1, '2026-04-04 22:03:29'),
(139, 1, 'C', 13, 'NORMAL', 1, '2026-04-04 22:03:29'),
(140, 1, 'C', 14, 'NORMAL', 1, '2026-04-04 22:03:29'),
(141, 1, 'C', 15, 'NORMAL', 1, '2026-04-04 22:03:29'),
(142, 1, 'D', 1, 'NORMAL', 1, '2026-04-04 22:03:29'),
(143, 1, 'D', 2, 'NORMAL', 1, '2026-04-04 22:03:29'),
(144, 1, 'D', 3, 'NORMAL', 1, '2026-04-04 22:03:29'),
(145, 1, 'D', 4, 'NORMAL', 1, '2026-04-04 22:03:29'),
(146, 1, 'D', 5, 'NORMAL', 1, '2026-04-04 22:03:29'),
(147, 1, 'D', 6, 'NORMAL', 1, '2026-04-04 22:03:29'),
(148, 1, 'D', 7, 'NORMAL', 1, '2026-04-04 22:03:29'),
(149, 1, 'D', 8, 'NORMAL', 1, '2026-04-04 22:03:29'),
(150, 1, 'D', 9, 'NORMAL', 1, '2026-04-04 22:03:29'),
(151, 1, 'D', 10, 'NORMAL', 1, '2026-04-04 22:03:29'),
(152, 1, 'D', 11, 'NORMAL', 1, '2026-04-04 22:03:29'),
(153, 1, 'D', 12, 'NORMAL', 1, '2026-04-04 22:03:29'),
(154, 1, 'D', 13, 'NORMAL', 1, '2026-04-04 22:03:29'),
(155, 1, 'D', 14, 'NORMAL', 1, '2026-04-04 22:03:29'),
(156, 1, 'D', 15, 'NORMAL', 1, '2026-04-04 22:03:29'),
(157, 1, 'E', 1, 'NORMAL', 1, '2026-04-04 22:03:29'),
(158, 1, 'E', 2, 'NORMAL', 1, '2026-04-04 22:03:29'),
(159, 1, 'E', 3, 'NORMAL', 1, '2026-04-04 22:03:29'),
(160, 1, 'E', 4, 'NORMAL', 1, '2026-04-04 22:03:29'),
(161, 1, 'E', 5, 'NORMAL', 1, '2026-04-04 22:03:29'),
(162, 1, 'E', 6, 'NORMAL', 1, '2026-04-04 22:03:29'),
(163, 1, 'E', 7, 'NORMAL', 1, '2026-04-04 22:03:29'),
(164, 1, 'E', 8, 'NORMAL', 1, '2026-04-04 22:03:29'),
(165, 1, 'E', 9, 'NORMAL', 1, '2026-04-04 22:03:29'),
(166, 1, 'E', 10, 'NORMAL', 1, '2026-04-04 22:03:29'),
(167, 1, 'E', 11, 'NORMAL', 1, '2026-04-04 22:03:29'),
(168, 1, 'E', 12, 'NORMAL', 1, '2026-04-04 22:03:29'),
(169, 1, 'E', 13, 'NORMAL', 1, '2026-04-04 22:03:29'),
(170, 1, 'E', 14, 'NORMAL', 1, '2026-04-04 22:03:29'),
(171, 1, 'E', 15, 'NORMAL', 1, '2026-04-04 22:03:29'),
(172, 1, 'F', 1, 'NORMAL', 1, '2026-04-04 22:03:29'),
(173, 1, 'F', 2, 'NORMAL', 1, '2026-04-04 22:03:29'),
(174, 1, 'F', 3, 'NORMAL', 1, '2026-04-04 22:03:29'),
(175, 1, 'F', 4, 'NORMAL', 1, '2026-04-04 22:03:29'),
(176, 1, 'F', 5, 'NORMAL', 1, '2026-04-04 22:03:29'),
(177, 1, 'F', 6, 'NORMAL', 1, '2026-04-04 22:03:29'),
(178, 1, 'F', 7, 'NORMAL', 1, '2026-04-04 22:03:29'),
(179, 1, 'F', 8, 'NORMAL', 1, '2026-04-04 22:03:29'),
(180, 1, 'F', 9, 'NORMAL', 1, '2026-04-04 22:03:29'),
(181, 1, 'F', 10, 'NORMAL', 1, '2026-04-04 22:03:29'),
(182, 1, 'F', 11, 'NORMAL', 1, '2026-04-04 22:03:29'),
(183, 1, 'F', 12, 'NORMAL', 1, '2026-04-04 22:03:29'),
(184, 1, 'F', 13, 'NORMAL', 1, '2026-04-04 22:03:29'),
(185, 1, 'F', 14, 'NORMAL', 1, '2026-04-04 22:03:29'),
(186, 1, 'F', 15, 'NORMAL', 1, '2026-04-04 22:03:29'),
(187, 1, 'G', 1, 'NORMAL', 1, '2026-04-04 22:03:29'),
(188, 1, 'G', 2, 'NORMAL', 1, '2026-04-04 22:03:29'),
(189, 1, 'G', 3, 'NORMAL', 1, '2026-04-04 22:03:29'),
(190, 1, 'G', 4, 'NORMAL', 1, '2026-04-04 22:03:29'),
(191, 1, 'G', 5, 'NORMAL', 1, '2026-04-04 22:03:29'),
(192, 1, 'G', 6, 'NORMAL', 1, '2026-04-04 22:03:29'),
(193, 1, 'G', 7, 'NORMAL', 1, '2026-04-04 22:03:29'),
(194, 1, 'G', 8, 'NORMAL', 1, '2026-04-04 22:03:29'),
(195, 1, 'G', 9, 'NORMAL', 1, '2026-04-04 22:03:29'),
(196, 1, 'G', 10, 'NORMAL', 1, '2026-04-04 22:03:29'),
(197, 1, 'G', 11, 'NORMAL', 1, '2026-04-04 22:03:29'),
(198, 1, 'G', 12, 'NORMAL', 1, '2026-04-04 22:03:29'),
(199, 1, 'G', 13, 'NORMAL', 1, '2026-04-04 22:03:29'),
(200, 1, 'G', 14, 'NORMAL', 1, '2026-04-04 22:03:29'),
(201, 1, 'G', 15, 'NORMAL', 1, '2026-04-04 22:03:29'),
(202, 1, 'H', 1, 'NORMAL', 1, '2026-04-04 22:03:29'),
(203, 1, 'H', 2, 'NORMAL', 1, '2026-04-04 22:03:29'),
(204, 1, 'H', 3, 'NORMAL', 1, '2026-04-04 22:03:29'),
(205, 1, 'H', 4, 'NORMAL', 1, '2026-04-04 22:03:29'),
(206, 1, 'H', 5, 'NORMAL', 1, '2026-04-04 22:03:29'),
(207, 1, 'H', 6, 'NORMAL', 1, '2026-04-04 22:03:29'),
(208, 1, 'H', 7, 'NORMAL', 1, '2026-04-04 22:03:29'),
(209, 1, 'H', 8, 'NORMAL', 1, '2026-04-04 22:03:29'),
(210, 1, 'H', 9, 'NORMAL', 1, '2026-04-04 22:03:29'),
(211, 1, 'H', 10, 'NORMAL', 1, '2026-04-04 22:03:29'),
(212, 1, 'H', 11, 'NORMAL', 1, '2026-04-04 22:03:29'),
(213, 1, 'H', 12, 'NORMAL', 1, '2026-04-04 22:03:29'),
(214, 1, 'H', 13, 'NORMAL', 1, '2026-04-04 22:03:29'),
(215, 1, 'H', 14, 'NORMAL', 1, '2026-04-04 22:03:29'),
(216, 1, 'H', 15, 'NORMAL', 1, '2026-04-04 22:03:29'),
(217, 1, 'I', 1, 'NORMAL', 1, '2026-04-04 22:03:29'),
(218, 1, 'I', 2, 'NORMAL', 1, '2026-04-04 22:03:29'),
(219, 1, 'I', 3, 'NORMAL', 1, '2026-04-04 22:03:29'),
(220, 1, 'I', 4, 'NORMAL', 1, '2026-04-04 22:03:29'),
(221, 1, 'I', 5, 'NORMAL', 1, '2026-04-04 22:03:29'),
(222, 1, 'I', 6, 'NORMAL', 1, '2026-04-04 22:03:29'),
(223, 1, 'I', 7, 'NORMAL', 1, '2026-04-04 22:03:29'),
(224, 1, 'I', 8, 'NORMAL', 1, '2026-04-04 22:03:29'),
(225, 1, 'I', 9, 'NORMAL', 1, '2026-04-04 22:03:29'),
(226, 1, 'I', 10, 'NORMAL', 1, '2026-04-04 22:03:29'),
(227, 1, 'I', 11, 'NORMAL', 1, '2026-04-04 22:03:29'),
(228, 1, 'I', 12, 'NORMAL', 1, '2026-04-04 22:03:29'),
(229, 1, 'I', 13, 'NORMAL', 1, '2026-04-04 22:03:29'),
(230, 1, 'I', 14, 'NORMAL', 1, '2026-04-04 22:03:29'),
(231, 1, 'I', 15, 'NORMAL', 1, '2026-04-04 22:03:29'),
(232, 1, 'J', 1, 'NORMAL', 1, '2026-04-04 22:03:29'),
(233, 1, 'J', 2, 'NORMAL', 1, '2026-04-04 22:03:29'),
(234, 1, 'J', 3, 'NORMAL', 1, '2026-04-04 22:03:29'),
(235, 1, 'J', 4, 'NORMAL', 1, '2026-04-04 22:03:29'),
(236, 1, 'J', 5, 'NORMAL', 1, '2026-04-04 22:03:29'),
(237, 1, 'J', 6, 'NORMAL', 1, '2026-04-04 22:03:29'),
(238, 1, 'J', 7, 'NORMAL', 1, '2026-04-04 22:03:29'),
(239, 1, 'J', 8, 'NORMAL', 1, '2026-04-04 22:03:29'),
(240, 1, 'J', 9, 'NORMAL', 1, '2026-04-04 22:03:29'),
(241, 1, 'J', 10, 'NORMAL', 1, '2026-04-04 22:03:29'),
(242, 1, 'J', 11, 'NORMAL', 1, '2026-04-04 22:03:29'),
(243, 1, 'J', 12, 'NORMAL', 1, '2026-04-04 22:03:29'),
(244, 1, 'J', 13, 'NORMAL', 1, '2026-04-04 22:03:29'),
(245, 1, 'J', 14, 'NORMAL', 1, '2026-04-04 22:03:29'),
(246, 1, 'J', 15, 'NORMAL', 1, '2026-04-04 22:03:29'),
(247, 2, 'A', 1, 'NORMAL', 1, '2026-04-04 22:08:00'),
(248, 2, 'A', 2, 'NORMAL', 1, '2026-04-04 22:08:00'),
(249, 2, 'A', 3, 'NORMAL', 1, '2026-04-04 22:08:00'),
(250, 2, 'A', 4, 'NORMAL', 1, '2026-04-04 22:08:00'),
(251, 2, 'A', 5, 'NORMAL', 1, '2026-04-04 22:08:00'),
(252, 2, 'A', 6, 'NORMAL', 1, '2026-04-04 22:08:00'),
(253, 2, 'A', 7, 'NORMAL', 1, '2026-04-04 22:08:00'),
(254, 2, 'A', 8, 'NORMAL', 1, '2026-04-04 22:08:00'),
(255, 2, 'A', 9, 'NORMAL', 1, '2026-04-04 22:08:00'),
(256, 2, 'A', 10, 'NORMAL', 1, '2026-04-04 22:08:00'),
(257, 2, 'B', 1, 'NORMAL', 1, '2026-04-04 22:08:00'),
(258, 2, 'B', 2, 'NORMAL', 1, '2026-04-04 22:08:00'),
(259, 2, 'B', 3, 'NORMAL', 1, '2026-04-04 22:08:00'),
(260, 2, 'B', 4, 'NORMAL', 1, '2026-04-04 22:08:00'),
(261, 2, 'B', 5, 'NORMAL', 1, '2026-04-04 22:08:00'),
(262, 2, 'B', 6, 'NORMAL', 1, '2026-04-04 22:08:00'),
(263, 2, 'B', 7, 'NORMAL', 1, '2026-04-04 22:08:00'),
(264, 2, 'B', 8, 'NORMAL', 1, '2026-04-04 22:08:00'),
(265, 2, 'B', 9, 'NORMAL', 1, '2026-04-04 22:08:00'),
(266, 2, 'B', 10, 'NORMAL', 1, '2026-04-04 22:08:00'),
(267, 2, 'C', 1, 'NORMAL', 1, '2026-04-04 22:08:00'),
(268, 2, 'C', 2, 'NORMAL', 1, '2026-04-04 22:08:00'),
(269, 2, 'C', 3, 'NORMAL', 1, '2026-04-04 22:08:00'),
(270, 2, 'C', 4, 'NORMAL', 1, '2026-04-04 22:08:00'),
(271, 2, 'C', 5, 'NORMAL', 1, '2026-04-04 22:08:00'),
(272, 2, 'C', 6, 'NORMAL', 1, '2026-04-04 22:08:00'),
(273, 2, 'C', 7, 'NORMAL', 1, '2026-04-04 22:08:00'),
(274, 2, 'C', 8, 'NORMAL', 1, '2026-04-04 22:08:00'),
(275, 2, 'C', 9, 'NORMAL', 1, '2026-04-04 22:08:00'),
(276, 2, 'C', 10, 'NORMAL', 1, '2026-04-04 22:08:00'),
(277, 2, 'D', 1, 'NORMAL', 1, '2026-04-04 22:08:00'),
(278, 2, 'D', 2, 'NORMAL', 1, '2026-04-04 22:08:00'),
(279, 2, 'D', 3, 'NORMAL', 1, '2026-04-04 22:08:00'),
(280, 2, 'D', 4, 'NORMAL', 1, '2026-04-04 22:08:00'),
(281, 2, 'D', 5, 'NORMAL', 1, '2026-04-04 22:08:00'),
(282, 2, 'D', 6, 'NORMAL', 1, '2026-04-04 22:08:00'),
(283, 2, 'D', 7, 'NORMAL', 1, '2026-04-04 22:08:00'),
(284, 2, 'D', 8, 'NORMAL', 1, '2026-04-04 22:08:00'),
(285, 2, 'D', 9, 'NORMAL', 1, '2026-04-04 22:08:00'),
(286, 2, 'D', 10, 'NORMAL', 1, '2026-04-04 22:08:00'),
(287, 2, 'E', 1, 'NORMAL', 1, '2026-04-04 22:08:00'),
(288, 2, 'E', 2, 'NORMAL', 1, '2026-04-04 22:08:00'),
(289, 2, 'E', 3, 'NORMAL', 1, '2026-04-04 22:08:00'),
(290, 2, 'E', 4, 'NORMAL', 1, '2026-04-04 22:08:00'),
(291, 2, 'E', 5, 'NORMAL', 1, '2026-04-04 22:08:00'),
(292, 2, 'E', 6, 'NORMAL', 1, '2026-04-04 22:08:00'),
(293, 2, 'E', 7, 'NORMAL', 1, '2026-04-04 22:08:00'),
(294, 2, 'E', 8, 'NORMAL', 1, '2026-04-04 22:08:00'),
(295, 2, 'E', 9, 'NORMAL', 1, '2026-04-04 22:08:00'),
(296, 2, 'E', 10, 'NORMAL', 1, '2026-04-04 22:08:00'),
(297, 2, 'F', 1, 'NORMAL', 1, '2026-04-04 22:08:00'),
(298, 2, 'F', 2, 'NORMAL', 1, '2026-04-04 22:08:00'),
(299, 2, 'F', 3, 'NORMAL', 1, '2026-04-04 22:08:00'),
(300, 2, 'F', 4, 'NORMAL', 1, '2026-04-04 22:08:00'),
(301, 2, 'F', 5, 'NORMAL', 1, '2026-04-04 22:08:00'),
(302, 2, 'F', 6, 'NORMAL', 1, '2026-04-04 22:08:00'),
(303, 2, 'F', 7, 'NORMAL', 1, '2026-04-04 22:08:00'),
(304, 2, 'F', 8, 'NORMAL', 1, '2026-04-04 22:08:00'),
(305, 2, 'F', 9, 'NORMAL', 1, '2026-04-04 22:08:00'),
(306, 2, 'F', 10, 'NORMAL', 1, '2026-04-04 22:08:00'),
(307, 2, 'G', 1, 'NORMAL', 1, '2026-04-04 22:08:00'),
(308, 2, 'G', 2, 'NORMAL', 1, '2026-04-04 22:08:00'),
(309, 2, 'G', 3, 'NORMAL', 1, '2026-04-04 22:08:00'),
(310, 2, 'G', 4, 'NORMAL', 1, '2026-04-04 22:08:00'),
(311, 2, 'G', 5, 'NORMAL', 1, '2026-04-04 22:08:00'),
(312, 2, 'G', 6, 'NORMAL', 1, '2026-04-04 22:08:00'),
(313, 2, 'G', 7, 'NORMAL', 1, '2026-04-04 22:08:00'),
(314, 2, 'G', 8, 'NORMAL', 1, '2026-04-04 22:08:00'),
(315, 2, 'G', 9, 'NORMAL', 1, '2026-04-04 22:08:00'),
(316, 2, 'G', 10, 'NORMAL', 1, '2026-04-04 22:08:00'),
(317, 2, 'H', 1, 'NORMAL', 1, '2026-04-04 22:08:00'),
(318, 2, 'H', 2, 'NORMAL', 1, '2026-04-04 22:08:00'),
(319, 2, 'H', 3, 'NORMAL', 1, '2026-04-04 22:08:00'),
(320, 2, 'H', 4, 'NORMAL', 1, '2026-04-04 22:08:00'),
(321, 2, 'H', 5, 'NORMAL', 1, '2026-04-04 22:08:00'),
(322, 2, 'H', 6, 'NORMAL', 1, '2026-04-04 22:08:00'),
(323, 2, 'H', 7, 'NORMAL', 1, '2026-04-04 22:08:00'),
(324, 2, 'H', 8, 'NORMAL', 1, '2026-04-04 22:08:00'),
(325, 2, 'H', 9, 'NORMAL', 1, '2026-04-04 22:08:00'),
(326, 2, 'H', 10, 'NORMAL', 1, '2026-04-04 22:08:00');

-- --------------------------------------------------------

--
-- Table structure for table `showtimes`
--

CREATE TABLE `showtimes` (
  `id` int(11) NOT NULL,
  `movie_id` bigint(20) UNSIGNED NOT NULL,
  `room_id` int(11) NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `base_price` decimal(10,0) NOT NULL,
  `vip_price` decimal(10,0) NOT NULL,
  `couple_price` decimal(10,0) NOT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `showtimes`
--

INSERT INTO `showtimes` (`id`, `movie_id`, `room_id`, `start_time`, `end_time`, `base_price`, `vip_price`, `couple_price`, `cancelled_at`, `created_at`) VALUES
(1, 3, 1, '2026-06-01 16:00:00', '2026-06-01 18:55:00', 80000, 120000, 150000, '2026-04-05 11:42:08', '2026-04-05 11:34:48'),
(2, 3, 1, '2026-06-01 19:00:00', '2026-06-01 21:55:00', 80000, 120000, 150000, NULL, '2026-04-06 19:41:04'),
(3, 3, 2, '2026-04-26 03:30:00', '2026-04-26 06:25:00', 100000, 130000, 200000, '2026-04-14 14:50:23', '2026-04-14 14:45:32');

-- --------------------------------------------------------

--
-- Table structure for table `tickets`
--

CREATE TABLE `tickets` (
  `id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `showtime_id` int(11) NOT NULL,
  `qr_code` varchar(255) NOT NULL,
  `is_used` tinyint(1) NOT NULL DEFAULT 0,
  `used_at` datetime DEFAULT NULL,
  `issued_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tickets`
--

INSERT INTO `tickets` (`id`, `booking_id`, `user_id`, `showtime_id`, `qr_code`, `is_used`, `used_at`, `issued_at`) VALUES
(1, 5, 2, 2, '89aaa853-da84-4c85-973f-ac6494c2d970', 0, NULL, '2026-04-09 21:07:27'),
(2, 6, 2, 2, '44a11e90-4049-4637-850a-97c1253a6a3e', 0, NULL, '2026-04-10 10:10:34'),
(3, 10, 2, 2, 'd96281ea-7976-4067-9485-77778e0202ec', 0, NULL, '2026-04-16 23:10:49');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `avatar_url` varchar(500) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `avatar_url`, `phone`, `date_of_birth`, `updated_at`, `created_at`) VALUES
(1, 'Nguyen Van A', 'nguyenvana@example.com', '$2b$10$Cr3LPxkfE7k.7g7rgrjs7ON4UysS2rk.8vpQqwG3k/PEFsCws8Gaq', 'admin', NULL, NULL, NULL, NULL, '2026-04-03 17:22:12'),
(2, 'Nguyễn Hoài Nam', 'nguyenhoainam.20042005@gmail.com', '$2b$10$wFpZJXuQMvF9lYnZIfUtzOXdq0b2/Mgnb8R46vieApluUwdm/t1tu', 'admin', NULL, NULL, '2005-02-24', '2026-04-12 20:46:01', '2026-04-04 20:28:08');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_showtime_status` (`showtime_id`,`status`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indexes for table `booking_combos`
--
ALTER TABLE `booking_combos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `booking_id` (`booking_id`),
  ADD KEY `combo_id` (`combo_id`);

--
-- Indexes for table `booking_seats`
--
ALTER TABLE `booking_seats`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_booking_seat` (`booking_id`,`seat_id`),
  ADD KEY `seat_id` (`seat_id`);

--
-- Indexes for table `cinemas`
--
ALTER TABLE `cinemas`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `combos`
--
ALTER TABLE `combos`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `movies`
--
ALTER TABLE `movies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_movie_release_date` (`release_date`),
  ADD KEY `idx_movie_status_lookup` (`release_date`,`end_date`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `booking_id` (`booking_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_provider_transaction` (`provider`,`transaction_id`);

--
-- Indexes for table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_refresh_tokens_token` (`token`),
  ADD KEY `idx_refresh_tokens_user_id` (`user_id`);

--
-- Indexes for table `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cinema_id` (`cinema_id`);

--
-- Indexes for table `seats`
--
ALTER TABLE `seats`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_seat` (`room_id`,`row`,`number`);

--
-- Indexes for table `showtimes`
--
ALTER TABLE `showtimes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_room_time` (`room_id`,`start_time`,`end_time`),
  ADD KEY `idx_movie` (`movie_id`),
  ADD KEY `idx_start` (`start_time`);

--
-- Indexes for table `tickets`
--
ALTER TABLE `tickets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_tickets_qr_code` (`qr_code`),
  ADD KEY `idx_tickets_booking_id` (`booking_id`),
  ADD KEY `idx_tickets_user_id` (`user_id`),
  ADD KEY `idx_tickets_showtime_id` (`showtime_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_users_email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `booking_combos`
--
ALTER TABLE `booking_combos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `booking_seats`
--
ALTER TABLE `booking_seats`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `cinemas`
--
ALTER TABLE `cinemas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `combos`
--
ALTER TABLE `combos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `movies`
--
ALTER TABLE `movies`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `rooms`
--
ALTER TABLE `rooms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `seats`
--
ALTER TABLE `seats`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=327;

--
-- AUTO_INCREMENT for table `showtimes`
--
ALTER TABLE `showtimes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tickets`
--
ALTER TABLE `tickets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`showtime_id`) REFERENCES `showtimes` (`id`);

--
-- Constraints for table `booking_combos`
--
ALTER TABLE `booking_combos`
  ADD CONSTRAINT `booking_combos_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `booking_combos_ibfk_2` FOREIGN KEY (`combo_id`) REFERENCES `combos` (`id`);

--
-- Constraints for table `booking_seats`
--
ALTER TABLE `booking_seats`
  ADD CONSTRAINT `booking_seats_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `booking_seats_ibfk_2` FOREIGN KEY (`seat_id`) REFERENCES `seats` (`id`);

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`),
  ADD CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD CONSTRAINT `fk_refresh_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `rooms`
--
ALTER TABLE `rooms`
  ADD CONSTRAINT `rooms_ibfk_1` FOREIGN KEY (`cinema_id`) REFERENCES `cinemas` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `seats`
--
ALTER TABLE `seats`
  ADD CONSTRAINT `seats_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `showtimes`
--
ALTER TABLE `showtimes`
  ADD CONSTRAINT `showtimes_ibfk_1` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`),
  ADD CONSTRAINT `showtimes_ibfk_2` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tickets`
--
ALTER TABLE `tickets`
  ADD CONSTRAINT `tickets_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tickets_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tickets_ibfk_3` FOREIGN KEY (`showtime_id`) REFERENCES `showtimes` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
