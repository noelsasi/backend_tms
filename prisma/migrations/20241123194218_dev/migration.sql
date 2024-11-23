-- AlterTable
ALTER TABLE `Message` ADD COLUMN `read` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Notification` ADD COLUMN `read` BOOLEAN NOT NULL DEFAULT false;
