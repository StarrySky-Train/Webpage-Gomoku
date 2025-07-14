import { create } from 'zustand'
import { useSocketStore } from './socketStore'

export const useGameStore = create((set, get) => ({
  // 房间状态
  rooms: [],
  currentRoom: null,
  isLoading: false,
  
  // 游戏状态
  board: Array(15).fill().map(() => Array(15).fill(null)),
  lastMove: null,
  isMyTurn: false,
  isPlayer: false,
  isSpectator: false,
  gameStarted: false,
  gameOver: false,
  winner: null,
  winningLine: null,
  
  // 初始化监听器
  initListeners: () => {
    const socket = useSocketStore.getState().socket
    if (!socket) return
    
    // 房间列表更新
    socket.on('rooms:list', (roomsList) => {
      set({ rooms: roomsList })
    })
    
    // 房间创建成功
    socket.on('room:created', ({ roomId, room }) => {
      set({ 
        currentRoom: room,
        isPlayer: true,
        isSpectator: false,
        board: Array(15).fill().map(() => Array(15).fill(null)),
        lastMove: null,
        gameStarted: false,
        gameOver: false,
        winner: null,
        winningLine: null
      })
    })
    
    // 加入房间成功
    socket.on('room:joined', ({ room, joinedAsPlayer }) => {
      set({ 
        currentRoom: room,
        isPlayer: joinedAsPlayer,
        isSpectator: !joinedAsPlayer,
        board: room.board,
        gameStarted: room.gameStarted,
        gameOver: room.gameOver,
        winner: room.winner,
        isMyTurn: joinedAsPlayer && room.currentPlayer === socket.id
      })
    })
    
    // 房间状态更新
    socket.on('room:updated', ({ room }) => {
      const userId = socket.id
      const isPlayer = room.players.some(p => p.id === userId)
      const isSpectator = room.spectators.some(s => s.id === userId)
      
      set({ 
        currentRoom: room,
        isPlayer,
        isSpectator,
        gameStarted: room.gameStarted,
        gameOver: room.gameOver,
        winner: room.winner,
        isMyTurn: isPlayer && room.currentPlayer === userId
      })
    })
    
    // 用户加入房间
    socket.on('room:user_joined', ({ user, joinedAsPlayer }) => {
      const currentRoom = get().currentRoom
      if (!currentRoom) return
      
      if (joinedAsPlayer) {
        const updatedPlayers = [...currentRoom.players, user]
        set({ 
          currentRoom: { 
            ...currentRoom, 
            players: updatedPlayers 
          }
        })
      } else {
        const updatedSpectators = [...currentRoom.spectators, user]
        set({ 
          currentRoom: { 
            ...currentRoom, 
            spectators: updatedSpectators 
          }
        })
      }
    })
    
    // 用户离开房间
    socket.on('room:user_left', ({ userId, wasPlayer }) => {
      const currentRoom = get().currentRoom
      if (!currentRoom) return
      
      if (wasPlayer) {
        const updatedPlayers = currentRoom.players.filter(p => p.id !== userId)
        set({ 
          currentRoom: { 
            ...currentRoom, 
            players: updatedPlayers 
          }
        })
      } else {
        const updatedSpectators = currentRoom.spectators.filter(s => s.id !== userId)
        set({ 
          currentRoom: { 
            ...currentRoom, 
            spectators: updatedSpectators 
          }
        })
      }
    })
    
    // 游戏开始
    socket.on('game:started', ({ firstPlayer }) => {
      set({ 
        gameStarted: true,
        gameOver: false,
        winner: null,
        winningLine: null,
        isMyTurn: firstPlayer === socket.id
      })
    })
    
    // 下一步
    socket.on('game:next_turn', ({ nextPlayer, lastMove }) => {
      const { board } = get()
      const newBoard = JSON.parse(JSON.stringify(board))
      
      // 更新棋盘
      newBoard[lastMove.position.y][lastMove.position.x] = lastMove.isBlack ? 'black' : 'white'
      
      set({ 
        board: newBoard,
        lastMove: lastMove.position,
        isMyTurn: nextPlayer === socket.id
      })
    })
    
    // 游戏结束
    socket.on('game:over', ({ winner, winningLine }) => {
      set({ 
        gameOver: true,
        winner,
        winningLine,
        isMyTurn: false
      })
    })
    
    // 超时
    socket.on('game:timeout', ({ winner, loser }) => {
      set({ 
        gameOver: true,
        winner,
        isMyTurn: false
      })
    })
    
    // 玩家离开
    socket.on('game:player_left', ({ playerId }) => {
      set(state => ({
        currentRoom: state.currentRoom ? {
          ...state.currentRoom,
          players: state.currentRoom.players.filter(p => p.id !== playerId)
        } : null
      }))
    })
  },
  
  // 重置游戏状态
  resetGame: () => {
    set({
      currentRoom: null,
      board: Array(15).fill().map(() => Array(15).fill(null)),
      lastMove: null,
      isMyTurn: false,
      isPlayer: false,
      isSpectator: false,
      gameStarted: false,
      gameOver: false,
      winner: null,
      winningLine: null
    })
  },
  
  // 设置加载状态
  setLoading: (isLoading) => set({ isLoading })
}))