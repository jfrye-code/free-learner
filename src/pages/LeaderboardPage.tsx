import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useGamification, LeaderboardEntry } from '@/hooks/useGamification';

const ageGroups = ['All Ages', '6-8', '9-11', '12-14', '15+'];

const LeaderboardPage: React.FC = () => {
  const { setCurrentPage } = useAppContext();
  const { user, profile } = useAuth();
  const { currency } = useGamification();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'all_time'>('weekly');
  const [ageFilter, setAgeFilter] = useState('All Ages');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userEntry, setUserEntry] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [period, ageFilter, schoolFilter]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('leaderboard_entries')
        .select('*')
        .eq('opted_in', true);

      if (ageFilter !== 'All Ages') {
        query = query.eq('age_group', ageFilter);
      }
      if (schoolFilter.trim()) {
        query = query.ilike('school_name', `%${schoolFilter}%`);
      }

      const orderCol = period === 'weekly' ? 'weekly_coins' : period === 'monthly' ? 'monthly_coins' : 'total_coins';
      query = query.order(orderCol, { ascending: false }).limit(50);

      const { data } = await query;
      if (data) {
        setEntries(data);
        // Find user rank
        if (user?.id) {
          const idx = data.findIndex(e => e.user_id === user.id);
          if (idx !== -1) {
            setUserRank(idx + 1);
            setUserEntry(data[idx]);
          } else {
            setUserRank(null);
            setUserEntry(null);
          }
        }
      }
    } catch (err) {
      console.warn('Leaderboard load error:', err);
    }
    setLoading(false);
  };

  const getCoins = (entry: LeaderboardEntry) => {
    if (period === 'weekly') return entry.weekly_coins;
    if (period === 'monthly') return entry.monthly_coins;
    return entry.total_coins;
  };

  const getMedalColor = (rank: number) => {
    if (rank === 1) return { bg: 'bg-amber-400', text: 'text-amber-900', ring: 'ring-amber-300' };
    if (rank === 2) return { bg: 'bg-gray-300', text: 'text-gray-700', ring: 'ring-gray-200' };
    if (rank === 3) return { bg: 'bg-amber-600', text: 'text-amber-100', ring: 'ring-amber-500' };
    return { bg: 'bg-gray-100', text: 'text-gray-500', ring: '' };
  };

  const topThree = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => { setCurrentPage('student'); window.scrollTo({ top: 0 }); }} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors font-body text-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              Back to Dashboard
            </button>
            {userRank && (
              <div className="px-4 py-2 bg-white/15 rounded-xl font-body text-sm font-semibold">
                Your Rank: #{userRank}
              </div>
            )}
          </div>

          <div className="text-center mb-8">
            <h1 className="font-heading font-bold text-3xl lg:text-4xl mb-2">Leaderboard</h1>
            <p className="font-body text-white/70">See how you stack up against other explorers!</p>

          </div>

          {/* Period Tabs */}
          <div className="flex justify-center gap-2 mb-6">
            {[
              { id: 'weekly' as const, label: 'This Week' },
              { id: 'monthly' as const, label: 'This Month' },
              { id: 'all_time' as const, label: 'All Time' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-5 py-2.5 rounded-xl font-body text-sm font-bold transition-all ${
                  period === p.id ? 'bg-white text-orange-600 shadow-lg' : 'bg-white/15 text-white hover:bg-white/25'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Top 3 Podium */}
          {topThree.length >= 3 && (
            <div className="flex items-end justify-center gap-4 max-w-lg mx-auto">
              {/* 2nd place */}
              <div className="flex-1 text-center">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-white/20 flex items-center justify-center ring-4 ring-gray-300/50">
                  <span className="font-heading font-bold text-xl">{topThree[1].display_name.charAt(0)}</span>
                </div>
                <p className="font-body text-sm font-bold truncate">{topThree[1].display_name}</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/></svg>
                  <span className="font-body text-sm font-bold">{getCoins(topThree[1])}</span>
                </div>
                <div className="mt-2 bg-white/10 rounded-t-xl py-6">
                  <span className="font-heading font-bold text-2xl text-gray-300">2</span>
                </div>
              </div>

              {/* 1st place */}
              <div className="flex-1 text-center">
                <div className="relative">
                  <svg className="absolute -top-6 left-1/2 -translate-x-1/2" width="24" height="24" viewBox="0 0 24 24" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1"><path d="M12 2l2.5 5.5H20l-4.5 3.5 1.5 6L12 14l-5 3 1.5-6L4 7.5h5.5L12 2z"/></svg>
                  <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-white/20 flex items-center justify-center ring-4 ring-amber-300/50">
                    <span className="font-heading font-bold text-2xl">{topThree[0].display_name.charAt(0)}</span>
                  </div>
                </div>
                <p className="font-body text-sm font-bold truncate">{topThree[0].display_name}</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/></svg>
                  <span className="font-body text-sm font-bold">{getCoins(topThree[0])}</span>
                </div>
                <div className="mt-2 bg-white/10 rounded-t-xl py-10">
                  <span className="font-heading font-bold text-2xl text-amber-300">1</span>
                </div>
              </div>

              {/* 3rd place */}
              <div className="flex-1 text-center">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-white/20 flex items-center justify-center ring-4 ring-amber-600/50">
                  <span className="font-heading font-bold text-xl">{topThree[2].display_name.charAt(0)}</span>
                </div>
                <p className="font-body text-sm font-bold truncate">{topThree[2].display_name}</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/></svg>
                  <span className="font-body text-sm font-bold">{getCoins(topThree[2])}</span>
                </div>
                <div className="mt-2 bg-white/10 rounded-t-xl py-4">
                  <span className="font-heading font-bold text-2xl text-amber-600">3</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex gap-2 flex-wrap flex-1">
            {ageGroups.map(ag => (
              <button
                key={ag}
                onClick={() => setAgeFilter(ag)}
                className={`px-3 py-1.5 rounded-lg font-body text-xs font-semibold transition-all ${
                  ageFilter === ag ? 'bg-orange-500 text-white' : 'bg-white text-charcoal/60 hover:bg-orange-50 border border-gray-200'
                }`}
              >
                {ag}
              </button>
            ))}
          </div>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              type="text"
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
              placeholder="Filter by school..."
              className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 w-48"
            />
          </div>
        </div>

        {/* Your position card */}
        {userEntry && (
          <div className="mb-6 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-5 border-2 border-orange-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white font-heading font-bold text-lg">
                #{userRank}
              </div>
              <div className="flex-1">
                <p className="font-heading font-bold text-charcoal">{userEntry.display_name} <span className="text-orange-500">(You)</span></p>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/></svg>
                    <span className="font-body text-sm font-bold text-amber-600">{getCoins(userEntry)}</span>
                  </div>
                  <span className="font-body text-xs text-charcoal/40">{userEntry.modules_completed} modules</span>
                  <div className="flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#F97316"><path d="M12 23c-3.5 0-8-2.5-8-9 0-4 2-7 4-9.5.5-.5 1.5-.3 1.5.5 0 1 .5 2 1.5 2 .5 0 1-.5 1-1 0-2 1-4 2-5.5.5-.5 1.5-.3 1.5.5 0 3 3 5 3 8 0 1-.5 2-1 2.5 1-1 2-2.5 2-4 .3-.5 1-.5 1.3 0C22 10 22 13 22 14c0 6.5-4.5 9-10 9z"/></svg>
                    <span className="font-body text-xs font-bold text-orange">{userEntry.current_streak} streak</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full leaderboard */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="grid grid-cols-12 gap-4 text-xs font-body font-semibold text-charcoal/40 uppercase tracking-wider">
              <span className="col-span-1">Rank</span>
              <span className="col-span-5">Explorer</span>

              <span className="col-span-2 text-center">Coins</span>
              <span className="col-span-2 text-center">Modules</span>
              <span className="col-span-2 text-center">Streak</span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 mx-auto mb-4 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
              <p className="font-body text-sm text-charcoal/40">Loading leaderboard...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-16">
              <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round"><path d="M12 15l-2 5-3-1 1 3h8l1-3-3 1-2-5z M8.21 13.89L7 23l5-3 5 3-1.21-9.12 M12 2a7 7 0 100 14 7 7 0 000-14z"/></svg>
              <h3 className="font-heading font-bold text-charcoal mb-1">No entries yet</h3>
              <p className="font-body text-sm text-charcoal/40 mb-4">Be the first on the leaderboard! Ask a parent to enable it in Parental Controls.</p>
              <button
                onClick={() => { setCurrentPage('student'); window.scrollTo({ top: 0 }); }}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-body font-bold text-sm rounded-xl transition-all"
              >
                Start Learning
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {entries.map((entry, i) => {
                const rank = i + 1;
                const medal = getMedalColor(rank);
                const isUser = entry.user_id === user?.id;

                return (
                  <div
                    key={entry.id}
                    className={`grid grid-cols-12 gap-4 items-center px-6 py-4 transition-all ${
                      isUser ? 'bg-orange-50/50' : 'hover:bg-cream/50'
                    }`}
                  >
                    <div className="col-span-1">
                      {rank <= 3 ? (
                        <div className={`w-8 h-8 rounded-full ${medal.bg} flex items-center justify-center ${medal.ring ? `ring-2 ${medal.ring}` : ''}`}>
                          <span className={`font-heading font-bold text-sm ${medal.text}`}>{rank}</span>
                        </div>
                      ) : (
                        <span className="font-body text-sm font-bold text-charcoal/40 pl-2">{rank}</span>
                      )}
                    </div>
                    <div className="col-span-5 flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center text-white font-body font-bold text-xs flex-shrink-0">
                        {entry.display_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-body text-sm font-semibold text-charcoal truncate">
                          {entry.display_name} {isUser && <span className="text-orange-500">(You)</span>}
                        </p>
                        {entry.school_name && (
                          <p className="font-body text-xs text-charcoal/30 truncate">{entry.school_name}</p>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/></svg>
                        <span className="font-heading font-bold text-sm text-charcoal">{getCoins(entry)}</span>
                      </div>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="font-body text-sm text-charcoal/60">{entry.modules_completed}</span>
                    </div>
                    <div className="col-span-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#F97316"><path d="M12 23c-3.5 0-8-2.5-8-9 0-4 2-7 4-9.5.5-.5 1.5-.3 1.5.5 0 1 .5 2 1.5 2 .5 0 1-.5 1-1 0-2 1-4 2-5.5.5-.5 1.5-.3 1.5.5 0 3 3 5 3 8 0 1-.5 2-1 2.5 1-1 2-2.5 2-4 .3-.5 1-.5 1.3 0C22 10 22 13 22 14c0 6.5-4.5 9-10 9z"/></svg>
                        <span className="font-body text-xs font-bold text-orange">{entry.current_streak}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Privacy notice */}
        <div className="mt-6 bg-blue-50 rounded-xl p-4 flex items-start gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 mt-0.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <div>
            <p className="font-body text-sm font-semibold text-blue-800">Privacy-Safe Leaderboard</p>
            <p className="font-body text-xs text-blue-600 mt-1">
              Only students whose parents have opted in appear on the leaderboard. Display names are chosen by parents and don't reveal real identities. Parents can disable this at any time from Parental Controls.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
