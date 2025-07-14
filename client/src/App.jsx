import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useSocketStore } from './store/socketStore'
import HomePage from './pages/HomePage'
import GameRoom from './pages/GameRoom'
import NotFound from './pages/NotFound'

function App() {
  const { initSocket, socket, connected } = useSocketStore()

  // 初始化Socket连接
  useEffect(() => {
    if (!socket) {
      initSocket()
    }
    
    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [initSocket, socket])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/room/:roomId" element={<GameRoom />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}

export default App