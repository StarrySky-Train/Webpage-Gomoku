const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 数据文件路径
const DATA_DIR = path.join(__dirname, 'data');
const ROOMS_FILE = path.join(DATA_DIR, 'rooms.json');
const MATCHES_FILE = path.join(DATA_DIR, 'matches.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// 内存数据
let rooms = {};
let users = {};
let registeredUsers = {};

// 初始化数据目录
async function initializeData() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });

        // 清空房间和在线用户数据（每次重启）
        rooms = {};
        users = {};
        await saveRoomsData();

        // 加载注册用户数据
        try {
            const usersData = await fs.readFile(USERS_FILE, 'utf8');
            registeredUsers = JSON.parse(usersData);
        } catch {
            registeredUsers = {};
            await fs.writeFile(USERS_FILE, JSON.stringify({}, null, 2));
        }

        // 确保对局历史文件存在
        try {
            await fs.access(MATCHES_FILE);
        } catch {
            await fs.writeFile(MATCHES_FILE, JSON.stringify([], null, 2));
        }

        console.log('数据初始化完成');
    } catch (error) {
        console.error('数据初始化失败:', error);
    }
}

// 保存房间数据到JSON文件
async function saveRoomsData() {
    try {
        const roomsData = Object.values(rooms).map(room => ({
            id: room.id,
            name: room.name,
            hasPassword: !!room.password,
            playerCount: room.players.length,
            spectatorCount: room.spectators.length,
            status: room.gameState.status,
            createdAt: room.createdAt,
            creator: room.creator
        }));
        await fs.writeFile(ROOMS_FILE, JSON.stringify(roomsData, null, 2));
    } catch (error) {
        console.error('保存房间数据失败:', error);
    }
}

// 保存对局记录
async function saveMatchRecord(matchData) {
    try {
        const matches = JSON.parse(await fs.readFile(MATCHES_FILE, 'utf8'));
        matches.push(matchData);
        await fs.writeFile(MATCHES_FILE, JSON.stringify(matches, null, 2));
    } catch (error) {
        console.error('保存对局记录失败:', error);
    }
}

// 保存注册用户数据
async function saveUsersData() {
    try {
        await fs.writeFile(USERS_FILE, JSON.stringify(registeredUsers, null, 2));
    } catch (error) {
        console.error('保存用户数据失败:', error);
    }
}

// 生成随机昵称
function generateRandomNickname() {
    const adjectives = ['勇敢的', '聪明的', '快乐的', '神秘的', '优雅的', '强大的', '温柔的', '机智的'];
    const nouns = ['棋手', '大师', '新手', '玩家', '高手', '学者', '战士', '智者'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 1000);
    return `${adj}${noun}${num}`;
}

// 生成房间ID
function generateRoomId() {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
}

// 检查五子棋胜利条件
function checkWin(board, row, col, player) {
    const directions = [
        [0, 1], [1, 0], [1, 1], [1, -1]
    ];
    
    for (let [dx, dy] of directions) {
        let count = 1;
        
        // 正方向
        for (let i = 1; i < 5; i++) {
            const newRow = row + dx * i;
            const newCol = col + dy * i;
            if (newRow >= 0 && newRow < 15 && newCol >= 0 && newCol < 15 && 
                board[newRow][newCol] === player) {
                count++;
            } else {
                break;
            }
        }
        
        // 反方向
        for (let i = 1; i < 5; i++) {
            const newRow = row - dx * i;
            const newCol = col - dy * i;
            if (newRow >= 0 && newRow < 15 && newCol >= 0 && newCol < 15 && 
                board[newRow][newCol] === player) {
                count++;
            } else {
                break;
            }
        }
        
        if (count >= 5) return true;
    }
    return false;
}

