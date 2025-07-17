// 全局变量
let socket;
let currentUser = null;
let currentRoom = null;
let gameState = null;
let gameTimer = null;
let gameStartTime = null;
let currentCaptcha = { question: '1 + 1 = ?', answer: 2 };
let gameEndCountdown = null;

// DOM元素
const loginScreen = document.getElementById('loginScreen');
const registerScreen = document.getElementById('registerScreen');
const lobbyScreen = document.getElementById('lobby');
const gameRoomScreen = document.getElementById('gameRoom');
const userNicknameEl = document.getElementById('userNickname');
const roomsListEl = document.getElementById('roomsList');
const roomCountEl = document.getElementById('roomCount');
const emptyStateEl = document.getElementById('emptyState');
const gameBoardEl = document.getElementById('gameBoard');
const currentPlayerInfoEl = document.getElementById('currentPlayerInfo');
const gameTimerEl = document.getElementById('gameTimer');
const playersListEl = document.getElementById('playersList');
const spectatorsListEl = document.getElementById('spectatorsList');
const roomNameEl = document.getElementById('roomName');
const roomIdEl = document.getElementById('roomId');
const gameDurationEl = document.getElementById('gameDuration');
const blackStonesEl = document.getElementById('blackStones');
const whiteStonesEl = document.getElementById('whiteStones');
const chatMessagesEl = document.getElementById('chatMessages');
const chatInputEl = document.getElementById('chatInput');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initializeSocket();
    initializeEventListeners();
    generateCaptcha();
    showScreen('loginScreen');
});

// 初始化Socket连接
function initializeSocket() {
    socket = io();

    socket.on('connect', () => {
        console.log('连接到服务器');
    });

    socket.on('disconnect', () => {
        console.log('与服务器断开连接');
        showNotification('与服务器断开连接', 'error');
    });

    socket.on('error', (data) => {
        showNotification(data.message, 'error');
    });

    socket.on('authError', (data) => {
        showNotification(data.message, 'error');
    });

    socket.on('authSuccess', (data) => {
        showNotification(data.message, 'success');
        showScreen('loginScreen');
    });

    socket.on('loginSuccess', (data) => {
        currentUser = data;
        userNicknameEl.textContent = data.nickname;
        showNotification('登录成功！', 'success');
        showScreen('lobby');
    });

    socket.on('userInfo', (data) => {
        currentUser = data;
        userNicknameEl.textContent = data.nickname;
    });

    socket.on('roomsList', (rooms) => {
        updateRoomsList(rooms);
    });

    socket.on('roomJoined', (data) => {
        currentRoom = data.room;
        gameState = data.room.gameState;
        switchToGameRoom();
        updateGameDisplay();
        showNotification('成功加入房间！', 'success');
    });

    socket.on('roomUpdate', (data) => {
        currentRoom = data.room;
        gameState = data.room.gameState;
        updateGameDisplay();
    });

    socket.on('gameStart', (data) => {
        currentRoom = data.room;
        gameState = data.room.gameState;
        gameStartTime = new Date(gameState.startTime);
        startGameTimer();
        updateGameDisplay();

        // 关闭对局结束弹窗（如果打开的话）
        if (gameEndCountdown) {
            clearTimeout(gameEndCountdown);
            gameEndCountdown = null;
        }
        hideModal('gameEndModal');

        showNotification('游戏开始！', 'success');
    });

    socket.on('gameUpdate', (data) => {
        currentRoom = data.room;
        gameState = data.room.gameState;
        updateGameDisplay();
    });

    socket.on('gameEnd', (data) => {
        currentRoom = data.room;
        gameState = data.room.gameState;
        stopGameTimer();
        updateGameDisplay();

        const colorText = data.winnerColor === 1 ? '黑子' : '白子';

        // 根据结束原因显示不同的消息
        let message;
        if (data.reason === 'opponent_left') {
            message = `🎉 游戏结束！${data.leftPlayerName} 离开了游戏，${data.winner} (${colorText}) 获胜！`;
        } else {
            message = `🎉 游戏结束！${data.winner} (${colorText}) 获胜！`;
        }

        showNotification(message, 'success', 5000);

        // 显示对局结束弹窗
        showGameEndModal(data);
    });

    socket.on('newMessage', (message) => {
        addChatMessage(message);
    });

    socket.on('playerTimeout', (data) => {
        const timeoutPlayerColor = data.timeoutPlayer === 1 ? '黑子' : '白子';
        showNotification(`${timeoutPlayerColor}玩家超时，自动跳过回合`, 'warning');
        currentRoom = data.room;
        gameState = data.room.gameState;
        updateGameDisplay();
    });
}

