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
            const mockData = {
                markupPercentage: 0.2,
                systemCurrency: 'RUB',
                deliveryCostConfigs: [{ id: '1', minimumSum: 0, markupType: 'PERCENTAGE', value: 0.1 }]
            };
            (api.get as any).mockResolvedValueOnce({ data: mockData });

            const result = await configApi.getConfig();

            expect(api.get).toHaveBeenCalledWith('/price-config', undefined);
            expect(result).toEqual(mockData);
        });

        it('updates price configuration', async () => {
            const mockData = { markupPercentage: 0.15 };
            (api.put as any).mockResolvedValueOnce({ data: { success: true } });

            await configApi.updateConfig(mockData);

            expect(api.put).toHaveBeenCalledWith('/price-config/base', mockData, undefined);
        });

        it('saves delivery rule', async () => {
            const mockData = { minimumSum: 1000, markupType: 'SUM' as any, value: 50 };
            (api.post as any).mockResolvedValueOnce({ data: { success: true } });

            await configApi.saveDeliveryRule(mockData);

            expect(api.post).toHaveBeenCalledWith('/price-config/delivery-rule', mockData, undefined);
        });

        it('deletes delivery rule', async () => {
            const mockId = 'rule-123';
            (api.delete as any).mockResolvedValueOnce({ data: { success: true } });

            await configApi.deleteDeliveryRule(mockId);

            expect(api.delete).toHaveBeenCalledWith('/price-config/delivery-rule', { params: { id: mockId } });
        });
    });

    describe('Currency Exchange', () => {
        it('fetches exchange rates', async () => {
            const mockData = [{ currencyFrom: 'EUR', currencyTo: 'RUB', rate: 105 }];
            (api.get as any).mockResolvedValueOnce({ data: mockData });

            const result = await configApi.getExchangeRates();

            expect(api.get).toHaveBeenCalledWith('/currency-exchange', undefined);
            expect(result).toEqual(mockData);
        });

        it('creates or updates exchange rate', async () => {
            const mockData = { currencyFrom: 'USD' as any, currencyTo: 'RUB' as any, rate: 100 };
            (api.post as any).mockResolvedValueOnce({ data: { success: true } });

            await configApi.createOrUpdateExchangeRate(mockData);

            expect(api.post).toHaveBeenCalledWith('/currency-exchange', mockData, undefined);
        });

        it('deletes exchange rate', async () => {
            const mockId = 'a375a508-4bf3-4c5b-a15c-4909af262725';
            (api.delete as any).mockResolvedValueOnce({ data: { success: true } });

            await configApi.deleteExchangeRate(mockId);

            expect(api.delete).toHaveBeenCalledWith('/currency-exchange', { params: { id: mockId } });
        });
    });
});
