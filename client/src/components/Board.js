import React from 'react';

const Board = ({ board, onMove, currentTurn, playerRole, gameStarted, lastMove }) => {
  // 棋盘大小
  const BOARD_SIZE = board.length;
  
  // 判断是否可以落子
  const canMove = (row, col) => {
    return (
      gameStarted && // 游戏已开始
      playerRole === currentTurn && // 轮到当前玩家
      board[row][col] === null // 该位置没有棋子
    );
  };
  
  // 处理点击棋盘
  const handleCellClick = (row, col) => {
    if (canMove(row, col)) {
      onMove(row, col);
    }
  };
  
  // 判断是否是最后一步
  const isLastMove = (row, col) => {
    return lastMove && lastMove.row === row && lastMove.col === col;
  };
  
  // 获取单元格类名
  const getCellClassName = (row, col) => {
    let className = 'board-cell';
    
    // 添加棋子类名
    if (board[row][col] === 'black') {
      className += ' black-stone';
    } else if (board[row][col] === 'white') {
      className += ' white-stone';
    }
    
    // 添加最后一步标记
    if (isLastMove(row, col)) {
      className += ' last-move';
    }
    
    // 添加可点击状态
    if (canMove(row, col)) {
      className += ' cursor-pointer hover:bg-board-hover';
    } else if (!gameStarted) {
      className += ' cursor-not-allowed';
    }
    
    return className;
  };
  
  // 渲染棋盘
  return (
    <div className="card">
      <div className="card-header flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">五子棋</h2>
        {gameStarted && (
          <div className="flex items-center">
            <span className="mr-2">当前回合:</span>
            <div className="flex items-center">
              <div className={`w-4 h-4 rounded-full ${currentTurn === 'black' ? 'bg-black' : 'bg-white border border-gray-400'} mr-1`}></div>
              <span>{currentTurn === 'black' ? '黑子' : '白子'}</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="card-body p-0 overflow-auto">
        <div className="board-container relative w-full aspect-square max-w-2xl mx-auto">
          <div 
            className="grid bg-board-light border border-gray-800" 
            style={{ 
              gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
              gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
            }}
          >
            {board.map((row, rowIndex) => (
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={getCellClassName(rowIndex, colIndex)}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  title={`${rowIndex + 1}, ${colIndex + 1}`}
                ></div>
              ))
            ))}
          </div>
          
          {!gameStarted && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-10">
              <div className="bg-white p-4 rounded-lg shadow-lg text-center">
                <p className="text-lg font-medium">
                  {playerRole ? '等待对手加入...' : '观战模式'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="card-footer text-center text-sm text-gray-600">
        {playerRole ? (
          <p>
            你的角色: 
            <span className="font-medium ml-1">
              {playerRole === 'black' ? '黑子' : playerRole === 'white' ? '白子' : '观众'}
            </span>
          </p>
        ) : (
          <p>你正在观战</p>
        )}
      </div>
    </div>
  );
};

export default Board;