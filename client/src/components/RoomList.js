import React from 'react';
import { RefreshIcon, UserGroupIcon, LockClosedIcon } from './heroicons-fix';

const RoomList = ({ rooms, onJoinRoom, onRefresh }) => {
  return (
    <div className="card animate-slideIn">
      <div className="card-header flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">公开房间</h2>
        <button 
          onClick={onRefresh}
          className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
          title="刷新房间列表"
        >
          <RefreshIcon className="w-5 h-5" />
        </button>
      </div>
      
      <div className="overflow-hidden">
        {rooms.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>暂无公开房间</p>
            <p className="text-sm mt-2">创建一个新房间或稍后再查看</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    房间名称
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    玩家数
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    密码
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rooms.map((room) => (
                  <tr key={room.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{room.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <UserGroupIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        {room.players}/{room.maxPlayers}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${room.status === '等待中' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {room.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {room.hasPassword ? (
                        <div className="flex items-center">
                          <LockClosedIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          是
                        </div>
                      ) : '否'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => onJoinRoom(room.id)}
                        className={`text-primary-600 hover:text-primary-900 ${room.players >= room.maxPlayers && room.status !== '等待中' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={room.players >= room.maxPlayers && room.status !== '等待中'}
                      >
                        {room.players >= room.maxPlayers && room.status !== '等待中' ? '已满' : '加入'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomList;