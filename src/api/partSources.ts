import { api } from './client';
import type { PageResponse } from './types';
import type { Part, SkippedRow } from './product';
export { invalidateCatalog } from './catalogCache';

export type SourceStatus = 'ACTIVE' | 'HIDDEN' | 'ARCHIVED';
export type ImportStatus = 'QUEUED' | 'PROCESSING' | 'READY' | 'APPLYING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export interface PartImport {
  id: string; sourceId: string; filename: string; uploadedBy: string; status: ImportStatus;
  sourceVersion: number; totalRows: number; validRows: number; skipped: number; duplicates: number;
  added: number; updated: number; removed: number; errorMessage: string | null;
  createdTs: string; updatedTs: string;
}
export interface PartSource {
  id: string; name: string; status: SourceStatus; systemSource: boolean; version: number;
  partsCount: number; lastImport: PartImport | null; createdTs: string; updatedTs: string;
}
export const MAX_IMPORT_BYTES = 200 * 1024 * 1024;
export const isImportRunning = (status?: ImportStatus) => !!status && ['QUEUED', 'PROCESSING', 'APPLYING'].includes(status);
export const isImportPending = (status?: ImportStatus) => status === 'READY' || isImportRunning(status);
const base = '/product/sources';
const jobPath = (source: string, job: string) => `${base}/${source}/imports/${job}`;

export const partSourcesApi = {
  list: async (text = '', status?: SourceStatus, page = 0) =>
    (await api.get<PageResponse<PartSource>>(base, { params: { text, status, page, size: 20 } })).data,
  get: async (id: string) => (await api.get<PartSource>(`${base}/${id}`)).data,
  create: async (name: string) => (await api.post<PartSource>(base, { name })).data,
  update: async (id: string, data: { name?: string; status?: SourceStatus }) =>
    (await api.patch<PartSource>(`${base}/${id}`, data)).data,
  archive: async (id: string) => (await api.delete<PartSource>(`${base}/${id}`)).data,
  parts: async (id: string, text = '', page = 0) =>
    (await api.get<PageResponse<Part>>(`${base}/${id}/parts`, { params: { text, page, size: 50 } })).data,
  history: async (id: string, page = 0) =>
    (await api.get<PageResponse<PartImport>>(`${base}/${id}/imports`, { params: { page, size: 20 } })).data,
  upload: async (id: string, file: File, onProgress: (percent: number) => void) => {
    const form = new FormData();
    form.append('csvFile', file);
    return (await api.post<PartImport>(`${base}/${id}/imports`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: event => onProgress(Math.round(100 * event.loaded / (event.total || file.size))),
    })).data;
  },
  job: async (source: string, job: string) => (await api.get<PartImport>(jobPath(source, job))).data,
  errors: async (source: string, job: string, page = 0) =>
    (await api.get<PageResponse<SkippedRow>>(`${jobPath(source, job)}/errors`, { params: { page, size: 50 } })).data,
  apply: async (source: string, job: string, acceptSkippedRows: boolean) =>
    (await api.post<PartImport>(`${jobPath(source, job)}/apply`, { acceptSkippedRows })).data,
  recheck: async (source: string, job: string) => (await api.post<PartImport>(`${jobPath(source, job)}/recheck`)).data,
  cancel: async (source: string, job: string) => (await api.post<PartImport>(`${jobPath(source, job)}/cancel`)).data,
};
