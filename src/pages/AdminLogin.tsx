import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, LogIn, Lock, AlertCircle } from 'lucide-react';

/**
 * Independent admin login page (hidden, not linked from frontend).
 * Accessible only via direct URL: /sn-studio-mgmt-7k3x9q/login
 */
const AdminLogin: React.FC = () => {
  const { user, loading, isAdmin, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [signingIn, setSigningIn] = useState(false);

  // If already logged in as admin, redirect to dashboard
  useEffect(() => {
    if (!loading && user && isAdmin) {
      const from =
        (location.state as { from?: string })?.from ||
        '/sn-studio-mgmt-7k3x9q';
      navigate(from, { replace: true });
    }
  }, [loading, user, isAdmin, navigate, location.state]);

  const handleLogin = async () => {
    setSigningIn(true);
    try {
      await login();
    } catch (err) {
      setSigningIn(false);
      console.error('Login error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-slate-300">驗證中...</p>
        </div>
      </div>
    );
  }

  const isLoggedInNonAdmin = user && !isAdmin;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-800/60 backdrop-blur-sm shadow-2xl">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-amber-400" />
          </div>
          <CardTitle className="text-2xl text-white font-semibold tracking-wide">
            管理後台登入
          </CardTitle>
          <p className="text-sm text-slate-400">
            Staff Only · Restricted Access
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {isLoggedInNonAdmin && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-red-950/50 border border-red-900 text-sm text-red-200">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium mb-1">權限不足</div>
                <div className="text-xs text-red-300/80">
                  目前帳號 {user?.email} 無管理權限，請使用管理員帳號登入。
                </div>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 p-3 rounded-md bg-slate-900/60 border border-slate-700 text-xs text-slate-400">
            <Lock className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-slate-500" />
            <div>
              此頁面僅限授權管理員使用。所有存取行為將被記錄。
              未經授權請立即離開。
            </div>
          </div>

          <Button
            onClick={handleLogin}
            disabled={signingIn}
            className="w-full bg-amber-500 hover:bg-amber-600 !text-slate-900 font-medium"
          >
            <LogIn className="h-4 w-4 mr-2" />
            {signingIn ? '導向驗證中...' : '使用管理員帳號登入'}
          </Button>

          <div className="text-center">
            <button
              onClick={() => navigate('/')}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              返回一般網站首頁
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;