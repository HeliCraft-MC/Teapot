-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Jun 28, 2025 at 02:43 PM
-- Server version: 10.11.11-MariaDB-0+deb12u1
-- PHP Version: 8.3.20

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `states`
--

-- --------------------------------------------------------

--
-- Table structure for table `alliances`
--

CREATE TABLE `alliances` (
  `uuid` char(36) NOT NULL,
  `created` bigint(20) NOT NULL,
  `updated` bigint(20) NOT NULL,
  `name` text NOT NULL,
  `description` text NOT NULL,
  `purpose` text NOT NULL,
  `color_hex` char(7) NOT NULL,
  `creator_state_uuid` char(36) NOT NULL,
  `flag_link` text NOT NULL,
  `status` enum('active','dissolved') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `alliance_members`
--

CREATE TABLE `alliance_members` (
  `uuid` char(36) NOT NULL,
  `created` bigint(20) NOT NULL,
  `updated` bigint(20) NOT NULL,
  `alliance_uuid` char(36) NOT NULL,
  `state_uuid` char(36) NOT NULL,
  `is_pending` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cities`
--

CREATE TABLE `cities` (
  `uuid` char(36) NOT NULL,
  `created` bigint(20) NOT NULL,
  `updated` bigint(20) NOT NULL,
  `name` text NOT NULL,
  `coordinates` varchar(255) NOT NULL,
  `state_uuid` char(36) DEFAULT NULL,
  `is_capital` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `history_events`
--

CREATE TABLE `history_events` (
  `uuid` char(36) NOT NULL,
  `created` bigint(20) NOT NULL,
  `updated` bigint(20) NOT NULL,
  `type` enum('state_created','state_status_changed','state_renamed','leader_changed','capital_moved','law_passed','city_founded','city_joined_state','city_left_state','city_renamed','alliance_created','alliance_member_joined','alliance_member_left','alliance_dissolved','war_declared','war_battle','war_finished','truce_signed','treaty_signed','border_changed','trade_agreement','player_promoted','player_demoted','custom') NOT NULL,
  `title` text NOT NULL,
  `description` text NOT NULL,
  `season` varchar(32) DEFAULT NULL,
  `state_uuids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`state_uuids`)),
  `player_uuids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`player_uuids`)),
  `alliance_uuids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`alliance_uuids`)),
  `war_uuid` char(36) DEFAULT NULL,
  `city_uuids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`city_uuids`)),
  `details_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details_json`)),
  `created_by_uuid` char(36) NOT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `deleted_at` bigint(20) DEFAULT NULL,
  `deleted_by_uuid` char(36) DEFAULT NULL,
  `state_uuid_first` varchar(36) GENERATED ALWAYS AS (json_unquote(json_extract(`state_uuids`,'$[0]'))) VIRTUAL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `states`
--

CREATE TABLE `states` (
  `uuid` char(36) NOT NULL,
  `created` bigint(20) NOT NULL,
  `updated` bigint(20) NOT NULL,
  `name` text NOT NULL,
  `description` text NOT NULL,
  `color_hex` char(7) NOT NULL,
  `gov_form` enum('monarchy','republic','federation','oligarchy','tribal','other') NOT NULL,
  `has_elections` tinyint(1) NOT NULL,
  `status` enum('pending','active','rejected','merged','dissolved') NOT NULL,
  `capital_uuid` char(36) DEFAULT NULL,
  `map_link` text DEFAULT NULL,
  `telegram_link` text DEFAULT NULL,
  `creator_uuid` char(36) NOT NULL,
  `ruler_uuid` char(36) NOT NULL,
  `allow_dual_citizenship` tinyint(1) NOT NULL,
  `free_entry` tinyint(1) NOT NULL,
  `free_entry_description` text DEFAULT NULL,
  `flag_link` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `state_members`
--

CREATE TABLE `state_members` (
  `uuid` char(36) NOT NULL,
  `created` bigint(20) NOT NULL,
  `updated` bigint(20) NOT NULL,
  `state_uuid` char(36) NOT NULL,
  `city_uuid` char(36) DEFAULT NULL,
  `player_uuid` char(36) NOT NULL,
  `role` enum('ruler','vice_ruler','minister','diplomat','officer','citizen','applicant') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `state_orders`
--

CREATE TABLE `state_orders` (
  `uuid` char(36) NOT NULL,
  `created` bigint(20) NOT NULL,
  `updated` bigint(20) NOT NULL,
  `state_uuid` char(36) NOT NULL,
  `title` text NOT NULL,
  `text` text NOT NULL,
  `published_at` bigint(20) NOT NULL,
  `issued_by_player_uuid` char(36) NOT NULL,
  `importance` enum('pinned','high','medium','low') NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `expires_at` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `state_relations`
--

CREATE TABLE `state_relations` (
  `uuid` char(36) NOT NULL,
  `created` bigint(20) NOT NULL,
  `updated` bigint(20) NOT NULL,
  `state_a_uuid` char(36) NOT NULL,
  `state_b_uuid` char(36) NOT NULL,
  `kind` enum('neutral','ally','enemy') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `state_relation_requests`
--

CREATE TABLE `state_relation_requests` (
  `uuid` char(36) NOT NULL,
  `created` bigint(20) NOT NULL,
  `updated` bigint(20) NOT NULL,
  `state_a_uuid` char(36) NOT NULL,
  `state_b_uuid` char(36) NOT NULL,
  `proposer_state_uuid` char(36) NOT NULL,
  `requested_kind` enum('neutral','ally','enemy') DEFAULT NULL,
  `status` enum('pending','approved','declined') NOT NULL DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `state_warrants`
--

CREATE TABLE `state_warrants` (
  `uuid` char(36) NOT NULL,
  `created` bigint(20) NOT NULL,
  `updated` bigint(20) NOT NULL,
  `state_uuid` char(36) NOT NULL,
  `affected_player_uuid` char(36) NOT NULL,
  `reason` text NOT NULL,
  `issued_by_player_uuid` char(36) NOT NULL,
  `actions_taken_by_admins` tinyint(1) NOT NULL,
  `actions_by_admins_details` text DEFAULT NULL,
  `actions_taken_by_state` tinyint(1) NOT NULL,
  `actions_by_state_details` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `wars`
--

CREATE TABLE `wars` (
  `uuid` char(36) NOT NULL,
  `created` bigint(20) NOT NULL,
  `updated` bigint(20) NOT NULL,
  `name` text NOT NULL,
  `reason` text NOT NULL,
  `victory_condition` text NOT NULL,
  `status` enum('proposed','accepted','declined','cancelled','scheduled','ongoing','ended') NOT NULL,
  `result` text DEFAULT NULL,
  `result_action` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `war_battles`
--

CREATE TABLE `war_battles` (
  `uuid` char(36) NOT NULL,
  `created` bigint(20) NOT NULL,
  `updated` bigint(20) NOT NULL,
  `war_uuid` char(36) NOT NULL,
  `name` text NOT NULL,
  `description` text NOT NULL,
  `type` enum('field_battle','siege','flag_capture','scenario','duel_tournament') NOT NULL,
  `status` enum('proposed','accepted','declined','cancelled','scheduled','ongoing','ended') NOT NULL,
  `result` text DEFAULT NULL,
  `start_date` bigint(20) NOT NULL,
  `end_date` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `war_participants`
--

CREATE TABLE `war_participants` (
  `uuid` char(36) NOT NULL,
  `created` bigint(20) NOT NULL,
  `updated` bigint(20) NOT NULL,
  `war_uuid` char(36) NOT NULL,
  `state_uuid` char(36) NOT NULL,
  `side_role` enum('attacker','defender','ally_attacker','ally_defender') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `alliances`
--
ALTER TABLE `alliances`
  ADD PRIMARY KEY (`uuid`),
  ADD KEY `creator_state_uuid` (`creator_state_uuid`);

--
-- Indexes for table `alliance_members`
--
ALTER TABLE `alliance_members`
  ADD PRIMARY KEY (`uuid`),
  ADD KEY `alliance_uuid` (`alliance_uuid`),
  ADD KEY `state_uuid` (`state_uuid`);

--
-- Indexes for table `cities`
--
ALTER TABLE `cities`
  ADD PRIMARY KEY (`uuid`),
  ADD KEY `state_uuid` (`state_uuid`);

--
-- Indexes for table `history_events`
--
ALTER TABLE `history_events`
  ADD PRIMARY KEY (`uuid`),
  ADD KEY `war_uuid` (`war_uuid`),
  ADD KEY `created_by_uuid` (`created_by_uuid`),
  ADD KEY `idx_history_created` (`created`),
  ADD KEY `idx_state_uuid_first` (`state_uuid_first`);
ALTER TABLE `history_events` ADD FULLTEXT KEY `ft_title_desc` (`title`,`description`);

--
-- Indexes for table `states`
--
ALTER TABLE `states`
  ADD PRIMARY KEY (`uuid`),
  ADD KEY `capital_uuid` (`capital_uuid`),
  ADD KEY `creator_uuid` (`creator_uuid`),
  ADD KEY `ruler_uuid` (`ruler_uuid`);

--
-- Indexes for table `state_members`
--
ALTER TABLE `state_members`
  ADD PRIMARY KEY (`uuid`),
  ADD KEY `state_uuid` (`state_uuid`),
  ADD KEY `city_uuid` (`city_uuid`);

--
-- Indexes for table `state_orders`
--
ALTER TABLE `state_orders`
  ADD PRIMARY KEY (`uuid`),
  ADD KEY `state_uuid` (`state_uuid`);

--
-- Indexes for table `state_relations`
--
ALTER TABLE `state_relations`
  ADD PRIMARY KEY (`uuid`),
  ADD UNIQUE KEY `uniq_pair` (`state_a_uuid`,`state_b_uuid`),
  ADD KEY `state_a_uuid` (`state_a_uuid`),
  ADD KEY `state_b_uuid` (`state_b_uuid`);

--
-- Indexes for table `state_relation_requests`
--
ALTER TABLE `state_relation_requests`
  ADD PRIMARY KEY (`uuid`),
  ADD UNIQUE KEY `uniq_pair_pending` (`state_a_uuid`,`state_b_uuid`,`status`),
  ADD KEY `idx_state_a` (`state_a_uuid`),
  ADD KEY `idx_state_b` (`state_b_uuid`),
  ADD KEY `idx_proposer` (`proposer_state_uuid`);

--
-- Indexes for table `state_warrants`
--
ALTER TABLE `state_warrants`
  ADD PRIMARY KEY (`uuid`),
  ADD KEY `state_uuid` (`state_uuid`);

--
-- Indexes for table `wars`
--
ALTER TABLE `wars`
  ADD PRIMARY KEY (`uuid`);

--
-- Indexes for table `war_battles`
--
ALTER TABLE `war_battles`
  ADD PRIMARY KEY (`uuid`),
  ADD KEY `war_uuid` (`war_uuid`);

--
-- Indexes for table `war_participants`
--
ALTER TABLE `war_participants`
  ADD PRIMARY KEY (`uuid`),
  ADD KEY `war_uuid` (`war_uuid`),
  ADD KEY `state_uuid` (`state_uuid`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `alliances`
--
ALTER TABLE `alliances`
  ADD CONSTRAINT `alliances_ibfk_1` FOREIGN KEY (`creator_state_uuid`) REFERENCES `states` (`uuid`);

--
-- Constraints for table `alliance_members`
--
ALTER TABLE `alliance_members`
  ADD CONSTRAINT `alliance_members_ibfk_1` FOREIGN KEY (`alliance_uuid`) REFERENCES `alliances` (`uuid`) ON DELETE CASCADE,
  ADD CONSTRAINT `alliance_members_ibfk_2` FOREIGN KEY (`state_uuid`) REFERENCES `states` (`uuid`);

--
-- Constraints for table `cities`
--
ALTER TABLE `cities`
  ADD CONSTRAINT `cities_ibfk_1` FOREIGN KEY (`state_uuid`) REFERENCES `states` (`uuid`);

--
-- Constraints for table `history_events`
--
ALTER TABLE `history_events`
  ADD CONSTRAINT `history_events_ibfk_1` FOREIGN KEY (`war_uuid`) REFERENCES `wars` (`uuid`);

--
-- Constraints for table `state_members`
--
ALTER TABLE `state_members`
  ADD CONSTRAINT `state_members_ibfk_1` FOREIGN KEY (`state_uuid`) REFERENCES `states` (`uuid`) ON DELETE CASCADE,
  ADD CONSTRAINT `state_members_ibfk_2` FOREIGN KEY (`city_uuid`) REFERENCES `cities` (`uuid`) ON DELETE SET NULL;

--
-- Constraints for table `state_orders`
--
ALTER TABLE `state_orders`
  ADD CONSTRAINT `state_orders_ibfk_1` FOREIGN KEY (`state_uuid`) REFERENCES `states` (`uuid`) ON DELETE CASCADE;

--
-- Constraints for table `state_relations`
--
ALTER TABLE `state_relations`
  ADD CONSTRAINT `state_relations_ibfk_1` FOREIGN KEY (`state_a_uuid`) REFERENCES `states` (`uuid`) ON DELETE CASCADE,
  ADD CONSTRAINT `state_relations_ibfk_2` FOREIGN KEY (`state_b_uuid`) REFERENCES `states` (`uuid`) ON DELETE CASCADE;

--
-- Constraints for table `state_relation_requests`
--
ALTER TABLE `state_relation_requests`
  ADD CONSTRAINT `fk_srr_proposer` FOREIGN KEY (`proposer_state_uuid`) REFERENCES `states` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_srr_state_a` FOREIGN KEY (`state_a_uuid`) REFERENCES `states` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_srr_state_b` FOREIGN KEY (`state_b_uuid`) REFERENCES `states` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `state_warrants`
--
ALTER TABLE `state_warrants`
  ADD CONSTRAINT `state_warrants_ibfk_1` FOREIGN KEY (`state_uuid`) REFERENCES `states` (`uuid`) ON DELETE CASCADE;

--
-- Constraints for table `war_battles`
--
ALTER TABLE `war_battles`
  ADD CONSTRAINT `war_battles_ibfk_1` FOREIGN KEY (`war_uuid`) REFERENCES `wars` (`uuid`) ON DELETE CASCADE;

--
-- Constraints for table `war_participants`
--
ALTER TABLE `war_participants`
  ADD CONSTRAINT `war_participants_ibfk_1` FOREIGN KEY (`war_uuid`) REFERENCES `wars` (`uuid`) ON DELETE CASCADE,
  ADD CONSTRAINT `war_participants_ibfk_2` FOREIGN KEY (`state_uuid`) REFERENCES `states` (`uuid`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

--
-- Sample data for table `states`
--

SET FOREIGN_KEY_CHECKS=0;
INSERT INTO `states` (`uuid`, `created`, `updated`, `name`, `description`, `color_hex`, `gov_form`, `has_elections`, `status`, `capital_uuid`, `map_link`, `telegram_link`, `creator_uuid`, `ruler_uuid`, `allow_dual_citizenship`, `free_entry`, `free_entry_description`, `flag_link`) VALUES
('50e1b0e2-f0f6-4e36-b01b-000000000001', 1672531200000, 1704067200000, 'Imperium of Man', 'For the Emperor!', '#FF0000', 'monarchy', 0, 'active', '06900213-4464-4206-80c2-000000000001', NULL, NULL, '96939126-8872-4011-a059-000000000001', '96939126-8872-4011-a059-000000000001', 0, 1, 'Enlist today!', 'https://picsum.photos/seed/imperium/200/300'),
('50e1b0e2-f0f6-4e36-b01b-000000000002', 1675209600000, 1704153600000, 'Galactic Republic', 'Democracy and Peace', '#0000FF', 'republic', 1, 'active', '06900213-4464-4206-80c2-000000000002', NULL, NULL, '96939126-8872-4011-a059-000000000002', '96939126-8872-4011-a059-000000000002', 1, 1, 'Welcome to the Senate', 'https://picsum.photos/seed/republic/200/300'),
('50e1b0e2-f0f6-4e36-b01b-000000000003', 1677628800000, 1704240000000, 'United Federation', 'To boldly go', '#00FF00', 'federation', 1, 'active', '06900213-4464-4206-80c2-000000000003', NULL, NULL, '96939126-8872-4011-a059-000000000003', '96939126-8872-4011-a059-000000000003', 1, 1, 'Join Starfleet', 'https://picsum.photos/seed/federation/200/300'),
('50e1b0e2-f0f6-4e36-b01b-000000000004', 1680307200000, 1704326400000, 'Kingdom of Hyrule', 'Triforce of Wisdom', '#FFFF00', 'monarchy', 0, 'active', '06900213-4464-4206-80c2-000000000004', NULL, NULL, '96939126-8872-4011-a059-000000000004', '96939126-8872-4011-a059-000000000004', 0, 1, 'Open gates', 'https://picsum.photos/seed/hyrule/200/300'),
('50e1b0e2-f0f6-4e36-b01b-000000000005', 1682899200000, 1704412800000, 'Mushroom Kingdom', 'Peachy', '#FF00FF', 'monarchy', 0, 'active', '06900213-4464-4206-80c2-000000000005', NULL, NULL, '96939126-8872-4011-a059-000000000005', '96939126-8872-4011-a059-000000000005', 1, 1, 'Wahoo!', 'https://picsum.photos/seed/mushroom/200/300'),
('50e1b0e2-f0f6-4e36-b01b-000000000006', 1685577600000, 1704499200000, 'Azeroth', 'For the Alliance', '#00FFFF', 'federation', 0, 'active', '06900213-4464-4206-80c2-000000000006', NULL, NULL, '96939126-8872-4011-a059-000000000006', '96939126-8872-4011-a059-000000000006', 0, 0, NULL, 'https://picsum.photos/seed/azeroth/200/300'),
('50e1b0e2-f0f6-4e36-b01b-000000000007', 1688169600000, 1704585600000, 'Skyrim', 'For the Nords', '#FFFFFF', 'oligarchy', 0, 'active', '06900213-4464-4206-80c2-000000000007', NULL, NULL, '96939126-8872-4011-a059-000000000007', '96939126-8872-4011-a059-000000000007', 0, 1, 'Hey you, finally awake', 'https://picsum.photos/seed/skyrim/200/300'),
('50e1b0e2-f0f6-4e36-b01b-000000000008', 1690848000000, 1704672000000, 'Gondor', 'White Tree', '#000000', 'monarchy', 0, 'active', '06900213-4464-4206-80c2-000000000008', NULL, NULL, '96939126-8872-4011-a059-000000000008', '96939126-8872-4011-a059-000000000008', 0, 0, NULL, 'https://picsum.photos/seed/gondor/200/300'),
('50e1b0e2-f0f6-4e36-b01b-000000000009', 1693526400000, 1704758400000, 'Mordor', 'One does not simply walk', '#333333', 'oligarchy', 0, 'active', '06900213-4464-4206-80c2-000000000009', NULL, NULL, '96939126-8872-4011-a059-000000000009', '96939126-8872-4011-a059-000000000009', 0, 0, NULL, 'https://picsum.photos/seed/mordor/200/300'),
('50e1b0e2-f0f6-4e36-b01b-000000000010', 1696118400000, 1704844800000, 'Rohan', 'Horse Lords', '#008800', 'monarchy', 0, 'active', '06900213-4464-4206-80c2-000000000010', NULL, NULL, '96939126-8872-4011-a059-000000000010', '96939126-8872-4011-a059-000000000010', 0, 1, 'Ride now!', 'https://picsum.photos/seed/rohan/200/300');

-- --------------------------------------------------------
-- Data for table `cities`
-- --------------------------------------------------------
INSERT INTO `cities` (`uuid`, `created`, `updated`, `name`, `coordinates`, `state_uuid`, `is_capital`) VALUES
('06900213-4464-4206-80c2-000000000001', 1672531200000, 1704067200000, 'Terra', '0,64,0', '50e1b0e2-f0f6-4e36-b01b-000000000001', 1),
('06900213-4464-4206-80c2-000000000002', 1675209600000, 1704153600000, 'Coruscant', '1000,100,1000', '50e1b0e2-f0f6-4e36-b01b-000000000002', 1),
('06900213-4464-4206-80c2-000000000003', 1677628800000, 1704240000000, 'San Francisco', '500,64,-500', '50e1b0e2-f0f6-4e36-b01b-000000000003', 1),
('06900213-4464-4206-80c2-000000000004', 1680307200000, 1704326400000, 'Hyrule Castle Town', '200,70,200', '50e1b0e2-f0f6-4e36-b01b-000000000004', 1),
('06900213-4464-4206-80c2-000000000005', 1682899200000, 1704412800000, 'Toad Town', '-100,64,-100', '50e1b0e2-f0f6-4e36-b01b-000000000005', 1),
('06900213-4464-4206-80c2-000000000006', 1685577600000, 1704499200000, 'Stormwind', '3000,64,3000', '50e1b0e2-f0f6-4e36-b01b-000000000006', 1),
('06900213-4464-4206-80c2-000000000007', 1688169600000, 1704585600000, 'Solitude', '-2000,120,-2000', '50e1b0e2-f0f6-4e36-b01b-000000000007', 1),
('06900213-4464-4206-80c2-000000000008', 1690848000000, 1704672000000, 'Minas Tirith', '5000,200,5000', '50e1b0e2-f0f6-4e36-b01b-000000000008', 1),
('06900213-4464-4206-80c2-000000000009', 1693526400000, 1704758400000, 'Barad-dur', '6000,64,6000', '50e1b0e2-f0f6-4e36-b01b-000000000009', 1),
('06900213-4464-4206-80c2-000000000010', 1696118400000, 1704844800000, 'Edoras', '4000,80,4000', '50e1b0e2-f0f6-4e36-b01b-000000000010', 1);

-- --------------------------------------------------------
-- Data for table `alliances`
-- --------------------------------------------------------
INSERT INTO `alliances` (`uuid`, `created`, `updated`, `name`, `description`, `purpose`, `color_hex`, `creator_state_uuid`, `flag_link`, `status`) VALUES
('75604108-c035-4309-9060-000000000001', 1672531200000, 1704067200000, 'The Grand Alliance', 'Order and Justice', 'Peace', '#0000FF', '50e1b0e2-f0f6-4e36-b01b-000000000001', 'https://picsum.photos/seed/grand/200/300', 'active'),
('75604108-c035-4309-9060-000000000002', 1675209600000, 1704153600000, 'Axis of Chaos', 'Destruction', 'War', '#FF0000', '50e1b0e2-f0f6-4e36-b01b-000000000009', 'https://picsum.photos/seed/chaos/200/300', 'active'),
('75604108-c035-4309-9060-000000000003', 1677628800000, 1704240000000, 'Trade Federation', 'Profit', 'Trade', '#FFFF00', '50e1b0e2-f0f6-4e36-b01b-000000000002', 'https://picsum.photos/seed/trade/200/300', 'active'),
('75604108-c035-4309-9060-000000000004', 1680307200000, 1704326400000, 'Northern Pact', 'Winter is Coming', 'Defense', '#FFFFFF', '50e1b0e2-f0f6-4e36-b01b-000000000007', 'https://picsum.photos/seed/north/200/300', 'active'),
('75604108-c035-4309-9060-000000000005', 1682899200000, 1704412800000, 'Magic Council', 'Arcane Arts', 'Science', '#FF00FF', '50e1b0e2-f0f6-4e36-b01b-000000000004', 'https://picsum.photos/seed/magic/200/300', 'active'),
('75604108-c035-4309-9060-000000000006', 1685577600000, 1704499200000, 'United Nations', 'Diplomacy', 'Political', '#00FFFF', '50e1b0e2-f0f6-4e36-b01b-000000000003', 'https://picsum.photos/seed/un/200/300', 'active'),
('75604108-c035-4309-9060-000000000007', 1688169600000, 1704585600000, 'Horde', 'Loktar Ogar', 'Military', '#880000', '50e1b0e2-f0f6-4e36-b01b-000000000006', 'https://picsum.photos/seed/horde/200/300', 'active'),
('75604108-c035-4309-9060-000000000008', 1690848000000, 1704672000000, 'Fellowship', 'Ring bearers', 'Adventure', '#008800', '50e1b0e2-f0f6-4e36-b01b-000000000008', 'https://picsum.photos/seed/fellowship/200/300', 'active'),
('75604108-c035-4309-9060-000000000009', 1693526400000, 1704758400000, 'Builders Guild', 'We build', 'Construction', '#FFA500', '50e1b0e2-f0f6-4e36-b01b-000000000005', 'https://picsum.photos/seed/builders/200/300', 'active'),
('75604108-c035-4309-9060-000000000010', 1696118400000, 1704844800000, 'Riders of Rohan', 'Horses', 'Military', '#004400', '50e1b0e2-f0f6-4e36-b01b-000000000010', 'https://picsum.photos/seed/riders/200/300', 'active');

-- --------------------------------------------------------
-- Data for table `alliance_members`
-- --------------------------------------------------------
INSERT INTO `alliance_members` (`uuid`, `created`, `updated`, `alliance_uuid`, `state_uuid`, `is_pending`) VALUES
('85604108-c035-4309-9060-000000000001', 1672531200000, 1704067200000, '75604108-c035-4309-9060-000000000001', '50e1b0e2-f0f6-4e36-b01b-000000000001', 0),
('85604108-c035-4309-9060-000000000002', 1675209600000, 1704153600000, '75604108-c035-4309-9060-000000000002', '50e1b0e2-f0f6-4e36-b01b-000000000009', 0),
('85604108-c035-4309-9060-000000000003', 1677628800000, 1704240000000, '75604108-c035-4309-9060-000000000003', '50e1b0e2-f0f6-4e36-b01b-000000000002', 0),
('85604108-c035-4309-9060-000000000004', 1680307200000, 1704326400000, '75604108-c035-4309-9060-000000000004', '50e1b0e2-f0f6-4e36-b01b-000000000007', 0),
('85604108-c035-4309-9060-000000000005', 1682899200000, 1704412800000, '75604108-c035-4309-9060-000000000005', '50e1b0e2-f0f6-4e36-b01b-000000000004', 0),
('85604108-c035-4309-9060-000000000006', 1685577600000, 1704499200000, '75604108-c035-4309-9060-000000000006', '50e1b0e2-f0f6-4e36-b01b-000000000003', 0),
('85604108-c035-4309-9060-000000000007', 1688169600000, 1704585600000, '75604108-c035-4309-9060-000000000007', '50e1b0e2-f0f6-4e36-b01b-000000000006', 0),
('85604108-c035-4309-9060-000000000008', 1690848000000, 1704672000000, '75604108-c035-4309-9060-000000000008', '50e1b0e2-f0f6-4e36-b01b-000000000008', 0),
('85604108-c035-4309-9060-000000000009', 1693526400000, 1704758400000, '75604108-c035-4309-9060-000000000009', '50e1b0e2-f0f6-4e36-b01b-000000000005', 0),
('85604108-c035-4309-9060-000000000010', 1696118400000, 1704844800000, '75604108-c035-4309-9060-000000000010', '50e1b0e2-f0f6-4e36-b01b-000000000010', 0);

-- --------------------------------------------------------
-- Data for table `state_members`
-- --------------------------------------------------------
INSERT INTO `state_members` (`uuid`, `created`, `updated`, `state_uuid`, `city_uuid`, `player_uuid`, `role`) VALUES
('550e8400-e29b-41d4-a716-000000000001', 1672531200000, 1704067200000, '50e1b0e2-f0f6-4e36-b01b-000000000001', '06900213-4464-4206-80c2-000000000001', '96939126-8872-4011-a059-000000000001', 'ruler'),
('550e8400-e29b-41d4-a716-000000000002', 1675209600000, 1704153600000, '50e1b0e2-f0f6-4e36-b01b-000000000002', '06900213-4464-4206-80c2-000000000002', '96939126-8872-4011-a059-000000000002', 'ruler'),
('550e8400-e29b-41d4-a716-000000000003', 1677628800000, 1704240000000, '50e1b0e2-f0f6-4e36-b01b-000000000003', '06900213-4464-4206-80c2-000000000003', '96939126-8872-4011-a059-000000000003', 'ruler'),
('550e8400-e29b-41d4-a716-000000000004', 1680307200000, 1704326400000, '50e1b0e2-f0f6-4e36-b01b-000000000004', '06900213-4464-4206-80c2-000000000004', '96939126-8872-4011-a059-000000000004', 'ruler'),
('550e8400-e29b-41d4-a716-000000000005', 1682899200000, 1704412800000, '50e1b0e2-f0f6-4e36-b01b-000000000005', '06900213-4464-4206-80c2-000000000005', '96939126-8872-4011-a059-000000000005', 'ruler'),
('550e8400-e29b-41d4-a716-000000000006', 1685577600000, 1704499200000, '50e1b0e2-f0f6-4e36-b01b-000000000006', '06900213-4464-4206-80c2-000000000006', '96939126-8872-4011-a059-000000000006', 'ruler'),
('550e8400-e29b-41d4-a716-000000000007', 1688169600000, 1704585600000, '50e1b0e2-f0f6-4e36-b01b-000000000007', '06900213-4464-4206-80c2-000000000007', '96939126-8872-4011-a059-000000000007', 'ruler'),
('550e8400-e29b-41d4-a716-000000000008', 1690848000000, 1704672000000, '50e1b0e2-f0f6-4e36-b01b-000000000008', '06900213-4464-4206-80c2-000000000008', '96939126-8872-4011-a059-000000000008', 'ruler'),
('550e8400-e29b-41d4-a716-000000000009', 1693526400000, 1704758400000, '50e1b0e2-f0f6-4e36-b01b-000000000009', '06900213-4464-4206-80c2-000000000009', '96939126-8872-4011-a059-000000000009', 'ruler'),
('550e8400-e29b-41d4-a716-000000000010', 1696118400000, 1704844800000, '50e1b0e2-f0f6-4e36-b01b-000000000010', '06900213-4464-4206-80c2-000000000010', '96939126-8872-4011-a059-000000000010', 'ruler');

-- --------------------------------------------------------
-- Data for table `state_orders`
-- --------------------------------------------------------
INSERT INTO `state_orders` (`uuid`, `created`, `updated`, `state_uuid`, `title`, `text`, `published_at`, `issued_by_player_uuid`, `importance`, `is_active`, `expires_at`) VALUES
('660e8400-e29b-41d4-a716-000000000001', 1672531200000, 1704067200000, '50e1b0e2-f0f6-4e36-b01b-000000000001', 'Mobilization', 'All citizens must enlist.', 1704067200000, '96939126-8872-4011-a059-000000000001', 'high', 1, NULL),
('660e8400-e29b-41d4-a716-000000000002', 1675209600000, 1704153600000, '50e1b0e2-f0f6-4e36-b01b-000000000002', 'Tax Reform', 'Taxes lowered by 5%.', 1704153600000, '96939126-8872-4011-a059-000000000002', 'medium', 1, NULL),
('660e8400-e29b-41d4-a716-000000000003', 1677628800000, 1704240000000, '50e1b0e2-f0f6-4e36-b01b-000000000003', 'Exploration', 'New planet discovered.', 1704240000000, '96939126-8872-4011-a059-000000000003', 'low', 1, NULL),
('660e8400-e29b-41d4-a716-000000000004', 1680307200000, 1704326400000, '50e1b0e2-f0f6-4e36-b01b-000000000004', 'Festival', 'Festival of Time next week.', 1704326400000, '96939126-8872-4011-a059-000000000004', 'pinned', 1, NULL),
('660e8400-e29b-41d4-a716-000000000005', 1682899200000, 1704412800000, '50e1b0e2-f0f6-4e36-b01b-000000000005', 'Kart Racing', 'Grand Prix announced.', 1704412800000, '96939126-8872-4011-a059-000000000005', 'high', 1, NULL),
('660e8400-e29b-41d4-a716-000000000006', 1685577600000, 1704499200000, '50e1b0e2-f0f6-4e36-b01b-000000000006', 'War Preparations', 'Prepare for battle.', 1704499200000, '96939126-8872-4011-a059-000000000006', 'medium', 1, NULL),
('660e8400-e29b-41d4-a716-000000000007', 1688169600000, 1704585600000, '50e1b0e2-f0f6-4e36-b01b-000000000007', 'Dragon Sighting', 'Watch the skies.', 1704585600000, '96939126-8872-4011-a059-000000000007', 'low', 1, NULL),
('660e8400-e29b-41d4-a716-000000000008', 1690848000000, 1704672000000, '50e1b0e2-f0f6-4e36-b01b-000000000008', 'Coronation', 'King returns.', 1704672000000, '96939126-8872-4011-a059-000000000008', 'pinned', 1, NULL),
('660e8400-e29b-41d4-a716-000000000009', 1693526400000, 1704758400000, '50e1b0e2-f0f6-4e36-b01b-000000000009', 'Curfew', 'No one leaves after dark.', 1704758400000, '96939126-8872-4011-a059-000000000009', 'high', 1, NULL),
('660e8400-e29b-41d4-a716-000000000010', 1696118400000, 1704844800000, '50e1b0e2-f0f6-4e36-b01b-000000000010', 'Muster the Rohirrim', 'To Isengard!', 1704844800000, '96939126-8872-4011-a059-000000000010', 'medium', 1, NULL);

-- --------------------------------------------------------
-- Data for table `state_relations`
-- --------------------------------------------------------
INSERT INTO `state_relations` (`uuid`, `created`, `updated`, `state_a_uuid`, `state_b_uuid`, `kind`) VALUES
('770e8400-e29b-41d4-a716-000000000001', 1672531200000, 1704067200000, '50e1b0e2-f0f6-4e36-b01b-000000000001', '50e1b0e2-f0f6-4e36-b01b-000000000002', 'neutral'),
('770e8400-e29b-41d4-a716-000000000002', 1675209600000, 1704153600000, '50e1b0e2-f0f6-4e36-b01b-000000000002', '50e1b0e2-f0f6-4e36-b01b-000000000003', 'ally'),
('770e8400-e29b-41d4-a716-000000000003', 1677628800000, 1704240000000, '50e1b0e2-f0f6-4e36-b01b-000000000003', '50e1b0e2-f0f6-4e36-b01b-000000000004', 'enemy'),
('770e8400-e29b-41d4-a716-000000000004', 1680307200000, 1704326400000, '50e1b0e2-f0f6-4e36-b01b-000000000004', '50e1b0e2-f0f6-4e36-b01b-000000000005', 'neutral'),
('770e8400-e29b-41d4-a716-000000000005', 1682899200000, 1704412800000, '50e1b0e2-f0f6-4e36-b01b-000000000005', '50e1b0e2-f0f6-4e36-b01b-000000000006', 'ally'),
('770e8400-e29b-41d4-a716-000000000006', 1685577600000, 1704499200000, '50e1b0e2-f0f6-4e36-b01b-000000000006', '50e1b0e2-f0f6-4e36-b01b-000000000007', 'enemy'),
('770e8400-e29b-41d4-a716-000000000007', 1688169600000, 1704585600000, '50e1b0e2-f0f6-4e36-b01b-000000000007', '50e1b0e2-f0f6-4e36-b01b-000000000008', 'neutral'),
('770e8400-e29b-41d4-a716-000000000008', 1690848000000, 1704672000000, '50e1b0e2-f0f6-4e36-b01b-000000000008', '50e1b0e2-f0f6-4e36-b01b-000000000009', 'ally'),
('770e8400-e29b-41d4-a716-000000000009', 1693526400000, 1704758400000, '50e1b0e2-f0f6-4e36-b01b-000000000009', '50e1b0e2-f0f6-4e36-b01b-000000000010', 'enemy'),
('770e8400-e29b-41d4-a716-000000000010', 1696118400000, 1704844800000, '50e1b0e2-f0f6-4e36-b01b-000000000010', '50e1b0e2-f0f6-4e36-b01b-000000000001', 'neutral');

-- --------------------------------------------------------
-- Data for table `state_relation_requests`
-- --------------------------------------------------------
INSERT INTO `state_relation_requests` (`uuid`, `created`, `updated`, `state_a_uuid`, `state_b_uuid`, `proposer_state_uuid`, `requested_kind`, `status`) VALUES
('880e8400-e29b-41d4-a716-000000000001', 1672531200000, 1704067200000, '50e1b0e2-f0f6-4e36-b01b-000000000001', '50e1b0e2-f0f6-4e36-b01b-000000000003', '50e1b0e2-f0f6-4e36-b01b-000000000001', 'ally', 'pending'),
('880e8400-e29b-41d4-a716-000000000002', 1675209600000, 1704153600000, '50e1b0e2-f0f6-4e36-b01b-000000000002', '50e1b0e2-f0f6-4e36-b01b-000000000004', '50e1b0e2-f0f6-4e36-b01b-000000000002', 'neutral', 'pending'),
('880e8400-e29b-41d4-a716-000000000003', 1677628800000, 1704240000000, '50e1b0e2-f0f6-4e36-b01b-000000000003', '50e1b0e2-f0f6-4e36-b01b-000000000005', '50e1b0e2-f0f6-4e36-b01b-000000000003', 'enemy', 'pending'),
('880e8400-e29b-41d4-a716-000000000004', 1680307200000, 1704326400000, '50e1b0e2-f0f6-4e36-b01b-000000000004', '50e1b0e2-f0f6-4e36-b01b-000000000006', '50e1b0e2-f0f6-4e36-b01b-000000000004', 'ally', 'pending'),
('880e8400-e29b-41d4-a716-000000000005', 1682899200000, 1704412800000, '50e1b0e2-f0f6-4e36-b01b-000000000005', '50e1b0e2-f0f6-4e36-b01b-000000000007', '50e1b0e2-f0f6-4e36-b01b-000000000005', 'neutral', 'pending'),
('880e8400-e29b-41d4-a716-000000000006', 1685577600000, 1704499200000, '50e1b0e2-f0f6-4e36-b01b-000000000006', '50e1b0e2-f0f6-4e36-b01b-000000000008', '50e1b0e2-f0f6-4e36-b01b-000000000006', 'enemy', 'pending'),
('880e8400-e29b-41d4-a716-000000000007', 1688169600000, 1704585600000, '50e1b0e2-f0f6-4e36-b01b-000000000007', '50e1b0e2-f0f6-4e36-b01b-000000000009', '50e1b0e2-f0f6-4e36-b01b-000000000007', 'ally', 'pending'),
('880e8400-e29b-41d4-a716-000000000008', 1690848000000, 1704672000000, '50e1b0e2-f0f6-4e36-b01b-000000000008', '50e1b0e2-f0f6-4e36-b01b-000000000010', '50e1b0e2-f0f6-4e36-b01b-000000000008', 'neutral', 'pending'),
('880e8400-e29b-41d4-a716-000000000009', 1693526400000, 1704758400000, '50e1b0e2-f0f6-4e36-b01b-000000000009', '50e1b0e2-f0f6-4e36-b01b-000000000001', '50e1b0e2-f0f6-4e36-b01b-000000000009', 'enemy', 'pending'),
('880e8400-e29b-41d4-a716-000000000010', 1696118400000, 1704844800000, '50e1b0e2-f0f6-4e36-b01b-000000000010', '50e1b0e2-f0f6-4e36-b01b-000000000002', '50e1b0e2-f0f6-4e36-b01b-000000000010', 'ally', 'pending');

-- --------------------------------------------------------
-- Data for table `state_warrants`
-- --------------------------------------------------------
INSERT INTO `state_warrants` (`uuid`, `created`, `updated`, `state_uuid`, `affected_player_uuid`, `reason`, `issued_by_player_uuid`, `actions_taken_by_admins`, `actions_by_admins_details`, `actions_taken_by_state`, `actions_by_state_details`) VALUES
('990e8400-e29b-41d4-a716-000000000001', 1672531200000, 1704067200000, '50e1b0e2-f0f6-4e36-b01b-000000000001', '96939126-8872-4011-a059-000000000002', 'Heresy', '96939126-8872-4011-a059-000000000001', 0, NULL, 0, NULL),
('990e8400-e29b-41d4-a716-000000000002', 1675209600000, 1704153600000, '50e1b0e2-f0f6-4e36-b01b-000000000002', '96939126-8872-4011-a059-000000000003', 'Treason', '96939126-8872-4011-a059-000000000002', 0, NULL, 0, NULL),
('990e8400-e29b-41d4-a716-000000000003', 1677628800000, 1704240000000, '50e1b0e2-f0f6-4e36-b01b-000000000003', '96939126-8872-4011-a059-000000000004', 'Theft', '96939126-8872-4011-a059-000000000003', 0, NULL, 0, NULL),
('990e8400-e29b-41d4-a716-000000000004', 1680307200000, 1704326400000, '50e1b0e2-f0f6-4e36-b01b-000000000004', '96939126-8872-4011-a059-000000000005', 'Murder', '96939126-8872-4011-a059-000000000004', 0, NULL, 0, NULL),
('990e8400-e29b-41d4-a716-000000000005', 1682899200000, 1704412800000, '50e1b0e2-f0f6-4e36-b01b-000000000005', '96939126-8872-4011-a059-000000000006', 'Vandalism', '96939126-8872-4011-a059-000000000005', 0, NULL, 0, NULL),
('990e8400-e29b-41d4-a716-000000000006', 1685577600000, 1704499200000, '50e1b0e2-f0f6-4e36-b01b-000000000006', '96939126-8872-4011-a059-000000000007', 'Spying', '96939126-8872-4011-a059-000000000006', 0, NULL, 0, NULL),
('990e8400-e29b-41d4-a716-000000000007', 1688169600000, 1704585600000, '50e1b0e2-f0f6-4e36-b01b-000000000007', '96939126-8872-4011-a059-000000000008', 'Smuggling', '96939126-8872-4011-a059-000000000007', 0, NULL, 0, NULL),
('990e8400-e29b-41d4-a716-000000000008', 1690848000000, 1704672000000, '50e1b0e2-f0f6-4e36-b01b-000000000008', '96939126-8872-4011-a059-000000000009', 'Desertion', '96939126-8872-4011-a059-000000000008', 0, NULL, 0, NULL),
('990e8400-e29b-41d4-a716-000000000009', 1693526400000, 1704758400000, '50e1b0e2-f0f6-4e36-b01b-000000000009', '96939126-8872-4011-a059-000000000010', 'Trespassing', '96939126-8872-4011-a059-000000000009', 0, NULL, 0, NULL),
('990e8400-e29b-41d4-a716-000000000010', 1696118400000, 1704844800000, '50e1b0e2-f0f6-4e36-b01b-000000000010', '96939126-8872-4011-a059-000000000001', 'Assault', '96939126-8872-4011-a059-000000000010', 0, NULL, 0, NULL);

-- --------------------------------------------------------
-- Data for table `wars`
-- --------------------------------------------------------
INSERT INTO `wars` (`uuid`, `created`, `updated`, `name`, `reason`, `victory_condition`, `status`, `result`, `result_action`) VALUES
('22334455-6677-4888-a999-000000000001', 1672531200000, 1704067200000, 'The Great War', 'Territory dispute', 'Capture Capital', 'ongoing', NULL, NULL),
('22334455-6677-4888-a999-000000000002', 1675209600000, 1704153600000, 'Clone Wars', 'Separatists', 'Defeat Droids', 'ended', 'Republic Victory', 'Peace Treaty'),
('22334455-6677-4888-a999-000000000003', 1677628800000, 1704240000000, 'Dominion War', 'Invasion', 'Push back', 'proposed', NULL, NULL),
('22334455-6677-4888-a999-000000000004', 1680307200000, 1704326400000, 'Imprisoning War', 'Ganon', 'Seal Ganon', 'accepted', NULL, NULL),
('22334455-6677-4888-a999-000000000005', 1682899200000, 1704412800000, 'Koopa Invasion', 'Kidnapped Princess', 'Rescue Princess', 'declined', NULL, NULL),
('22334455-6677-4888-a999-000000000006', 1685577600000, 1704499200000, 'Second War', 'Orc Invasion', 'Close Portal', 'cancelled', NULL, NULL),
('22334455-6677-4888-a999-000000000007', 1688169600000, 1704585600000, 'Civil War', 'Rebellion', 'Kill Leader', 'scheduled', NULL, NULL),
('22334455-6677-4888-a999-000000000008', 1690848000000, 1704672000000, 'War of the Ring', 'One Ring', 'Destroy Ring', 'ongoing', NULL, NULL),
('22334455-6677-4888-a999-000000000009', 1693526400000, 1704758400000, 'Last Alliance', 'Sauron', 'Defeat Sauron', 'ended', 'Sauron Defeated', 'Ring Lost'),
('22334455-6677-4888-a999-000000000010', 1696118400000, 1704844800000, 'War of the Rohirrim', 'Dunlendings', 'Defend Rohan', 'proposed', NULL, NULL);

-- --------------------------------------------------------
-- Data for table `war_battles`
-- --------------------------------------------------------
INSERT INTO `war_battles` (`uuid`, `created`, `updated`, `war_uuid`, `name`, `description`, `type`, `status`, `result`, `start_date`, `end_date`) VALUES
('32334455-6677-4888-a999-000000000001', 1672531200000, 1704067200000, '22334455-6677-4888-a999-000000000001', 'Battle of Terra', 'Defense of Earth', 'field_battle', 'ongoing', NULL, 1704067200000, NULL),
('32334455-6677-4888-a999-000000000002', 1675209600000, 1704153600000, '22334455-6677-4888-a999-000000000002', 'Battle of Geonosis', 'First battle', 'siege', 'ended', 'Republic Victory', 1704153600000, 1704153600000),
('32334455-6677-4888-a999-000000000003', 1677628800000, 1704240000000, '22334455-6677-4888-a999-000000000003', 'Battle of DS9', 'Station defense', 'flag_capture', 'proposed', NULL, 1704240000000, NULL),
('32334455-6677-4888-a999-000000000004', 1680307200000, 1704326400000, '22334455-6677-4888-a999-000000000004', 'Siege of Hyrule', 'Ganon attacks', 'scenario', 'accepted', NULL, 1704326400000, NULL),
('32334455-6677-4888-a999-000000000005', 1682899200000, 1704412800000, '22334455-6677-4888-a999-000000000005', 'Bowser Castle', 'Final fight', 'duel_tournament', 'declined', NULL, 1704412800000, NULL),
('32334455-6677-4888-a999-000000000006', 1685577600000, 1704499200000, '22334455-6677-4888-a999-000000000006', 'Blackrock Spire', 'Orc stronghold', 'field_battle', 'cancelled', NULL, 1704499200000, NULL),
('32334455-6677-4888-a999-000000000007', 1688169600000, 1704585600000, '22334455-6677-4888-a999-000000000007', 'Whiterun Siege', 'Stormcloaks attack', 'siege', 'scheduled', NULL, 1704585600000, NULL),
('32334455-6677-4888-a999-000000000008', 1690848000000, 1704672000000, '22334455-6677-4888-a999-000000000008', 'Pelennor Fields', 'Ride of Rohirrim', 'flag_capture', 'ongoing', NULL, 1704672000000, NULL),
('32334455-6677-4888-a999-000000000009', 1693526400000, 1704758400000, '22334455-6677-4888-a999-000000000009', 'Mount Doom', 'Ring destruction', 'scenario', 'ended', 'Ring Destroyed', 1704758400000, 1704758400000),
('32334455-6677-4888-a999-000000000010', 1696118400000, 1704844800000, '22334455-6677-4888-a999-000000000010', 'Helms Deep', 'Defense', 'duel_tournament', 'proposed', NULL, 1704844800000, NULL);

-- --------------------------------------------------------
-- Data for table `war_participants`
-- --------------------------------------------------------
INSERT INTO `war_participants` (`uuid`, `created`, `updated`, `war_uuid`, `state_uuid`, `side_role`) VALUES
('42334455-6677-4888-a999-000000000001', 1672531200000, 1704067200000, '22334455-6677-4888-a999-000000000001', '50e1b0e2-f0f6-4e36-b01b-000000000001', 'attacker'),
('42334455-6677-4888-a999-000000000002', 1675209600000, 1704153600000, '22334455-6677-4888-a999-000000000002', '50e1b0e2-f0f6-4e36-b01b-000000000002', 'defender'),
('42334455-6677-4888-a999-000000000003', 1677628800000, 1704240000000, '22334455-6677-4888-a999-000000000003', '50e1b0e2-f0f6-4e36-b01b-000000000003', 'ally_attacker'),
('42334455-6677-4888-a999-000000000004', 1680307200000, 1704326400000, '22334455-6677-4888-a999-000000000004', '50e1b0e2-f0f6-4e36-b01b-000000000004', 'ally_defender'),
('42334455-6677-4888-a999-000000000005', 1682899200000, 1704412800000, '22334455-6677-4888-a999-000000000005', '50e1b0e2-f0f6-4e36-b01b-000000000005', 'attacker'),
('42334455-6677-4888-a999-000000000006', 1685577600000, 1704499200000, '22334455-6677-4888-a999-000000000006', '50e1b0e2-f0f6-4e36-b01b-000000000006', 'defender'),
('42334455-6677-4888-a999-000000000007', 1688169600000, 1704585600000, '22334455-6677-4888-a999-000000000007', '50e1b0e2-f0f6-4e36-b01b-000000000007', 'ally_attacker'),
('42334455-6677-4888-a999-000000000008', 1690848000000, 1704672000000, '22334455-6677-4888-a999-000000000008', '50e1b0e2-f0f6-4e36-b01b-000000000008', 'ally_defender'),
('42334455-6677-4888-a999-000000000009', 1693526400000, 1704758400000, '22334455-6677-4888-a999-000000000009', '50e1b0e2-f0f6-4e36-b01b-000000000009', 'attacker'),
('42334455-6677-4888-a999-000000000010', 1696118400000, 1704844800000, '22334455-6677-4888-a999-000000000010', '50e1b0e2-f0f6-4e36-b01b-000000000010', 'defender');

-- --------------------------------------------------------
-- Data for table `history_events`
-- --------------------------------------------------------
INSERT INTO `history_events` (`uuid`, `created`, `updated`, `type`, `title`, `description`, `season`, `state_uuids`, `player_uuids`, `alliance_uuids`, `war_uuid`, `city_uuids`, `details_json`, `created_by_uuid`, `is_deleted`, `deleted_at`, `deleted_by_uuid`) VALUES
('aa0e8400-e29b-41d4-a716-000000000001', 1672531200000, 1704067200000, 'state_created', 'Imperium Founded', 'The Emperor protects', 'Season 1', '["50e1b0e2-f0f6-4e36-b01b-000000000001"]', NULL, NULL, NULL, NULL, NULL, '96939126-8872-4011-a059-000000000001', 0, NULL, NULL),
('aa0e8400-e29b-41d4-a716-000000000002', 1675209600000, 1704153600000, 'state_created', 'Republic Founded', 'Democracy begins', 'Season 1', '["50e1b0e2-f0f6-4e36-b01b-000000000002"]', NULL, NULL, NULL, NULL, NULL, '96939126-8872-4011-a059-000000000002', 0, NULL, NULL),
('aa0e8400-e29b-41d4-a716-000000000003', 1677628800000, 1704240000000, 'state_created', 'Federation Founded', 'Starfleet established', 'Season 1', '["50e1b0e2-f0f6-4e36-b01b-000000000003"]', NULL, NULL, NULL, NULL, NULL, '96939126-8872-4011-a059-000000000003', 0, NULL, NULL),
('aa0e8400-e29b-41d4-a716-000000000004', 1680307200000, 1704326400000, 'state_created', 'Hyrule Founded', 'Goddesses descended', 'Season 1', '["50e1b0e2-f0f6-4e36-b01b-000000000004"]', NULL, NULL, NULL, NULL, NULL, '96939126-8872-4011-a059-000000000004', 0, NULL, NULL),
('aa0e8400-e29b-41d4-a716-000000000005', 1682899200000, 1704412800000, 'state_created', 'Mushroom Kingdom Founded', 'Toads gathered', 'Season 1', '["50e1b0e2-f0f6-4e36-b01b-000000000005"]', NULL, NULL, NULL, NULL, NULL, '96939126-8872-4011-a059-000000000005', 0, NULL, NULL),
('aa0e8400-e29b-41d4-a716-000000000006', 1685577600000, 1704499200000, 'state_created', 'Azeroth Founded', 'Humans settled', 'Season 1', '["50e1b0e2-f0f6-4e36-b01b-000000000006"]', NULL, NULL, NULL, NULL, NULL, '96939126-8872-4011-a059-000000000006', 0, NULL, NULL),
('aa0e8400-e29b-41d4-a716-000000000007', 1688169600000, 1704585600000, 'state_created', 'Skyrim Founded', 'Dragons returned', 'Season 1', '["50e1b0e2-f0f6-4e36-b01b-000000000007"]', NULL, NULL, NULL, NULL, NULL, '96939126-8872-4011-a059-000000000007', 0, NULL, NULL),
('aa0e8400-e29b-41d4-a716-000000000008', 1690848000000, 1704672000000, 'state_created', 'Gondor Founded', 'Numenoreans arrived', 'Season 1', '["50e1b0e2-f0f6-4e36-b01b-000000000008"]', NULL, NULL, NULL, NULL, NULL, '96939126-8872-4011-a059-000000000008', 0, NULL, NULL),
('aa0e8400-e29b-41d4-a716-000000000009', 1693526400000, 1704758400000, 'state_created', 'Mordor Founded', 'Shadow fell', 'Season 1', '["50e1b0e2-f0f6-4e36-b01b-000000000009"]', NULL, NULL, NULL, NULL, NULL, '96939126-8872-4011-a059-000000000009', 0, NULL, NULL),
('aa0e8400-e29b-41d4-a716-000000000010', 1696118400000, 1704844800000, 'state_created', 'Rohan Founded', 'Eorl rode', 'Season 1', '["50e1b0e2-f0f6-4e36-b01b-000000000010"]', NULL, NULL, NULL, NULL, NULL, '96939126-8872-4011-a059-000000000010', 0, NULL, NULL);

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
