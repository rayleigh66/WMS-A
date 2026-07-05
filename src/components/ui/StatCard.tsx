import type { ReactNode } from 'react';

interface CardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  className?: string;
}

export function StatCard({ title, value, icon, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm ${className}`}>
      <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-800">{value}</div>
        <div className="text-sm text-gray-500">{title}</div>
      </div>
    </div>
  );
}
