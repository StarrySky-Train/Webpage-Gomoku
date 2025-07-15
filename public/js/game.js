// 全局变量
let socket;
let currentUser = null;
let currentRoom = null;
let gameBoard = [];
let boardSize = 15;
let currentTurn = 'black';
let gameStarted = false;
let gameEnded = false;
let timerInterval = null;
let gameTime = 0;
let blackPiecesCount = 0;
let whitePiecesCount = 0;
let isSpectator = true; // 默认为观众
let myColor = null; // 玩家颜色

// 初始化函数
function init() {
  // 检查是否已登录
  const savedUser = localStorage.getItem('gomokuUser');
  if (!savedUser) {
    // 未登录，重定向到登录页
    window.location.href = '/index.html';
    return;
  }

  // 检查是否有房间信息
  const savedRoom = localStorage.getItem('currentRoom');
  if (!savedRoom) {
    // 没有房间信息，重定向到大厅
    window.location.href = '/lobby.html';
    return;
  }

  try {
    currentUser = JSON.parse(savedUser);
    currentRoom = JSON.parse(savedRoom);
  } catch (e) {
    console.error('解析保存的数据失败', e);
    localStorage.removeItem('currentRoom');
    window.location.href = '/lobby.html';
    return;
  }

  // 初始化Socket.io连接
  socket = io();
  
  // 添加连接事件监听器
  socket.on('connect', () => {
    console.log('Socket.io连接成功');
    
    // 自动登录
    socket.emit('login', { 
      username: currentUser.username, 
      userId: currentUser.id 
    });
    
    setupSocketListeners();
  });

  socket.on('connect_error', (error) => {
    console.error('Socket.io连接失败:', error);
    showNotification('服务器连接失败，请刷新页面重试', 'error');
  });

  // 设置事件监听器
  setupEventListeners();
  
  // 初始化游戏界面
  initGameUI();
}

// 设置Socket.io事件监听器
function setupSocketListeners() {
  // 登录成功
  socket.on('loginSuccess', (user) => {
    currentUser = user;
    localStorage.setItem('gomokuUser', JSON.stringify(user));
    
    // 重新加入房间
    socket.emit('joinRoom', { roomId: currentRoom.id });
  });

  // 加入房间成功
  socket.on('joinedRoom', (room) => {
    currentRoom = room;
    localStorage.setItem('currentRoom', JSON.stringify(room));
    updateRoomInfo(room);
    
    // 显示聊天历史记录
    if (room.chatHistory && room.chatHistory.length > 0) {
      const chatMessages = document.getElementById('chat-messages');
      chatMessages.innerHTML = ''; // 清空现有消息
      
      room.chatHistory.forEach(msg => {
        addChatMessage(msg);
      });
    }
    
    // 如果游戏已经开始，获取当前游戏状态
    if (room.gameStarted) {
      socket.emit('getGameState', { roomId: room.id });
    }
  });

  // 房间信息更新
  socket.on('roomUpdate', (room) => {
    currentRoom = room;
    localStorage.setItem('currentRoom', JSON.stringify(room));
    updateRoomInfo(room);
  });

  // 游戏状态更新
  socket.on('gameState', (data) => {
    updateGameState(data);
  });

  // 游戏开始
  socket.on('gameStart', (data) => {
    startGame(data);
  });

  // 游戏结束
  socket.on('gameEnd', (data) => {
    endGame(data);
  });

  // 新的落子
  socket.on('newMove', (data) => {
    handleNewMove(data);
  });

  // 聊天消息
  socket.on('chatMessage', (data) => {
    addChatMessage(data);
  });

  // 系统消息
  socket.on('systemMessage', (data) => {
    addSystemMessage(data.message);
  });

  // 玩家角色更新
  socket.on('playerRoleUpdate', (data) => {
    updatePlayerRole(data);
  });

  // 错误消息
  socket.on('error', (error) => {
    showNotification(error.message, 'error');
  });
}

