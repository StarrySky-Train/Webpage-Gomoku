import { useSocketStore } from '../store/socketStore'

const GameInfo = ({ 
  room, 
  isMyTurn, 
  gameStarted, 
  gameOver, 
  winner,
  timeLeft 
}) => {
  const { user } = useSocketStore()
  
  // 格式化时间
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }
  
  // 获取当前玩家
  const getCurrentPlayer = () => {
    if (!room || !room.players || !room.currentPlayer) return null
    return room.players.find(p => p.id === room.currentPlayer)
  }
  
  // 获取我的玩家信息
  const getMyPlayerInfo = () => {
    if (!room || !room.players || !user) return null
    return room.players.find(p => p.id === user.id)
  }
  
  // 获取对手玩家信息
  const getOpponentInfo = () => {
    if (!room || !room.players || !user) return null
    return room.players.find(p => p.id !== user.id)
  }
  
  const currentPlayer = getCurrentPlayer()
  const myInfo = getMyPlayerInfo()
  const opponentInfo = getOpponentInfo()
  
  // 游戏状态信息
  let statusMessage = '等待对手加入...'
  let statusColor = 'text-yellow-500'
  
  if (gameStarted && !gameOver) {
    if (isMyTurn) {
      statusMessage = '轮到你下棋'
      statusColor = 'text-green-500'
    } else {
      statusMessage = `等待 ${currentPlayer?.username || '对手'} 下棋`
      statusColor = 'text-blue-500'
    }
  } else if (gameOver) {
    if (winner && winner.id === user?.id) {
      statusMessage = '恭喜你获胜！'
      statusColor = 'text-green-500'
    } else if (winner) {
      statusMessage = `${winner.username} 获胜`
      statusColor = 'text-red-500'
    } else {
      statusMessage = '游戏结束'
      statusColor = 'text-gray-500'
    }
  } else if (room?.players?.length === 2) {
    statusMessage = '准备开始游戏...'
    statusColor = 'text-blue-500'
  }

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      {/* 游戏状态 */}
      <div className="flex-1">
        <h2 className={`text-xl font-semibold ${statusColor}`}>
          {statusMessage}
        </h2>
        
        {gameStarted && !gameOver && (
          <div className="mt-2 text-sm text-gray-300">
            <p>黑子已下: {room?.blackMoves || 0} 步</p>
            <p>白子已下: {room?.whiteMoves || 0} 步</p>
          </div>
        )}
      </div>
      
      {/* 玩家信息 */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* 我的信息 */}
        {myInfo && (
          <div className={`px-4 py-2 rounded-md ${isMyTurn && !gameOver ? 'bg-primary-700 animate-pulse' : 'bg-gray-600'}`}>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full ${myInfo.isBlack ? 'bg-black' : 'bg-white'}`}></div>
              <span className="font-medium">{myInfo.username} (你)</span>
            </div>
            {isMyTurn && !gameOver && (
              <div className="mt-1 text-sm">
                <span className="text-yellow-400">思考时间: {formatTime(timeLeft)}</span>
              </div>
            )}
          </div>
        )}
        
        {/* 对手信息 */}
        {opponentInfo && (
          <div className={`px-4 py-2 rounded-md ${!isMyTurn && !gameOver ? 'bg-primary-700 animate-pulse' : 'bg-gray-600'}`}>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full ${opponentInfo.isBlack ? 'bg-black' : 'bg-white'}`}></div>
              <span className="font-medium">{opponentInfo.username}</span>
            </div>
            {!isMyTurn && !gameOver && (
              <div className="mt-1 text-sm">
                <span className="text-yellow-400">思考时间: {formatTime(timeLeft)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default GameInfo