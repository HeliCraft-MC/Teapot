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
