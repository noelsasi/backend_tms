/*
  Warnings:

  - You are about to drop the column `downvotes` on the `thesis` table. All the data in the column will be lost.
  - You are about to drop the column `upvotes` on the `thesis` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `thesis` DROP COLUMN `downvotes`,
    DROP COLUMN `upvotes`;

-- CreateTable
CREATE TABLE `ThesisVote` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `thesis_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `vote_type` ENUM('UPVOTE', 'DOWNVOTE') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ThesisVote_thesis_id_user_id_key`(`thesis_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ThesisVote` ADD CONSTRAINT `ThesisVote_thesis_id_fkey` FOREIGN KEY (`thesis_id`) REFERENCES `Thesis`(`thesis_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ThesisVote` ADD CONSTRAINT `ThesisVote_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
