import React, { useState } from 'react';
import { Shield, Warehouse, User, Mail, Lock, LogIn, ArrowRight, Sparkles } from 'lucide-react';
import { UserSession } from '../types';

interface LoginRegisterProps {
  onLoginSuccess: (session: UserSession) => void;
}

export default function LoginRegister({ onLoginSuccess }: LoginRegisterProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [warehouseName, setWarehouseName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const url = isRegistering ? '/api/auth/register' : '/api/auth/login';
    const body = isRegistering
      ? { email, password, warehouseName, managerName }
      : { email, password };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify your credentials.');
      }

      // Save token (userId) and session into LocalStorage
      localStorage.setItem('inventory_session_token', data.userId);
      onLoginSuccess(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected authentication error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Logo Icon */}
        <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-xl shadow-sm text-white mb-4">
          <Warehouse className="h-10 w-10" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-display">
          Lumina <span className="text-blue-600 underline underline-offset-4 decoration-2">Predict</span>
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Corporate Intelligence & Smart Demand Forecasting
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-2xl sm:px-10">
          <div className="flex justify-center space-x-4 mb-6 border-b border-slate-200 pb-4">
            <button
              onClick={() => {
                setIsRegistering(false);
                setError('');
              }}
              className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors duration-150 ${
                !isRegistering
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsRegistering(true);
                setError('');
              }}
              className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors duration-150 ${
                isRegistering
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded-r-md">
              <span className="font-semibold">Error:</span> {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {isRegistering && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Warehouse Hub Name
                  </label>
                  <div className="mt-1 relative rounded-md shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Warehouse className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Seattle East Fulfillment Center"
                      value={warehouseName}
                      onChange={(e) => setWarehouseName(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Logistics Manager Name
                  </label>
                  <div className="mt-1 relative rounded-md shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Sarah Chen"
                      value={managerName}
                      onChange={(e) => setManagerName(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                Professional Email Address
              </label>
              <div className="mt-1 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all duration-150"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  {isRegistering ? 'Register Hub Workspace' : 'Sign In to Dashboard'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-5 text-center">
            <div className="inline-flex items-center space-x-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
              <Shield className="h-3 w-3 text-blue-600" />
              <span>Secure, encrypted enterprise-grade system access</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
