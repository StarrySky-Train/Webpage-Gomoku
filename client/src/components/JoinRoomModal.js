import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XIcon } from './heroicons-fix';

const JoinRoomModal = ({ isOpen, onClose, onJoinRoom }) => {
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (roomId.trim()) {
      onJoinRoom({
        roomId: roomId.trim(),
        password: password.trim() || undefined
      });
      
      // 重置表单
      setRoomId('');
      setPassword('');
    }
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
                  加入私密房间
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
                    <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 mb-1">
                      房间ID
                    </label>
                    <input
                      type="text"
                      id="roomId"
                      className="input"
                      placeholder="请输入房间ID"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="joinPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      房间密码（如果有）
                    </label>
                    <input
                      type="password"
                      id="joinPassword"
                      className="input"
                      placeholder="如果房间没有密码，请留空"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
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
                      disabled={!roomId.trim()}
                    >
                      加入
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

export default JoinRoomModal;