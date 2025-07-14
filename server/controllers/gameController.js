// 游戏控制器 - 管理游戏状态、房间和玩家

// 存储所有房间信息
let rooms = [];

/**
 * 创建新房间
 * @param {Object} roomData - 房间数据
 * @returns {Object} 创建的房间对象
 */
function createRoom({ id, name, isPrivate = false, password = null, createdBy }) {
  const room = {
    id,
    name,
    isPrivate,
    password,
    createdBy,
    players: [],
    spectators: [],
    board: Array(15).fill().map(() => Array(15).fill(null)),
    gameStarted: false,
    gameOver: false,
    winner: null,
    currentPlayer: null,
    startTime: null,
    lastMoveTime: null,
    blackMoves: 0,
    whiteMoves: 0
  };
  
  rooms.push(room);
  return room;
}

/**
 * 获取所有房间
 * @returns {Array} 房间列表
 */
function getRooms() {
  return rooms.map(room => ({
    id: room.id,
    name: room.name,
    isPrivate: room.isPrivate,
    hasPassword: !!room.password,
    players: room.players.map(p => ({ id: p.id, username: p.username, isBlack: p.isBlack })),
    spectators: room.spectators.map(s => ({ id: s.id, username: s.username })),
    gameStarted: room.gameStarted,
    gameOver: room.gameOver,
    currentPlayer: room.currentPlayer,
    blackMoves: room.blackMoves,
    whiteMoves: room.whiteMoves,
    startTime: room.startTime,
    lastMoveTime: room.lastMoveTime
  }));
}

/**
 * 获取特定房间
 * @param {string} roomId - 房间ID
 * @returns {Object|null} 房间对象或null
 */
function getRoom(roomId) {
  return rooms.find(room => room.id === roomId);
}

/**
 * 玩家加入房间
 * @param {string} roomId - 房间ID
 * @param {Object} player - 玩家信息
 * @returns {boolean} 是否成功加入
 */
function joinRoom(roomId, player) {
  const room = getRoom(roomId);
  if (!room) return false;
  
  // 检查玩家是否已在房间中
  const existingPlayerIndex = room.players.findIndex(p => p.id === player.id);
  if (existingPlayerIndex !== -1) return true; // 玩家已在房间中
  
  // 检查房间是否已满
  if (room.players.length >= 2) return false;
  
  // 添加玩家
  room.players.push({
    ...player,
    isBlack: false // 默认不是黑子，游戏开始时会随机分配
  });
  
  return true;
}

/**
 * 玩家离开房间
 * @param {string} roomId - 房间ID
 * @param {string} playerId - 玩家ID
 * @returns {boolean} 是否成功离开
 */
function leaveRoom(roomId, playerId) {
  const room = getRoom(roomId);
  if (!room) return false;
  
  // 移除玩家
  const playerIndex = room.players.findIndex(p => p.id === playerId);
  if (playerIndex !== -1) {
    room.players.splice(playerIndex, 1);
    
    // 如果房间空了，删除房间
    if (room.players.length === 0 && room.spectators.length === 0) {
      rooms = rooms.filter(r => r.id !== roomId);
    }
    
    return true;
  }
  
  return false;
}

/**
 * 添加观众
 * @param {string} roomId - 房间ID
 * @param {Object} spectator - 观众信息
 * @returns {boolean} 是否成功添加
 */
function addSpectator(roomId, spectator) {
  const room = getRoom(roomId);
  if (!room) return false;
  
  // 检查是否已经是观众
  const existingSpectatorIndex = room.spectators.findIndex(s => s.id === spectator.id);
  if (existingSpectatorIndex !== -1) return true; // 已经是观众
  
  // 添加观众
  room.spectators.push(spectator);
  return true;
}

/**
 * 移除观众
 * @param {string} roomId - 房间ID
 * @param {string} spectatorId - 观众ID
 * @returns {boolean} 是否成功移除
 */
function removeSpectator(roomId, spectatorId) {
  const room = getRoom(roomId);
  if (!room) return false;
  
  // 移除观众
  const spectatorIndex = room.spectators.findIndex(s => s.id === spectatorId);
  if (spectatorIndex !== -1) {
    room.spectators.splice(spectatorIndex, 1);
    
    // 如果房间空了，删除房间
    if (room.players.length === 0 && room.spectators.length === 0) {
      rooms = rooms.filter(r => r.id !== roomId);
    }
    
    return true;
  }
  
  return false;
}

/**
 * 观众加入游戏（替补）
 * @param {string} roomId - 房间ID
 * @param {string} spectatorId - 观众ID
 * @returns {boolean} 是否成功加入游戏
 */
function spectatorJoinGame(roomId, spectatorId) {
  const room = getRoom(roomId);
  if (!room) return false;
  
  // 检查是否已经是玩家
  const isAlreadyPlayer = room.players.some(p => p.id === spectatorId);
  if (isAlreadyPlayer) return false;
  
  // 检查是否有空位
  if (room.players.length >= 2) return false;
  
  // 找到观众
  const spectatorIndex = room.spectators.findIndex(s => s.id === spectatorId);
  if (spectatorIndex === -1) return false;
  
  const spectator = room.spectators[spectatorIndex];
  
  // 从观众列表中移除
  room.spectators.splice(spectatorIndex, 1);
  
  // 添加到玩家列表
  room.players.push({
    id: spectator.id,
    username: spectator.username,
    isBlack: false // 默认不是黑子，如果游戏已经开始，会根据被替换的玩家决定
  });
  
  return true;
}

/**
 * 下棋
 * @param {string} roomId - 房间ID
 * @param {Object} position - 位置坐标 {x, y}
 * @param {boolean} isBlack - 是否是黑子
 * @returns {boolean} 是否成功下棋
 */
function makeMove(roomId, position, isBlack) {
  const room = getRoom(roomId);
  if (!room || !room.gameStarted || room.gameOver) return false;
  
  const { x, y } = position;
  
  // 检查位置是否有效
  if (x < 0 || x >= 15 || y < 0 || y >= 15) return false;
  
  // 检查位置是否已被占用
  if (room.board[y][x] !== null) return false;
  
  // 更新棋盘
  room.board[y][x] = isBlack ? 'black' : 'white';
  
  // 更新计数
  if (isBlack) {
    room.blackMoves++;
  } else {
    room.whiteMoves++;
  }
  
  return true;
}

/**
 * 切换当前玩家
 * @param {string} roomId - 房间ID
 * @returns {string|null} 下一个玩家的ID
 */
function switchPlayer(roomId) {
  const room = getRoom(roomId);
  if (!room || !room.gameStarted || room.gameOver) return null;
  
  // 找到当前玩家和另一个玩家
  const currentPlayerIndex = room.players.findIndex(p => p.id === room.currentPlayer);
  if (currentPlayerIndex === -1) return null;
  
  const nextPlayerIndex = (currentPlayerIndex + 1) % room.players.length;
  const nextPlayer = room.players[nextPlayerIndex];
  
  // 更新当前玩家
  room.currentPlayer = nextPlayer.id;
  
  return nextPlayer.id;
}

module.exports = {
  createRoom,
  getRooms,
  getRoom,
  joinRoom,
  leaveRoom,
  makeMove,
  switchPlayer,
  addSpectator,
  removeSpectator,
  spectatorJoinGame
};