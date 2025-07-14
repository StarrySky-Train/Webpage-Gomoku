import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useSocketStore } from '../store/socketStore'
import { useGameStore } from '../store/gameStore'
import GameBoard from '../components/GameBoard'
import GameInfo from '../components/GameInfo'
import PlayersList from '../components/PlayersList'
import GameControls from '../components/GameControls'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

const GameRoom = () => {
  const { roomId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  
  const { socket, connected, user, joinRoom, leaveRoom, error } = useSocketStore()
  const { 
    currentRoom, 
    board, 
    lastMove,
    isMyTurn, 
    isPlayer, 
    isSpectator,
    gameStarted,
    gameOver,
    winner,
    winningLine,
    initListeners,
    resetGame
  } = useGameStore()
  
  const [hasJoined, setHasJoined] = useState(false)
  const [timeLeft, setTimeLeft] = useState(300) // 5分钟倒计时
  
  // 初始化游戏监听器
  useEffect(() => {
    if (socket && connected) {
      initListeners()
      
      // 监听房间加入成功
      const handleRoomJoined = () => {
        setHasJoined(true)
      }
      
      socket.on('room:joined', handleRoomJoined)
      
      return () => {
        socket.off('room:joined', handleRoomJoined)
      }
    }
  }, [socket, connected, initListeners])
  
  // 加入房间
  useEffect(() => {
    if (connected && user && roomId && !hasJoined) {
      // 从location.state获取密码（如果有）
      const password = location.state?.password || ''
      joinRoom(roomId, password)
    }
  }, [connected, user, roomId, hasJoined, joinRoom, location.state])
  
  // 离开房间
  useEffect(() => {
    return () => {
      if (connected) {
        leaveRoom()
        resetGame()
      }
    }
  }, [connected, leaveRoom, resetGame])
  
  // 处理倒计时
  useEffect(() => {
    if (gameStarted && !gameOver && currentRoom) {
      // 重置倒计时
      setTimeLeft(300) // 5分钟
      
      // 开始倒计时
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 0) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      return () => clearInterval(timer)
    }
  }, [gameStarted, gameOver, currentRoom, isMyTurn])
  
  // 返回大厅
  const handleBackToLobby = () => {
    leaveRoom()
    navigate('/')
  }
  
  // 如果未连接或未设置用户名，显示加载中
  if (!connected || !user) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500 mb-4"></div>
          <p className="text-lg">正在连接服务器...</p>
        </div>
      </div>
    )
  }
  
  // 如果未加入房间，显示加载中
  if (!hasJoined || !currentRoom) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500 mb-4"></div>
          <p className="text-lg">正在加入房间...</p>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部导航栏 */}
      <header className="bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={handleBackToLobby}
              className="mr-4 p-2 rounded-full hover:bg-gray-700 transition-colors"
              aria-label="返回大厅"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-white">
              房间: {currentRoom.name} 
              <span className="text-sm font-normal ml-2 text-gray-400">#{roomId}</span>
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-300">{user.username}</span>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-4 p-4 bg-red-500 text-white rounded-md shadow-md">
              {error}
            </div>
          )}
          
          <div className="flex flex-col lg:flex-row gap-8">
            {/* 游戏区域 */}
            <div className="lg:w-2/3">
              <div className="bg-gray-700 rounded-lg shadow-lg overflow-hidden">
                <div className="p-4 border-b border-gray-600">
                  <GameInfo 
                    room={currentRoom} 
                    isMyTurn={isMyTurn}
                    gameStarted={gameStarted}
                    gameOver={gameOver}
                    winner={winner}
                    timeLeft={timeLeft}
                  />
                </div>
                
                <div className="p-6 flex justify-center">
                  <GameBoard 
                    board={board}
                    lastMove={lastMove}
                    winningLine={winningLine}
                    isMyTurn={isMyTurn}
                    isPlayer={isPlayer}
                    gameStarted={gameStarted}
                    gameOver={gameOver}
                    roomId={roomId}
                  />
                </div>
                
                <div className="p-4 border-t border-gray-600">
                  <GameControls 
                    isPlayer={isPlayer} 
                    isSpectator={isSpectator}
                    gameStarted={gameStarted}
                    gameOver={gameOver}
                    roomId={roomId}
                    onLeaveRoom={handleBackToLobby}
                  />
                </div>
              </div>
            </div>
            
            {/* 侧边栏 */}
            <div className="lg:w-1/3">
              <div className="bg-gray-700 rounded-lg shadow-lg overflow-hidden">
                <div className="p-4 border-b border-gray-600">
                  <h2 className="text-lg font-semibold">玩家列表</h2>
                </div>
                
                <PlayersList 
                  players={currentRoom.players} 
                  spectators={currentRoom.spectators}
                  currentPlayer={currentRoom.currentPlayer}
                  userId={user.id}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-gray-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-400">
            五子棋在线对战 &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  )
}

export default GameRoom