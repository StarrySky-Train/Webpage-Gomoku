const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 生产环境下提供静态文件
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? '*' : 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// 游戏房间数据
const rooms = {};

// 在线用户
const onlineUsers = {};

// 游戏逻辑
const BOARD_SIZE = 15;
const WIN_CONDITION = 5;

// 检查是否获胜
function checkWin(board, row, col, player) {
  const directions = [
    [0, 1],   // 水平
    [1, 0],   // 垂直
    [1, 1],   // 对角线
    [1, -1]   // 反对角线
  ];

  for (const [dx, dy] of directions) {
    let count = 1; // 当前位置已经有一个棋子

    // 正向检查
    for (let i = 1; i < WIN_CONDITION; i++) {
      const newRow = row + i * dx;
      const newCol = col + i * dy;
      if (
        newRow >= 0 && newRow < BOARD_SIZE &&
        newCol >= 0 && newCol < BOARD_SIZE &&
        board[newRow][newCol] === player
      ) {
        count++;
      } else {
        break;
      }
    }

    // 反向检查
    for (let i = 1; i < WIN_CONDITION; i++) {
      const newRow = row - i * dx;
      const newCol = col - i * dy;
      if (
        newRow >= 0 && newRow < BOARD_SIZE &&
        newCol >= 0 && newCol < BOARD_SIZE &&
        board[newRow][newCol] === player
      ) {
        count++;
      } else {
        break;
      }
    }

    if (count >= WIN_CONDITION) {
      return true;
    }
  }

  return false;
}

// 创建空棋盘
function createEmptyBoard() {
  return Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null));
}

