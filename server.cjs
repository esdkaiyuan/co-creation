/**
 * 共创平台后端服务
 * 技术栈: Express + MySQL + JWT + bcrypt
 * 端口: 5000
 */

const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// 中间件配置
// ============================================

// CORS 配置
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// 数据库配置
// ============================================

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'co_creation_esdk',
  password: process.env.DB_PASSWORD || 'GchzPPQ8sM6Rc2Xn',
  database: process.env.DB_NAME || 'co_creation_esdk',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// JWT 密钥 - 从环境变量读取
const JWT_SECRET = process.env.JWT_SECRET || 'co-creation-secret-key-2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// 确保uploads目录存在
const uploadDir = path.join(__dirname, 'uploads', 'projects');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// multer配置
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('仅支持jpg/png格式的图片'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: fileFilter
});

// ============================================
// 工具函数
// ============================================

// 统一响应格式
function successResponse(res, data, message = '成功', code = 200) {
  res.json({ code, message, data });
}

function errorResponse(res, message = '失败', code = 500) {
  res.status(code).json({ code, message, data: null });
}

// 认证中间件
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return errorResponse(res, '未提供认证令牌', 401);
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return errorResponse(res, '无效的认证令牌', 403);
  }
}

// ============================================
// 文件上传接口
// ============================================

// 文件上传接口
app.post('/api/upload/image', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, '请选择要上传的图片', 400);
    }
    
    const fileUrl = `/uploads/projects/${req.file.filename}`;
    successResponse(res, { url: fileUrl }, '上传成功');
  } catch (error) {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return errorResponse(res, '图片大小不能超过2MB', 400);
      }
      return errorResponse(res, '文件上传失败', 400);
    }
    console.error('上传错误:', error);
    errorResponse(res, error.message || '上传失败', 400);
  }
});

// ============================================
// 用户接口
// ============================================

// 用户注册
app.post('/api/users/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 验证必填字段
    if (!username || !email || !password) {
      return errorResponse(res, '用户名、邮箱和密码不能为空', 400);
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse(res, '邮箱格式不正确', 400);
    }

    // 验证密码长度
    if (password.length < 6) {
      return errorResponse(res, '密码长度不能少于6位', 400);
    }

    // 检查邮箱或用户名是否已存在
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUsers.length > 0) {
      const field = existingUsers[0].email === email ? '邮箱' : '用户名';
      return errorResponse(res, `${field}已被注册`, 400);
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // 插入新用户
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    successResponse(res, { userId: result.insertId }, '注册成功', 200);
  } catch (error) {
    console.error('注册错误:', error);
    errorResponse(res, '服务器错误', 500);
  }
});

// 用户登录
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 验证必填字段
    if (!email || !password) {
      return errorResponse(res, '邮箱和密码不能为空', 400);
    }

    // 查找用户
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return errorResponse(res, '邮箱或密码错误', 401);
    }

    const user = users[0];

    // 检查用户状态
    if (user.status === 0) {
      return errorResponse(res, '账号已被禁用', 403);
    }

    // 验证密码
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return errorResponse(res, '邮箱或密码错误', 401);
    }

    // 生成 JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    successResponse(res, {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        isAdmin: user.is_admin === 1
      }
    }, '登录成功', 200);
  } catch (error) {
    console.error('登录错误:', error);
    errorResponse(res, '服务器错误', 500);
  }
});

// 获取当前用户信息
app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, email, avatar, bio, status, is_admin, created_at, updated_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return errorResponse(res, '用户不存在', 404);
    }

    // 将 is_admin 转换为 isAdmin 以匹配前端期望
    const userData = { ...users[0], isAdmin: users[0].is_admin === 1 };
    delete userData.is_admin;
    successResponse(res, userData, '获取成功', 200);
  } catch (error) {
    console.error('获取用户信息错误:', error);
    errorResponse(res, '服务器错误', 500);
  }
});

// 更新用户信息
app.put('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email, bio } = req.body;

    // 验证用户名
    if (username && (username.length < 2 || username.length > 20)) {
      return errorResponse(res, '用户名长度为2-20个字符', 400);
    }

    // 验证邮箱格式
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return errorResponse(res, '邮箱格式不正确', 400);
      }
    }

    // 验证简介长度
    if (bio && bio.length > 500) {
      return errorResponse(res, '个人简介不能超过500字', 400);
    }

    // 构建更新字段
    const updateFields = [];
    const updateValues = [];

    if (username) {
      updateFields.push('username = ?');
      updateValues.push(username);
    }
    if (email) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (bio !== undefined) {
      updateFields.push('bio = ?');
      updateValues.push(bio);
    }

    if (updateFields.length === 0) {
      return errorResponse(res, '没有需要更新的字段', 400);
    }

    updateValues.push(userId);

    await pool.execute(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // 返回更新后的用户信息
    const [users] = await pool.execute(
      'SELECT id, username, email, avatar, bio, status, is_admin, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    successResponse(res, users[0], '更新成功');
  } catch (error) {
    console.error('更新用户信息错误:', error);
    errorResponse(res, '服务器错误', 500);
  }
});

// ============================================
// 分类接口
// ============================================

