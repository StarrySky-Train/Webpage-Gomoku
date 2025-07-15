// 全局变量
let socket;
let currentUser = null;
let selectedRoomForPassword = null;

// 初始化函数
function init() {
  // 检查是否已登录
  const savedUser = localStorage.getItem('gomokuUser');
  if (!savedUser) {
    // 未登录，重定向到登录页
    window.location.href = '/index.html';
    return;
  }

  try {
    currentUser = JSON.parse(savedUser);
    document.getElementById('user-name').textContent = currentUser.username;
  } catch (e) {
    console.error('解析保存的用户数据失败', e);
    localStorage.removeItem('gomokuUser');
    window.location.href = '/index.html';
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
}

// 设置Socket.io事件监听器
function setupSocketListeners() {
  // 登录成功
  socket.on('loginSuccess', (user) => {
    currentUser = user;
    localStorage.setItem('gomokuUser', JSON.stringify(user));
    document.getElementById('user-name').textContent = user.username;
    
    // 获取房间列表
    socket.emit('getRooms');
  });

  // 房间列表更新
  socket.on('roomList', (rooms) => {
    updateRoomList(rooms);
  });

  // 新房间创建
  socket.on('newRoom', (room) => {
    addRoomToList(room);
  });

  // 房间创建成功
  socket.on('roomCreated', (room) => {
    // 跳转到游戏页面
    localStorage.setItem('currentRoom', JSON.stringify(room));
    window.location.href = '/game.html';
  });

  // 加入房间成功
  socket.on('joinedRoom', (room) => {
    // 跳转到游戏页面
    localStorage.setItem('currentRoom', JSON.stringify(room));
    window.location.href = '/game.html';
  });

  // 房间删除
  socket.on('roomDeleted', (data) => {
    removeRoomFromList(data.roomId);
  });

  // 错误消息
  socket.on('error', (error) => {
    showNotification(error.message, 'error');
  });
}

// 设置DOM事件监听器
function setupEventListeners() {
  // 创建房间按钮
  document.getElementById('create-room-btn').addEventListener('click', () => {
    showModal('create-room-modal');
  });

  // 加入私密房间按钮
  document.getElementById('join-private-btn').addEventListener('click', () => {
    showModal('join-private-modal');
  });

  // 刷新房间列表按钮
  document.getElementById('refresh-rooms-btn').addEventListener('click', () => {
    socket.emit('getRooms');
  });

  // 确认创建房间按钮
  document.getElementById('confirm-create-room').addEventListener('click', () => {
    const roomName = document.getElementById('room-name').value.trim();
    const roomType = document.getElementById('room-type').value;
    const password = document.getElementById('room-password').value;

    if (roomName) {
      socket.emit('createRoom', {
        roomName,
        isPrivate: roomType === 'private',
        password
      });
      hideModal('create-room-modal');
      // 清空表单
      document.getElementById('room-name').value = '';
      document.getElementById('room-type').value = 'public';
      document.getElementById('room-password').value = '';
    } else {
      showNotification('请输入房间名称', 'error');
    }
  });

  // 确认加入私密房间按钮
  document.getElementById('confirm-join-private').addEventListener('click', () => {
    const roomId = document.getElementById('private-room-id').value.trim();
    const password = document.getElementById('private-room-password').value;

    if (roomId) {
      socket.emit('joinRoom', { roomId, password });
      hideModal('join-private-modal');
      // 清空表单
      document.getElementById('private-room-id').value = '';
      document.getElementById('private-room-password').value = '';
    } else {
      showNotification('请输入房间ID', 'error');
    }
  });

  // 确认密码按钮
  document.getElementById('confirm-password').addEventListener('click', () => {
    if (selectedRoomForPassword) {
      const password = document.getElementById('room-password-input').value;
      socket.emit('joinRoom', { 
        roomId: selectedRoomForPassword, 
        password 
      });
      hideModal('password-modal');
      selectedRoomForPassword = null;
      document.getElementById('room-password-input').value = '';
    }
  });

  // 关闭模态框按钮
  document.querySelectorAll('.close-modal').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
      });
    });
  });

  // 点击模态框外部关闭
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });
}

// 显示模态框
function showModal(modalId) {
  document.getElementById(modalId).classList.add('active');
}

// 隐藏模态框
function hideModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

// 更新房间列表
function updateRoomList(rooms) {
  const roomList = document.getElementById('room-list');
  roomList.innerHTML = '';

  if (rooms.length === 0) {
    roomList.innerHTML = '<div class="empty-message">当前没有可用的房间，创建一个吧！</div>';
    return;
  }

  rooms.forEach(room => {
    addRoomToList(room);
  });
}

// 添加房间到列表
function addRoomToList(room) {
  const roomList = document.getElementById('room-list');
  const emptyMessage = roomList.querySelector('.empty-message');
  if (emptyMessage) {
    roomList.innerHTML = '';
  }

  const roomCard = document.createElement('div');
  roomCard.className = 'room-card';
  roomCard.dataset.roomId = room.id;

  const isPlaying = room.gameStarted;
  const playerCount = room.players ? room.players.length : 0;
  const spectatorCount = room.spectators ? room.spectators.length : 0;

  roomCard.innerHTML = `
    <div class="room-card-header">
      <div class="room-name">${escapeHtml(room.name)}</div>
      <div class="room-status ${isPlaying ? 'playing' : 'open'}">${isPlaying ? '对局中' : '等待中'}</div>
    </div>
    <div class="room-info">
      <div>玩家: ${playerCount}/2</div>
      <div>观众: ${spectatorCount}</div>
      ${room.hasPassword ? '<div><i class="fas fa-lock"></i> 需要密码</div>' : ''}
    </div>
    <div class="room-actions">
      <button class="btn btn-primary join-room-btn">加入房间</button>
    </div>
  `;

  roomList.appendChild(roomCard);

  // 添加加入房间事件
  const joinBtn = roomCard.querySelector('.join-room-btn');
  joinBtn.addEventListener('click', () => {
    if (room.hasPassword) {
      selectedRoomForPassword = room.id;
      showModal('password-modal');
    } else {
      socket.emit('joinRoom', { roomId: room.id });
    }
  });
}

// 从列表中移除房间
function removeRoomFromList(roomId) {
  const roomCard = document.querySelector(`.room-card[data-room-id="${roomId}"]`);
  if (roomCard) {
    roomCard.remove();
  }

  const roomList = document.getElementById('room-list');
  if (roomList.children.length === 0) {
    roomList.innerHTML = '<div class="empty-message">当前没有可用的房间，创建一个吧！</div>';
  }
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