import React from 'react';
import { ArrowRight } from 'lucide-react';

interface CTAButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  icon?: boolean;
}

export const CTAButton: React.FC<CTAButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  icon = false,
}) => {
  const baseClasses = 'px-8 py-4 rounded-xl font-semibold text-lg transition-all';
  const variantClasses =
    variant === 'primary'
      ? 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:shadow-xl hover:shadow-sky-500/50'
      : 'bg-slate-800/50 border border-slate-700 hover:bg-slate-700';

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses} ${icon ? 'flex items-center gap-2 group' : ''}`}
    >
      {children}
      {icon && (
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      )}
    </button>
  );
};
