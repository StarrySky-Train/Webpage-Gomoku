import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SocketContext } from '../context/SocketContext';
import { UserContext } from '../context/UserContext';

// 组件
import Board from '../components/Board';
import GameInfo from '../components/GameInfo';
import GameHeader from '../components/GameHeader';
import GameChat from '../components/GameChat';
import GameOverModal from '../components/GameOverModal';

const Game = () => {
  const { roomId } = useParams();
  const socket = useContext(SocketContext);
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  
  const [roomInfo, setRoomInfo] = useState(null);
  const [gameOver, setGameOver] = useState(null);
  const [messages, setMessages] = useState([]);
  const [playerRole, setPlayerRole] = useState(null); // 'black', 'white', 'spectator'
  
  // 初始化和事件监听
  useEffect(() => {
    if (!socket || !user) return;
    
    // 加入房间
    if (roomId) {
      socket.emit('join_room', { roomId });
    }
    
    // 监听房间信息更新
    socket.on('room_info', (info) => {
      setRoomInfo(info);
      
      // 确定玩家角色
      const player = info.players.find(p => p.id === socket.id);
      if (player) {
        setPlayerRole(player.role);
      } else {
        setPlayerRole('spectator');
      }
    });
    
    // 监听游戏开始
    socket.on('game_started', (data) => {
      // 可以添加游戏开始的动画或提示
      addSystemMessage(`游戏开始！${data.black.username} (黑子) vs ${data.white.username} (白子)`);
    });
    
    // 监听移动
    socket.on('move_made', (data) => {
      if (roomInfo && roomInfo.players) {
        const playerName = roomInfo.players.find(p => p.role === data.player)?.username;
        addSystemMessage(`${playerName || '玩家'} (${data.player === 'black' ? '黑子' : '白子'}) 落子于 (${data.row + 1}, ${data.col + 1})`);
      }
    });
    
    // 监听游戏结束
    socket.on('game_over', (data) => {
      setGameOver(data);
      
      if (data.draw) {
        addSystemMessage('游戏结束，平局！');
      } else if (data.timeout) {
        addSystemMessage(`游戏结束，${data.loserUsername} (${data.loser === 'black' ? '黑子' : '白子'}) 超时，${data.winnerUsername} (${data.winner === 'black' ? '黑子' : '白子'}) 获胜！`);
      } else if (roomInfo && roomInfo.players) {
        const winnerName = roomInfo.players.find(p => p.role === data.winner)?.username;
        addSystemMessage(`游戏结束，${winnerName || '玩家'} (${data.winner === 'black' ? '黑子' : '白子'}) 获胜！`);
      } else {
        addSystemMessage(`游戏结束，${data.winner === 'black' ? '黑子' : '白子'} 获胜！`);
      }
    });
    
    // 监听玩家加入
    socket.on('player_joined', (data) => {
      addSystemMessage(`${data.username} 加入了游戏，作为 ${data.role === 'black' ? '黑子' : '白子'}`);
    });
    
    // 监听玩家离开
    socket.on('player_left', (data) => {
      addSystemMessage(`${data.username} (${data.role === 'black' ? '黑子' : '白子'}) 离开了游戏`);
    });
    
    // 监听错误
    socket.on('error', ({ message }) => {
      alert(message);
    });
    
    return () => {
      // 离开房间
      socket.emit('leave_room');
      
      // 清理事件监听
      socket.off('room_info');
      socket.off('game_started');
      socket.off('move_made');
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('game_over');
      socket.off('error');
    };
  }, [socket, user, roomId, navigate, roomInfo]);
  
  // 添加系统消息
  const addSystemMessage = (text) => {
    setMessages(prev => [...prev, { type: 'system', text, timestamp: new Date() }]);
  };
  
  // 发送聊天消息
  const sendChatMessage = (text) => {
    // 这里可以实现聊天功能，目前只添加到本地
    setMessages(prev => [...prev, { type: 'user', user: user.username, text, timestamp: new Date() }]);
  };
  
  // 处理落子
  const handleMove = (row, col) => {
    if (!roomInfo?.gameStarted || playerRole !== roomInfo?.currentTurn) return;
    
    socket.emit('make_move', { row, col });
  };
  
  // 处理观众加入游戏
  const handleSpectatorJoinGame = () => {
    socket.emit('spectator_join_game');
  };
  
  // 返回大厅
  const handleReturnToLobby = () => {
    navigate('/');
  };
  
  // 重新开始游戏
  const handleRestartGame = () => {
    // 目前简单实现为创建新房间
    socket.emit('create_room', { name: `${user.username}的房间` });
  };
  
  if (!roomInfo) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <GameHeader 
        roomName={roomInfo.name} 
        roomId={roomId} 
        onReturnToLobby={handleReturnToLobby} 
      />
      
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 游戏信息侧边栏 */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <GameInfo 
            roomInfo={roomInfo} 
            playerRole={playerRole}
            onSpectatorJoinGame={handleSpectatorJoinGame}
          />
          
          <div className="mt-6">
            <GameChat 
              messages={messages} 
              onSendMessage={sendChatMessage} 
            />
          </div>
        </div>
        
        {/* 棋盘 */}
        <div className="lg:col-span-2 order-1 lg:order-2">
          <Board 
            board={roomInfo.board} 
            onMove={handleMove} 
            currentTurn={roomInfo.currentTurn}
            playerRole={playerRole}
            gameStarted={roomInfo.gameStarted}
            lastMove={roomInfo.moveHistory.length > 0 ? roomInfo.moveHistory[roomInfo.moveHistory.length - 1] : null}
          />
        </div>
      </div>
      
      {/* 游戏结束弹窗 */}
      {gameOver && (
        <GameOverModal 
          gameOver={gameOver} 
          roomInfo={roomInfo}
          onRestart={handleRestartGame}
          onReturnToLobby={handleReturnToLobby}
        />
      )}
    </div>
  );
};

export default Game;