// 事件监听器初始化
function initializeEventListeners() {
    // 登录按钮
    document.getElementById('loginBtn').addEventListener('click', () => {
        const nickname = document.getElementById('loginNickname').value.trim();
        const password = document.getElementById('loginPassword').value.trim();

        if (!nickname || !password) {
            showNotification('请填写用户名和密码', 'error');
            return;
        }

        // 验证用户名格式
        const usernameRegex = /^[a-zA-Z0-9]+$/;
        if (!usernameRegex.test(nickname)) {
            showNotification('用户名只能包含英文字母和数字', 'error');
            return;
        }

        // 验证密码格式
        const passwordRegex = /^[a-zA-Z0-9]+$/;
        if (!passwordRegex.test(password)) {
            showNotification('密码只能包含英文字母和数字', 'error');
            return;
        }

        socket.emit('login', { nickname, password });
    });

    // 注册按钮
    document.getElementById('registerBtn').addEventListener('click', () => {
        const nickname = document.getElementById('registerNickname').value.trim();
        const password = document.getElementById('registerPassword').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value.trim();
        const captcha = document.getElementById('registerCaptcha').value.trim();

        if (!nickname || !password || !confirmPassword || !captcha) {
            showNotification('请填写完整信息', 'error');
            return;
        }

        // 验证用户名格式
        const usernameRegex = /^[a-zA-Z0-9]+$/;
        if (!usernameRegex.test(nickname)) {
            showNotification('用户名只能包含英文字母和数字', 'error');
            return;
        }

        if (nickname.length < 3 || nickname.length > 20) {
            showNotification('用户名长度应在3-20个字符之间', 'error');
            return;
        }

        // 验证密码格式
        const passwordRegex = /^[a-zA-Z0-9]+$/;
        if (!passwordRegex.test(password)) {
            showNotification('密码只能包含英文字母和数字', 'error');
            return;
        }

        if (password.length < 6 || password.length > 30) {
            showNotification('密码长度应在6-30个字符之间', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showNotification('两次输入的密码不一致', 'error');
            return;
        }

        // 验证验证码
        const captchaNum = parseInt(captcha);
        if (isNaN(captchaNum)) {
            showNotification('验证码必须是数字', 'error');
            return;
        }

        if (captchaNum !== currentCaptcha.answer) {
            showNotification('验证码错误，请重新计算', 'error');
            return;
        }

        socket.emit('register', { nickname, password, captcha });
    });

    // 显示注册界面
    document.getElementById('showRegisterBtn').addEventListener('click', () => {
        showScreen('registerScreen');
        generateCaptcha();
    });

    // 显示登录界面
    document.getElementById('showLoginBtn').addEventListener('click', () => {
        showScreen('loginScreen');
    });

    // 刷新验证码
    document.getElementById('refreshCaptchaBtn').addEventListener('click', () => {
        generateCaptcha();
    });

    // 对局结束弹窗按钮
    document.getElementById('continueGameBtn').addEventListener('click', () => {
        clearTimeout(gameEndCountdown);
        hideModal('gameEndModal');
        socket.emit('continueGame');
    });

    document.getElementById('becomeSpectatorBtn').addEventListener('click', () => {
        clearTimeout(gameEndCountdown);
        hideModal('gameEndModal');
        socket.emit('becomeSpectator');
    });

    // 观众加入游戏按钮
    document.getElementById('joinAsPlayerBtn').addEventListener('click', () => {
        socket.emit('joinAsPlayer');
    });

    // 回车键登录
    document.getElementById('loginPassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('loginBtn').click();
        }
    });

    // 回车键注册
    document.getElementById('registerCaptcha').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('registerBtn').click();
        }
    });

    // 实时输入验证
    document.getElementById('loginNickname').addEventListener('input', (e) => {
        validateInput(e.target, /^[a-zA-Z0-9]*$/, '用户名只能包含英文字母和数字');
    });

    document.getElementById('loginPassword').addEventListener('input', (e) => {
        validateInput(e.target, /^[a-zA-Z0-9]*$/, '密码只能包含英文字母和数字');
    });

    document.getElementById('registerNickname').addEventListener('input', (e) => {
        validateInput(e.target, /^[a-zA-Z0-9]*$/, '用户名只能包含英文字母和数字');
    });

    document.getElementById('registerPassword').addEventListener('input', (e) => {
        validateInput(e.target, /^[a-zA-Z0-9]*$/, '密码只能包含英文字母和数字');
    });

    document.getElementById('confirmPassword').addEventListener('input', (e) => {
        validateInput(e.target, /^[a-zA-Z0-9]*$/, '密码只能包含英文字母和数字');
    });

    // 创建房间按钮
    document.getElementById('createRoomBtn').addEventListener('click', () => {
        showModal('createRoomModal');
    });

    // 查找房间按钮
    document.getElementById('findRoomBtn').addEventListener('click', () => {
        showModal('findRoomModal');
    });

    // 确认创建房间
    document.getElementById('confirmCreateRoom').addEventListener('click', () => {
        const roomName = document.getElementById('roomNameInput').value.trim();
        const roomPassword = document.getElementById('roomPasswordInput').value.trim();

        if (!roomName) {
            showNotification('请输入房间名称', 'error');
            return;
        }

        socket.emit('createRoom', {
            name: roomName,
            password: roomPassword || null
        });

        hideModal('createRoomModal');
        clearModalInputs();
    });

    // 确认查找房间
    document.getElementById('confirmFindRoom').addEventListener('click', () => {
        const roomId = document.getElementById('findRoomIdInput').value.trim().toUpperCase();
        const password = document.getElementById('findRoomPasswordInput').value.trim();

        if (!roomId) {
            showNotification('请输入房间ID', 'error');
            return;
        }

        socket.emit('joinRoom', {
            roomId: roomId,
            password: password || null
        });

        hideModal('findRoomModal');
        clearModalInputs();
    });

    // 确认加入有密码的房间
    document.getElementById('confirmJoinRoom').addEventListener('click', () => {
        const password = document.getElementById('joinRoomPasswordInput').value.trim();
        const roomId = window.currentJoiningRoomId;

        if (!roomId) {
            showNotification('房间信息丢失，请重试', 'error');
            return;
        }

        socket.emit('joinRoom', {
            roomId: roomId,
            password: password
        });

        hideModal('joinRoomModal');
        clearModalInputs();
        window.currentJoiningRoomId = null;
    });

    // 返回大厅按钮
    document.getElementById('backToLobbyBtn').addEventListener('click', () => {
        socket.emit('leaveRoom');
        switchToLobby();
    });

    // 发送聊天消息
    document.getElementById('sendChatBtn').addEventListener('click', () => {
        sendChatMessage();
    });

    // 聊天输入框回车发送
    chatInputEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });

    // 模态框关闭事件
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideModal(modal.id);
            }
        });
    });

    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                hideModal(modal.id);
            }
        });
    });

    // ESC键关闭模态框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                hideModal(modal.id);
            });
        }
    });
}

