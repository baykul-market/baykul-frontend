import { api } from './client';
import type { AxiosRequestConfig } from 'axios';
import { Currency } from './types';

export interface DeliveryCostConfigDto {
    id?: string;
    minimumSum: number;
    markupType: 'PERCENTAGE' | 'SUM';
    value: number;
    userId?: string | null;
}

export interface PriceConfigDto {
    markupPercentage: number;
    systemCurrency: Currency;
    deliveryCostConfigs: DeliveryCostConfigDto[];
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
    getConfig: (config?: AxiosRequestConfig) => api.get<PriceConfigDto>('/price-config', config).then(res => res.data),

    updateConfig: (data: Partial<Omit<PriceConfigDto, 'deliveryCostConfigs'>>, config?: AxiosRequestConfig) =>
        api.put('/price-config/base', data, config).then(res => res.data),

    resetConfig: (config?: AxiosRequestConfig) => api.post('/price-config/reset', undefined, config).then(res => res.data),

    // Delivery Rules Endpoints
    saveDeliveryRule: (data: DeliveryCostConfigDto, config?: AxiosRequestConfig) =>
        api.post('/price-config/delivery-rule', data, config).then(res => res.data),

    updateDeliveryRule: (data: DeliveryCostConfigDto, config?: AxiosRequestConfig) =>
        api.put('/price-config/delivery-rule', data, config).then(res => res.data),

    deleteDeliveryRule: (id: string, config?: AxiosRequestConfig) =>
        api.delete('/price-config/delivery-rule', { ...config, params: { id, ...config?.params } }).then(res => res.data),

    getDeliveryRulesByUser: (userId: string, config?: AxiosRequestConfig) =>
        api.get<DeliveryCostConfigDto[]>(`/price-config/delivery-rule/user/${userId}`, config).then(res => res.data),

    // Currency Exchange Endpoints
    getExchangeRates: (config?: AxiosRequestConfig) => api.get<CurrencyExchangeDto[]>('/currency-exchange', config).then(res => res.data),

    createOrUpdateExchangeRate: (data: CurrencyExchangeDto, config?: AxiosRequestConfig) =>
        api.post('/currency-exchange', data, config).then(res => res.data),

    deleteExchangeRate: (id: string, config?: AxiosRequestConfig) =>
        api.delete(`/currency-exchange/${id}`, config).then(res => res.data),

    getAvailableCurrencies: (config?: AxiosRequestConfig) =>
        api.get<Currency[]>('/currency-exchange/currency', config).then(res => res.data),
};
