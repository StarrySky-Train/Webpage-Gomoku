import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XIcon } from './heroicons-fix';

const CreateRoomModal = ({ isOpen, onClose, onCreateRoom }) => {
  const [roomName, setRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onCreateRoom({
      name: roomName.trim() || undefined,
      isPrivate,
      password: password.trim() || undefined
    });
    
    // 重置表单
    setRoomName('');
    setIsPrivate(false);
    setPassword('');
  };
  
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center"
                >
                  创建房间
                  <button
                    type="button"
                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">关闭</span>
                    <XIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </Dialog.Title>
                
                <form onSubmit={handleSubmit} className="mt-4">
                  <div className="mb-4">
                    <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-1">
                      房间名称
                    </label>
                    <input
                      type="text"
                      id="roomName"
                      className="input"
                      placeholder="请输入房间名称"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center">
                      <input
                        id="isPrivate"
                        name="isPrivate"
                        type="checkbox"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        checked={isPrivate}
                        onChange={(e) => setIsPrivate(e.target.checked)}
                      />
                      <label htmlFor="isPrivate" className="ml-2 block text-sm text-gray-700">
                        私密房间（不在大厅显示）
                      </label>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      房间密码（可选）
                    </label>
                    <input
                      type="password"
                      id="password"
                      className="input"
                      placeholder="留空表示无密码"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <p className="mt-1 text-xs text-gray-500">设置密码后，其他玩家需要输入密码才能加入</p>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={onClose}
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                    >
                      创建
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CreateRoomModal;