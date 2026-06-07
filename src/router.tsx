import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RequireAuth } from './auth/RequireAuth';
import { LoginPage } from './features/auth/LoginPage';
import { PatientsListPage } from './features/patients/PatientsListPage';
import { PatientCreatePage } from './features/patients/PatientCreatePage';
import { PatientEditPage } from './features/patients/PatientEditPage';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/patients" replace /> },
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />, // everything below requires a token
    children: [
      { path: '/patients', element: <PatientsListPage /> },
      { path: '/patients/new', element: <PatientCreatePage /> },
      { path: '/patients/:id', element: <PatientEditPage /> },
    ],
  },
]);
