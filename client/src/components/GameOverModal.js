import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { TrophyIcon, ClockIcon, RefreshIcon, HomeIcon } from './heroicons-fix';

const GameOverModal = ({ gameOver, roomInfo, onRestart, onReturnToLobby }) => {
  // 获取获胜者信息
  const getWinnerInfo = () => {
    if (gameOver.draw) {
      return { text: '平局', icon: null, color: 'bg-gray-100 text-gray-800' };
    }
    
    if (gameOver.timeout) {
      return {
        text: `${gameOver.winnerUsername} (${gameOver.winner === 'black' ? '黑子' : '白子'}) 获胜`,
        subtext: `${gameOver.loserUsername} (${gameOver.loser === 'black' ? '黑子' : '白子'}) 超时`,
        icon: <ClockIcon className="w-6 h-6" />,
        color: 'bg-yellow-100 text-yellow-800'
      };
    }
    
    const winnerName = roomInfo?.players.find(p => p.role === gameOver.winner)?.username || gameOver.winnerUsername;
    
    return {
      text: `${winnerName} (${gameOver.winner === 'black' ? '黑子' : '白子'}) 获胜`,
      icon: <TrophyIcon className="w-6 h-6" />,
      color: 'bg-green-100 text-green-800'
    };
  };
  
  const winnerInfo = getWinnerInfo();
  
  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={() => {}/* 防止点击外部关闭 */}>
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
                  className="text-lg font-medium leading-6 text-gray-900 text-center"
                >
                  游戏结束
                </Dialog.Title>
                
                <div className="mt-4">
                  <div className={`${winnerInfo.color} p-4 rounded-lg flex items-center justify-center space-x-3 mb-6`}>
                    {winnerInfo.icon && (
                      <div>
                        {winnerInfo.icon}
                      </div>
                    )}
                    <div>
                      <p className="text-lg font-bold">{winnerInfo.text}</p>
                      {winnerInfo.subtext && (
                        <p className="text-sm">{winnerInfo.subtext}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-sm text-gray-500">黑子步数</p>
                      <p className="text-xl font-medium">{roomInfo.blackMoves}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-sm text-gray-500">白子步数</p>
                      <p className="text-xl font-medium">{roomInfo.whiteMoves}</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-center space-x-4">
                    <button
                      type="button"
                      className="btn-outline flex items-center"
                      onClick={onReturnToLobby}
                    >
                      <HomeIcon className="w-5 h-5 mr-1" />
                      返回大厅
                    </button>
                    <button
                      type="button"
                      className="btn-primary flex items-center"
                      onClick={onRestart}
                    >
                      <RefreshIcon className="w-5 h-5 mr-1" />
                      再来一局
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default GameOverModal;