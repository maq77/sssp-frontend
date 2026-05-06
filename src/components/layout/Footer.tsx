import React from 'react';
import { Shield } from 'lucide-react';
import { PageId } from '../../types/navigation.types';

interface FooterProps {
  setPage: (page: PageId) => void;
}

export const Footer: React.FC<FooterProps> = ({ setPage }) => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <FooterBrand />
          <FooterLinks 
            title="Product"
            links={[
              { label: 'Capabilities', page: 'capabilities' },
              { label: 'Technology', page: 'technology' },
              { label: 'Pricing', page: 'pricing' },
              { label: 'Use Cases', page: 'useCases' }
            ]}
            setPage={setPage}
          />
          <FooterLinks 
            title="Company"
            links={[
              { label: 'About Us', page: 'about' },
              { label: 'Partners', page: 'about' }
            ]}
            setPage={setPage}
          />
          <FooterLegal />
        </div>

        <FooterBottom />
      </div>
    </footer>
  );
};

const FooterBrand: React.FC = () => {
  return (
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
  );
};

const FooterLinks: React.FC<{
  title: string;
  links: Array<{ label: string; page: PageId }>;
  setPage: (page: PageId) => void;
}> = ({ title, links, setPage }) => {
  return (
    <div>
      <h3 className="font-semibold mb-4">{title}</h3>
      <ul className="space-y-2 text-sm text-slate-400">
        {links.map((link, i) => (
          <li key={i}>
            <button onClick={() => setPage(link.page)} className="hover:text-sky-400">
              {link.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

const FooterLegal: React.FC = () => {
  return (
    <div>
      <h3 className="font-semibold mb-4">Legal</h3>
      <ul className="space-y-2 text-sm text-slate-400">
        <li><a href="#" className="hover:text-sky-400">Privacy Policy</a></li>
        <li><a href="#" className="hover:text-sky-400">Terms of Service</a></li>
        <li><a href="#" className="hover:text-sky-400">Security</a></li>
        <li><a href="#" className="hover:text-sky-400">Compliance</a></li>
      </ul>
    </div>
  );
};

const FooterBottom: React.FC = () => {
  return (
    <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-400">
      <div>© 2025 SSSP. All rights reserved.</div>
      <div className="flex items-center gap-6">
        <a href="#" className="hover:text-sky-400">LinkedIn</a>
        <a href="#" className="hover:text-sky-400">Twitter</a>
        <a href="#" className="hover:text-sky-400">GitHub</a>
      </div>
    </div>
  );
};