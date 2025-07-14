import { UserIcon, EyeIcon } from '@heroicons/react/24/outline'

const PlayersList = ({ players, spectators, currentPlayer, userId }) => {
  return (
    <div className="p-4">
      {/* 玩家列表 */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-400 mb-2">对战玩家</h3>
        <ul className="space-y-2">
          {players && players.length > 0 ? (
            players.map(player => (
              <li 
                key={player.id} 
                className={`flex items-center p-3 rounded-md ${player.id === currentPlayer ? 'bg-primary-700' : 'bg-gray-600'}`}
              >
                <div className="flex-shrink-0 mr-3">
                  <div className="relative">
                    <UserIcon className="w-6 h-6 text-gray-300" />
                    <div 
                      className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${player.isBlack ? 'bg-black' : 'bg-white'} border-2 border-gray-700`}
                    ></div>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {player.username}
                    {player.id === userId && <span className="ml-1 text-xs text-gray-400">(你)</span>}
                  </p>
                </div>
                {player.id === currentPlayer && (
                  <div className="ml-2 flex-shrink-0">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  </div>
                )}
              </li>
            ))
          ) : (
            <li className="p-3 bg-gray-600 rounded-md text-gray-400 text-sm">
              等待玩家加入...
            </li>
          )}
        </ul>
      </div>
      
      {/* 观众列表 */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-2">观战玩家 ({spectators?.length || 0})</h3>
        <ul className="space-y-2 max-h-60 overflow-y-auto">
          {spectators && spectators.length > 0 ? (
            spectators.map(spectator => (
              <li 
                key={spectator.id} 
                className="flex items-center p-3 bg-gray-600 rounded-md"
              >
                <div className="flex-shrink-0 mr-3">
                  <EyeIcon className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {spectator.username}
                    {spectator.id === userId && <span className="ml-1 text-xs text-gray-400">(你)</span>}
                  </p>
                </div>
              </li>
            ))
          ) : (
            <li className="p-3 bg-gray-600 rounded-md text-gray-400 text-sm">
              没有观战玩家
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}

export default PlayersList