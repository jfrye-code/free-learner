
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useAppContext } from '@/contexts/AppContext';
import CheckoutModal from './CheckoutModal';

interface Subscription {
  plan: string;
  status: string;
  billing_cycle: string;
  amount_cents: number;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  payment_method_last4: string | null;
  payment_method_brand: string | null;
  discount_code: string | null;
  created_at: string;
}

const plans = [
  {
    id: 'explorer',
    name: 'Explorer',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: ['1 student profile', 'Basic AI-guided lessons', 'Parent dashboard', 'Community access', '5 lessons per week'],
    color: 'border-gray-200',
    gradient: 'from-gray-50 to-gray-100',
  },
  {
    id: 'family',
    name: 'Family',
    monthlyPrice: 19,
    yearlyPrice: 15,
    features: ['Up to 3 students', 'Full AI curriculum engine', 'Unlimited daily lessons', 'Detailed progress reports', 'Standards compliance tracking'],
    color: 'border-teal',
    gradient: 'from-teal-50 to-emerald-50',
  },
  {
    id: 'academy',
    name: 'Academy',
    monthlyPrice: 79,
    yearlyPrice: 59,
    features: ['Everything in Family', 'Up to 30 student profiles', 'Educator dashboard', 'Custom curriculum mapping', 'Dedicated support'],
    color: 'border-purple-400',
    gradient: 'from-purple-50 to-indigo-50',
  },
];

