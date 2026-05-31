import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/client';
import Logo from '../../components/Logo';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [devToken, setDevToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      toast.success(data.message);
      if (import.meta.env.DEV && data.devResetToken) setDevToken(data.devResetToken);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
      <div className="card max-w-md w-full p-8">
        <Logo className="justify-center mb-6" />
        <h1 className="font-display text-xl font-bold text-center mb-4">Reset Password</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            className="input-field"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" disabled={loading} className="btn-primary w-full">
            Send Reset Link
          </button>
        </form>
        {devToken && (
          <p className="mt-4 text-xs bg-amber-50 p-3 rounded">
            Dev token: <Link to={`/reset-password/${devToken}`} className="text-brand underline">{devToken.slice(0, 16)}...</Link>
          </p>
        )}
        <Link to="/login" className="block text-center text-brand mt-4 text-sm">
          Back to login
        </Link>
      </div>
    </div>
  );
}
