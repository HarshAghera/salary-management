import ImportExportIcon from '@mui/icons-material/ImportExport';
import InsightsIcon from '@mui/icons-material/Insights';
import PeopleIcon from '@mui/icons-material/People';
import type { ReactElement } from 'react';

export interface NavItem {
  label: string;
  path: string;
  icon: ReactElement;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Employees', path: '/employees', icon: <PeopleIcon /> },
  { label: 'Insights', path: '/insights', icon: <InsightsIcon /> },
  { label: 'Import & export', path: '/import-export', icon: <ImportExportIcon /> },
];
