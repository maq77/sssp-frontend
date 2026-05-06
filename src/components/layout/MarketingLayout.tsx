import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Shield, Menu, X } from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Home' },
  { path: '/why-us', label: 'Why SSSP' },
  { path: '/use-cases', label: 'Use Cases' },
  { path: '/capabilities', label: 'Capabilities' },
  { path: '/horus', label: 'Horus AI' },
  { path: '/technology', label: 'Technology' },
  { path: '/pricing', label: 'Pricing' },
  { path: '/about', label: 'About' }
];

function isHorusLink(item: NavItem) {
  return item.path === '/horus';
}

export const MarketingLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-slate-950/95 backdrop-blur-md border-b border-slate-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
                  SSSP
                </span>
                <div className="text-[10px] text-slate-400">Smart Security & Sustainability Platform</div>
              </div>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-6">
              {NAV_ITEMS.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={
                    isHorusLink(item)
                      ? `relative rounded-full px-3 py-1.5 text-sm font-bold transition-all ${
                          location.pathname === item.path
                            ? 'horus-nav-glow border border-sky-300/50 bg-sky-400/15 text-sky-100'
                            : 'horus-nav-glow border border-sky-400/25 bg-sky-400/10 text-sky-200 hover:border-sky-300/60 hover:bg-sky-400/15 hover:text-white'
                        }`
                      : `text-sm font-medium transition-colors ${
                          location.pathname === item.path
                            ? 'text-sky-400'
                            : 'text-slate-300 hover:text-white'
                        }`
                  }
                >
                  {item.label}
                </Link>
              ))}
              <Link
                to="/contact"
                className="px-4 py-2 border border-sky-500/40 text-sky-300 rounded-lg font-semibold hover:border-sky-400 hover:text-sky-200 transition-all text-sm"
              >
                Contact Sales
              </Link>
              <Link
                to="/login"
                className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-sky-500/50 transition-all"
              >
                Sign In
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-2">
              {NAV_ITEMS.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={
                    isHorusLink(item)
                      ? `block w-full rounded-lg px-4 py-2 text-left font-bold transition-all ${
                          location.pathname === item.path
                            ? 'horus-nav-glow border border-sky-300/50 bg-sky-400/15 text-sky-100'
                            : 'horus-nav-glow border border-sky-400/25 bg-sky-400/10 text-sky-200 hover:bg-sky-400/15 hover:text-white'
                        }`
                      : `block w-full text-left px-4 py-2 rounded-lg ${
                          location.pathname === item.path
                            ? 'bg-sky-500/20 text-sky-400'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`
                  }
                >
                  {item.label}
                </Link>
              ))}
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 rounded-lg font-semibold"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Page Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
                  SSSP
                </span>
              </div>
              <p className="text-sm text-slate-400">
                Smart Security & Sustainability Platform — Protecting what matters, sustaining our future.
              </p>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/capabilities" className="hover:text-sky-400">Capabilities</Link></li>
                <li>
                  <Link
                    to="/horus"
                    className="horus-text-glow font-semibold text-sky-200 transition-colors hover:text-white"
                  >
                    Horus AI
                  </Link>
                </li>
                <li><Link to="/technology" className="hover:text-sky-400">Technology</Link></li>
                <li><Link to="/pricing" className="hover:text-sky-400">Pricing</Link></li>
                <li><Link to="/use-cases" className="hover:text-sky-400">Use Cases</Link></li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/about" className="hover:text-sky-400">About Us</Link></li>
                <li><Link to="/about#partners" className="hover:text-sky-400">Partners</Link></li>
                <li><a href="#" className="hover:text-sky-400">Careers</a></li>
                <li><Link to="/contact" className="hover:text-sky-400 font-semibold text-sky-300">Contact Sales</Link></li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-sky-400">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-sky-400">Terms of Service</a></li>
                <li><a href="#" className="hover:text-sky-400">Security</a></li>
                <li><a href="#" className="hover:text-sky-400">Compliance</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-400">
            <div>© 2025 SSSP. All rights reserved.</div>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-sky-400">LinkedIn</a>
              <a href="#" className="hover:text-sky-400">Twitter</a>
              <a href="#" className="hover:text-sky-400">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
