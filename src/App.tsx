import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';

import Index from './pages/Index';
import Services from './pages/Services';
import Portfolio from './pages/Portfolio';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Custom from './pages/Custom';
import Sale from './pages/Sale';
import About from './pages/About';
import Contact from './pages/Contact';
import AuthCallback from './pages/AuthCallback';
import AuthError from './pages/AuthError';
import AdminLogin from './pages/AdminLogin';
import AdminPortfolio from './pages/AdminPortfolio';
import AdminBanners from './pages/AdminBanners';
import AdminDashboard from './pages/AdminDashboard';
import AdminSiteImages from './pages/AdminSiteImages';
import AdminProducts from './pages/AdminProducts';
import AdminOrders from './pages/AdminOrders';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

// Obscure admin path - not linked from any public page
const ADMIN_BASE = '/sn-studio-mgmt-7k3x9q';

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <BrowserRouter>
              <ScrollToTop />
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/services" element={<Services />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/shop/:id" element={<ProductDetail />} />
                <Route path="/custom" element={<Custom />} />
                <Route path="/sale" element={<Sale />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/auth/error" element={<AuthError />} />

                {/* Admin login (independent page, not linked from public UI) */}
                <Route
                  path={`${ADMIN_BASE}/login`}
                  element={<AdminLogin />}
                />

                {/* Protected admin routes */}
                <Route
                  path={ADMIN_BASE}
                  element={
                    <ProtectedAdminRoute>
                      <AdminDashboard />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path={`${ADMIN_BASE}/portfolio`}
                  element={
                    <ProtectedAdminRoute>
                      <AdminPortfolio />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path={`${ADMIN_BASE}/banners`}
                  element={
                    <ProtectedAdminRoute>
                      <AdminBanners />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path={`${ADMIN_BASE}/site-images`}
                  element={
                    <ProtectedAdminRoute>
                      <AdminSiteImages />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path={`${ADMIN_BASE}/products`}
                  element={
                    <ProtectedAdminRoute>
                      <AdminProducts />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path={`${ADMIN_BASE}/orders`}
                  element={
                    <ProtectedAdminRoute>
                      <AdminOrders />
                    </ProtectedAdminRoute>
                  }
                />

                {/* Legacy /admin/* routes: redirect to home to prevent accidental exposure */}
                <Route path="/admin" element={<Navigate to="/" replace />} />
                <Route
                  path="/admin/*"
                  element={<Navigate to="/" replace />}
                />

                {/* 404 catch-all — must be last */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;