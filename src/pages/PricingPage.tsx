import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import CheckoutModal from '@/components/CheckoutModal';

interface Subscription {
  plan: string;
  status: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  payment_method_last4?: string;
  payment_method_brand?: string;
  amount_cents?: number;
  billing_cycle?: string;
}


const plans = [
  {
    id: 'explorer',
    name: 'Explorer',
    monthlyPrice: 0,
    yearlyPrice: 0,
    period: '/month',
    description: 'Perfect for trying out FreeLearner',
    features: [
      '1 student profile',
      'Basic AI-guided lessons',
      'Parent dashboard',
      'Community access',
      '5 lessons per week',
      'Basic progress tracking',
    ],
    limitations: [
      'Limited AI interactions',
      'No detailed reports',
      'No curriculum mapping',
    ],
    cta: 'Start Free',
    ctaActive: 'Current Plan',
    popular: false,
    color: 'border-gray-200',
  },
  {
    id: 'family',
    name: 'Family',
    monthlyPrice: 19,
    yearlyPrice: 15,
    period: '/month',
    description: 'Everything your homeschool family needs',
    features: [
      'Up to 3 students',
      'Full AI curriculum engine',
      'Unlimited daily lessons',
      'Detailed progress reports',
      'Standards compliance tracking',
      'Safety & content controls',
      'Priority AI responses',
      'Achievement & reward system',
      'Physical activity breaks',
      'Printable progress reports',
    ],
    limitations: [],
    cta: 'Start Free Trial',
    ctaActive: 'Current Plan',
    popular: true,
    color: 'border-teal',
  },
  {
    id: 'academy',
    name: 'Academy',
    monthlyPrice: 79,
    yearlyPrice: 59,
    period: '/month',
    description: 'For co-ops, learning pods & larger families',
    features: [
      'Everything in Family',
      'Up to 30 student profiles',
      'Educator dashboard',
      'Custom curriculum mapping',
      'Bulk progress reporting',
      'API access',
      'Dedicated support',
      'Admin controls',
      'Multi-family management',
      'Custom standards alignment',
    ],
    limitations: [],
    cta: 'Start Free Trial',
    ctaActive: 'Current Plan',
    popular: false,
    color: 'border-purple-400',
  },
];

