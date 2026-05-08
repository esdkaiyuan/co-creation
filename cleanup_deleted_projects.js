import mysql from 'mysql2/promise';
import cron from 'node-cron';

// 数据库配置
const pool = mysql.createPool({
  host: 'localhost',
  user: 'co_creation_esdk',
  password: 'GchzPPQ8sM6Rc2Xn',
  database: 'co_creation_esdk',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 每天凌晨2点执行清理任务
cron.schedule('0 2 * * *', async () => {
  console.log(`[${new Date().toISOString()}] 开始清理6个月前的软删除项目...`);
  
  try {
    // 1. 查询6个月前软删除的项目
    const [deletedProjects] = await pool.execute(
      'SELECT id FROM projects WHERE deleted_at IS NOT NULL AND deleted_at < DATE_SUB(NOW(), INTERVAL 6 MONTH)'
    );
    
    if (deletedProjects.length === 0) {
      console.log('没有需要清理的项目');
      return;
    }
    
    console.log(`找到 ${deletedProjects.length} 个需要永久删除的项目`);
    
    // 2. 逐个删除项目及其关联数据
    for (const project of deletedProjects) {
      const projectId = project.id;
      
      try {
        // 删除评论
        await pool.execute('DELETE FROM project_comments WHERE project_id = ?', [projectId]);
        
        // 删除点赞
        await pool.execute('DELETE FROM project_likes WHERE project_id = ?', [projectId]);
        
        // 删除收藏
        await pool.execute('DELETE FROM project_favorites WHERE project_id = ?', [projectId]);
        
        // 删除参与者
        await pool.execute('DELETE FROM project_participants WHERE project_id = ?', [projectId]);
        
        // 删除项目
        await pool.execute('DELETE FROM projects WHERE id = ?', [projectId]);
        
        console.log(`已永久删除项目 ID: ${projectId}`);
      } catch (error) {
        console.error(`删除项目 ${projectId} 失败:`, error.message);
      }
    }
    
    console.log(`[${new Date().toISOString()}] 清理任务完成`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] 清理任务失败:`, error);
  }
});

console.log('定时清理任务已启动,每天凌晨2点执行');
