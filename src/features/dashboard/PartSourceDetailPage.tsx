import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Upload, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { partSourcesApi, invalidateCatalog, isImportRunning, isImportPending, MAX_IMPORT_BYTES } from '../../api/partSources';
import { useDebounce } from '../../hooks/useDebounce';
import { ConfirmModal } from '../../components/ConfirmModal';
import { Modal } from '../../components/Modal';
import PartImportPanel from './PartImportPanel';
import { SourcePagination } from './PartSourcesPage';

export default function PartSourceDetailPage() {
  const { user } = useAuthStore();
  const { sourceId } = useParams();
  return !user || user.role === 'USER' ? <Navigate to="/products" replace /> : <SourceContent key={sourceId} id={sourceId!} />;
}

function SourceContent({ id }: { id: string }) {
  const { t } = useTranslation();
  const client = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [partPage, setPartPage] = useState(0);
  const [historyPage, setHistoryPage] = useState(0);
  const [text, setText] = useState('');
  const search = useDebounce(text, 300);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [progress, setProgress] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const [confirmAction, setConfirmAction] = useState<'hide' | 'archive' | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState('');
  const source = useQuery({ queryKey: ['part-source', id], queryFn: () => partSourcesApi.get(id),
    refetchInterval: query => isImportRunning(query.state.data?.lastImport?.status) ? 2000 : false });
  const jobId = params.get('import') || source.data?.lastImport?.id;
  const job = useQuery({ queryKey: ['part-import', id, jobId], queryFn: () => partSourcesApi.job(id, jobId!), enabled: !!jobId,
    refetchInterval: query => isImportRunning(query.state.data?.status) ? 2000 : false });
  const parts = useQuery({ queryKey: ['source-parts', id, search, partPage], queryFn: () => partSourcesApi.parts(id, search, partPage) });
  const history = useQuery({ queryKey: ['source-imports', id, historyPage], queryFn: () => partSourcesApi.history(id, historyPage),
    refetchInterval: isImportRunning(source.data?.lastImport?.status) ? 2000 : false });

  useEffect(() => {
    if (job.data?.status && !isImportRunning(job.data.status)) invalidateCatalog(client);
  }, [job.data?.status, job.data?.id, client]);

  const lifecycle = useMutation({ mutationFn: (action: 'hide' | 'archive' | 'activate' | 'rename') => action === 'archive'
    ? partSourcesApi.archive(id) : partSourcesApi.update(id, action === 'rename' ? { name: name.trim() }
      : { status: action === 'hide' ? 'HIDDEN' : 'ACTIVE' }),
    onSuccess: () => { setRenaming(false); invalidateCatalog(client); } });
  const upload = useMutation({ mutationFn: (selected: File) => partSourcesApi.upload(id, selected, setProgress),
    onSuccess: result => {
      setFile(null);
      if (fileInput.current) fileInput.current.value = '';
      setParams({ import: result.id });
      invalidateCatalog(client);
    } });

  if (source.isPending) return <Loader2 className="animate-spin" aria-label={t('common.loading')} />;
  if (source.isError) return <p role="alert">{t('sources.loadError')} <Link to="/dashboard/part-sources">{t('sources.back')}</Link></p>;
  const data = source.data;
  const archived = data.status === 'ARCHIVED';
  const pendingImport = isImportPending(data.lastImport?.status);

  return <div className="max-w-6xl mx-auto space-y-6">
    <Link to="/dashboard/part-sources" className="inline-flex gap-2 items-center text-sm text-muted-foreground"><ArrowLeft className="w-4 h-4" />{t('sources.back')}</Link>
    <div className="flex flex-wrap justify-between gap-4"><div><h1 className="text-2xl font-bold">{data.name}</h1>
      <p className="text-muted-foreground mt-2">{t(`sources.statuses.${data.status}`)} · {t('sources.partCount', { count: data.partsCount })}</p></div>
      {!archived && <div className="flex flex-wrap gap-2 items-start">
        <button className="btn-secondary" disabled={lifecycle.isPending} onClick={() => { setName(data.name); setRenaming(true); }}>{t('sources.rename')}</button>
        <button className="btn-secondary" disabled={lifecycle.isPending} onClick={() => data.status === 'ACTIVE'
          ? setConfirmAction('hide') : lifecycle.mutate('activate')}>{t(data.status === 'ACTIVE' ? 'sources.hide' : 'sources.activate')}</button>
        <button className="btn-secondary text-destructive" disabled={lifecycle.isPending} onClick={() => setConfirmAction('archive')}>{t('sources.archive')}</button>
      </div>}
    </div>
    {!archived && <section className="card p-5 space-y-4"><h2 className="font-semibold">{t('sources.uploadTitle')}</h2>
      <p className="text-sm text-muted-foreground">{t('sources.uploadHelp')}</p>
      {pendingImport ? <p className="text-sm">{t('sources.pendingImport')}</p> : <>
        <label className="block text-sm">{t('sources.file')}<input ref={fileInput} type="file" accept=".csv,.txt" className="block mt-2 w-full"
          disabled={upload.isPending} onChange={event => {
            const selected = event.target.files?.[0];
            setProgress(0); setFile(null); setFileError('');
            if (!selected) return;
            if (!/\.(csv|txt)$/i.test(selected.name)) { setFileError(t('sources.fileTypeError')); return; }
            if (selected.size === 0 || selected.size > MAX_IMPORT_BYTES) { setFileError(t('sources.fileSizeError')); return; }
            setFile(selected);
          }} /></label>
        {fileError && <p role="alert" className="text-destructive text-sm">{fileError}</p>}
        <button className="btn-primary" disabled={!file || upload.isPending} onClick={() => { if (file) upload.mutate(file); }}>
          <Upload className="w-4 h-4" />{t('sources.upload')}</button>
      </>}
      {upload.isPending && <div role="status"><progress className="w-full" max={100} value={progress} />
        <p className="text-sm">{progress}% · {t('sources.uploadProgress')}</p></div>}
    </section>}
    {job.isError && <p role="alert">{t('sources.loadError')}</p>}
    {job.data && <PartImportPanel key={`${job.data.id}:${job.data.status}:${job.data.sourceVersion}`} job={job.data} />}
    <section className="card p-5 space-y-4"><h2 className="font-semibold">{t('sources.assortment')}</h2>
      <input className="input-base w-full" aria-label={t('sources.searchParts')} placeholder={t('sources.searchParts')}
        value={text} onChange={event => { setText(event.target.value); setPartPage(0); }} />
      {parts.isError ? <p role="alert">{t('sources.loadError')}</p> : <div className="overflow-x-auto"><table className="w-full text-sm">
        <thead><tr>{['article', 'brand', 'name', 'status', 'price'].map(key => <th className="text-left p-3" key={key}>{t(`sources.${key}`)}</th>)}</tr></thead>
        <tbody>{parts.data?.content.map(part => <tr key={part.id} className="border-t"><td className="p-3 font-mono">
          <Link className="text-primary" to={`/dashboard/parts/${part.id}`}>{part.article}</Link></td><td className="p-3">{part.brand}</td>
          <td className="p-3">{part.name}</td><td className="p-3">{t(part.available === false ? 'sources.unavailable' : 'sources.available')}</td>
          <td className="p-3 whitespace-nowrap">{part.realPrice ?? part.price} {part.realCurrency ?? part.currency}</td></tr>)}</tbody></table>
        {parts.data?.content.length === 0 && <p className="text-muted-foreground p-4">{t('sources.noParts')}</p>}</div>}
      <SourcePagination page={partPage} totalPages={parts.data?.totalPages ?? 0} onChange={setPartPage} />
    </section>
    <section className="card p-5 space-y-4"><h2 className="font-semibold">{t('sources.history')}</h2>
      {history.isError ? <p role="alert">{t('sources.loadError')}</p> : <ul className="divide-y">{history.data?.content.map(item =>
        <li key={item.id} className="py-3"><button className="text-primary text-left" onClick={() => setParams({ import: item.id })}>{item.filename}</button>
          <p className="text-xs text-muted-foreground mt-1">{new Date(item.createdTs).toLocaleString()} · {item.uploadedBy} · {t(`sources.importStatuses.${item.status}`)}</p></li>)}</ul>}
      <SourcePagination page={historyPage} totalPages={history.data?.totalPages ?? 0} onChange={setHistoryPage} />
    </section>
    <ConfirmModal isOpen={confirmAction !== null} onClose={() => setConfirmAction(null)}
      onConfirm={() => { if (confirmAction && !lifecycle.isPending) lifecycle.mutate(confirmAction); }}
      title={t(confirmAction === 'archive' ? 'sources.archive' : 'sources.hide')}
      message={t('sources.lifecycleConfirm', { name: data.name, count: data.partsCount })} isDestructive />
    <Modal isOpen={renaming} onClose={() => setRenaming(false)} title={t('sources.rename')}>
      <form className="space-y-4" onSubmit={event => { event.preventDefault(); if (name.trim()) lifecycle.mutate('rename'); }}>
        <label className="block">{t('sources.name')}<input className="input-base w-full mt-2" value={name} maxLength={255} required onChange={e => setName(e.target.value)} /></label>
        <button className="btn-primary" disabled={lifecycle.isPending || !name.trim()}>{t('common.save')}</button>
      </form>
    </Modal>
  </div>;
}
