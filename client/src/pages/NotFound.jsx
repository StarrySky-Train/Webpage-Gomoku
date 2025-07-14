import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary-500 mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-6">页面未找到</h2>
        <p className="text-gray-400 mb-8">您访问的页面不存在或已被移除</p>
        <Link 
          to="/" 
          className="px-6 py-3 bg-primary-600 hover:bg-primary-500 rounded-md transition-colors inline-block"
        >
          返回首页
        </Link>
      </div>
    </div>
  )
}

export default NotFound