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

--
-- Sample data for table `litebans_bans`
--

SET FOREIGN_KEY_CHECKS=0;
INSERT INTO `litebans_bans` (`uuid`, `ip`, `reason`, `banned_by_uuid`, `banned_by_name`, `removed_by_uuid`, `removed_by_name`, `removed_by_reason`, `removed_by_date`, `time`, `until`, `template`, `server_scope`, `server_origin`, `silent`, `ipban`, `ipban_wildcard`, `active`) VALUES
('96939126-8872-4011-a059-000000000001', '192.168.1.101', 'Hacking', 'Console', 'Console', NULL, NULL, NULL, CURRENT_TIMESTAMP, 1704067200000, -1, 255, 'global', 'server1', 0, 0, 0, 1),
('96939126-8872-4011-a059-000000000002', '10.0.0.5', 'Spamming', 'Console', 'Console', NULL, NULL, NULL, CURRENT_TIMESTAMP, 1704153600000, -1, 255, 'global', 'server1', 0, 0, 0, 1),
('96939126-8872-4011-a059-000000000003', '172.16.0.23', 'Griefing', 'Console', 'Console', NULL, NULL, NULL, CURRENT_TIMESTAMP, 1704240000000, -1, 255, 'global', 'server1', 0, 0, 0, 1),
('96939126-8872-4011-a059-000000000004', '192.168.0.55', 'Swearing', 'Console', 'Console', NULL, NULL, NULL, CURRENT_TIMESTAMP, 1704326400000, -1, 255, 'global', 'server1', 0, 0, 0, 1),
('96939126-8872-4011-a059-000000000005', '10.1.1.100', 'X-Ray', 'Console', 'Console', NULL, NULL, NULL, CURRENT_TIMESTAMP, 1704412800000, -1, 255, 'global', 'server1', 0, 0, 0, 1),
('96939126-8872-4011-a059-000000000006', '172.20.10.4', 'Fly Hacks', 'Console', 'Console', NULL, NULL, NULL, CURRENT_TIMESTAMP, 1704499200000, -1, 255, 'global', 'server1', 0, 0, 0, 1),
('96939126-8872-4011-a059-000000000007', '192.168.100.12', 'Kill Aura', 'Console', 'Console', NULL, NULL, NULL, CURRENT_TIMESTAMP, 1704585600000, -1, 255, 'global', 'server1', 0, 0, 0, 1),
('96939126-8872-4011-a059-000000000008', '10.2.3.4', 'Duping', 'Console', 'Console', NULL, NULL, NULL, CURRENT_TIMESTAMP, 1704672000000, -1, 255, 'global', 'server1', 0, 0, 0, 1),
('96939126-8872-4011-a059-000000000009', '172.18.0.1', 'Botting', 'Console', 'Console', NULL, NULL, NULL, CURRENT_TIMESTAMP, 1704758400000, -1, 255, 'global', 'server1', 0, 0, 0, 1),
('96939126-8872-4011-a059-000000000010', '192.168.50.50', 'Advertising', 'Console', 'Console', NULL, NULL, NULL, CURRENT_TIMESTAMP, 1704844800000, -1, 255, 'global', 'server1', 0, 0, 0, 1);
SET FOREIGN_KEY_CHECKS=1;
