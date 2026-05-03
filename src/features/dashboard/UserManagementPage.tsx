import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import {
  userAdminApi,
  userSearchApi,
  balanceAdminApi,
  type UserBasic,
  type UserCreateInput,
  type UserUpdateInput,
  type BalanceOperationDto,
} from '../../api/user';
import { configApi, type DeliveryCostConfigDto } from '../../api/config';
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
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  RussianRuble,
  History,
  ChevronDown,
  ChevronUp,
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
  const [balanceUser, setBalanceUser] = useState<UserBasic | null>(null);

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
    mutationFn: (id: string) => userAdminApi.delete(id, { customErrorToast: t('dashboard.userManagement.deleteError') }),
    onSuccess: () => {
      toast.success(t('dashboard.userManagement.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setDeleteUser(null);
    },
  });

  const toggleBlockMutation = useMutation({
    mutationFn: ({ id, blocked }: { id: string; blocked: boolean }) =>
      userAdminApi.update(id, { blocked }, { customErrorToast: t('dashboard.userManagement.updateError') }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(t('dashboard.userManagement.updateSuccess'));
    },
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
                    <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t('dashboard.userManagement.actions')}
                    </th>
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
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setBalanceUser(u)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            title={t('dashboard.userManagement.balance')}
                          >
                            <Wallet className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <>
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
                            </>
                          )}
                        </div>
                      </td>
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
                showAdminActions={isAdmin}
                onEdit={() => setEditUser(u)}
                onDelete={() => setDeleteUser(u)}
                onToggleBlock={() =>
                  toggleBlockMutation.mutate({
                    id: u.id,
                    blocked: !u.blocked,
                  })
                }
                onBalance={() => setBalanceUser(u)}
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

      {balanceUser && (
        <BalanceModal
          user={balanceUser}
          onClose={() => setBalanceUser(null)}
          t={t}
        />
      )}
    </div>
  );
}

// ─── Mobile User Card ─────────────────────────────────────────────

