
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppContext } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';

interface Invoice {
  id: string;
  date: string;
  amount_cents: number;
  status: string;
  description: string;
  test_mode?: boolean;
}

interface Transaction {
  id: string;
  transaction_id: string;
  charge_id: string;
  type: string;
  status: string;
  amount_cents: number;
  plan: string;
  billing_cycle: string;
  card_brand: string;
  card_last4: string;
  description: string;
  failure_reason: string;
  retry_count: number;
  processor: string;
  test_mode: boolean;
  created_at: string;
}

interface BillingData {
  subscription: any;
  invoices: Invoice[];
  transactions: Transaction[];
  payment_method: { brand: string; last4: string } | null;
  test_mode: boolean;
}

const PLAN_NAMES: Record<string, string> = { explorer: 'Explorer', family: 'Family', academy: 'Academy' };

const BillingPage: React.FC = () => {
  const { profile } = useAuth();
  const { setCurrentPage } = useAppContext();
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'transactions'>('overview');

  // Update payment method state
  const [showUpdateCard, setShowUpdateCard] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [updatingCard, setUpdatingCard] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState('');

  useEffect(() => { loadBilling(); }, []);

  const loadBilling = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase.functions.invoke('checkout', {
        body: { action: 'billing-portal' },
      });
      if (err) throw err;
      if (data?.error) throw new Error(data.error);
      setBilling(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load billing data');
    }
    setLoading(false);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 16);
    return v.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 3) return v.slice(0, 2) + '/' + v.slice(2);
    return v;
  };

  const detectCardBrand = (num: string) => {
    if (num.startsWith('4')) return 'visa';
    if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num)) return 'mastercard';
    if (/^3[47]/.test(num)) return 'amex';
    if (num.startsWith('6')) return 'discover';
    return 'card';
  };

  const handleUpdatePayment = async () => {
    const raw = cardNumber.replace(/\s/g, '');
    if (raw.length < 13) return;
    setUpdatingCard(true);
    try {
      const { data, error: err } = await supabase.functions.invoke('checkout', {
        body: {
          action: 'update-payment',
          card_number: raw,
          card_last4: raw.slice(-4),
          card_brand: detectCardBrand(raw),
          card_expiry: cardExpiry,
          card_cvc: cardCvc,
        },
      });
      if (err) throw err;
      if (data?.error) throw new Error(data.error);
      setUpdateSuccess('Payment method updated successfully!');
      setShowUpdateCard(false);
      setCardNumber(''); setCardExpiry(''); setCardCvc(''); setCardName('');
      loadBilling();
      setTimeout(() => setUpdateSuccess(''), 4000);
    } catch (e: any) {
      setError(e.message || 'Failed to update payment method');
    }
    setUpdatingCard(false);
  };

  const generatePdfReceipt = (invoice: Invoice) => {
    const sub = billing?.subscription;
    const planName = PLAN_NAMES[sub?.plan] || sub?.plan || 'FreeLearner';
    const date = new Date(invoice.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const amount = `$${((invoice.amount_cents || 0) / 100).toFixed(2)}`;

    // Generate a simple HTML receipt and open in new window for printing/saving as PDF
    const receiptHtml = `
<!DOCTYPE html>
<html><head><title>Receipt - ${invoice.id}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 40px auto; padding: 40px; color: #1a1a2e; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #0D7377; padding-bottom: 20px; }
  .logo { font-size: 24px; font-weight: 800; color: #0D7377; }
  .logo-sub { font-size: 11px; color: #666; margin-top: 4px; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; }
  .badge-paid { background: #dcfce7; color: #16a34a; }
  .badge-test { background: #fef3c7; color: #d97706; }
  .receipt-title { font-size: 14px; color: #666; text-align: right; }
  .receipt-id { font-size: 11px; color: #999; font-family: monospace; }
  .section { margin: 24px 0; }
  .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #999; font-weight: 700; margin-bottom: 12px; }
  .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
  .row:last-child { border-bottom: none; }
  .row-label { color: #666; font-size: 14px; }
  .row-value { font-weight: 600; font-size: 14px; }
  .total-row { border-top: 2px solid #1a1a2e; padding-top: 12px; margin-top: 12px; }
  .total-value { font-size: 20px; font-weight: 800; color: #0D7377; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 11px; }
  @media print { body { margin: 0; padding: 20px; } }
</style></head><body>
  <div class="header">
    <div>
      <div class="logo">FreeLearner</div>
      <div class="logo-sub">Powered by FamousPay</div>
    </div>
    <div style="text-align: right">
      <div class="receipt-title">Payment Receipt</div>
      <div class="receipt-id">${invoice.id}</div>
      <div style="margin-top: 8px">
        <span class="badge badge-paid">PAID</span>
        ${invoice.test_mode ? '<span class="badge badge-test" style="margin-left: 4px">TEST</span>' : ''}
      </div>
    </div>
  </div>
  <div class="section">
    <div class="section-title">Bill To</div>
    <div style="font-weight: 600">${profile?.full_name || 'Customer'}</div>
    <div style="color: #666; font-size: 13px">${profile?.email || ''}</div>
  </div>
  <div class="section">
    <div class="section-title">Payment Details</div>
    <div class="row"><span class="row-label">Date</span><span class="row-value">${date}</span></div>
    <div class="row"><span class="row-label">Description</span><span class="row-value">${invoice.description}</span></div>
    <div class="row"><span class="row-label">Plan</span><span class="row-value">${planName}</span></div>
    <div class="row"><span class="row-label">Billing Cycle</span><span class="row-value" style="text-transform: capitalize">${sub?.billing_cycle || 'monthly'}</span></div>
    ${billing?.payment_method ? `<div class="row"><span class="row-label">Payment Method</span><span class="row-value" style="text-transform: capitalize">${billing.payment_method.brand} ending in ${billing.payment_method.last4}</span></div>` : ''}
    <div class="row"><span class="row-label">Processor</span><span class="row-value">FamousPay</span></div>
  </div>
  <div class="section">
    <div class="section-title">Amount</div>
    <div class="row"><span class="row-label">Subtotal</span><span class="row-value">${amount}</span></div>
    <div class="row"><span class="row-label">Tax</span><span class="row-value">$0.00</span></div>
    <div class="row total-row"><span class="row-label" style="font-weight: 700; font-size: 16px">Total Charged</span><span class="total-value">${amount}</span></div>
  </div>
  <div class="footer">
    <p>FreeLearner, Inc. &middot; Payments processed by FamousPay</p>
    <p>Transaction ID: ${invoice.id}</p>
    ${invoice.test_mode ? '<p style="color: #d97706; font-weight: 700">TEST MODE - No real charges were made</p>' : ''}
    <p style="margin-top: 12px"><button onclick="window.print()" style="padding: 8px 24px; background: #0D7377; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600">Print / Save as PDF</button></p>
  </div>
</body></html>`;

    const w = window.open('', '_blank');
    if (w) { w.document.write(receiptHtml); w.document.close(); }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      paid: 'bg-green-50 text-green-700 border-green-200',
      succeeded: 'bg-green-50 text-green-700 border-green-200',
      active: 'bg-green-50 text-green-700 border-green-200',
      failed: 'bg-red-50 text-red-700 border-red-200',
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      refunded: 'bg-purple-50 text-purple-700 border-purple-200',
    };
    return styles[status] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getCardIcon = (brand: string) => {
    if (brand === 'visa') return <svg width="32" height="20" viewBox="0 0 28 18"><rect width="28" height="18" rx="3" fill="#1A1F71"/><text x="4" y="12" fill="#F7B600" fontSize="8" fontWeight="bold">VISA</text></svg>;
    if (brand === 'mastercard') return <svg width="32" height="20" viewBox="0 0 28 18"><rect width="28" height="18" rx="3" fill="#2B2B2B"/><circle cx="11" cy="9" r="5" fill="#EB001B" opacity="0.8"/><circle cx="17" cy="9" r="5" fill="#F79E1B" opacity="0.8"/></svg>;
    if (brand === 'amex') return <svg width="32" height="20" viewBox="0 0 28 18"><rect width="28" height="18" rx="3" fill="#006FCF"/><text x="3" y="12" fill="white" fontSize="6" fontWeight="bold">AMEX</text></svg>;
    return <svg width="32" height="20" viewBox="0 0 28 18"><rect width="28" height="18" rx="3" fill="#E5E7EB"/><rect x="4" y="7" width="20" height="2" rx="1" fill="#9CA3AF"/><rect x="4" y="11" width="12" height="2" rx="1" fill="#9CA3AF"/></svg>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin mx-auto" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
          <p className="font-body text-sm text-charcoal/40 mt-3">Loading billing information...</p>
        </div>
      </div>
    );
  }

  const sub = billing?.subscription;
  const nextBilling = sub?.current_period_end ? new Date(sub.current_period_end) : null;
  const daysUntilBilling = nextBilling ? Math.ceil((nextBilling.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button onClick={() => { setCurrentPage('settings' as any); window.scrollTo({ top: 0 }); }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-charcoal/50 hover:text-charcoal">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div className="flex-1">
              <h1 className="font-heading font-bold text-2xl text-charcoal">Billing & Payments</h1>
              <p className="font-body text-sm text-charcoal/50 mt-0.5">Manage your subscription, view invoices, and update payment methods</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              </div>
              <span className="font-heading font-bold text-sm text-indigo-800">FamousPay</span>
              {billing?.test_mode && (
                <span className="font-body text-[10px] text-amber-600 px-1.5 py-0.5 bg-amber-50 rounded border border-amber-200 font-bold">TEST</span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 -mb-px">
            {[
              { id: 'overview' as const, label: 'Overview' },
              { id: 'invoices' as const, label: 'Invoices' },
              { id: 'transactions' as const, label: 'Transaction History' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 font-body text-sm font-semibold border-b-2 transition-all ${
                  activeTab === tab.id ? 'text-teal border-teal' : 'text-charcoal/40 border-transparent hover:text-charcoal/60'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {updateSuccess && (
          <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-100 rounded-xl">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            <span className="font-body text-sm text-green-600">{updateSuccess}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            <span className="font-body text-sm text-red-600">{error}</span>
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Current Plan Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-body text-xs text-charcoal/40 uppercase tracking-wider font-bold">Current Plan</p>
                    <h2 className="font-heading font-bold text-3xl text-charcoal mt-1">{PLAN_NAMES[sub?.plan] || 'Explorer'}</h2>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-body font-bold ${
                        sub?.status === 'active' ? 'bg-green-50 text-green-700' :
                        sub?.status === 'past_due' ? 'bg-red-50 text-red-700' :
                        'bg-gray-50 text-gray-700'
                      }`}>
                        {sub?.status === 'active' ? 'Active' : sub?.status === 'past_due' ? 'Past Due' : sub?.status || 'Active'}
                      </span>
                      {sub?.cancel_at_period_end && (
                        <span className="px-3 py-1 rounded-full text-xs font-body font-bold bg-amber-50 text-amber-700">Cancels at period end</span>
                      )}
                      <span className="font-body text-xs text-charcoal/40 capitalize">{sub?.billing_cycle || 'monthly'} billing</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-heading font-bold text-3xl text-teal">
                      ${((sub?.amount_cents || 0) / 100).toFixed(2)}
                    </p>
                    <p className="font-body text-xs text-charcoal/40">per month</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Billing & Payment Method */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Upcoming Billing */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm text-charcoal">Next Billing Date</h3>
                    <p className="font-body text-xs text-charcoal/40">Upcoming payment schedule</p>
                  </div>
                </div>
                {nextBilling && sub?.amount_cents > 0 ? (
                  <div>
                    <p className="font-heading font-bold text-2xl text-charcoal">
                      {nextBilling.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="font-body text-sm text-charcoal/50 mt-1">
                      {daysUntilBilling !== null && daysUntilBilling > 0
                        ? `${daysUntilBilling} day${daysUntilBilling !== 1 ? 's' : ''} from now`
                        : 'Due today'}
                    </p>
                    <div className="mt-3 p-3 bg-blue-50 rounded-xl">
                      <div className="flex justify-between">
                        <span className="font-body text-xs text-blue-700">Estimated charge</span>
                        <span className="font-heading font-bold text-sm text-blue-800">
                          ${sub.billing_cycle === 'yearly'
                            ? ((sub.amount_cents * 12) / 100).toFixed(2)
                            : ((sub.amount_cents) / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="font-body text-sm text-charcoal/40">No upcoming charges — you're on the free plan.</p>
                )}
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm text-charcoal">Payment Method</h3>
                    <p className="font-body text-xs text-charcoal/40">Card on file for recurring payments</p>
                  </div>
                </div>

                {billing?.payment_method ? (
                  <div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                      {getCardIcon(billing.payment_method.brand)}
                      <div>
                        <p className="font-body font-bold text-sm text-charcoal capitalize">
                          {billing.payment_method.brand} ending in {billing.payment_method.last4}
                        </p>
                        <p className="font-body text-xs text-charcoal/40">Default payment method</p>
                      </div>
                    </div>
                    <button onClick={() => setShowUpdateCard(!showUpdateCard)}
                      className="mt-3 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-body text-sm font-semibold rounded-lg transition-all">
                      {showUpdateCard ? 'Cancel' : 'Update Card'}
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="font-body text-sm text-charcoal/40 mb-3">No payment method on file.</p>
                    <button onClick={() => setShowUpdateCard(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-body text-sm font-semibold rounded-lg transition-all">
                      Add Payment Method
                    </button>
                  </div>
                )}

                {/* Update Card Form */}
                {showUpdateCard && (
                  <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-3">
                    <div>
                      <label className="block font-body text-xs font-semibold text-charcoal/60 mb-1">Card Number</label>
                      <input type="text" value={cardNumber} onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                        placeholder="4242 4242 4242 4242"
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block font-body text-xs font-semibold text-charcoal/60 mb-1">Expiry</label>
                        <input type="text" value={cardExpiry} onChange={e => setCardExpiry(formatExpiry(e.target.value))}
                          placeholder="MM/YY"
                          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                      </div>
                      <div>
                        <label className="block font-body text-xs font-semibold text-charcoal/60 mb-1">CVC</label>
                        <input type="text" value={cardCvc} onChange={e => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="123"
                          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                      </div>
                      <div>
                        <label className="block font-body text-xs font-semibold text-charcoal/60 mb-1">Name</label>
                        <input type="text" value={cardName} onChange={e => setCardName(e.target.value)}
                          placeholder="Name"
                          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                      </div>
                    </div>
                    <button onClick={handleUpdatePayment} disabled={updatingCard || cardNumber.replace(/\s/g, '').length < 13}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-body font-bold text-sm rounded-lg transition-all disabled:opacity-50">
                      {updatingCard ? 'Updating...' : 'Save Payment Method'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Invoices Preview */}
            {billing?.invoices && billing.invoices.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-heading font-bold text-sm text-charcoal">Recent Invoices</h3>
                  <button onClick={() => setActiveTab('invoices')} className="font-body text-xs text-teal font-semibold hover:underline">View All</button>
                </div>
                <div className="divide-y divide-gray-50">
                  {billing.invoices.slice(0, 3).map(inv => (
                    <div key={inv.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        </div>
                        <div>
                          <p className="font-body font-semibold text-sm text-charcoal">{inv.description}</p>
                          <p className="font-body text-xs text-charcoal/40">{new Date(inv.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-heading font-bold text-sm text-charcoal">${((inv.amount_cents || 0) / 100).toFixed(2)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-body font-bold border ${getStatusBadge(inv.status)}`}>{inv.status}</span>
                        <button onClick={() => generatePdfReceipt(inv)} className="p-1.5 hover:bg-gray-100 rounded-lg text-charcoal/30 hover:text-teal transition-all" title="Download Receipt">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* INVOICES TAB */}
        {activeTab === 'invoices' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="font-heading font-bold text-lg text-charcoal">All Invoices</h3>
              <p className="font-body text-sm text-charcoal/50 mt-1">Download receipts for your records</p>
            </div>
            {billing?.invoices && billing.invoices.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {billing.invoices.map(inv => (
                  <div key={inv.id} className="px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center border border-green-100">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                      </div>
                      <div>
                        <p className="font-body font-bold text-sm text-charcoal">{inv.description}</p>
                        <p className="font-body text-xs text-charcoal/40">
                          {new Date(inv.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="font-mono text-[10px] text-charcoal/30 mt-0.5">{inv.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-heading font-bold text-lg text-charcoal">${((inv.amount_cents || 0) / 100).toFixed(2)}</p>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-body font-bold border ${getStatusBadge(inv.status)}`}>
                          {inv.status.toUpperCase()}
                        </span>
                      </div>
                      <button onClick={() => generatePdfReceipt(inv)}
                        className="p-3 bg-teal-50 hover:bg-teal-100 rounded-xl text-teal transition-all" title="Download PDF Receipt">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <p className="font-heading font-bold text-charcoal mb-1">No invoices yet</p>
                <p className="font-body text-sm text-charcoal/40">Invoices will appear here once you subscribe to a paid plan.</p>
              </div>
            )}
          </div>
        )}

        {/* TRANSACTIONS TAB */}
        {activeTab === 'transactions' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="font-heading font-bold text-lg text-charcoal">Transaction History</h3>
              <p className="font-body text-sm text-charcoal/50 mt-1">Complete record of all payment activity</p>
            </div>
            {billing?.transactions && billing.transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-6 py-3 font-body text-xs font-semibold text-charcoal/50 uppercase tracking-wider">Date</th>
                      <th className="text-left px-4 py-3 font-body text-xs font-semibold text-charcoal/50 uppercase tracking-wider">Type</th>
                      <th className="text-left px-4 py-3 font-body text-xs font-semibold text-charcoal/50 uppercase tracking-wider">Description</th>
                      <th className="text-left px-4 py-3 font-body text-xs font-semibold text-charcoal/50 uppercase tracking-wider">Status</th>
                      <th className="text-right px-6 py-3 font-body text-xs font-semibold text-charcoal/50 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {billing.transactions.map(txn => (
                      <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-body text-sm text-charcoal">
                          {new Date(txn.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          <p className="font-body text-[10px] text-charcoal/30">{new Date(txn.created_at).toLocaleTimeString()}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-body font-bold uppercase ${
                            txn.type === 'charge' ? 'bg-blue-50 text-blue-700' :
                            txn.type === 'refund' ? 'bg-purple-50 text-purple-700' :
                            txn.type === 'adjustment' ? 'bg-amber-50 text-amber-700' :
                            'bg-gray-50 text-gray-700'
                          }`}>
                            {txn.type}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-body text-sm text-charcoal">{txn.description || `${txn.plan || ''} subscription`}</p>
                          {txn.card_last4 && <p className="font-body text-[10px] text-charcoal/30 capitalize">{txn.card_brand} ****{txn.card_last4}</p>}
                          {txn.failure_reason && <p className="font-body text-[10px] text-red-500">{txn.failure_reason}</p>}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-body font-bold border ${getStatusBadge(txn.status)}`}>
                            {txn.status}
                          </span>
                          {txn.test_mode && <span className="ml-1 text-[9px] font-bold text-amber-600">TEST</span>}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`font-heading font-bold text-sm ${txn.amount_cents < 0 ? 'text-purple-600' : txn.status === 'failed' ? 'text-red-400 line-through' : 'text-charcoal'}`}>
                            {txn.amount_cents < 0 ? '-' : ''}${(Math.abs(txn.amount_cents || 0) / 100).toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                <p className="font-heading font-bold text-charcoal mb-1">No transactions yet</p>
                <p className="font-body text-sm text-charcoal/40">Payment transactions will appear here once you make a purchase.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingPage;