// 获取所有分类
app.get('/api/categories', async (req, res) => {
  try {
    const [categories] = await pool.execute(
      `SELECT c.*, COUNT(p.id) as project_count 
       FROM categories c 
       LEFT JOIN projects p ON c.id = p.category_id AND p.status = 1
       WHERE c.status = 1 
       GROUP BY c.id 
       ORDER BY c.sort_order ASC`
    );

    successResponse(res, categories, '获取成功', 200);
  } catch (error) {
    console.error('获取分类错误:', error);
    errorResponse(res, '服务器错误', 500);
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
      return errorResponse(res, '分类不存在', 404);
    }

    successResponse(res, categories[0], '获取成功', 200);
  } catch (error) {
    console.error('获取分类错误:', error);
    errorResponse(res, '服务器错误', 500);
  }
});

// ============================================
// 项目接口
// ============================================

// 获取项目列表
app.get('/api/projects', async (req, res) => {
  try {
    const { page = 1, pageSize = 12, categoryId, filter, sort, keyword, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    // 兼容search和keyword参数
    const searchKeyword = search || keyword;

    let query = `
      SELECT p.*, c.name as category_name, 
             u.username as creator_name, u.avatar as creator_avatar 
      FROM projects p 
      JOIN categories c ON p.category_id = c.id 
      JOIN users u ON p.creator_id = u.id 
      WHERE p.status = 1 AND p.deleted_at IS NULL
    `;
    const params = [];

    // 分类筛选
    if (categoryId) {
      query += ' AND p.category_id = ?';
      params.push(categoryId);
    }

    // 关键词搜索
    if (searchKeyword) {
      query += ' AND (p.title LIKE ? OR p.description LIKE ?)';
      params.push(`%${searchKeyword}%`, `%${searchKeyword}%`);
    }

    // 过滤器
    if (filter && filter !== 'all') {
      if (filter === 'recommend') {
        query += ' AND p.is_recommend = 1';
      } else if (filter === 'hot') {
        query += ' AND p.is_hot = 1';
      } else if (filter === 'deadline') {
        // 查询未来7天内截止的项目
        const sevenDaysLater = new Date();
        sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
        
        query += ' AND p.end_date IS NOT NULL';
        query += ' AND p.end_date >= CURDATE()';
        query += ' AND p.end_date <= ?';
        params.push(sevenDaysLater.toISOString().split('T')[0]);
      }
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

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM projects p WHERE p.status = 1 AND p.deleted_at IS NULL';
    const countParams = [];
    
    if (categoryId) {
      countQuery += ' AND p.category_id = ?';
      countParams.push(categoryId);
    }
    
    if (searchKeyword) {
      countQuery += ' AND (p.title LIKE ? OR p.description LIKE ?)';
      countParams.push(`%${searchKeyword}%`, `%${searchKeyword}%`);
    }
    
    if (filter && filter !== 'all') {
      if (filter === 'recommend') {
        countQuery += ' AND p.is_recommend = 1';
      } else if (filter === 'hot') {
        countQuery += ' AND p.is_hot = 1';
      } else if (filter === 'deadline') {
        const sevenDaysLater = new Date();
        sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
        
        countQuery += ' AND p.end_date IS NOT NULL';
        countQuery += ' AND p.end_date >= CURDATE()';
        countQuery += ' AND p.end_date <= ?';
        countParams.push(sevenDaysLater.toISOString().split('T')[0]);
      }
    }

    const [countResult] = await pool.execute(countQuery, countParams);

    // 分页 - 直接使用字符串拼接而不是参数
    const limit = parseInt(pageSize) || 12;
    const offsetNum = offset || 0;
    query += ` LIMIT ${limit} OFFSET ${offsetNum}`;

    console.log('SQL Query:', query);
    console.log('SQL Params:', params);

    const [projects] = await pool.execute(query, params);

    // 获取用户token(如果有)
    let userId = null;
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (error) {
        // token无效,忽略
      }
    }

    // 格式化返回数据
    const formattedProjects = await Promise.all(projects.map(async project => {
      // 获取实时评论数量
      const [[commentCountResult]] = await pool.execute(
        'SELECT COUNT(*) as count FROM project_comments WHERE project_id = ?',
        [project.id]
      );

      // 获取实时收藏数量
      const [[favoriteCountResult]] = await pool.execute(
        'SELECT COUNT(*) as count FROM project_favorites WHERE project_id = ?',
        [project.id]
      );

      // 检查用户是否点赞
      let isLiked = false;
      if (userId) {
        const [[likeResult]] = await pool.execute(
          'SELECT id FROM project_likes WHERE project_id = ? AND user_id = ?',
          [project.id, userId]
        );
        isLiked = !!likeResult;
      }

      // 检查用户是否收藏
      let isFavorited = false;
      if (userId) {
        const [[favoriteResult]] = await pool.execute(
          'SELECT id FROM project_favorites WHERE project_id = ? AND user_id = ?',
          [project.id, userId]
        );
        isFavorited = !!favoriteResult;
      }

      return {
        id: project.id,
        title: project.title,
        description: project.description,
        coverImage: project.cover_image,
        categoryName: project.category_name,
        tags: typeof project.tags === 'string' ? JSON.parse(project.tags) : project.tags,
        participantCount: project.participant_count,
        likeCount: project.like_count,
        favoriteCount: favoriteCountResult.count,
        commentCount: commentCountResult.count,
        viewCount: project.view_count,
        isRecommend: project.is_recommend === 1,
        isHot: project.is_hot === 1,
        isLiked,
        isFavorited,
        endDate: project.end_date,
        creator: {
          username: project.creator_name,
          avatar: project.creator_avatar
        },
        createdAt: project.created_at,
        updatedAt: project.updated_at
      };
    }));

    successResponse(res, {
      projects: formattedProjects,
      total: countResult[0].total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    }, '获取成功', 200);
  } catch (error) {
    console.error('获取项目列表错误:', error);
    errorResponse(res, '服务器错误', 500);
  }
});

// 获取项目详情
app.get('/api/projects/:id', async (req, res) => {
  try {
    const [projects] = await pool.execute(
      `SELECT p.*, c.name as category_name, 
              u.id as creator_id, u.username as creator_name, 
              u.avatar as creator_avatar, u.bio as creator_bio
       FROM projects p 
       JOIN categories c ON p.category_id = c.id 
       JOIN users u ON p.creator_id = u.id 
       WHERE p.id = ?`,
      [req.params.id]
    );

    if (projects.length === 0) {
      return errorResponse(res, '项目不存在', 404);
    }

    const project = projects[0];

    // 增加浏览量
    await pool.execute(
      'UPDATE projects SET view_count = view_count + 1 WHERE id = ?',
      [req.params.id]
    );

    // 获取参与者列表
    const [participants] = await pool.execute(
      `SELECT u.id, u.username, u.avatar, pp.role, pp.joined_at
       FROM project_participants pp
       JOIN users u ON pp.user_id = u.id
       WHERE pp.project_id = ?
       ORDER BY pp.role ASC, pp.joined_at ASC`,
      [req.params.id]
    );

    // 如果用户已登录,检查是否点赞、收藏和参与
    let isLiked = false;
    let isFavorited = false;
    let isParticipated = false;

    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // 检查是否点赞
        const [likes] = await pool.execute(
          'SELECT id FROM project_likes WHERE project_id = ? AND user_id = ?',
          [req.params.id, decoded.id]
        );
        isLiked = likes.length > 0;

        // 检查是否收藏
        const [favorites] = await pool.execute(
          'SELECT id FROM project_favorites WHERE project_id = ? AND user_id = ?',
          [req.params.id, decoded.id]
        );
        isFavorited = favorites.length > 0;

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

    // 获取实时统计数据
    const [[likeCountResult]] = await pool.execute(
      'SELECT COUNT(*) as count FROM project_likes WHERE project_id = ?',
      [req.params.id]
    );

    const [[favoriteCountResult]] = await pool.execute(
      'SELECT COUNT(*) as count FROM project_favorites WHERE project_id = ?',
      [req.params.id]
    );

    const [[commentCountResult]] = await pool.execute(
      'SELECT COUNT(*) as count FROM project_comments WHERE project_id = ?',
      [req.params.id]
    );

    // 检查访问权限
    if (project.access_type === 'password') {
      const providedPassword = req.headers['x-access-password'];
      if (!providedPassword) {
        return errorResponse(res, '该项目需要密码访问', 403);
      }
      
      const passwordMatch = await bcrypt.compare(providedPassword, project.access_password);
      if (!passwordMatch) {
        return errorResponse(res, '访问密码错误', 403);
      }
    }

    successResponse(res, {
      id: project.id,
      title: project.title,
      description: project.description,
      coverImage: project.cover_image,
      repositoryUrl: project.repository_url,
      accessType: project.access_type,
      categoryName: project.category_name,
      tags: typeof project.tags === 'string' ? JSON.parse(project.tags) : project.tags,
      participantCount: project.participant_count,
      likeCount: likeCountResult.count,
      favoriteCount: favoriteCountResult.count,
      commentCount: commentCountResult.count,
      viewCount: project.view_count + 1,
      isRecommend: project.is_recommend === 1,
      isHot: project.is_hot === 1,
      endDate: project.end_date,
      isLiked,
      isFavorited,
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
    }, '获取成功', 200);
  } catch (error) {
    console.error('获取项目详情错误:', error);
    errorResponse(res, '服务器错误', 500);
  }
});

// 创建项目 (需要登录)
app.post('/api/projects', authenticateToken, async (req, res) => {
  try {
    const { title, description, categoryId, coverImage, repositoryUrl, endDate, accessType, accessPassword } = req.body;
    const creatorId = req.user.id;

    // 验证必填字段
    if (!title || !description || !categoryId || !repositoryUrl || !endDate) {
      return errorResponse(res, '项目名称、描述、分类、仓库地址和截止日期不能为空', 400);
    }

    if (title.length < 2 || title.length > 200) {
      return errorResponse(res, '项目名称长度在2-200个字符之间', 400);
    }

    if (description.length < 10) {
      return errorResponse(res, '项目描述不能少于10个字符', 400);
    }

    // 验证URL格式
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(repositoryUrl)) {
      return errorResponse(res, '请输入有效的仓库地址', 400);
    }

    // 验证访问权限
    const finalAccessType = accessType || 'public';
    let hashedPassword = null;
    
    if (finalAccessType === 'password') {
      if (!accessPassword || accessPassword.length < 6) {
        return errorResponse(res, '访问密码不能少于6位', 400);
      }
      hashedPassword = await bcrypt.hash(accessPassword, 10);
    }

    // 验证截止日期
    const endDateObj = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (endDateObj < today) {
      return errorResponse(res, '截止日期不能早于今天', 400);
    }

    // 验证分类是否存在
    const [categories] = await pool.execute(
      'SELECT id FROM categories WHERE id = ?',
      [categoryId]
    );

    if (categories.length === 0) {
      return errorResponse(res, '分类不存在', 400);
    }

    // 创建项目
    const [result] = await pool.execute(
      'INSERT INTO projects (title, description, cover_image, category_id, creator_id, repository_url, end_date, access_type, access_password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, description, coverImage || null, categoryId, creatorId, repositoryUrl, endDate, finalAccessType, hashedPassword]
    );

    // 添加创建者为参与者
    await pool.execute(
      'INSERT INTO project_participants (project_id, user_id, role) VALUES (?, ?, "creator")',
      [result.insertId, req.user.id]
    );

    // 更新分类的项目数量
    await pool.execute(
      'UPDATE categories SET project_count = project_count + 1 WHERE id = ?',
      [categoryId]
    );

    successResponse(res, { projectId: result.insertId }, '项目创建成功', 200);
  } catch (error) {
    console.error('创建项目错误:', error);
    errorResponse(res, '服务器错误', 500);
  }
});

