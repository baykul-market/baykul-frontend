import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PartSourcesPage from '../PartSourcesPage';
import PartSourceDetailPage from '../PartSourceDetailPage';
import { partSourcesApi, type PartSource, type PartImport, MAX_IMPORT_BYTES } from '../../../api/partSources';
import type { PageResponse } from '../../../api/types';

const auth = vi.hoisted(() => ({ role: 'MANAGER' }));
vi.mock('../../../store/useAuthStore', () => ({ useAuthStore: () => ({ user: { role: auth.role } }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('../../../api/client', () => ({ api: {} }));
vi.mock('../../../api/partSources', async importOriginal => ({
  ...await importOriginal<typeof import('../../../api/partSources')>(),
  partSourcesApi: { list: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn(), archive: vi.fn(),
    parts: vi.fn(), history: vi.fn(), upload: vi.fn(), job: vi.fn(), errors: vi.fn(), apply: vi.fn(), recheck: vi.fn(), cancel: vi.fn() },
}));

const job: PartImport = { id: 'import-1', sourceId: 'source-1', filename: 'supplier.csv', uploadedBy: 'manager', status: 'READY',
  sourceVersion: 1, totalRows: 3, validRows: 2, skipped: 1, duplicates: 0, added: 1, updated: 1, removed: 4,
  errorMessage: null, createdTs: '2026-09-05T12:00:00', updatedTs: '2026-09-05T12:00:00' };
const source: PartSource = { id: 'source-1', name: 'Supplier A', status: 'HIDDEN', systemSource: false, version: 1,
  partsCount: 5, lastImport: null, createdTs: '2026-09-05T12:00:00', updatedTs: '2026-09-05T12:00:00' };
const page = <T,>(content: T[], totalPages = 1) => ({ content, totalPages, totalElements: content.length,
  number: 0, size: 20, first: true, last: totalPages === 1 } as PageResponse<T>);

function open(path = '/dashboard/part-sources/source-1') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/dashboard/part-sources" element={<PartSourcesPage />} />
    <Route path="/dashboard/part-sources/:sourceId" element={<PartSourceDetailPage />} />
    <Route path="/products" element={<p>Customer catalog</p>} />
  </Routes></MemoryRouter></QueryClientProvider>);
}

beforeEach(() => {
  vi.clearAllMocks(); auth.role = 'MANAGER';
  vi.mocked(partSourcesApi.list).mockResolvedValue(page([source]));
  vi.mocked(partSourcesApi.get).mockResolvedValue(source);
  vi.mocked(partSourcesApi.parts).mockResolvedValue(page([]));
  vi.mocked(partSourcesApi.history).mockResolvedValue(page([]));
  vi.mocked(partSourcesApi.job).mockResolvedValue(job);
  vi.mocked(partSourcesApi.errors).mockResolvedValue(page([{ rowNumber: 4, errorMessage: 'Missing price', rawData: 'BAD;row' }]));
  vi.mocked(partSourcesApi.create).mockResolvedValue(source);
  vi.mocked(partSourcesApi.update).mockResolvedValue(source);
  vi.mocked(partSourcesApi.archive).mockResolvedValue({ ...source, status: 'ARCHIVED' });
  vi.mocked(partSourcesApi.apply).mockResolvedValue({ ...job, status: 'APPLYING' });
  vi.mocked(partSourcesApi.recheck).mockResolvedValue(job);
  vi.mocked(partSourcesApi.cancel).mockResolvedValue({ ...job, status: 'CANCELLED' });
});

describe('Part sources', () => {
  it('restricts both source screens to managers and admins before making requests', async () => {
    auth.role = 'USER'; open();
    expect(await screen.findByText('Customer catalog')).toBeInTheDocument();
    expect(partSourcesApi.get).not.toHaveBeenCalled();
  });

  it('lists sources and creates a hidden source through the manager form', async () => {
    open('/dashboard/part-sources');
    expect(await screen.findByRole('link', { name: 'Supplier A' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'sources.create' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('sources.name'), { target: { value: 'New supplier' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'sources.create' }));
    await waitFor(() => expect(partSourcesApi.create).toHaveBeenCalledWith('New supplier'));
  });

  it('restores the latest import with errors and requires explicit partial replacement confirmation', async () => {
    vi.mocked(partSourcesApi.get).mockResolvedValue({ ...source, lastImport: job });
    open();
    expect(await screen.findByText('Missing price')).toBeInTheDocument();
    const apply = screen.getByRole('button', { name: 'sources.apply' });
    expect(apply).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(apply);
    expect(partSourcesApi.apply).not.toHaveBeenCalled();
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'sources.apply' }));
    await waitFor(() => expect(partSourcesApi.apply).toHaveBeenCalledWith('source-1', 'import-1', true));
  });

  it('can recheck an outdated preview and cancel a prepared import', async () => {
    vi.mocked(partSourcesApi.get).mockResolvedValue({ ...source, lastImport: job });
    open();
    fireEvent.click(await screen.findByRole('button', { name: 'sources.recheck' }));
    await waitFor(() => expect(partSourcesApi.recheck).toHaveBeenCalledWith('source-1', 'import-1'));
    fireEvent.click(await screen.findByRole('button', { name: 'sources.cancelImport' }));
    await waitFor(() => expect(partSourcesApi.cancel).toHaveBeenCalledWith('source-1', 'import-1'));
  });

  it('validates file size and uploads the selected file with progress', async () => {
    vi.mocked(partSourcesApi.upload).mockImplementation(async (_id, _file, progress) => { progress(100); return job; });
    open();
    const input = await screen.findByLabelText('sources.file');
    const oversized = new File(['x'], 'large.csv'); Object.defineProperty(oversized, 'size', { value: MAX_IMPORT_BYTES + 1 });
    fireEvent.change(input, { target: { files: [oversized] } });
    expect(screen.getByRole('alert')).toHaveTextContent('sources.fileSizeError');
    expect(screen.getByRole('button', { name: 'sources.upload' })).toBeDisabled();
    const file = new File(['header\nrow'], 'supplier.csv');
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'sources.upload' }));
    await waitFor(() => expect(partSourcesApi.upload).toHaveBeenCalledWith('source-1', file, expect.any(Function)));
    expect(await screen.findByText('Missing price')).toBeInTheDocument();
  });

  it('confirms hiding and removing a source before invoking either operation', async () => {
    vi.mocked(partSourcesApi.get).mockResolvedValue({ ...source, status: 'ACTIVE' });
    open();
    fireEvent.click(await screen.findByRole('button', { name: 'sources.hide' }));
    expect(partSourcesApi.update).not.toHaveBeenCalled();
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'common.confirm' }));
    await waitFor(() => expect(partSourcesApi.update).toHaveBeenCalledWith('source-1', { status: 'HIDDEN' }));
    fireEvent.click(screen.getByRole('button', { name: 'sources.archive' }));
    expect(partSourcesApi.archive).not.toHaveBeenCalled();
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'common.confirm' }));
    await waitFor(() => expect(partSourcesApi.archive).toHaveBeenCalledWith('source-1'));
  });

  it('offers recovery for a failed source list request', async () => {
    vi.mocked(partSourcesApi.list).mockRejectedValue(new Error('Network failed'));
    open('/dashboard/part-sources');
    expect(await screen.findByRole('alert')).toHaveTextContent('sources.loadError');
    expect(screen.getByRole('button', { name: 'sources.retry' })).toBeInTheDocument();
  });
});
