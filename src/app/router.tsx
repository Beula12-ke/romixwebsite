import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { RequirePermission } from '@/features/auth/RequirePermission';
import { LoginPage } from '@/features/auth/LoginPage';
import { AppLayout } from '@/components/layout/AppLayout';
import { AdminDashboard } from '@/features/branches/AdminDashboard';
import { BranchDashboard } from '@/features/branches/BranchDashboard';
import { BranchesPage } from '@/features/branches/BranchesPage';
import { UserListPage } from '@/features/users/UserListPage';
import { AuditLogPage } from '@/features/audit/AuditLogPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <AdminDashboard /> },
          { path: '/branch/dashboard', element: <BranchDashboard /> },
          { path: '/branches', element: <BranchesPage /> },
          {
            element: <RequirePermission permission="users.manage" />,
            children: [{ path: '/users', element: <UserListPage /> }],
          },
          {
            element: <RequirePermission permission="audit.view" />,
            children: [{ path: '/audit', element: <AuditLogPage /> }],
          },
        ],
      },
    ],
  },
]);
