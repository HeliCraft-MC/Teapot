-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Jun 28, 2025 at 02:42 PM
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
-- Database: `newAuth`
--

-- --------------------------------------------------------

--
-- Table structure for table `AUTH`
--

CREATE TABLE `AUTH` (
  `NICKNAME` varchar(255) NOT NULL,
  `LOWERCASENICKNAME` varchar(255) NOT NULL,
  `HASH` varchar(255) NOT NULL,
  `IP` varchar(255) DEFAULT NULL,
  `isAdmin` tinyint(1) NOT NULL DEFAULT 0,
  `TOTPTOKEN` varchar(255) DEFAULT NULL,
  `REGDATE` bigint(20) DEFAULT NULL,
  `UUID` varchar(255) DEFAULT NULL,
  `UUID_WR` varchar(255) DEFAULT NULL,
  `PREMIUMUUID` varchar(255) DEFAULT NULL,
  `LOGINIP` varchar(255) DEFAULT NULL,
  `LOGINDATE` bigint(20) DEFAULT NULL,
  `ISSUEDTIME` bigint(20) DEFAULT NULL,
  `accessToken` char(32) DEFAULT NULL,
  `serverID` varchar(41) DEFAULT NULL,
  `hwidId` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `AUTH`
--
DELIMITER $$
CREATE TRIGGER `setUUID_WR` BEFORE INSERT ON `AUTH` FOR EACH ROW BEGIN
    IF NEW.UUID_WR IS NULL THEN
        SET NEW.UUID_WR = REPLACE(NEW.UUID, '-', '');
    END IF;
END
$$
DELIMITER ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `AUTH`
--
ALTER TABLE `AUTH`
  ADD PRIMARY KEY (`LOWERCASENICKNAME`),
  ADD UNIQUE KEY `UUID_WR` (`UUID_WR`),
  ADD KEY `users_hwidfk` (`hwidId`),
  ADD KEY `AUTH_PREMIUMUUID_idx` (`PREMIUMUUID`),
  ADD KEY `AUTH_IP_idx` (`IP`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `AUTH`
--
ALTER TABLE `AUTH`
  ADD CONSTRAINT `users_hwidfk` FOREIGN KEY (`hwidId`) REFERENCES `hwids` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
