import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useGamification, CatalogItem } from '@/hooks/useGamification';

const rarityConfig = {
  common: { label: 'Common', bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', glow: '' },
  rare: { label: 'Rare', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', glow: 'shadow-blue-100' },
  epic: { label: 'Epic', bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', glow: 'shadow-purple-100' },
  legendary: { label: 'Legendary', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', glow: 'shadow-amber-100' },
};

const categoryLabels: Record<string, string> = {
  badge: 'Badges',
  avatar_frame: 'Avatar Frames',
  theme: 'Themes',
};

const ShopPage: React.FC = () => {
  const { setCurrentPage } = useAppContext();
  const { currency, catalog, loading, purchaseItem, equipItem, isOwned, isEquipped, transactions } = useGamification();
  const [activeCategory, setActiveCategory] = useState<'all' | 'badge' | 'avatar_frame' | 'theme'>('all');
  const [activeRarity, setActiveRarity] = useState<'all' | 'common' | 'rare' | 'epic' | 'legendary'>('all');
  const [purchaseModal, setPurchaseModal] = useState<CatalogItem | null>(null);
  const [purchaseResult, setPurchaseResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const purchasableItems = catalog.filter(item => item.is_purchasable);
  const earnableItems = catalog.filter(item => item.is_earnable);

  const filteredItems = purchasableItems.filter(item => {
    if (activeCategory !== 'all' && item.category !== activeCategory) return false;
    if (activeRarity !== 'all' && item.rarity !== activeRarity) return false;
    return true;
  });

  const handlePurchase = async (item: CatalogItem) => {
    const result = await purchaseItem(item);
    setPurchaseResult({
      success: result.success,
      message: result.success ? `You got "${item.name}"!` : result.error || 'Purchase failed',
    });
    setTimeout(() => setPurchaseResult(null), 3000);
    setPurchaseModal(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-teal/20 border-t-teal rounded-full animate-spin" />
          <p className="font-body text-sm text-charcoal/50">Loading shop...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => { setCurrentPage('student'); window.scrollTo({ top: 0 }); }} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors font-body text-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              Back to Dashboard
            </button>
            <button onClick={() => setShowHistory(!showHistory)} className="px-4 py-2 bg-white/15 hover:bg-white/25 rounded-xl font-body text-sm font-semibold transition-all flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              History
            </button>
          </div>

          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6">
            <div>
              <h1 className="font-heading font-bold text-3xl lg:text-4xl mb-2">Reward Shop</h1>
              <p className="font-body text-white/70 max-w-lg">Spend your hard-earned coins on awesome badges, avatar frames, and theme customizations!</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-6 py-4 text-center">
                <div className="flex items-center gap-2 mb-1">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><text x="12" y="16" textAnchor="middle" fill="#92400E" fontSize="10" fontWeight="bold" stroke="none">C</text></svg>
                  <span className="font-heading font-bold text-3xl">{currency.coins}</span>
                </div>
                <p className="font-body text-xs text-white/60">Available Coins</p>
              </div>
              <div className="bg-white/10 rounded-2xl px-4 py-4 text-center">
                <p className="font-heading font-bold text-xl">{currency.total_earned}</p>
                <p className="font-body text-xs text-white/50">Total Earned</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase result toast */}
      {purchaseResult && (
        <div className={`fixed top-20 right-4 z-50 px-6 py-4 rounded-xl shadow-xl animate-fade-in ${purchaseResult.success ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          <div className="flex items-center gap-2">
            {purchaseResult.success ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            )}
            <span className="font-body font-semibold text-sm">{purchaseResult.message}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Transaction History Drawer */}
        {showHistory && (
          <div className="mb-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-lg text-charcoal">Transaction History</h3>
              <button onClick={() => setShowHistory(false)} className="text-charcoal/40 hover:text-charcoal">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            {transactions.length === 0 ? (
              <p className="font-body text-sm text-charcoal/40 text-center py-6">No transactions yet. Start learning to earn coins!</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {transactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-cream/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === 'earned' || tx.type === 'bonus' ? 'bg-green-100' : 'bg-red-100'}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={tx.type === 'earned' || tx.type === 'bonus' ? '#22C55E' : '#EF4444'} strokeWidth="2.5" strokeLinecap="round">
                          {tx.type === 'earned' || tx.type === 'bonus' ? <polyline points="12 19 12 5 M5 12 12 5 19 12"/> : <polyline points="12 5 12 19 M5 12 12 19 19 12"/>}
                        </svg>
                      </div>
                      <div>
                        <p className="font-body text-sm text-charcoal/80">{tx.reason}</p>
                        <p className="font-body text-xs text-charcoal/30">{new Date(tx.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`font-heading font-bold text-sm ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Earned Badges Section */}
        <div className="mb-8">
          <h2 className="font-heading font-bold text-xl text-charcoal mb-4">Earnable Badges</h2>
          <p className="font-body text-sm text-charcoal/50 mb-4">Complete challenges to unlock these badges — no coins needed!</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {earnableItems.map(item => {
              const owned = isOwned(item.id);
              const rarity = rarityConfig[item.rarity];
              return (
                <div key={item.id} className={`relative p-4 rounded-2xl border-2 text-center transition-all ${owned ? `${rarity.border} ${rarity.bg}` : 'border-gray-200 bg-gray-50 opacity-60'}`}>
                  {owned && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  )}
                  <div className="w-10 h-10 mx-auto mb-2 flex items-center justify-center" style={{ color: item.color_primary }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon_path}/></svg>
                  </div>
                  <p className="font-heading font-bold text-xs text-charcoal">{item.name}</p>
                  <p className={`font-body text-[10px] mt-0.5 ${rarity.text}`}>{rarity.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'all' as const, label: 'All Items' },
              { id: 'avatar_frame' as const, label: 'Avatar Frames' },
              { id: 'theme' as const, label: 'Themes' },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-xl font-body text-sm font-semibold transition-all ${
                  activeCategory === cat.id ? 'bg-charcoal text-white' : 'bg-white text-charcoal/60 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'common', 'rare', 'epic', 'legendary'] as const).map(r => (
              <button
                key={r}
                onClick={() => setActiveRarity(r)}
                className={`px-3 py-1.5 rounded-lg font-body text-xs font-semibold transition-all ${
                  activeRarity === r
                    ? r === 'all' ? 'bg-charcoal text-white' : `${rarityConfig[r === 'all' ? 'common' : r].bg} ${rarityConfig[r === 'all' ? 'common' : r].text} ring-2 ring-current`
                    : 'bg-white text-charcoal/40 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {r === 'all' ? 'All' : rarityConfig[r].label}
              </button>
            ))}
          </div>
        </div>

        {/* Shop Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map(item => {
            const owned = isOwned(item.id);
            const equipped = isEquipped(item.id);
            const canAfford = currency.coins >= item.coin_cost;
            const rarity = rarityConfig[item.rarity];

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border-2 overflow-hidden transition-all hover:shadow-lg ${owned ? `${rarity.border}` : 'border-gray-100'} ${rarity.glow && owned ? `shadow-lg ${rarity.glow}` : ''}`}
              >
                {/* Item visual */}
                <div className={`p-6 text-center ${rarity.bg}`} style={{ background: `linear-gradient(135deg, ${item.color_secondary}, white)` }}>
                  <div className="w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${item.color_primary}20` }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={item.color_primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon_path}/></svg>
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-body font-bold ${rarity.bg} ${rarity.text}`}>
                      {rarity.label}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-body font-bold bg-gray-100 text-gray-500">
                      {categoryLabels[item.category]}
                    </span>
                  </div>
                </div>

                {/* Item info */}
                <div className="p-4">
                  <h3 className="font-heading font-bold text-charcoal mb-1">{item.name}</h3>
                  <p className="font-body text-xs text-charcoal/50 mb-4 line-clamp-2">{item.description}</p>

                  {owned ? (
                    <div className="flex gap-2">
                      {item.category !== 'badge' && (
                        <button
                          onClick={() => equipItem(item.id)}
                          className={`flex-1 py-2.5 rounded-xl font-body text-sm font-bold transition-all ${
                            equipped
                              ? 'bg-teal text-white'
                              : 'bg-teal-50 text-teal hover:bg-teal hover:text-white'
                          }`}
                        >
                          {equipped ? 'Equipped' : 'Equip'}
                        </button>
                      )}
                      {item.category === 'badge' && (
                        <div className="flex-1 py-2.5 rounded-xl font-body text-sm font-bold text-center bg-green-50 text-green-700">
                          Owned
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setPurchaseModal(item)}
                      disabled={!canAfford}
                      className={`w-full py-2.5 rounded-xl font-body text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                        canAfford
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 shadow-md hover:shadow-lg'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><text x="12" y="16" textAnchor="middle" fill="#92400E" fontSize="10" fontWeight="bold" stroke="none">C</text></svg>
                      {item.coin_cost}
                      {!canAfford && <span className="text-xs ml-1">(Need {item.coin_cost - currency.coins} more)</span>}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-16">
            <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <p className="font-heading font-bold text-charcoal mb-1">No items found</p>
            <p className="font-body text-sm text-charcoal/40">Try a different filter</p>
          </div>
        )}

        {/* How to earn coins */}
        <div className="mt-12 bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-100">
          <h2 className="font-heading font-bold text-xl text-charcoal mb-6">How to Earn Coins</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Complete a Module', coins: 10, color: '#22C55E' },
              { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: 'Complete a Path', coins: 25, color: '#3B82F6' },
              { icon: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z', label: '7-Day Streak', coins: 30, color: '#F97316' },
              { icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z', label: 'Daily Login', coins: 5, color: '#EAB308' },
            ].map((way, i) => (
              <div key={i} className="p-4 bg-cream rounded-xl text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${way.color}15` }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={way.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={way.icon}/></svg>
                </div>
                <p className="font-heading font-bold text-sm text-charcoal mb-1">{way.label}</p>
                <div className="flex items-center justify-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/></svg>
                  <span className="font-body text-sm font-bold text-amber-600">+{way.coins}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Purchase Confirmation Modal */}
      {purchaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPurchaseModal(null)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-fade-in">
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${purchaseModal.color_primary}15` }}>
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke={purchaseModal.color_primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={purchaseModal.icon_path}/></svg>
              </div>
              <h3 className="font-heading font-bold text-xl text-charcoal mb-1">{purchaseModal.name}</h3>
              <p className="font-body text-sm text-charcoal/50">{purchaseModal.description}</p>
            </div>

            <div className="bg-cream rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="font-body text-sm text-charcoal/60">Cost</span>
                <div className="flex items-center gap-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/></svg>
                  <span className="font-heading font-bold text-charcoal">{purchaseModal.coin_cost}</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="font-body text-sm text-charcoal/60">Your balance</span>
                <span className="font-heading font-bold text-charcoal">{currency.coins}</span>
              </div>
              <hr className="my-2 border-gray-200" />
              <div className="flex items-center justify-between">
                <span className="font-body text-sm font-semibold text-charcoal/80">After purchase</span>
                <span className={`font-heading font-bold ${currency.coins - purchaseModal.coin_cost >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {currency.coins - purchaseModal.coin_cost}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setPurchaseModal(null)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-charcoal font-body font-semibold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePurchase(purchaseModal)}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-body font-bold rounded-xl transition-all shadow-md"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopPage;
