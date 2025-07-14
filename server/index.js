const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { nanoid } = require('nanoid');
require('dotenv').config();

// 游戏状态管理
const { 
  createRoom, 
  joinRoom, 
  leaveRoom, 
  getRooms, 
  getRoom, 
  makeMove, 
  switchPlayer,
  addSpectator,
  removeSpectator,
  spectatorJoinGame
} = require('./controllers/gameController');

const app = express();
app.use(cors());
app.use(express.json());

// 生产环境下提供静态文件
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

const server = http.createServer(app);

// 设置Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5173'],
    methods: ['GET', 'POST']
  }
});

// 在线用户管理
let onlineUsers = {};

// Socket.IO连接处理
io.on('connection', (socket) => {
  console.log(`用户已连接: ${socket.id}`);
  
  // 用户加入系统
  socket.on('user:join', ({ username }) => {
    onlineUsers[socket.id] = { id: socket.id, username, roomId: null };
    console.log(`用户 ${username} (${socket.id}) 已加入系统`);
    
    // 通知用户已成功连接
    socket.emit('user:joined', { id: socket.id, username });
  });
  
  // 获取房间列表
  socket.on('rooms:get', () => {
    const publicRooms = getRooms().filter(room => !room.isPrivate);
    socket.emit('rooms:list', publicRooms);
  });
  
  // 创建房间
  socket.on('room:create', ({ roomName, isPrivate, password }) => {
    if (!onlineUsers[socket.id]) return;
    
    const roomId = nanoid(6);
    const user = onlineUsers[socket.id];
    
    const room = createRoom({
      id: roomId,
      name: roomName,
      isPrivate,
      password,
      createdBy: user.id
    });
    
    // 更新用户状态
    onlineUsers[socket.id].roomId = roomId;
    
    // 加入房间
    socket.join(roomId);
    
    // 通知用户房间已创建
    socket.emit('room:created', { roomId, room });
    
    // 如果是公开房间，通知所有用户有新房间
    if (!isPrivate) {
      io.emit('room:new', { 
        id: room.id, 
        name: room.name, 
        players: room.players.length,
        spectators: room.spectators.length,
        hasPassword: !!room.password
      });
    }
  });
  
  // 加入房间
  socket.on('room:join', ({ roomId, password }) => {
    if (!onlineUsers[socket.id]) return;
    
    const room = getRoom(roomId);
    if (!room) {
      return socket.emit('error', { message: '房间不存在' });
    }
    
    // 检查密码
    if (room.password && room.password !== password) {
      return socket.emit('error', { message: '密码错误' });
    }
    
    const user = onlineUsers[socket.id];
    
    // 决定是作为玩家还是观众加入
    let joinedAsPlayer = false;
    
    if (room.players.length < 2) {
      // 作为玩家加入
      joinRoom(roomId, { id: user.id, username: user.username });
      joinedAsPlayer = true;
      
      // 如果现在有两名玩家，开始游戏
      const updatedRoom = getRoom(roomId);
      if (updatedRoom.players.length === 2) {
        // 随机决定谁是黑子（先手）
        const blackPlayerIndex = Math.round(Math.random());
        updatedRoom.players[blackPlayerIndex].isBlack = true;
        updatedRoom.currentPlayer = updatedRoom.players[blackPlayerIndex].id;
        updatedRoom.gameStarted = true;
        updatedRoom.startTime = Date.now();
        updatedRoom.lastMoveTime = Date.now();
      }
    } else {
      // 作为观众加入
      addSpectator(roomId, { id: user.id, username: user.username });
    }
    
    // 更新用户状态
    onlineUsers[socket.id].roomId = roomId;
    
    // 加入房间
    socket.join(roomId);
    
    // 通知用户已加入房间
    socket.emit('room:joined', { 
      room: getRoom(roomId), 
      joinedAsPlayer 
    });
    
    // 通知房间内其他人有新用户加入
    socket.to(roomId).emit('room:user_joined', { 
      user: { id: user.id, username: user.username },
      joinedAsPlayer
    });
    
    // 更新房间列表
    const publicRooms = getRooms().filter(r => !r.isPrivate);
    io.emit('rooms:list', publicRooms);
  });
  
  // 下棋
  socket.on('game:move', ({ roomId, position }) => {
    if (!onlineUsers[socket.id] || onlineUsers[socket.id].roomId !== roomId) return;
    
    const room = getRoom(roomId);
    if (!room || !room.gameStarted) {
      return socket.emit('error', { message: '游戏尚未开始' });
    }
    
    // 检查是否轮到该玩家
    if (room.currentPlayer !== socket.id) {
      return socket.emit('error', { message: '现在不是你的回合' });
    }
    
    // 检查位置是否已被占用
    if (room.board[position.y][position.x] !== null) {
      return socket.emit('error', { message: '该位置已被占用' });
    }
    
    // 获取当前玩家是黑子还是白子
    const currentPlayer = room.players.find(p => p.id === socket.id);
    const isBlack = currentPlayer.isBlack;
    
    // 更新棋盘
    makeMove(roomId, position, isBlack);
    
    // 检查是否获胜
    const winner = checkWinner(room.board, position, isBlack);
    
    if (winner) {
      // 游戏结束，有玩家获胜
      room.gameOver = true;
      room.winner = socket.id;
      
      // 通知所有玩家游戏结果
      io.to(roomId).emit('game:over', { 
        winner: { id: socket.id, username: currentPlayer.username },
        winningLine: winner
      });
    } else {
      // 切换玩家
      const nextPlayer = switchPlayer(roomId);
      room.lastMoveTime = Date.now();
      
      // 通知所有玩家下一步
      io.to(roomId).emit('game:next_turn', { 
        nextPlayer,
        lastMove: { position, isBlack }
      });
    }
  });
  
  // 观众加入游戏（替补）
  socket.on('game:spectator_join', ({ roomId }) => {
    if (!onlineUsers[socket.id] || onlineUsers[socket.id].roomId !== roomId) return;
    
    const room = getRoom(roomId);
    if (!room) {
      return socket.emit('error', { message: '房间不存在' });
    }
    
    // 检查是否已经是玩家
    const isAlreadyPlayer = room.players.some(p => p.id === socket.id);
    if (isAlreadyPlayer) {
      return socket.emit('error', { message: '你已经是玩家了' });
    }
    
    // 检查是否有空位
    if (room.players.length >= 2) {
      return socket.emit('error', { message: '没有空位可加入' });
    }
    
    // 从观众变为玩家
    const success = spectatorJoinGame(roomId, socket.id);
    if (!success) {
      return socket.emit('error', { message: '加入游戏失败' });
    }
    
    // 如果现在有两名玩家，开始游戏
    const updatedRoom = getRoom(roomId);
    if (updatedRoom.players.length === 2 && !updatedRoom.gameStarted) {
      // 随机决定谁是黑子（先手）
      const blackPlayerIndex = Math.round(Math.random());
      updatedRoom.players[blackPlayerIndex].isBlack = true;
      updatedRoom.currentPlayer = updatedRoom.players[blackPlayerIndex].id;
      updatedRoom.gameStarted = true;
      updatedRoom.startTime = Date.now();
      updatedRoom.lastMoveTime = Date.now();
    }
    
    // 通知所有人房间状态更新
    io.to(roomId).emit('room:updated', { room: updatedRoom });
  });
  
  // 离开房间
  socket.on('room:leave', () => {
    handleUserLeave(socket);
  });
  
  // 断开连接
  socket.on('disconnect', () => {
    console.log(`用户已断开连接: ${socket.id}`);
    handleUserLeave(socket);
    delete onlineUsers[socket.id];
  });
});