// 编辑项目
app.put('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    // 1. 获取项目信息
    const [projects] = await pool.execute(
      'SELECT * FROM projects WHERE id = ? AND deleted_at IS NULL',
      [req.params.id]
    );
    
    if (projects.length === 0) {
      return errorResponse(res, '项目不存在', 404);
    }
    
    const project = projects[0];
    const userId = req.user.id;
    
    // 2. 获取用户信息(判断是否是管理员)
    const [users] = await pool.execute(
      'SELECT is_admin FROM users WHERE id = ?',
      [userId]
    );
    
    const isAdmin = users[0].is_admin === 1;
    const isCreator = project.creator_id === userId;
    
    // 3. 检查是否是参与者
    const [participants] = await pool.execute(
      'SELECT id FROM project_participants WHERE project_id = ? AND user_id = ?',
      [req.params.id, userId]
    );
    
    const isParticipant = participants.length > 0;
    
    // 4. 权限验证
    if (!isAdmin && !isCreator && !isParticipant) {
      return errorResponse(res, '无权编辑此项目', 403);
    }
    
    // 5. 根据权限确定可编辑的字段
    const updateFields = [];
    const updateValues = [];
    
    if (isAdmin || isCreator) {
      // 管理员和创建者可以编辑所有字段
      const { title, description, category_id, cover_image, end_date, 
              repository_url, access_type, access_password, tags } = req.body;
      
      if (title !== undefined) {
        updateFields.push('title = ?');
        updateValues.push(title);
      }
      if (description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(description);
      }
      if (category_id !== undefined) {
        updateFields.push('category_id = ?');
        updateValues.push(category_id);
      }
      if (cover_image !== undefined) {
        updateFields.push('cover_image = ?');
        updateValues.push(cover_image);
      }
      if (end_date !== undefined) {
        updateFields.push('end_date = ?');
        updateValues.push(end_date);
      }
      if (repository_url !== undefined) {
        updateFields.push('repository_url = ?');
        updateValues.push(repository_url);
      }
      if (access_type !== undefined) {
        updateFields.push('access_type = ?');
        updateValues.push(access_type);
      }
      if (access_password !== undefined && access_type === 'password') {
        const hashedPassword = await bcrypt.hash(access_password, 10);
        updateFields.push('access_password = ?');
        updateValues.push(hashedPassword);
      }
      if (tags !== undefined) {
        updateFields.push('tags = ?');
        updateValues.push(JSON.stringify(tags));
      }
    } else if (isParticipant) {
      // 参与者只能编辑基本信息
      const { description, tags } = req.body;
      
      if (description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(description);
      }
      if (tags !== undefined) {
        updateFields.push('tags = ?');
        updateValues.push(JSON.stringify(tags));
      }
    }
    
    // 6. 如果没有要更新的字段,返回成功
    if (updateFields.length === 0) {
      return successResponse(res, null, '没有需要更新的字段', 200);
    }
    
    // 7. 执行更新
    updateFields.push('updated_at = NOW()');
    updateValues.push(req.params.id);
    
    const query = `UPDATE projects SET ${updateFields.join(', ')} WHERE id = ?`;
    await pool.execute(query, updateValues);
    
    successResponse(res, null, '更新成功', 200);
  } catch (error) {
    console.error('更新项目错误:', error);
    errorResponse(res, '服务器错误', 500);
  }
});