// 创建游戏棋盘
function createGameBoard() {
    gameBoardEl.innerHTML = '';

    // 获取棋盘实际尺寸
    const boardSize = Math.min(
        window.innerWidth * 0.6,
        window.innerHeight * 0.8,
        600
    );

    // 设置棋盘容器样式
    gameBoardEl.style.position = 'relative';
    gameBoardEl.style.width = boardSize + 'px';
    gameBoardEl.style.height = boardSize + 'px';

    // 创建SVG背景
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', boardSize);
    svg.setAttribute('height', boardSize);
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.pointerEvents = 'none';

    // 绘制网格线
    const cellSize = boardSize / 15;
    const startPos = cellSize / 2;

    // 垂直线
    for (let i = 0; i < 15; i++) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', startPos + i * cellSize);
        line.setAttribute('y1', startPos);
        line.setAttribute('x2', startPos + i * cellSize);
        line.setAttribute('y2', boardSize - startPos);
        line.setAttribute('stroke', '#8B4513');
        line.setAttribute('stroke-width', '1');
        svg.appendChild(line);
    }

    // 水平线
    for (let i = 0; i < 15; i++) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', startPos);
        line.setAttribute('y1', startPos + i * cellSize);
        line.setAttribute('x2', boardSize - startPos);
        line.setAttribute('y2', startPos + i * cellSize);
        line.setAttribute('stroke', '#8B4513');
        line.setAttribute('stroke-width', '1');
        svg.appendChild(line);
    }

    // 添加天元和星位
    const starPoints = [
        [3, 3], [3, 11], [7, 7], [11, 3], [11, 11]
    ];

    starPoints.forEach(([row, col]) => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', startPos + col * cellSize);
        circle.setAttribute('cy', startPos + row * cellSize);
        circle.setAttribute('r', '3');
        circle.setAttribute('fill', '#8B4513');
        svg.appendChild(circle);
    });

    gameBoardEl.appendChild(svg);

    // 创建点击区域
    for (let i = 0; i < 15; i++) {
        for (let j = 0; j < 15; j++) {
            const cell = document.createElement('div');
            cell.className = 'board-cell';
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.style.position = 'absolute';
            cell.style.left = `${startPos + j * cellSize - cellSize/2}px`;
            cell.style.top = `${startPos + i * cellSize - cellSize/2}px`;
            cell.style.width = `${cellSize}px`;
            cell.style.height = `${cellSize}px`;
            cell.style.cursor = 'pointer';
            cell.style.zIndex = '5';

            cell.addEventListener('click', () => makeMove(i, j));

            // 悬停效果
            cell.addEventListener('mouseenter', () => {
                if (gameState && gameState.board[i][j] === 0) {
                    cell.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
                    cell.style.borderRadius = '50%';
                }
            });

            cell.addEventListener('mouseleave', () => {
                cell.style.backgroundColor = 'transparent';
            });

            gameBoardEl.appendChild(cell);
        }
    }
}

