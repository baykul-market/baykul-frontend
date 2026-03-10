import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { configApi, PriceConfigDto, CurrencyExchangeDto } from '../../api/config';
import { Currency } from '../../api/types';
import toast from 'react-hot-toast';
import { Save, Plus, Trash2, ArrowRight } from 'lucide-react';

export default function PricingConfigPage() {
    const { t } = useTranslation();
    const user = useAuthStore((state) => state.user);

    const [, setConfig] = useState<PriceConfigDto | null>(null);
    const [rates, setRates] = useState<CurrencyExchangeDto[]>([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [deliveryPercentage, setDeliveryPercentage] = useState<number>(0);
    const [markupPercentage, setMarkupPercentage] = useState<number>(0);
    const [systemCurrency, setSystemCurrency] = useState<Currency>('RUB');

    // Rate Form
    const [newRateFrom, setNewRateFrom] = useState<Currency>('EUR');
    const [newRateTo, setNewRateTo] = useState<Currency>('RUB');
    const [newRateValue, setNewRateValue] = useState<number>(1);
    const [newRateBothDir, setNewRateBothDir] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [fetchedConfig, fetchedRates] = await Promise.all([
                configApi.getConfig(),
                configApi.getExchangeRates()
            ]);
            setConfig(fetchedConfig);
            setRates(fetchedRates);

            setDeliveryPercentage(fetchedConfig.deliveryPercentage);
            setMarkupPercentage(fetchedConfig.markupPercentage);
            setSystemCurrency(fetchedConfig.currency);

            setLoading(false);
        } catch (error) {
            toast.error(t('pricing.errors.fetchFailed', 'Failed to fetch pricing config'));
            setLoading(false);
        }
    };

    const handleSaveConfig = async () => {
        try {
            await configApi.updateConfig({
                deliveryPercentage,
                markupPercentage,
                currency: systemCurrency
            });
            toast.success(t('pricing.success.configSaved', 'Configuration saved successfully'));
            fetchData();
        } catch (error) {
            toast.error(t('pricing.errors.saveFailed', 'Failed to save configuration'));
        }
    };

    const handleAddRate = async () => {
        try {
            await configApi.createOrUpdateExchangeRate({
                currencyFrom: newRateFrom,
                currencyTo: newRateTo,
                rate: newRateValue,
                bothDirections: newRateBothDir,
                replaceExisting: true
            });
            toast.success(t('pricing.success.rateSaved', 'Rate added successfully'));
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error(t('pricing.errors.saveFailed', 'Failed to add rate'));
        }
    };

    const handleDeleteRate = async (rate: CurrencyExchangeDto) => {
        if (!window.confirm(t('pricing.confirm.deleteRate', 'Are you sure you want to delete this rate?'))) {
            return;
        }
        try {
            await configApi.deleteExchangeRate(`${rate.currencyFrom}_${rate.currencyTo}`);
            toast.success(t('pricing.success.rateDeleted', 'Rate deleted'));
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error(t('pricing.errors.deleteFailed', 'Failed to delete rate'));
        }
    };

    if (!user || user.role !== 'ADMIN') {
        return <Navigate to="/products" />;
    }

    if (loading) {
        return <div className="p-8 text-center">{t('common.loading', 'Loading...')}</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in" data-testid="pricing-config-page">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('pricing.title', 'Pricing Configuration')}</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    {t('pricing.subtitle', 'Manage global pricing rules and currency exchange rates.')}
                </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                {/* Global Settings */}
                <div className="card p-6 space-y-5 h-fit">
                    <h2 className="text-xl font-semibold border-b pb-3">{t('pricing.global.title', 'Global Rules')}</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">{t('pricing.global.deliveryPercentage', 'Delivery Percentage')}</label>
                            <div className="flex bg-background border px-3 rounded-lg focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={deliveryPercentage}
                                    onChange={(e) => setDeliveryPercentage(Number(e.target.value))}
                                    className="flex-1 py-2 bg-transparent outline-none border-none text-foreground"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5">{t('pricing.global.markupPercentage', 'Markup Percentage')}</label>
                            <div className="flex bg-background border px-3 rounded-lg focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={markupPercentage}
                                    onChange={(e) => setMarkupPercentage(Number(e.target.value))}
                                    className="flex-1 py-2 bg-transparent outline-none border-none text-foreground"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5">{t('pricing.global.systemCurrency', 'Default System Currency')}</label>
                            <select
                                value={systemCurrency}
                                onChange={(e) => setSystemCurrency(e.target.value as Currency)}
                                className="w-full bg-background border rounded-lg px-3 py-2 text-foreground focus:ring-2 outline-none"
                            >
                                <option value="RUB">RUB</option>
                                <option value="EUR">EUR</option>
                                <option value="USD">USD</option>
                                <option value="BYN">BYN</option>
                            </select>
                        </div>

                        <button
                            onClick={handleSaveConfig}
                            className="btn-primary w-full mt-4 flex justify-center items-center gap-2"
                        >
                            <Save size={16} />
                            {t('common.save', 'Save Changes')}
                        </button>
                    </div>
                </div>

                {/* Exchange Rates */}
                <div className="card p-6 space-y-5">
                    <h2 className="text-xl font-semibold border-b pb-3">{t('pricing.rates.title', 'Exchange Rates')}</h2>

                    {/* Add Form */}
                    <div className="bg-secondary/20 p-4 rounded-lg space-y-3">
                        <h3 className="text-sm font-medium">{t('pricing.rates.addNew', 'Add New Rate')}</h3>
                        <div className="flex gap-2 items-center text-sm">
                            <select
                                value={newRateFrom}
                                onChange={(e) => setNewRateFrom(e.target.value as Currency)}
                                className="flex-1 bg-background border outline-none rounded p-1.5"
                                data-testid="rate-from"
                            >
                                <option value="EUR">EUR</option>
                                <option value="USD">USD</option>
                                <option value="RUB">RUB</option>
                                <option value="BYN">BYN</option>
                            </select>
                            <ArrowRight size={14} className="text-muted-foreground shrink-0" />
                            <select
                                value={newRateTo}
                                onChange={(e) => setNewRateTo(e.target.value as Currency)}
                                className="flex-1 bg-background border outline-none rounded p-1.5"
                                data-testid="rate-to"
                            >
                                <option value="RUB">RUB</option>
                                <option value="EUR">EUR</option>
                                <option value="USD">USD</option>
                                <option value="BYN">BYN</option>
                            </select>
                        </div>

                        <div className="flex gap-2 items-center">
                            <input
                                type="number"
                                step="0.000001"
                                min="0"
                                value={newRateValue}
                                onChange={(e) => setNewRateValue(Number(e.target.value))}
                                placeholder={t('pricing.rates.rateValue', 'Rate (e.g. 105)')}
                                className="flex-1 bg-background border outline-none rounded p-1.5 text-sm"
                            />
                            <button
                                onClick={handleAddRate}
                                className="bg-primary text-primary-foreground p-1.5 rounded hover:bg-primary/90 transition-colors"
                                title={t('common.add', 'Add')}
                            >
                                <Plus size={16} />
                            </button>
                        </div>

                        <label className="flex items-center gap-2 text-xs">
                            <input
                                type="checkbox"
                                checked={newRateBothDir}
                                onChange={e => setNewRateBothDir(e.target.checked)}
                            />
                            {t('pricing.rates.bothDirections', 'Create reverse rate automatically (1/x)')}
                        </label>
                    </div>

                    {/* Rates List */}
                    <div className="space-y-2 mt-4 max-h-64 overflow-y-auto pr-1">
                        {rates.length === 0 ? (
                            <p className="text-center text-sm text-muted-foreground py-4">
                                {t('pricing.rates.noRates', 'No exchange rates configured.')}
                            </p>
                        ) : (
                            rates.map((rate) => (
                                <div key={`${rate.currencyFrom}_${rate.currencyTo}`} className="flex justify-between items-center p-3 bg-secondary/10 border rounded-lg text-sm group">
                                    <div className="font-medium flex items-center gap-2">
                                        <span className="bg-background border rounded px-1.5 py-0.5">{rate.currencyFrom}</span>
                                        <ArrowRight size={12} className="text-muted-foreground" />
                                        <span className="bg-background border rounded px-1.5 py-0.5">{rate.currencyTo}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-muted-foreground">x {rate.rate}</span>
                                        <button
                                            onClick={() => handleDeleteRate(rate)}
                                            className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
