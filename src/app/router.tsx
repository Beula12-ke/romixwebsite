import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { RequirePermission } from '@/features/auth/RequirePermission';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { AppLayout } from '@/components/layout/AppLayout';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { PublicLayout } from '@/features/public/PublicLayout';
import { HomePage } from '@/features/public/HomePage';
import { FleetPage } from '@/features/public/FleetPage';
import { PublicVehiclePage } from '@/features/public/PublicVehiclePage';
import { PublicBranchesPage } from '@/features/public/PublicBranchesPage';
import { BranchesPage } from '@/features/branches/BranchesPage';
import { AboutPage } from '@/features/public/AboutPage';
import { ContactPage } from '@/features/public/ContactPage';
import { PartnerPage } from '@/features/public/PartnerPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { BranchDashboard } from '@/features/branches/BranchDashboard';
import { UserListPage } from '@/features/users/UserListPage';
import { AuditLogPage } from '@/features/audit/AuditLogPage';
import { VehicleListPage } from '@/features/vehicles/VehicleListPage';
import { VehicleCreatePage } from '@/features/vehicles/VehicleCreatePage';
import { VehicleDetailPage } from '@/features/vehicles/VehicleDetailPage';
import { CustomerListPage } from '@/features/customers/CustomerListPage';
import { CustomerCreatePage } from '@/features/customers/CustomerCreatePage';
import { BookingListPage } from '@/features/bookings/BookingListPage';
import { BookingCreatePage } from '@/features/bookings/BookingCreatePage';
import { BookingDetailPage } from '@/features/bookings/BookingDetailPage';
import { PaymentReceiptPage } from '@/features/payments/PaymentReceiptPage';
import { MyBookingsPage } from '@/features/portal/MyBookingsPage';
import { MyProfilePage } from '@/features/portal/MyProfilePage';
import { MyNewBookingPage } from '@/features/portal/MyNewBookingPage';

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/fleet', element: <FleetPage /> },
      { path: '/fleet/:id', element: <PublicVehiclePage /> },
      { path: '/branches', element: <PublicBranchesPage /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/contact', element: <ContactPage /> },
      { path: '/partner', element: <PartnerPage /> },
    ],
  },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/branch/dashboard', element: <BranchDashboard /> },
          { path: '/admin/branches', element: <BranchesPage /> },
          { path: '/vehicles', element: <VehicleListPage /> },
          {
            element: <RequirePermission permission="vehicles.manage" />,
            children: [{ path: '/vehicles/new', element: <VehicleCreatePage /> }],
          },
          { path: '/vehicles/:id', element: <VehicleDetailPage /> },

          { path: '/customers', element: <CustomerListPage /> },
          {
            element: <RequirePermission permission="customers.manage" />,
            children: [{ path: '/customers/new', element: <CustomerCreatePage /> }],
          },

          { path: '/bookings', element: <BookingListPage /> },
          {
            element: <RequirePermission permission="bookings.manage" />,
            children: [{ path: '/bookings/new', element: <BookingCreatePage /> }],
          },
          { path: '/bookings/:id', element: <BookingDetailPage /> },

          { path: '/payments/:id/receipt', element: <PaymentReceiptPage /> },

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
      {
        element: <CustomerLayout />,
        children: [
          { path: '/my', element: <Navigate to="/my/bookings" replace /> },
          { path: '/my/bookings', element: <MyBookingsPage /> },
          { path: '/my/new-booking', element: <MyNewBookingPage /> },
          { path: '/my/profile', element: <MyProfilePage /> },
        ],
      },
    ],
  },
]);






