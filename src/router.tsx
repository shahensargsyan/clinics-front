import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RequireAuth } from './auth/RequireAuth';
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { DoctorPatientsPage } from './features/patients/DoctorPatientsPage';
import { PatientCreatePage } from './features/patients/PatientCreatePage';
import { PatientEditPage } from './features/patients/PatientEditPage';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />, // everything below requires a token
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/patients', element: <DoctorPatientsPage /> },
      { path: '/patients/new', element: <PatientCreatePage /> },
      { path: '/patients/:id', element: <PatientEditPage /> },
    ],
  },
]);
