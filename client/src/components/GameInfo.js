import React from 'react';
import { UserIcon, ClockIcon } from './heroicons-fix';

const GameInfo = ({ roomInfo, playerRole, onSpectatorJoinGame }) => {
  // 计算游戏时间
  const getGameTime = () => {
    if (!roomInfo.startTime) return '00:00';
    
    const now = Date.now();
    const gameTime = Math.floor((now - roomInfo.startTime) / 1000);
    const minutes = Math.floor(gameTime / 60);
    const seconds = gameTime % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // 计算当前回合剩余时间
  const getRemainingTime = () => {
    if (!roomInfo.lastMoveTime || !roomInfo.gameStarted) return '05:00';
    
    const now = Date.now();
    const elapsedTime = Math.floor((now - roomInfo.lastMoveTime) / 1000);
    const remainingTime = Math.max(0, 5 * 60 - elapsedTime);
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // 判断是否可以加入游戏
  const canJoinGame = () => {
    return (
      playerRole === 'spectator' && // 是观众
      roomInfo.gameStarted && // 游戏已开始
      roomInfo.players.length < 2 // 有空位
    );
  };
  
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-semibold text-gray-800">游戏信息</h2>
      </div>
      
      <div className="card-body">
        {/* 游戏状态 */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-2">状态</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500 mb-1 flex items-center">
                <ClockIcon className="w-4 h-4 mr-1" />
                游戏时间
              </div>
              <div className="text-lg font-medium">{getGameTime()}</div>
            </div>
            
            {roomInfo.gameStarted && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500 mb-1 flex items-center">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  回合剩余
                </div>
                <div className="text-lg font-medium">{getRemainingTime()}</div>
              </div>
            )}
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">黑子已下</div>
              <div className="text-lg font-medium">{roomInfo.blackMoves} 步</div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">白子已下</div>
              <div className="text-lg font-medium">{roomInfo.whiteMoves} 步</div>
            </div>
          </div>
        </div>
        
        {/* 玩家列表 */}
        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">玩家列表</h3>
          
          <div className="space-y-2">
            {/* 对战玩家 */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-2">对战玩家</h4>
              
              {roomInfo.players.length === 0 ? (
                <p className="text-gray-500 text-sm">暂无玩家</p>
              ) : (
                <ul className="space-y-2">
                  {roomInfo.players.map((player) => (
                    <li key={player.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <UserIcon className="w-5 h-5 mr-2 text-gray-400" />
                        <span className="font-medium">{player.username}</span>
                      </div>
                      {player.role && (
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full ${player.role === 'black' ? 'bg-black' : 'bg-white border border-gray-400'} mr-1`}></div>
                          <span className="text-sm text-gray-600">{player.role === 'black' ? '黑子' : '白子'}</span>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              
              {canJoinGame() && (
                <button
                  onClick={onSpectatorJoinGame}
                  className="mt-3 w-full btn-outline text-sm py-1"
                >
                  加入游戏
                </button>
              )}
            </div>
            
            {/* 观战玩家 */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-2">观战玩家 ({roomInfo.spectators.length})</h4>
              
              {roomInfo.spectators.length === 0 ? (
                <p className="text-gray-500 text-sm">暂无观众</p>
              ) : (
                <ul className="space-y-1 max-h-32 overflow-y-auto">
                  {roomInfo.spectators.map((spectator) => (
                    <li key={spectator.id} className="flex items-center">
                      <UserIcon className="w-4 h-4 mr-1.5 text-gray-400" />
                      <span className="text-sm">{spectator.username}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameInfo;