import React from 'react';
import { CheckCircle } from 'lucide-react';

interface TrustIndicatorProps {
  text: string;
}

export const TrustIndicator: React.FC<TrustIndicatorProps> = ({ text }) => {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle className="w-5 h-5 text-green-400" />
      {text}
    </div>
  );
};
