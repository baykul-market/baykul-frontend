import React from 'react';
import { Modal } from './Modal';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';

export interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string | React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    cancelText,
    isDestructive = false
}: ConfirmModalProps) {
    const { t } = useTranslation();

    const Icon = isDestructive ? AlertTriangle : AlertCircle;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="flex flex-col gap-5">
                <div className="flex items-start gap-4">
                    <div className={cn(
                        "p-2 rounded-full shrink-0",
                        isDestructive ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                    )}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div className="text-muted-foreground mt-1 text-sm">{message}</div>
                </div>
                <div className="flex justify-end gap-3 mt-2">
                    <button
                        onClick={onClose}
                        className="btn-outline px-4 py-2 bg-background font-medium"
                    >
                        {cancelText || t('common.cancel', 'Cancel')}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={cn(
                            "px-4 py-2 rounded-md font-medium text-white transition-colors",
                            isDestructive ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
                        )}
                    >
                        {confirmText || t('common.confirm', 'Confirm')}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
