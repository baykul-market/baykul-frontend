import { api } from './client';
import { Currency } from './types';

export interface PriceConfigDto {
    deliveryPercentage: number;
    markupPercentage: number;
    currency: Currency;
}

export interface CurrencyExchangeDto {
    currencyFrom: Currency;
    currencyTo: Currency;
    rate: number;
    bothDirections?: boolean;
    replaceExisting?: boolean;
}

export const configApi = {
    // Price Config Endpoints
    getConfig: () => api.get<PriceConfigDto>('/price-config').then(res => res.data),

    updateConfig: (data: Partial<PriceConfigDto>) =>
        api.put('/price-config', data).then(res => res.data),

    resetConfig: () => api.post('/price-config/reset').then(res => res.data),

    // Currency Exchange Endpoints
    getExchangeRates: () => api.get<CurrencyExchangeDto[]>('/currency-exchange').then(res => res.data),

    createOrUpdateExchangeRate: (data: CurrencyExchangeDto) =>
        api.post('/currency-exchange', data).then(res => res.data),

    deleteExchangeRate: (id: string) =>
        api.delete(`/currency-exchange/${id}`).then(res => res.data),

    getAvailableCurrencies: () =>
        api.get<Currency[]>('/currency-exchange/currency').then(res => res.data),
};
