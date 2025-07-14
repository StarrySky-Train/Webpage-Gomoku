import { UsersIcon, LockClosedIcon } from '@heroicons/react/24/outline'

const RoomList = ({ rooms, onJoinRoom }) => {
  // 如果没有房间，显示提示信息
  if (!rooms || rooms.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400">当前没有可用的游戏房间</p>
        <p className="text-sm text-gray-500 mt-2">创建一个新房间开始游戏吧！</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map(room => (
          <li key={room.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-md transition-transform hover:transform hover:scale-[1.02]">
            <div className="p-4 border-b border-gray-700">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-medium truncate" title={room.name}>
                  {room.name}
                </h3>
                {room.hasPassword && (
                  <LockClosedIcon className="w-5 h-5 text-yellow-500" title="需要密码" />
                )}
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-400">
                <UsersIcon className="w-4 h-4 mr-1" />
                <span>
                  {room.players.length}/2 玩家 
                  {room.spectators.length > 0 && `(+${room.spectators.length} 观众)`}
                </span>
              </div>
            </div>
            
            <div className="p-4 bg-gray-750">
              <div className="flex justify-between items-center">
                <div className="text-sm">
                  <span className={`inline-block w-2 h-2 rounded-full mr-1 ${room.gameStarted ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                  <span className="text-gray-300">
                    {room.gameStarted ? '游戏进行中' : '等待开始'}
                  </span>
                </div>
                <button
                  onClick={() => onJoinRoom(room.id, room.hasPassword)}
                  className="px-3 py-1.5 bg-primary-600 hover:bg-primary-500 rounded-md text-sm transition-colors"
                >
                  {room.gameStarted ? '观战' : '加入'}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default RoomList