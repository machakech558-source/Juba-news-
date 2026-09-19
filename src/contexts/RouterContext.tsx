import React, { createContext, useContext, useState, useEffect } from 'react';

interface RouterContextType {
  currentPath: string;
  navigate: (path: string) => void;
  params: Record<string, string>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

const getInitialPath = (): string => {
  if (typeof window === 'undefined') return '/';
  if (window.location.hash && window.location.hash.startsWith('#/')) {
    return window.location.hash.slice(1);
  }
  return window.location.pathname || '/';
};

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState<string>(getInitialPath);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const handleLocationChange = () => {
      if (window.location.hash && window.location.hash.startsWith('#/')) {
        setCurrentPath(window.location.hash.slice(1));
      } else {
        setCurrentPath(window.location.pathname || '/');
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigate = (path: string) => {
    if (path === currentPath) return;
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper to parse dynamic route parameters
  const getParams = (): Record<string, string> => {
    const params: Record<string, string> = {};

    // Match /article/:slug
    if (currentPath.startsWith('/article/')) {
      params.slug = currentPath.replace('/article/', '');
    }

    // Match /admin/articles/:id/edit
    const adminEditMatch = currentPath.match(/^\/admin\/articles\/([^/]+)\/edit$/);
    if (adminEditMatch) {
      params.id = adminEditMatch[1];
    }

    // Match /author/:id
    if (currentPath.startsWith('/author/')) {
      params.authorId = currentPath.replace('/author/', '');
    }

    return params;
  };

  return (
    <RouterContext.Provider
      value={{
        currentPath,
        navigate,
        params: getParams(),
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within RouterProvider');
  }
  return context;
};
