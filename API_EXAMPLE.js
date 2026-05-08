/**
 * 共创平台后端 API 示例
 * 基于 Node.js + Express + MySQL
 * 
 * 此文件展示了如何根据前端需求实现后端 API
 */

const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// 数据库配置
const dbConfig = {
  host: 'localhost',
  user: 'co_creation_esdk',
  password: 'GchzPPQ8sM6Rc2Xn',
  database: 'co_creation_esdk'
};

// JWT 密钥
const JWT_SECRET = 'your-secret-key-change-in-production';

// 创建数据库连接池
const pool = mysql.createPool(dbConfig);

// ============================================
// 中间件
// ============================================

// 认证中间件
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: '无效的认证令牌' });
  }
}

// ============================================
// 用户接口
// ============================================

// 用户注册
app.post('/api/users/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 检查邮箱是否已存在
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: '邮箱或用户名已被注册' });
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // 插入新用户
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    res.status(201).json({
      message: '注册成功',
      userId: result.insertId
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 用户登录
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 查找用户
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }

    const user = users[0];

    // 验证密码
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }

    // 生成 JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取当前用户信息
app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, email, avatar, bio, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json({ data: users[0] });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// ============================================
// 分类接口
// ============================================

// 获取所有分类
app.get('/api/categories', async (req, res) => {
  try {
    const [categories] = await pool.execute(
      'SELECT * FROM categories WHERE status = 1 ORDER BY sort_order ASC'
    );

    res.json({ data: categories });
  } catch (error) {
    console.error('获取分类错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取单个分类
app.get('/api/categories/:id', async (req, res) => {
  try {
    const [categories] = await pool.execute(
      'SELECT * FROM categories WHERE id = ?',
      [req.params.id]
    );

    if (categories.length === 0) {
      return res.status(404).json({ message: '分类不存在' });
    }

    res.json({ data: categories[0] });
  } catch (error) {
    console.error('获取分类错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// ============================================
// 项目接口
// ============================================

// 获取项目列表
app.get('/api/projects', async (req, res) => {
  try {
    const { page = 1, pageSize = 12, categoryId, filter, sort } = req.query;
    const offset = (page - 1) * pageSize;

    let query = 'SELECT p.*, c.name as category_name, u.username as creator_name, u.avatar as creator_avatar FROM projects p JOIN categories c ON p.category_id = c.id JOIN users u ON p.creator_id = u.id WHERE p.status = 1';
    const params = [];

    // 分类筛选
    if (categoryId) {
      query += ' AND p.category_id = ?';
      params.push(categoryId);
    }

    // 过滤器
    if (filter === 'recommend') {
      query += ' AND p.is_recommend = 1';
    } else if (filter === 'hot') {
      query += ' AND p.is_hot = 1';
    }

    // 排序
    if (sort === 'latest') {
      query += ' ORDER BY p.created_at DESC';
    } else if (sort === 'hot') {
      query += ' ORDER BY p.like_count DESC';
    } else if (sort === 'participants') {
      query += ' ORDER BY p.participant_count DESC';
    } else {
      query += ' ORDER BY p.created_at DESC';
    }

    // 分页
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), parseInt(offset));

    const [projects] = await pool.execute(query, params);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM projects p WHERE p.status = 1';
    const countParams = [];
    
    if (categoryId) {
      countQuery += ' AND p.category_id = ?';
      countParams.push(categoryId);
    }
    
    if (filter === 'recommend') {
      countQuery += ' AND p.is_recommend = 1';
    } else if (filter === 'hot') {
      countQuery += ' AND p.is_hot = 1';
    }

    const [countResult] = await pool.execute(countQuery, countParams);

    // 格式化返回数据
    const formattedProjects = projects.map(project => ({
      id: project.id,
      title: project.title,
      description: project.description,
      coverImage: project.cover_image,
      categoryName: project.category_name,
      tags: JSON.parse(project.tags || '[]'),
      participantCount: project.participant_count,
      likeCount: project.like_count,
      commentCount: project.comment_count,
      isRecommend: project.is_recommend === 1,
      isHot: project.is_hot === 1,
      creator: {
        username: project.creator_name,
        avatar: project.creator_avatar
      }
    }));

    res.json({
      data: {
        projects: formattedProjects,
        total: countResult[0].total
      }
    });
  } catch (error) {
    console.error('获取项目列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取项目详情
app.get('/api/projects/:id', async (req, res) => {
  try {
    const [projects] = await pool.execute(
      `SELECT p.*, c.name as category_name, u.username as creator_name, u.avatar as creator_avatar, u.bio as creator_bio
       FROM projects p 
       JOIN categories c ON p.category_id = c.id 
       JOIN users u ON p.creator_id = u.id 
       WHERE p.id = ?`,
      [req.params.id]
    );

    if (projects.length === 0) {
      return res.status(404).json({ message: '项目不存在' });
    }

    const project = projects[0];

    // 获取参与者列表
    const [participants] = await pool.execute(
      `SELECT u.id, u.username, u.avatar, pp.role, pp.joined_at
       FROM project_participants pp
       JOIN users u ON pp.user_id = u.id
       WHERE pp.project_id = ?`,
      [req.params.id]
    );

    // 如果用户已登录,检查是否点赞和参与
    let isLiked = false;
    let isParticipated = false;

    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // 检查是否点赞
        const [likes] = await pool.execute(
          'SELECT id FROM project_likes WHERE project_id = ? AND user_id = ?',
          [req.params.id, decoded.id]
        );
        isLiked = likes.length > 0;

        // 检查是否参与
        const [participations] = await pool.execute(
          'SELECT id FROM project_participants WHERE project_id = ? AND user_id = ?',
          [req.params.id, decoded.id]
        );
        isParticipated = participations.length > 0;
      } catch (error) {
        // Token 无效,忽略
      }
    }

    res.json({
      data: {
        id: project.id,
        title: project.title,
        description: project.description,
        coverImage: project.cover_image,
        categoryName: project.category_name,
        tags: JSON.parse(project.tags || '[]'),
        participantCount: project.participant_count,
        likeCount: project.like_count,
        commentCount: project.comment_count,
        viewCount: project.view_count,
        isRecommend: project.is_recommend === 1,
        isHot: project.is_hot === 1,
        isLiked,
        isParticipated,
        creator: {
          id: project.creator_id,
          username: project.creator_name,
          avatar: project.creator_avatar,
          bio: project.creator_bio
        },
        participants: participants.map(p => ({
          id: p.id,
          username: p.username,
          avatar: p.avatar,
          role: p.role,
          joinedAt: p.joined_at
        })),
        createdAt: project.created_at,
        updatedAt: project.updated_at
      }
    });
  } catch (error) {
    console.error('获取项目详情错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建项目
app.post('/api/projects', authenticateToken, async (req, res) => {
  try {
    const { title, description, categoryId } = req.body;

    // 验证分类是否存在
    const [categories] = await pool.execute(
      'SELECT id FROM categories WHERE id = ?',
      [categoryId]
    );

    if (categories.length === 0) {
      return res.status(400).json({ message: '分类不存在' });
    }

    // 创建项目
    const [result] = await pool.execute(
      'INSERT INTO projects (title, description, category_id, creator_id) VALUES (?, ?, ?, ?)',
      [title, description, categoryId, req.user.id]
    );

    // 添加创建者为参与者
    await pool.execute(
      'INSERT INTO project_participants (project_id, user_id, role) VALUES (?, ?, "creator")',
      [result.insertId, req.user.id]
    );

    res.status(201).json({
      message: '项目创建成功',
      projectId: result.insertId
    });
  } catch (error) {
    console.error('创建项目错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 点赞项目
app.post('/api/projects/:id/like', authenticateToken, async (req, res) => {
  try {
    // 检查是否已点赞
    const [existingLikes] = await pool.execute(
      'SELECT id FROM project_likes WHERE project_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (existingLikes.length > 0) {
      return res.status(400).json({ message: '已经点赞过该项目' });
    }

    // 添加点赞
    await pool.execute(
      'INSERT INTO project_likes (project_id, user_id) VALUES (?, ?)',
      [req.params.id, req.user.id]
    );

    // 更新点赞数
    await pool.execute(
      'UPDATE projects SET like_count = like_count + 1 WHERE id = ?',
      [req.params.id]
    );

    res.json({ message: '点赞成功' });
  } catch (error) {
    console.error('点赞错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 取消点赞
app.delete('/api/projects/:id/like', authenticateToken, async (req, res) => {
  try {
    // 删除点赞记录
    const [result] = await pool.execute(
      'DELETE FROM project_likes WHERE project_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: '未找到点赞记录' });
    }

    // 更新点赞数
    await pool.execute(
      'UPDATE projects SET like_count = like_count - 1 WHERE id = ?',
      [req.params.id]
    );

    res.json({ message: '取消点赞成功' });
  } catch (error) {
    console.error('取消点赞错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 参与项目
app.post('/api/projects/:id/participate', authenticateToken, async (req, res) => {
  try {
    // 检查是否已参与
    const [existingParticipants] = await pool.execute(
      'SELECT id FROM project_participants WHERE project_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (existingParticipants.length > 0) {
      return res.status(400).json({ message: '已经参与该项目' });
    }

    // 添加参与者
    await pool.execute(
      'INSERT INTO project_participants (project_id, user_id, role) VALUES (?, ?, "member")',
      [req.params.id, req.user.id]
    );

    // 更新参与人数
    await pool.execute(
      'UPDATE projects SET participant_count = participant_count + 1 WHERE id = ?',
      [req.params.id]
    );

    res.json({ message: '参与成功' });
  } catch (error) {
    console.error('参与项目错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 取消参与
app.delete('/api/projects/:id/participate', authenticateToken, async (req, res) => {
  try {
    // 删除参与记录
    const [result] = await pool.execute(
      'DELETE FROM project_participants WHERE project_id = ? AND user_id = ? AND role = "member"',
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: '未找到参与记录' });
    }

    // 更新参与人数
    await pool.execute(
      'UPDATE projects SET participant_count = participant_count - 1 WHERE id = ?',
      [req.params.id]
    );

    res.json({ message: '取消参与成功' });
  } catch (error) {
    console.error('取消参与错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// ============================================
// 启动服务器
// ============================================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});

module.exports = app;