// 下棋
function makeMove(row, col) {
    if (!gameState || gameState.status !== 'playing') {
        return;
    }

    // 检查是否轮到当前玩家
    const currentPlayer = currentRoom.players.find(p => p.id === socket.id);
    if (!currentPlayer || currentPlayer.color !== gameState.currentPlayer) {
        showNotification('还没轮到你下棋', 'warning');
        return;
    }

    // 检查位置是否已有棋子
    if (gameState.board[row][col] !== 0) {
        showNotification('此位置已有棋子', 'warning');
        return;
    }

    socket.emit('makeMove', { row, col });
}

// 更新游戏棋盘
function updateGameBoard() {
    if (!gameState) return;

    // 清除所有棋子
    document.querySelectorAll('.stone').forEach(stone => stone.remove());

    // 重新绘制棋子
    const boardRect = gameBoardEl.getBoundingClientRect();
    const boardSize = Math.min(boardRect.width, boardRect.height);
    const cellSize = boardSize / 15; // 修正为15x15棋盘
    const startPos = cellSize / 2;

    for (let i = 0; i < 15; i++) {
        for (let j = 0; j < 15; j++) {
            if (gameState.board[i][j] !== 0) {
                const stone = document.createElement('div');
                stone.className = `stone ${gameState.board[i][j] === 1 ? 'black' : 'white'}`;
                stone.style.position = 'absolute';
                const stoneSize = cellSize * 0.8;
                stone.style.left = `${startPos + j * cellSize - stoneSize/2}px`;
                stone.style.top = `${startPos + i * cellSize - stoneSize/2}px`;
                stone.style.width = `${stoneSize}px`;
                stone.style.height = `${stoneSize}px`;
                stone.style.borderRadius = '50%';
                stone.style.zIndex = '10';
                stone.style.transition = 'all 0.2s ease';

                if (gameState.board[i][j] === 1) {
                    stone.style.background = 'radial-gradient(circle at 30% 30%, #444, #000)';
                    stone.style.border = '1px solid #222';
                    stone.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.5)';
                } else {
                    stone.style.background = 'radial-gradient(circle at 30% 30%, #fff, #ddd)';
                    stone.style.border = '1px solid #999';
                    stone.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
                }

                gameBoardEl.appendChild(stone);
            }
        }
    }
}

