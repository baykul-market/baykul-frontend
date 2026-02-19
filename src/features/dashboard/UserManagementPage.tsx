import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import {
  userAdminApi,
  userSearchApi,
  type UserBasic,
  type UserCreateInput,
  type UserUpdateInput,
} from '../../api/user';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Ban,
  CheckCircle,
  User,
  Mail,
  Phone,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Shield,
  ShieldAlert,
  ShieldCheck,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
  Search,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import PhoneInput, { validatePhone } from '../../components/PhoneInput';

const PAGE_SIZE = 20;

type SearchField = 'all' | 'login' | 'email' | 'phoneNumber';

function roleColor(role: string) {
  switch (role) {
    case 'ADMIN':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'MANAGER':
      return 'bg-warning/10 text-warning border-warning/20';
    default:
      return 'bg-primary/10 text-primary border-primary/20';
  }
}

export default function UserManagementPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserBasic | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserBasic | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState<SearchField>('all');
  const [activeSearch, setActiveSearch] = useState('');

  if (!user || user.role === 'USER') {
    navigate('/products');
    return null;
  }

  const isAdmin = user.role === 'ADMIN';
  const isSearching = activeSearch.trim().length > 0;

  const getSearchFn = () => {
    if (!activeSearch.trim()) return () => Promise.resolve([] as UserBasic[]);
    switch (searchField) {
      case 'login':
        return () => userSearchApi.searchByLogin(activeSearch);
      case 'email':
        return () => userSearchApi.searchByEmail(activeSearch);
      case 'phoneNumber':
        return () => userSearchApi.searchByPhoneNumber(activeSearch);
      default:
        return () => userSearchApi.search(activeSearch);
    }
  };

  const { data: pagedUsers, isLoading: isLoadingPaged } = useQuery({
    queryKey: ['admin-users', page],
    queryFn: () => userAdminApi.getAll(page, PAGE_SIZE),
    enabled: !isSearching,
  });

  const { data: searchResults, isLoading: isLoadingSearch, isFetching: isFetchingSearch } = useQuery({
    queryKey: ['admin-users-search', searchField, activeSearch],
    queryFn: getSearchFn(),
    enabled: isSearching,
  });

  const users = isSearching ? searchResults : pagedUsers;
  const isLoading = isSearching ? (isLoadingSearch || isFetchingSearch) : isLoadingPaged;

  const handleSearch = () => {
    setActiveSearch(searchTerm.trim());
    setPage(0);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setActiveSearch('');
    setPage(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const searchFieldOptions: { value: SearchField; label: string; icon: React.ReactNode }[] = [
    { value: 'all', label: t('dashboard.userManagement.searchAll'), icon: <Search className="w-3.5 h-3.5" /> },
    { value: 'login', label: t('common.login'), icon: <User className="w-3.5 h-3.5" /> },
    { value: 'email', label: t('common.email'), icon: <Mail className="w-3.5 h-3.5" /> },
    { value: 'phoneNumber', label: t('common.phone'), icon: <Phone className="w-3.5 h-3.5" /> },
  ];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userAdminApi.delete(id),
    onSuccess: () => {
      toast.success(t('dashboard.userManagement.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setDeleteUser(null);
    },
    onError: () => toast.error(t('dashboard.userManagement.deleteError')),
  });

  const toggleBlockMutation = useMutation({
    mutationFn: ({ id, blocked }: { id: string; blocked: boolean }) =>
      userAdminApi.update(id, { blocked }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(t('dashboard.userManagement.updateSuccess'));
    },
    onError: () => toast.error(t('dashboard.userManagement.updateError')),
  });

  const roleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <ShieldAlert className="w-3.5 h-3.5" />;
      case 'MANAGER':
        return <ShieldCheck className="w-3.5 h-3.5" />;
      default:
        return <Shield className="w-3.5 h-3.5" />;
    }
  };

  const hasMore = !isSearching && (pagedUsers?.length ?? 0) === PAGE_SIZE;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isAdmin ? t('dashboard.userManagement.title') : t('dashboard.userManagement.titleView')}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            {isAdmin ? t('dashboard.userManagement.subtitle') : t('dashboard.userManagement.subtitleView')}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="btn-primary self-start"
          >
            <Plus className="w-4 h-4" />
            {t('dashboard.userManagement.createUser')}
          </button>
        )}
      </div>

      {/* Search */}
      <div className="card p-5">
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
        <div className="flex gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <Search className="w-4 h-4 text-muted-foreground" />
            </div>
            <input
              type="search"
              className="input-base pl-11 pr-4 py-2.5"
              placeholder={t('dashboard.userManagement.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          {isSearching && (
            <button onClick={handleClearSearch} className="btn-secondary px-4" title={t('common.cancel')}>
              <X className="w-4 h-4" />
            </button>
          )}
          <button onClick={handleSearch} className="btn-primary px-6" disabled={!searchTerm.trim()}>
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">{t('common.search')}</span>
          </button>
        </div>
      </div>

      {/* Search results count */}
      {isSearching && !isLoading && users && (
        <p className="text-sm text-muted-foreground">
          {users.length === 0
            ? t('dashboard.userManagement.noUsersFound')
            : t('dashboard.userManagement.foundUsers', { count: users.length })}
        </p>
      )}

      {/* User List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {t('dashboard.userManagement.loadingUsers')}
          </p>
        </div>
      ) : users && users.length > 0 ? (
        <>
          {/* Desktop Table */}
          <div className="card overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-secondary/30">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t('dashboard.userManagement.user')}
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t('dashboard.userManagement.contact')}
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t('dashboard.userManagement.role')}
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t('dashboard.userManagement.status')}
                    </th>
                    {isAdmin && (
                      <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {t('dashboard.userManagement.actions')}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-secondary/20 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                            <User className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {u.profile
                                ? `${u.profile.name} ${u.profile.surname}`
                                : u.login}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              @{u.login}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate max-w-[180px]">
                              {u.email || t('common.noEmail')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span className="truncate">
                              {u.phoneNumber || t('common.noPhone')}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            'badge text-[10px] gap-1',
                            roleColor(u.role)
                          )}
                        >
                          {roleIcon(u.role)}
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {u.blocked ? (
                          <span className="badge text-[10px] bg-destructive/10 text-destructive border-destructive/20">
                            <Ban className="w-3 h-3 mr-0.5" />
                            {t('dashboard.userManagement.blocked')}
                          </span>
                        ) : (
                          <span className="badge text-[10px] bg-success/10 text-success border-success/20">
                            <CheckCircle className="w-3 h-3 mr-0.5" />
                            {t('dashboard.userManagement.active')}
                          </span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() =>
                                toggleBlockMutation.mutate({
                                  id: u.id,
                                  blocked: !u.blocked,
                                })
                              }
                              className={cn(
                                'p-2 rounded-lg transition-colors',
                                u.blocked
                                  ? 'text-success hover:bg-success/10'
                                  : 'text-warning hover:bg-warning/10'
                              )}
                              title={
                                u.blocked
                                  ? t('dashboard.userManagement.unblock')
                                  : t('dashboard.userManagement.block')
                              }
                            >
                              {u.blocked ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <Ban className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => setEditUser(u)}
                              className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                              title={t('dashboard.userManagement.edit')}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteUser(u)}
                              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              title={t('dashboard.userManagement.delete')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {users.map((u) => (
              <MobileUserCard
                key={u.id}
                user={u}
                roleColor={roleColor}
                roleIcon={roleIcon}
                showActions={isAdmin}
                onEdit={() => setEditUser(u)}
                onDelete={() => setDeleteUser(u)}
                onToggleBlock={() =>
                  toggleBlockMutation.mutate({
                    id: u.id,
                    blocked: !u.blocked,
                  })
                }
                t={t}
              />
            ))}
          </div>

          {/* Pagination (only when not searching) */}
          {!isSearching && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {t('dashboard.userManagement.page', { page: page + 1 })}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="btn-secondary px-3 py-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {t('dashboard.userManagement.prev')}
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!hasMore}
                  className="btn-secondary px-3 py-2"
                >
                  {t('dashboard.userManagement.next')}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-1">
              {isSearching
                ? t('dashboard.userManagement.noUsersFound')
                : t('dashboard.userManagement.noUsers')}
            </h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              {isSearching
                ? t('dashboard.userManagement.noUsersFoundSubtitle')
                : t('dashboard.userManagement.noUsersSubtitle')}
            </p>
          </div>
          {!isSearching && isAdmin && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />
              {t('dashboard.userManagement.createUser')}
            </button>
          )}
        </div>
      )}

      {isAdmin && (
        <>
          {createModalOpen && (
            <UserFormModal
              onClose={() => setCreateModalOpen(false)}
              onSuccess={() => {
                setCreateModalOpen(false);
                queryClient.invalidateQueries({ queryKey: ['admin-users'] });
              }}
              t={t}
            />
          )}
          {editUser && (
            <UserFormModal
              user={editUser}
              onClose={() => setEditUser(null)}
              onSuccess={() => {
                setEditUser(null);
                queryClient.invalidateQueries({ queryKey: ['admin-users'] });
              }}
              t={t}
            />
          )}
          {deleteUser && (
            <DeleteConfirmModal
              user={deleteUser}
              isDeleting={deleteMutation.isPending}
              onConfirm={() => deleteMutation.mutate(deleteUser.id)}
              onCancel={() => setDeleteUser(null)}
              t={t}
            />
          )}
        </>
      )}
    </div>
  );
}

