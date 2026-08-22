import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

const RequireAuth = ({ children, roles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-on-surface-variant">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-body-sm font-body-sm animate-pulse">
            Loading Nyaya-Drishti...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="p-6 bg-surface-container-lowest rounded border border-error/20 text-center">
          <h2 className="text-headline-sm font-headline-sm text-error mb-2">
            Access Denied
          </h2>
          <p className="text-body-sm font-body-sm text-on-surface-variant">
            You do not have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default RequireAuth;
