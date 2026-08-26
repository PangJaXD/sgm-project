-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: localhost    Database: sgm_db
-- ------------------------------------------------------
-- Server version	8.0.37

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin`
--

DROP TABLE IF EXISTS `admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin` (
  `users_id` int NOT NULL,
  PRIMARY KEY (`users_id`),
  CONSTRAINT `FK46tcmob51p9whojovtl2faukx` FOREIGN KEY (`users_id`) REFERENCES `users` (`users_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin`
--

LOCK TABLES `admin` WRITE;
/*!40000 ALTER TABLE `admin` DISABLE KEYS */;
INSERT INTO `admin` VALUES (2);
/*!40000 ALTER TABLE `admin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `assignment`
--

DROP TABLE IF EXISTS `assignment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assignment` (
  `assignment_id` int NOT NULL AUTO_INCREMENT,
  `assignment_status` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `latitude` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `longitude` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `request_date` datetime(6) DEFAULT NULL,
  `shift_id` int DEFAULT NULL,
  `head_id` int DEFAULT NULL,
  `guard_id` int DEFAULT NULL,
  PRIMARY KEY (`assignment_id`),
  KEY `FKhx6ij3sw1y8j2ttfcxx1jb5oj` (`shift_id`),
  KEY `FK84jh2peigoaheempxm85ms0ke` (`head_id`),
  KEY `FK2fb8x7rxjyxsg7phj4o9dydxl` (`guard_id`),
  CONSTRAINT `FK2fb8x7rxjyxsg7phj4o9dydxl` FOREIGN KEY (`guard_id`) REFERENCES `guards` (`users_id`),
  CONSTRAINT `FK84jh2peigoaheempxm85ms0ke` FOREIGN KEY (`head_id`) REFERENCES `head_guard` (`users_id`),
  CONSTRAINT `FKhx6ij3sw1y8j2ttfcxx1jb5oj` FOREIGN KEY (`shift_id`) REFERENCES `shift_time` (`shift_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assignment`
--

LOCK TABLES `assignment` WRITE;
/*!40000 ALTER TABLE `assignment` DISABLE KEYS */;
INSERT INTO `assignment` VALUES (2,'ASSIGNED','ตรวจคนหน้าทางเข้า','18.895562164347762','99.01158074843448','2026-08-25 09:56:32.002898',39,NULL,10);
/*!40000 ALTER TABLE `assignment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company`
--

DROP TABLE IF EXISTS `company`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company` (
  `company_name` varchar(150) COLLATE utf8mb3_unicode_ci NOT NULL,
  `users_id` int NOT NULL,
  `admin_name` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`users_id`),
  CONSTRAINT `FKrkiogbcxxodv9h7r4yh50p674` FOREIGN KEY (`users_id`) REFERENCES `users` (`users_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company`
--

LOCK TABLES `company` WRITE;
/*!40000 ALTER TABLE `company` DISABLE KEYS */;
INSERT INTO `company` VALUES ('ABC Security Company',3,NULL);
/*!40000 ALTER TABLE `company` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `events` (
  `event_id` int NOT NULL AUTO_INCREMENT,
  `contact` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `contractor` varchar(150) COLLATE utf8mb3_unicode_ci NOT NULL,
  `event_detail` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `event_img` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `event_name` varchar(150) COLLATE utf8mb3_unicode_ci NOT NULL,
  `latitude` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `location` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `longitude` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `required_guards` int NOT NULL,
  `head_id` int DEFAULT NULL,
  `company_id` int DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  PRIMARY KEY (`event_id`),
  KEY `FK8146he7gq8vqjia7w1rb1lgf5` (`head_id`),
  KEY `FKlc98fc7layh3u58cmpy1n2kus` (`company_id`),
  CONSTRAINT `FK8146he7gq8vqjia7w1rb1lgf5` FOREIGN KEY (`head_id`) REFERENCES `head_guard` (`users_id`),
  CONSTRAINT `FKlc98fc7layh3u58cmpy1n2kus` FOREIGN KEY (`company_id`) REFERENCES `company` (`users_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events`
--

LOCK TABLES `events` WRITE;
/*!40000 ALTER TABLE `events` DISABLE KEYS */;
INSERT INTO `events` VALUES (7,'08123456','มหาวิทยาลัยแม่โจ้','','default.png','งานหนังสือแม่โจ้','18.89511632765724','มหาวิทยาลัยแม่โจ้','99.01207208633424',20,NULL,NULL,'PENDING','2026-08-28','2026-08-24'),(8,'08123456','มหาวิทยาลัยแม่โจ้','','default.png','งานหนังสือแม่โจ้ 2','18.89511632765724','มหาวิทยาลัยแม่โจ้','99.01207208633424',10,NULL,NULL,'CANCELLED','2026-08-26','2026-08-24');
/*!40000 ALTER TABLE `events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `events_provided_tools`
--

DROP TABLE IF EXISTS `events_provided_tools`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `events_provided_tools` (
  `event_id` int NOT NULL,
  `provided_tools` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  UNIQUE KEY `UKoe5y5yc3hy5l61a1m8u4aj0r` (`event_id`,`provided_tools`),
  CONSTRAINT `FKtoc5by18sncpu520t8rhw0ga2` FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events_provided_tools`
--

LOCK TABLES `events_provided_tools` WRITE;
/*!40000 ALTER TABLE `events_provided_tools` DISABLE KEYS */;
INSERT INTO `events_provided_tools` VALUES (7,'วิทยุสื่อสาร'),(8,'วิทยุสื่อสาร');
/*!40000 ALTER TABLE `events_provided_tools` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `events_required_tools`
--

DROP TABLE IF EXISTS `events_required_tools`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `events_required_tools` (
  `event_id` int NOT NULL,
  `required_tools` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  UNIQUE KEY `UK6m7ti3fd2j748psqofudyilek` (`event_id`,`required_tools`),
  CONSTRAINT `FKak23ovejri6ff12xrooct2296` FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events_required_tools`
--

LOCK TABLES `events_required_tools` WRITE;
/*!40000 ALTER TABLE `events_required_tools` DISABLE KEYS */;
INSERT INTO `events_required_tools` VALUES (7,'กระบองยาว'),(8,'กระบองยาว');
/*!40000 ALTER TABLE `events_required_tools` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `guards`
--

DROP TABLE IF EXISTS `guards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `guards` (
  `users_id` int NOT NULL,
  `company_name` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `head_name` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`users_id`),
  CONSTRAINT `FK73u3tjp7pf8r74x1tvnsx1nf4` FOREIGN KEY (`users_id`) REFERENCES `staff` (`users_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `guards`
--

LOCK TABLES `guards` WRITE;
/*!40000 ALTER TABLE `guards` DISABLE KEYS */;
INSERT INTO `guards` VALUES (6,NULL,'ธนเรศ หมอยา'),(10,'abc_company','ธนเรศ หมอยา'),(12,'abc_company','-'),(13,'abc_company','ธนเรศ หมอยา');
/*!40000 ALTER TABLE `guards` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `head_guard`
--

DROP TABLE IF EXISTS `head_guard`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `head_guard` (
  `users_id` int NOT NULL,
  `company_name` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`users_id`),
  CONSTRAINT `FKhtg7i8ddspr29g5hxp7686hfn` FOREIGN KEY (`users_id`) REFERENCES `staff` (`users_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `head_guard`
--

LOCK TABLES `head_guard` WRITE;
/*!40000 ALTER TABLE `head_guard` DISABLE KEYS */;
INSERT INTO `head_guard` VALUES (5,NULL),(8,'abc_company'),(9,'abc_company'),(11,'abc_company');
/*!40000 ALTER TABLE `head_guard` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `report`
--

DROP TABLE IF EXISTS `report`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `report` (
  `report_id` int NOT NULL AUTO_INCREMENT,
  `is_normal` bit(1) NOT NULL,
  `report_desc` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `report_img` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `report_time` datetime(6) NOT NULL,
  `report_type` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `shift_id` int DEFAULT NULL,
  `guard_id` int DEFAULT NULL,
  PRIMARY KEY (`report_id`),
  KEY `FKa91abg9dmbo8yf129gk9fpdc8` (`shift_id`),
  KEY `FKowh07bokbvqqy9yhcuhxarjky` (`guard_id`),
  CONSTRAINT `FKa91abg9dmbo8yf129gk9fpdc8` FOREIGN KEY (`shift_id`) REFERENCES `shift_time` (`shift_id`),
  CONSTRAINT `FKowh07bokbvqqy9yhcuhxarjky` FOREIGN KEY (`guard_id`) REFERENCES `guards` (`users_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `report`
--

LOCK TABLES `report` WRITE;
/*!40000 ALTER TABLE `report` DISABLE KEYS */;
/*!40000 ALTER TABLE `report` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shift_time`
--

DROP TABLE IF EXISTS `shift_time`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shift_time` (
  `shift_id` int NOT NULL AUTO_INCREMENT,
  `end_time` datetime(6) NOT NULL,
  `maximum_guards` int NOT NULL,
  `shift_date` datetime(6) NOT NULL,
  `start_time` datetime(6) NOT NULL,
  `event_id` int DEFAULT NULL,
  `head_guard_id` int DEFAULT NULL,
  PRIMARY KEY (`shift_id`),
  KEY `FK5aqduu8uagh1t1slfu1pqdmau` (`event_id`),
  CONSTRAINT `FK5aqduu8uagh1t1slfu1pqdmau` FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shift_time`
--

LOCK TABLES `shift_time` WRITE;
/*!40000 ALTER TABLE `shift_time` DISABLE KEYS */;
INSERT INTO `shift_time` VALUES (38,'2026-08-25 17:00:00.000000',10,'2026-08-23 17:00:00.000000','2026-08-24 01:00:00.000000',8,8),(39,'2026-08-27 17:00:00.000000',10,'2026-08-23 17:00:00.000000','2026-08-24 01:00:00.000000',7,8),(40,'2026-08-28 10:00:00.000000',10,'2026-08-23 17:00:00.000000','2026-08-24 06:00:00.000000',7,8);
/*!40000 ALTER TABLE `shift_time` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff`
--

DROP TABLE IF EXISTS `staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff` (
  `performance_score` double DEFAULT NULL,
  `users_id` int NOT NULL,
  PRIMARY KEY (`users_id`),
  CONSTRAINT `FK8itjkvpxqs15j97aqmo1sa8km` FOREIGN KEY (`users_id`) REFERENCES `users` (`users_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff`
--

LOCK TABLES `staff` WRITE;
/*!40000 ALTER TABLE `staff` DISABLE KEYS */;
INSERT INTO `staff` VALUES (NULL,5),(NULL,6),(NULL,8),(NULL,9),(NULL,10),(NULL,11),(NULL,12),(NULL,13);
/*!40000 ALTER TABLE `staff` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `users_id` int NOT NULL AUTO_INCREMENT,
  `address` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `first_name` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `last_name` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `phone` varchar(10) COLLATE utf8mb3_unicode_ci NOT NULL,
  `profile_img` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `quit_date` datetime(6) DEFAULT NULL,
  `start_date` datetime(6) NOT NULL,
  `user_detail` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `username` varchar(50) COLLATE utf8mb3_unicode_ci NOT NULL,
  PRIMARY KEY (`users_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (2,'Chiang Mai','Admin','Test','$2a$10$E3yb9Rhs9gSFJJ8K.SVN4.sfnQ6C7J4UnsTgStewMbhaAhhO7Wua2','0812345678','default.jpg',NULL,'2026-08-15 15:00:00.000000','System Administrator','admin'),(3,'Bangkok','Somchai','Jaidee','$2a$10$HKqkrhShPZka7hMi.pVz4.2Spb/xGEHzyN6ScSfST7cv06G4.k202','0812345678','default.png',NULL,'2026-08-15 02:00:00.000000','Security Company','abc_company'),(5,'Chiang Mai','John','Doe','$2a$10$PMbLGdJBM.5Ghr3G1K8EWux50dDfHyVVuakGzJ2WFNlUkhjffLer6','0812345678','profile.jpg','2026-08-19 01:05:29.852000','2026-08-14 17:00:00.000000','Head Guard','headguard01'),(6,'Chiang Mai, Thailand','Somchai','Jaidee','$2a$10$M2uOPhg4jmci0ex6vOWK/OWTRMNH7TaUh30Eccu5TobEr4zxqbJ52','0812345678','default-profile.jpg',NULL,'2026-08-14 17:00:00.000000','Security Guard','guard001'),(8,'Chiang Mai','ธนเรศ','หมอยา','$2a$10$ccq6eP18wN22aCrS6lorxOoeiHTAmis5X3tVIDPg9BqJPsBznZDde','0812345678','default.png',NULL,'2026-08-03 17:00:00.000000','ลมบ้าหมู, เบาหวาน','mr.kopp'),(9,'Chiang Mai','ทศพล','ชื่นบาน','$2a$10$xS2iCVJWcAXXQEyuWZYonOL8bTJ1gYdA1lI.ADHZe22k8nS6XZr1a','0812345678','default.png',NULL,'2026-08-09 17:00:00.000000','แผ้แดด','tang.mo'),(10,'Lam Pang','ฉัตรชัย','แสงธรรม','$2a$10$oo7Y03LdCYckJ7yuLbQam.uR9G4WSjvFBNX3U8qCiOg96pstIuHuK','0812345678','default.png',NULL,'2026-08-11 17:00:00.000000','มีพื้นฐานยิวยิตสู','wan.yen'),(11,'','ก้องภพ','เกียรติสกุล','$2a$10$QMp2KY/7UsVHzkK13igSJeRptQ6uk7VEXk6/HwHFWOgt6oF5qyNo6','0812345678','default.png',NULL,'2026-08-19 17:00:00.000000','-','mr.kong'),(12,'','สมชาย','น่ารัก','$2a$10$AQouwi3cTrVkMJBQLd.rJO7r0LGbvFEG0jhcoakBqwZwpbtNa45k6','0812345678','default.png',NULL,'2026-08-20 17:00:00.000000','-','mr.somchai'),(13,'','สมศรี','ศรีสมร','$2a$10$h6vGHPVzhESblcoUr/ukiOfuqjKgTXmHZ9vl6MSeK1B.CR/uSnWkC','0812345678','default.png',NULL,'2026-08-20 17:00:00.000000','-','somsri');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-26 21:13:35
