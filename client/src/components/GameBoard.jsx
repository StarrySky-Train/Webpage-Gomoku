import { useState, useEffect, useRef } from 'react'
import { useSocketStore } from '../store/socketStore'

const GameBoard = ({ 
  board, 
  lastMove, 
  winningLine, 
  isMyTurn, 
  isPlayer, 
  gameStarted, 
  gameOver,
  roomId 
}) => {
  const { makeMove } = useSocketStore()
  const [boardSize, setBoardSize] = useState(560) // 默认棋盘大小
  const [cellSize, setCellSize] = useState(boardSize / 14) // 每个格子的大小
  const boardRef = useRef(null)
  
  // 响应式调整棋盘大小
  useEffect(() => {
    const handleResize = () => {
      if (boardRef.current) {
        // 在移动设备上使用较小的棋盘
        const isMobile = window.innerWidth < 640
        const containerWidth = isMobile 
          ? Math.min(window.innerWidth - 40, 400) 
          : Math.min(window.innerWidth * 0.5, 560)
        
        setBoardSize(containerWidth)
        setCellSize(containerWidth / 14)
      }
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [boardRef])
  
  // 处理落子
  const handleCellClick = (x, y) => {
    // 只有在我的回合、我是玩家、游戏已开始且未结束时才能落子
    if (!isMyTurn || !isPlayer || !gameStarted || gameOver) return
    
    // 检查位置是否已被占用
    if (board[y][x] !== null) return
    
    // 发送落子请求
    makeMove(roomId, { x, y })
  }
  
  // 判断是否是最后一步
  const isLastMove = (x, y) => {
    return lastMove && lastMove.x === x && lastMove.y === y
  }
  
  // 判断是否是获胜线上的点
  const isWinningPoint = (x, y) => {
    if (!winningLine) return false
    return winningLine.some(point => point.x === x && point.y === y)
  }

  return (
    <div 
      ref={boardRef}
      className="board relative"
      style={{ 
        width: `${boardSize}px`, 
        height: `${boardSize}px` 
      }}
    >
      {/* 棋盘网格 */}
      <div 
        className="board-grid"
        style={{ 
          gridTemplateColumns: `repeat(15, ${cellSize}px)`,
          gridTemplateRows: `repeat(15, ${cellSize}px)`,
        }}
      >
        {Array(15).fill().map((_, y) => (
          Array(15).fill().map((_, x) => (
            <div 
              key={`${x}-${y}`}
              className="board-cell"
              onClick={() => handleCellClick(x, y)}
              style={{
                cursor: isMyTurn && isPlayer && gameStarted && !gameOver && board[y][x] === null 
                  ? 'pointer' 
                  : 'default'
              }}
            />
          ))
        ))}
      </div>
      
      {/* 棋子 */}
      {board.map((row, y) => (
        row.map((cell, x) => {
          if (cell === null) return null
          
          const isBlack = cell === 'black'
          const isLast = isLastMove(x, y)
          const isWinning = isWinningPoint(x, y)
          
          return (
            <div 
              key={`piece-${x}-${y}`}
              className={`piece ${isBlack ? 'black' : 'white'} ${
                isLast ? 'last-move' : ''
              } ${
                isWinning ? 'animate-pulse' : ''
              } animate-scale-in`}
              style={{
                width: cellSize * 0.8,
                height: cellSize * 0.8,
                top: y * cellSize + cellSize * 0.1,
                left: x * cellSize + cellSize * 0.1,
                border: isWinning ? `2px solid ${isBlack ? '#ff4d4f' : '#ff4d4f'}` : 'none'
              }}
            />
          )
        })
      ))}
      
      {/* 棋盘标记点 */}
      {[3, 7, 11].map(y => (
        [3, 7, 11].map(x => (
          <div 
            key={`mark-${x}-${y}`}
            className="absolute bg-black rounded-full"
            style={{
              width: cellSize * 0.16,
              height: cellSize * 0.16,
              top: y * cellSize - cellSize * 0.08,
              left: x * cellSize - cellSize * 0.08,
            }}
          />
        ))
      ))}
    </div>
  )
}

export default GameBoard