const PricingPage: React.FC = () => {

  const { setCurrentPage, setShowLoginModal } = useAppContext();
  const { isAuthenticated, profile } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
  const [showBillingPortal, setShowBillingPortal] = useState(false);
  const [billingData, setBillingData] = useState<any>(null);
  const [cancelling, setCancelling] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Discount code state for pricing page
  const [pricingDiscountCode, setPricingDiscountCode] = useState('');
  const [pricingDiscountValidating, setPricingDiscountValidating] = useState(false);
  const [pricingDiscountError, setPricingDiscountError] = useState('');
  const [pricingAppliedDiscount, setPricingAppliedDiscount] = useState<{
    code: string;
    discount_type: string;
    discount_value: number;
    free_months?: number;
    description?: string;
    applicable_plans?: string[];
  } | null>(null);

  const validatePricingDiscount = async () => {
    if (!pricingDiscountCode.trim()) return;
    setPricingDiscountValidating(true);
    setPricingDiscountError('');
    try {
      const { data, error } = await supabase.functions.invoke('manage-discount-codes', {
        body: { action: 'validate', code: pricingDiscountCode.trim() },
      });
      if (error) throw new Error(error.message);
      if (data?.valid) {
        setPricingAppliedDiscount({
          code: pricingDiscountCode.trim().toUpperCase(),
          discount_type: data.discount_type,
          discount_value: data.discount_value,
          free_months: data.free_months,
          description: data.description,
          applicable_plans: data.applicable_plans,
        });
        setPricingDiscountError('');
      } else {
        setPricingDiscountError(data?.error || 'Invalid code');
        setPricingAppliedDiscount(null);
      }
    } catch (err: any) {
      setPricingDiscountError(err.message || 'Failed to validate');
      setPricingAppliedDiscount(null);
    }
    setPricingDiscountValidating(false);
  };

  useEffect(() => {
    if (isAuthenticated) fetchSubscription();
  }, [isAuthenticated]);


  const fetchSubscription = async () => {
    try {
      const { data } = await supabase.functions.invoke('checkout', {
        body: { action: 'get' },
      });
      if (data?.subscription) setSubscription(data.subscription);
    } catch (err) {
      console.warn('Failed to fetch subscription:', err);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    // Free plan: subscribe directly
    if (planId === 'explorer') {
      setUpgrading(planId);
      try {
        const { data, error } = await supabase.functions.invoke('checkout', {
          body: { action: 'create-checkout', plan: planId, billing_cycle: billingCycle, card_last4: null, card_brand: null },
        });
        if (error) throw error;
        if (data?.subscription) {
          setSubscription(data.subscription);
          setSuccessMessage('Switched to Explorer (Free) plan!');
          setTimeout(() => setSuccessMessage(''), 4000);
        }
      } catch (err) {
        console.error('Subscription error:', err);
      } finally {
        setUpgrading(null);
      }
      return;
    }

    // Paid plans: open checkout modal
    setSelectedPlan(plan);
    setShowCheckout(true);
  };

  const handleCheckoutSuccess = (sub: any, receipt: any) => {
    setSubscription(sub);
    setSuccessMessage(`Welcome to ${sub.plan === 'family' ? 'Family' : 'Academy'} plan! Your subscription is active.`);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      const { data, error } = await supabase.functions.invoke('checkout', {
        body: { action: 'cancel' },
      });
      if (error) throw error;
      if (data?.subscription) setSubscription(data.subscription);
      setSuccessMessage(data?.message || 'Subscription will be cancelled at end of billing period.');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Cancel error:', err);
    }
    setCancelling(false);
  };

  const handleReactivate = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('checkout', {
        body: { action: 'reactivate' },
      });
      if (error) throw error;
      if (data?.subscription) setSubscription(data.subscription);
      setSuccessMessage('Subscription reactivated!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Reactivate error:', err);
    }
  };

  const openBillingPortal = async () => {
    try {
      const { data } = await supabase.functions.invoke('checkout', {
        body: { action: 'billing-portal' },
      });
      setBillingData(data);
      setShowBillingPortal(true);
    } catch (err) {
      console.error('Billing portal error:', err);
    }
  };

  const currentPlan = subscription?.plan || 'explorer';



  const faqs = [
    {
      q: 'Is FreeLearner a complete homeschool curriculum?',
      a: 'Yes! FreeLearner covers all core subjects — math, reading, writing, science, social studies, and more — mapped to your state\'s educational standards. Our AI builds a personalized curriculum around your child\'s interests while ensuring every standard is met. Many families use FreeLearner as their primary curriculum.',
    },
    {
      q: 'Will this work for my state\'s homeschool requirements?',
      a: 'FreeLearner tracks progress against Common Core, NGSS, and state-specific standards. Our parent dashboard provides detailed reports showing which standards have been covered, making it easy to document your child\'s progress for any state reporting requirements.',
    },
    {
      q: 'My child is behind grade level. Can FreeLearner help?',
      a: 'Absolutely. Our AI assesses where your child is and builds a personalized path to bring them up to — and beyond — grade level. Because lessons are built around their interests, kids stay engaged and make faster progress than with traditional methods. Our goal is to get every student 6-12 months ahead.',
    },
    {
      q: 'What if my child has special learning needs?',
      a: 'FreeLearner\'s AI adapts to every learner. It adjusts reading level, pacing, and content style based on how your child responds. Whether your child is gifted, has ADHD, dyslexia, or autism, the AI meets them where they are and builds from there.',
    },
    {
      q: 'Can I switch plans or cancel anytime?',
      a: 'Yes! You can upgrade, downgrade, or cancel at any time. All paid plans come with a 30-day money-back guarantee. Your child\'s learning history and progress are always preserved, even if you downgrade.',
    },
    {
      q: 'How is this different from other online learning platforms?',
      a: 'Most platforms assign the same lessons to every student. FreeLearner starts with your child\'s passions — dinosaurs, cooking, Minecraft, music — and weaves academic standards into topics they actually care about. It\'s the difference between forcing a child to learn and making them want to learn.',
    },
    {
      q: 'Is the AI safe for my child?',
      a: 'Safety is our top priority. Every AI interaction is filtered for age-appropriateness, the AI detects distress signals and alerts emergency contacts, and all conversations are logged for parent review. We\'re COPPA compliant and never share your child\'s data.',
    },
    {
      q: 'What about socialization?',
      a: 'FreeLearner includes community features where homeschool families can connect. Our Academy plan is perfect for co-ops and learning pods. We also encourage physical activity breaks and real-world exploration as part of the learning experience.',
    },
  ];

  const comparisonPoints = [
    { feature: 'Personalized to your child', freeLearner: true, publicSchool: false, traditional: false },
    { feature: 'Follows your child\'s interests', freeLearner: true, publicSchool: false, traditional: false },
    { feature: 'Standards-aligned curriculum', freeLearner: true, publicSchool: true, traditional: true },
    { feature: 'Real-time progress tracking', freeLearner: true, publicSchool: false, traditional: false },
    { feature: 'Adapts to learning pace', freeLearner: true, publicSchool: false, traditional: false },
    { feature: 'Physical activity integration', freeLearner: true, publicSchool: true, traditional: false },
    { feature: 'No homework battles', freeLearner: true, publicSchool: false, traditional: false },
    { feature: 'Parent visibility & control', freeLearner: true, publicSchool: false, traditional: true },
    { feature: 'Works for special needs', freeLearner: true, publicSchool: false, traditional: true },
    { feature: 'Cost per month', freeLearner: '$0-$19', publicSchool: '$0*', traditional: '$100-$300' },
  ];

  return (
    <div className="min-h-screen bg-cream" id="pricing">
      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-green-600 text-white font-body font-semibold rounded-xl shadow-lg flex items-center gap-2 animate-slide-in">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          {successMessage}
        </div>
      )}

      {/* Billing Portal for existing subscribers */}
      {isAuthenticated && currentPlan !== 'explorer' && (
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                </div>
                <div>
                  <p className="font-body text-sm font-semibold text-charcoal">
                    {currentPlan === 'family' ? 'Family' : 'Academy'} Plan
                    {subscription?.cancel_at_period_end && <span className="ml-2 text-xs text-amber-600 font-bold">(Cancelling)</span>}
                  </p>
                  <p className="font-body text-xs text-charcoal/40">
                    {subscription?.payment_method_last4 && `${(subscription.payment_method_brand || 'Card').charAt(0).toUpperCase() + (subscription.payment_method_brand || 'card').slice(1)} ending in ${subscription.payment_method_last4}`}
                    {subscription?.current_period_end && ` · Renews ${new Date(subscription.current_period_end).toLocaleDateString()}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {subscription?.cancel_at_period_end ? (
                  <button onClick={handleReactivate} className="px-4 py-2 bg-teal hover:bg-teal-dark text-white font-body text-sm font-semibold rounded-lg transition-all">
                    Reactivate
                  </button>
                ) : (
                  <button onClick={handleCancelSubscription} disabled={cancelling} className="px-4 py-2 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-charcoal/60 font-body text-sm font-semibold rounded-lg transition-all disabled:opacity-50">
                    {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
                  </button>
                )}
                <button onClick={openBillingPortal} className="px-4 py-2 bg-charcoal/5 hover:bg-charcoal/10 text-charcoal font-body text-sm font-semibold rounded-lg transition-all">
                  Billing Portal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Billing Portal Modal */}
      {showBillingPortal && billingData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowBillingPortal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-heading font-bold text-xl text-charcoal">Billing Portal</h2>
              <button onClick={() => setShowBillingPortal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Current Plan */}
              <div className="bg-teal-50 rounded-xl p-5">
                <p className="font-body text-xs text-teal font-bold uppercase tracking-wider mb-2">Current Plan</p>
                <p className="font-heading font-bold text-xl text-charcoal capitalize">{billingData.subscription?.plan || 'Explorer'}</p>
                <p className="font-body text-sm text-charcoal/50">
                  ${((billingData.subscription?.amount_cents || 0) / 100).toFixed(2)}/mo · {billingData.subscription?.billing_cycle || 'monthly'}
                </p>
              </div>

              {/* Payment Method */}
              {billingData.payment_method && (
                <div>
                  <p className="font-body text-sm font-semibold text-charcoal/70 mb-2">Payment Method</p>
                  <div className="flex items-center gap-3 p-4 bg-cream rounded-xl">
                    <svg width="24" height="16" viewBox="0 0 24 16"><rect width="24" height="16" rx="2" fill="#1A1F71"/><text x="4" y="11" fill="white" fontSize="6" fontWeight="bold">{(billingData.payment_method.brand || 'CARD').toUpperCase()}</text></svg>
                    <span className="font-body text-sm text-charcoal">Ending in {billingData.payment_method.last4}</span>
                  </div>
                </div>
              )}

              {/* Invoices */}
              {billingData.invoices?.length > 0 && (
                <div>
                  <p className="font-body text-sm font-semibold text-charcoal/70 mb-2">Recent Invoices</p>
                  <div className="space-y-2">
                    {billingData.invoices.map((inv: any) => (
                      <div key={inv.id} className="flex items-center justify-between p-3 bg-cream rounded-xl">
                        <div>
                          <p className="font-body text-sm text-charcoal">{inv.description}</p>
                          <p className="font-body text-xs text-charcoal/40">{new Date(inv.date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-body text-sm font-semibold text-charcoal">${(inv.amount_cents / 100).toFixed(2)}</p>
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 font-body text-[10px] font-bold rounded capitalize">{inv.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
          preAppliedDiscount={pricingAppliedDiscount}
        />
      )}



      {/* Hero */}
      <div className="bg-gradient-to-br from-teal via-teal-dark to-charcoal py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-1.5 bg-white/10 rounded-full font-body text-sm text-white/80 mb-4">
            Simple, transparent pricing
          </span>
          <h1 className="font-heading font-bold text-3xl lg:text-5xl text-white mb-4">
            Your Homeschool, Powered by AI
          </h1>
          <p className="font-body text-lg text-white/60 max-w-2xl mx-auto mb-4">
            Whether you're new to homeschooling or looking for something better, FreeLearner gives your child a personalized education that public school can't match.
          </p>
          <p className="font-body text-sm text-white/40 max-w-xl mx-auto mb-8">
            Every plan includes AI-powered personalized learning. Start free, upgrade when you're ready.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3">
            <span className={`font-body text-sm ${billingCycle === 'monthly' ? 'text-white font-bold' : 'text-white/50'}`}>Monthly</span>
            <button
              onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
              className="relative w-14 h-7 bg-white/20 rounded-full transition-all"
            >
              <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform ${billingCycle === 'yearly' ? 'translate-x-7' : 'translate-x-0.5'}`} />
            </button>
            <span className={`font-body text-sm ${billingCycle === 'yearly' ? 'text-white font-bold' : 'text-white/50'}`}>
              Yearly
              <span className="ml-1 px-2 py-0.5 bg-orange/20 text-orange rounded-full text-xs font-bold">Save 20%</span>
            </span>
          </div>
        </div>
      </div>

      {/* Discount Code Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-2 flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                <span className="font-body text-sm font-semibold text-charcoal">Have a promo code?</span>
              </div>
              {pricingAppliedDiscount ? (
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl border border-green-200 flex-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <span className="font-heading font-bold text-sm text-green-800">{pricingAppliedDiscount.code}</span>
                    <span className="font-body text-xs text-green-600 ml-1">
                      {pricingAppliedDiscount.discount_type === 'free_access' ? 'Free access' : pricingAppliedDiscount.discount_type === 'percentage' ? `${pricingAppliedDiscount.discount_value}% off` : `$${pricingAppliedDiscount.discount_value} off`}
                    </span>
                  </div>
                  <button onClick={() => { setPricingAppliedDiscount(null); setPricingDiscountCode(''); }} className="p-2 hover:bg-red-50 rounded-lg text-charcoal/30 hover:text-red-500 transition-all">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 flex-1 w-full sm:w-auto">
                  <input
                    type="text"
                    value={pricingDiscountCode}
                    onChange={(e) => { setPricingDiscountCode(e.target.value.toUpperCase()); setPricingDiscountError(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') validatePricingDiscount(); }}
                    placeholder="Enter discount code"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 font-heading font-bold text-sm tracking-wider uppercase bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30"
                  />
                  <button
                    onClick={validatePricingDiscount}
                    disabled={pricingDiscountValidating || !pricingDiscountCode.trim()}
                    className="px-5 py-2.5 bg-teal hover:bg-teal-dark text-white font-body text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
                  >
                    {pricingDiscountValidating ? 'Checking...' : 'Apply'}
                  </button>
                </div>
              )}
            </div>
            {pricingDiscountError && (
              <p className="font-body text-xs text-red-500 mt-2 ml-7">{pricingDiscountError}</p>
            )}
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan === plan.id;
            const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
            const period = plan.monthlyPrice === 0 ? 'forever' : billingCycle === 'yearly' ? '/month, billed yearly' : '/month';
            const yearlySavings = plan.monthlyPrice > 0 ? (plan.monthlyPrice - plan.yearlyPrice) * 12 : 0;

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl p-6 lg:p-8 border-2 shadow-lg relative transition-all duration-300 hover:shadow-xl ${
                  plan.popular ? 'border-teal shadow-teal/10 md:scale-105' : plan.color
                } ${isCurrentPlan ? 'ring-2 ring-teal/30' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-teal text-white font-body text-xs font-bold rounded-full whitespace-nowrap">
                    Most Popular for Families
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="font-heading font-bold text-xl text-charcoal mb-1">{plan.name}</h3>
                  <p className="font-body text-sm text-charcoal/50 mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="font-heading font-bold text-4xl text-charcoal">${price}</span>
                    <span className="font-body text-sm text-charcoal/40">{period}</span>
                  </div>
                  {billingCycle === 'yearly' && yearlySavings > 0 && (
                    <p className="font-body text-xs text-teal font-semibold mt-1">
                      Save ${yearlySavings}/year
                    </p>
                  )}
                </div>

                <button
                  onClick={() => isCurrentPlan ? null : handleSubscribe(plan.id)}
                  disabled={isCurrentPlan || upgrading === plan.id}
                  className={`w-full py-3 rounded-xl font-body font-bold text-sm transition-all mb-6 ${
                    isCurrentPlan
                      ? 'bg-gray-100 text-charcoal/40 cursor-default'
                      : plan.popular
                        ? 'bg-teal hover:bg-teal-dark text-white shadow-md hover:shadow-lg'
                        : 'bg-charcoal/5 hover:bg-teal hover:text-white text-charcoal'
                  } disabled:opacity-50`}
                >
                  {upgrading === plan.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="30 70" /></svg>
                      Processing...
                    </span>
                  ) : isCurrentPlan ? plan.ctaActive : plan.cta}
                </button>

                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      <span className="font-body text-sm text-charcoal/70">{feature}</span>
                    </li>
                  ))}
                  {plan.limitations.map((lim) => (
                    <li key={lim} className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      <span className="font-body text-sm text-charcoal/40">{lim}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Why Parents Choose FreeLearner */}
        <div className="max-w-5xl mx-auto mb-16">
          <div className="text-center mb-10">
            <span className="inline-block px-3 py-1 bg-orange-50 text-orange text-xs font-body font-bold uppercase tracking-wider rounded-full mb-4">Why Families Switch</span>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-charcoal mb-3">
              Public school wasn't built for every child
            </h2>
            <p className="font-body text-charcoal/50 max-w-2xl mx-auto">
              If your child is bored, anxious, falling behind, or just not thriving — you're not alone. Thousands of families are discovering there's a better way.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
                title: '"My kid actually wants to learn now"',
                desc: 'When lessons start with what your child loves, motivation isn\'t a problem anymore.',
              },
              {
                icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
                title: '"They\'re ahead of their grade now"',
                desc: 'Our AI targets 6-12 months ahead of public school standards — and kids don\'t even notice they\'re accelerating.',
              },
              {
                icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
                title: '"No more anxiety about school"',
                desc: 'No bullying, no social pressure, no test anxiety. Just safe, joyful exploration at their own pace.',
              },
              {
                icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>,
                title: '"I can see exactly what they\'re learning"',
                desc: 'Real-time dashboards show standards coverage, progress, and areas that need attention — no guessing.',
              },
              {
                icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
                title: '"We got our family time back"',
                desc: 'No more homework battles, rushed mornings, or fighting over screen time. Learning happens naturally.',
              },
              {
                icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
                title: '"It works for ALL my kids"',
                desc: 'Different ages, different learning styles, different interests — one platform that adapts to each child individually.',
              },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300 group">
                <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-teal transition-all duration-300 [&_svg]:group-hover:stroke-white">
                  {item.icon}
                </div>
                <h3 className="font-heading font-bold text-sm text-charcoal mb-2">{item.title}</h3>
                <p className="font-body text-sm text-charcoal/50 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison Table */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="text-center mb-8">
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-charcoal mb-3">
              How FreeLearner Compares
            </h2>
            <p className="font-body text-charcoal/50">
              See why families are choosing AI-powered homeschooling
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-6 py-4 font-heading font-bold text-sm text-charcoal">Feature</th>
                    <th className="text-center px-4 py-4 font-heading font-bold text-sm text-teal">FreeLearner</th>
                    <th className="text-center px-4 py-4 font-heading font-bold text-sm text-charcoal/50">Public School</th>
                    <th className="text-center px-4 py-4 font-heading font-bold text-sm text-charcoal/50">Traditional Homeschool</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonPoints.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-6 py-3 font-body text-sm text-charcoal/70">{row.feature}</td>
                      <td className="text-center px-4 py-3">
                        {typeof row.freeLearner === 'boolean' ? (
                          row.freeLearner ? (
                            <svg className="w-5 h-5 text-green-500 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                          ) : (
                            <svg className="w-5 h-5 text-red-300 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          )
                        ) : (
                          <span className="font-body text-sm font-bold text-teal">{row.freeLearner}</span>
                        )}
                      </td>
                      <td className="text-center px-4 py-3">
                        {typeof row.publicSchool === 'boolean' ? (
                          row.publicSchool ? (
                            <svg className="w-5 h-5 text-green-500 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                          ) : (
                            <svg className="w-5 h-5 text-red-300 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          )
                        ) : (
                          <span className="font-body text-sm text-charcoal/50">{row.publicSchool}</span>
                        )}
                      </td>
                      <td className="text-center px-4 py-3">
                        {typeof row.traditional === 'boolean' ? (
                          row.traditional ? (
                            <svg className="w-5 h-5 text-green-500 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                          ) : (
                            <svg className="w-5 h-5 text-red-300 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          )
                        ) : (
                          <span className="font-body text-sm text-charcoal/50">{row.traditional}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
              <p className="font-body text-xs text-charcoal/40">* Public school costs don't include supplies, transportation, lost parent work time, tutoring, or the emotional cost of a struggling child.</p>
            </div>
          </div>
        </div>

        {/* Money-back guarantee banner */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-gradient-to-r from-teal to-teal-dark rounded-2xl p-8 lg:p-12 text-center">
            <div className="w-16 h-16 mx-auto bg-white/20 rounded-2xl flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
            </div>
            <h3 className="font-heading font-bold text-2xl text-white mb-3">30-Day Money-Back Guarantee</h3>
            <p className="font-body text-white/70 max-w-xl mx-auto mb-6">
              Try FreeLearner risk-free. If it's not the right fit for your family, we'll refund every penny — no questions asked. We're that confident your child will love it.
            </p>
            <button
              onClick={() => {
                if (!isAuthenticated) { setShowLoginModal(true); return; }
                handleSubscribe('family');
              }}
              className="px-8 py-4 bg-orange hover:bg-orange-dark text-white font-body font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              Start Your Free Trial Today
            </button>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto pb-16">
          <div className="text-center mb-10">
            <span className="inline-block px-3 py-1 bg-teal-50 text-teal text-xs font-body font-bold uppercase tracking-wider rounded-full mb-4">Common Questions</span>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-charcoal mb-3">
              Questions from Homeschool Parents
            </h2>
            <p className="font-body text-charcoal/50">
              Everything you need to know about making the switch
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                >
                  <h4 className="font-heading font-bold text-sm text-charcoal pr-4">{faq.q}</h4>
                  <svg
                    className={`w-5 h-5 text-charcoal/30 flex-shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4">
                    <p className="font-body text-sm text-charcoal/60 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="max-w-3xl mx-auto pb-20 text-center">
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-charcoal mb-4">
            Ready to give your child the education they deserve?
          </h2>
          <p className="font-body text-charcoal/50 mb-8 max-w-xl mx-auto">
            Join thousands of families who stopped fighting the system and started following their children's curiosity. Your child's love of learning is waiting to be unlocked.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => {
                setCurrentPage('onboarding');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-8 py-4 bg-orange hover:bg-orange-dark text-white font-body font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              Start Free — No Credit Card Required
            </button>
            <button
              onClick={() => {
                setCurrentPage('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => {
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="px-8 py-4 bg-white border-2 border-teal/20 text-teal font-body font-bold rounded-full hover:border-teal/40 hover:bg-teal-50 transition-all duration-300"
            >
              See How It Works
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
