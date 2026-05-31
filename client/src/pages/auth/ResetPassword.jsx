import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/client';
import Logo from '../../components/Logo';

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/reset-password', { token, password });
      toast.success('Password updated!');
      navigate('/login');
    } catch {
      toast.error('Invalid or expired token');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-md w-full p-8">
        <Logo className="justify-center mb-6" />
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            className="input-field"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
          <button type="submit" className="btn-primary w-full">
            Update Password
          </button>
        </form>
        <Link to="/login" className="block text-center text-brand mt-4 text-sm">
          Login
        </Link>
      </div>
    </div>
  );
}
