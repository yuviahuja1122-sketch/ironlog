import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Dumbbell, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('test@ironlog.app');
  const [password, setPassword] = useState('test1234');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const action = isLogin ? login : register;
    const res = await action(email, password);

    setLoading(false);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.error || 'Authentication failed. Check your credentials.');
    }
  };

  const handleQuickDemo = () => {
    setEmail('test@ironlog.app');
    setPassword('test1234');
    setIsLogin(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-emerald-500/20">
            <Dumbbell className="text-zinc-950 font-black" size={34} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-100 flex items-center gap-2">
            IRONLOG
            <span className="text-xs uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              AI Coach
            </span>
          </h1>
          <p className="text-zinc-400 text-sm mt-1.5 max-w-xs">
            Personal gym progress tracker with soreness-aware AI programming & nutrition intelligence.
          </p>
        </div>

        {/* Auth Box */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-7 shadow-2xl backdrop-blur-md space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-zinc-100">
              {isLogin ? 'Sign In to IronLog' : 'Create New Account'}
            </h2>
            <button
              onClick={handleQuickDemo}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium underline flex items-center gap-1"
            >
              <Sparkles size={13} /> Load Demo
            </button>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@ironlog.app"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              className="w-full h-12 text-sm mt-2"
              loading={loading}
            >
              {isLogin ? 'Sign In & Launch' : 'Create Account'}
              {!loading && <ArrowRight size={16} className="ml-2" />}
            </Button>
          </form>

          <div className="pt-4 border-t border-zinc-800/80 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-xs text-zinc-400 hover:text-emerald-400 font-medium transition-colors"
            >
              {isLogin
                ? "Don't have an account yet? Create one"
                : 'Already have an account? Sign in here'}
            </button>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-500">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Local storage & offline-ready progressive web app</span>
        </div>
      </div>
    </div>
  );
}
