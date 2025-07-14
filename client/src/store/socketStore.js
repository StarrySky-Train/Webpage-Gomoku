import { create } from 'zustand'
import { io } from 'socket.io-client'

// 获取Socket.IO服务器URL
const getSocketUrl = () => {
  // 生产环境使用相同域名，开发环境使用localhost:3000
  return process.env.NODE_ENV === 'production' 
    ? window.location.origin
    : 'http://localhost:3000'
}

export const useSocketStore = create((set, get) => ({
  socket: null,
  connected: false,
  user: null,
  error: null,
  
  // 初始化Socket连接
  initSocket: () => {
    const socket = io(getSocketUrl(), {
      transports: ['websocket', 'polling'],
      autoConnect: true
    })
    
    socket.on('connect', () => {
      console.log('Socket连接成功')
      set({ connected: true, error: null })
    })
    
    socket.on('connect_error', (err) => {
      console.error('Socket连接错误:', err)
      set({ connected: false, error: '服务器连接失败，请稍后再试' })
    })
    
    socket.on('disconnect', (reason) => {
      console.log('Socket断开连接:', reason)
      set({ connected: false })
    })
    
    socket.on('error', ({ message }) => {
      console.error('Socket错误:', message)
      set({ error: message })
      
      // 3秒后清除错误
      setTimeout(() => {
        set({ error: null })
      }, 3000)
    })
    
    socket.on('user:joined', (userData) => {
      set({ user: userData })
    })
    
    set({ socket })
    return socket
  },
  
  // 加入系统（设置用户名）
  joinSystem: (username) => {
    const { socket } = get()
    if (socket && username) {
      socket.emit('user:join', { username })
    }
  },
  
  // 获取房间列表
  getRooms: () => {
    const { socket } = get()
    if (socket) {
      socket.emit('rooms:get')
    }
  },
  
  // 创建房间
  createRoom: (roomData) => {
    const { socket } = get()
    if (socket) {
      socket.emit('room:create', roomData)
    }
  },
  
  // 加入房间
  joinRoom: (roomId, password = '') => {
    const { socket } = get()
    if (socket) {
      socket.emit('room:join', { roomId, password })
    }
  },
  
  // 离开房间
  leaveRoom: () => {
    const { socket } = get()
    if (socket) {
      socket.emit('room:leave')
    }
  },
  
  // 下棋
  makeMove: (roomId, position) => {
    const { socket } = get()
    if (socket) {
      socket.emit('game:move', { roomId, position })
    }
  },
  
  // 观众加入游戏（替补）
  spectatorJoinGame: (roomId) => {
    const { socket } = get()
    if (socket) {
      socket.emit('game:spectator_join', { roomId })
    }
  },
  
  // 清除错误
  clearError: () => set({ error: null })
}))