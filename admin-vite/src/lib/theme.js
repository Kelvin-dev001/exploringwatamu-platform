import { useEffect, useState } from 'react';

const KEY = 'ew-admin-theme'; // 'light' | 'dark' | 'system'

function apply(pref) {
  const dark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#090c11' : '#f7f8fa');
}

export function initTheme() {
  let pref = 'system';
  try {
    pref = localStorage.getItem(KEY) || 'system';
  } catch { /* ignore */ }
  apply(pref);
}

export function useTheme() {
  const [pref, setPref] = useState(() => {
    try {
      return localStorage.getItem(KEY) || 'system';
    } catch {
      return 'system';
    }
  });
  useEffect(() => {
    apply(pref);
    try {
      localStorage.setItem(KEY, pref);
    } catch { /* ignore */ }
    if (pref !== 'system') return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const on = () => apply('system');
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [pref]);
  return [pref, setPref];
}
