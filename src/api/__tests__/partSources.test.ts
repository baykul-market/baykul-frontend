import { beforeEach, expect, it, vi } from 'vitest';
import { api } from '../client';
import { partSourcesApi } from '../partSources';

vi.mock('../client', () => ({ api: { post: vi.fn(), get: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());

it('overrides the JSON default for multipart uploads and reports transfer progress', async () => {
  vi.mocked(api.post).mockResolvedValue({ data: { id: 'job', status: 'QUEUED' } });
  const file = new File(['rows'], 'supplier.csv');
  const progress = vi.fn();
  const result = await partSourcesApi.upload('source', file, progress);
  const [url, body, config] = vi.mocked(api.post).mock.calls[0];
  expect(url).toBe('/product/sources/source/imports');
  expect((body as FormData).get('csvFile')).toBe(file);
  expect(config?.headers).toEqual({ 'Content-Type': 'multipart/form-data' });
  config?.onUploadProgress?.({ loaded: 2, total: 4 } as any);
  expect(progress).toHaveBeenCalledWith(50);
  expect(result.id).toBe('job');
});

it('sends explicit partial replacement acceptance to the selected import', async () => {
  vi.mocked(api.post).mockResolvedValue({ data: { status: 'APPLYING' } });
  await partSourcesApi.apply('source', 'job', true);
  expect(api.post).toHaveBeenCalledWith('/product/sources/source/imports/job/apply', { acceptSkippedRows: true });
});
