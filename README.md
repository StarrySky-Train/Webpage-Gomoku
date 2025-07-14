# 五子棋在线对战系统

这是一个支持实时多人对战的五子棋网页游戏，具有响应式界面和现代化UI设计。

## 功能特点

- 实时多人对战
- 响应式游戏界面
- 现代化UI设计
- 自建房间功能
- 支持私密房间（通过房间ID加入）
- 支持公开房间（在大厅寻找对局）
- 支持观战模式
- 实时显示在线玩家列表
- 计时功能（每步最长思考时间5分钟）
- 支持观战者替补退出玩家
- 可设置房间密码

## 项目结构

```
├── client/             # 前端代码
│   ├── public/         # 静态资源
│   └── src/            # 源代码
│       ├── components/ # 组件
│       ├── pages/      # 页面
│       ├── styles/     # 样式
│       └── utils/      # 工具函数
├── server/             # 后端代码
│   ├── controllers/    # 控制器
│   ├── models/         # 数据模型
│   ├── routes/         # 路由
│   └── utils/          # 工具函数
└── README.md           # 项目说明
```

## 技术栈

- 前端：React.js, Socket.io-client, TailwindCSS
- 后端：Node.js, Express, Socket.io
- 数据库：MongoDB (可选)

## 部署指南

## 目录

1. [前提条件](#前提条件)
2. [本地开发](#本地开发)
3. [服务器部署](#服务器部署)
   - [使用普通VPS部署](#使用普通vps部署)
   - [使用Vercel和Heroku部署](#使用vercel和heroku部署)
4. [配置说明](#配置说明)
5. [常见问题](#常见问题)

## 前提条件

在开始部署之前，请确保您已经安装了以下软件：

- Node.js (v14.0.0 或更高版本)
- npm (v6.0.0 或更高版本)
- Git

## 本地开发

1. 克隆项目到本地：

```bash
git clone <项目仓库地址>
cd <项目文件夹>
```

2. 安装依赖：

```bash
npm run install-all
```

3. 创建环境变量文件：

```bash
cp .env.example .env
```

4. 修改 `.env` 文件中的配置（如有必要）。

5. 启动开发服务器：

```bash
npm run dev-all
```

这将同时启动前端和后端服务器。前端服务器运行在 http://localhost:3000，后端服务器运行在 http://localhost:5000。

## 服务器部署

### 使用普通VPS部署

#### 1. 准备服务器环境

以 Ubuntu 20.04 为例：

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 和 npm
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 Git
sudo apt-get install -y git

# 安装 PM2 (用于进程管理)
sudo npm install -g pm2
```

#### 2. 克隆和设置项目

```bash
# 克隆项目
git clone <项目仓库地址> /var/www/gomoku-online
cd /var/www/gomoku-online

# 安装依赖
npm run install-all

# 创建环境变量文件
cp .env.example .env
```

编辑 `.env` 文件，设置生产环境变量：

```
NODE_ENV=production
PORT=5000
```

#### 3. 构建前端

```bash
cd client
npm run build
cd ..
```

#### 4. 使用 PM2 启动服务

```bash
pm2 start server/index.js --name "gomoku-online"
```

#### 5. 设置 Nginx 反向代理（可选但推荐）

安装 Nginx：

```bash
sudo apt-get install -y nginx
```

创建 Nginx 配置文件：

```bash
sudo nano /etc/nginx/sites-available/gomoku-online
```

添加以下配置：

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置并重启 Nginx：

```bash
sudo ln -s /etc/nginx/sites-available/gomoku-online /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 6. 设置 SSL（可选但推荐）

使用 Certbot 获取 Let's Encrypt 证书：

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

按照提示完成 SSL 设置。

### 使用Vercel和Heroku部署

#### 前端部署到 Vercel

1. 在 Vercel 上创建账户并安装 Vercel CLI：

```bash
npm install -g vercel
```

2. 在项目的 `client` 目录中创建 `vercel.json` 文件：

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

3. 部署前端：

```bash
cd client
vercel
```

按照提示完成部署。

#### 后端部署到 Heroku

1. 在 Heroku 上创建账户并安装 Heroku CLI：

```bash
npm install -g heroku
heroku login
```

2. 在项目根目录创建 `Procfile`：

```
web: node server/index.js
```

3. 修改 `package.json` 中的 `engines` 字段：

```json
"engines": {
  "node": "16.x"
}
```

4. 创建 Heroku 应用并部署：

```bash
heroku create gomoku-online-api
git push heroku main
```

5. 设置环境变量：

```bash
heroku config:set NODE_ENV=production
```

6. 更新前端的 API 地址：

在 `client/src/App.js` 中，修改 Socket.io 连接：

```javascript
const socket = io(process.env.NODE_ENV === 'production' ? 'https://gomoku-online-api.herokuapp.com' : 'http://localhost:5000');
```

然后重新部署前端。

## 配置说明

### 环境变量

- `NODE_ENV`: 环境模式，可选值为 `development` 或 `production`
- `PORT`: 服务器端口号，默认为 `5000`

## 常见问题

### 1. WebSocket 连接失败

如果您在使用 Nginx 作为反向代理时遇到 WebSocket 连接问题，请确保 Nginx 配置中包含以下内容：

```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection 'upgrade';
```

### 2. 跨域问题

如果前端和后端部署在不同的域名下，可能会遇到跨域问题。请确保在 `server/index.js` 中正确配置了 CORS：

```javascript
const io = socketIo(server, {
  cors: {
    origin: "您的前端域名",
    methods: ["GET", "POST"]
  }
});
```

### 3. 服务器资源要求

本应用对服务器资源要求不高，一个基本的 VPS（1GB RAM, 1 vCPU）就足够运行。如果预期有大量用户同时在线，可以考虑增加服务器资源。

### 4. 持久化数据

当前版本不包含数据持久化功能。如果需要保存游戏记录、用户数据等，需要集成数据库（如 MongoDB）并修改相应的代码。