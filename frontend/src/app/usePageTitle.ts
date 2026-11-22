import { useEffect } from 'react';

export const APP_NAME = 'ACME Salary Management';

/**
 * Names the page in the browser tab and history, so tabs, bookmarks and screen readers
 * announcing a navigation can tell the pages apart.
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · ${APP_NAME}`;
    return () => {
      document.title = APP_NAME;
    };
  }, [title]);
}