// 更新房间列表
function updateRoomsList(rooms) {
    roomCountEl.textContent = rooms.length;

    if (rooms.length === 0) {
        roomsListEl.innerHTML = '';
        emptyStateEl.style.display = 'block';
        return;
    }

    emptyStateEl.style.display = 'none';

    roomsListEl.innerHTML = rooms.map(room => {
        const statusClass = room.status === 'playing' ? 'playing' : 'waiting';
        const statusText = room.status === 'playing' ? '游戏中' : '等待中';
        const lockIcon = room.hasPassword ? '<i class="fas fa-lock room-lock"></i>' : '';

        return `
            <div class="room-card" onclick="joinRoom('${room.id}', ${room.hasPassword})">
                <div class="room-header">
                    <div class="room-info">
                        <div class="room-name">${escapeHtml(room.name)}</div>
                        <div class="room-id">ID: ${room.id}</div>
                    </div>
                    <div class="room-status ${statusClass}">
                        <i class="fas fa-circle"></i>
                        ${statusText}
                    </div>
                </div>
                <div class="room-footer">
                    <div class="room-players">
                        <i class="fas fa-users"></i>
                        ${room.playerCount}/2 玩家
                        ${room.spectatorCount > 0 ? `+ ${room.spectatorCount} 观众` : ''}
                    </div>
                    <div class="room-icons">
                        ${lockIcon}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 加入房间
function joinRoom(roomId, hasPassword) {
    if (hasPassword) {
        window.currentJoiningRoomId = roomId;
        showModal('joinRoomModal');
    } else {
        socket.emit('joinRoom', { roomId, password: null });
    }
}

// 切换到游戏房间
function switchToGameRoom() {
    lobbyScreen.classList.remove('active');
    gameRoomScreen.classList.add('active');

    if (currentRoom) {
        roomNameEl.textContent = currentRoom.name;
        roomIdEl.textContent = `ID: ${currentRoom.id}`;

        // 创建游戏板
        createGameBoard();
        updateGameDisplay();
    }
}

// 切换到大厅
function switchToLobby() {
    gameRoomScreen.classList.remove('active');
    lobbyScreen.classList.add('active');

    currentRoom = null;
    gameState = null;
    stopGameTimer();

    // 重新获取房间列表
    if (currentUser) {
        socket.emit('enterLobby');
    }
}

// 更新游戏显示
function updateGameDisplay() {
    if (!currentRoom) return;

    updatePlayersList();
    updateSpectatorsList();
    updateGameInfo();
    updateCurrentPlayer();
    updateGameBoard();
    updateSpectatorJoinButton();
}

// 更新玩家列表
function updatePlayersList() {
    if (!currentRoom) return;

    const players = currentRoom.players || [];

    playersListEl.innerHTML = players.map(player => {
        // 只有在游戏开始后才显示棋子颜色
        const gameStarted = gameState && gameState.status === 'playing';
        const colorClass = gameStarted && player.color === 1 ? 'black' :
                          (gameStarted && player.color === 2 ? 'white' : 'waiting');
        const colorText = gameStarted && player.color === 1 ? '黑子' :
                         (gameStarted && player.color === 2 ? '白子' : '玩家');
        const isCurrentTurn = gameState && gameState.currentPlayer === player.color && gameState.status === 'playing';
        const statusText = isCurrentTurn ? '(当前回合)' : '';
        return `
            <div class="player-item ${isCurrentTurn ? 'current-turn' : ''}">
                <div class="player-color ${colorClass}"></div>
                <div class="player-info">
                    <span class="player-name">${escapeHtml(player.nickname)}</span>
                    <span class="player-role">${colorText}</span>
                </div>
                <span class="player-status">${statusText}</span>
            </div>
        `;
    }).join('');

    // 如果玩家不足2人，显示等待信息
    if (players.length < 2) {
        playersListEl.innerHTML += `
            <div class="player-item waiting">
                <div class="player-color waiting"></div>
                <div class="player-info">
                    <span class="player-name">等待玩家加入...</span>
                    <span class="player-role">需要2名玩家开始游戏</span>
                </div>
                <i class="fas fa-hourglass-half waiting-icon"></i>
            </div>
        `;
    }
}

// 更新观众列表
function updateSpectatorsList() {
    if (!currentRoom) return;

    const spectators = currentRoom.spectators || [];
    document.querySelector('.spectator-count').textContent = spectators.length;

    if (spectators.length === 0) {
        spectatorsListEl.innerHTML = '<div class="empty-spectators">暂无观众</div>';
        return;
    }

    spectatorsListEl.innerHTML = spectators.map(spectator => `
        <div class="spectator-item">
            <i class="fas fa-eye"></i>
            <span class="spectator-name">${escapeHtml(spectator.nickname)}</span>
        </div>
    `).join('');
}

// 更新游戏信息
function updateGameInfo() {
    if (!gameState) return;

    // 统计棋子数量
    let blackCount = 0, whiteCount = 0;
    for (let i = 0; i < 15; i++) {
        for (let j = 0; j < 15; j++) {
            if (gameState.board[i][j] === 1) blackCount++;
            else if (gameState.board[i][j] === 2) whiteCount++;
        }
    }

    blackStonesEl.textContent = blackCount;
    whiteStonesEl.textContent = whiteCount;

    // 更新游戏时长
    if (gameState.status === 'playing' && gameStartTime) {
        updateGameDuration();
    }
}

// 更新当前玩家信息
function updateCurrentPlayer() {
    if (!gameState || !currentRoom) return;

    const currentPlayerEl = document.querySelector('.player-turn .player-name');
    const indicatorEl = document.querySelector('.player-indicator');

    if (gameState.status === 'waiting') {
        currentPlayerEl.textContent = '等待玩家...';
        indicatorEl.className = 'player-indicator';
    } else if (gameState.status === 'playing') {
        const currentPlayer = currentRoom.players.find(p => p.color === gameState.currentPlayer);
        if (currentPlayer) {
            currentPlayerEl.textContent = currentPlayer.nickname;
            indicatorEl.className = `player-indicator ${gameState.currentPlayer === 1 ? 'black' : 'white'}`;
        }
    } else if (gameState.status === 'finished') {
        const winner = currentRoom.players.find(p => p.color === gameState.winner);
        if (winner) {
            currentPlayerEl.textContent = `${winner.nickname} 获胜！`;
            indicatorEl.className = `player-indicator ${gameState.winner === 1 ? 'black' : 'white'}`;
        }
    }
}



// 发送聊天消息
function sendChatMessage() {
    const message = chatInputEl.value.trim();
    if (!message) return;

    socket.emit('sendMessage', { message });
    chatInputEl.value = '';
}

// 添加聊天消息
function addChatMessage(message) {
    const messageEl = document.createElement('div');
    messageEl.className = 'chat-message';

    const time = new Date(message.timestamp).toLocaleTimeString();
    messageEl.innerHTML = `
        <div class="message-header">
            <span class="message-author">${escapeHtml(message.nickname)}</span>
            <span class="message-time">${time}</span>
        </div>
        <div class="message-content">${escapeHtml(message.message)}</div>
    `;

    chatMessagesEl.appendChild(messageEl);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

// 开始游戏计时器
function startGameTimer() {
    stopGameTimer();
    gameTimer = setInterval(updateGameTimer, 1000);
}

// 停止游戏计时器
function stopGameTimer() {
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
}

// 更新游戏计时器
function updateGameTimer() {
    if (!gameState || gameState.status !== 'playing') return;

    const elapsed = Date.now() - (currentRoom.turnStartTime || Date.now());
    const remaining = Math.max(0, 5 * 60 * 1000 - elapsed); // 5分钟倒计时

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    const timerEl = document.querySelector('.timer-text');
    if (timerEl) {
        timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // 时间不足30秒时变红
        if (remaining < 30000) {
            timerEl.style.color = '#ef4444';
        } else {
            timerEl.style.color = '';
        }
    }
}

// 更新游戏时长
function updateGameDuration() {
    if (!gameStartTime) return;

    const elapsed = Date.now() - gameStartTime.getTime();
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);

    gameDurationEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// 输入验证函数
function validateInput(input, regex, errorMessage) {
    const value = input.value;
    const isValid = regex.test(value);

    // 移除之前的错误样式
    input.classList.remove('input-error');

    // 如果输入不为空且不符合规则，添加错误样式
    if (value && !isValid) {
        input.classList.add('input-error');
        // 移除不符合规则的字符
        input.value = value.replace(/[^a-zA-Z0-9]/g, '');
    }
}

// 生成验证码
function generateCaptcha() {
    // 随机生成数学运算题
    const operationType = Math.floor(Math.random() * 4); // 0:加法, 1:减法, 2:乘法, 3:除法
    let num1, num2, operator, answer, question;

    switch (operationType) {
        case 0: // 加法
            num1 = Math.floor(Math.random() * 20) + 1; // 1-20
            num2 = Math.floor(Math.random() * 20) + 1; // 1-20
            operator = '+';
            answer = num1 + num2;
            break;
        case 1: // 减法
            num1 = Math.floor(Math.random() * 30) + 10; // 10-39
            num2 = Math.floor(Math.random() * (num1 - 1)) + 1; // 1到num1-1，确保结果为正
            operator = '-';
            answer = num1 - num2;
            break;
        case 2: // 乘法
            num1 = Math.floor(Math.random() * 9) + 2; // 2-10
            num2 = Math.floor(Math.random() * 9) + 2; // 2-10
            operator = '×';
            answer = num1 * num2;
            break;
        case 3: // 除法
            // 先生成答案，再生成被除数，确保整除
            answer = Math.floor(Math.random() * 15) + 2; // 2-16
            num2 = Math.floor(Math.random() * 8) + 2; // 2-9
            num1 = answer * num2;
            operator = '÷';
            break;
    }

    question = `${num1} ${operator} ${num2} = ?`;

    currentCaptcha = { question, answer };
    document.getElementById('captchaText').textContent = currentCaptcha.question;
    document.getElementById('registerCaptcha').value = '';
}

// 显示屏幕
function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    const targetScreen = document.getElementById(screenName);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
}

// 显示模态框
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// 隐藏模态框
function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// 清空模态框输入
function clearModalInputs() {
    document.querySelectorAll('.modal input').forEach(input => {
        input.value = '';
    });
}

// HTML转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 通知系统
function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' :
                          type === 'error' ? 'exclamation-circle' :
                          type === 'warning' ? 'exclamation-triangle' :
                          'info-circle'}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    // 显示动画
    setTimeout(() => notification.classList.add('show'), 100);

    // 自动隐藏
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, duration);
}

// 窗口大小变化时重新创建棋盘
window.addEventListener('resize', () => {
    if (gameBoardEl && gameBoardEl.innerHTML && currentRoom) {
        createGameBoard();
        updateGameBoard();
    }
});

// 显示对局结束弹窗
function showGameEndModal(data) {
    const modal = document.getElementById('gameEndModal');
    const gameResult = document.getElementById('gameResult');
    const countdownText = document.getElementById('countdownText');

    // 判断当前用户是否获胜
    const isWinner = data.winner === currentUser.nickname;
    const isDraw = data.winnerColor === 0; // 假设0表示平局

    if (isDraw) {
        gameResult.textContent = '平局！';
        gameResult.className = 'game-result draw';
    } else if (isWinner) {
        if (data.reason === 'opponent_left') {
            gameResult.textContent = '对手离开，你赢了！';
        } else {
            gameResult.textContent = '恭喜获胜！';
        }
        gameResult.className = 'game-result win';
    } else {
        const colorText = data.winnerColor === 1 ? '黑子' : '白子';
        if (data.reason === 'opponent_left') {
            gameResult.textContent = '对手离开，游戏结束！';
        } else {
            gameResult.textContent = `${data.winner} (${colorText}) 获胜！`;
        }
        gameResult.className = 'game-result lose';
    }

    // 开始倒计时
    let countdown = 20;
    countdownText.textContent = `${countdown}秒后自动继续`;

    gameEndCountdown = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            countdownText.textContent = `${countdown}秒后自动继续`;
        } else {
            clearInterval(gameEndCountdown);
            hideModal('gameEndModal');
            // 自动继续游戏
            socket.emit('continueGame');
        }
    }, 1000);

    showModal('gameEndModal');
}

// 更新观众加入按钮显示
function updateSpectatorJoinButton() {
    const spectatorJoinArea = document.getElementById('spectatorJoinArea');
    if (!currentRoom || !currentUser || !socket) {
        spectatorJoinArea.style.display = 'none';
        return;
    }

    // 检查当前用户是否为玩家
    const isPlayer = currentRoom.players.some(p => p.id === socket.id);
    // 检查房间是否缺少玩家
    const needsPlayers = currentRoom.players.length < 2;
    // 检查当前用户是否为观众
    const isSpectator = currentRoom.spectators.some(s => s.id === socket.id);

    // 只有当用户是观众（不是玩家）且房间缺少玩家时才显示按钮
    if (!isPlayer && isSpectator && needsPlayers) {
        spectatorJoinArea.style.display = 'block';
    } else {
        spectatorJoinArea.style.display = 'none';
    }
}
