import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import { SocketContext } from '../context/SocketContext';

// 组件
import LoginForm from '../components/LoginForm';
import RoomList from '../components/RoomList';
import CreateRoomModal from '../components/CreateRoomModal';
import JoinRoomModal from '../components/JoinRoomModal';

const Home = () => {
  const { user } = useContext(UserContext);
  const socket = useContext(SocketContext);
  const navigate = useNavigate();
  
  const [rooms, setRooms] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  
  // 监听房间列表更新
  useEffect(() => {
    if (socket) {
      // 获取房间列表
      socket.emit('get_room_list');
      
      // 监听房间列表更新
      socket.on('room_list', (roomList) => {
        setRooms(roomList);
      });
      
      // 监听房间创建成功
      socket.on('room_created', ({ roomId }) => {
        navigate(`/game/${roomId}`);
      });
      
      // 监听房间加入成功
      socket.on('room_joined', ({ roomId }) => {
        navigate(`/game/${roomId}`);
      });
      
      // 监听错误
      socket.on('error', ({ message }) => {
        alert(message);
      });
    }
    
    return () => {
      if (socket) {
        socket.off('room_list');
        socket.off('room_created');
        socket.off('room_joined');
        socket.off('error');
      }
    };
  }, [socket, navigate]);
  
  // 创建房间
  const handleCreateRoom = (roomData) => {
    socket.emit('create_room', roomData);
    setIsCreateModalOpen(false);
  };
  
  // 加入房间
  const handleJoinRoom = (roomData) => {
    socket.emit('join_room', roomData);
    setIsJoinModalOpen(false);
  };
  
  // 加入公开房间
  const handleJoinPublicRoom = (roomId) => {
    socket.emit('join_room', { roomId });
  };
  
  // 刷新房间列表
  const handleRefreshRooms = () => {
    socket.emit('get_room_list');
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">五子棋在线对战</h1>
        <p className="text-lg text-gray-600">实时多人对战，随时随地享受五子棋的乐趣</p>
      </div>
      
      {!user ? (
        <div className="max-w-md mx-auto animate-fadeIn">
          <LoginForm />
        </div>
      ) : (
        <div className="animate-fadeIn">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <div className="mb-4 md:mb-0">
              <h2 className="text-2xl font-semibold text-gray-800">欢迎, {user.username}!</h2>
              <p className="text-gray-600">选择一个房间加入或创建新房间</p>
            </div>
            <div className="flex space-x-4">
              <button 
                onClick={() => setIsJoinModalOpen(true)}
                className="btn-outline"
              >
                加入私密房间
              </button>
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="btn-primary"
              >
                创建房间
              </button>
            </div>
          </div>
          
          <RoomList 
            rooms={rooms} 
            onJoinRoom={handleJoinPublicRoom} 
            onRefresh={handleRefreshRooms}
          />
          
          <CreateRoomModal 
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onCreateRoom={handleCreateRoom}
          />
          
          <JoinRoomModal 
            isOpen={isJoinModalOpen}
            onClose={() => setIsJoinModalOpen(false)}
            onJoinRoom={handleJoinRoom}
          />
        </div>
      )}
    </div>
  );
};

export default Home;