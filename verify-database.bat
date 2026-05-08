@echo off
chcp 65001 >nul
echo ========================================
echo    共创平台 - 数据库验证工具
echo ========================================
echo.

echo 正在检查数据库连接...
"C:\mysql-enterprise\bin\mysql.exe" -u co_creation_esdk -pGchzPPQ8sM6Rc2Xn co_creation_esdk -e "SELECT '数据库连接成功!' AS status;" 2>nul

if %errorlevel% neq 0 (
    echo ❌ 数据库连接失败!
    echo.
    echo 请检查:
    echo 1. MySQL 服务是否启动
    echo 2. 用户名和密码是否正确
    pause
    exit /b 1
)

echo.
echo ========================================
echo 数据库统计信息
echo ========================================

"C:\mysql-enterprise\bin\mysql.exe" -u co_creation_esdk -pGchzPPQ8sM6Rc2Xn co_creation_esdk -e "
SELECT 
    '用户数' AS 表名, 
    COUNT(*) AS 记录数 
FROM users
UNION ALL
SELECT 
    '分类数', 
    COUNT(*) 
FROM categories
UNION ALL
SELECT 
    '项目数', 
    COUNT(*) 
FROM projects
UNION ALL
SELECT 
    '参与记录数', 
    COUNT(*) 
FROM project_participants
UNION ALL
SELECT 
    '点赞记录数', 
    COUNT(*) 
FROM project_likes;
"

echo.
echo ========================================
echo 用户列表
echo ========================================

"C:\mysql-enterprise\bin\mysql.exe" -u co_creation_esdk -pGchzPPQ8sM6Rc2Xn co_creation_esdk -e "
SELECT id, username, email, bio FROM users LIMIT 10;
"

echo.
echo ========================================
echo 分类列表
echo ========================================

"C:\mysql-enterprise\bin\mysql.exe" -u co_creation_esdk -pGchzPPQ8sM6Rc2Xn co_creation_esdk -e "
SELECT id, name, project_count FROM categories ORDER BY sort_order;
"

echo.
echo ========================================
echo 项目列表
echo ========================================

"C:\mysql-enterprise\bin\mysql.exe" -u co_creation_esdk -pGchzPPQ8sM6Rc2Xn co_creation_esdk -e "
SELECT id, title, categoryName, like_count, participant_count, is_recommend, is_hot 
FROM projects 
ORDER BY id;
"

echo.
echo ========================================
echo ✅ 数据库验证完成!
echo ========================================
echo.

pause
