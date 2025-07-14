// 这个文件是为了兼容@heroicons/react的新版本
// 在新版本中，导入方式已经改变，不再有outline和solid子包
// 这个文件提供了一个兼容层，使得代码可以继续使用旧的导入方式

// 如果你使用的是@heroicons/react v1.x版本，可以忽略这个文件
// 如果你使用的是@heroicons/react v2.x版本，请使用这个文件中的导出

import {
  ArrowLeft as ArrowLeftIcon,
  Clock as ClockIcon,
  ClipboardCopy as ClipboardCopyIcon,
  Check as CheckIcon,
  Home as HomeIcon,
  LockClosed as LockClosedIcon,
  PaperAirplane as PaperAirplaneIcon,
  Refresh as RefreshIcon,
  Trophy as TrophyIcon,
  User as UserIcon,
  UserGroup as UserGroupIcon,
  XMark as XIcon
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
  XIcon
};