function MobileUserCard({
  user,
  roleColor,
  roleIcon,
  showAdminActions,
  onEdit,
  onDelete,
  onToggleBlock,
  onBalance,
  t,
}: {
  user: UserBasic;
  roleColor: (role: string) => string;
  roleIcon: (role: string) => React.ReactNode;
  showAdminActions: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleBlock: () => void;
  onBalance: () => void;
  t: (key: string, opts?: any) => string;
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
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={onBalance}
              className="btn-ghost px-3 py-1.5 text-xs text-primary"
            >
              <Wallet className="w-3.5 h-3.5" />
              {t('dashboard.userManagement.balance')}
            </button>
            {showAdminActions && (
              <>
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
              </>
            )}
          </div>
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
  t: (key: string, opts?: any) => string;
}) {
  const isEdit = !!user;
  const [login, setLogin] = useState(user?.login ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'USER' | 'MANAGER' | 'ADMIN'>(user?.role ?? 'USER');
  const [blocked, setBlocked] = useState(user?.blocked ?? false);
  const [canPayLater, setCanPayLater] = useState(user?.canPayLater ?? false);
  const [markupPercentage, setMarkupPercentage] = useState(user?.markupPercentage != null ? String(user.markupPercentage * 100) : '');
  const [name, setName] = useState(user?.profile?.name ?? '');
  const [surname, setSurname] = useState(user?.profile?.surname ?? '');
  const [patronymic, setPatronymic] = useState(user?.profile?.patronymic ?? '');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: config } = useQuery({
    queryKey: ['price-config'],
    queryFn: () => configApi.getConfig(),
  });

  const createMutation = useMutation({
    mutationFn: (data: UserCreateInput) => userAdminApi.create(data, { customErrorToast: t('dashboard.userManagement.createError') }),
    onSuccess: () => {
      toast.success(t('dashboard.userManagement.createSuccess'));
      onSuccess();
    },
    onError: (error: any) => {
      if (error.response?.status === 409 || error.response?.status === 400) {
        setErrors(error.response.data ?? {});
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UserUpdateInput) => userAdminApi.update(user!.id, data, { customErrorToast: t('dashboard.userManagement.updateError') }),
    onSuccess: () => {
      toast.success(t('dashboard.userManagement.updateSuccess'));
      onSuccess();
    },
    onError: (error: any) => {
      if (error.response?.status === 409 || error.response?.status === 400) {
        setErrors(error.response.data ?? {});
      }
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

    const profileData = {
      name: name || undefined,
      surname: surname || undefined,
      patronymic: patronymic || null,
    };

    if (isEdit) {
      const data: UserUpdateInput = {};
      if (login !== user.login) data.login = login;
      if (email !== (user.email ?? '')) data.email = email || undefined;
      if (phoneNumber !== (user.phoneNumber ?? ''))
        data.phoneNumber = phoneNumber || undefined;
      if (blocked !== user.blocked) data.blocked = blocked;
      if (canPayLater !== (user.canPayLater ?? false)) data.canPayLater = canPayLater;
      const numMarkup = markupPercentage === '' ? null : parseFloat(markupPercentage) / 100;
      if (numMarkup !== (user.markupPercentage ?? null)) data.markupPercentage = numMarkup;

      if (
        name !== (user.profile?.name ?? '') ||
        surname !== (user.profile?.surname ?? '') ||
        patronymic !== (user.profile?.patronymic ?? '')
      ) {
        data.profile = profileData;
      }

      updateMutation.mutate(data);
    } else {
      createMutation.mutate({
        login,
        password,
        email: email || undefined,
        phoneNumber: phoneNumber || undefined,
        role,
        blocked,
        canPayLater,
        markupPercentage: markupPercentage === '' ? null : parseFloat(markupPercentage) / 100,
        profile: profileData,
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
          {/* Profile */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t('dashboard.userManagement.surnameLabel')}
              </label>
              <input
                type="text"
                className="input-base"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                placeholder={t('dashboard.userManagement.surnamePlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t('dashboard.userManagement.nameLabel')}
              </label>
              <input
                type="text"
                className="input-base"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('dashboard.userManagement.namePlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t('dashboard.userManagement.patronymicLabel')}
              </label>
              <input
                type="text"
                className="input-base"
                value={patronymic}
                onChange={(e) => setPatronymic(e.target.value)}
                placeholder={t('dashboard.userManagement.patronymicPlaceholder')}
              />
            </div>
          </div>

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

          {/* Password - Only for Create */}
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t('dashboard.userManagement.passwordLabel')} *
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
                  placeholder={t('dashboard.userManagement.passwordPlaceholderCreate')}
                  required
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
          )}

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

          {/* Can Pay Later Toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">
                {t('dashboard.userManagement.canPayLaterLabel')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.userManagement.canPayLaterHint')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCanPayLater(!canPayLater)}
              title={t('dashboard.userManagement.canPayLaterLabel')}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                canPayLater ? 'bg-primary' : 'bg-input'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out',
                  canPayLater ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>

          {/* Markup Percentage */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {t('dashboard.userManagement.markupPercentageLabel')}
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input-base"
              value={markupPercentage}
              onChange={(e) => setMarkupPercentage(e.target.value)}
              placeholder={config ? `${t('common.inherited', 'Inherited')}: ${config.markupPercentage * 100}%` : 'e.g. 10'}
            />
            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wide">
              {t('dashboard.userManagement.markupPercentageHint', 'Leave empty to use global configuration')}
            </p>
          </div>

          {/* Individual Tariffs */}
          {isEdit && user && (
            <div className="pt-4 border-t mt-4">
              <h3 className="text-sm font-semibold mb-3">{t('dashboard.userManagement.individualTariffs', 'Individual Delivery Tariffs')}</h3>
              <UserDeliveryTariffs userId={user.id} t={t} />
            </div>
          )}

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

// ─── Balance Modal ────────────────────────────────────────────────

function BalanceModal({
  user,
  onClose,
  t,
}: {
  user: UserBasic;
  onClose: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const queryClient = useQueryClient();
  const [historyOpen, setHistoryOpen] = useState(true);
  const [showOperationForm, setShowOperationForm] = useState(false);
  const [operationType, setOperationType] = useState<'REPLENISHMENT' | 'WITHDRAWAL'>('REPLENISHMENT');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const { data: balance, isLoading } = useQuery({
    queryKey: ['admin-balance', user.id],
    queryFn: () => balanceAdminApi.getByUserId(user.id),
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404) return false;
      return failureCount < 3;
    },
  });

  const operationMutation = useMutation({
    mutationFn: (data: BalanceOperationDto) => balanceAdminApi.operation(data, { customErrorToast: t('dashboard.balance.operationError') }),
    onSuccess: () => {
      toast.success(t('dashboard.balance.operationSuccess'));
      queryClient.invalidateQueries({ queryKey: ['admin-balance', user.id] });
      setShowOperationForm(false);
      setAmount('');
      setDescription('');
    },
  });

  const handleSubmitOperation = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const data: BalanceOperationDto = {
      amount: numAmount,
      currency: 'RUB',
      operationType,
      description: description.trim() || undefined,
    };

    if (balance?.id) {
      data.balanceId = balance.id;
    } else {
      data.userId = user.id;
    }

    operationMutation.mutate(data);
  };

  const displayName = user.profile
    ? `${user.profile.name} ${user.profile.surname}`
    : user.login;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl card p-0 animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <Wallet className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold truncate">{displayName}</h2>
              <p className="text-xs text-muted-foreground">@{user.login}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary transition-colors shrink-0"
            title={t('common.cancel')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance Content */}
        <div className="p-6 space-y-5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{t('dashboard.balance.loadingBalance')}</p>
            </div>
          ) : balance ? (
            <>
              {/* Balance Summary */}
              <div className="flex items-center justify-between gap-4">
                <div className="rounded-xl bg-secondary/50 p-4 flex-1">
                  <p className="text-xs text-muted-foreground mb-1">{t('dashboard.balance.currentBalance')}</p>
                  <p className={cn(
                    'text-2xl font-bold',
                    balance.account >= 0 ? 'text-success' : 'text-destructive'
                  )}>
                    {balance.account.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => setShowOperationForm(!showOperationForm)}
                  className={cn(
                    'btn-primary shrink-0',
                    showOperationForm && 'bg-secondary text-foreground hover:bg-secondary/80'
                  )}
                >
                  <RussianRuble className="w-4 h-4" />
                  {showOperationForm ? t('common.cancel') : t('dashboard.balance.performOperation')}
                </button>
              </div>

              {/* Operation Form (inline, toggleable) */}
              {showOperationForm && (
                <form onSubmit={handleSubmitOperation} className="card p-4 space-y-4 border-2 border-primary/20">
                  {/* Operation Type Toggle */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setOperationType('REPLENISHMENT')}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border transition-all',
                        operationType === 'REPLENISHMENT'
                          ? 'bg-success/10 text-success border-success/30 ring-1 ring-success/20'
                          : 'border-input text-muted-foreground hover:text-foreground hover:bg-secondary'
                      )}
                    >
                      <ArrowUpCircle className="w-4 h-4" />
                      {t('dashboard.balance.replenishment')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOperationType('WITHDRAWAL')}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border transition-all',
                        operationType === 'WITHDRAWAL'
                          ? 'bg-destructive/10 text-destructive border-destructive/30 ring-1 ring-destructive/20'
                          : 'border-input text-muted-foreground hover:text-foreground hover:bg-secondary'
                      )}
                    >
                      <ArrowDownCircle className="w-4 h-4" />
                      {t('dashboard.balance.withdrawal')}
                    </button>
                  </div>

                  {/* Amount + Description */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">{t('dashboard.balance.amountLabel')} *</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <RussianRuble className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          className="input-base pl-8 py-2 text-sm"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">{t('dashboard.balance.descriptionLabel')}</label>
                      <input
                        type="text"
                        className="input-base py-2 text-sm"
                        placeholder={t('dashboard.balance.descriptionPlaceholder')}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        maxLength={255}
                      />
                    </div>
                  </div>

                  {/* Preview + Submit */}
                  <div className="flex items-center justify-between gap-3">
                    {amount && parseFloat(amount) > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {balance.account.toFixed(2)}{' '}
                        <span className={operationType === 'REPLENISHMENT' ? 'text-success' : 'text-destructive'}>
                          {operationType === 'REPLENISHMENT' ? '+' : '-'}{parseFloat(amount).toFixed(2)}
                        </span>{' '}
                        = <span className="font-semibold text-foreground">
                          {operationType === 'REPLENISHMENT'
                            ? (balance.account + parseFloat(amount)).toFixed(2)
                            : (balance.account - parseFloat(amount)).toFixed(2)
                          }
                        </span>
                      </p>
                    )}
                    <button
                      type="submit"
                      className={cn(
                        'ml-auto shrink-0',
                        operationType === 'REPLENISHMENT'
                          ? 'btn-primary bg-success hover:bg-success/90'
                          : 'btn-primary bg-destructive hover:bg-destructive/90'
                      )}
                      disabled={operationMutation.isPending || !amount || parseFloat(amount) <= 0}
                    >
                      {operationMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      {t('dashboard.balance.confirm')}
                    </button>
                  </div>
                </form>
              )}

              {/* Transaction History */}
              {balance.balanceHistoryList && balance.balanceHistoryList.length > 0 && (
                <div className="rounded-xl border overflow-hidden">
                  <button
                    onClick={() => setHistoryOpen(!historyOpen)}
                    className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-secondary/20 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{t('dashboard.balance.transactionHistory')}</span>
                      <span className="text-xs text-muted-foreground">({balance.balanceHistoryList.length})</span>
                    </div>
                    {historyOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>

                  {historyOpen && (
                    <div className="border-t divide-y max-h-60 overflow-y-auto">
                      {balance.balanceHistoryList.map((entry) => {
                        const isPositive = entry.operationType === 'REPLENISHMENT';
                        return (
                          <div key={entry.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={cn(
                                'flex h-7 w-7 items-center justify-center rounded-lg shrink-0',
                                isPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                              )}>
                                {isPositive ? <ArrowUpCircle className="h-3.5 w-3.5" /> : <ArrowDownCircle className="h-3.5 w-3.5" />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium">{t(`dashboard.balance.opType.${entry.operationType}`)}</p>
                                {entry.description && <p className="text-[11px] text-muted-foreground truncate">{entry.description}</p>}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className={cn('text-xs font-semibold', isPositive ? 'text-success' : 'text-destructive')}>
                                {isPositive ? '+' : '-'}{entry.amount.toFixed(2)}
                              </p>
                              <p className="text-[11px] text-muted-foreground">{t('dashboard.balance.balanceAfter', { amount: entry.resultAccount.toFixed(2) })}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <Wallet className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-4">{t('dashboard.balance.noBalance')}</p>
              <button
                onClick={() => setShowOperationForm(!showOperationForm)}
                className="btn-primary"
              >
                <RussianRuble className="w-4 h-4" />
                {t('dashboard.balance.performOperation')}
              </button>
              {showOperationForm && (
                <form onSubmit={handleSubmitOperation} className="mt-4 card p-4 space-y-4 border-2 border-primary/20 text-left">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setOperationType('REPLENISHMENT')}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border transition-all',
                        operationType === 'REPLENISHMENT'
                          ? 'bg-success/10 text-success border-success/30 ring-1 ring-success/20'
                          : 'border-input text-muted-foreground hover:text-foreground hover:bg-secondary'
                      )}
                    >
                      <ArrowUpCircle className="w-4 h-4" />
                      {t('dashboard.balance.replenishment')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOperationType('WITHDRAWAL')}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border transition-all',
                        operationType === 'WITHDRAWAL'
                          ? 'bg-destructive/10 text-destructive border-destructive/30 ring-1 ring-destructive/20'
                          : 'border-input text-muted-foreground hover:text-foreground hover:bg-secondary'
                      )}
                    >
                      <ArrowDownCircle className="w-4 h-4" />
                      {t('dashboard.balance.withdrawal')}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">{t('dashboard.balance.amountLabel')} *</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <RussianRuble className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          className="input-base pl-8 py-2 text-sm"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">{t('dashboard.balance.descriptionLabel')}</label>
                      <input
                        type="text"
                        className="input-base py-2 text-sm"
                        placeholder={t('dashboard.balance.descriptionPlaceholder')}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        maxLength={255}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className={cn(
                      'w-full',
                      operationType === 'REPLENISHMENT'
                        ? 'btn-primary bg-success hover:bg-success/90'
                        : 'btn-primary bg-destructive hover:bg-destructive/90'
                    )}
                    disabled={operationMutation.isPending || !amount || parseFloat(amount) <= 0}
                  >
                    {operationMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {t('dashboard.balance.confirm')}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── User Delivery Tariffs Component ──────────────────────────────

function UserDeliveryTariffs({ userId, t }: { userId: string; t: (key: string, opts?: any) => string }) {
  const [rules, setRules] = useState<DeliveryCostConfigDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<DeliveryCostConfigDto | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [minSum, setMinSum] = useState('0');
  const [markupType, setMarkupType] = useState<'PERCENTAGE' | 'SUM'>('PERCENTAGE');
  const [value, setValue] = useState('0');
  const [isSaving, setIsSaving] = useState(false);

  const fetchRules = async () => {
    try {
      setIsLoading(true);
      const data = await configApi.getDeliveryRulesByUser(userId);
      setRules(data);
    } catch (e) {
      toast.error(t('pricing.errors.fetchFailed', 'Failed to fetch rules'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [userId]);

  const handleOpenForm = (rule?: DeliveryCostConfigDto) => {
    if (rule) {
      setEditingRule(rule);
      setMinSum(rule.minimumSum.toString());
      setMarkupType(rule.markupType);
      setValue(rule.markupType === 'PERCENTAGE' ? (rule.value * 100).toString() : rule.value.toString());
    } else {
      setEditingRule(null);
      setMinSum('0');
      setMarkupType('PERCENTAGE');
      setValue('0');
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingRule(null);
  };

  const handleSave = async () => {
    try {
      const minNum = Number(minSum);
      const valNum = Number(value);

      if (minNum < 0) {
        toast.error(t('pricing.errors.minSumNegative', 'Minimum sum must be 0 or greater.'));
        return;
      }
      if (valNum < 0) {
        toast.error(t('pricing.errors.valueNegative', 'Value must be 0 or greater.'));
        return;
      }

      if (rules.some(r => r.minimumSum === minNum && r.id !== editingRule?.id)) {
        toast.error(t('pricing.errors.duplicateMinSum', 'A rule with this minimum sum already exists.'));
        return;
      }

      setIsSaving(true);
      const payload: DeliveryCostConfigDto = {
        minimumSum: minNum,
        markupType,
        value: markupType === 'PERCENTAGE' ? valNum / 100 : valNum,
        userId
      };

      if (editingRule?.id) {
        payload.id = editingRule.id;
        await configApi.updateDeliveryRule(payload);
        toast.success(t('pricing.success.ruleUpdated', 'Rule updated successfully'));
      } else {
        await configApi.saveDeliveryRule(payload);
        toast.success(t('pricing.success.ruleSaved', 'Rule saved successfully'));
      }
      handleCloseForm();
      fetchRules();
    } catch (e) {
      // Error is caught by global toast typically
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('pricing.confirm.deleteRuleMessage', 'Are you sure you want to delete this delivery rule?'))) return;
    try {
      await configApi.deleteDeliveryRule(id);
      toast.success(t('pricing.success.ruleDeleted', 'Rule deleted'));
      fetchRules();
    } catch (e) {
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-primary/10 p-3 rounded-lg flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-primary/90 leading-tight">
          {t('dashboard.userManagement.fallbackAlert', 'If a threshold is not covered by a personal rule, the system will fall back to Global Delivery Rules. If no rules match at all, delivery is free.')}
        </p>
      </div>

      <div className="flex justify-between items-center">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase">{t('dashboard.userManagement.personalRules', 'Personal Rules')}</h4>
        <button type="button" onClick={() => handleOpenForm()} className="btn-secondary text-xs px-2 py-1 h-auto">
          <Plus className="w-3 h-3 mr-1" />
          {t('common.add', 'Add')}
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : rules.length === 0 ? (
        <p className="text-xs text-muted-foreground italic bg-secondary/10 p-3 rounded-lg border border-dashed">
          {t('dashboard.userManagement.noPersonalRules', 'No personal overrides. This user is currently using the Global Delivery Rules.')}
        </p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {rules.map(rule => (
            <div key={rule.id} className="flex items-center justify-between p-2.5 bg-background border rounded-lg group">
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {rule.markupType === 'PERCENTAGE' ? `${rule.value * 100}%` : `${rule.value} (${t('pricing.global.fixed', 'Fixed')})`}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide mt-0.5">
                  {t('pricing.global.minSum', 'Min Cost')}: {rule.minimumSum}
                </span>
              </div>
              <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button type="button" onClick={() => handleOpenForm(rule)} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => rule.id && handleDelete(rule.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isFormOpen && (
        <div className="p-3 bg-secondary/20 rounded-lg border border-dashed space-y-3 mt-2">
          <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {editingRule ? t('common.edit', 'Edit') : t('common.add', 'Add')} {t('pricing.global.deliveryRules', 'Delivery Rule')}
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">{t('pricing.global.minSum', 'Min Cost')}</label>
              <input type="number" value={minSum} onChange={e => setMinSum(e.target.value)} className="w-full py-1.5 bg-background border rounded-md text-xs px-2 outline-none focus:ring-1 focus:ring-primary h-8" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">{t('pricing.global.markupType', 'Type')}</label>
              <select value={markupType} onChange={e => setMarkupType(e.target.value as 'PERCENTAGE' | 'SUM')} className="w-full py-1.5 bg-background border rounded-md text-xs px-2 outline-none focus:ring-1 focus:ring-primary h-8">
                <option value="PERCENTAGE">{t('pricing.global.percentage', 'Percentage (%)')}</option>
                <option value="SUM">{t('pricing.global.fixed', 'Fixed Sum')}</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">{t('pricing.global.value', 'Value')}</label>
              <input type="number" step="0.01" value={value} onChange={e => setValue(e.target.value)} className="w-full py-1.5 bg-background border rounded-md text-xs px-2 outline-none focus:ring-1 focus:ring-primary h-8" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-dashed mt-3">
            <button type="button" onClick={handleCloseForm} className="btn-ghost text-xs px-2 py-1 h-auto">
              {t('common.cancel', 'Cancel')}
            </button>
            <button type="button" onClick={handleSave} disabled={isSaving} className="btn-primary text-xs px-3 py-1 h-auto">
              {isSaving && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
              {t('common.save', 'Save')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
