import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon } from './heroicons-fix';

const GameChat = ({ messages, onSendMessage }) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  
  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // 发送消息
  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };
  
  // 格式化时间
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="card h-80 flex flex-col">
      <div className="card-header">
        <h2 className="text-xl font-semibold text-gray-800">聊天</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            <p>暂无消息</p>
            <p className="text-sm mt-1">发送消息与其他玩家交流</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.type === 'system' ? 'justify-center' : 'justify-start'}`}>
              {msg.type === 'system' ? (
                <div className="bg-gray-100 text-gray-600 text-xs rounded-full px-3 py-1 max-w-xs text-center">
                  {msg.text}
                </div>
              ) : (
                <div className="max-w-xs">
                  <div className="flex items-baseline mb-1">
                    <span className="font-medium text-sm">{msg.user}</span>
                    <span className="text-gray-400 text-xs ml-2">{formatTime(msg.timestamp)}</span>
                  </div>
                  <div className="bg-primary-100 text-gray-800 rounded-lg px-3 py-2 break-words">
                    {msg.text}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-3 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex">
          <input
            type="text"
            className="flex-1 rounded-l-md border-gray-300 focus:border-primary-500 focus:ring-primary-500"
            placeholder="输入消息..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            type="submit"
            className="bg-primary-600 text-white rounded-r-md px-3 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={!message.trim()}
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default GameChat;