// 删除项目(软删除)
app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    // 1. 获取项目信息
    const [projects] = await pool.execute(
      'SELECT * FROM projects WHERE id = ? AND deleted_at IS NULL',
      [req.params.id]
    );
    
    if (projects.length === 0) {
      return errorResponse(res, '项目不存在', 404);
    }
    
    const project = projects[0];
    const userId = req.user.id;
    
    // 2. 获取用户信息(判断是否是管理员)
    const [users] = await pool.execute(
      'SELECT is_admin FROM users WHERE id = ?',
      [userId]
    );
    
    const isAdmin = users[0].is_admin === 1;
    const isCreator = project.creator_id === userId;
    
    // 3. 权限验证: 只有管理员或创建者可以删除
    if (!isAdmin && !isCreator) {
      return errorResponse(res, '无权删除此项目', 403);
    }
    
    // 4. 软删除: 设置deleted_at为当前时间
    await pool.execute(
      'UPDATE projects SET deleted_at = NOW(), status = 0 WHERE id = ?',
      [req.params.id]
    );
    
    successResponse(res, null, '删除成功', 200);
  } catch (error) {
    console.error('删除项目错误:', error);
    errorResponse(res, '服务器错误', 500);
  }
});

// 点赞项目 (需要登录)
app.post('/api/projects/:id/like', authenticateToken, async (req, res) => {
  try {
    // 检查项目是否存在
    const [projects] = await pool.execute('SELECT id FROM projects WHERE id = ?', [req.params.id]);
    if (projects.length === 0) {
      return errorResponse(res, '项目不存在', 404);
    }

    // 检查是否已点赞
    const [existingLikes] = await pool.execute(
      'SELECT id FROM project_likes WHERE project_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (existingLikes.length > 0) {
      return errorResponse(res, '已经点赞过该项目', 400);
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

    successResponse(res, null, '点赞成功', 200);
  } catch (error) {
    console.error('点赞错误:', error);
    errorResponse(res, '服务器错误', 500);
  }
});

// 取消点赞 (需要登录)
app.delete('/api/projects/:id/like', authenticateToken, async (req, res) => {
  try {
    // 删除点赞记录
    const [result] = await pool.execute(
      'DELETE FROM project_likes WHERE project_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return errorResponse(res, '未找到点赞记录', 400);
    }

    // 更新点赞数
    await pool.execute(
      'UPDATE projects SET like_count = GREATEST(like_count - 1, 0) WHERE id = ?',
      [req.params.id]
    );

    successResponse(res, null, '取消点赞成功', 200);
  } catch (error) {
    console.error('取消点赞错误:', error);
    errorResponse(res, '服务器错误', 500);
  }
});

// 参与项目 (需要登录)
app.post('/api/projects/:id/participate', authenticateToken, async (req, res) => {
  try {
    // 检查项目是否存在
    const [projects] = await pool.execute('SELECT id, creator_id, access_type, access_password FROM projects WHERE id = ?', [req.params.id]);
    if (projects.length === 0) {
      return errorResponse(res, '项目不存在', 404);
    }

    // 不能参与自己创建的项目
    if (projects[0].creator_id === req.user.id) {
      return errorResponse(res, '不能参与自己创建的项目', 400);
    }

    // 如果是加密项目，需要验证密码
    if (projects[0].access_type === 'password') {
      const providedPassword = req.headers['x-access-password'];
      if (!providedPassword) {
        return errorResponse(res, '该项目需要密码才能参与', 403);
      }
      
      const passwordMatch = await bcrypt.compare(providedPassword, projects[0].access_password);
      if (!passwordMatch) {
        return errorResponse(res, '访问密码错误', 403);
      }
    }

    // 检查是否已参与
    const [existingParticipants] = await pool.execute(
      'SELECT id FROM project_participants WHERE project_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (existingParticipants.length > 0) {
      return errorResponse(res, '已经参与该项目', 400);
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

    successResponse(res, null, '参与成功', 200);
  } catch (error) {
    console.error('参与项目错误:', error);
    errorResponse(res, '服务器错误', 500);
  }
});

// 取消参与 (需要登录)
app.delete('/api/projects/:id/participate', authenticateToken, async (req, res) => {
  try {
    // 先获取项目信息和当前用户的参与角色
    const [projects] = await pool.execute(
      'SELECT creator_id FROM projects WHERE id = ?',
      [req.params.id]
    );
    
    if (projects.length === 0) {
      return errorResponse(res, '项目不存在', 404);
    }
    
    // 获取当前用户的参与记录
    const [participants] = await pool.execute(
      'SELECT role FROM project_participants WHERE project_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    
    if (participants.length === 0) {
      return errorResponse(res, '未找到参与记录', 400);
    }
    
    // 如果是创建者，不允许取消参与
    if (participants[0].role === 'creator') {
      return errorResponse(res, '项目创建者不能取消参与', 400);
    }
    
    // 删除参与记录(允许删除任何非creator角色)
    const [result] = await pool.execute(
      'DELETE FROM project_participants WHERE project_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return errorResponse(res, '未找到参与记录', 400);
    }

    // 更新参与人数
    await pool.execute(
      'UPDATE projects SET participant_count = GREATEST(participant_count - 1, 0) WHERE id = ?',
      [req.params.id]
    );

    successResponse(res, null, '取消参与成功', 200);
  } catch (error) {
    console.error('取消参与错误:', error);
    errorResponse(res, '服务器错误', 500);
  }
});

// ============================================
// 健康检查接口
// ============================================

app.get('/api/health', async (req, res) => {
  try {
    // 检查数据库连接
    await pool.execute('SELECT 1');
    successResponse(res, { status: 'ok', timestamp: new Date().toISOString() }, '服务正常', 200);
  } catch (error) {
    errorResponse(res, '数据库连接失败', 500);
  }
});

// ============================================
// 用户个人中心 API
// ============================================

// 获取用户创建的项目列表
app.get('/api/users/projects', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, pageSize = 12 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    const [projects] = await pool.execute(
      `SELECT p.*, c.name as category_name,
              (SELECT COUNT(*) FROM project_likes WHERE project_id = p.id) as like_count,
              (SELECT COUNT(*) FROM project_comments WHERE project_id = p.id) as comment_count
       FROM projects p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.creator_id = ? AND p.status = 1 AND p.deleted_at IS NULL
       ORDER BY p.created_at DESC
       LIMIT ${parseInt(pageSize)} OFFSET ${offset}`,
      [userId]
    );

    const [[countResult]] = await pool.execute(
      'SELECT COUNT(*) as total FROM projects WHERE creator_id = ? AND status = 1 AND deleted_at IS NULL',
      [userId]
    );

    successResponse(res, {
      projects: projects.map(p => ({
        ...p,
        coverImage: p.cover_image,
        categoryId: p.category_id,
        categoryName: p.category_name,
        likeCount: p.like_count,
        commentCount: p.comment_count,
        createdAt: p.created_at
      })),
      total: countResult.total
    });
  } catch (error) {
    console.error('获取用户项目错误:', error);
    errorResponse(res, '服务器错误', 500);
  }
});

// 获取用户参与的项目列表
app.get('/api/users/participated-projects', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    const [projects] = await pool.execute(
      `SELECT p.id, p.title, p.description, p.repository_url, p.end_date,
              p.participant_count, p.created_at,
              c.name as category_name,
              u.username as creator_name,
              u.avatar as creator_avatar
       FROM project_participants pp
       JOIN projects p ON pp.project_id = p.id
       LEFT JOIN categories c ON p.category_id = c.id
       JOIN users u ON p.creator_id = u.id
       WHERE pp.user_id = ? AND p.status = 1 AND p.deleted_at IS NULL
       ORDER BY pp.joined_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      [userId]
    );

    const [[countResult]] = await pool.execute(
      'SELECT COUNT(*) as total FROM project_participants pp JOIN projects p ON pp.project_id = p.id WHERE pp.user_id = ? AND p.status = 1 AND p.deleted_at IS NULL',
      [userId]
    );

    successResponse(res, {
      projects: projects.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        repositoryUrl: p.repository_url,
        endDate: p.end_date,
        participantCount: p.participant_count,
        categoryName: p.category_name,
        createdAt: p.created_at,
        creator: {
          username: p.creator_name,
          avatar: p.creator_avatar
        }
      })),
      total: countResult.total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    }, '获取成功', 200);
  } catch (error) {
    console.error('获取参与项目错误:', error);
    errorResponse(res, '服务器错误', 500);
  }
});

// 获取用户评论历史
app.get('/api/users/comments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    const [comments] = await pool.execute(
      `SELECT pc.id, pc.content, pc.created_at,
              p.id as project_id, p.title as project_title
       FROM project_comments pc
       JOIN projects p ON pc.project_id = p.id
       WHERE pc.user_id = ?
       ORDER BY pc.created_at DESC
       LIMIT ${parseInt(pageSize)} OFFSET ${offset}`,
      [userId]
    );

    const [[countResult]] = await pool.execute(
      'SELECT COUNT(*) as total FROM project_comments WHERE user_id = ?',
      [userId]
    );

    successResponse(res, {
      comments: comments.map(c => ({
        id: c.id,
        content: c.content,
        project: {
          id: c.project_id,
          title: c.project_title
        },
        createdAt: c.created_at
      })),
      total: countResult.total
    });
  } catch (error) {
    console.error('获取用户评论错误:', error);
    errorResponse(res, '服务器错误', 500);
  }
});

// 获取用户统计信息
app.get('/api/users/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [[projectResult]] = await pool.execute(
      'SELECT COUNT(*) as count FROM projects WHERE creator_id = ? AND status = 1 AND deleted_at IS NULL',
      [userId]
    );

    const [[favoriteResult]] = await pool.execute(
      'SELECT COUNT(*) as count FROM project_favorites WHERE user_id = ?',
      [userId]
    );

    const [[commentResult]] = await pool.execute(
      'SELECT COUNT(*) as count FROM project_comments WHERE user_id = ?',
      [userId]
    );

    successResponse(res, {
      projectCount: projectResult.count,
      favoriteCount: favoriteResult.count,
      commentCount: commentResult.count
    });
  } catch (error) {
    console.error('获取用户统计错误:', error);
    errorResponse(res, '服务器错误', 500);
  }
});

// ============================================
// 收藏功能 API
// ============================================

// 收藏项目
app.post('/api/projects/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 检查项目是否存在
    const [projects] = await pool.execute(
      'SELECT id FROM projects WHERE id = ? AND status = 1 AND deleted_at IS NULL',
      [id]
    );

    if (projects.length === 0) {
      return errorResponse(res, '项目不存在', 404);
    }

    // 检查是否已收藏
    const [existing] = await pool.execute(
      'SELECT id FROM project_favorites WHERE project_id = ? AND user_id = ?',
      [id, userId]
    );

    if (existing.length > 0) {
      return errorResponse(res, '已经收藏过该项目', 400);
    }

    // 添加收藏
    await pool.execute(
      'INSERT INTO project_favorites (project_id, user_id) VALUES (?, ?)',
      [id, userId]
    );

    successResponse(res, null, '收藏成功');
  } catch (error) {
    console.error('收藏项目错误:', error);
    errorResponse(res, '服务器错误', 500);
  }
});

// 取消收藏
app.delete('/api/projects/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [result] = await pool.execute(
      'DELETE FROM project_favorites WHERE project_id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return errorResponse(res, '未找到收藏记录', 404);
    }

    successResponse(res, null, '取消收藏成功');
  } catch (error) {
    console.error('取消收藏错误:', error);
    errorResponse(res, '服务器错误', 500);
  }
});

// 获取用户收藏列表
app.get('/api/users/favorites', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, pageSize = 12 } = req.query;
    const pageNum = parseInt(page) || 1;
    const pageSizeNum = parseInt(pageSize) || 12;
    const offset = (pageNum - 1) * pageSizeNum;

    const [favorites] = await pool.execute(
      `SELECT p.*, c.name as category_name,
              (SELECT COUNT(*) FROM project_likes WHERE project_id = p.id) as like_count,
              (SELECT COUNT(*) FROM project_comments WHERE project_id = p.id) as comment_count
       FROM project_favorites pf
       JOIN projects p ON pf.project_id = p.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE pf.user_id = ? AND p.status = 1
       ORDER BY pf.created_at DESC
       LIMIT ${pageSizeNum} OFFSET ${offset}`,
      [userId]
    );

    const [[countResult]] = await pool.execute(
      'SELECT COUNT(*) as total FROM project_favorites WHERE user_id = ?',
      [userId]
    );

    successResponse(res, {
      favorites: favorites.map(f => ({
        ...f,
        coverImage: f.cover_image,
        categoryId: f.category_id,
        categoryName: f.category_name,
        likeCount: f.like_count,
        commentCount: f.comment_count,
        createdAt: f.created_at
      })),
      total: countResult.total
    });
  } catch (error) {
    console.error('获取收藏列表错误:', error);
    errorResponse(res, '服务器错误', 500);
  }
});

// ============================================
// 评论功能 API
// ============================================

// 发表评论/回复
app.post('/api/projects/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { content, parentId } = req.body;

    if (!content || content.trim().length === 0) {
      return errorResponse(res, '评论内容不能为空', 400);
    }

    if (content.length > 1000) {
      return errorResponse(res, '评论内容不能超过1000字', 400);
    }

    // 检查项目是否存在
    const [projects] = await pool.execute(
      'SELECT id FROM projects WHERE id = ? AND status = 1 AND deleted_at IS NULL',
      [id]
    );

    if (projects.length === 0) {
      return errorResponse(res, '项目不存在', 404);
    }

    // 如果是回复,检查父评论是否存在
    if (parentId) {
      const [parentComments] = await pool.execute(
        'SELECT id FROM project_comments WHERE id = ? AND project_id = ?',
        [parentId, id]
      );

      if (parentComments.length === 0) {
        return errorResponse(res, '父评论不存在', 404);
      }
    }

    // 插入评论
    const [result] = await pool.execute(
      'INSERT INTO project_comments (project_id, user_id, parent_id, content) VALUES (?, ?, ?, ?)',
      [id, userId, parentId || null, content]
    );

    successResponse(res, { commentId: result.insertId }, '评论成功');
  } catch (error) {
    console.error('发表评论错误:', error);
    errorResponse(res, '服务器错误', 500);
  }
});

// 获取项目评论列表
app.get('/api/projects/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 20 } = req.query;
    const pageNum = parseInt(page) || 1;
    const pageSizeNum = parseInt(pageSize) || 20;
    const offset = (pageNum - 1) * pageSizeNum;

    console.log('评论查询参数:', { id: parseInt(id), pageSize: pageSizeNum, offset });

    // 获取顶级评论(不包括回复)
    const [comments] = await pool.execute(
      `SELECT pc.*, u.username, u.avatar
       FROM project_comments pc
       JOIN users u ON pc.user_id = u.id
       WHERE pc.project_id = ? AND pc.parent_id IS NULL
       ORDER BY pc.created_at DESC
       LIMIT ${pageSizeNum} OFFSET ${offset}`,
      [parseInt(id)]
    );

    // 获取每个评论的回复
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const [replies] = await pool.execute(
          `SELECT pc.*, u.username, u.avatar
           FROM project_comments pc
           JOIN users u ON pc.user_id = u.id
           WHERE pc.parent_id = ?
           ORDER BY pc.created_at ASC`,
          [comment.id]
        );

        return {
          ...comment,
          replies: replies.map(r => ({
            ...r,
            createdAt: r.created_at
          })),
          replyCount: replies.length,
          createdAt: comment.created_at
        };
      })
    );

    const [[countResult]] = await pool.execute(
      'SELECT COUNT(*) as total FROM project_comments WHERE project_id = ? AND parent_id IS NULL',
      [parseInt(id)]
    );

    successResponse(res, {
      comments: commentsWithReplies,
      total: countResult.total
    });
  } catch (error) {
    console.error('获取评论列表错误:', error);
    errorResponse(res, '服务器错误', 500);
  }
});

// 更新评论
app.put('/api/comments/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return errorResponse(res, '评论内容不能为空', 400);
    }

    if (content.length > 1000) {
      return errorResponse(res, '评论内容不能超过1000字', 400);
    }

    // 检查评论是否存在且属于当前用户
    const [comments] = await pool.execute(
      'SELECT id, user_id FROM project_comments WHERE id = ?',
      [id]
    );

    if (comments.length === 0) {
      return errorResponse(res, '评论不存在', 404);
    }

    if (comments[0].user_id !== userId) {
      return errorResponse(res, '无权修改此评论', 403);
    }

    await pool.execute(
      'UPDATE project_comments SET content = ? WHERE id = ?',
      [content, id]
    );

    successResponse(res, null, '更新成功');
  } catch (error) {
    console.error('更新评论错误:', error);
    errorResponse(res, '服务器错误', 500);
  }
});

// 删除评论
app.delete('/api/comments/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 检查评论是否存在且属于当前用户
    const [comments] = await pool.execute(
      'SELECT id, user_id FROM project_comments WHERE id = ?',
      [id]
    );

    if (comments.length === 0) {
      return errorResponse(res, '评论不存在', 404);
    }

    if (comments[0].user_id !== userId) {
      return errorResponse(res, '无权删除此评论', 403);
    }

    await pool.execute('DELETE FROM project_comments WHERE id = ?', [id]);

    successResponse(res, null, '删除成功');
  } catch (error) {
    console.error('删除评论错误:', error);
    errorResponse(res, '服务器错误', 500);
  }
});

// 点赞评论
app.post('/api/comments/:id/like', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await pool.execute(
      'UPDATE project_comments SET like_count = like_count + 1 WHERE id = ?',
      [id]
    );

    successResponse(res, null, '点赞成功');
  } catch (error) {
    console.error('点赞评论错误:', error);
    errorResponse(res, '服务器错误', 500);
  }
});

// 取消点赞评论
app.post('/api/comments/:id/unlike', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await pool.execute(
      'UPDATE project_comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = ?',
      [id]
    );

    successResponse(res, null, '取消点赞成功');
  } catch (error) {
    console.error('取消点赞评论错误:', error);
    errorResponse(res, '服务器错误', 500);
  }
});

// ============================================
// 错误处理
// ============================================

// 404 处理
app.use((req, res) => {
  errorResponse(res, '接口不存在', 404);
});

// 全局错误处理
app.use((error, req, res, next) => {
  console.error('未捕获的错误:', error);
  errorResponse(res, '服务器内部错误', 500);
});

// ============================================
// 启动服务器
// ============================================

async function startServer() {
  try {
    // 测试数据库连接
    await pool.execute('SELECT 1');
    console.log('✅ 数据库连接成功');
    
    // 启动服务
    app.listen(PORT, () => {
      console.log(`🚀 后端服务已启动: http://localhost:${PORT}`);
      console.log(`📡 API 地址: http://localhost:${PORT}/api`);
      console.log(`🔗 健康检查: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ 启动失败:', error);
    console.error('错误详情:', error.message);
    console.error('完整错误:', error.stack);
    process.exit(1);
  }
}

// 验证项目密码
app.post('/api/projects/:id/verify-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return errorResponse(res, '请提供访问密码', 400);
    }

    const [projects] = await pool.execute(
      'SELECT id, access_type, access_password FROM projects WHERE id = ? AND status = 1 AND deleted_at IS NULL',
      [id]
    );

    if (projects.length === 0) {
      return errorResponse(res, '项目不存在', 404);
    }

    const project = projects[0];

    if (project.access_type !== 'password') {
      return errorResponse(res, '该项目无需密码访问', 400);
    }

    const passwordMatch = await bcrypt.compare(password, project.access_password);
    if (!passwordMatch) {
      return errorResponse(res, '访问密码错误', 403);
    }

    successResponse(res, { verified: true }, '验证成功');
  } catch (error) {
    console.error('验证密码错误:', error);
    errorResponse(res, '服务器错误', 500);
  }
});

startServer();

// 启动定时清理任务
require('./cleanup_deleted_projects.js');

module.exports = app;