// 设置DOM事件监听器
function setupEventListeners() {
  // 离开房间按钮
  document.getElementById('leave-room-btn').addEventListener('click', () => {
    socket.emit('leaveRoom', { roomId: currentRoom.id });
    localStorage.removeItem('currentRoom');
    window.location.href = '/lobby.html';
  });

  // 重置游戏按钮
  document.getElementById('reset-game-btn').addEventListener('click', () => {
    if (!isSpectator) {
      socket.emit('resetGame', { roomId: currentRoom.id });
    }
  });

  // 新游戏按钮
  document.getElementById('new-game-btn').addEventListener('click', () => {
    if (!isSpectator) {
      socket.emit('resetGame', { roomId: currentRoom.id });
    }
  });

  // 成为玩家按钮
  document.getElementById('become-player-btn').addEventListener('click', () => {
    socket.emit('becomePlayer', { roomId: currentRoom.id });
  });

  // 发送聊天消息
  document.getElementById('send-message-btn').addEventListener('click', sendChatMessage);
  document.getElementById('chat-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendChatMessage();
    }
  });
}

// 初始化游戏界面
function initGameUI() {
  // 设置房间信息
  document.getElementById('game-room-name').textContent = currentRoom.name;
  document.getElementById('game-room-id').textContent = currentRoom.id;
  
  // 创建棋盘
  createGameBoard();
}

// 创建棋盘
function createGameBoard() {
  const gameBoard = document.getElementById('game-board');
  gameBoard.innerHTML = '';
  
  // 初始化二维数组表示棋盘状态
  window.gameBoard = Array(boardSize).fill().map(() => Array(boardSize).fill(null));
  
  // 创建棋盘格子
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      const cell = document.createElement('div');
      cell.className = 'board-cell';
      cell.dataset.row = i;
      cell.dataset.col = j;
      
      // 添加点击事件
      cell.addEventListener('click', () => {
        if (gameStarted && !gameEnded && !isSpectator && currentTurn === myColor) {
          makeMove(i, j);
        }
      });
      
      gameBoard.appendChild(cell);
    }
  }
  
  // 设置棋盘大小
  gameBoard.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;
  gameBoard.style.gridTemplateRows = `repeat(${boardSize}, 1fr)`;
}

// 更新房间信息
function updateRoomInfo(room) {
  document.getElementById('game-room-name').textContent = room.name;
  document.getElementById('game-room-id').textContent = room.id;
  
  // 更新玩家列表
  updatePlayersList(room);
  
  // 更新游戏状态
  if (room.gameStarted !== gameStarted) {
    if (room.gameStarted) {
      startGame({ 
        currentTurn: room.currentTurn,
        blackPlayer: room.players.find(p => p.color === 'black'),
        whitePlayer: room.players.find(p => p.color === 'white')
      });
    } else {
      resetGame();
    }
  }
  
  // 检查当前用户是否是玩家或观众
  checkUserRole(room);
}

// 检查用户角色
function checkUserRole(room) {
  const player = room.players.find(p => p.id === currentUser.id);
  
  if (player) {
    isSpectator = false;
    myColor = player.color;
    document.getElementById('become-player-container').classList.add('hidden');
    
    // 如果是房主，显示重置游戏按钮
    if (player.id === room.hostId) {
      document.getElementById('reset-game-btn').classList.remove('hidden');
    } else {
      document.getElementById('reset-game-btn').classList.add('hidden');
    }
  } else {
    isSpectator = true;
    myColor = null;
    
    // 如果玩家数量少于2，显示成为玩家按钮
    if (room.players.length < 2) {
      document.getElementById('become-player-container').classList.remove('hidden');
    } else {
      document.getElementById('become-player-container').classList.add('hidden');
    }
    
    document.getElementById('reset-game-btn').classList.add('hidden');
  }
  
  updateGameStatus();
}

// 更新玩家列表
function updatePlayersList(room) {
  const playersList = document.getElementById('players-list');
  const spectatorsList = document.getElementById('spectators-list');
  
  playersList.innerHTML = '';
  spectatorsList.innerHTML = '';
  
  // 添加玩家
  room.players.forEach(player => {
    const playerItem = document.createElement('div');
    playerItem.className = 'player-item';
    
    const colorIndicator = document.createElement('span');
    colorIndicator.className = `color-indicator ${player.color}`;
    
    const playerName = document.createElement('span');
    playerName.className = 'player-name';
    playerName.textContent = player.username;
    
    if (player.id === currentUser.id) {
      playerName.textContent += ' (你)';
    }
    
    if (player.id === room.hostId) {
      const hostBadge = document.createElement('span');
      hostBadge.className = 'host-badge';
      hostBadge.textContent = '房主';
      playerItem.appendChild(hostBadge);
    }
    
    playerItem.appendChild(colorIndicator);
    playerItem.appendChild(playerName);
    playersList.appendChild(playerItem);
  });
  
  // 添加观众
  if (room.spectators && room.spectators.length > 0) {
    room.spectators.forEach(spectator => {
      const spectatorItem = document.createElement('div');
      spectatorItem.className = 'spectator-item';
      spectatorItem.textContent = spectator.username;
      
      if (spectator.id === currentUser.id) {
        spectatorItem.textContent += ' (你)';
      }
      
      spectatorsList.appendChild(spectatorItem);
    });
  } else {
    spectatorsList.innerHTML = '<div class="empty-message">暂无观众</div>';
  }
}

