import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { configApi, PriceConfigDto, CurrencyExchangeDto } from '../../api/config';
import { Currency } from '../../api/types';
import toast from 'react-hot-toast';
import { Save, Plus, Trash2, ArrowRight, Settings, Repeat, Pencil, Check, X, RefreshCw, Percent, DollarSign } from 'lucide-react';
import { ConfirmModal } from '../../components/ConfirmModal';

export default function PricingConfigPage() {
    const { t } = useTranslation();
    const user = useAuthStore((state) => state.user);

    const [, setConfig] = useState<PriceConfigDto | null>(null);
    const [rates, setRates] = useState<CurrencyExchangeDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingConfig, setSavingConfig] = useState(false);

    // Form states
    const [deliveryPercentage, setDeliveryPercentage] = useState<string>('0');
    const [markupPercentage, setMarkupPercentage] = useState<string>('0');
    const [systemCurrency, setSystemCurrency] = useState<Currency>('RUB');

    // Rate Form
    const [newRateFrom, setNewRateFrom] = useState<Currency>('EUR');
    const [newRateTo, setNewRateTo] = useState<Currency>('RUB');
    const [newRateValue, setNewRateValue] = useState<string>('1');
    const [newRateBothDir, setNewRateBothDir] = useState(false);

    // Delete confirmation
    const [deleteTarget, setDeleteTarget] = useState<CurrencyExchangeDto | null>(null);
    const [addingRate, setAddingRate] = useState(false);

    // Inline edit state for rates
    const [editingRateKey, setEditingRateKey] = useState<string | null>(null);
    const [editRateValue, setEditRateValue] = useState<string>('0');
    const [savingRate, setSavingRate] = useState(false);

    const currencyOptions: Currency[] = ['RUB', 'EUR', 'USD', 'BYN'];

    const currencySymbols: Record<string, string> = {
        RUB: '₽',
        EUR: '€',
        USD: '$',
        BYN: 'Br',
    };

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

            setDeliveryPercentage(String(fetchedConfig.deliveryPercentage));
            setMarkupPercentage(String(fetchedConfig.markupPercentage));
            setSystemCurrency(fetchedConfig.currency);

            setLoading(false);
        } catch (error) {
            toast.error(t('pricing.errors.fetchFailed', 'Failed to fetch pricing config'));
            setLoading(false);
        }
    };

    const handleSaveConfig = async () => {
        setSavingConfig(true);
        try {
            await configApi.updateConfig({
                deliveryPercentage: Number(deliveryPercentage),
                markupPercentage: Number(markupPercentage),
                currency: systemCurrency
            });
            toast.success(t('pricing.success.configSaved', 'Configuration saved successfully'));
            fetchData();
        } catch (error) {
            toast.error(t('pricing.errors.saveFailed', 'Failed to save configuration'));
        } finally {
            setSavingConfig(false);
        }
    };

    const handleAddRate = async () => {
        setAddingRate(true);
        try {
            await configApi.createOrUpdateExchangeRate({
                currencyFrom: newRateFrom,
                currencyTo: newRateTo,
                rate: Number(newRateValue),
                bothDirections: newRateBothDir,
                replaceExisting: true
            });
            toast.success(t('pricing.success.rateSaved', 'Rate added successfully'));
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error(t('pricing.errors.saveFailed', 'Failed to add rate'));
        } finally {
            setAddingRate(false);
        }
    };

    const handleDeleteRate = async () => {
        if (!deleteTarget) return;
        try {
            await configApi.deleteExchangeRate(`${deleteTarget.currencyFrom}_${deleteTarget.currencyTo}`);
            toast.success(t('pricing.success.rateDeleted', 'Rate deleted'));
            setDeleteTarget(null);
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error(t('pricing.errors.deleteFailed', 'Failed to delete rate'));
        }
    };

    const startEditRate = (rate: CurrencyExchangeDto) => {
        setEditingRateKey(`${rate.currencyFrom}_${rate.currencyTo}`);
        setEditRateValue(String(rate.rate));
    };

    const cancelEditRate = () => {
        setEditingRateKey(null);
        setEditRateValue('0');
    };

    const handleSaveRate = async (rate: CurrencyExchangeDto) => {
        setSavingRate(true);
        try {
            await configApi.createOrUpdateExchangeRate({
                currencyFrom: rate.currencyFrom,
                currencyTo: rate.currencyTo,
                rate: Number(editRateValue),
                bothDirections: false,
                replaceExisting: true
            });
            toast.success(t('pricing.success.rateSaved', 'Rate updated successfully'));
            setEditingRateKey(null);
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error(t('pricing.errors.saveFailed', 'Failed to update rate'));
        } finally {
            setSavingRate(false);
        }
    };

    if (!user || user.role !== 'ADMIN') {
        return <Navigate to="/products" />;
    }

    if (loading) {
        return <div className="p-8 text-center">{t('common.loading', 'Loading...')}</div>;
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in" data-testid="pricing-config-page">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('pricing.title', 'Pricing Configuration')}</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {t('pricing.subtitle', 'Manage global pricing rules and currency exchange rates.')}
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    className="btn-ghost text-muted-foreground hover:text-foreground"
                    title={t('common.refresh', 'Refresh')}
                >
                    <RefreshCw size={18} />
                </button>
            </div>

            {/* ===== SECTION 1: Global Rules ===== */}
            <div className="card overflow-hidden">
                <div className="px-6 py-4 border-b bg-secondary/30 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Settings size={16} className="text-primary" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">{t('pricing.global.title', 'Global Rules')}</h2>
                        <p className="text-xs text-muted-foreground">{t('pricing.global.description', 'Default percentage markups applied to orders')}</p>
                    </div>
                </div>

                <div className="p-6">
                    {/* Row 1: Delivery Percentage */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 py-4 border-b border-dashed">
                        <div className="sm:w-56 shrink-0">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Percent size={14} className="text-muted-foreground" />
                                {t('pricing.global.deliveryPercentage', 'Delivery Percentage')}
                            </label>
                            <p className="text-xs text-muted-foreground mt-0.5">{t('pricing.global.deliveryDesc', 'Added on top of delivery cost')}</p>
                        </div>
                        <div className="flex-1 max-w-xs">
                            <div className="flex items-center bg-background border rounded-lg px-3 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={deliveryPercentage}
                                    onChange={(e) => setDeliveryPercentage(e.target.value)}
                                    className="flex-1 py-2.5 bg-transparent outline-none border-none text-foreground text-sm"
                                />
                                <span className="text-muted-foreground text-sm font-medium">%</span>
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Markup Percentage */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 py-4 border-b border-dashed">
                        <div className="sm:w-56 shrink-0">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Percent size={14} className="text-muted-foreground" />
                                {t('pricing.global.markupPercentage', 'Markup Percentage')}
                            </label>
                            <p className="text-xs text-muted-foreground mt-0.5">{t('pricing.global.markupDesc', 'Applied to product base price')}</p>
                        </div>
                        <div className="flex-1 max-w-xs">
                            <div className="flex items-center bg-background border rounded-lg px-3 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={markupPercentage}
                                    onChange={(e) => setMarkupPercentage(e.target.value)}
                                    className="flex-1 py-2.5 bg-transparent outline-none border-none text-foreground text-sm"
                                />
                                <span className="text-muted-foreground text-sm font-medium">%</span>
                            </div>
                        </div>
                    </div>

                    {/* Row 3: Default Currency */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 py-4">
                        <div className="sm:w-56 shrink-0">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <DollarSign size={14} className="text-muted-foreground" />
                                {t('pricing.global.systemCurrency', 'Default System Currency')}
                            </label>
                            <p className="text-xs text-muted-foreground mt-0.5">{t('pricing.global.currencyDesc', 'Primary currency for the system')}</p>
                        </div>
                        <div className="flex-1 max-w-xs">
                            <select
                                value={systemCurrency}
                                onChange={(e) => setSystemCurrency(e.target.value as Currency)}
                                className="w-full bg-background border rounded-lg px-3 py-2.5 text-foreground text-sm focus:ring-2 focus:border-primary outline-none transition-all"
                            >
                                {currencyOptions.map((c) => (
                                    <option key={c} value={c}>{currencySymbols[c]} {c}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="pt-4 mt-2 border-t flex justify-end">
                        <button
                            onClick={handleSaveConfig}
                            disabled={savingConfig}
                            className="btn-primary min-w-[140px]"
                        >
                            {savingConfig ? (
                                <RefreshCw size={16} className="animate-spin" />
                            ) : (
                                <Save size={16} />
                            )}
                            {t('common.save', 'Save Changes')}
                        </button>
                    </div>
                </div>
            </div>

            {/* ===== SECTION 2: Exchange Rates ===== */}
            <div className="card overflow-hidden">
                <div className="px-6 py-4 border-b bg-secondary/30 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Repeat size={16} className="text-accent" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">{t('pricing.rates.title', 'Exchange Rates')}</h2>
                        <p className="text-xs text-muted-foreground">{t('pricing.rates.description', 'Currency conversion rates for price calculation')}</p>
                    </div>
                </div>

                {/* Rates Table */}
                <div className="divide-y">
                    {rates.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <Repeat size={32} className="mx-auto text-muted-foreground/40 mb-3" />
                            <p className="text-sm text-muted-foreground">
                                {t('pricing.rates.noRates', 'No exchange rates configured.')}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {t('pricing.rates.addFirst', 'Add your first rate below.')}
                            </p>
                        </div>
                    ) : (
                        rates.map((rate) => {
                            const rateKey = `${rate.currencyFrom}_${rate.currencyTo}`;
                            const isEditing = editingRateKey === rateKey;

                            return (
                                <div
                                    key={rateKey}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-3.5 group hover:bg-secondary/20 transition-colors"
                                >
                                    {/* Currency pair */}
                                    <div className="flex items-center gap-3">
                                        <span className="inline-flex items-center gap-1.5 font-semibold text-sm">
                                            <span className="bg-primary/10 text-primary rounded-md px-2 py-1 text-xs font-bold tracking-wide">
                                                {rate.currencyFrom}
                                            </span>
                                            <ArrowRight size={14} className="text-muted-foreground" />
                                            <span className="bg-primary/10 text-primary rounded-md px-2 py-1 text-xs font-bold tracking-wide">
                                                {rate.currencyTo}
                                            </span>
                                        </span>
                                        <span className="text-xs text-muted-foreground hidden sm:inline">
                                            1 {rate.currencyFrom} = {rate.rate} {rate.currencyTo}
                                        </span>
                                    </div>

                                    {/* Rate value & actions */}
                                    <div className="flex items-center gap-2">
                                        {isEditing ? (
                                            <>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={editRateValue}
                                                    onChange={(e) => setEditRateValue(e.target.value)}
                                                    className="w-32 bg-background border rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleSaveRate(rate);
                                                        if (e.key === 'Escape') cancelEditRate();
                                                    }}
                                                />
                                                <button
                                                    onClick={() => handleSaveRate(rate)}
                                                    disabled={savingRate}
                                                    className="p-1.5 rounded-md bg-success/10 text-success hover:bg-success/20 transition-colors"
                                                    title={t('common.save', 'Save')}
                                                >
                                                    {savingRate ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                                                </button>
                                                <button
                                                    onClick={cancelEditRate}
                                                    className="p-1.5 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                                                    title={t('common.cancel', 'Cancel')}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-sm font-mono font-semibold bg-secondary/50 rounded-md px-3 py-1.5">
                                                    x {rate.rate}
                                                </span>
                                                <button
                                                    onClick={() => startEditRate(rate)}
                                                    className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100"
                                                    title={t('common.edit', 'Edit')}
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(rate)}
                                                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                                                    title={t('common.delete', 'Delete')}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Add New Rate Form */}
                <div className="px-6 py-5 border-t bg-secondary/10">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Plus size={14} className="text-primary" />
                        {t('pricing.rates.addNew', 'Add New Rate')}
                    </h3>

                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                        {/* From currency */}
                        <div className="flex-1 min-w-0">
                            <label className="text-xs text-muted-foreground mb-1 block">{t('pricing.rates.from', 'From')}</label>
                            <select
                                value={newRateFrom}
                                onChange={(e) => setNewRateFrom(e.target.value as Currency)}
                                className="w-full bg-background border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                data-testid="rate-from"
                            >
                                {currencyOptions.map((c) => (
                                    <option key={c} value={c}>{currencySymbols[c]} {c}</option>
                                ))}
                            </select>
                        </div>

                        <ArrowRight size={16} className="text-muted-foreground shrink-0 hidden sm:block mb-2.5" />

                        {/* To currency */}
                        <div className="flex-1 min-w-0">
                            <label className="text-xs text-muted-foreground mb-1 block">{t('pricing.rates.to', 'To')}</label>
                            <select
                                value={newRateTo}
                                onChange={(e) => setNewRateTo(e.target.value as Currency)}
                                className="w-full bg-background border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                data-testid="rate-to"
                            >
                                {currencyOptions.map((c) => (
                                    <option key={c} value={c}>{currencySymbols[c]} {c}</option>
                                ))}
                            </select>
                        </div>

                        {/* Rate value */}
                        <div className="flex-1 min-w-0">
                            <label className="text-xs text-muted-foreground mb-1 block">{t('pricing.rates.rateValue', 'Rate')}</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={newRateValue}
                                onChange={(e) => setNewRateValue(e.target.value)}
                                placeholder={t('pricing.rates.ratePlaceholder', 'e.g. 105')}
                                className="w-full bg-background border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>

                        {/* Add button */}
                        <button
                            onClick={handleAddRate}
                            disabled={addingRate}
                            className="btn-primary shrink-0"
                        >
                            {addingRate ? (
                                <RefreshCw size={16} className="animate-spin" />
                            ) : (
                                <Plus size={16} />
                            )}
                            {t('common.add', 'Add')}
                        </button>
                    </div>

                    {/* Both directions checkbox */}
                    <label className="flex items-center gap-2 mt-3 text-xs text-muted-foreground cursor-pointer select-none group/check">
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={newRateBothDir}
                                onChange={e => setNewRateBothDir(e.target.checked)}
                                className="peer sr-only"
                            />
                            <div className="w-4 h-4 border rounded bg-background peer-checked:bg-primary peer-checked:border-primary transition-colors flex items-center justify-center">
                                {newRateBothDir && <Check size={10} className="text-primary-foreground" />}
                            </div>
                        </div>
                        <span className="group-hover/check:text-foreground transition-colors">
                            {t('pricing.rates.bothDirections', 'Create reverse rate automatically (1/x)')}
                        </span>
                    </label>
                </div>
            </div>

            <ConfirmModal
                isOpen={deleteTarget !== null}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDeleteRate}
                title={t('pricing.confirm.deleteRateTitle', 'Delete Exchange Rate')}
                message={
                    deleteTarget
                        ? t('pricing.confirm.deleteRateMessage', 'Are you sure you want to delete the rate {{from}} → {{to}}?', {
                            from: deleteTarget.currencyFrom,
                            to: deleteTarget.currencyTo
                        })
                        : ''
                }
                confirmText={t('common.delete', 'Delete')}
                isDestructive
            />
        </div>
    );
}
