# 🎯 在线五子棋

一个现代化的实时多人在线五子棋游戏，基于 Node.js 和 Socket.IO 构建，支持全球玩家实时对战。

  

## ✨ 核心特性

### 🎮 游戏功能

- **经典五子棋**: 15×15 标准棋盘，黑子先行
- **实时对战**: 基于 WebSocket 的即时对局体验
- **智能判胜**: 自动检测横、竖、斜四个方向的五子连珠
- **超时机制**: 每步棋 5 分钟思考时间，防止恶意拖延

### 👥 多人系统

- **房间系统**: 创建/加入房间，支持密码保护
- **观战模式**: 无限观众席位，实时观看对局
- **玩家替换**: 观众可替换离线玩家继续游戏
- **实时聊天**: 房间内文字交流功能

### 🔐 用户管理

- **账号系统**: 注册登录，数据持久化存储
- **安全验证**: 随机数学验证码防机器注册
- **单点登录**: 防止同一账号多地登录
- **数据保护**: 用户信息和游戏记录安全存储

### 📊 数据统计

- **对局记录**: 完整的游戏历史和步骤回放
- **战绩统计**: 胜负记录和游戏时长统计
- **聊天记录**: 对局期间的交流内容保存

## 🚀 快速开始

### 📋 环境要求

- **Node.js**: 14.0+ (推荐 18.0+)
- **npm**: 6.0+ 或 **yarn**: 1.22+
- **浏览器**: Chrome 80+, Firefox 75+, Safari 13+

### 🛠️ 安装部署

1. **获取代码**
   
   ```bash
   git clone https://github.com/your-username/gomoku-online.git
   cd gomoku-online
   ```

2. **安装依赖**
   
   ```bash
   npm install
   # 或使用 yarn
   yarn install
   ```

3. **启动服务**
   
   ```bash
   # 生产模式
   npm start
   ```

# 开发模式（自动重启）

npm run dev

```
4. **访问游戏**
```

http://localhost:3000

```
### 🐳 Docker 部署

```bash
# 构建镜像
docker build -t gomoku-online .

# 运行容器
docker run -p 3000:3000 gomoku-online
```

## 🎯 游戏规则

### 🏁 基本规则

- **棋盘**: 15×15 格子，361 个交叉点
- **棋子**: 黑白两色，黑子先行
- **获胜**: 率先在横、竖、斜任一方向连成 5 子
- **平局**: 棋盘下满无人获胜

### 👤 用户规范

- **用户名**: 3-20 位英文字母和数字
- **密码**: 6-30 位英文字母和数字
- **验证码**: 注册时需完成数学运算验证
- **登录**: 同一账号仅允许单点登录

### 🏠 房间机制

- **容量**: 每房间最多 2 名对战玩家
- **观众**: 超员用户自动成为观众
- **密码**: 可设置房间密码保护
- **替换**: 观众可替换掉线玩家参战
- **超时**: 单步思考时间限制 5 分钟

## 📁 项目架构

```
gomoku-online/
├── 📄 app.js                 # 服务器主程序
├── 📄 package.json           # 项目配置文件
├── 📄 README.md             # 项目说明文档
├── 📄 Dockerfile            # Docker 配置
├── 📁 data/                 # 数据存储目录
│   ├── 📄 users.json        # 注册用户数据
│   ├── 📄 rooms.json        # 房间状态数据
│   └── 📄 matches.json      # 对局历史记录
├── 📁 public/               # 前端静态文件
│   ├── 📄 index.html        # 主页面结构
│   ├── 📄 style.css         # 样式表文件
│   └── 📄 script.js         # 客户端脚本
└── 📁 node_modules/         # 依赖包目录
```

## 🔧 技术栈

### 后端

- **Node.js**: 服务器运行环境
- **Express**: Web框架
- **Socket.IO**: 实时通信
- **UUID**: 唯一标识符生成
- **CORS**: 跨域支持

### 前端

- **HTML5**: 页面结构
- **CSS3**: 现代化样式设计
- **JavaScript ES6+**: 客户端逻辑
- **Socket.IO Client**: 实时通信客户端
- **Font Awesome**: 图标库

### 数据存储

- **JSON文件**: 轻量级数据持久化
- **内存缓存**: 实时数据处理

## 📡 服务器部署

### 本地部署

1. **确保端口可用**
   
   ```bash
   # 检查3000端口是否被占用
   netstat -an | grep 3000
   ```

2. **启动服务**
   
   ```bash
   npm start
   ```

3. **防火墙设置**
   
   ```bash
   # Windows防火墙允许Node.js
   # Linux iptables开放3000端口
   sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
   ```

### 云服务器部署

#### 1. 准备服务器

- 推荐配置: 1核2G内存
- 操作系统: Ubuntu 20.04 LTS
- 开放端口: 3000

#### 2. 安装环境

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

#### 3. 部署应用

```bash
# 上传代码到服务器
scp -r ./gomoku-online user@your-server:/home/user/

# 连接服务器
ssh user@your-server

# 进入项目目录
cd /home/user/gomoku-online

# 安装依赖
npm install

# 启动应用
npm start
```

#### 4. 使用PM2管理进程

```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start app.js --name "gomoku-online"

