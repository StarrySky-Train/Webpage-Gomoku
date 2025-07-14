# 五子棋在线对战游戏部署指南

本文档提供了如何在Vercel和Cloudflare上部署五子棋在线对战游戏的详细步骤。

## 目录

1. [准备工作](#准备工作)
2. [Vercel部署](#vercel部署)
3. [Cloudflare部署](#cloudflare部署)
4. [自定义域名设置](#自定义域名设置)
5. [常见问题](#常见问题)

## 准备工作

在开始部署之前，请确保：

1. 你已经有一个GitHub、GitLab或Bitbucket账号，用于存储代码
2. 你已经注册了Vercel或Cloudflare账号
3. 你已经将项目代码推送到Git仓库

## Vercel部署

### 1. 准备项目

首先，我们需要对项目进行一些调整，以便在Vercel上正常运行：

1. 在项目根目录创建`vercel.json`文件：

```json
{
  "version": 2,
  "builds": [
    { "src": "client/package.json", "use": "@vercel/static-build", "config": { "distDir": "dist" } },
    { "src": "server/index.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/socket.io/(.*)", "dest": "server/index.js" },
    { "src": "/api/(.*)", "dest": "server/index.js" },
    { "src": "/(.*)", "dest": "client/dist/$1" }
  ]
}
```

2. 修改`client/package.json`中的build脚本：

```json
"build": "vite build",
```

3. 修改`client/src/store/socketStore.js`中的`getSocketUrl`函数，确保在生产环境中使用正确的URL：

```javascript
const getSocketUrl = () => {
  return process.env.NODE_ENV === 'production' 
    ? window.location.origin
    : 'http://localhost:3000'
}
```

### 2. 部署到Vercel

1. 登录[Vercel](https://vercel.com/)
2. 点击"New Project"按钮
3. 导入你的Git仓库
4. 配置项目：
   - 构建命令：`npm run build`
   - 输出目录：`client/dist`
   - 环境变量：添加`NODE_ENV=production`
5. 点击"Deploy"按钮

部署完成后，Vercel会提供一个URL，你可以通过该URL访问你的应用。

## Cloudflare部署

### 1. 使用Cloudflare Pages部署前端

1. 登录[Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入"Pages"部分
3. 点击"Create a project"按钮
4. 连接你的Git仓库
5. 配置构建设置：
   - 项目名称：`gomoku-online`（或你喜欢的名称）
   - 构建命令：`cd client && npm install && npm run build`
   - 构建输出目录：`client/dist`
   - 环境变量：添加`NODE_ENV=production`
6. 点击"Save and Deploy"按钮

### 2. 使用Cloudflare Workers部署后端

1. 在项目根目录创建`worker.js`文件：

```javascript
import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';
import { createRequestHandler } from '@remix-run/cloudflare-workers';
import serverCode from './server/index.js';

const app = express();
const server = createServer(app);
const io = new Server(server);

// 初始化Socket.IO服务器
serverCode(app, server, io);

// 创建Cloudflare Worker处理程序
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 处理Socket.IO请求
    if (url.pathname.startsWith('/socket.io')) {
      return await handleSocketIO(request);
    }
    
    // 处理API请求
    if (url.pathname.startsWith('/api')) {
      return await handleAPI(request);
    }
    
    // 其他请求交给静态文件处理
    return await handleStatic(request);
  }
};

async function handleSocketIO(request) {
  // 处理Socket.IO请求的逻辑
}

async function handleAPI(request) {
  // 处理API请求的逻辑
}

async function handleStatic(request) {
  // 处理静态文件请求的逻辑
}
```

2. 安装Cloudflare Wrangler CLI：

```bash
npm install -g wrangler
```

3. 创建`wrangler.toml`配置文件：

```toml
name = "gomoku-online-api"
type = "javascript"
zone_id = ""
usage_model = ""
workers_dev = true
compatibility_date = "2023-01-01"

[build]
command = "npm install"
watch_dir = "server"

[build.upload]
format = "service-worker"
```

4. 部署Worker：

```bash
wrangler publish
```

5. 配置前端与后端的连接：

修改`client/src/store/socketStore.js`中的`getSocketUrl`函数：

```javascript
const getSocketUrl = () => {
  return process.env.NODE_ENV === 'production' 
    ? 'https://gomoku-online-api.your-username.workers.dev'
    : 'http://localhost:3000'
}
```

## 自定义域名设置

### Vercel自定义域名

1. 在Vercel仪表板中，选择你的项目
2. 点击"Settings"选项卡
3. 在左侧菜单中选择"Domains"
4. 添加你的自定义域名
5. 按照Vercel提供的说明配置DNS记录

### Cloudflare自定义域名

1. 确保你的域名已添加到Cloudflare
2. 对于Pages：
   - 进入Pages项目
   - 点击"Custom domains"
   - 添加你的自定义域名
3. 对于Workers：
   - 进入Workers项目
   - 点击"Triggers"
   - 添加自定义域路由

## 常见问题

### Socket.IO连接问题

如果在部署后遇到Socket.IO连接问题，请检查：

1. 确保前端代码中的Socket.IO URL配置正确
2. 确保Vercel或Cloudflare的路由配置正确处理WebSocket连接
3. 在Cloudflare中，确保WebSocket请求没有被阻止

### 跨域问题

如果遇到跨域问题，请确保：

1. 服务器端的CORS配置正确
2. 在生产环境中，前端和后端应该使用相同的域名，这样可以避免跨域问题

### 部署失败

如果部署失败，请检查：

1. 构建日志，查找具体错误
2. 确保所有依赖都已正确安装
3. 确保环境变量配置正确

---

如有任何问题，请参考[Vercel文档](https://vercel.com/docs)或[Cloudflare文档](https://developers.cloudflare.com/pages/)，或在项目仓库中提交Issue。