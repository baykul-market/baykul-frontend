import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Package, Wrench, Menu, X, Shield, Globe } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cartApi } from '../../api/cart';
import { authApi } from '../../api/auth';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';

export default function Layout() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.getCart,
    enabled: !!user,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404) return false;
      return failureCount < 3;
    },
  });

  const cartItemCount = cart?.cartProducts?.length ?? 0;

  const queryClient = useQueryClient();

  const { refreshToken } = useAuthStore();

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // Still clear local state even if the API call fails
    }
    logout();
    queryClient.clear();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ru' ? 'en' : 'ru';
    i18n.changeLanguage(newLang);
  };

  const isActive = (path: string) => location.pathname === path || (path === '/products' && location.pathname === '/');

  const navLinkClass = (path: string) =>
    cn(
      'text-sm font-medium transition-colors relative py-1',
      isActive(path)
        ? 'text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full'
        : 'text-muted-foreground hover:text-foreground'
    );

  /** Display name: profile name or login */
  const displayName = user?.profile
    ? `${user.profile.name} ${user.profile.surname}`
    : user?.login ?? '';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link
              to="/products"
              className="flex items-center gap-2.5 text-lg font-bold text-foreground transition-colors hover:text-primary"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Wrench className="h-4 w-4" />
              </div>
              <span className="hidden sm:inline">{t('nav.brandFull')}</span>
              <span className="sm:hidden">{t('nav.brandShort')}</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/products" className={navLinkClass('/products')}>
                {t('nav.products')}
              </Link>

              {user && (
                <Link to="/orders" className={navLinkClass('/orders')}>
                  <span className="flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    {t('nav.orders')}
                  </span>
                </Link>
              )}

              {user && user.role !== 'USER' && (
                <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    {t('nav.dashboard')}
                  </span>
                </Link>
              )}
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                title={i18n.language === 'ru' ? 'Switch to English' : 'Переключить на русский'}
              >
                <Globe className="h-4 w-4" />
                <span className="uppercase">{i18n.language === 'ru' ? 'EN' : 'RU'}</span>
              </button>

              {/* Cart Button */}
              <Link
                to="/cart"
                className={cn(
                  'relative inline-flex items-center justify-center rounded-lg p-2 transition-colors',
                  isActive('/cart') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {cartItemCount > 9 ? '9+' : cartItemCount}
                  </span>
                )}
              </Link>

              {/* Desktop Auth Section */}
              <div className="hidden md:flex items-center gap-2 ml-2 pl-4 border-l">
                {user ? (
                  <>
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-secondary"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium leading-tight">{displayName}</p>
                        <p className="text-xs text-muted-foreground capitalize">{user.role?.toLowerCase()}</p>
                      </div>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="btn-ghost px-3 py-2 text-muted-foreground hover:text-destructive"
                      title={t('nav.logout')}
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="btn-ghost px-3 py-2 text-sm">
                      <User className="h-4 w-4" />
                      {t('nav.login')}
                    </Link>
                    <Link to="/register" className="btn-primary px-4 py-2 text-sm">
                      {t('nav.register')}
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background animate-fade-in">
            <div className="container mx-auto max-w-7xl px-4 py-4 space-y-1">
              <Link
                to="/products"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive('/products') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary'
                )}
              >
                {t('nav.products')}
              </Link>

              {user && (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive('/profile') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary'
                    )}
                  >
                    <User className="w-4 h-4" />
                    {t('nav.myProfile')}
                  </Link>

                  <Link
                    to="/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive('/orders') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary'
                    )}
                  >
                    <Package className="w-4 h-4" />
                    {t('nav.orders')}
                  </Link>
                </>
              )}

              {user && user.role !== 'USER' && (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive('/dashboard') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary'
                  )}
                >
                  <Shield className="w-4 h-4" />
                  {t('nav.dashboard')}
                </Link>
              )}

              {/* Mobile Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors w-full"
              >
                <Globe className="w-4 h-4" />
                {i18n.language === 'ru' ? t('language.en') : t('language.ru')}
              </button>

              <div className="border-t pt-3 mt-3">
                {user ? (
                  <div className="space-y-2">
                    <div className="px-3 py-1">
                      <p className="text-sm font-medium">{displayName}</p>
                      <p className="text-xs text-muted-foreground capitalize">{user.role?.toLowerCase()}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      {t('nav.logout')}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
                    >
                      <User className="h-4 w-4" />
                      {t('nav.login')}
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-center btn-primary w-full"
                    >
                      {t('nav.register')}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-secondary/30">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary">
                <Wrench className="h-3 w-3" />
              </div>
              <span>{t('nav.copyright', { year: new Date().getFullYear() })}</span>
            </div>
            <nav className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link to="/products" className="hover:text-foreground transition-colors">{t('nav.products')}</Link>
              <span className="text-border">|</span>
              <Link to="/cart" className="hover:text-foreground transition-colors">{t('common.cart')}</Link>
              {user && (
                <>
                  <span className="text-border">|</span>
                  <Link to="/orders" className="hover:text-foreground transition-colors">{t('nav.orders')}</Link>
                  <span className="text-border">|</span>
                  <Link to="/profile" className="hover:text-foreground transition-colors">{t('common.profile')}</Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