# 设置开机自启
pm2 startup
pm2 save

# 查看状态
pm2 status
```

#### 5. 配置Nginx反向代理（可选）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🎮 游戏功能

### 用户系统

- 用户注册（用户名、密码、验证码）
- 严格的输入验证（用户名和密码只能包含英文字母和数字）
- 用户登录验证
- 用户数据持久化存储
- 防止同一账号重复登录
- 实时输入格式验证

### 大厅功能

- 登录后进入游戏大厅
- 实时房间列表更新
- 创建房间（支持密码保护）
- 通过房间ID查找并加入房间
- 直接点击房间卡片加入（需要密码时会提示）
- 房间状态显示（等待中/游戏中）

### 游戏功能

- 15x15五子棋棋盘
- 实时对战
- 观战模式
- 玩家替换
- 聊天系统
- 超时处理
- 胜负判定

### 房间功能

- 每个房间都有唯一的8位ID
- 支持密码保护（可选）
- 房间列表实时更新
- 通过ID快速查找房间
- 房间满员自动开始游戏

### 数据功能

- 房间数据实时同步
- 对局记录保存
- 聊天记录保存
- 服务器重启数据清理

## 🔍 API接口

### Socket.IO事件

#### 客户端发送

- `register`: 用户注册
- `login`: 用户登录
- `enterLobby`: 进入大厅
- `createRoom`: 创建房间
- `joinRoom`: 加入房间
- `leaveRoom`: 离开房间
- `makeMove`: 下棋
- `sendMessage`: 发送聊天
- `replacePlayer`: 替换玩家

#### 服务器发送

- `authError`: 认证错误
- `authSuccess`: 注册成功
- `loginSuccess`: 登录成功
- `userInfo`: 用户信息
- `roomsList`: 房间列表
- `roomJoined`: 加入房间成功
- `roomUpdate`: 房间状态更新
- `gameStart`: 游戏开始
- `gameUpdate`: 游戏状态更新
- `gameEnd`: 游戏结束
- `newMessage`: 新聊天消息
- `playerTimeout`: 玩家超时
- `error`: 错误信息

## 🐛 故障排除

### 常见问题

1. **端口被占用**
   
   ```bash
   # 查找占用进程
   lsof -i :3000
   # 杀死进程
   kill -9 <PID>
   ```

2. **依赖安装失败**
   
   ```bash
   # 清理缓存
   npm cache clean --force
   # 删除node_modules重新安装
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Socket连接失败**
- 检查防火墙设置

- 确认服务器IP和端口

- 检查网络连接
4. **数据文件权限问题**
   
   ```bash
   # 设置正确权限
   chmod 755 data/
   chmod 644 data/*.json
   ```

## 📝 更新日志

### 🎉 v1.2.0 (2024-12-01)

- ✨ 新增随机验证码系统
- 🐛 修复玩家颜色显示问题
- 🎨 优化用户界面体验
- 📚 完善项目文档

### 🎉 v1.1.0 (2024-11-01)

- ✨ 新增观众替换功能
- 🔧 优化房间管理系统
- 🐛 修复连接稳定性问题

### 🎉 v1.0.0 (2024-10-01)

- 🎮 基础五子棋游戏功能
- 🏠 房间系统和实时对战
- 👥 用户注册登录系统
- 💬 聊天系统
- 📊 对局记录功能

## 🤝 贡献指南

### 🔄 开发流程

1. **Fork** 本仓库到你的账号
2. **Clone** 到本地开发环境
3. **创建** 特性分支 `git checkout -b feature/amazing-feature`
4. **提交** 你的更改 `git commit -m 'Add amazing feature'`
5. **推送** 到远程分支 `git push origin feature/amazing-feature`
6. **创建** Pull Request

### 📋 代码规范

- 使用 **2 空格** 缩进
- 遵循 **ESLint** 代码规范
- 添加必要的 **注释** 说明
- 保持代码 **简洁清晰**
- 编写 **单元测试** 覆盖新功能

### 🧪 测试指南

```bash
# 运行测试套件
npm test

# 代码覆盖率
npm run coverage

# 代码规范检查
npm run lint
```

## 📄 开源协议

本项目基于 **MIT License** 开源协议，详见 [LICENSE](LICENSE) 文件。

## 🙏 特别感谢

- 🚀 [Socket.IO](https://socket.io/) - 强大的实时通信框架
- ⚡ [Express.js](https://expressjs.com/) - 简洁的 Web 应用框架
- 🎨 [Font Awesome](https://fontawesome.com/) - 丰富的图标资源库
- 🌟 所有贡献者和用户的支持

## 📞 联系我们

- 🏠 **项目主页**: [GitHub Repository](https://github.com/your-username/gomoku-online)
- 🐛 **问题反馈**: [Issues](https://github.com/your-username/gomoku-online/issues)
- 💬 **讨论交流**: [Discussions](https://github.com/your-username/gomoku-online/discussions)
- 📧 **邮箱联系**: your-email@example.com

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给它一个 Star！⭐**

[🎮 立即体验](http://localhost:3000) | [📖 查看文档](README.md) | [🐛 报告问题](https://github.com/your-username/gomoku-online/issues)

</div>
