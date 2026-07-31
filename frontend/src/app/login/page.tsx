'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth_store';
import { fetchApi } from '@/lib/api_client';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isRegistering) {
        // Register flow
        await fetchApi('/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, role: 'STUDENT' }),
        });
      }

      // Login flow (runs after register too, to log them in automatically)
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      
      const data = await fetchApi('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      // Fetch user profile
      localStorage.setItem('token', data.access_token);
      const user = await fetchApi('/auth/me', {
        headers: {
          'Authorization': `Bearer ${data.access_token}`,
        }
      });
      
      setAuth(user, data.access_token);
      
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/chat');
      }
    } catch (err: any) {
      setError(err.message || (isRegistering ? 'Registration failed' : 'Login failed'));
    }
  };

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 200, damping: 20 }}
        className="w-full max-w-md p-10 space-y-6 glass-panel rounded-3xl mx-4 relative z-10 transition-all duration-300"
      >
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight animated-gradient-text pb-1">CampusPilot</h1>
          <p className="mt-3 text-slate-500 font-medium">
            {isRegistering ? 'Create a new account' : 'Sign in to your account'}
          </p>
        </div>
        
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
        
        <form onSubmit={handleSubmit} className="space-y-5 mt-8">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
            <input 
              type="email" 
              required
              className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@university.edu"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
            <input 
              type="password" 
              required
              className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit" 
            className="w-full px-4 py-3 mt-4 text-white font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            {isRegistering ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="text-center pt-4 border-t border-slate-200 mt-6">
          <button 
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors focus:outline-none"
          >
            {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
