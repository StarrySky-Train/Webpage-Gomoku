import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">404</h2>
          <p className="mt-2 text-center text-xl text-gray-600">页面未找到</p>
        </div>
        <div className="mt-8">
          <p className="text-gray-600 mb-4">您访问的页面不存在或已被移除</p>
          <Link to="/" className="btn-primary inline-block">
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;