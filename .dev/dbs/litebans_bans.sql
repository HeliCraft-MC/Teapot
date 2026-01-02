-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Dec 26, 2025 at 12:25 PM
-- Server version: 10.11.11-MariaDB-0+deb12u1
-- PHP Version: 8.3.24

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `bans`
--

-- --------------------------------------------------------

--
-- Table structure for table `litebans_bans`
--

CREATE TABLE `litebans_bans` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(36) CHARACTER SET ascii COLLATE ascii_general_ci DEFAULT NULL,
  `ip` varchar(45) CHARACTER SET ascii COLLATE ascii_general_ci DEFAULT NULL,
  `reason` varchar(2048) DEFAULT NULL,
  `banned_by_uuid` varchar(36) NOT NULL,
  `banned_by_name` varchar(128) DEFAULT NULL,
  `removed_by_uuid` varchar(36) DEFAULT NULL,
  `removed_by_name` varchar(128) DEFAULT NULL,
  `removed_by_reason` varchar(2048) DEFAULT NULL,
  `removed_by_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `time` bigint(20) NOT NULL,
  `until` bigint(20) NOT NULL,
  `template` tinyint(3) UNSIGNED NOT NULL DEFAULT 255,
  `server_scope` varchar(32) DEFAULT NULL,
  `server_origin` varchar(32) DEFAULT NULL,
  `silent` bit(1) NOT NULL,
  `ipban` bit(1) NOT NULL,
  `ipban_wildcard` bit(1) NOT NULL,
  `active` bit(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `litebans_bans`
--
ALTER TABLE `litebans_bans`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id` (`id`),
  ADD KEY `idx_litebans_bans_template` (`template`),
  ADD KEY `idx_litebans_bans_ipban_wildcard` (`ipban_wildcard`),
  ADD KEY `idx_litebans_bans_uuid` (`uuid`),
  ADD KEY `idx_litebans_bans_ip` (`ip`),
  ADD KEY `idx_litebans_bans_banned_by_uuid` (`banned_by_uuid`),
  ADD KEY `idx_litebans_bans_time` (`time`),
  ADD KEY `idx_litebans_bans_until` (`until`),
  ADD KEY `idx_litebans_bans_ipban` (`ipban`),
  ADD KEY `idx_litebans_bans_active` (`active`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `litebans_bans`
--
ALTER TABLE `litebans_bans`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
