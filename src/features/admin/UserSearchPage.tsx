import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { userSearchApi, type UserBasic } from '../../api/user';
import {
  Search,
  Loader2,
  User,
  Mail,
  Phone,
  Shield,
  Filter,
  Users,
  Ban,
  CheckCircle,
} from 'lucide-react';
import { cn } from '../../lib/utils';

type SearchField = 'all' | 'login' | 'email' | 'phoneNumber';

const searchFieldOptions: { value: SearchField; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All Fields', icon: <Search className="w-3.5 h-3.5" /> },
  { value: 'login', label: 'Login', icon: <User className="w-3.5 h-3.5" /> },
  { value: 'email', label: 'Email', icon: <Mail className="w-3.5 h-3.5" /> },
  { value: 'phoneNumber', label: 'Phone', icon: <Phone className="w-3.5 h-3.5" /> },
];

export default function UserSearchPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState<SearchField>('all');
  const [debouncedTerm, setDebouncedTerm] = useState('');

  // Only ADMIN role has users:write permission
  if (!user || user.role !== 'ADMIN') {
    navigate('/');
    return null;
  }

  const getSearchFn = () => {
    if (!debouncedTerm.trim()) return () => Promise.resolve([] as UserBasic[]);
    switch (searchField) {
      case 'login':
        return () => userSearchApi.searchByLogin(debouncedTerm);
      case 'email':
        return () => userSearchApi.searchByEmail(debouncedTerm);
      case 'phoneNumber':
        return () => userSearchApi.searchByPhoneNumber(debouncedTerm);
      default:
        return () => userSearchApi.search(debouncedTerm);
    }
  };

  const { data: users, isLoading, isFetching } = useQuery({
    queryKey: ['users-search', searchField, debouncedTerm],
    queryFn: getSearchFn(),
    enabled: debouncedTerm.trim().length > 0,
  });

  const handleSearch = () => {
    setDebouncedTerm(searchTerm.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const roleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'MANAGER':
        return 'bg-warning/10 text-warning border-warning/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">User Search</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Search users by login, email, or phone number. Results will match partially.
        </p>
      </div>

      {/* Search Controls */}
      <div className="card p-5">
        {/* Field Selector */}
        <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg mb-4">
          {searchFieldOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSearchField(option.value)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all flex-1 justify-center',
                searchField === option.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {option.icon}
              <span className="hidden sm:inline">{option.label}</span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <Search className="w-4 h-4 text-muted-foreground" />
            </div>
            <input
              type="search"
              className="input-base pl-11 pr-4 py-2.5"
              placeholder={
                searchField === 'all'
                  ? 'Search by login, email, or phone...'
                  : `Search by ${searchField === 'phoneNumber' ? 'phone number' : searchField}...`
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <button onClick={handleSearch} className="btn-primary px-6" disabled={!searchTerm.trim()}>
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>
      </div>

      {/* Results */}
      {isLoading || isFetching ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Searching users...</p>
        </div>
      ) : debouncedTerm && users ? (
        <>
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {users.length === 0
                ? 'No users found'
                : `Found ${users.length} user${users.length !== 1 ? 's' : ''}`}
              {' for "'}
              <span className="font-medium text-foreground">{debouncedTerm}</span>"
            </p>
          </div>

          {/* User List */}
          {users.length > 0 ? (
            <div className="space-y-3">
              {users.map((u) => (
                <UserCard key={u.id} user={u} roleColor={roleColor} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">No users found</h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                  Try adjusting your search term or changing the search field.
                </p>
              </div>
            </div>
          )}
        </>
      ) : (
        !debouncedTerm && (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Filter className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">Start Searching</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                Enter a search term and press Enter or click Search to find users.
              </p>
            </div>
          </div>
        )
      )}
    </div>
  );
}

function UserCard({
  user,
  roleColor,
}: {
  user: UserBasic;
  roleColor: (role: string) => string;
}) {
  return (
    <div className="card-hover p-5">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
          <User className="h-6 w-6" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold">
              {user.profile
                ? `${user.profile.name} ${user.profile.surname}`
                : user.login}
            </h3>
            <span className={cn('badge text-[10px]', roleColor(user.role))}>
              {user.role}
            </span>
            {user.blocked ? (
              <span className="badge text-[10px] bg-destructive/10 text-destructive border-destructive/20">
                <Ban className="w-3 h-3 mr-0.5" />
                Blocked
              </span>
            ) : (
              <span className="badge text-[10px] bg-success/10 text-success border-success/20">
                <CheckCircle className="w-3 h-3 mr-0.5" />
                Active
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{user.login}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{user.email || 'No email'}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{user.phoneNumber || 'No phone'}</span>
            </div>
          </div>

          {user.profile?.patronymic && (
            <p className="text-xs text-muted-foreground mt-2">
              Patronymic: {user.profile.patronymic}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