// 更新游戏状态
function updateGameState(data) {
  // 更新棋盘
  if (data.board) {
    for (let i = 0; i < boardSize; i++) {
      for (let j = 0; j < boardSize; j++) {
        if (data.board[i][j]) {
          placePiece(i, j, data.board[i][j]);
        }
      }
    }
  }
  
  // 更新当前回合
  currentTurn = data.currentTurn;
  
  // 更新棋子计数
  if (data.blackPiecesCount !== undefined) {
    blackPiecesCount = data.blackPiecesCount;
    document.getElementById('black-pieces-count').textContent = blackPiecesCount;
  }
  
  if (data.whitePiecesCount !== undefined) {
    whitePiecesCount = data.whitePiecesCount;
    document.getElementById('white-pieces-count').textContent = whitePiecesCount;
  }
  
  // 更新游戏时间
  if (data.gameTime !== undefined) {
    gameTime = data.gameTime;
    updateTimer();
  }
  
  // 更新游戏状态
  gameStarted = data.gameStarted;
  gameEnded = data.gameEnded;
  
  if (gameEnded && data.winner) {
    endGame({ winner: data.winner });
  } else {
    updateGameStatus();
  }
}

// 开始游戏
function startGame(data) {
  gameStarted = true;
  gameEnded = false;
  currentTurn = data.currentTurn || 'black';
  
  // 重置棋盘
  resetBoard();
  
  // 重置计数器
  blackPiecesCount = 0;
  whitePiecesCount = 0;
  document.getElementById('black-pieces-count').textContent = '0';
  document.getElementById('white-pieces-count').textContent = '0';
  
  // 重置计时器
  gameTime = 0;
  updateTimer();
  startTimer();
  
  // 隐藏游戏结果
  document.getElementById('game-result').classList.add('hidden');
  
  // 更新游戏状态
  updateGameStatus();
}

// 结束游戏
function endGame(data) {
  gameEnded = true;
  stopTimer();
  
  const resultMessage = document.getElementById('result-message');
  const gameResult = document.getElementById('game-result');
  
  if (data.winner === 'draw') {
    resultMessage.textContent = '游戏平局！';
  } else {
    const winnerColor = data.winner === 'black' ? '黑棋' : '白棋';
    resultMessage.textContent = `${winnerColor}获胜！`;
  }
  
  gameResult.classList.remove('hidden');
  updateGameStatus();
}

// 重置游戏
function resetGame() {
  gameStarted = false;
  gameEnded = false;
  currentTurn = 'black';
  
  // 重置棋盘
  resetBoard();
  
  // 重置计数器
  blackPiecesCount = 0;
  whitePiecesCount = 0;
  document.getElementById('black-pieces-count').textContent = '0';
  document.getElementById('white-pieces-count').textContent = '0';
  
  // 重置计时器
  stopTimer();
  gameTime = 0;
  updateTimer();
  
  // 隐藏游戏结果
  document.getElementById('game-result').classList.add('hidden');
  
  // 更新游戏状态
  updateGameStatus();
}

// 重置棋盘
function resetBoard() {
  window.gameBoard = Array(boardSize).fill().map(() => Array(boardSize).fill(null));
  
  const boardElement = document.getElementById('game-board');
  const cells = boardElement.querySelectorAll('.board-cell');
  
  cells.forEach(cell => {
    cell.innerHTML = '';
    cell.classList.remove('last-move');
  });
}

// 落子
function makeMove(row, col) {
  if (window.gameBoard[row][col] !== null) {
    return; // 已有棋子，不能落子
  }
  
  socket.emit('makeMove', {
    roomId: currentRoom.id,
    row,
    col
  });
}

