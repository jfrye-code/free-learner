
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: { id: string; name: string; monthlyPrice: number; yearlyPrice: number; features: string[] };
  billingCycle: 'monthly' | 'yearly';
  onSuccess: (subscription: any, receipt: any) => void;
  preAppliedDiscount?: { code: string; discount_type: string; discount_value: number; free_months?: number; description?: string } | null;
}

// FamousPay card input component
function FamousPayCardForm({ onSubmit, loading, totalCharge, billingCycle, onCancel }: {
  onSubmit: (cardData: { number: string; expiry: string; cvc: string; name: string }) => void;
  loading: boolean;
  totalCharge: number;
  billingCycle: string;
  onCancel: () => void;
}) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 16);
    return v.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 3) return v.slice(0, 2) + '/' + v.slice(2);
    return v;
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    const rawNum = cardNumber.replace(/\s/g, '');
    if (rawNum.length < 13 || rawNum.length > 16) errs.number = 'Enter a valid card number';
    if (expiry.length < 5) errs.expiry = 'Enter a valid expiry (MM/YY)';
    else {
      const [mm, yy] = expiry.split('/');
      const month = parseInt(mm);
      const year = parseInt('20' + yy);
      const now = new Date();
      if (month < 1 || month > 12) errs.expiry = 'Invalid month';
      else if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) errs.expiry = 'Card expired';
    }
    if (cvc.length < 3) errs.cvc = 'Enter CVC';
    if (!cardName.trim()) errs.name = 'Enter cardholder name';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ number: cardNumber.replace(/\s/g, ''), expiry, cvc, name: cardName });
  };

  const getCardBrand = () => {
    const num = cardNumber.replace(/\s/g, '');
    if (num.startsWith('4')) return 'visa';
    if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num)) return 'mastercard';
    if (num.startsWith('3')) return 'amex';
    if (num.startsWith('6')) return 'discover';
    return null;
  };

  const brand = getCardBrand();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* FamousPay Branding */}
      <div className="flex items-center justify-center gap-2 py-2 px-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
        <div className="w-7 h-7 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
        <span className="font-heading font-bold text-sm text-indigo-800">FamousPay</span>
        <span className="font-body text-[10px] text-indigo-500 ml-1">Secure Checkout</span>
      </div>

      {/* Card Number */}
      <div>
        <label className="block font-body text-xs font-semibold text-charcoal/60 mb-1.5">Card Number</label>
        <div className="relative">
          <input
            type="text"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            placeholder="1234 5678 9012 3456"
            className={`w-full px-4 py-3 pr-12 rounded-xl border font-body text-sm bg-gray-50 focus:outline-none focus:ring-2 transition-all ${
              errors.number ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-indigo-200 focus:border-indigo-400'
            }`}
            autoComplete="cc-number"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {brand === 'visa' && (
              <svg width="28" height="18" viewBox="0 0 28 18"><rect width="28" height="18" rx="3" fill="#1A1F71"/><text x="4" y="12" fill="#F7B600" fontSize="8" fontWeight="bold">VISA</text></svg>
            )}
            {brand === 'mastercard' && (
              <svg width="28" height="18" viewBox="0 0 28 18"><rect width="28" height="18" rx="3" fill="#2B2B2B"/><circle cx="11" cy="9" r="5" fill="#EB001B" opacity="0.8"/><circle cx="17" cy="9" r="5" fill="#F79E1B" opacity="0.8"/></svg>
            )}
            {brand === 'amex' && (
              <svg width="28" height="18" viewBox="0 0 28 18"><rect width="28" height="18" rx="3" fill="#006FCF"/><text x="3" y="12" fill="white" fontSize="6" fontWeight="bold">AMEX</text></svg>
            )}
            {!brand && (
              <svg width="20" height="14" viewBox="0 0 24 16" fill="none" stroke="#D1D5DB" strokeWidth="1.5"><rect x="1" y="1" width="22" height="14" rx="2"/><line x1="1" y1="6" x2="23" y2="6"/></svg>
            )}
          </div>
        </div>
        {errors.number && <p className="font-body text-xs text-red-500 mt-1">{errors.number}</p>}
      </div>

      {/* Expiry + CVC */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-body text-xs font-semibold text-charcoal/60 mb-1.5">Expiry Date</label>
          <input
            type="text"
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            placeholder="MM/YY"
            className={`w-full px-4 py-3 rounded-xl border font-body text-sm bg-gray-50 focus:outline-none focus:ring-2 transition-all ${
              errors.expiry ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-indigo-200 focus:border-indigo-400'
            }`}
            autoComplete="cc-exp"
          />
          {errors.expiry && <p className="font-body text-xs text-red-500 mt-1">{errors.expiry}</p>}
        </div>
        <div>
          <label className="block font-body text-xs font-semibold text-charcoal/60 mb-1.5">CVC</label>
          <input
            type="text"
            value={cvc}
            onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="123"
            className={`w-full px-4 py-3 rounded-xl border font-body text-sm bg-gray-50 focus:outline-none focus:ring-2 transition-all ${
              errors.cvc ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-indigo-200 focus:border-indigo-400'
            }`}
            autoComplete="cc-csc"
          />
          {errors.cvc && <p className="font-body text-xs text-red-500 mt-1">{errors.cvc}</p>}
        </div>
      </div>

      {/* Cardholder Name */}
      <div>
        <label className="block font-body text-xs font-semibold text-charcoal/60 mb-1.5">Cardholder Name</label>
        <input
          type="text"
          value={cardName}
          onChange={(e) => setCardName(e.target.value)}
          placeholder="John Doe"
          className={`w-full px-4 py-3 rounded-xl border font-body text-sm bg-gray-50 focus:outline-none focus:ring-2 transition-all ${
            errors.name ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-indigo-200 focus:border-indigo-400'
          }`}
          autoComplete="cc-name"
        />
        {errors.name && <p className="font-body text-xs text-red-500 mt-1">{errors.name}</p>}
      </div>

      {/* Security badges */}
      <div className="flex items-center justify-center gap-4 py-2">
        <div className="flex items-center gap-1.5 text-charcoal/30">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          <span className="font-body text-[10px]">256-bit SSL</span>
        </div>
        <div className="flex items-center gap-1.5 text-charcoal/30">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span className="font-body text-[10px]">FamousPay Protected</span>
        </div>
        <div className="flex items-center gap-1.5 text-charcoal/30">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span className="font-body text-[10px]">PCI Compliant</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-charcoal font-body font-bold rounded-xl transition-all">
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-heading font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="30 70" /></svg>
              Processing...
            </span>
          ) : (
            `Pay $${totalCharge.toFixed(2)} ${billingCycle === 'yearly' ? '/ year' : '/ month'}`
          )}
        </button>
      </div>

      <p className="font-body text-[11px] text-charcoal/40 text-center leading-relaxed">
        By subscribing, you agree to our Terms of Service. You can cancel anytime from your account settings.
        All paid plans include a 30-day money-back guarantee. Payments processed securely by FamousPay.
      </p>
    </form>
  );
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, plan, billingCycle, onSuccess, preAppliedDiscount }) => {
  const [step, setStep] = useState<'payment' | 'processing' | 'success' | 'error'>('payment');
  const [errorMessage, setErrorMessage] = useState('');
  const [receipt, setReceipt] = useState<any>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Discount code state
  const [showDiscountInput, setShowDiscountInput] = useState(!!preAppliedDiscount);
  const [discountCode, setDiscountCode] = useState(preAppliedDiscount?.code || '');
  const [validatingCode, setValidatingCode] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string; discount_type: string; discount_value: number; free_months?: number; description?: string;
  } | null>(preAppliedDiscount || null);
  const [discountError, setDiscountError] = useState('');

  if (!isOpen) return null;

  const basePrice = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
  const baseTotalCharge = billingCycle === 'yearly' ? plan.yearlyPrice * 12 : plan.monthlyPrice;

  const calculateDiscountedPrice = () => {
    if (!appliedDiscount) return { price: basePrice, total: baseTotalCharge, discountAmount: 0 };
    if (appliedDiscount.discount_type === 'free_access') return { price: 0, total: 0, discountAmount: baseTotalCharge };
    if (appliedDiscount.discount_type === 'percentage') {
      const discountAmount = Math.round(baseTotalCharge * appliedDiscount.discount_value / 100 * 100) / 100;
      const total = Math.max(0, baseTotalCharge - discountAmount);
      return { price: total / (billingCycle === 'yearly' ? 12 : 1), total, discountAmount };
    }
    if (appliedDiscount.discount_type === 'fixed') {
      const discountAmount = Math.min(baseTotalCharge, appliedDiscount.discount_value);
      const total = Math.max(0, baseTotalCharge - discountAmount);
      return { price: total / (billingCycle === 'yearly' ? 12 : 1), total, discountAmount };
    }
    return { price: basePrice, total: baseTotalCharge, discountAmount: 0 };
  };

  const { price, total: totalCharge, discountAmount } = calculateDiscountedPrice();

  const validateDiscount = async () => {
    if (!discountCode.trim()) return;
    setValidatingCode(true);
    setDiscountError('');
    try {
      const { data, error } = await supabase.functions.invoke('manage-discount-codes', {
        body: { action: 'validate', code: discountCode.trim(), plan: plan.id },
      });
      if (error) throw new Error(error.message);
      if (data?.valid) {
        setAppliedDiscount({
          code: discountCode.trim().toUpperCase(), discount_type: data.discount_type,
          discount_value: data.discount_value, free_months: data.free_months, description: data.description,
        });
        setDiscountError('');
      } else {
        setDiscountError(data?.error || 'Invalid code');
        setAppliedDiscount(null);
      }
    } catch (err: any) {
      setDiscountError(err.message || 'Failed to validate code');
      setAppliedDiscount(null);
    }
    setValidatingCode(false);
  };

  const removeDiscount = () => { setAppliedDiscount(null); setDiscountCode(''); setDiscountError(''); };

  const handleFamousPayPayment = async (cardData: { number: string; expiry: string; cvc: string; name: string }) => {
    setPaymentLoading(true);
    setStep('processing');
    try {
      // Redeem discount code if applied
      if (appliedDiscount) {
        await supabase.functions.invoke('manage-discount-codes', {
          body: { action: 'redeem', code: appliedDiscount.code, plan: plan.id, original_amount_cents: Math.round(baseTotalCharge * 100) },
        });
      }

      // Process payment via FamousPay through checkout edge function
      const { data, error } = await supabase.functions.invoke('checkout', {
        body: {
          action: 'create-checkout',
          plan: plan.id,
          billing_cycle: billingCycle,
          card_last4: cardData.number.slice(-4),
          card_brand: getCardBrand(cardData.number),
          cardholder_name: cardData.name,
          payment_processor: 'famouspay',
          discount_code: appliedDiscount?.code || null,
          discounted_amount_cents: appliedDiscount ? Math.round(totalCharge * 100) : null,
        },
      });

      if (error) throw new Error(error.message || 'Payment processing failed');
      if (data?.error) throw new Error(data.error);

      setReceipt(data.receipt);
      setStep('success');
      onSuccess(data.subscription, data.receipt);
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment failed. Please try again.');
      setStep('error');
    }
    setPaymentLoading(false);
  };

  const handleFreeAccess = async () => {
    setStep('processing');
    try {
      if (appliedDiscount) {
        await supabase.functions.invoke('manage-discount-codes', {
          body: { action: 'redeem', code: appliedDiscount.code, plan: plan.id, original_amount_cents: Math.round(baseTotalCharge * 100) },
        });
      }
      const { data, error } = await supabase.functions.invoke('checkout', {
        body: {
          action: 'create-checkout', plan: plan.id, billing_cycle: billingCycle,
          card_last4: null, card_brand: null, payment_processor: 'famouspay',
          discount_code: appliedDiscount?.code, discounted_amount_cents: 0,
        },
      });
      if (error) throw new Error(error.message || 'Subscription failed');
      if (data?.error) throw new Error(data.error);
      setReceipt(data.receipt);
      setStep('success');
      onSuccess(data.subscription, data.receipt);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to activate free access.');
      setStep('error');
    }
  };

  const getCardBrand = (num: string) => {
    if (num.startsWith('4')) return 'visa';
    if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num)) return 'mastercard';
    if (num.startsWith('3')) return 'amex';
    if (num.startsWith('6')) return 'discover';
    return 'card';
  };

  const handleClose = () => {
    setStep('payment');
    setErrorMessage('');
    setReceipt(null);
    setPaymentLoading(false);
    if (!preAppliedDiscount) { setAppliedDiscount(null); setDiscountCode(''); setDiscountError(''); }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="font-heading font-bold text-xl text-charcoal">
              {step === 'success' ? 'Payment Successful!' : step === 'processing' ? 'Processing...' : 'Complete Your Purchase'}
            </h2>
            {step === 'payment' && <p className="font-body text-sm text-charcoal/50 mt-1">Subscribe to {plan.name} plan via FamousPay</p>}
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Processing */}
        {step === 'processing' && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
              <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.2" /><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="font-heading font-bold text-lg text-charcoal mb-2">Processing your payment...</h3>
            <p className="font-body text-sm text-charcoal/50">FamousPay is securely processing your transaction. Please don't close this window.</p>
          </div>
        )}

        {/* Success */}
        {step === 'success' && (
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h3 className="font-heading font-bold text-xl text-charcoal mb-2">Welcome to {plan.name}!</h3>
              <p className="font-body text-sm text-charcoal/50">Your subscription is now active. Payment processed by FamousPay.</p>
            </div>
            {receipt && (
              <div className="bg-cream rounded-xl p-5 mb-6 space-y-3">
                <div className="flex justify-between">
                  <span className="font-body text-sm text-charcoal/60">Plan</span>
                  <span className="font-body text-sm font-semibold text-charcoal">{receipt.plan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-body text-sm text-charcoal/60">Billing</span>
                  <span className="font-body text-sm font-semibold text-charcoal capitalize">{receipt.billing_cycle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-body text-sm text-charcoal/60">Rate</span>
                  <span className="font-body text-sm font-semibold text-charcoal">{receipt.amount}</span>
                </div>
                {appliedDiscount && (
                  <div className="flex justify-between">
                    <span className="font-body text-sm text-green-600">Discount ({appliedDiscount.code})</span>
                    <span className="font-body text-sm font-bold text-green-600">
                      {appliedDiscount.discount_type === 'free_access' ? 'FREE' : `-$${discountAmount.toFixed(2)}`}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-body text-sm text-charcoal/60">Charged today</span>
                  <span className="font-body text-sm font-bold text-teal">{receipt.total_charged}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-body text-sm text-charcoal/60">Next billing</span>
                  <span className="font-body text-sm text-charcoal">{new Date(receipt.next_billing).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-body text-sm text-charcoal/60">Processor</span>
                  <span className="font-body text-sm text-indigo-600 font-semibold">FamousPay</span>
                </div>
              </div>
            )}
            <button onClick={handleClose} className="w-full py-3 bg-teal hover:bg-teal-dark text-white font-body font-bold rounded-xl transition-all">
              Start Exploring
            </button>
          </div>
        )}

        {/* Error */}
        {step === 'error' && (
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              </div>
              <h3 className="font-heading font-bold text-xl text-charcoal mb-2">Payment Failed</h3>
              <p className="font-body text-sm text-red-600">{errorMessage}</p>
            </div>
            <button onClick={() => { setStep('payment'); setErrorMessage(''); }} className="w-full py-3 bg-teal hover:bg-teal-dark text-white font-body font-bold rounded-xl transition-all">
              Try Again
            </button>
          </div>
        )}

        {/* Payment Form */}
        {step === 'payment' && (
          <div className="p-6 space-y-6">
            {/* Order Summary */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-heading font-bold text-charcoal">{plan.name} Plan</p>
                  <p className="font-body text-xs text-charcoal/50 capitalize">{billingCycle} billing</p>
                </div>
                <div className="text-right">
                  {appliedDiscount ? (
                    <div>
                      <p className="font-heading font-bold text-2xl text-charcoal">
                        {appliedDiscount.discount_type === 'free_access' ? (
                          <span className="text-green-600">FREE</span>
                        ) : (
                          <>${price.toFixed(2)}<span className="text-sm font-normal text-charcoal/50">/mo</span></>
                        )}
                      </p>
                      <p className="font-body text-xs text-charcoal/40 line-through">${basePrice}/mo</p>
                    </div>
                  ) : (
                    <p className="font-heading font-bold text-2xl text-charcoal">${basePrice}<span className="text-sm font-normal text-charcoal/50">/mo</span></p>
                  )}
                </div>
              </div>
              {appliedDiscount && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-lg">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span className="font-body text-xs font-semibold text-green-700">
                    Discount applied: {appliedDiscount.discount_type === 'free_access' ? 'Free access' : appliedDiscount.discount_type === 'percentage' ? `${appliedDiscount.discount_value}% off` : `$${appliedDiscount.discount_value} off`}
                  </span>
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-indigo-200/50">
                {appliedDiscount && discountAmount > 0 && (
                  <>
                    <div className="flex justify-between mb-2">
                      <span className="font-body text-sm text-charcoal/60">Original price</span>
                      <span className="font-body text-sm text-charcoal/40 line-through">${baseTotalCharge.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="font-body text-sm text-green-600">Discount ({appliedDiscount.code})</span>
                      <span className="font-body text-sm font-semibold text-green-600">-${discountAmount.toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="font-body text-sm text-charcoal/60">{billingCycle === 'yearly' ? 'Charged today (annual)' : 'Charged today'}</span>
                  <span className="font-heading font-bold text-charcoal">${totalCharge.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Discount Code Section */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <button type="button" onClick={() => setShowDiscountInput(!showDiscountInput)} className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors">
                <span className="font-body text-sm text-charcoal/60 flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                  Have a discount code?
                </span>
                <svg className={`w-4 h-4 text-charcoal/30 transition-transform ${showDiscountInput ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {showDiscountInput && (
                <div className="px-4 pb-4 pt-1">
                  {appliedDiscount ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        <div>
                          <span className="font-heading font-bold text-sm text-green-800">{appliedDiscount.code}</span>
                          <p className="font-body text-xs text-green-600">{appliedDiscount.description || 'Discount applied'}</p>
                        </div>
                      </div>
                      <button type="button" onClick={removeDiscount} className="p-1 hover:bg-green-100 rounded text-green-600 transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input type="text" value={discountCode} onChange={(e) => { setDiscountCode(e.target.value.toUpperCase()); setDiscountError(''); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); validateDiscount(); } }}
                        placeholder="Enter code" className="flex-1 px-3 py-2 rounded-lg border border-gray-200 font-heading font-bold text-sm tracking-wider uppercase bg-cream focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                      <button type="button" onClick={validateDiscount} disabled={validatingCode || !discountCode.trim()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-body text-sm font-semibold rounded-lg transition-all disabled:opacity-50">
                        {validatingCode ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="30 70" /></svg> : 'Apply'}
                      </button>
                    </div>
                  )}
                  {discountError && <p className="font-body text-xs text-red-500 mt-2">{discountError}</p>}
                </div>
              )}
            </div>

            {/* Free access - no payment needed */}
            {appliedDiscount?.discount_type === 'free_access' ? (
              <>
                <div className="p-4 bg-green-50 rounded-xl border border-green-200 text-center">
                  <svg className="mx-auto mb-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <p className="font-heading font-bold text-green-800">No payment required!</p>
                  <p className="font-body text-xs text-green-600 mt-1">
                    Your code grants free access{appliedDiscount.free_months ? ` for ${appliedDiscount.free_months} months` : ''}. Click below to activate.
                  </p>
                </div>
                <button onClick={handleFreeAccess} className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-heading font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg">
                  Activate Free Access
                </button>
              </>
            ) : (
              /* FamousPay Card Form */
              <FamousPayCardForm
                onSubmit={handleFamousPayPayment}
                loading={paymentLoading}
                totalCharge={totalCharge}
                billingCycle={billingCycle}
                onCancel={handleClose}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutModal;
