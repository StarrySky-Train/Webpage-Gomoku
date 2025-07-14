import React, { useState } from 'react';
import { ArrowLeftIcon, ClipboardCopyIcon, CheckIcon } from './heroicons-fix';

const GameHeader = ({ roomName, roomId, onReturnToLobby }) => {
  const [copied, setCopied] = useState(false);
  
  // 复制房间ID
  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white rounded-lg shadow-md p-4">
      <div>
        <div className="flex items-center">
          <button
            onClick={onReturnToLobby}
            className="mr-3 text-gray-500 hover:text-gray-700 focus:outline-none"
            title="返回大厅"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">{roomName}</h1>
        </div>
        <div className="mt-1 flex items-center">
          <span className="text-sm text-gray-500 mr-2">房间ID:</span>
          <code className="text-xs bg-gray-100 px-2 py-1 rounded">{roomId}</code>
          <button
            onClick={copyRoomId}
            className="ml-2 text-gray-500 hover:text-gray-700 focus:outline-none"
            title="复制房间ID"
          >
            {copied ? (
              <CheckIcon className="w-4 h-4 text-green-500" />
            ) : (
              <ClipboardCopyIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
      
      <div className="mt-3 sm:mt-0 self-end sm:self-auto">
        <p className="text-sm text-gray-600">
          邀请朋友加入，输入房间ID即可一起游戏
        </p>
      </div>
    </div>
  );
};

export default GameHeader;