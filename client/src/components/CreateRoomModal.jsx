import { useState } from 'react'
import { useSocketStore } from '../store/socketStore'
import { XMarkIcon } from '@heroicons/react/24/outline'

const CreateRoomModal = ({ onClose }) => {
  const { createRoom } = useSocketStore()
  
  const [roomName, setRoomName] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  
  const handleSubmit = (e) => {
    e.preventDefault()
    
    // 验证房间名
    if (!roomName.trim()) {
      setError('请输入房间名称')
      return
    }
    
    if (roomName.length < 2) {
      setError('房间名称至少需要2个字符')
      return
    }
    
    if (roomName.length > 20) {
      setError('房间名称最多20个字符')
      return
    }
    
    // 如果是私密房间，验证密码
    if (isPrivate && password.trim() === '') {
      setError('请为私密房间设置密码')
      return
    }
    
    // 创建房间
    createRoom({
      roomName: roomName.trim(),
      isPrivate,
      password: isPrivate ? password.trim() : null
    })
    
    // 关闭模态框
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full overflow-hidden animate-fade-in">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold">创建新房间</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-700 transition-colors"
            aria-label="关闭"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="roomName" className="block text-sm font-medium text-gray-300 mb-2">
                房间名称
              </label>
              <input
                type="text"
                id="roomName"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="输入房间名称"
                autoFocus
              />
            </div>
            
            <div className="mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-600 rounded"
                />
                <label htmlFor="isPrivate" className="ml-2 block text-sm text-gray-300">
                  创建私密房间
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                私密房间不会在大厅中显示，只能通过房间ID加入
              </p>
            </div>
            
            {isPrivate && (
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  房间密码
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="设置房间密码"
                />
              </div>
            )}
            
            {error && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-800 rounded-md">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 hover:bg-primary-500 rounded-md transition-colors"
              >
                创建房间
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateRoomModal