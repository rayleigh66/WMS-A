import { Menu, LogOut, User } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import { ROLE_LABELS } from '../../types/api';

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
}

export function Header({ onMenuClick, title }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden text-gray-500 hover:text-gray-800">
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-gray-800 truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
              {user.name[0]}
            </div>
            <div className="text-right">
              <div className="font-medium text-gray-800">{user.name}</div>
              <div className="text-[11px] text-gray-400">{ROLE_LABELS[user.role] || user.role}</div>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">退出</span>
        </button>
      </div>
    </header>
  );
}