// 处理用户离开
function handleUserLeave(socket) {
  const user = onlineUsers[socket.id];
  if (!user || !user.roomId) return;
  
  const roomId = user.roomId;
  const room = getRoom(roomId);
  
  if (!room) return;
  
  // 检查是否是玩家
  const isPlayer = room.players.some(p => p.id === socket.id);
  
  if (isPlayer) {
    // 从玩家列表中移除
    leaveRoom(roomId, socket.id);
    
    // 如果游戏已经开始但还没结束，通知其他人
    if (room.gameStarted && !room.gameOver) {
      io.to(roomId).emit('game:player_left', { 
        playerId: socket.id,
        username: user.username
      });
    }
  } else {
    // 从观众列表中移除
    removeSpectator(roomId, socket.id);
  }
  
  // 离开房间
  socket.leave(roomId);
  
  // 更新用户状态
  onlineUsers[socket.id].roomId = null;
  
  // 通知房间内其他人
  socket.to(roomId).emit('room:user_left', { 
    userId: socket.id,
    username: user.username,
    wasPlayer: isPlayer
  });
  
  // 如果房间空了，删除房间
  const updatedRoom = getRoom(roomId);
  if (updatedRoom && updatedRoom.players.length === 0 && updatedRoom.spectators.length === 0) {
    // 房间已自动删除
    // 更新房间列表
    const publicRooms = getRooms().filter(r => !r.isPrivate);
    io.emit('rooms:list', publicRooms);
  }
}

// 检查是否获胜
function checkWinner(board, lastMove, isBlack) {
  const directions = [
    { x: 1, y: 0 },   // 水平
    { x: 0, y: 1 },   // 垂直
    { x: 1, y: 1 },   // 对角线
    { x: 1, y: -1 }   // 反对角线
  ];
  
  const { x, y } = lastMove;
  const value = isBlack ? 'black' : 'white';
  
  for (const direction of directions) {
    let count = 1; // 当前位置已经有一个棋子
    const winningPositions = [{ x, y }];
    
    // 正向检查
    for (let i = 1; i <= 4; i++) {
      const newX = x + direction.x * i;
      const newY = y + direction.y * i;
      
      if (
        newX >= 0 && newX < 15 &&
        newY >= 0 && newY < 15 &&
        board[newY][newX] === value
      ) {
        count++;
        winningPositions.push({ x: newX, y: newY });
      } else {
        break;
      }
    }
    
    // 反向检查
    for (let i = 1; i <= 4; i++) {
      const newX = x - direction.x * i;
      const newY = y - direction.y * i;
      
      if (
        newX >= 0 && newX < 15 &&
        newY >= 0 && newY < 15 &&
        board[newY][newX] === value
      ) {
        count++;
        winningPositions.push({ x: newX, y: newY });
      } else {
        break;
      }
    }
    
    if (count >= 5) {
      return winningPositions;
    }
  }
  
  return null;
}

// 定时检查超时
setInterval(() => {
  const rooms = getRooms();
  
  rooms.forEach(room => {
    if (room.gameStarted && !room.gameOver && room.lastMoveTime) {
      const currentTime = Date.now();
      const elapsedTime = currentTime - room.lastMoveTime;
      
      // 如果超过5分钟（300000毫秒）
      if (elapsedTime > 300000) {
        // 当前玩家超时，判定为另一方胜利
        const currentPlayerId = room.currentPlayer;
        const winner = room.players.find(p => p.id !== currentPlayerId);
        
        if (winner) {
          room.gameOver = true;
          room.winner = winner.id;
          
          // 通知所有玩家游戏结果
          io.to(room.id).emit('game:timeout', { 
            winner: { id: winner.id, username: winner.username },
            loser: { id: currentPlayerId }
          });
        }
      }
    }
  });
}, 10000); // 每10秒检查一次

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});