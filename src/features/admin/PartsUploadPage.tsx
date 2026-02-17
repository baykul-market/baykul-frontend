import { useState, useCallback, useRef } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Navigate } from 'react-router-dom';
import { Upload, FileText, X, CheckCircle, AlertCircle, Download, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { productApi } from '../../api/product';
import toast from 'react-hot-toast';

const CSV_HEADERS = 'article;name;weight;min_count;storage_count;return_part;price;brand';
const CSV_EXAMPLE = '2405947;Engine Oil LL01 5W30;150.4;3;5;3.01;7862.43;rolls royce';

export default function PartsUploadPage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<Record<string, string> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: (csvFile: File) => productApi.uploadCsv(csvFile),
    onSuccess: () => {
      toast.success(t('admin.partsUpload.uploadSuccess'));
      setFile(null);
      setErrors(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (error: any) => {
      const data = error?.response?.data;
      if (error?.response?.status === 400 && data) {
        setErrors(data);
        toast.error(t('admin.partsUpload.validationError'));
      } else if (error?.response?.status === 403) {
        toast.error(t('admin.partsUpload.forbidden'));
      } else {
        toast.error(t('admin.partsUpload.uploadError'));
      }
    },
  });

  if (!user || user.role === 'USER') {
    return <Navigate to="/products" />;
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const validateFile = (f: File): boolean => {
    if (!f.name.endsWith('.csv')) {
      toast.error(t('admin.partsUpload.invalidFileType'));
      return false;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error(t('admin.partsUpload.fileTooLarge'));
      return false;
    }
    return true;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && validateFile(droppedFile)) {
      setFile(droppedFile);
      setErrors(null);
    }
  }, [t]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile);
      setErrors(null);
    }
  };

  const handleUpload = () => {
    if (!file) return;
    setErrors(null);
    uploadMutation.mutate(file);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setErrors(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadTemplate = () => {
    const content = CSV_HEADERS + '\n' + CSV_EXAMPLE + '\n';
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'parts_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
          <Upload className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('admin.partsUpload.title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('admin.partsUpload.subtitle')}
          </p>
        </div>
      </div>

      {/* CSV Format Info */}
      <div className="card p-5 mb-6">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-2">{t('admin.partsUpload.formatTitle')}</h3>
            <ul className="text-sm text-muted-foreground space-y-1 mb-3">
              <li>{t('admin.partsUpload.formatUtf8')}</li>
              <li>{t('admin.partsUpload.formatSemicolon')}</li>
              <li>{t('admin.partsUpload.formatMaxSize')}</li>
            </ul>
            <div className="rounded-lg bg-secondary/50 p-3 overflow-x-auto">
              <p className="text-xs font-medium text-muted-foreground mb-1">{t('admin.partsUpload.headerLabel')}</p>
              <code className="text-xs text-foreground break-all">{CSV_HEADERS}</code>
              <p className="text-xs font-medium text-muted-foreground mt-2 mb-1">{t('admin.partsUpload.exampleLabel')}</p>
              <code className="text-xs text-foreground break-all">{CSV_EXAMPLE}</code>
            </div>
            <button
              onClick={downloadTemplate}
              className="btn-ghost text-sm mt-3 text-primary hover:text-primary/80"
            >
              <Download className="h-4 w-4" />
              {t('admin.partsUpload.downloadTemplate')}
            </button>
          </div>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !file && fileInputRef.current?.click()}
        className={`relative card border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
          dragActive
            ? 'border-primary bg-primary/5'
            : file
            ? 'border-border bg-background'
            : 'border-border hover:border-primary/50 hover:bg-secondary/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
          aria-label={t('admin.partsUpload.dropzone')}
        />

        {!file ? (
          <div className="space-y-3">
            <div className="flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">
                {t('admin.partsUpload.dropzone')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('admin.partsUpload.dropzoneHint')}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFile();
              }}
              aria-label={t('common.cancel')}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Upload Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleUpload}
          disabled={!file || uploadMutation.isPending}
          className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploadMutation.isPending ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t('admin.partsUpload.uploading')}
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              {t('admin.partsUpload.uploadButton')}
            </>
          )}
        </button>
      </div>

      {/* Success Message */}
      {uploadMutation.isSuccess && (
        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30 p-4 flex items-start gap-3 animate-fade-in">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              {t('admin.partsUpload.successTitle')}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
              {t('admin.partsUpload.successDescription')}
            </p>
          </div>
        </div>
      )}

      {/* Error Details */}
      {errors && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 p-4 animate-fade-in">
          <div className="flex items-start gap-3 mb-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              {errors.error || t('admin.partsUpload.errorsTitle')}
            </p>
          </div>
          <div className="ml-8 space-y-1">
            {Object.entries(errors)
              .filter(([key]) => key !== 'error')
              .map(([key, value]) => (
                <div key={key} className="flex items-start gap-2 text-xs">
                  <span className="font-mono text-red-500 dark:text-red-400 flex-shrink-0">
                    {key.replace('error_', '')}:
                  </span>
                  <span className="text-red-700 dark:text-red-300">{value}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
