import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import io from 'socket.io-client';

// 页面组件
import Home from './pages/Home';
import Game from './pages/Game';
import NotFound from './pages/NotFound';

// 上下文
import { SocketContext } from './context/SocketContext';
import { UserContext } from './context/UserContext';

// 创建socket连接
const socket = io(process.env.NODE_ENV === 'production' ? window.location.origin : 'http://localhost:5000');

function App() {
  const [user, setUser] = useState(() => {
    // 从本地存储获取用户信息
    const savedUser = localStorage.getItem('gomoku_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // 当用户信息变化时保存到本地存储
  useEffect(() => {
    if (user) {
      localStorage.setItem('gomoku_user', JSON.stringify(user));
    }
  }, [user]);

  // 处理用户登录
  const handleLogin = (username) => {
    const newUser = { username, id: socket.id };
    setUser(newUser);
    
    // 通知服务器用户加入
    socket.emit('user_join', { username });
  };

  return (
    <SocketContext.Provider value={socket}>
      <UserContext.Provider value={{ user, setUser, handleLogin }}>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/game/:roomId" element={user ? <Game /> : <Navigate to="/" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </UserContext.Provider>
    </SocketContext.Provider>
  );
}

export default App;