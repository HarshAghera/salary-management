import { Navigate, Route, Routes } from 'react-router';
import { AppShell } from './app/AppShell';
import { NotFoundPage } from './app/NotFoundPage';
import { EmployeesPage } from './features/employees/EmployeesPage';
import { ImportExportPage } from './features/import-export/ImportExportPage';
import { InsightsPage } from './features/insights/InsightsPage';

export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/employees" replace />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/import-export" element={<ImportExportPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
}
