-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: hostel_db
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `complaints`
--

CREATE DATABASE IF NOT EXISTS hostel_db;
USE hostel_db;


DROP TABLE IF EXISTS `complaints`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `complaints` (
  `complaint_id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `complaint_type` varchar(100) NOT NULL,
  `description` varchar(500) NOT NULL,
  `status` enum('Pending','In Progress','Resolved') DEFAULT 'Pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`complaint_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complaints`
--

LOCK TABLES `complaints` WRITE;
/*!40000 ALTER TABLE `complaints` DISABLE KEYS */;
INSERT INTO `complaints` VALUES (5,11,'hostel maintanance ',' workers are not cleaning the dormetries regularly rooms and washrooms and water problems are there\n','In Progress','2025-09-14 07:55:03'),(6,11,'Maintenance','abcd','Resolved','2025-10-10 06:50:46');
/*!40000 ALTER TABLE `complaints` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hostel_applications`
--

DROP TABLE IF EXISTS `hostel_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hostel_applications` (
  `application_id` int NOT NULL AUTO_INCREMENT,
  `ref_number` varchar(20) NOT NULL,
  `roll_no` varchar(20) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `father_name` varchar(100) NOT NULL,
  `profession` varchar(100) DEFAULT NULL,
  `income` decimal(10,2) DEFAULT NULL,
  `dob` date NOT NULL,
  `birth_place` varchar(100) DEFAULT NULL,
  `aadhaar` varchar(20) DEFAULT NULL,
  `blood_group` varchar(5) DEFAULT NULL,
  `food_preference` enum('Veg','Non-Veg') DEFAULT NULL,
  `course` varchar(50) DEFAULT NULL,
  `branch` varchar(100) DEFAULT NULL,
  `room_no` varchar(50) DEFAULT '-',
  `hostel_name` varchar(100) DEFAULT '-',
  `year` int DEFAULT NULL,
  `perm_village` varchar(100) DEFAULT NULL,
  `perm_pincode` varchar(10) DEFAULT NULL,
  `perm_mandal` varchar(100) DEFAULT NULL,
  `perm_district` varchar(100) DEFAULT NULL,
  `perm_state` varchar(100) DEFAULT NULL,
  `pres_village` varchar(100) DEFAULT NULL,
  `pres_pincode` varchar(10) DEFAULT NULL,
  `pres_mandal` varchar(100) DEFAULT NULL,
  `pres_district` varchar(100) DEFAULT NULL,
  `pres_state` varchar(100) DEFAULT NULL,
  `nationality` varchar(50) DEFAULT NULL,
  `other_country` varchar(100) DEFAULT NULL,
  `category` varchar(20) DEFAULT NULL,
  `gender` enum('Male','Female','Other') DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `contact` varchar(15) DEFAULT NULL,
  `student_photo` varchar(255) DEFAULT NULL,
  `certificate` varchar(255) DEFAULT NULL,
  `distance_km` varchar(10) DEFAULT NULL,
  `application_type` enum('Fresh','Renewal') DEFAULT NULL,
  `school` varchar(100) DEFAULT NULL,
  `school_period` varchar(50) DEFAULT NULL,
  `college` varchar(100) DEFAULT NULL,
  `college_period` varchar(50) DEFAULT NULL,
  `application_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `payment_status` enum('Pending','Paid') DEFAULT 'Pending',
  `approval_status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  `rejection_reason` text,
  PRIMARY KEY (`application_id`),
  UNIQUE KEY `ref_number` (`ref_number`),
  UNIQUE KEY `aadhaar` (`aadhaar`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hostel_applications`
--

LOCK TABLES `hostel_applications` WRITE;
/*!40000 ALTER TABLE `hostel_applications` DISABLE KEYS */;
INSERT INTO `hostel_applications` VALUES (8,'REF146987','451122733037','BALAPUR SURESH ','BALAPUR KRISHNA ','FARMER',500000.00,'2025-09-25','NALGONDA','758694123699','B+','Non-Veg','B.Tech','CSE','G2','Nagarjuna',4,'KONDANDAGUDEM','508221','CHINTHALAPALLY','JAYASHANKAR BUPALAPALLY','TELANGANA','KONDANDAGUDEM','508221','CHINTHALAPALLY','JAYASHANKAR BUPALAPALLY','TELANGANA',NULL,NULL,NULL,NULL,'balapursuresh123@gmail.com','7689121548','/uploads/photos/1757837587445-s.jpg','/uploads/certs/1757837587445-WhatsApp Image 2025-03-01 at 3.11.24 PM(1).jpeg',NULL,'Fresh','SURYAPET','5YEARS','NALGONDA','2 YEARS','2025-09-14 08:13:07','Pending','Approved',NULL),(9,'REF170380','451122733018','CHITYALA KIRAN  kumar','CHITYALA MALLESH  yadav','condector',500000.00,'2024-08-27','SURYAPET','957845639878','AB+','Veg','PG','MBA','A-882','Nilagiri',1,'SURYAPET','508901','SURYAPET','SURYAPETas','TELANGANA','SURYAPET','508901','SURYAPET','SURYAPET','TELANGANA','Indian',NULL,NULL,'Female','chityalakiran32@gmail.com','8694286971','/uploads/photos/1759037032770-shannu.jpg','/uploads/certs/1759037032770-6b7ed698713c09ad9e6afc7dcb996a09.jpg','44','Renewal','SURYAPETSSS','2','NALGONDA','1','2025-09-14 13:41:37','Paid','Rejected','less distance'),(10,'REF-1759037297193','451122733030','GANJI SRAVAN','GANJI PAVAN','Doctor',500000.00,'2025-09-17','Hyderabad','123456789789','A+','Veg','PG','MCA','G4','Krishnaveni',1,'SURYAPET','508901','SURYAPET','SURYAPET','TELANGANA','SURYAPET','508901','SURYAPET','SURYAPET','TELANGANA','Indian',NULL,NULL,'Male','chityalakiran32@gmail.com','8694286971','/uploads/photos/1759037297182-WhatsApp Image 2025-06-17 at 7.41.41 AM.jpeg','/uploads/certs/1759037297184-WhatsApp Image 2025-06-17 at 7.45.00 AM.jpeg',NULL,'Fresh',NULL,NULL,NULL,NULL,'2025-09-28 05:28:17','Pending','Rejected','something '),(13,'REF730493','451122733007','CM','BALAPUR KRISHNA','FARMER',50000.00,'2003-12-24','NALGONDA','302652521236','O+','Veg','B.Tech','CSE','F4','Krishnaveni',4,'CHANDANAPALLY','508901','NALGONDA','NALGONDA','DDAS','CHANDANAPALLY ','508901','NALGONDA ','NALGONDA','DDAS','Indian',NULL,NULL,'Male','cmshannu@gmail.com','8694286971','/uploads/photos/1760081496159-WhatsApp Image 2025-08-15 at 4.24.33 PM (1).jpeg','/uploads/certs/1760081496161-WhatsApp Image 2025-08-15 at 4.24.33 PM (1).jpeg',NULL,'Fresh','SURYAPET','5YEARS','NALGONDA','2 YEARS','2025-10-10 07:31:36','Pending','Rejected','nuvu nku nachale ');
/*!40000 ALTER TABLE `hostel_applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notices`
--

DROP TABLE IF EXISTS `notices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `file_path` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notices`
--

LOCK TABLES `notices` WRITE;
/*!40000 ALTER TABLE `notices` DISABLE KEYS */;
/*!40000 ALTER TABLE `notices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `otp_store`
--

DROP TABLE IF EXISTS `otp_store`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `otp_store` (
  `roll_no` varchar(50) NOT NULL,
  `otp` varchar(6) NOT NULL,
  `expires_at` datetime NOT NULL,
  PRIMARY KEY (`roll_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otp_store`
--

LOCK TABLES `otp_store` WRITE;
/*!40000 ALTER TABLE `otp_store` DISABLE KEYS */;
/*!40000 ALTER TABLE `otp_store` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `room_allocations`
--

DROP TABLE IF EXISTS `room_allocations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room_allocations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `roll_no` bigint NOT NULL,
  `room_id` int NOT NULL,
  `allocated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `room_id` (`room_id`),
  CONSTRAINT `room_allocations_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room_allocations`
--

LOCK TABLES `room_allocations` WRITE;
/*!40000 ALTER TABLE `room_allocations` DISABLE KEYS */;
INSERT INTO `room_allocations` VALUES (6,45112273346,1,'2025-09-27 09:00:15'),(7,45112273346,10,'2025-09-27 09:00:15'),(17,451122733037,2,'2025-09-27 09:48:32'),(19,4511735061,11,'2025-09-27 10:52:52'),(24,451124734055,11,'2025-10-10 07:12:42'),(25,451122733007,12,'2025-10-10 07:34:58'),(26,451122733001,13,'2025-10-11 12:12:07');
/*!40000 ALTER TABLE `room_allocations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rooms`
--

DROP TABLE IF EXISTS `rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rooms` (
  `id` int NOT NULL AUTO_INCREMENT,
  `hostel_name` varchar(50) NOT NULL,
  `room_no` varchar(10) NOT NULL,
  `floor` enum('Ground','First','Second') NOT NULL,
  `type` varchar(50) DEFAULT 'Quad',
  `category` enum('Boys','Girls','Staff','Guest') DEFAULT 'Boys',
  `capacity` int DEFAULT '4',
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rooms`
--

LOCK TABLES `rooms` WRITE;
/*!40000 ALTER TABLE `rooms` DISABLE KEYS */;
INSERT INTO `rooms` VALUES (1,'Nagarjuna','G1','Ground','Quad','Boys',4,'Active','2025-09-27 08:42:06'),(2,'Nagarjuna','G2','Ground','Quad','Boys',4,'Active','2025-09-27 08:42:06'),(10,'Nagarjuna','G3','Ground','Quad','Boys',4,'Active','2025-09-27 08:57:44'),(11,'Krishnaveni','F1','First','Quad','Girls',4,'Active','2025-09-27 10:49:52'),(12,'Krishnaveni','F4','First','Quad','Boys',4,'Active','2025-10-06 13:59:03'),(13,'Krishnaveni','F8','First','Quad','Girls',4,'Active','2025-10-10 06:42:10');
/*!40000 ALTER TABLE `rooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_billing`
--

DROP TABLE IF EXISTS `student_billing`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_billing` (
  `bill_id` int NOT NULL AUTO_INCREMENT,
  `roll_no` varchar(20) NOT NULL,
  `student_name` varchar(100) DEFAULT '',
  `room_no` varchar(20) DEFAULT NULL,
  `hostel_name` varchar(50) DEFAULT NULL,
  `course` varchar(50) DEFAULT NULL,
  `branch` varchar(50) DEFAULT NULL,
  `year` varchar(20) DEFAULT NULL,
  `academic_year` varchar(20) NOT NULL,
  `month` varchar(20) DEFAULT NULL,
  `hostel_fee` decimal(10,2) DEFAULT '0.00',
  `monthly_fee` decimal(10,2) DEFAULT '0.00',
  `paid_amount` decimal(10,2) DEFAULT '0.00',
  `scholarship` decimal(10,2) DEFAULT '0.00',
  `food_preference` enum('Veg','Non-Veg') DEFAULT 'Veg',
  `payment_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `remaining` decimal(10,2) DEFAULT '0.00',
  `due` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`bill_id`)
) ENGINE=InnoDB AUTO_INCREMENT=95 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_billing`
--

LOCK TABLES `student_billing` WRITE;
/*!40000 ALTER TABLE `student_billing` DISABLE KEYS */;
INSERT INTO `student_billing` VALUES (1,'2024-001','Rahul Kumar','A-101','Boys Hostel A','B.Tech','CSE','2','2024-2025','Jan',5000.00,1200.00,5000.00,15000.00,'Veg','2025-09-21','2025-09-21 06:14:53',0.00,0.00),(2,'2024-001','Rahul Kumar','A-101','Boys Hostel A','B.Tech','CSE','2','2024-2025','Feb',5000.00,1300.00,0.00,0.00,'Veg','2025-09-22','2025-09-21 06:14:53',0.00,0.00),(3,'2024-001','Rahul Kumar','A-101','Boys Hostel A','B.Tech','CSE','2','2025-2026','Jan',5500.00,1400.00,0.00,20000.00,'Veg','2025-09-23','2025-09-21 06:14:53',0.00,0.00),(4,'2024-002','Priya Sharma','B-201','Girls Hostel B','B.Tech','ECE','1','2024-2025','Jan',4000.00,1200.00,7000.00,14000.00,'Non-Veg','2025-09-21','2025-09-21 06:14:53',0.00,0.00),(5,'2024-002','Priya Sharma','B-201','Girls Hostel B','B.Tech','ECE','1','2024-2025','Feb',4000.00,1100.00,0.00,0.00,'Non-Veg','2025-09-22','2025-09-21 06:14:53',0.00,0.00),(9,'2024-003','Sneha Gupta','D-101','Girls Hostel D','B.Tech','CSE','1','2024-2025','Jan',4500.00,1200.00,3000.00,8000.00,'Non-Veg','2025-09-21','2025-09-21 06:14:53',0.00,0.00),(10,'2024-003','Sneha Gupta','D-101','Girls Hostel D','B.Tech','CSE','1','2024-2025','Feb',4500.00,1250.00,0.00,0.00,'Non-Veg','2025-09-22','2025-09-21 06:14:53',0.00,0.00),(11,'45112273345','charan chityala','4','hostel-a','b-tech','cse','2026','2025','Jan',0.00,0.00,0.00,0.00,'Veg',NULL,'2025-09-21 09:34:19',0.00,0.00),(12,'45112273345','charan chityala','4','hostel-a','b-tech','cse','2026-2027','2025','Jan',0.00,0.00,0.00,0.00,'Veg',NULL,'2025-09-21 09:37:47',0.00,0.00),(13,'45112273346','Madhan mohan','5','hostel-a','MCA','cse','2026-2027','2025','Jan',0.00,0.00,0.00,0.00,'Veg',NULL,'2025-09-21 09:47:03',0.00,0.00),(73,'451122733037','',NULL,NULL,NULL,NULL,NULL,'2024-2025','Jan',0.00,1500.00,2000.00,5000.00,'Veg',NULL,'2025-09-22 13:08:53',0.00,0.00),(74,'451122733037','',NULL,NULL,NULL,NULL,NULL,'2024-2025','Jan',0.00,1600.00,0.00,0.00,'Veg',NULL,'2025-09-22 13:08:53',0.00,0.00),(75,'451122733037','',NULL,NULL,NULL,NULL,NULL,'2024-2025','Jan',0.00,110.00,0.00,0.00,'Veg',NULL,'2025-09-22 13:08:53',0.00,0.00),(76,'451122733035','',NULL,NULL,NULL,NULL,NULL,'2025-2026','Jan',0.00,10000.00,0.00,0.00,'Veg',NULL,'2025-10-03 17:13:09',0.00,0.00),(77,'2024-003','',NULL,NULL,NULL,NULL,NULL,'-','Jan',0.00,10000.00,0.00,0.00,'Veg',NULL,'2025-10-06 13:33:29',0.00,0.00),(78,'451122733668','Ganesh','S-1','Nagarjuna Hostel',NULL,NULL,NULL,'2025-2026','Jan',100000.00,0.00,0.00,0.00,'Non-Veg',NULL,'2025-10-06 13:37:23',0.00,0.00),(88,'451122733033','praneeth reddy','G2','Nagarjuna',NULL,NULL,NULL,'2025-2036','Jan',0.00,0.00,10000.00,0.00,'Non-Veg',NULL,'2025-10-10 06:54:04',0.00,0.00),(89,'451122733037','',NULL,NULL,NULL,NULL,NULL,'2025-2026','Jan',0.00,1700.00,0.00,7000.00,'Veg',NULL,'2025-10-10 07:00:45',0.00,0.00),(90,'451122733037','',NULL,NULL,NULL,NULL,NULL,'2025-2026','Feb',0.00,120.00,100.00,0.00,'Veg',NULL,'2025-10-10 07:00:45',0.00,0.00),(91,'451122733037','',NULL,NULL,NULL,NULL,NULL,'2025-2026','Mar',0.00,100.00,0.00,0.00,'Veg',NULL,'2025-10-10 07:00:45',0.00,0.00),(92,'451122733037','',NULL,NULL,NULL,NULL,NULL,'2025-2026','Apr',0.00,1000.00,0.00,0.00,'Veg',NULL,'2025-10-10 07:00:45',0.00,0.00),(93,'451122733037','',NULL,NULL,NULL,NULL,NULL,'2025-2026','May',0.00,100.00,10.00,20.00,'Veg',NULL,'2025-10-10 07:00:45',0.00,0.00),(94,'451122733037','',NULL,NULL,NULL,NULL,NULL,'2025-2026','Jun',0.00,10000.00,0.00,0.00,'Veg',NULL,'2025-10-10 07:00:45',0.00,0.00);
/*!40000 ALTER TABLE `student_billing` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_notice_reads`
--

DROP TABLE IF EXISTS `student_notice_reads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_notice_reads` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `notice_id` int NOT NULL,
  `read_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_id` (`student_id`,`notice_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_notice_reads`
--

LOCK TABLES `student_notice_reads` WRITE;
/*!40000 ALTER TABLE `student_notice_reads` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_notice_reads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `roll_no` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(15) NOT NULL,
  `password` varchar(255) NOT NULL,
  `is_admin` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `roll_no` (`roll_no`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Admin User','A001','admin@example.com','7286910170','$2b$10$QJT86h.sIyglJb8fwPSHnO36rl9IC3HZSp5UXKSsQW9lvsnQ3GaHK',1),(2,'Kiran','451122733018','kiran@example.com','9876543001','$2b$10$/dQIPKHskQ1cSmGpFDHVb.6DY97L4XAWVmLL0sQUtXIHuSjsmpPai',0),(3,'Sravan','451122733019','sravan@example.com','9876543002','$2b$10$/dQIPKHskQ1cSmGpFDHVb.6DY97L4XAWVmLL0sQUtXIHuSjsmpPai',0),(4,'Shiva','451122733020','shiva@example.com','9876543003','$2b$10$/dQIPKHskQ1cSmGpFDHVb.6DY97L4XAWVmLL0sQUtXIHuSjsmpPai',0),(5,'Dinesh','451122733021','dinesh@example.com','9876543004','$2b$10$/dQIPKHskQ1cSmGpFDHVb.6DY97L4XAWVmLL0sQUtXIHuSjsmpPai',0),(6,'Abhisheik','451122733022','abhisheik@example.com','9876543005','$2b$10$/dQIPKHskQ1cSmGpFDHVb.6DY97L4XAWVmLL0sQUtXIHuSjsmpPai',0),(7,'Ramu','451122733023','ramu@example.com','9876543006','$2b$10$/dQIPKHskQ1cSmGpFDHVb.6DY97L4XAWVmLL0sQUtXIHuSjsmpPai',0),(8,'Rajesh','451122733024','rajesh@example.com','9876543007','$2b$10$/dQIPKHskQ1cSmGpFDHVb.6DY97L4XAWVmLL0sQUtXIHuSjsmpPai',0),(9,'Chandu','451122733025','chandu@example.com','9876543008','$2b$10$/dQIPKHskQ1cSmGpFDHVb.6DY97L4XAWVmLL0sQUtXIHuSjsmpPai',0),(10,'Ashresh','451122733026','ashresh@example.com','9876543009','$2b$10$/dQIPKHskQ1cSmGpFDHVb.6DY97L4XAWVmLL0sQUtXIHuSjsmpPai',0),(11,'k','451122733037','kamesh432@gmail.com','9968953211','$2b$10$cQq2DJ2J89/TIB1orSsL9eusbkfaSPZb4DQorGHJ7lGFyymdbSO9u',0),(12,'katta chandu','451122733006','kattanu432@gmail.com','9968953211','$2b$10$mDHRx3/YXeUzFsopyA91Qe5UnfyOpuYivTu/nYpmiQ2epFQ1xI5wC',0),(13,'M.GAYATHRI','4511-22-733-047','munasugayathri@gmail.com','9381181609','$2b$10$P.7cHlClhx3NDski8ONLbed80.0CicCEyUiVfapBZUfz8Ow3babSi',0),(14,'Chandrashekar Azad','451122733017','bhupathirajesh04@gmail.com','7286910170','$2b$10$dSssLEzY/OUPvbbuuz32LOptiiY55mPMWPt6YhtE9F8aBeITTAOha',0),(15,'lipsika bhashyam','451122733029','lipsikha24@gmail.com','7286910170','$2b$10$e4TBxGesGKf1z9lmsE8LN.tt.I/GvrvWnU6OHz6N3ZORbGBYw9HTW',0),(16,'shivavanam','451122733043','rajeshbhupathi85@gmail.com','7286910170','$2b$10$gPF6dotfiugc1o/ksmUPqeFcfeJVt3Swgs2FWfH2ZMtna79EuIRgC',0),(19,'Banothu Rajesh','451122733049','rajeshrathod5140@gmail.com','8008297424','$2b$10$JQ.AeCQgEBBP7KQa1LQ3Mud183liYxzDlosIjw2L66.XfpdGSJkCG',0),(20,'cm','451122733007','cmshannu@gmail.com','7369865452','$2b$10$iM8Y0geltn8Fk49Y7QYZruMqZZGohR/pzTQ9VjVWBMMMlILa.bO/u',0);
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

-- Dump completed on 2025-10-14  9:01:08
