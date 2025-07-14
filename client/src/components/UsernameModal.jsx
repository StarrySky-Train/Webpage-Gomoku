import { useState } from 'react'

const UsernameModal = ({ onSubmit }) => {
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  
  const handleSubmit = (e) => {
    e.preventDefault()
    
    // 验证用户名
    if (!username.trim()) {
      setError('请输入用户名')
      return
    }
    
    if (username.length < 2) {
      setError('用户名至少需要2个字符')
      return
    }
    
    if (username.length > 15) {
      setError('用户名最多15个字符')
      return
    }
    
    // 提交用户名
    onSubmit(username.trim())
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full overflow-hidden animate-fade-in">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">欢迎来到五子棋在线对战</h2>
          <p className="text-gray-400 mb-6">请输入您的用户名以继续</p>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                用户名
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="输入您的用户名"
                autoFocus
              />
              {error && (
                <p className="mt-2 text-sm text-red-500">{error}</p>
              )}
            </div>
            
            <button
              type="submit"
              className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-500 rounded-md transition-colors"
            >
              开始游戏
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default UsernameModal