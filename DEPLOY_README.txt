# 前端部署说明

## 数据库配�?
- 用户�? co_creation_esdk
- 密码: GchzPPQ8sM6Rc2Xn
- 主机: localhost:3306

## 部署步骤
1. 上传此压缩包到服务器
2. 解压到网站目�?

## Nginx 配置
location /api/ {
    proxy_pass http://127.0.0.1:5000/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