// Socket.io 连接处理
io.on('connection', (socket) => {
  console.log(`用户连接: ${socket.id}`);
  
  // 用户加入
  socket.on('user_join', ({ username }) => {
    onlineUsers[socket.id] = {
      id: socket.id,
      username: username || `玩家${Object.keys(onlineUsers).length + 1}`,
      roomId: null
    };
    
    // 通知所有用户更新在线列表
    io.emit('update_online_users', Object.values(onlineUsers));
    
    // 发送房间列表给新用户
    const publicRooms = Object.entries(rooms)
      .filter(([_, room]) => !room.isPrivate)
      .map(([id, room]) => ({
        id,
        name: room.name,
        players: room.players.length,
        maxPlayers: 2,
        hasPassword: !!room.password,
        status: room.gameStarted ? '游戏中' : '等待中'
      }));
    
    socket.emit('room_list', publicRooms);
  });
  
  // 创建房间
  socket.on('create_room', ({ name, isPrivate, password }) => {
    const user = onlineUsers[socket.id];
    if (!user) return;
    
    // 如果用户已经在房间中，先离开
    if (user.roomId && rooms[user.roomId]) {
      leaveRoom(socket, user.roomId);
    }
    
    const roomId = uuidv4();
    rooms[roomId] = {
      id: roomId,
      name: name || `${user.username}的房间`,
      isPrivate: isPrivate || false,
      password: password || null,
      players: [{
        id: socket.id,
        username: user.username,
        role: null // 'black' 或 'white'
      }],
      spectators: [],
      board: createEmptyBoard(),
      currentTurn: null,
      gameStarted: false,
      moveHistory: [],
      blackMoves: 0,
      whiteMoves: 0,
      startTime: null,
      lastMoveTime: null,
      timeoutTimers: {}
    };
    
    // 更新用户房间信息
    user.roomId = roomId;
    onlineUsers[socket.id] = user;
    
    // 加入房间
    socket.join(roomId);
    
    // 通知用户房间创建成功
    socket.emit('room_created', {
      roomId,
      isPrivate: rooms[roomId].isPrivate
    });
    
    // 更新房间信息
    updateRoomInfo(roomId);
    
    // 如果是公开房间，更新房间列表
    if (!isPrivate) {
      updatePublicRoomList();
    }
  });
  
  // 加入房间
  socket.on('join_room', ({ roomId, password }) => {
    const user = onlineUsers[socket.id];
    if (!user) return;
    
    // 检查房间是否存在
    if (!rooms[roomId]) {
      return socket.emit('error', { message: '房间不存在' });
    }
    
    const room = rooms[roomId];
    
    // 检查密码
    if (room.password && room.password !== password) {
      return socket.emit('error', { message: '密码错误' });
    }
    
    // 如果用户已经在房间中，先离开
    if (user.roomId && rooms[user.roomId]) {
      leaveRoom(socket, user.roomId);
    }
    
    // 更新用户房间信息
    user.roomId = roomId;
    onlineUsers[socket.id] = user;
    
    // 加入房间
    socket.join(roomId);
    
    // 决定用户角色
    if (room.players.length < 2 && !room.gameStarted) {
      // 作为玩家加入
      room.players.push({
        id: socket.id,
        username: user.username,
        role: null
      });
      
      // 如果房间已满，开始游戏
      if (room.players.length === 2) {
        startGame(roomId);
      }
    } else {
      // 作为观众加入
      room.spectators.push({
        id: socket.id,
        username: user.username
      });
    }
    
    // 通知用户加入成功
    socket.emit('room_joined', { roomId });
    
    // 更新房间信息
    updateRoomInfo(roomId);
    
    // 如果是公开房间，更新房间列表
    if (!room.isPrivate) {
      updatePublicRoomList();
    }
  });
  
  // 离开房间
  socket.on('leave_room', () => {
    const user = onlineUsers[socket.id];
    if (!user || !user.roomId) return;
    
    leaveRoom(socket, user.roomId);
  });
  
  // 下棋
  socket.on('make_move', ({ row, col }) => {
    const user = onlineUsers[socket.id];
    if (!user || !user.roomId) return;
    
    const roomId = user.roomId;
    const room = rooms[roomId];
    if (!room) return;
    
    // 检查游戏是否已开始
    if (!room.gameStarted) {
      return socket.emit('error', { message: '游戏尚未开始' });
    }
    
    // 找到玩家
    const playerIndex = room.players.findIndex(p => p.id === socket.id);
    if (playerIndex === -1) {
      return socket.emit('error', { message: '你不是玩家' });
    }
    
    const player = room.players[playerIndex];
    
    // 检查是否轮到该玩家
    if (room.currentTurn !== player.role) {
      return socket.emit('error', { message: '现在不是你的回合' });
    }
    
    // 检查位置是否有效
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
      return socket.emit('error', { message: '无效的位置' });
    }
    
    // 检查位置是否已被占用
    if (room.board[row][col] !== null) {
      return socket.emit('error', { message: '该位置已有棋子' });
    }
    
    // 清除超时计时器
    if (room.timeoutTimers[player.role]) {
      clearTimeout(room.timeoutTimers[player.role]);
    }
    
    // 放置棋子
    room.board[row][col] = player.role;
    
    // 记录移动
    const moveTime = Date.now();
    room.moveHistory.push({
      player: player.role,
      row,
      col,
      time: moveTime
    });
    
    // 更新移动计数
    if (player.role === 'black') {
      room.blackMoves++;
    } else {
      room.whiteMoves++;
    }
    
    // 更新最后移动时间
    room.lastMoveTime = moveTime;
    
    // 检查是否获胜
    if (checkWin(room.board, row, col, player.role)) {
      // 游戏结束，宣布获胜者
      room.gameStarted = false;
      io.to(roomId).emit('game_over', {
        winner: player.role,
        winnerUsername: player.username
      });
      
      // 更新房间信息
      updateRoomInfo(roomId);
      return;
    }
    
    // 检查是否平局（棋盘已满）
    const isBoardFull = room.board.every(row => row.every(cell => cell !== null));
    if (isBoardFull) {
      room.gameStarted = false;
      io.to(roomId).emit('game_over', { draw: true });
      
      // 更新房间信息
      updateRoomInfo(roomId);
      return;
    }
    
    // 切换回合
    room.currentTurn = player.role === 'black' ? 'white' : 'black';
    
    // 设置超时计时器
    setMoveTimeout(roomId, room.currentTurn);
    
    // 通知房间内所有人移动结果
    io.to(roomId).emit('move_made', {
      row,
      col,
      player: player.role,
      nextTurn: room.currentTurn
    });
    
    // 更新房间信息
    updateRoomInfo(roomId);
  });
  
  // 观众加入游戏（替补）
  socket.on('spectator_join_game', () => {
    const user = onlineUsers[socket.id];
    if (!user || !user.roomId) return;
    
    const roomId = user.roomId;
    const room = rooms[roomId];
    if (!room) return;
    
    // 检查用户是否是观众
    const spectatorIndex = room.spectators.findIndex(s => s.id === socket.id);
    if (spectatorIndex === -1) {
      return socket.emit('error', { message: '你不是观众' });
    }
    
    // 检查是否有空位
    if (room.players.length >= 2) {
      return socket.emit('error', { message: '没有空位' });
    }
    
    // 从观众中移除
    const spectator = room.spectators.splice(spectatorIndex, 1)[0];
    
    // 确定角色
    const existingRole = room.players.length > 0 ? room.players[0].role : null;
    const newRole = existingRole === 'black' ? 'white' : 'black';
    
    // 添加为玩家
    room.players.push({
      id: socket.id,
      username: user.username,
      role: newRole
    });
    
    // 如果游戏已经开始，设置超时计时器
    if (room.gameStarted && room.currentTurn === newRole) {
      setMoveTimeout(roomId, newRole);
    }
    
    // 通知房间内所有人
    io.to(roomId).emit('player_joined', {
      username: user.username,
      role: newRole
    });
    
    // 更新房间信息
    updateRoomInfo(roomId);
  });
  
  // 获取公开房间列表
  socket.on('get_room_list', () => {
    const publicRooms = Object.entries(rooms)
      .filter(([_, room]) => !room.isPrivate)
      .map(([id, room]) => ({
        id,
        name: room.name,
        players: room.players.length,
        maxPlayers: 2,
        hasPassword: !!room.password,
        status: room.gameStarted ? '游戏中' : '等待中'
      }));
    
    socket.emit('room_list', publicRooms);
  });
  
  // 断开连接
  socket.on('disconnect', () => {
    console.log(`用户断开连接: ${socket.id}`);
    
    const user = onlineUsers[socket.id];
    if (user && user.roomId) {
      leaveRoom(socket, user.roomId);
    }
    
    // 从在线用户中移除
    delete onlineUsers[socket.id];
    
    // 通知所有用户更新在线列表
    io.emit('update_online_users', Object.values(onlineUsers));
  });
});

