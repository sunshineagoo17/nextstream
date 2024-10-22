-- MySQL dump 10.13  Distrib 8.0.39, for macos14.4 (arm64)
--
-- Host: localhost    Database: nextstream_live
-- ------------------------------------------------------
-- Server version	8.0.39

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
-- Table structure for table `calendar_events`
--

DROP TABLE IF EXISTS `calendar_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `calendar_events` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `event_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `friend_id` int unsigned NOT NULL,
  `isAccepted` tinyint(1) DEFAULT '0',
  `isShared` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `calendar_events_event_id_foreign` (`event_id`),
  KEY `calendar_events_user_id_foreign` (`user_id`),
  KEY `calendar_events_friend_id_foreign` (`friend_id`),
  CONSTRAINT `calendar_events_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `calendar_events_friend_id_foreign` FOREIGN KEY (`friend_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `calendar_events_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `calendar_events`
--

LOCK TABLES `calendar_events` WRITE;
/*!40000 ALTER TABLE `calendar_events` DISABLE KEYS */;
/*!40000 ALTER TABLE `calendar_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `events` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `start` datetime NOT NULL,
  `end` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `eventType` enum('movie','tv','unknown') NOT NULL DEFAULT 'unknown',
  `media_id` varchar(255) DEFAULT NULL,
  `media_type` enum('movie','tv') DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `events_user_id_foreign` (`user_id`),
  CONSTRAINT `events_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events`
--

