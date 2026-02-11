import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Package, Wrench, Menu, X, Shield } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { cartApi } from '../../api/cart';
import { cn } from '../../lib/utils';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.getCart,
  });

  const cartItemCount = cart?.items?.length ?? 0;

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinkClass = (path: string) =>
    cn(
      'text-sm font-medium transition-colors relative py-1',
      isActive(path)
        ? 'text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full'
        : 'text-muted-foreground hover:text-foreground'
    );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2.5 text-lg font-bold text-foreground transition-colors hover:text-primary"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Wrench className="h-4 w-4" />
              </div>
              <span className="hidden sm:inline">Baykul Auto Parts</span>
              <span className="sm:hidden">Baykul</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className={navLinkClass('/')}>
                Products
              </Link>

              {user && (
                <Link to="/orders" className={navLinkClass('/orders')}>
                  <span className="flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    Orders
                  </span>
                </Link>
              )}

              {user && (user.role === 'ADMIN' || user.role === 'MANAGER') && (
                <Link to="/admin" className={navLinkClass('/admin')}>
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    Admin
                  </span>
                </Link>
              )}
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-2">
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
                    <div className="text-right mr-2">
                      <p className="text-sm font-medium leading-tight">{user.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">{user.role?.toLowerCase()}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="btn-ghost px-3 py-2 text-muted-foreground hover:text-destructive"
                      title="Logout"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="text-sm">Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="btn-ghost px-3 py-2 text-sm">
                      <User className="h-4 w-4" />
                      Login
                    </Link>
                    <Link to="/register" className="btn-primary px-4 py-2 text-sm">
                      Register
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
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive('/') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary'
                )}
              >
                Products
              </Link>

              {user && (
                <Link
                  to="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive('/orders') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary'
                  )}
                >
                  <Package className="w-4 h-4" />
                  Orders
                </Link>
              )}

              {user && (user.role === 'ADMIN' || user.role === 'MANAGER') && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive('/admin') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary'
                  )}
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </Link>
              )}

              <div className="border-t pt-3 mt-3">
                {user ? (
                  <div className="space-y-2">
                    <div className="px-3 py-1">
                      <p className="text-sm font-medium">{user.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">{user.role?.toLowerCase()}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
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
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-center btn-primary w-full"
                    >
                      Register
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
              <span>&copy; {new Date().getFullYear()} Baykul Auto Parts</span>
            </div>
            <nav className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-foreground transition-colors">Products</Link>
              <span className="text-border">|</span>
              <Link to="/cart" className="hover:text-foreground transition-colors">Cart</Link>
              {user && (
                <>
                  <span className="text-border">|</span>
                  <Link to="/orders" className="hover:text-foreground transition-colors">Orders</Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
