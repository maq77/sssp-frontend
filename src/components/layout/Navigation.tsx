import React from 'react';
import { Shield, Menu, X } from 'lucide-react';
import { NAV_ITEMS } from '../../constants/navigation.constants';
import { PageId } from '../../types/navigation.types';

interface NavigationProps {
  activePage: PageId;
  setPage: (page: PageId) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ 
  activePage, 
  setPage, 
  mobileMenuOpen, 
  setMobileMenuOpen 
}) => {
  return (
    <nav className="fixed top-0 w-full bg-slate-950/95 backdrop-blur-md border-b border-slate-800 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Logo onClick={() => setPage('home')} />
          
          <DesktopMenu 
            activePage={activePage} 
            setPage={setPage} 
          />

          <MobileMenuButton 
            isOpen={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          />
        </div>

        {mobileMenuOpen && (
          <MobileMenu 
            activePage={activePage}
            setPage={setPage}
            onClose={() => setMobileMenuOpen(false)}
          />
        )}
      </div>
    </nav>
  );
};

const Logo: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <div className="flex items-center gap-2 cursor-pointer" onClick={onClick}>
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
        <Shield className="w-6 h-6 text-white" />
      </div>
      <div>
        <span className="text-xl font-bold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
          SSSP
        </span>
        <div className="text-[10px] text-slate-400">Smart Security & Sustainability Platform</div>
      </div>
    </div>
  );
};

const DesktopMenu: React.FC<{ activePage: PageId; setPage: (page: PageId) => void }> = ({ 
  activePage, 
  setPage 
}) => {
  return (
    <div className="hidden md:flex items-center gap-6">
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          onClick={() => setPage(item.id as PageId)}
          className={`text-sm font-medium transition-colors ${
            activePage === item.id 
              ? 'text-sky-400' 
              : 'text-slate-300 hover:text-white'
          }`}
        >
          {item.label}
        </button>
      ))}
      <button className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-sky-500/50 transition-all">
        Request Demo
      </button>
    </div>
  );
};

const MobileMenuButton: React.FC<{ isOpen: boolean; onClick: () => void }> = ({ 
  isOpen, 
  onClick 
}) => {
  return (
    <button className="md:hidden p-2" onClick={onClick}>
      {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
    </button>
  );
};

const MobileMenu: React.FC<{ 
  activePage: PageId; 
  setPage: (page: PageId) => void;
  onClose: () => void;
}> = ({ activePage, setPage, onClose }) => {
  const handleNavigation = (pageId: PageId) => {
    setPage(pageId);
    onClose();
  };

  return (
    <div className="md:hidden py-4 space-y-2">
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          onClick={() => handleNavigation(item.id as PageId)}
          className={`block w-full text-left px-4 py-2 rounded-lg ${
            activePage === item.id 
              ? 'bg-sky-500/20 text-sky-400' 
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};
