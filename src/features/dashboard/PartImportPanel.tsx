import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { partSourcesApi, invalidateCatalog, isImportPending, type PartImport } from '../../api/partSources';
import { ConfirmModal } from '../../components/ConfirmModal';
import { SourcePagination } from './PartSourcesPage';

export default function PartImportPanel({ job }: { job: PartImport }) {
  const { t } = useTranslation();
  const client = useQueryClient();
  const [errorPage, setErrorPage] = useState(0);
  const [acceptSkipped, setAcceptSkipped] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const errors = useQuery({ queryKey: ['import-errors', job.id, errorPage, job.status],
    queryFn: () => partSourcesApi.errors(job.sourceId, job.id, errorPage), enabled: job.skipped > 0 });
  const action = useMutation({ mutationFn: (kind: 'apply' | 'cancel' | 'recheck') => kind === 'apply'
    ? partSourcesApi.apply(job.sourceId, job.id, acceptSkipped) : partSourcesApi[kind](job.sourceId, job.id),
    onSuccess: () => { setAcceptSkipped(false); invalidateCatalog(client); } });
  return <section className="card p-5 space-y-4" aria-label={t('sources.importResult')}>
    <div className="flex flex-wrap justify-between gap-2"><h2 className="font-semibold">{job.filename}</h2>
      <span role="status">{t(`sources.importStatuses.${job.status}`)}</span></div>
    <p className="text-xs text-muted-foreground">{new Date(job.createdTs).toLocaleString()} · {job.uploadedBy}</p>
    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {(['totalRows', 'validRows', 'added', 'updated', 'removed', 'skipped', 'duplicates'] as const).map(key =>
        <div key={key} className="rounded-lg bg-secondary/40 p-3"><dt className="text-xs text-muted-foreground">{t(`sources.counts.${key}`)}</dt>
          <dd className="text-xl font-semibold mt-1">{job[key].toLocaleString()}</dd></div>)}
    </dl>
    {job.errorMessage && <p role="alert" className="text-destructive text-sm">{job.errorMessage}</p>}
    {job.status === 'READY' && <>
      <p className="text-sm">{t('sources.replaceNotice', { count: job.removed })}</p>
      {job.skipped > 0 && <label className="flex gap-3 rounded-lg border border-destructive/40 p-4 text-sm">
        <input type="checkbox" checked={acceptSkipped} onChange={e => setAcceptSkipped(e.target.checked)} />
        {t('sources.acceptSkipped', { skipped: job.skipped, removed: job.removed })}
      </label>}
      <div className="flex flex-wrap gap-3">
        <button className="btn-primary" disabled={action.isPending || (job.skipped > 0 && !acceptSkipped)} onClick={() => setConfirm(true)}>{t('sources.apply')}</button>
        <button className="btn-secondary" disabled={action.isPending} onClick={() => action.mutate('recheck')}>{t('sources.recheck')}</button>
      </div>
    </>}
    {isImportPending(job.status) && job.status !== 'APPLYING' && <button className="btn-secondary" disabled={action.isPending}
      onClick={() => action.mutate('cancel')}>{t('sources.cancelImport')}</button>}
    {job.skipped > 0 && <div className="space-y-3"><h3 className="font-semibold">{t('sources.rowErrors')}</h3>
      {errors.isError ? <p role="alert">{t('sources.loadError')}</p> : <div className="max-h-80 overflow-auto text-sm">
        <table className="w-full"><thead><tr><th className="p-2 text-left">{t('sources.row')}</th><th className="p-2 text-left">{t('sources.error')}</th></tr></thead>
          <tbody>{errors.data?.content.map(error => <tr className="border-t" key={error.rowNumber}><td className="p-2 align-top">{error.rowNumber}</td>
            <td className="p-2"><p>{error.errorMessage}</p><code className="block text-xs break-all text-muted-foreground">{error.rawData}</code></td></tr>)}</tbody></table>
        {errors.data?.content.length === 0 && <p>{t('sources.errorsExpired')}</p>}
      </div>}
      <SourcePagination page={errorPage} totalPages={errors.data?.totalPages ?? 0} onChange={setErrorPage} />
    </div>}
    <ConfirmModal isOpen={confirm} onClose={() => setConfirm(false)} onConfirm={() => { if (!action.isPending) action.mutate('apply'); }}
      title={t('sources.confirmReplace')} message={t('sources.confirmReplaceText', { added: job.added, updated: job.updated, removed: job.removed, skipped: job.skipped })}
      confirmText={t('sources.apply')} isDestructive={job.removed > 0 || job.skipped > 0} />
  </section>;
}
