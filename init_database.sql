-- ============================================
-- 共创平台数据库初始化脚本
-- 数据库: co_creation_esdk
-- ============================================

-- 使用数据库
USE co_creation_esdk;

-- ============================================
-- 1. 创建用户表 (users)
-- ============================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
  `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  `email` VARCHAR(100) NOT NULL UNIQUE COMMENT '邮箱',
  `password` VARCHAR(255) NOT NULL COMMENT '密码(加密)',
  `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
  `bio` TEXT COMMENT '个人简介',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 1-正常, 0-禁用',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_email` (`email`),
  INDEX `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================
-- 2. 创建分类表 (categories)
-- ============================================
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '分类ID',
  `name` VARCHAR(50) NOT NULL UNIQUE COMMENT '分类名称',
  `icon` VARCHAR(50) DEFAULT NULL COMMENT '图标名称',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '分类描述',
  `sort_order` INT DEFAULT 0 COMMENT '排序顺序',
  `project_count` INT DEFAULT 0 COMMENT '项目数量',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 1-启用, 0-禁用',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分类表';

-- ============================================
-- 3. 创建项目表 (projects)
-- ============================================
DROP TABLE IF EXISTS `projects`;
CREATE TABLE `projects` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '项目ID',
  `title` VARCHAR(200) NOT NULL COMMENT '项目标题',
  `description` TEXT NOT NULL COMMENT '项目描述',
  `cover_image` VARCHAR(255) DEFAULT NULL COMMENT '封面图片URL',
  `category_id` INT UNSIGNED NOT NULL COMMENT '分类ID',
  `creator_id` INT UNSIGNED NOT NULL COMMENT '创建者ID',
  `participant_count` INT DEFAULT 0 COMMENT '参与人数',
  `like_count` INT DEFAULT 0 COMMENT '点赞数',
  `comment_count` INT DEFAULT 0 COMMENT '评论数',
  `view_count` INT DEFAULT 0 COMMENT '浏览量',
  `is_recommend` TINYINT DEFAULT 0 COMMENT '是否推荐: 1-是, 0-否',
  `is_hot` TINYINT DEFAULT 0 COMMENT '是否热门: 1-是, 0-否',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 1-进行中, 2-已完成, 0-已下架',
  `tags` JSON DEFAULT NULL COMMENT '标签数组',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_category` (`category_id`),
  INDEX `idx_creator` (`creator_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='项目表';

-- ============================================
-- 4. 创建项目参与者表 (project_participants)
-- ============================================
DROP TABLE IF EXISTS `project_participants`;
CREATE TABLE `project_participants` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '记录ID',
  `project_id` INT UNSIGNED NOT NULL COMMENT '项目ID',
  `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
  `role` VARCHAR(50) DEFAULT 'member' COMMENT '角色: creator-创建者, member-成员',
  `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_project_user` (`project_id`, `user_id`),
  INDEX `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='项目参与者表';

-- ============================================
-- 5. 创建项目点赞表 (project_likes)
-- ============================================
DROP TABLE IF EXISTS `project_likes`;
CREATE TABLE `project_likes` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '记录ID',
  `project_id` INT UNSIGNED NOT NULL COMMENT '项目ID',
  `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '点赞时间',
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_project_user` (`project_id`, `user_id`),
  INDEX `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='项目点赞表';

-- ============================================
-- 6. 插入模拟数据 - 用户
-- ============================================
INSERT INTO `users` (`username`, `email`, `password`, `avatar`, `bio`) VALUES
('张三', 'zhangsan@example.com', '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234', '', '热爱开源技术的开发者'),
('李四', 'lisi@example.com', '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234', '', 'UI/UX设计师，专注于用户体验'),
('王五', 'wangwu@example.com', '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234', '', '全栈工程师，AI爱好者'),
('赵六', 'zhaoliu@example.com', '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234', '', '摄影师，视觉艺术家'),
('钱七', 'qianqi@example.com', '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234', '', '物联网工程师，智能家居专家'),
('孙八', 'sunba@example.com', '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234', '', '教育科技创业者'),
('周九', 'zhoujiu@example.com', '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234', '', '独立游戏开发者'),
('吴十', 'wushi@example.com', '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234', '', '字体设计师，排版爱好者');

-- ============================================
-- 7. 插入模拟数据 - 分类
-- ============================================
INSERT INTO `categories` (`name`, `icon`, `description`, `sort_order`, `project_count`) VALUES
('技术开发', 'Monitor', '编程、软件开发、开源项目等技术相关领域', 1, 128),
('设计创意', 'Brush', 'UI/UX设计、平面设计、创意设计等', 2, 86),
('产品/运营', 'ShoppingBag', '产品设计、运营管理、市场推广等', 3, 64),
('内容创作', 'VideoCamera', '视频制作、写作、自媒体等内容创作', 4, 52),
('硬件/物联网', 'Cpu', '智能硬件、IoT设备、嵌入式开发等', 5, 38),
('研究学习', 'Reading', '学术研究、教育培训、知识分享等', 6, 45),
('开源专区', 'Share', '开源软件、开源硬件、开源社区项目', 7, 73),
('公益/社会创新', 'Handbag', '公益活动、社会企业、可持续发展项目', 8, 29);

-- ============================================
-- 8. 插入模拟数据 - 项目
-- ============================================
INSERT INTO `projects` (`title`, `description`, `cover_image`, `category_id`, `creator_id`, `participant_count`, `like_count`, `comment_count`, `view_count`, `is_recommend`, `is_hot`, `tags`) VALUES
('开源任务管理工具', '打造一个简洁易用的开源任务管理工具，支持多平台同步与团队协作。', 'https://picsum.photos/seed/task1/400/300', 1, 1, 12, 1200, 32, 5600, 1, 0, '["开发", "开源", "效率工具"]'),
('环保知识科普小程序', '通过趣味互动的方式，向大众普及环保知识，共建绿色未来。', 'https://picsum.photos/seed/eco2/400/300', 2, 2, 8, 980, 18, 4200, 0, 1, '["设计", "小程序", "公益"]'),
('AI 助手插件开发', '开发一个浏览器插件，集成 AI 能力，提升信息获取与处理效率。', 'https://picsum.photos/seed/ai3/400/300', 1, 3, 15, 1500, 45, 7800, 1, 1, '["开发", "AI", "效率工具"]'),
('摄影作品分享平台', '一个专注于摄影作品分享与交流的平台，发现美，记录美。', 'https://picsum.photos/seed/photo4/400/300', 2, 4, 7, 860, 21, 3500, 0, 0, '["设计", "开发", "社区"]'),
('智能家居控制系统', '基于物联网技术，实现家居设备的智能控制与自动化场景。', 'https://picsum.photos/seed/smart5/400/300', 5, 5, 10, 1100, 29, 4800, 0, 0, '["硬件", "物联网", "智能家居"]'),
('在线学习笔记协作平台', '支持多人协作的在线学习笔记工具，让学习更高效。', 'https://picsum.photos/seed/study6/400/300', 6, 6, 6, 730, 16, 2900, 0, 0, '["产品", "教育", "协作"]'),
('独立游戏《遗忘之境》', '一款像素风冒险解谜游戏，探索遗忘之地的秘密。', 'https://picsum.photos/seed/game7/400/300', 2, 7, 20, 2300, 68, 12000, 1, 1, '["游戏开发", "像素风", "独立游戏"]'),
('开源字体设计计划', '打造一套开放、可商用的高质量中文字体，服务广大设计师。', 'https://picsum.photos/seed/font8/400/300', 2, 8, 9, 990, 27, 4100, 0, 0, '["设计", "字体", "开源"]');

-- ============================================
-- 9. 插入项目参与者数据
-- ============================================
-- 项目1的参与者
INSERT INTO `project_participants` (`project_id`, `user_id`, `role`) VALUES
(1, 1, 'creator'),
(1, 2, 'member'),
(1, 3, 'member');

-- 项目2的参与者
INSERT INTO `project_participants` (`project_id`, `user_id`, `role`) VALUES
(2, 2, 'creator'),
(2, 4, 'member');

-- 项目3的参与者
INSERT INTO `project_participants` (`project_id`, `user_id`, `role`) VALUES
(3, 3, 'creator'),
(3, 1, 'member'),
(3, 5, 'member');

-- ============================================
-- 10. 插入项目点赞数据 (示例)
-- ============================================
INSERT INTO `project_likes` (`project_id`, `user_id`) VALUES
(1, 2),
(1, 3),
(1, 4),
(2, 1),
(2, 3),
(3, 1),
(3, 2),
(3, 4);

-- ============================================
-- 添加管理员字段和软删除字段
-- ============================================

-- 为users表添加is_admin字段
ALTER TABLE users 
ADD COLUMN is_admin TINYINT DEFAULT 0 COMMENT '是否管理员: 1-是, 0-否' 
AFTER status;

-- 为projects表添加deleted_at字段
ALTER TABLE projects 
ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT '删除时间(软删除)' 
AFTER updated_at;

-- 添加索引以优化查询
ALTER TABLE projects ADD INDEX idx_deleted_at (deleted_at);

-- ============================================
-- 完成提示
-- ============================================
SELECT '✅ 数据库初始化完成!' AS message;
SELECT COUNT(*) AS user_count FROM users;
SELECT COUNT(*) AS category_count FROM categories;
SELECT COUNT(*) AS project_count FROM projects;
SELECT COUNT(*) AS participant_count FROM project_participants;
SELECT COUNT(*) AS like_count FROM project_likes;
