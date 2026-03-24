import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PricingConfigPage from '../PricingConfigPage';
import { configApi } from '../../../api/config';
import { useAuthStore } from '../../../store/useAuthStore';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import '@testing-library/jest-dom';

vi.mock('../../../api/config', () => ({
    configApi: {
        getConfig: vi.fn(),
        getExchangeRates: vi.fn(),
        updateConfig: vi.fn(),
        saveDeliveryRule: vi.fn(),
        deleteDeliveryRule: vi.fn(),
        createOrUpdateExchangeRate: vi.fn(),
        deleteExchangeRate: vi.fn(),
    },
}));

vi.mock('../../../store/useAuthStore', () => ({
    useAuthStore: vi.fn(),
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, fallback: string) => fallback || key,
    }),
}));

const renderWithRouter = (ui: React.ReactNode) => {
    return render(
        <MemoryRouter initialEntries={['/dashboard/pricing-config']}>
            <Routes>
                <Route path="/dashboard/pricing-config" element={ui} />
                <Route path="/products" element={<div>Redirected to Products</div>} />
            </Routes>
        </MemoryRouter>
    );
};

describe('PricingConfigPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('redirects non-admin users', () => {
        (useAuthStore as unknown as any).mockReturnValue({ role: 'USER' });

        renderWithRouter(<PricingConfigPage />);
        expect(screen.getByText('Redirected to Products')).toBeInTheDocument();
    });

    it('loads and displays configuration data for admin', async () => {
        (useAuthStore as unknown as any).mockReturnValue({ role: 'ADMIN' });

        (configApi.getConfig as any).mockResolvedValueOnce({
            markupPercentage: 0.2,
            systemCurrency: 'RUB',
            deliveryCostConfigs: [
                { id: 'rule-1', minimumSum: 0, markupType: 'PERCENTAGE', value: 0.15 }
            ]
        });

        (configApi.getExchangeRates as any).mockResolvedValueOnce([
            { currencyFrom: 'EUR', currencyTo: 'RUB', rate: 105 },
        ]);

        renderWithRouter(<PricingConfigPage />);

        expect(screen.getByText('Loading...')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });

        expect(screen.getByTestId('pricing-config-page')).toBeInTheDocument();

        // Check markup loaded
        expect(screen.getByDisplayValue('20')).toBeInTheDocument();

        // Check rule loaded
        expect(screen.getByText('15%')).toBeInTheDocument();
        expect(screen.getByText(/Minimal cost of the box: 0/)).toBeInTheDocument();

        // Check rates loaded
        expect(screen.getAllByText('EUR').length).toBeGreaterThan(0);
        expect(screen.getByText('x 105')).toBeInTheDocument();
    });

    it('saves global configuration', async () => {
        (useAuthStore as unknown as any).mockReturnValue({ role: 'ADMIN' });

        (configApi.getConfig as any).mockResolvedValue({
            markupPercentage: 0.1,
            systemCurrency: 'RUB',
            deliveryCostConfigs: [],
        });
        (configApi.getExchangeRates as any).mockResolvedValue([]);
        (configApi.updateConfig as any).mockResolvedValue({ success: true });

        renderWithRouter(<PricingConfigPage />);

        await waitFor(() => {
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });

        const btn = screen.getByText('Save Changes');
        fireEvent.click(btn);

        await waitFor(() => {
            expect(configApi.updateConfig).toHaveBeenCalledWith(
                {
                    markupPercentage: 0.1,
                    systemCurrency: 'RUB'
                },
                expect.anything()
            );
        });
    });

    it('allows inline editing of an exchange rate', async () => {
        (useAuthStore as unknown as any).mockReturnValue({ role: 'ADMIN' });

        (configApi.getConfig as any).mockResolvedValue({
            markupPercentage: 0.1,
            systemCurrency: 'RUB',
            deliveryCostConfigs: [],
        });
        (configApi.getExchangeRates as any).mockResolvedValue([
            { currencyFrom: 'EUR', currencyTo: 'RUB', rate: 105 },
        ]);
        (configApi.createOrUpdateExchangeRate as any).mockResolvedValue({ success: true });

        renderWithRouter(<PricingConfigPage />);

        await waitFor(() => {
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });

        // Click the edit button (pencil icon)
        const editBtn = screen.getByTitle('Edit');
        fireEvent.click(editBtn);

        // An input should appear with the current rate
        const rateInput = screen.getByDisplayValue('105');
        expect(rateInput).toBeInTheDocument();

        // Change the rate value
        fireEvent.change(rateInput, { target: { value: '110' } });

        // Click save
        const saveBtn = screen.getByTitle('Save');
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(configApi.createOrUpdateExchangeRate).toHaveBeenCalledWith(
                {
                    currencyFrom: 'EUR',
                    currencyTo: 'RUB',
                    rate: 110,
                    bothDirections: false,
                    replaceExisting: true,
                },
                expect.anything()
            );
        });
    });
    it('deletes a rate via confirm modal', async () => {
        (useAuthStore as unknown as any).mockReturnValue({ role: 'ADMIN' });

        (configApi.getConfig as any).mockResolvedValue({
            markupPercentage: 0.1,
            systemCurrency: 'RUB',
            deliveryCostConfigs: [],
        });
        (configApi.getExchangeRates as any).mockResolvedValue([
            { currencyFrom: 'EUR', currencyTo: 'RUB', rate: 105 },
        ]);
        (configApi.deleteExchangeRate as any).mockResolvedValue({ success: true });

        renderWithRouter(<PricingConfigPage />);

        await waitFor(() => {
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });

        // Click the delete (trash) button to open the modal
        const deleteBtn = screen.getByTitle('Delete');
        fireEvent.click(deleteBtn);

        // The ConfirmModal title should appear
        await waitFor(() => {
            expect(screen.getByText('Delete Exchange Rate')).toBeInTheDocument();
        });

        // Confirm deletion — the button inside the modal reads 'Delete'
        const confirmBtns = screen.getAllByText('Delete');
        fireEvent.click(confirmBtns[confirmBtns.length - 1]);

        await waitFor(() => {
            expect(configApi.deleteExchangeRate).toHaveBeenCalledWith('EUR_RUB', expect.anything());
        });
    });
});
