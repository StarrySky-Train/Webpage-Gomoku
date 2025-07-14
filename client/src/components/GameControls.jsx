import { useSocketStore } from '../store/socketStore'

const GameControls = ({ 
  isPlayer, 
  isSpectator, 
  gameStarted, 
  gameOver, 
  roomId,
  onLeaveRoom 
}) => {
  const { spectatorJoinGame } = useSocketStore()
  
  // 观众加入游戏（替补）
  const handleJoinGame = () => {
    spectatorJoinGame(roomId)
  }

  return (
    <div className="flex flex-wrap justify-center gap-4">
      {/* 观众可以加入游戏（如果游戏未满员） */}
      {isSpectator && !isPlayer && (
        <button
          onClick={handleJoinGame}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-500 rounded-md transition-colors"
          disabled={gameStarted && !gameOver}
        >
          {gameStarted && !gameOver ? '游戏进行中，无法加入' : '加入游戏'}
        </button>
      )}
      
      {/* 离开房间按钮 */}
      <button
        onClick={onLeaveRoom}
        className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md transition-colors"
      >
        离开房间
      </button>
    </div>
  )
}

export default GameControls