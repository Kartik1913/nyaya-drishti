import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const RequireAuth = ({ children, roles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-slate-200">
        <div className="text-lg font-medium animate-pulse">Loading Nyaya-Drishti...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-rose-400">
        <div className="p-6 bg-slate-800 rounded-lg border border-rose-500/30 text-center">
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-sm text-slate-300">You do not have permission to view this view.</p>
        </div>
      </div>
    );
  }

  return children;
};

export default RequireAuth;
