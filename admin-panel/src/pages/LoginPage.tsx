import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { login } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button, Card, Input } from '../components/ui';
import { getErrorMessage } from '../lib/format';

export default function LoginPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [codeWord, setCodeWord] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await login(email, password, codeWord);
      window.location.href = '/panel/';
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-white">Вход в админку</h1>
        <p className="mt-2 text-sm text-slate-400">
          VK Cloud Conf 2026 — управление контентом и участниками
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
          <Input
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <Input
            label="Кодовое слово"
            type="password"
            value={codeWord}
            onChange={(e) => setCodeWord(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Вход…' : 'Войти'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