LOCK TABLES `events` WRITE;
/*!40000 ALTER TABLE `events` DISABLE KEYS */;
/*!40000 ALTER TABLE `events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `friends`
--

DROP TABLE IF EXISTS `friends`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `friends` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `friend_id` int unsigned NOT NULL,
  `isAccepted` tinyint(1) DEFAULT '0',
  `isBlocked` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `friends_user_id_foreign` (`user_id`),
  KEY `friends_friend_id_foreign` (`friend_id`),
  CONSTRAINT `friends_friend_id_foreign` FOREIGN KEY (`friend_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `friends_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `friends`
--

LOCK TABLES `friends` WRITE;
/*!40000 ALTER TABLE `friends` DISABLE KEYS */;
/*!40000 ALTER TABLE `friends` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `interactions`
--

DROP TABLE IF EXISTS `interactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `interactions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `userId` varchar(255) NOT NULL,
  `media_id` int NOT NULL,
  `interaction` tinyint(1) NOT NULL,
  `media_type` varchar(255) DEFAULT NULL,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `interactions`
--

LOCK TABLES `interactions` WRITE;
/*!40000 ALTER TABLE `interactions` DISABLE KEYS */;
INSERT INTO `interactions` VALUES (1,'1',101,1,'movie','2024-10-18 15:49:58'),(2,'1',103,1,'tv','2024-10-18 15:49:58');
/*!40000 ALTER TABLE `interactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `knex_migrations`
--

DROP TABLE IF EXISTS `knex_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `knex_migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `batch` int DEFAULT NULL,
  `migration_time` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `knex_migrations`
--

LOCK TABLES `knex_migrations` WRITE;
/*!40000 ALTER TABLE `knex_migrations` DISABLE KEYS */;
INSERT INTO `knex_migrations` VALUES (1,'20240708014519_create_users_table_with_constraints.js',1,'2024-10-18 15:47:08'),(2,'20240708210240_add_avatar_column.js',1,'2024-10-18 15:47:08'),(3,'20240710022144_create_events_table.js',1,'2024-10-18 15:47:08'),(4,'20240710121740_add_interactions_table.js',1,'2024-10-18 15:47:08'),(5,'20240712000000_create_viewed_media_table.js',1,'2024-10-18 15:47:08'),(6,'20240712025707_add_eventType_to_events.js',1,'2024-10-18 15:47:08'),(7,'20240713005203_alter_viewed_media_table.js',2,'2024-10-18 15:49:55'),(8,'20240713021909_update_interactions_media_type.js',2,'2024-10-18 15:49:55'),(9,'20240724052429_create_sent_recommendations_table.js',2,'2024-10-18 15:49:55'),(10,'20240829172601_create_media_statuses_table.js',2,'2024-10-18 15:49:55'),(11,'20240902000800_add_receivePushNotifications_to_users.js',2,'2024-10-18 15:49:55'),(12,'20240902034950_add_fcmToken_to_users.js',2,'2024-10-18 15:49:55'),(13,'20240902043543_add_notificationTime_and_customFields_to_users.js',2,'2024-10-18 15:49:55'),(14,'20240906233736_add_provider_and_nullable_password_to_users.js',2,'2024-10-18 15:49:55'),(15,'20240907174346_add_firebaseUid_and_deletedAt_to_users.js',2,'2024-10-18 15:49:55'),(16,'20240910221936_modify_events_table_for_shared_calendar.js',2,'2024-10-18 15:49:55'),(17,'20240910222803_create_friends_table.js',2,'2024-10-18 15:49:55'),(18,'20240910222902_create_messages_table.js',2,'2024-10-18 15:49:55'),(19,'20240914213042_add_unsubscribe_token_to_users.js',2,'2024-10-18 15:49:55'),(20,'20240930174915_fix_viewed_media_foreign_key.js',2,'2024-10-18 15:49:55'),(21,'20241001042124_add_season_episode_to_media_statuses.js',2,'2024-10-18 15:49:55'),(22,'20241001144249_update_message_column_charset.js',2,'2024-10-18 15:49:55'),(23,'20241001162148_add_tags_and_review_to_media_statuses.js',2,'2024-10-18 15:49:55'),(24,'20241002033845_add_shared_media_column.js',2,'2024-10-18 15:49:55'),(25,'20241002043349_add_watched_status_to_media_statuses.js',2,'2024-10-18 15:49:55'),(26,'20241002141334_add_media_columns_to_events.js',2,'2024-10-18 15:49:55');
/*!40000 ALTER TABLE `knex_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `knex_migrations_lock`
--

DROP TABLE IF EXISTS `knex_migrations_lock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `knex_migrations_lock` (
  `index` int unsigned NOT NULL AUTO_INCREMENT,
  `is_locked` int DEFAULT NULL,
  PRIMARY KEY (`index`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `knex_migrations_lock`
--

LOCK TABLES `knex_migrations_lock` WRITE;
/*!40000 ALTER TABLE `knex_migrations_lock` DISABLE KEYS */;
INSERT INTO `knex_migrations_lock` VALUES (1,0);
/*!40000 ALTER TABLE `knex_migrations_lock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `media_statuses`
--

DROP TABLE IF EXISTS `media_statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `media_statuses` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `userId` int unsigned NOT NULL,
  `media_id` int unsigned NOT NULL,
  `status` enum('to_watch','scheduled','shared_streams','watched') NOT NULL DEFAULT 'to_watch',
  `title` varchar(255) NOT NULL,
  `poster_path` varchar(255) DEFAULT NULL,
  `overview` text,
  `media_type` varchar(255) NOT NULL,
  `release_date` date DEFAULT NULL,
  `genre` varchar(255) DEFAULT NULL,
  `duration` int DEFAULT NULL,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `season` int DEFAULT '1',
  `episode` int DEFAULT '1',
  `tags` json DEFAULT NULL,
  `review` text,
  `is_shared` tinyint(1) DEFAULT '0',
  `shared_with_userId` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_media` (`userId`,`media_id`),
  KEY `media_statuses_shared_with_userid_foreign` (`shared_with_userId`),
  CONSTRAINT `media_statuses_shared_with_userid_foreign` FOREIGN KEY (`shared_with_userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `media_statuses`
--

LOCK TABLES `media_statuses` WRITE;
/*!40000 ALTER TABLE `media_statuses` DISABLE KEYS */;
/*!40000 ALTER TABLE `media_statuses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `sender_id` int unsigned NOT NULL,
  `receiver_id` int unsigned NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `messages_sender_id_foreign` (`sender_id`),
  KEY `messages_receiver_id_foreign` (`receiver_id`),
  CONSTRAINT `messages_receiver_id_foreign` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_sender_id_foreign` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sent_recommendations`
--

DROP TABLE IF EXISTS `sent_recommendations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sent_recommendations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `userId` int unsigned NOT NULL,
  `recommendationId` int unsigned NOT NULL,
  `sent_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `sent_recommendations_userid_foreign` (`userId`),
  CONSTRAINT `sent_recommendations_userid_foreign` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sent_recommendations`
--

LOCK TABLES `sent_recommendations` WRITE;
/*!40000 ALTER TABLE `sent_recommendations` DISABLE KEYS */;
/*!40000 ALTER TABLE `sent_recommendations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `isSubscribed` tinyint(1) DEFAULT '1',
  `receiveReminders` tinyint(1) DEFAULT '1',
  `receiveNotifications` tinyint(1) DEFAULT '1',
  `region` varchar(255) DEFAULT '',
  `resetPasswordToken` varchar(255) DEFAULT NULL,
  `resetPasswordExpires` bigint DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `avatar` varchar(255) DEFAULT NULL,
  `receivePushNotifications` tinyint(1) DEFAULT '0',
  `fcmToken` varchar(255) DEFAULT NULL,
  `notificationTime` varchar(255) DEFAULT NULL,
  `customHours` varchar(255) DEFAULT NULL,
  `customMinutes` varchar(255) DEFAULT NULL,
  `provider` varchar(255) DEFAULT NULL,
  `firebaseUid` varchar(255) DEFAULT NULL,
  `unsubscribeToken` varchar(255) DEFAULT NULL,
  `unsubscribeExpires` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Sunshine','sunshine','sunshine.agoo@gmail.com','$2a$10$wVffCxkSS1lGPmfjAQWg4.5vdlfHJwF9YZervbrZ3eQoV2BvxrMKO',1,1,1,1,'',NULL,NULL,'2024-10-18 15:49:58','2024-10-18 15:49:58',NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `viewed_media`
--

DROP TABLE IF EXISTS `viewed_media`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `viewed_media` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `userId` int unsigned NOT NULL,
  `media_id` int NOT NULL,
  `media_type` varchar(50) NOT NULL,
  `viewed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `viewed_media_userid_foreign` (`userId`),
  CONSTRAINT `viewed_media_userid_foreign` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `viewed_media`
--

LOCK TABLES `viewed_media` WRITE;
/*!40000 ALTER TABLE `viewed_media` DISABLE KEYS */;
INSERT INTO `viewed_media` VALUES (1,1,101,'movie','2024-10-18 15:49:58'),(2,1,103,'tv','2024-10-18 15:49:58');
/*!40000 ALTER TABLE `viewed_media` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-10-22 16:03:17
