import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, CircleHelp, Clock3, EyeOff, Loader2, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ImportStatus, SourceStatus } from '../../api/partSources';

export const sourceTones = {
  neutral: 'border-border bg-secondary/50 text-muted-foreground',
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 [.dark_&]:text-emerald-300',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-900 [.dark_&]:text-amber-300',
  danger: 'border-red-500/30 bg-red-500/10 text-red-800 [.dark_&]:text-red-300',
  info: 'border-blue-500/30 bg-blue-500/10 text-blue-800 [.dark_&]:text-blue-300',
};

// A portal keeps explanations visible inside horizontally scrolling tables.
export function SourceHint({ label, text, children, className = '' }: {
  label: string; text: string; children?: ReactNode; className?: string;
}) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [position, setPosition] = useState<{ left: number; top: number; above: boolean } | null>(null);
  const isOpen = position !== null;
  useEffect(() => {
    if (!isOpen) return;
    const hide = () => setPosition(null);
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') hide(); };
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      clearTimeout(hideTimer.current);
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);
  const scheduleHide = () => {
    if (document.activeElement !== trigger.current) hideTimer.current = setTimeout(() => setPosition(null), 150);
  };
  const show = () => {
    clearTimeout(hideTimer.current);
    const rect = trigger.current?.getBoundingClientRect();
    if (!rect) return;
    const above = window.innerHeight - rect.bottom < 180;
    setPosition({ left: Math.max(12, Math.min(rect.left, window.innerWidth - 292)),
      top: above ? rect.top - 8 : rect.bottom + 8, above });
  };
  return <>
    <button ref={trigger} type="button" aria-label={label} aria-describedby={position ? id : undefined}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md cursor-help focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${className}`}
      onMouseEnter={show} onMouseLeave={scheduleHide}
      onFocus={show} onBlur={() => setPosition(null)} onClick={show}
      onKeyDown={event => { if (event.key === 'Escape') setPosition(null); }}>
      {children ?? <CircleHelp className="w-4 h-4" aria-hidden="true" />}
    </button>
    {position && createPortal(<div id={id} role="tooltip"
      onMouseEnter={() => clearTimeout(hideTimer.current)} onMouseLeave={scheduleHide}
      className="fixed z-[100] w-70 max-w-[calc(100vw-24px)] rounded-lg border bg-popover p-3 text-sm font-normal text-popover-foreground shadow-lg"
      style={{ left: position.left, top: position.top, transform: position.above ? 'translateY(-100%)' : undefined }}>
      {text}
    </div>, document.body)}
  </>;
}

export function ImportStatusBadge({ status }: { status: ImportStatus }) {
  const { t } = useTranslation();
  const tone = status === 'COMPLETED' ? 'success' : status === 'FAILED' ? 'danger'
    : status === 'READY' ? 'warning' : status === 'CANCELLED' ? 'neutral' : 'info';
  const Icon = status === 'COMPLETED' ? CheckCircle2 : status === 'FAILED' || status === 'CANCELLED' ? XCircle
    : status === 'PROCESSING' || status === 'APPLYING' ? Loader2 : Clock3;
  return <SourceHint label={t(`sources.importStatuses.${status}`)} text={t(`sources.importHelp.${status}`)}
    className={`border rounded-full px-2.5 py-1 text-xs font-semibold ${sourceTones[tone]}`}>
    <Icon className={`w-3.5 h-3.5 shrink-0 ${status === 'PROCESSING' || status === 'APPLYING' ? 'animate-spin' : ''}`} aria-hidden="true" />
    {t(`sources.importStatuses.${status}`)}
  </SourceHint>;
}

export function SourceStatusBadge({ status }: { status: SourceStatus }) {
  const { t } = useTranslation();
  const Icon = status === 'ACTIVE' ? CheckCircle2 : EyeOff;
  return <SourceHint label={t(`sources.statuses.${status}`)} text={t(`sources.statusHelp.${status}`)}
    className={`border rounded-full px-2.5 py-1 text-xs font-semibold ${sourceTones[status === 'ACTIVE' ? 'success' : status === 'HIDDEN' ? 'warning' : 'neutral']}`}>
    <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />{t(`sources.statuses.${status}`)}
  </SourceHint>;
}
