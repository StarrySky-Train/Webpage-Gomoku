// 全局变量
let socket;
let currentUser = null;

// 初始化函数
function init() {
  // 检查本地存储中是否有用户信息
  const savedUser = localStorage.getItem('gomokuUser');
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      document.getElementById('username').value = currentUser.username;
    } catch (e) {
      console.error('解析保存的用户数据失败', e);
      localStorage.removeItem('gomokuUser');
    }
  }

  // 初始化Socket.io连接
  socket = io();
  
  // 添加连接事件监听器
  socket.on('connect', () => {
    console.log('Socket.io连接成功');
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
    // 跳转到大厅页面
    window.location.href = '/lobby.html';
  });

  // 错误消息
  socket.on('error', (error) => {
    showNotification(error.message, 'error');
  });
}

// 设置DOM事件监听器
function setupEventListeners() {
  // 登录按钮
  document.getElementById('login-btn').addEventListener('click', () => {
    const username = document.getElementById('username').value.trim();
    if (username) {
      socket.emit('login', { 
        username, 
        userId: currentUser ? currentUser.id : null 
      });
    } else {
      showNotification('请输入昵称', 'error');
    }
  });

  // 登录输入框回车登录
  document.getElementById('username').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('login-btn').click();
    }
  });
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