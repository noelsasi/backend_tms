-- DropForeignKey
ALTER TABLE `Thesis` DROP FOREIGN KEY `Thesis_reviewer_id_fkey`;

-- AlterTable
ALTER TABLE `Thesis` MODIFY `reviewer_id` BIGINT NULL;

-- AddForeignKey
ALTER TABLE `Thesis` ADD CONSTRAINT `Thesis_reviewer_id_fkey` FOREIGN KEY (`reviewer_id`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
