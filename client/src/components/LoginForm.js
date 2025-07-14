import React, { useState, useContext } from 'react';
import { UserContext } from '../context/UserContext';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const { handleLogin } = useContext(UserContext);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      handleLogin(username.trim());
    }
  };
  
  return (
    <div className="card animate-slideIn">
      <div className="card-header">
        <h2 className="text-xl font-semibold text-gray-800">登录</h2>
      </div>
      <form onSubmit={handleSubmit} className="card-body">
        <div className="mb-4">
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            用户名
          </label>
          <input
            type="text"
            id="username"
            className="input"
            placeholder="请输入您的用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full btn-primary"
          disabled={!username.trim()}
        >
          开始游戏
        </button>
      </form>
    </div>
  );
};

export default LoginForm;