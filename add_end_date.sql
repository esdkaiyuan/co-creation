-- ============================================
-- 添加项目截止日期字段
-- ============================================

USE co_creation_esdk;

-- 添加截止日期字段到projects表
ALTER TABLE `projects` 
ADD COLUMN `end_date` DATE DEFAULT NULL COMMENT '项目参与截止日期' AFTER `tags`;

-- 为现有项目设置默认截止日期(创建后30天)
UPDATE `projects` 
SET `end_date` = DATE_ADD(`created_at`, INTERVAL 30 DAY)
WHERE `end_date` IS NULL;

-- 添加索引
ALTER TABLE `projects` ADD INDEX `idx_end_date` (`end_date`);

SELECT '✅ 项目截止日期字段添加完成!' AS message;
