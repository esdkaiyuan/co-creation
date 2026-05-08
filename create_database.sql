-- 创建数据库
CREATE DATABASE IF NOT EXISTS co_creation_esdk 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 创建用户并授权
CREATE USER IF NOT EXISTS 'co_creation_esdk'@'localhost' 
IDENTIFIED BY 'GchzPPQ8sM6Rc2Xn';

-- 授予用户对所有表的完全权限
GRANT ALL PRIVILEGES ON co_creation_esdk.* TO 'co_creation_esdk'@'localhost';

-- 刷新权限
FLUSH PRIVILEGES;

-- 显示创建结果
SELECT 'Database and user created successfully!' AS result;
SHOW DATABASES LIKE 'co_creation_esdk';
SELECT user, host FROM mysql.user WHERE user = 'co_creation_esdk';
