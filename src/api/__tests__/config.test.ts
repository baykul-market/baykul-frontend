import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configApi } from '../config';
import { api } from '../client';

vi.mock('../client', () => ({
    api: {
        get: vi.fn(),
        put: vi.fn(),
        post: vi.fn(),
        delete: vi.fn(),
    },
}));

describe('configApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Price Configuration', () => {
        it('fetches price configuration', async () => {
            const mockData = { deliveryPercentage: 0.1, markupPercentage: 0.2, currency: 'RUB' };
            (api.get as any).mockResolvedValueOnce({ data: mockData });

            const result = await configApi.getConfig();

            expect(api.get).toHaveBeenCalledWith('/price-config');
            expect(result).toEqual(mockData);
        });

        it('updates price configuration', async () => {
            const mockData = { deliveryPercentage: 0.15 };
            (api.put as any).mockResolvedValueOnce({ data: { success: true } });

            await configApi.updateConfig(mockData);

            expect(api.put).toHaveBeenCalledWith('/price-config', mockData);
        });
    });

    describe('Currency Exchange', () => {
        it('fetches exchange rates', async () => {
            const mockData = [{ currencyFrom: 'EUR', currencyTo: 'RUB', rate: 105 }];
            (api.get as any).mockResolvedValueOnce({ data: mockData });

            const result = await configApi.getExchangeRates();

            expect(api.get).toHaveBeenCalledWith('/currency-exchange');
            expect(result).toEqual(mockData);
        });

        it('creates or updates exchange rate', async () => {
            const mockData = { currencyFrom: 'USD' as any, currencyTo: 'RUB' as any, rate: 100 };
            (api.post as any).mockResolvedValueOnce({ data: { success: true } });

            await configApi.createOrUpdateExchangeRate(mockData);

            expect(api.post).toHaveBeenCalledWith('/currency-exchange', mockData);
        });
    });
});