// ─── Mobile User Card ─────────────────────────────────────────────

function MobileUserCard({
  user,
  roleColor,
  roleIcon,
  showActions,
  onEdit,
  onDelete,
  onToggleBlock,
  t,
}: {
  user: UserBasic;
  roleColor: (role: string) => string;
  roleIcon: (role: string) => React.ReactNode;
  showActions: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleBlock: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
          <User className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h3 className="font-semibold text-sm">
              {user.profile
                ? `${user.profile.name} ${user.profile.surname}`
                : user.login}
            </h3>
            <span className={cn('badge text-[10px] gap-1', roleColor(user.role))}>
              {roleIcon(user.role)}
              {user.role}
            </span>
            {user.blocked ? (
              <span className="badge text-[10px] bg-destructive/10 text-destructive border-destructive/20">
                <Ban className="w-3 h-3 mr-0.5" />
                {t('dashboard.userManagement.blocked')}
              </span>
            ) : (
              <span className="badge text-[10px] bg-success/10 text-success border-success/20">
                <CheckCircle className="w-3 h-3 mr-0.5" />
                {t('dashboard.userManagement.active')}
              </span>
            )}
          </div>
          <div className="space-y-1 text-xs text-muted-foreground mb-3">
            <div className="flex items-center gap-1.5">
              <User className="h-3 w-3" />
              <span>@{user.login}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Mail className="h-3 w-3" />
              <span>{user.email || t('common.noEmail')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="h-3 w-3" />
              <span>{user.phoneNumber || t('common.noPhone')}</span>
            </div>
          </div>
          {showActions && (
            <div className="flex gap-2">
              <button
                onClick={onToggleBlock}
                className={cn(
                  'btn-ghost px-3 py-1.5 text-xs',
                  user.blocked ? 'text-success' : 'text-warning'
                )}
              >
                {user.blocked ? (
                  <CheckCircle className="w-3.5 h-3.5" />
                ) : (
                  <Ban className="w-3.5 h-3.5" />
                )}
                {user.blocked
                  ? t('dashboard.userManagement.unblock')
                  : t('dashboard.userManagement.block')}
              </button>
              <button
                onClick={onEdit}
                className="btn-ghost px-3 py-1.5 text-xs text-primary"
              >
                <Pencil className="w-3.5 h-3.5" />
                {t('dashboard.userManagement.edit')}
              </button>
              <button
                onClick={onDelete}
                className="btn-ghost px-3 py-1.5 text-xs text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t('dashboard.userManagement.delete')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── User Create/Edit Modal ───────────────────────────────────────

function UserFormModal({
  user,
  onClose,
  onSuccess,
  t,
}: {
  user?: UserBasic;
  onClose: () => void;
  onSuccess: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const isEdit = !!user;
  const [login, setLogin] = useState(user?.login ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'USER' | 'MANAGER' | 'ADMIN'>(user?.role ?? 'USER');
  const [blocked, setBlocked] = useState(user?.blocked ?? false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: (data: UserCreateInput) => userAdminApi.create(data),
    onSuccess: () => {
      toast.success(t('dashboard.userManagement.createSuccess'));
      onSuccess();
    },
    onError: (error: any) => {
      if (error.response?.status === 409 || error.response?.status === 400) {
        setErrors(error.response.data ?? {});
      }
      toast.error(t('dashboard.userManagement.createError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UserUpdateInput) => userAdminApi.update(user!.id, data),
    onSuccess: () => {
      toast.success(t('dashboard.userManagement.updateSuccess'));
      onSuccess();
    },
    onError: (error: any) => {
      if (error.response?.status === 409 || error.response?.status === 400) {
        setErrors(error.response.data ?? {});
      }
      toast.error(t('dashboard.userManagement.updateError'));
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (phoneNumber) {
      const phoneError = validatePhone(phoneNumber);
      if (phoneError) {
        setErrors({ error_phoneNumber: t(phoneError) });
        return;
      }
    }

    if (isEdit) {
      const data: UserUpdateInput = {};
      if (login !== user.login) data.login = login;
      if (email !== (user.email ?? '')) data.email = email || undefined;
      if (phoneNumber !== (user.phoneNumber ?? ''))
        data.phoneNumber = phoneNumber || undefined;
      if (password) data.password = password;
      if (blocked !== user.blocked) data.blocked = blocked;
      updateMutation.mutate(data);
    } else {
      createMutation.mutate({
        login,
        password,
        email: email || undefined,
        phoneNumber: phoneNumber || undefined,
        role,
        blocked,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg card p-0 animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">
            {isEdit
              ? t('dashboard.userManagement.editUser')
              : t('dashboard.userManagement.createUser')}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
            title={t('common.cancel')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Login */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {t('dashboard.userManagement.loginLabel')} *
            </label>
            <input
              type="text"
              className={cn('input-base', errors.error_login && 'border-destructive')}
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder={t('dashboard.userManagement.loginPlaceholder')}
              required
              minLength={3}
              maxLength={50}
            />
            {errors.error_login && (
              <p className="text-xs text-destructive mt-1">{errors.error_login}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {t('dashboard.userManagement.emailLabel')}
            </label>
            <input
              type="email"
              className={cn('input-base', errors.error_email && 'border-destructive')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('dashboard.userManagement.emailPlaceholder')}
            />
            {errors.error_email && (
              <p className="text-xs text-destructive mt-1">{errors.error_email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {t('dashboard.userManagement.phoneLabel')}
            </label>
            <PhoneInput
              value={phoneNumber}
              onChange={setPhoneNumber}
              hasError={!!errors.error_phoneNumber}
            />
            {errors.error_phoneNumber && (
              <p className="text-xs text-destructive mt-1">
                {errors.error_phoneNumber}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {isEdit
                ? t('dashboard.userManagement.newPasswordLabel')
                : t('dashboard.userManagement.passwordLabel')}{' '}
              {!isEdit && '*'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className={cn(
                  'input-base pr-10',
                  errors.error_password && 'border-destructive'
                )}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  isEdit
                    ? t('dashboard.userManagement.passwordPlaceholderEdit')
                    : t('dashboard.userManagement.passwordPlaceholderCreate')
                }
                required={!isEdit}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.error_password && (
              <p className="text-xs text-destructive mt-1">{errors.error_password}</p>
            )}
          </div>

          {/* Role (only on create) */}
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t('dashboard.userManagement.roleLabel')}
              </label>
              <div className="flex gap-2">
                {(['USER', 'MANAGER', 'ADMIN'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all',
                      role === r
                        ? roleColor(r) + ' ring-1 ring-current/20'
                        : 'border-input text-muted-foreground hover:text-foreground hover:bg-secondary'
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Blocked Toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">
                {t('dashboard.userManagement.blockedLabel')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.userManagement.blockedHint')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setBlocked(!blocked)}
              title={t('dashboard.userManagement.blockedLabel')}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                blocked ? 'bg-destructive' : 'bg-input'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out',
                  blocked ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={isPending}
            >
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit
                ? t('dashboard.userManagement.saveChanges')
                : t('dashboard.userManagement.createUser')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirmation Modal ────────────────────────────────────

function DeleteConfirmModal({
  user,
  isDeleting,
  onConfirm,
  onCancel,
  t,
}: {
  user: UserBasic;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm card p-6 animate-slide-up text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mx-auto mb-4">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          {t('dashboard.userManagement.deleteConfirmTitle')}
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          {t('dashboard.userManagement.deleteConfirmMessage', {
            name: user.login,
          })}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="btn-secondary flex-1"
            disabled={isDeleting}
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="btn-primary flex-1 bg-destructive hover:bg-destructive/90"
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
            {t('dashboard.userManagement.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
