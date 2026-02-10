import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Package } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b px-6 py-4 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-sm z-10 shadow-sm">
        <Link to="/" className="text-xl font-bold flex items-center gap-2 text-primary">
          Baykul Auto Parts
        </Link>
        <nav className="flex items-center gap-6">
          <Link to="/" className="hover:text-primary font-medium transition-colors">Products</Link>
          
          {user && (
            <Link to="/orders" className="hover:text-primary font-medium flex items-center gap-2 transition-colors">
              <Package className="w-4 h-4" />
              Orders
            </Link>
          )}

          <Link to="/cart" className="relative p-2 hover:bg-muted rounded-full transition-colors group">
            <ShoppingCart className="w-5 h-5 group-hover:text-primary" />
          </Link>

          {user ? (
            <div className="flex items-center gap-4 border-l pl-6 ml-2">
              <div className="text-sm text-right hidden md:block">
                <p className="font-medium">{user.email}</p>
                <p className="text-xs text-muted-foreground">{user.role}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 hover:text-destructive text-sm font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4 border-l pl-6 ml-2">
              <Link to="/login" className="flex items-center gap-2 hover:text-primary font-medium transition-colors">
                <User className="w-5 h-5" />
                <span>Login</span>
              </Link>
              <Link to="/register" className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
                Register
              </Link>
            </div>
          )}
        </nav>
      </header>
      <main className="flex-1 container mx-auto p-6 md:p-8 max-w-7xl">
        <Outlet />
      </main>
      <footer className="border-t p-6 text-center text-sm text-muted-foreground bg-muted/20">
        <p>&copy; {new Date().getFullYear()} Baykul Auto Parts. All rights reserved.</p>
      </footer>
    </div>
  );
}