// 处理新的落子
function handleNewMove(data) {
  placePiece(data.row, data.col, data.color);
  
  // 更新当前回合
  currentTurn = data.color === 'black' ? 'white' : 'black';
  
  // 更新棋子计数
  if (data.color === 'black') {
    blackPiecesCount++;
    document.getElementById('black-pieces-count').textContent = blackPiecesCount;
  } else {
    whitePiecesCount++;
    document.getElementById('white-pieces-count').textContent = whitePiecesCount;
  }
  
  // 更新游戏状态
  updateGameStatus();
}

// 放置棋子
function placePiece(row, col, color) {
  window.gameBoard[row][col] = color;
  
  const boardElement = document.getElementById('game-board');
  const cells = boardElement.querySelectorAll('.board-cell');
  
  // 移除上一步标记
  cells.forEach(cell => {
    cell.classList.remove('last-move');
  });
  
  // 找到对应的格子
  const cell = boardElement.querySelector(`.board-cell[data-row="${row}"][data-col="${col}"]`);
  if (cell) {
    // 创建棋子
    const piece = document.createElement('div');
    piece.className = `piece ${color}`;
    
    // 清空格子并添加棋子
    cell.innerHTML = '';
    cell.appendChild(piece);
    cell.classList.add('last-move');
  }
}

// 更新游戏状态文本
function updateGameStatus() {
  const statusText = document.getElementById('game-status-text');
  
  if (!gameStarted) {
    if (currentRoom.players.length < 2) {
      statusText.textContent = '等待玩家加入...';
    } else {
      statusText.textContent = '准备开始游戏';
    }
    return;
  }
  
  if (gameEnded) {
    return;
  }
  
  const currentColorText = currentTurn === 'black' ? '黑棋' : '白棋';
  
  if (!isSpectator && currentTurn === myColor) {
    statusText.textContent = `轮到你下棋 (${currentColorText})`;
  } else {
    const currentPlayer = currentRoom.players.find(p => p.color === currentTurn);
    if (currentPlayer) {
      statusText.textContent = `轮到 ${currentPlayer.username} 下棋 (${currentColorText})`;
    } else {
      statusText.textContent = `轮到 ${currentColorText} 下棋`;
    }
  }
}

// 开始计时器
function startTimer() {
  stopTimer();
  timerInterval = setInterval(() => {
    gameTime++;
    updateTimer();
  }, 1000);
}

// 停止计时器
function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// 更新计时器显示
function updateTimer() {
  const minutes = Math.floor(gameTime / 60);
  const seconds = gameTime % 60;
  
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  document.getElementById('game-timer').textContent = formattedTime;
}

// 发送聊天消息
function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  
  if (message) {
    socket.emit('sendMessage', {
      roomId: currentRoom.id,
      message
    });
    input.value = '';
  }
}

// 添加聊天消息
function addChatMessage(data) {
  const messagesContainer = document.getElementById('chat-messages');
  const messageElement = document.createElement('div');
  messageElement.className = 'chat-message';
  
  const usernameSpan = document.createElement('span');
  usernameSpan.className = 'chat-username';
  usernameSpan.textContent = data.username + ': ';
  
  const messageSpan = document.createElement('span');
  messageSpan.className = 'chat-text';
  messageSpan.textContent = data.message;
  
  messageElement.appendChild(usernameSpan);
  messageElement.appendChild(messageSpan);
  messagesContainer.appendChild(messageElement);
  
  // 滚动到底部
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 添加系统消息
function addSystemMessage(message) {
  const messagesContainer = document.getElementById('chat-messages');
  const messageElement = document.createElement('div');
  messageElement.className = 'chat-message system-message';
  messageElement.textContent = message;
  
  messagesContainer.appendChild(messageElement);
  
  // 滚动到底部
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 更新玩家角色
function updatePlayerRole(data) {
  if (data.userId === currentUser.id) {
    isSpectator = data.isSpectator;
    myColor = data.color;
    
    if (!isSpectator) {
      document.getElementById('become-player-container').classList.add('hidden');
      showNotification(`你现在是${myColor === 'black' ? '黑棋' : '白棋'}玩家`, 'success');
    }
  }
  
  updateGameStatus();
}

// 显示通知
function showNotification(message, type = 'info') {
  const container = document.getElementById('notification-container');
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  container.appendChild(notification);
  
  // 3秒后自动移除
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// HTML转义函数，防止XSS攻击
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);