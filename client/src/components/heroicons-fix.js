// 这个文件是为了兼容@heroicons/react的新版本
// 在新版本中，导入方式已经改变，不再有outline和solid子包
// 这个文件提供了一个兼容层，使得代码可以继续使用旧的导入方式

// 如果你使用的是@heroicons/react v1.x版本，可以忽略这个文件
// 如果你使用的是@heroicons/react v2.x版本，请使用这个文件中的导出

import {
  ArrowLeftIcon,
  ClockIcon,
  ClipboardIcon as ClipboardCopyIcon,
  CheckIcon,
  HomeIcon,
  LockClosedIcon,
  PaperAirplaneIcon,
  ArrowPathIcon as RefreshIcon,
  TrophyIcon,
  UserIcon,
  UserGroupIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export {
  ArrowLeftIcon,
  ClockIcon,
  ClipboardCopyIcon,
  CheckIcon,
  HomeIcon,
  LockClosedIcon,
  PaperAirplaneIcon,
  RefreshIcon,
  TrophyIcon,
  UserIcon,
  UserGroupIcon,
  XMarkIcon as XIcon
};