import {
  ActivityIcon,
  LucideBug,
  NotebookTabsIcon,
  SettingsIcon,
  UsersIcon,
} from 'lucide-react';

export const navigationList = [
  {
    title: 'Users',
    url: '/panel',
    icon: UsersIcon,
  },
  {
    title: 'Token stats',
    url: '/panel/token-stats',
    icon: ActivityIcon,
  },
  {
    title: 'Access Management',
    url: '/panel/manage-permissions',
    icon: SettingsIcon,
  },
  {
    title: 'System Prompts',
    url: '/panel/system-prompts',
    icon: NotebookTabsIcon,
  },
  {
    title: 'Debug',
    url: '/panel/debug',
    icon: LucideBug,
  }
];
