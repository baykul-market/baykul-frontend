import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Database, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { partSourcesApi, invalidateCatalog, type SourceStatus } from '../../api/partSources';
import { useDebounce } from '../../hooks/useDebounce';
import { Modal } from '../../components/Modal';

export default function PartSourcesPage() {
  const { user } = useAuthStore();
  return !user || user.role === 'USER' ? <Navigate to="/products" replace /> : <SourcesContent />;
}

function SourcesContent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [text, setText] = useState('');
  const search = useDebounce(text, 300);
  const [status, setStatus] = useState<SourceStatus | ''>('');
  const [page, setPage] = useState(0);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const query = useQuery({ queryKey: ['part-sources', search, status, page],
    queryFn: () => partSourcesApi.list(search, status || undefined, page) });
  const create = useMutation({ mutationFn: () => partSourcesApi.create(name.trim()), onSuccess: source => {
    invalidateCatalog(client);
    navigate(`/dashboard/part-sources/${source.id}`);
  } });

  return <div className="max-w-6xl mx-auto space-y-6">
    <div className="flex flex-wrap justify-between items-center gap-4">
      <div><h1 className="text-2xl font-bold flex items-center gap-3"><Database />{t('sources.title')}</h1>
        <p className="text-muted-foreground mt-2">{t('sources.subtitle')}</p></div>
      <button className="btn-primary" onClick={() => setCreating(true)}><Plus className="w-4 h-4" />{t('sources.create')}</button>
    </div>
    <div className="card p-4 flex flex-wrap gap-3">
      <input aria-label={t('sources.search')} className="input-base flex-1" placeholder={t('sources.search')}
        value={text} onChange={e => { setText(e.target.value); setPage(0); }} />
      <select aria-label={t('sources.status')} className="input-base w-auto" value={status}
        onChange={e => { setStatus(e.target.value as SourceStatus | ''); setPage(0); }}>
        <option value="">{t('sources.currentSources')}</option>
        {(['ACTIVE', 'HIDDEN', 'ARCHIVED'] as const).map(value => <option key={value} value={value}>{t(`sources.statuses.${value}`)}</option>)}
      </select>
    </div>
    {query.isPending ? <Loader2 className="animate-spin" aria-label={t('common.loading')} /> : query.isError ?
      <p role="alert">{t('sources.loadError')} <button className="btn-secondary" onClick={() => query.refetch()}>{t('sources.retry')}</button></p> :
      <div className="card overflow-x-auto"><table className="w-full text-sm"><thead className="bg-secondary/40"><tr>
        {['name', 'status', 'partsCount', 'lastImport'].map(key => <th className="p-4 text-left" key={key}>{t(`sources.${key}`)}</th>)}
      </tr></thead><tbody>{query.data.content.map(source => <tr key={source.id} className="border-t">
        <td className="p-4"><Link className="font-semibold text-primary" to={`/dashboard/part-sources/${source.id}`}>{source.name}</Link></td>
        <td className="p-4">{t(`sources.statuses.${source.status}`)}</td><td className="p-4">{source.partsCount.toLocaleString()}</td>
        <td className="p-4">{source.lastImport ? <><div>{source.lastImport.filename}</div><div className="text-muted-foreground">
          {new Date(source.lastImport.createdTs).toLocaleString()} · {t(`sources.importStatuses.${source.lastImport.status}`)}</div></> : t('sources.noImports')}</td>
      </tr>)}</tbody></table>{query.data.content.length === 0 && <p className="p-8 text-center text-muted-foreground">{t('sources.empty')}</p>}</div>}
    <SourcePagination page={page} totalPages={query.data?.totalPages ?? 0} onChange={setPage} />
    <Modal isOpen={creating} onClose={() => setCreating(false)} title={t('sources.create')}>
      <form onSubmit={e => { e.preventDefault(); if (name.trim() && !create.isPending) create.mutate(); }} className="space-y-4">
        <label className="block">{t('sources.name')}<input autoFocus className="input-base w-full mt-2" maxLength={255}
          value={name} onChange={e => setName(e.target.value)} required /></label>
        <p className="text-sm text-muted-foreground">{t('sources.startsHidden')}</p>
        <button type="submit" className="btn-primary" disabled={!name.trim() || create.isPending}>{t('sources.create')}</button>
      </form>
    </Modal>
  </div>;
}

export function SourcePagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  const { t } = useTranslation();
  if (totalPages <= 1) return null;
  return <div className="flex justify-end items-center gap-3 text-sm">
    <button className="btn-secondary" disabled={page === 0} onClick={() => onChange(page - 1)}>{t('sources.previous')}</button>
    <span>{page + 1} / {totalPages}</span>
    <button className="btn-secondary" disabled={page + 1 >= totalPages} onClick={() => onChange(page + 1)}>{t('sources.next')}</button>
  </div>;
}