// Socket连接处理
io.on('connection', (socket) => {
    console.log('用户连接:', socket.id);

    // 用户注册
    socket.on('register', (data) => {
        const { nickname, password, captcha } = data;

        // 验证输入
        if (!nickname || !password || !captcha) {
            socket.emit('authError', { message: '请填写完整信息' });
            return;
        }

        // 验证用户名格式：只能包含英文字母和数字
        const usernameRegex = /^[a-zA-Z0-9]+$/;
        if (!usernameRegex.test(nickname)) {
            socket.emit('authError', { message: '用户名只能包含英文字母和数字' });
            return;
        }

        if (nickname.length < 3 || nickname.length > 20) {
            socket.emit('authError', { message: '用户名长度应在3-20个字符之间' });
            return;
        }

        // 验证密码格式：只能包含英文字母和数字
        const passwordRegex = /^[a-zA-Z0-9]+$/;
        if (!passwordRegex.test(password)) {
            socket.emit('authError', { message: '密码只能包含英文字母和数字' });
            return;
        }

        if (password.length < 6 || password.length > 30) {
            socket.emit('authError', { message: '密码长度应在6-30个字符之间' });
            return;
        }

        // 验证验证码（基本格式验证）
        const captchaAnswer = parseInt(captcha);
        if (isNaN(captchaAnswer)) {
            socket.emit('authError', { message: '验证码必须是数字' });
            return;
        }

        // 验证码答案范围检查（随机生成的验证码答案范围更大）
        if (captchaAnswer < 1 || captchaAnswer > 200) {
            socket.emit('authError', { message: '验证码答案超出有效范围' });
            return;
        }

        // 检查用户名是否已存在
        if (registeredUsers[nickname]) {
            socket.emit('authError', { message: '用户名已存在' });
            return;
        }

        // 注册用户
        registeredUsers[nickname] = {
            nickname: nickname,
            password: password, // 实际项目中应该加密存储
            registeredAt: new Date().toISOString(),
            lastLoginAt: null
        };

        saveUsersData();
        socket.emit('authSuccess', { message: '注册成功！请登录' });
    });

    // 用户登录
    socket.on('login', (data) => {
        const { nickname, password } = data;

        // 验证输入
        if (!nickname || !password) {
            socket.emit('authError', { message: '请填写用户名和密码' });
            return;
        }

        // 验证用户名格式：只能包含英文字母和数字
        const usernameRegex = /^[a-zA-Z0-9]+$/;
        if (!usernameRegex.test(nickname)) {
            socket.emit('authError', { message: '用户名格式错误' });
            return;
        }

        // 验证密码格式：只能包含英文字母和数字
        const passwordRegex = /^[a-zA-Z0-9]+$/;
        if (!passwordRegex.test(password)) {
            socket.emit('authError', { message: '密码格式错误' });
            return;
        }

        // 检查用户是否存在
        const user = registeredUsers[nickname];
        if (!user) {
            socket.emit('authError', { message: '用户不存在' });
            return;
        }

        // 验证密码
        if (user.password !== password) {
            socket.emit('authError', { message: '密码错误' });
            return;
        }

        // 检查用户是否已在线（防止同一账号重复登录）
        const existingUser = Object.values(users).find(u => u.nickname === nickname);
        if (existingUser) {
            socket.emit('authError', { message: '该账号已在其他地方登录，请刷新界面重新登录' });
            return;
        }

        // 登录成功
        user.lastLoginAt = new Date().toISOString();
        saveUsersData();

        users[socket.id] = {
            id: socket.id,
            nickname: nickname,
            currentRoom: null,
            joinedAt: new Date().toISOString()
        };

        socket.emit('loginSuccess', { nickname });
        socket.emit('roomsList', Object.values(rooms).map(room => ({
            id: room.id,
            name: room.name,
            hasPassword: !!room.password,
            playerCount: room.players.length,
            spectatorCount: room.spectators.length,
            status: room.gameState.status
        })));
    });

    // 用户进入大厅（已登录用户）
    socket.on('enterLobby', () => {
        const user = users[socket.id];
        if (!user) {
            socket.emit('authError', { message: '请刷新界面重新登录' });
            return;
        }

        socket.emit('userInfo', { nickname: user.nickname });
        socket.emit('roomsList', Object.values(rooms).map(room => ({
            id: room.id,
            name: room.name,
            hasPassword: !!room.password,
            playerCount: room.players.length,
            spectatorCount: room.spectators.length,
            status: room.gameState.status
        })));
    });

    // 创建房间
    socket.on('createRoom', (data) => {
        const { name, password } = data;
        const user = users[socket.id];

        if (!user) {
            socket.emit('error', { message: '请刷新界面重新登录' });
            return;
        }

        if (user.currentRoom) {
            socket.emit('error', { message: '您已在其他房间中' });
            return;
        }

        const roomId = generateRoomId();
        const room = {
            id: roomId,
            name: name || `${user.nickname}的房间`,
            password: password || null,
            creator: user.nickname,
            players: [],
            spectators: [],
            gameState: {
                status: 'waiting', // waiting, playing, finished
                board: Array(15).fill().map(() => Array(15).fill(0)),
                currentPlayer: 1, // 1=黑子, 2=白子
                moves: [],
                startTime: null,
                endTime: null,
                winner: null,
                blackPlayer: null,
                whitePlayer: null
            },
            chat: [],
            createdAt: new Date().toISOString(),
            playerTimers: {},
            turnStartTime: null
        };

        rooms[roomId] = room;
        user.currentRoom = roomId;

        // 创建者加入房间
        socket.join(roomId);
        room.players.push({
            id: socket.id,
            nickname: user.nickname,
            color: null,
            joinedAt: new Date().toISOString()
        });

        socket.emit('roomJoined', { room });
        saveRoomsData();

        // 广播房间列表更新
        io.emit('roomsList', Object.values(rooms).map(room => ({
            id: room.id,
            name: room.name,
            hasPassword: !!room.password,
            playerCount: room.players.length,
            spectatorCount: room.spectators.length,
            status: room.gameState.status
        })));
    });

    // 加入房间
    socket.on('joinRoom', (data) => {
        const { roomId, password } = data;
        const user = users[socket.id];
        const room = rooms[roomId];

        if (!user) {
            socket.emit('error', { message: '请刷新界面重新登录' });
            return;
        }

        if (!room) {
            socket.emit('error', { message: '房间不存在' });
            return;
        }

        if (room.password && room.password !== password) {
            socket.emit('error', { message: '密码错误' });
            return;
        }

        if (user.currentRoom) {
            socket.emit('error', { message: '您已在其他房间中' });
            return;
        }

        user.currentRoom = roomId;
        socket.join(roomId);

        if (room.players.length < 2) {
            // 作为玩家加入
            room.players.push({
                id: socket.id,
                nickname: user.nickname,
                color: null,
                joinedAt: new Date().toISOString()
            });

            // 如果房间满员，开始游戏
            if (room.players.length === 2) {
                // 随机分配黑白子
                const blackIndex = Math.floor(Math.random() * 2);
                room.players[blackIndex].color = 1; // 黑子
                room.players[1 - blackIndex].color = 2; // 白子

                room.gameState.status = 'playing';
                room.gameState.startTime = new Date().toISOString();
                room.gameState.blackPlayer = room.players[blackIndex].nickname;
                room.gameState.whitePlayer = room.players[1 - blackIndex].nickname;
                room.turnStartTime = Date.now();

                io.to(roomId).emit('gameStart', { room });
            }
        } else {
            // 作为观众加入
            room.spectators.push({
                id: socket.id,
                nickname: user.nickname,
                joinedAt: new Date().toISOString()
            });
        }

        socket.emit('roomJoined', { room });
        socket.to(roomId).emit('roomUpdate', { room });
        saveRoomsData();
    });

    // 下棋
    socket.on('makeMove', (data) => {
        const { row, col } = data;
        const user = users[socket.id];
        const room = rooms[user?.currentRoom];

        if (!room || room.gameState.status !== 'playing') {
            return;
        }

        const player = room.players.find(p => p.id === socket.id);
        if (!player || player.color !== room.gameState.currentPlayer) {
            return;
        }

        if (room.gameState.board[row][col] !== 0) {
            return;
        }

        // 下棋
        room.gameState.board[row][col] = player.color;
        room.gameState.moves.push({
            row, col, player: player.color,
            nickname: player.nickname,
            timestamp: new Date().toISOString()
        });

        // 检查胜利
        const isWin = checkWin(room.gameState.board, row, col, player.color);

        if (isWin) {
            room.gameState.status = 'finished';
            room.gameState.winner = player.color;
            room.gameState.endTime = new Date().toISOString();

            // 保存对局记录
            const matchRecord = {
                id: uuidv4(),
                roomId: room.id,
                roomName: room.name,
                players: room.players.map(p => ({ nickname: p.nickname, color: p.color })),
                winner: player.nickname,
                winnerColor: player.color,
                moves: room.gameState.moves,
                startTime: room.gameState.startTime,
                endTime: room.gameState.endTime,
                duration: Date.now() - new Date(room.gameState.startTime).getTime(),
                chat: room.chat
            };
            saveMatchRecord(matchRecord);

            // 重置游戏状态，准备下一局
            room.gameState.status = 'ended';
            room.gameState.board = Array(15).fill().map(() => Array(15).fill(0));
            room.gameState.moves = [];
            room.gameState.currentPlayer = 1;
            room.gameState.endTime = new Date().toISOString();

            // 初始化玩家继续游戏状态
            room.players.forEach(p => {
                p.wantsContinue = false;
            });

            saveRoomsData();

            io.to(user.currentRoom).emit('gameEnd', {
                winner: player.nickname,
                winnerColor: player.color,
                room
            });
        } else {
            // 切换玩家
            room.gameState.currentPlayer = room.gameState.currentPlayer === 1 ? 2 : 1;
            room.turnStartTime = Date.now();

            io.to(user.currentRoom).emit('gameUpdate', { room });
        }
    });

    // 发送聊天消息
    socket.on('sendMessage', (data) => {
        const { message } = data;
        const user = users[socket.id];
        const room = rooms[user?.currentRoom];

        if (!room || !message.trim()) return;

        const chatMessage = {
            id: uuidv4(),
            nickname: user.nickname,
            message: message.trim(),
            timestamp: new Date().toISOString()
        };

        room.chat.push(chatMessage);
        io.to(user.currentRoom).emit('newMessage', chatMessage);
    });

    // 离开房间
    socket.on('leaveRoom', () => {
        handleUserLeaveRoom(socket.id);
    });



    // 成为观众
    socket.on('becomeSpectator', () => {
        const user = users[socket.id];
        if (!user || !user.currentRoom) return;

        const room = rooms[user.currentRoom];
        if (!room) return;

        // 从玩家列表中移除
        room.players = room.players.filter(p => p.id !== user.id);

        // 添加到观众列表
        if (!room.spectators.some(s => s.id === user.id)) {
            room.spectators.push({
                id: user.id,
                nickname: user.nickname
            });
        }

        // 如果游戏正在进行且玩家不足，结束游戏
        if (room.gameState.status === 'playing' && room.players.length < 2) {
            room.gameState.status = 'waiting';
            room.gameState.currentPlayer = 1;
            room.gameState.board = Array(15).fill().map(() => Array(15).fill(0));
        }

        saveRoomsData();
        io.to(user.currentRoom).emit('roomUpdate', { room });
    });

    // 观众加入游戏
    socket.on('joinAsPlayer', () => {
        const user = users[socket.id];
        if (!user || !user.currentRoom) return;

        const room = rooms[user.currentRoom];
        if (!room || room.players.length >= 2) return;

        // 从观众列表中移除
        room.spectators = room.spectators.filter(s => s.id !== user.id);

        // 添加到玩家列表
        room.players.push({
            id: user.id,
            nickname: user.nickname,
            color: null,
            joinedAt: new Date().toISOString()
        });

        // 如果房间满员，开始游戏
        if (room.players.length === 2) {
            // 随机分配黑白子
            const blackIndex = Math.floor(Math.random() * 2);
            room.players[blackIndex].color = 1; // 黑子
            room.players[1 - blackIndex].color = 2; // 白子

            room.gameState.status = 'playing';
            room.gameState.startTime = new Date().toISOString();
            room.gameState.blackPlayer = room.players[blackIndex].nickname;
            room.gameState.whitePlayer = room.players[1 - blackIndex].nickname;
            room.turnStartTime = Date.now();

            saveRoomsData();
            io.to(user.currentRoom).emit('gameStart', { room });
        } else {
            saveRoomsData();
            io.to(user.currentRoom).emit('roomUpdate', { room });
        }
    });

    // 玩家选择继续游戏
    socket.on('continueGame', () => {
        const user = users[socket.id];
        if (!user || !user.currentRoom) return;

        const room = rooms[user.currentRoom];
        if (!room || room.gameState.status !== 'ended') return;

        // 标记该玩家想要继续
        const player = room.players.find(p => p.id === user.id);
        if (player) {
            player.wantsContinue = true;
        }

        // 检查是否所有玩家都选择继续
        const allWantContinue = room.players.length === 2 &&
                               room.players.every(p => p.wantsContinue);

        if (allWantContinue) {
            // 随机分配黑白子
            const shuffledPlayers = [...room.players].sort(() => Math.random() - 0.5);

            // 更新原始玩家数组中的颜色
            room.players.forEach((player, index) => {
                if (player.id === shuffledPlayers[0].id) {
                    player.color = 1; // 黑子
                } else if (player.id === shuffledPlayers[1].id) {
                    player.color = 2; // 白子
                }
            });

            // 重置游戏状态
            room.gameState = {
                status: 'playing',
                currentPlayer: 1, // 黑子先手
                board: Array(15).fill().map(() => Array(15).fill(0)),
                moves: [],
                startTime: new Date().toISOString(),
                endTime: null
            };

            // 重置玩家继续状态
            room.players.forEach(p => {
                p.wantsContinue = false;
            });

            room.turnStartTime = Date.now();
            saveRoomsData();

            io.to(user.currentRoom).emit('gameStart', { room });
        } else {
            saveRoomsData();
            io.to(user.currentRoom).emit('roomUpdate', { room });
        }
    });

    // 断开连接
    socket.on('disconnect', () => {
        console.log('用户断开连接:', socket.id);
        handleUserLeaveRoom(socket.id);
        delete users[socket.id];
    });
});

