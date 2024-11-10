-- AlterTable
ALTER TABLE `thesis` ADD COLUMN `downloads_count` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `views_count` INTEGER NOT NULL DEFAULT 0;
