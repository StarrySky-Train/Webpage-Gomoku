import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSocketStore } from '../store/socketStore'
import { useGameStore } from '../store/gameStore'
import RoomList from '../components/RoomList'
import CreateRoomModal from '../components/CreateRoomModal'
import UsernameModal from '../components/UsernameModal'
import { ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline'

const HomePage = () => {
  const navigate = useNavigate()
  const { socket, connected, user, joinSystem, getRooms, error } = useSocketStore()
  const { rooms, initListeners, resetGame } = useGameStore()
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showUsernameModal, setShowUsernameModal] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 初始化游戏监听器
  useEffect(() => {
    if (socket && connected) {
      initListeners()
      resetGame()
      
      // 监听房间创建成功
      const handleRoomCreated = ({ roomId }) => {
        navigate(`/room/${roomId}`)
      }
      
      socket.on('room:created', handleRoomCreated)
      
      return () => {
        socket.off('room:created', handleRoomCreated)
      }
    }
  }, [socket, connected, initListeners, resetGame, navigate])
  
  // 检查用户是否已设置用户名
  useEffect(() => {
    if (connected && !user) {
      setShowUsernameModal(true)
    }
  }, [connected, user])
  
  // 获取房间列表
  useEffect(() => {
    if (connected && user) {
      getRooms()
      
      // 每30秒自动刷新房间列表
      const interval = setInterval(() => {
        getRooms()
      }, 30000)
      
      return () => clearInterval(interval)
    }
  }, [connected, user, getRooms])
  
  // 处理用户名提交
  const handleUsernameSubmit = (username) => {
    joinSystem(username)
    setShowUsernameModal(false)
  }
  
  // 刷新房间列表
  const handleRefreshRooms = () => {
    setIsRefreshing(true)
    getRooms()
    setTimeout(() => setIsRefreshing(false), 500)
  }
  
  // 加入房间
  const handleJoinRoom = (roomId, hasPassword) => {
    if (hasPassword) {
      // 显示密码输入对话框
      const password = prompt('请输入房间密码:')
      if (password !== null) {
        navigate(`/room/${roomId}`, { state: { password } })
      }
    } else {
      navigate(`/room/${roomId}`)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部导航栏 */}
      <header className="bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">五子棋在线对战</h1>
          {user && (
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">欢迎, {user.username}</span>
            </div>
          )}
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-500 text-white rounded-md shadow-md">
            {error}
          </div>
        )}
        
        {user ? (
          <div className="bg-gray-700 rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 flex justify-between items-center border-b border-gray-600">
              <h2 className="text-xl font-semibold">游戏大厅</h2>
              <div className="flex space-x-2">
                <button
                  onClick={handleRefreshRooms}
                  className="flex items-center px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded-md transition-colors"
                >
                  <ArrowPathIcon className={`w-5 h-5 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                  刷新
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center px-3 py-2 bg-primary-600 hover:bg-primary-500 rounded-md transition-colors"
                >
                  <PlusIcon className="w-5 h-5 mr-1" />
                  创建房间
                </button>
              </div>
            </div>
            
            <RoomList rooms={rooms} onJoinRoom={handleJoinRoom} />
          </div>
        ) : connected ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-lg">请设置您的用户名以继续...</p>
          </div>
        ) : (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500 mb-4"></div>
              <p className="text-lg">正在连接服务器...</p>
            </div>
          </div>
        )}
      </main>

      {/* 页脚 */}
      <footer className="bg-gray-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-400">
            五子棋在线对战 &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>

      {/* 模态框 */}
      {showUsernameModal && (
        <UsernameModal onSubmit={handleUsernameSubmit} />
      )}
      
      {showCreateModal && (
        <CreateRoomModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  )
}

export default HomePage