// 处理用户离开房间
function handleUserLeaveRoom(socketId) {
    const user = users[socketId];
    if (!user || !user.currentRoom) return;

    const room = rooms[user.currentRoom];
    if (!room) return;

    const roomId = user.currentRoom; // 保存房间ID，因为后面会清空user.currentRoom
    let wasPlayer = false;
    let leavingPlayerName = user.nickname;

    // 从玩家列表中移除
    const playerIndex = room.players.findIndex(p => p.id === socketId);
    if (playerIndex !== -1) {
        wasPlayer = true;
        room.players.splice(playerIndex, 1);

        // 如果游戏进行中且有玩家离开
        if (room.gameState.status === 'playing') {
            if (room.players.length < 2) {
                // 游戏结束，剩余玩家获胜
                const remainingPlayer = room.players[0];
                if (remainingPlayer) {
                    room.gameState.status = 'ended';
                    room.gameState.winner = remainingPlayer.color;
                    room.gameState.endTime = new Date().toISOString();

                    // 初始化玩家继续游戏状态
                    room.players.forEach(p => {
                        p.wantsContinue = false;
                    });

                    // 通知游戏结束
                    io.to(roomId).emit('gameEnd', {
                        winner: remainingPlayer.nickname,
                        winnerColor: remainingPlayer.color,
                        reason: 'opponent_left',
                        leftPlayerName: leavingPlayerName,
                        room
                    });
                } else {
                    // 没有剩余玩家，重置游戏状态
                    room.gameState.status = 'waiting';
                }
            }
        }
    }

    // 从观众列表中移除
    room.spectators = room.spectators.filter(s => s.id !== socketId);

    // 清空用户当前房间
    user.currentRoom = null;

    // 如果房间空了，删除房间
    if (room.players.length === 0 && room.spectators.length === 0) {
        delete rooms[roomId];
    } else {
        // 更新房间信息（只有房间还存在时才发送）
        io.to(roomId).emit('roomUpdate', { room });
    }

    saveRoomsData();

    // 广播房间列表更新
    io.emit('roomsList', Object.values(rooms).map(room => ({
        id: room.id,
        name: room.name,
        hasPassword: !!room.password,
        playerCount: room.players.length,
        spectatorCount: room.spectators.length,
        status: room.gameState.status
    })));
}

// 定时检查超时
setInterval(() => {
    Object.values(rooms).forEach(room => {
        if (room.gameState.status === 'playing' && room.turnStartTime) {
            const elapsed = Date.now() - room.turnStartTime;
            if (elapsed > 5 * 60 * 1000) { // 5分钟超时
                // 切换到下一个玩家
                room.gameState.currentPlayer = room.gameState.currentPlayer === 1 ? 2 : 1;
                room.turnStartTime = Date.now();

                io.to(room.id).emit('playerTimeout', {
                    room,
                    timeoutPlayer: room.gameState.currentPlayer === 1 ? 2 : 1
                });
            }
        }
    });
}, 1000);

// 启动服务器
const PORT = process.env.PORT || 3000;

initializeData().then(() => {
    server.listen(PORT, () => {
        console.log(`服务器运行在端口 ${PORT}`);
        console.log(`访问地址: http://localhost:${PORT}`);
    });
});
