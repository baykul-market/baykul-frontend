import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { partSourcesApi, invalidateCatalog, isImportPending, type PartImport } from '../../api/partSources';
import { ConfirmModal } from '../../components/ConfirmModal';
import { SourcePagination } from './PartSourcesPage';
import { AlertTriangle, CheckCircle2, FileCheck2, Info } from 'lucide-react';
import { ImportStatusBadge, SourceHint, sourceTones } from './SourceStatusUI';

export default function PartImportPanel({ job }: { job: PartImport }) {
  const { t, i18n } = useTranslation();
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
    <div className="flex flex-wrap justify-between items-center gap-3"><div className="min-w-0">
      <p className="text-xs text-muted-foreground mb-1">{t('sources.importResult')}</p>
      <h2 className="font-semibold break-all">{job.filename}</h2></div>
      <span role="status"><ImportStatusBadge status={job.status} /></span></div>
    <p className="text-xs text-muted-foreground">{new Date(job.createdTs).toLocaleString(i18n.language)} · {job.uploadedBy}</p>
    <div className={`flex items-start gap-3 rounded-lg border p-4 ${sourceTones[job.status === 'COMPLETED' ? 'success' : job.status === 'READY' ? 'warning' : job.status === 'FAILED' ? 'danger' : 'info']}`}>
      {job.status === 'COMPLETED' ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
        : job.status === 'READY' ? <FileCheck2 className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
        : <Info className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />}
      <div className="text-sm"><p className="font-semibold">{t(`sources.importNotices.${job.status}`)}</p>
        <p className="mt-1">{t(`sources.importHelp.${job.status}`)}</p>
        {job.status === 'COMPLETED' && <p className="mt-2 text-xs">{t('sources.appliedAt', { date: new Date(job.updatedTs).toLocaleString(i18n.language) })}</p>}
      </div>
    </div>
    <p className="text-xs text-muted-foreground">{t('sources.countsLegend')}</p>
    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {(['totalRows', 'validRows', 'added', 'updated', 'removed', 'skipped', 'duplicates'] as const).map(key => {
        const tone = job[key] === 0 || key === 'totalRows' ? 'neutral'
          : key === 'skipped' || key === 'removed' ? 'danger' : key === 'duplicates' || key === 'updated' ? 'warning' : 'success';
        const label = t(`sources.${job.status === 'COMPLETED' && ['added', 'updated', 'removed'].includes(key) ? 'appliedCounts' : 'counts'}.${key}`);
        return <div key={key} className={`rounded-lg border p-3 ${sourceTones[tone]}`}>
          <dt className="text-xs flex justify-between items-start gap-2"><span>{label}</span>
            <SourceHint label={t('sources.explainCount', { label })} text={t(`sources.countHelp.${key}`)} className="shrink-0" /></dt>
          <dd className="text-2xl font-semibold tabular-nums mt-2">{job[key].toLocaleString(i18n.language)}</dd></div>;
      })}
    </dl>
    {job.errorMessage && <p role="alert" className="text-destructive text-sm">{job.errorMessage}</p>}
    {job.status === 'READY' && <>
      <p className={`text-sm ${job.removed > 0 ? 'font-medium text-red-800 [.dark_&]:text-red-300' : 'text-muted-foreground'}`}>{t('sources.replaceNotice', { count: job.removed })}</p>
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
    {job.skipped > 0 && <div className="space-y-3"><h3 className="font-semibold flex items-center gap-2">
      <AlertTriangle className="w-4 h-4 text-red-700 [.dark_&]:text-red-300" aria-hidden="true" />{t('sources.rowErrors')}</h3>
      <p className="text-sm text-muted-foreground">{t(job.status === 'COMPLETED' ? 'sources.rowErrorsAppliedHelp' : 'sources.rowErrorsHelp')}</p>
      {errors.isError ? <p role="alert">{t('sources.loadError')}</p> : <div className="max-h-80 overflow-auto text-sm">
        <table className="w-full"><thead className="bg-secondary"><tr><th className="p-3 text-left">{t('sources.row')}</th><th className="p-3 text-left">{t('sources.error')}</th></tr></thead>
          <tbody>{errors.data?.content.map(error => <tr className="border-t bg-red-500/5" key={error.rowNumber}><td className="p-3 align-top font-mono text-red-800 [.dark_&]:text-red-300">{error.rowNumber}</td>
            <td className="p-3"><p className="font-medium text-red-800 [.dark_&]:text-red-300">{error.errorMessage}</p><code className="block mt-1 text-xs break-all text-muted-foreground">{error.rawData}</code></td></tr>)}</tbody></table>
        {errors.data?.content.length === 0 && <p>{t('sources.errorsExpired')}</p>}
      </div>}
      <SourcePagination page={errorPage} totalPages={errors.data?.totalPages ?? 0} onChange={setErrorPage} />
    </div>}
    <ConfirmModal isOpen={confirm} onClose={() => setConfirm(false)} onConfirm={() => { if (!action.isPending) action.mutate('apply'); }}
      title={t('sources.confirmReplace')} message={t('sources.confirmReplaceText', { added: job.added, updated: job.updated, removed: job.removed, skipped: job.skipped })}
      confirmText={t('sources.apply')} isDestructive={job.removed > 0 || job.skipped > 0} />
  </section>;
}