const SubscriptionManager: React.FC = () => {
  const { profile } = useAuth();
  const { setCurrentPage } = useAppContext();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [billingHistory, setBillingHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke('checkout', {
        body: { action: 'get' },
      });
      if (data?.subscription) {
        setSubscription(data.subscription);
        setBillingCycle(data.subscription.billing_cycle || 'monthly');
      }
      if (data?.invoices) {
        setBillingHistory(data.invoices);
      }
    } catch (err) {
      console.warn('Failed to fetch subscription:', err);
    }
    setLoading(false);
  };

  const showMsg = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleUpgrade = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    if (planId === 'explorer') {
      handleDowngradeToFree();
      return;
    }

    setSelectedPlan(plan);
    setShowCheckout(true);
  };

  const handleDowngradeToFree = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('checkout', {
        body: { action: 'create-checkout', plan: 'explorer', billing_cycle: 'monthly', card_last4: null, card_brand: null },
      });
      if (error) throw error;
      if (data?.subscription) {
        setSubscription(data.subscription);
        showMsg('Downgraded to Explorer (Free) plan. Your paid features will remain active until the end of your billing period.', 'success');
      }
    } catch (err: any) {
      showMsg(err.message || 'Failed to downgrade', 'error');
    }
  };

  const handleCheckoutSuccess = (sub: any) => {
    setSubscription(sub);
    setShowCheckout(false);
    setSelectedPlan(null);
    showMsg(`Successfully ${currentPlan === 'explorer' ? 'upgraded' : 'changed'} to ${sub.plan} plan!`, 'success');
    fetchSubscription();
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const { data, error } = await supabase.functions.invoke('checkout', {
        body: { action: 'cancel' },
      });
      if (error) throw error;
      if (data?.subscription) setSubscription(data.subscription);
      showMsg('Subscription will be cancelled at the end of your billing period. You can reactivate anytime before then.', 'success');
      setShowCancelConfirm(false);
    } catch (err: any) {
      showMsg(err.message || 'Failed to cancel', 'error');
    }
    setCancelling(false);
  };

  const handleReactivate = async () => {
    setReactivating(true);
    try {
      const { data, error } = await supabase.functions.invoke('checkout', {
        body: { action: 'reactivate' },
      });
      if (error) throw error;
      if (data?.subscription) setSubscription(data.subscription);
      showMsg('Subscription reactivated! Your plan will continue as normal.', 'success');
    } catch (err: any) {
      showMsg(err.message || 'Failed to reactivate', 'error');
    }
    setReactivating(false);
  };

  const currentPlan = subscription?.plan || 'explorer';
  const currentPlanData = plans.find(p => p.id === currentPlan);
  const isFreePlan = currentPlan === 'explorer';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${messageType === 'success' ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
          {messageType === 'success' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          )}
          <span className={`font-body text-sm ${messageType === 'success' ? 'text-green-600' : 'text-red-600'}`}>{message}</span>
        </div>
      )}

      {/* Current Plan Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="font-heading font-bold text-lg text-charcoal">Current Subscription</h2>
          <p className="font-body text-sm text-charcoal/50 mt-1">Manage your FreeLearner subscription plan</p>
        </div>

        <div className="p-6">
          <div className={`bg-gradient-to-r ${currentPlanData?.gradient || 'from-gray-50 to-gray-100'} rounded-xl p-6 border ${currentPlanData?.color || 'border-gray-200'}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-heading font-bold text-xl text-charcoal">{currentPlanData?.name || 'Explorer'} Plan</h3>
                  {subscription?.cancel_at_period_end && (
                    <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 font-body text-xs font-bold rounded-full">Cancelling</span>
                  )}
                  {!subscription?.cancel_at_period_end && subscription?.status === 'active' && !isFreePlan && (
                    <span className="px-2.5 py-0.5 bg-green-100 text-green-700 font-body text-xs font-bold rounded-full">Active</span>
                  )}
                  {isFreePlan && (
                    <span className="px-2.5 py-0.5 bg-gray-200 text-charcoal/50 font-body text-xs font-bold rounded-full">Free</span>
                  )}
                </div>

                {!isFreePlan && subscription && (
                  <div className="space-y-1.5">
                    <p className="font-body text-sm text-charcoal/60">
                      <span className="font-semibold text-charcoal">${((subscription.amount_cents || 0) / 100).toFixed(2)}</span>
                      /{subscription.billing_cycle === 'yearly' ? 'year' : 'month'}
                    </p>
                    {subscription.payment_method_last4 && (
                      <p className="font-body text-xs text-charcoal/40 flex items-center gap-1.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                        {(subscription.payment_method_brand || 'Card').charAt(0).toUpperCase() + (subscription.payment_method_brand || 'card').slice(1)} ending in {subscription.payment_method_last4}
                      </p>
                    )}
                    {subscription.current_period_end && (
                      <p className="font-body text-xs text-charcoal/40">
                        {subscription.cancel_at_period_end ? 'Access until' : 'Next billing'}: {new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                    {subscription.discount_code && (
                      <p className="font-body text-xs text-indigo-600 font-semibold">
                        Discount code applied: {subscription.discount_code}
                      </p>
                    )}
                  </div>
                )}

                {isFreePlan && (
                  <p className="font-body text-sm text-charcoal/50">Basic features with limited AI interactions</p>
                )}
              </div>

              {/* FamousPay badge */}
              {!isFreePlan && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 rounded-lg border border-indigo-100">
                  <div className="w-5 h-5 bg-gradient-to-br from-indigo-600 to-purple-600 rounded flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/></svg>
                  </div>
                  <span className="font-body text-[10px] font-bold text-indigo-700">FamousPay</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mt-5">
              {subscription?.cancel_at_period_end ? (
                <button
                  onClick={handleReactivate}
                  disabled={reactivating}
                  className="px-5 py-2.5 bg-teal hover:bg-teal-dark text-white font-body font-bold text-sm rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {reactivating && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="30 70" /></svg>}
                  Reactivate Subscription
                </button>
              ) : !isFreePlan ? (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-charcoal/60 font-body font-semibold text-sm rounded-xl transition-all"
                >
                  Cancel Subscription
                </button>
              ) : null}

              <button
                onClick={() => { setCurrentPage('pricing'); window.scrollTo({ top: 0 }); }}
                className="px-5 py-2.5 bg-teal/10 hover:bg-teal/20 text-teal font-body font-semibold text-sm rounded-xl transition-all"
              >
                {isFreePlan ? 'Upgrade Plan' : 'Change Plan'}
              </button>
            </div>
          </div>

          {/* Cancel Confirmation */}
          {showCancelConfirm && (
            <div className="mt-4 p-5 bg-red-50 rounded-xl border border-red-200">
              <h4 className="font-heading font-bold text-sm text-red-700 mb-2">Cancel your subscription?</h4>
              <p className="font-body text-xs text-red-600/70 mb-4">
                Your subscription will remain active until the end of your current billing period ({subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : 'N/A'}).
                After that, you'll be downgraded to the free Explorer plan. You can reactivate anytime before then.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-body font-bold text-sm rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {cancelling && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="30 70" /></svg>}
                  {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                </button>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="px-5 py-2.5 bg-white hover:bg-gray-100 text-charcoal/60 font-body font-semibold text-sm rounded-xl border border-gray-200 transition-all"
                >
                  Keep Subscription
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Available Plans */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="font-heading font-bold text-lg text-charcoal">Available Plans</h2>
          <p className="font-body text-sm text-charcoal/50 mt-1">Compare plans and switch anytime</p>
        </div>

        <div className="p-6">
          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className={`font-body text-sm ${billingCycle === 'monthly' ? 'text-charcoal font-bold' : 'text-charcoal/40'}`}>Monthly</span>
            <button
              onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
              className="relative w-12 h-6 bg-gray-200 rounded-full transition-all"
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-teal rounded-full transition-transform shadow-sm ${billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
            <span className={`font-body text-sm ${billingCycle === 'yearly' ? 'text-charcoal font-bold' : 'text-charcoal/40'}`}>
              Yearly <span className="text-teal text-xs font-bold">Save 20%</span>
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const isCurrent = currentPlan === plan.id;
              const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
              const isUpgrade = plans.findIndex(p => p.id === plan.id) > plans.findIndex(p => p.id === currentPlan);
              const isDowngrade = plans.findIndex(p => p.id === plan.id) < plans.findIndex(p => p.id === currentPlan);

              return (
                <div key={plan.id} className={`rounded-xl p-5 border-2 transition-all ${isCurrent ? `${plan.color} bg-gradient-to-br ${plan.gradient}` : 'border-gray-100 hover:border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-heading font-bold text-sm text-charcoal">{plan.name}</h4>
                    {isCurrent && (
                      <span className="px-2 py-0.5 bg-teal text-white font-body text-[10px] font-bold rounded-full">Current</span>
                    )}
                  </div>
                  <p className="font-heading font-bold text-2xl text-charcoal mb-3">
                    ${price}<span className="text-sm font-normal text-charcoal/40">/mo</span>
                  </p>
                  <ul className="space-y-1.5 mb-4">
                    {plan.features.slice(0, 3).map(f => (
                      <li key={f} className="flex items-start gap-1.5">
                        <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        <span className="font-body text-xs text-charcoal/60">{f}</span>
                      </li>
                    ))}
                  </ul>
                  {!isCurrent && (
                    <button
                      onClick={() => handleUpgrade(plan.id)}
                      className={`w-full py-2 rounded-lg font-body font-bold text-xs transition-all ${
                        isUpgrade
                          ? 'bg-teal hover:bg-teal-dark text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-charcoal/60'
                      }`}
                    >
                      {isUpgrade ? 'Upgrade' : 'Downgrade'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Billing History */}
      {billingHistory.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="font-heading font-bold text-lg text-charcoal">Billing History</h2>
            <p className="font-body text-sm text-charcoal/50 mt-1">Recent transactions processed by FamousPay</p>
          </div>
          <div className="p-6">
            <div className="space-y-2">
              {billingHistory.map((inv: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-body text-sm text-charcoal">{inv.description || `${inv.plan} plan`}</p>
                    <p className="font-body text-xs text-charcoal/40">{new Date(inv.date || inv.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-body text-sm font-semibold text-charcoal">${((inv.amount_cents || 0) / 100).toFixed(2)}</p>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 font-body text-[10px] font-bold rounded capitalize">{inv.status || 'paid'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {selectedPlan && (
        <CheckoutModal
          isOpen={showCheckout}
          onClose={() => { setShowCheckout(false); setSelectedPlan(null); }}
          plan={selectedPlan}
          billingCycle={billingCycle}
          onSuccess={handleCheckoutSuccess}
        />
      )}
    </div>
  );
};

export default SubscriptionManager;
