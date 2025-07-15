const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// 创建Express应用
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// 设置静态文件目录
app.use(express.static(path.join(__dirname, 'public')));

// 添加路由处理
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/lobby', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'lobby.html'));
});

app.get('/game', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'game.html'));
});

// 确保数据目录存在
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// 确保记录目录存在
const recordsDir = path.join(dataDir, 'records');
if (!fs.existsSync(recordsDir)) {
  fs.mkdirSync(recordsDir);
}

// 数据文件路径
const roomsFilePath = path.join(dataDir, 'rooms.json');
const usersFilePath = path.join(dataDir, 'users.json');

// 初始化数据文件
if (!fs.existsSync(roomsFilePath)) {
  fs.writeFileSync(roomsFilePath, JSON.stringify([]));
}

if (!fs.existsSync(usersFilePath)) {
  fs.writeFileSync(usersFilePath, JSON.stringify([]));
}

// 读取房间数据
function getRooms() {
  try {
    const data = fs.readFileSync(roomsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取房间数据失败:', error);
    return [];
  }
}

// 保存房间数据
function saveRooms(rooms) {
  try {
    fs.writeFileSync(roomsFilePath, JSON.stringify(rooms, null, 2));
  } catch (error) {
    console.error('保存房间数据失败:', error);
  }
}

// 读取用户数据
function getUsers() {
  try {
    const data = fs.readFileSync(usersFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取用户数据失败:', error);
    return [];
  }
}

// 保存用户数据
function saveUsers(users) {
  try {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('保存用户数据失败:', error);
  }
}

// 创建新房间
function createRoom(roomName, isPrivate, password, creatorId) {
  const roomId = uuidv4().substring(0, 8);
  const newRoom = {
    id: roomId,
    name: roomName,
    isPrivate: isPrivate,
    hasPassword: !!password,
    password: password || '',
    players: [],
    spectators: [],
    hostId: creatorId, // 房主ID
    chatHistory: [], // 聊天历史记录
    gameState: {
      board: Array(15).fill().map(() => Array(15).fill(null)),
      currentTurn: 'black', // 当前回合，黑棋先行
      blackPiecesCount: 0,
      whitePiecesCount: 0,
      gameTime: 0,
      startTime: null, // 游戏开始时间
      gameStarted: false,
      gameEnded: false,
      winner: null,
      lastMove: null
    },
    createdAt: new Date().toISOString(),
    createdBy: creatorId
  };

  const rooms = getRooms();
  rooms.push(newRoom);
  saveRooms(rooms);
  return newRoom;
}

// 获取房间
function getRoom(roomId) {
  const rooms = getRooms();
  return rooms.find(room => room.id === roomId);
}

// 更新房间
function updateRoom(updatedRoom) {
  const rooms = getRooms();
  const index = rooms.findIndex(room => room.id === updatedRoom.id);
  if (index !== -1) {
    rooms[index] = updatedRoom;
    saveRooms(rooms);
    return true;
  }
  return false;
}

// 删除房间
function deleteRoom(roomId) {
  const rooms = getRooms();
  const filteredRooms = rooms.filter(room => room.id !== roomId);
  if (filteredRooms.length < rooms.length) {
    saveRooms(filteredRooms);
    return true;
  }
  return false;
}

// 添加用户
function addUser(userId, username) {
  const users = getUsers();
  const existingUser = users.find(user => user.id === userId);
  
  if (existingUser) {
    existingUser.username = username;
    existingUser.lastActive = new Date().toISOString();
    saveUsers(users);
    return existingUser;
  } else {
    const newUser = {
      id: userId,
      username: username,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };
    users.push(newUser);
    saveUsers(users);
    return newUser;
  }
}

// 获取用户
function getUser(userId) {
  const users = getUsers();
  return users.find(user => user.id === userId);
}

// 更新用户活跃时间
function updateUserActivity(userId) {
  const users = getUsers();
  const user = users.find(user => user.id === userId);
  if (user) {
    user.lastActive = new Date().toISOString();
    saveUsers(users);
  }
}

// 检查游戏是否结束
function checkGameOver(board, lastMove) {
  if (!lastMove) return null;
  
  const { row, col, player } = lastMove;
  const directions = [
    [1, 0],   // 水平
    [0, 1],   // 垂直
    [1, 1],   // 对角线
    [1, -1]   // 反对角线
  ];

  for (const [dx, dy] of directions) {
    let count = 1;
    
    // 正方向检查
    for (let i = 1; i <= 4; i++) {
      const newRow = row + i * dx;
      const newCol = col + i * dy;
      if (
        newRow >= 0 && newRow < 15 &&
        newCol >= 0 && newCol < 15 &&
        board[newRow][newCol] === player
      ) {
        count++;
      } else {
        break;
      }
    }
    
    // 反方向检查
    for (let i = 1; i <= 4; i++) {
      const newRow = row - i * dx;
      const newCol = col - i * dy;
      if (
        newRow >= 0 && newRow < 15 &&
        newCol >= 0 && newCol < 15 &&
        board[newRow][newCol] === player
      ) {
        count++;
      } else {
        break;
      }
    }
    
    if (count >= 5) {
      return player;
    }
  }
  
  // 检查是否平局（棋盘已满）
  let isFull = true;
  for (let i = 0; i < 15; i++) {
    for (let j = 0; j < 15; j++) {
      if (board[i][j] === null) {
        isFull = false;
        break;
      }
    }
    if (!isFull) break;
  }
  
  if (isFull) return 'draw';
  
  return null;
}

// 保存对局记录
function saveGameRecord(room) {
  try {
    // 创建对局记录对象
    const record = {
      id: uuidv4(),
      roomId: room.id,
      roomName: room.name,
      startTime: room.gameState.startTime,
      endTime: new Date().toISOString(),
      duration: room.gameState.gameTime || 0, // 游戏时长（秒）
      players: room.players.map(player => ({
        id: player.id,
        username: player.username,
        color: player.color
      })),
      spectators: room.spectators.map(spectator => ({
        id: spectator.id,
        username: spectator.username
      })),
      winner: room.gameState.winner,
      blackPieces: room.gameState.blackPieces || 0,
      whitePieces: room.gameState.whitePieces || 0,
      board: room.gameState.board,
      chatHistory: room.chatHistory || []
    };
    
    // 生成文件名，包含日期和ID
    const date = new Date();
    const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    const fileName = `${dateStr}_${record.id}.json`;
    
    // 保存记录
    fs.writeFileSync(path.join(dataDir, 'records', fileName), JSON.stringify(record, null, 2));
    console.log(`对局记录已保存: ${fileName}`);
    
    return record;
  } catch (error) {
    console.error('保存对局记录失败:', error);
    return null;
  }
}

// Socket.io连接处理
io.on('connection', (socket) => {
  console.log('新用户连接:', socket.id);
  let currentUser = null;
  let currentRoom = null;

  // 用户登录
  socket.on('login', ({ username, userId }) => {
    // 如果提供了userId，尝试恢复会话
    if (userId) {
      const existingUser = getUser(userId);
      if (existingUser) {
        currentUser = existingUser;
        updateUserActivity(userId);
      } else {
        // 如果userId无效，创建新用户
        currentUser = addUser(socket.id, username);
      }
    } else {
      // 创建新用户
      currentUser = addUser(socket.id, username);
    }

    socket.emit('loginSuccess', {
      userId: currentUser.id,
      username: currentUser.username
    });

    // 发送可用房间列表
    const publicRooms = getRooms().filter(room => !room.isPrivate);
    socket.emit('roomList', publicRooms);
  });

  // 获取房间列表
  socket.on('getRooms', () => {
    if (!currentUser) return;
    
    const publicRooms = getRooms().filter(room => !room.isPrivate);
    socket.emit('roomList', publicRooms);
  });

  // 创建房间
  socket.on('createRoom', ({ roomName, isPrivate, password }) => {
    if (!currentUser) return;
    
    const room = createRoom(roomName, isPrivate, password, currentUser.id);
    
    // 将创建者加入房间
    socket.join(room.id);
    room.players.push({
      id: currentUser.id,
      username: currentUser.username,
      role: 'player',
      color: null // 颜色稍后分配
    });
    updateRoom(room);
    
    currentRoom = room.id;
    
    socket.emit('roomCreated', room);
    
    // 如果是公开房间，通知所有用户有新房间
    if (!isPrivate) {
      socket.broadcast.emit('newRoom', {
        id: room.id,
        name: room.name,
        hasPassword: room.hasPassword,
        players: room.players.length,
        spectators: room.spectators.length,
        gameStarted: room.gameState.gameStarted
      });
    }
  });

  // 加入房间
  socket.on('joinRoom', ({ roomId, password }) => {
    if (!currentUser) return;
    
    const room = getRoom(roomId);
    if (!room) {
      return socket.emit('error', { message: '房间不存在' });
    }
    
    // 检查密码
    if (room.hasPassword && room.password !== password) {
      return socket.emit('error', { message: '密码错误' });
    }
    
    socket.join(roomId);
    currentRoom = roomId;
    
    // 决定用户角色（玩家或观众）
    if (room.players.length < 2 && !room.gameState.gameStarted) {
      // 作为玩家加入
      room.players.push({
        id: currentUser.id,
        username: currentUser.username,
        role: 'player',
        color: null // 颜色稍后分配
      });
      
      // 如果现在有两名玩家，开始游戏
      if (room.players.length === 2) {
        // 随机分配黑白棋
        const blackPlayerIndex = Math.round(Math.random());
        room.players[blackPlayerIndex].color = 'black';
        room.players[1 - blackPlayerIndex].color = 'white';
        
        room.gameState.currentPlayer = room.players[blackPlayerIndex].id;
        room.gameState.startTime = new Date().toISOString();
        room.gameState.lastMoveTime = new Date().toISOString();
        room.gameState.gameStarted = true;
      }
    } else {
      // 作为观众加入
      room.spectators.push({
        id: currentUser.id,
        username: currentUser.username
      });
    }
    
    updateRoom(room);
    
    // 通知房间内所有人有新用户加入
    io.to(roomId).emit('roomUpdate', room);
    
    // 通知用户成功加入房间
    socket.emit('joinedRoom', room);
  });

  // 下棋
  socket.on('placePiece', ({ row, col }) => {
    if (!currentUser || !currentRoom) return;
    
    const room = getRoom(currentRoom);
    if (!room || !room.gameState.gameStarted || room.gameState.gameOver) return;
    
    // 检查是否轮到该用户
    if (room.gameState.currentPlayer !== currentUser.id) {
      return socket.emit('error', { message: '不是你的回合' });
    }
    
    // 检查位置是否有效
    if (row < 0 || row >= 15 || col < 0 || col >= 15 || room.gameState.board[row][col] !== null) {
      return socket.emit('error', { message: '无效的位置' });
    }
    
    // 获取当前玩家颜色
    const player = room.players.find(p => p.id === currentUser.id);
    if (!player || !player.color) return;
    
    // 更新棋盘
    room.gameState.board[row][col] = player.color;
    
    // 更新棋子计数
    if (player.color === 'black') {
      room.gameState.blackPieces++;
    } else {
      room.gameState.whitePieces++;
    }
    
    // 更新最后移动时间
    room.gameState.lastMoveTime = new Date().toISOString();
    
    // 检查游戏是否结束
    const winner = checkGameOver(room.gameState.board, { row, col, player: player.color });
    if (winner) {
      room.gameState.gameOver = true;
      room.gameState.winner = winner;
    }
    
    // 切换玩家
    if (!room.gameState.gameOver) {
      const otherPlayer = room.players.find(p => p.id !== currentUser.id);
      if (otherPlayer) {
        room.gameState.currentPlayer = otherPlayer.id;
      }
    }
    
    updateRoom(room);
    
    // 通知房间内所有人棋盘更新
    io.to(currentRoom).emit('boardUpdate', {
      board: room.gameState.board,
      lastMove: { row, col, color: player.color },
      currentPlayer: room.gameState.currentPlayer,
      blackPieces: room.gameState.blackPieces,
      whitePieces: room.gameState.whitePieces,
      gameOver: room.gameState.gameOver,
      winner: room.gameState.winner
    });
  });

  // 观众请求成为玩家（当玩家离开时）
  socket.on('becomePlayer', () => {
    if (!currentUser || !currentRoom) return;
    
    const room = getRoom(currentRoom);
    if (!room) return;
    
    // 检查是否有空位
    if (room.players.length >= 2) {
      return socket.emit('error', { message: '没有空位' });
    }
    
    // 从观众中移除
    const spectatorIndex = room.spectators.findIndex(s => s.id === currentUser.id);
    if (spectatorIndex === -1) return;
    
    room.spectators.splice(spectatorIndex, 1);
    
    // 确定颜色
    let color = null;
    if (room.players.length === 1) {
      // 如果已有一名玩家，分配另一种颜色
      color = room.players[0].color === 'black' ? 'white' : 'black';
    } else {
      // 如果没有玩家，随机分配颜色
      color = Math.random() < 0.5 ? 'black' : 'white';
    }
    
    // 添加为玩家
    room.players.push({
      id: currentUser.id,
      username: currentUser.username,
      role: 'player',
      color: color
    });
    
    // 如果游戏已经开始但中断了，重新开始游戏
    if (room.players.length === 2 && !room.gameState.gameStarted) {
      room.gameState.currentPlayer = room.players.find(p => p.color === 'black').id;
      room.gameState.startTime = new Date().toISOString();
      room.gameState.lastMoveTime = new Date().toISOString();
      room.gameState.gameStarted = true;
    }
    
    updateRoom(room);
    
    // 通知房间内所有人
    io.to(currentRoom).emit('roomUpdate', room);
  });

  // 重置游戏
  socket.on('resetGame', () => {
    if (!currentUser || !currentRoom) return;
    
    const room = getRoom(currentRoom);
    if (!room) return;
    
    // 检查是否是玩家
    const isPlayer = room.players.some(p => p.id === currentUser.id);
    if (!isPlayer) {
      return socket.emit('error', { message: '只有玩家可以重置游戏' });
    }
    
    // 重置游戏状态
    room.gameState = {
      board: Array(15).fill().map(() => Array(15).fill(null)),
      currentPlayer: room.players.find(p => p.color === 'black').id,
      blackPieces: 0,
      whitePieces: 0,
      startTime: new Date().toISOString(),
      lastMoveTime: new Date().toISOString(),
      gameStarted: true,
      gameOver: false,
      winner: null
    };
    
    updateRoom(room);
    
    // 通知房间内所有人
    io.to(currentRoom).emit('gameReset', room);
  });

  // 离开房间
  socket.on('leaveRoom', () => {
    if (!currentUser || !currentRoom) return;
    
    handleUserLeaveRoom();
  });

  // 处理用户离开房间
  function handleUserLeaveRoom() {
    if (!currentRoom) return;
    
    const room = getRoom(currentRoom);
    if (!room) return;
    
    // 检查用户是玩家还是观众
    const playerIndex = room.players.findIndex(p => p.id === currentUser.id);
    if (playerIndex !== -1) {
      // 是玩家
      room.players.splice(playerIndex, 1);
      
      // 如果游戏正在进行，标记为中断
      if (room.gameState.gameStarted && !room.gameState.gameOver) {
        room.gameState.gameStarted = false;
      }
    } else {
      // 是观众
      const spectatorIndex = room.spectators.findIndex(s => s.id === currentUser.id);
      if (spectatorIndex !== -1) {
        room.spectators.splice(spectatorIndex, 1);
      }
    }
    
    // 如果房间空了，删除房间
    if (room.players.length === 0 && room.spectators.length === 0) {
      // 如果对局完整（有胜负结果），保存战绩
      if (room.gameState.gameStarted && room.gameState.gameOver && room.gameState.winner) {
        saveGameRecord(room);
      }
      deleteRoom(room.id);
      io.emit('roomDeleted', { roomId: room.id });
    } else {
      updateRoom(room);
      // 通知房间内所有人
      io.to(currentRoom).emit('roomUpdate', room);
    }
    
    socket.leave(currentRoom);
    currentRoom = null;
  }

  // 聊天消息
  socket.on('sendMessage', (message) => {
    if (!currentUser || !currentRoom) return;
    
    const room = getRoom(currentRoom);
    if (!room) return;
    
    // 创建消息对象
    const chatMessage = {
      userId: currentUser.id,
      username: currentUser.username,
      message: message,
      timestamp: new Date().toISOString()
    };
    
    // 保存到房间的聊天历史记录
    if (!room.chatHistory) {
      room.chatHistory = [];
    }
    room.chatHistory.push(chatMessage);
    updateRoom(room);
    
    // 发送给房间内所有人
    io.to(currentRoom).emit('newMessage', chatMessage);
  });

  // 检查超时
  setInterval(() => {
    if (!currentUser || !currentRoom) return;
    
    const room = getRoom(currentRoom);
    if (!room || !room.gameState.gameStarted || room.gameState.gameOver) return;
    
    // 检查是否是玩家
    const isPlayer = room.players.some(p => p.id === currentUser.id);
    if (!isPlayer) return;
    
    // 检查当前玩家是否超时（5分钟）
    const lastMoveTime = new Date(room.gameState.lastMoveTime).getTime();
    const currentTime = new Date().getTime();
    const timeDiff = (currentTime - lastMoveTime) / 1000 / 60; // 分钟
    
    if (timeDiff >= 5) {
      // 当前玩家超时，对方获胜
      const currentPlayerId = room.gameState.currentPlayer;
      const winner = room.players.find(p => p.id !== currentPlayerId);
      
      if (winner) {
        room.gameState.gameOver = true;
        room.gameState.winner = winner.color;
        
        updateRoom(room);
        
        // 通知房间内所有人
        io.to(currentRoom).emit('playerTimeout', {
          playerId: currentPlayerId,
          winner: winner.color,
          gameOver: true
        });
      }
    }
  }, 10000); // 每10秒检查一次

  // 断开连接
  socket.on('disconnect', () => {
    console.log('用户断开连接:', socket.id);
    
    if (currentUser && currentRoom) {
      handleUserLeaveRoom();
    }
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});