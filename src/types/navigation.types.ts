export interface NavItem {
  id: string;
  label: string;
  href: string;
}

// Used by some legacy (non-router) components; keep for compatibility.
export type PageId = 'home' | 'why' | 'useCases' | 'capabilities' | 'technology' | 'pricing' | 'about';
