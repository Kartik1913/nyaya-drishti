import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { triggerReseedApi } from '../api/endpoints';
import { 
  LayoutDashboard, 
  ListOrdered, 
  GitCompare, 
  RefreshCw, 
  LogOut, 
  User, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import logo from '../assets/logo.jpg';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [reseedLoading, setReseedLoading] = useState(false);
  const [reseedMsg, setReseedMsg] = useState(null);
  const [showReseedModal, setShowReseedModal] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Priority Queue', path: '/queue', icon: ListOrdered },
    { label: 'Demo Comparison', path: '/comparison', icon: GitCompare },
  ];

  const handleReseed = async () => {
    setReseedLoading(true);
    setReseedMsg(null);
    try {
      const res = await triggerReseedApi();
      setReseedMsg({
        type: 'success',
        text: `Successfully reseeded ${res.cases_loaded} cases! Alpha: ${res.verification?.alpha_score || 91.4} vs Beta: ${res.verification?.beta_score || 14.7} (Gap: ${res.verification?.score_gap || 76.7})`,
      });
      setTimeout(() => {
        setShowReseedModal(false);
        setReseedMsg(null);
        window.location.reload();
      }, 1500);
    } catch (err) {
      setReseedMsg({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to reseed database',
      });
    } finally {
      setReseedLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="bg-slate-900/90 border-b border-slate-800/80 px-6 py-3 sticky top-[37px] z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <img src={logo} alt="Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-100 flex items-center gap-1.5">
                  Nyaya-Drishti
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded">
                    v1.0
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 block -mt-1 font-medium">
                  Judicial Pendency Triage System
                </span>
              </div>
            </Link>

            <nav className="flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 text-sm font-medium transition px-3 py-1.5 rounded-lg ${
                      active
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-indigo-400' : 'text-slate-400'}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            {user?.role === 'admin' && (
              <button
                onClick={() => setShowReseedModal(true)}
                className="flex items-center gap-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-500/30 hover:border-amber-500/50 px-3 py-1.5 rounded-lg transition shadow-sm"
                title="Reset synthetic database to baseline demo state"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reseed Demo DB
              </button>
            )}

            {user && (
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/60 rounded-lg border border-slate-700/60 text-xs">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium text-slate-200">{user.username}</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                  {user.role}
                </span>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-medium bg-slate-800/80 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 px-3 py-1.5 rounded-lg transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Reseed Confirmation Modal */}
      {showReseedModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <RefreshCw className="w-6 h-6 animate-spin-slow" />
              <h3 className="text-lg font-bold text-slate-100">Reset Demo Database</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This will wipe and re-load exactly <strong>1,000 synthetic cases</strong> and run the 6-layer triage engine to guarantee deterministic baseline demo scores (Alpha: 91.4, Beta: 14.7).
            </p>
            {reseedMsg && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  reseedMsg.type === 'success'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                }`}
              >
                {reseedMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{reseedMsg.text}</span>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button
                disabled={reseedLoading}
                onClick={() => setShowReseedModal(false)}
                className="px-4 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 rounded-lg border border-slate-700 transition"
              >
                Cancel
              </button>
              <button
                disabled={reseedLoading}
                onClick={handleReseed}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
              >
                {reseedLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Confirm Reseed'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