// 辅助函数

// 离开房间
function leaveRoom(socket, roomId) {
  const room = rooms[roomId];
  if (!room) return;
  
  const user = onlineUsers[socket.id];
  if (!user) return;
  
  // 从房间中移除用户
  const playerIndex = room.players.findIndex(p => p.id === socket.id);
  if (playerIndex !== -1) {
    // 是玩家
    const player = room.players.splice(playerIndex, 1)[0];
    
    // 如果游戏正在进行，通知其他人玩家离开
    if (room.gameStarted) {
      io.to(roomId).emit('player_left', {
        username: player.username,
        role: player.role
      });
    }
    
    // 清除该玩家的超时计时器
    if (room.timeoutTimers[player.role]) {
      clearTimeout(room.timeoutTimers[player.role]);
    }
  } else {
    // 是观众
    const spectatorIndex = room.spectators.findIndex(s => s.id === socket.id);
    if (spectatorIndex !== -1) {
      room.spectators.splice(spectatorIndex, 1);
    }
  }
  
  // 离开房间
  socket.leave(roomId);
  
  // 更新用户房间信息
  user.roomId = null;
  onlineUsers[socket.id] = user;
  
  // 如果房间空了，删除房间
  if (room.players.length === 0 && room.spectators.length === 0) {
    delete rooms[roomId];
    
    // 如果是公开房间，更新房间列表
    if (!room.isPrivate) {
      updatePublicRoomList();
    }
    
    return;
  }
  
  // 更新房间信息
  updateRoomInfo(roomId);
  
  // 如果是公开房间，更新房间列表
  if (!room.isPrivate) {
    updatePublicRoomList();
  }
}

// 开始游戏
function startGame(roomId) {
  const room = rooms[roomId];
  if (!room || room.players.length !== 2) return;
  
  // 随机分配角色
  const roles = ['black', 'white'];
  roles.sort(() => Math.random() - 0.5);
  
  room.players[0].role = roles[0];
  room.players[1].role = roles[1];
  
  // 设置游戏状态
  room.gameStarted = true;
  room.currentTurn = 'black'; // 黑子先行
  room.board = createEmptyBoard();
  room.moveHistory = [];
  room.blackMoves = 0;
  room.whiteMoves = 0;
  room.startTime = Date.now();
  room.lastMoveTime = Date.now();
  
  // 设置黑子的超时计时器
  setMoveTimeout(roomId, 'black');
  
  // 通知房间内所有人游戏开始
  io.to(roomId).emit('game_started', {
    black: room.players.find(p => p.role === 'black'),
    white: room.players.find(p => p.role === 'white'),
    currentTurn: room.currentTurn
  });
  
  // 更新房间信息
  updateRoomInfo(roomId);
}

// 设置移动超时
function setMoveTimeout(roomId, role) {
  const room = rooms[roomId];
  if (!room) return;
  
  // 清除现有计时器
  if (room.timeoutTimers[role]) {
    clearTimeout(room.timeoutTimers[role]);
  }
  
  // 设置新计时器 (5分钟)
  room.timeoutTimers[role] = setTimeout(() => {
    // 超时，当前玩家失败
    const player = room.players.find(p => p.role === role);
    if (!player) return;
    
    room.gameStarted = false;
    
    // 通知房间内所有人游戏结束
    io.to(roomId).emit('game_over', {
      timeout: true,
      loser: role,
      loserUsername: player.username,
      winner: role === 'black' ? 'white' : 'black',
      winnerUsername: room.players.find(p => p.role !== role)?.username
    });
    
    // 更新房间信息
    updateRoomInfo(roomId);
  }, 5 * 60 * 1000); // 5分钟
}

// 更新房间信息
function updateRoomInfo(roomId) {
  const room = rooms[roomId];
  if (!room) return;
  
  const roomInfo = {
    id: roomId,
    name: room.name,
    players: room.players,
    spectators: room.spectators,
    gameStarted: room.gameStarted,
    currentTurn: room.currentTurn,
    board: room.board,
    blackMoves: room.blackMoves,
    whiteMoves: room.whiteMoves,
    startTime: room.startTime,
    lastMoveTime: room.lastMoveTime
  };
  
  io.to(roomId).emit('room_info', roomInfo);
}

// 更新公开房间列表
function updatePublicRoomList() {
  const publicRooms = Object.entries(rooms)
    .filter(([_, room]) => !room.isPrivate)
    .map(([id, room]) => ({
      id,
      name: room.name,
      players: room.players.length,
      maxPlayers: 2,
      hasPassword: !!room.password,
      status: room.gameStarted ? '游戏中' : '等待中'
    }));
  
  io.emit('room_list', publicRooms);
}

// 启动服务器
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});