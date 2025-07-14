# 五子棋在线对战游戏

这是一个支持实时多人对战的五子棋网页游戏，具有响应式界面和现代美观的UI设计。

## 功能特点

- 实时多人在线对战
- 响应式游戏界面，适配各种设备
- 现代美观的UI设计
- 支持创建私密/公开房间
- 房间密码保护功能
- 观战模式
- 实时显示在线玩家列表
- 计时系统（每步最长思考时间5分钟）
- 观战玩家可替补退出的对战玩家

## 技术栈

- 前端：React.js, Socket.IO-client, TailwindCSS
- 后端：Node.js, Express, Socket.IO
- 部署：Vercel/Cloudflare Pages & Workers

## 项目结构

```
├── client/             # 前端代码
│   ├── public/         # 静态资源
│   └── src/            # 源代码
│       ├── components/ # 组件
│       ├── pages/      # 页面
│       ├── context/    # 上下文
│       ├── hooks/      # 自定义钩子
│       └── utils/      # 工具函数
└── server/             # 后端代码
    ├── controllers/    # 控制器
    ├── models/         # 数据模型
    └── utils/          # 工具函数
```

## 部署指南

详细的部署指南请参考项目文档。