'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

type AppState = {
  sidebarCollapsed: boolean;
  scrollPositions: Record<string, number>;
  lastWorkspace?: string;
  theme?: string;
};

const STORAGE_KEY = 'estech-app-state';

export function useAppState() {
  const pathname = usePathname();
  const [state, setState] = useState<AppState>({
    sidebarCollapsed: false,
    scrollPositions: {},
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setState(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  function toggleSidebar() {
    setState(s => ({ ...s, sidebarCollapsed: !s.sidebarCollapsed }));
  }

  function setScrollPosition(path: string, position: number) {
    setState(s => ({
      ...s,
      scrollPositions: { ...s.scrollPositions, [path]: position }
    }));
  }

  function setWorkspace(workspace: string) {
    setState(s => ({ ...s, lastWorkspace: workspace }));
  }

  return { state, toggleSidebar, setScrollPosition, setWorkspace };
}