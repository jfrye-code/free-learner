import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface CatalogItem {
  id: string;
  name: string;
  description: string;
  icon_path: string;
  category: 'badge' | 'avatar_frame' | 'theme';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  coin_cost: number;
  is_purchasable: boolean;
  is_earnable: boolean;
  earn_condition: string | null;
  color_primary: string;
  color_secondary: string;
  sort_order: number;
}

export interface StudentCurrency {
  coins: number;
  total_earned: number;
  total_spent: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
}

export interface OwnedItem {
  item_id: string;
  is_equipped: boolean;
  source: string;
}

export interface CoinTransaction {
  id: string;
  amount: number;
  type: 'earned' | 'spent' | 'bonus';
  reason: string;
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  display_name: string;
  age_group: string;
  school_name: string | null;
  weekly_coins: number;
  monthly_coins: number;
  total_coins: number;
  modules_completed: number;
  current_streak: number;
}

export interface StreakMilestone {
  days: number;
  bonus: number;
  label: string;
}

export interface BadgeEarnedEvent {
  badge: CatalogItem;
  bonusCoins: number;
}

const COIN_REWARDS = {
  module_completed: 10,
  path_completed: 25,
  streak_3: 15,
  streak_7: 30,
  streak_14: 50,
  streak_30: 100,
  first_path: 20,
  daily_login: 5,
  badge_earned: 15,
};

const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 3, bonus: COIN_REWARDS.streak_3, label: '3-Day Streak!' },
  { days: 7, bonus: COIN_REWARDS.streak_7, label: 'Week Warrior!' },
  { days: 14, bonus: COIN_REWARDS.streak_14, label: 'Two-Week Champion!' },
  { days: 30, bonus: COIN_REWARDS.streak_30, label: 'Monthly Legend!' },
];

// Badge condition bonus coins by rarity
const BADGE_BONUS: Record<string, number> = {
  common: 10,
  rare: 25,
  epic: 50,
  legendary: 100,
};

export function useGamification() {
  const { user } = useAuth();
  const [currency, setCurrency] = useState<StudentCurrency>({
    coins: 0, total_earned: 0, total_spent: 0, current_streak: 0, longest_streak: 0, last_activity_date: null,
  });
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [ownedItems, setOwnedItems] = useState<OwnedItem[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<OwnedItem[]>([]);
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Event queues for celebrations (consumed by dashboard)
  const [pendingStreakMilestone, setPendingStreakMilestone] = useState<StreakMilestone | null>(null);
  const [pendingBadgeEarned, setPendingBadgeEarned] = useState<BadgeEarnedEvent | null>(null);

  // Ref to avoid stale closures in earnCoins
  const currencyRef = useRef(currency);
  currencyRef.current = currency;

  const catalogRef = useRef(catalog);
  catalogRef.current = catalog;

  const earnedBadgesRef = useRef(earnedBadges);
  earnedBadgesRef.current = earnedBadges;

  const fetchAll = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      // Fetch catalog
      const { data: catalogData } = await supabase
        .from('badges_catalog')
        .select('*')
        .order('sort_order', { ascending: true });
      if (catalogData) setCatalog(catalogData);

      // Fetch or create currency
      let { data: currData } = await supabase
        .from('student_currency')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!currData) {
        const { data: newCurr } = await supabase
          .from('student_currency')
          .insert({ user_id: user.id, coins: 0, total_earned: 0, total_spent: 0, current_streak: 0, longest_streak: 0 })
          .select()
          .single();
        currData = newCurr;
      }

      if (currData) {
        setCurrency({
          coins: currData.coins,
          total_earned: currData.total_earned,
          total_spent: currData.total_spent,
          current_streak: currData.current_streak || 0,
          longest_streak: currData.longest_streak || 0,
          last_activity_date: currData.last_activity_date || null,
        });
      }

      // Fetch owned inventory
      const { data: invData } = await supabase
        .from('student_inventory')
        .select('item_id, is_equipped')
        .eq('user_id', user.id);
      if (invData) setOwnedItems(invData.map(i => ({ ...i, source: 'purchased' })));

      // Fetch earned badges
      const { data: badgeData } = await supabase
        .from('student_badges')
        .select('badge_id, source')
        .eq('user_id', user.id);
      if (badgeData) setEarnedBadges(badgeData.map(b => ({ item_id: b.badge_id, is_equipped: true, source: b.source })));

      // Fetch recent transactions
      const { data: txData } = await supabase
        .from('coin_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (txData) setTransactions(txData);
    } catch (err) {
      console.warn('Gamification fetch error:', err);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── EARN COINS ───────────────────────────────────────────
  const earnCoins = useCallback(async (amount: number, reason: string, type: 'earned' | 'bonus' = 'earned', metadata?: any) => {
    if (!user?.id) return;
    try {
      const cur = currencyRef.current;
      const newCoins = cur.coins + amount;
      const newTotalEarned = cur.total_earned + amount;
      await supabase
        .from('student_currency')
        .update({
          coins: newCoins,
          total_earned: newTotalEarned,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      // Log transaction
      await supabase.from('coin_transactions').insert({
        user_id: user.id,
        amount,
        type,
        reason,
        metadata: metadata || {},
      });

      // Update leaderboard (if exists)
      const { data: existingEntry } = await supabase
        .from('leaderboard_entries')
        .select('weekly_coins, monthly_coins, total_coins, modules_completed')
        .eq('user_id', user.id)
        .single();

      if (existingEntry) {
        await supabase.from('leaderboard_entries')
          .update({
            total_coins: (existingEntry.total_coins || 0) + amount,
            weekly_coins: (existingEntry.weekly_coins || 0) + amount,
            monthly_coins: (existingEntry.monthly_coins || 0) + amount,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
      }

      setCurrency(prev => ({ ...prev, coins: newCoins, total_earned: newTotalEarned }));
    } catch (err) {
      console.warn('Earn coins error:', err);
    }
  }, [user?.id]);

  // ─── SPEND COINS ──────────────────────────────────────────
  const spendCoins = useCallback(async (amount: number, reason: string) => {
    if (!user?.id || currencyRef.current.coins < amount) return false;
    try {
      const cur = currencyRef.current;
      const newCoins = cur.coins - amount;
      const newTotalSpent = cur.total_spent + amount;
      await supabase
        .from('student_currency')
        .update({
          coins: newCoins,
          total_spent: newTotalSpent,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      await supabase.from('coin_transactions').insert({
        user_id: user.id,
        amount: -amount,
        type: 'spent',
        reason,
      });

      setCurrency(prev => ({ ...prev, coins: newCoins, total_spent: newTotalSpent }));
      return true;
    } catch (err) {
      console.warn('Spend coins error:', err);
      return false;
    }
  }, [user?.id]);

  // ─── STREAK TRACKING ─────────────────────────────────────
  const updateStreak = useCallback(async (): Promise<StreakMilestone | null> => {
    if (!user?.id) return null;
    try {
      // Get current currency state from DB to avoid stale data
      const { data: freshCurrency } = await supabase
        .from('student_currency')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!freshCurrency) return null;

      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const lastDate = freshCurrency.last_activity_date;

      // Already logged activity today
      if (lastDate === today) {
        return null;
      }

      let newStreak = 1;
      let hitMilestone: StreakMilestone | null = null;

      if (lastDate) {
        const lastDateObj = new Date(lastDate + 'T00:00:00Z');
        const todayObj = new Date(today + 'T00:00:00Z');
        const diffDays = Math.floor((todayObj.getTime() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Consecutive day — increment streak
          newStreak = (freshCurrency.current_streak || 0) + 1;
        } else if (diffDays === 0) {
          // Same day, shouldn't reach here but safety
          return null;
        } else {
          // Streak broken — reset to 1
          newStreak = 1;
        }
      }

      const newLongest = Math.max(newStreak, freshCurrency.longest_streak || 0);

      // Update DB
      await supabase
        .from('student_currency')
        .update({
          current_streak: newStreak,
          longest_streak: newLongest,
          last_activity_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      // Update leaderboard streak
      await supabase
        .from('leaderboard_entries')
        .update({ current_streak: newStreak, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      // Update local state
      setCurrency(prev => ({
        ...prev,
        current_streak: newStreak,
        longest_streak: newLongest,
        last_activity_date: today,
      }));

      // Check for milestone bonuses
      for (const milestone of STREAK_MILESTONES) {
        if (newStreak === milestone.days) {
          // Award bonus coins
          await earnCoins(milestone.bonus, `Streak milestone: ${milestone.label}`, 'bonus', { streak: newStreak });
          hitMilestone = milestone;
          break;
        }
      }

      return hitMilestone;
    } catch (err) {
      console.warn('Streak update error:', err);
      return null;
    }
  }, [user?.id, earnCoins]);

  // ─── BADGE CONDITION CHECKERS ─────────────────────────────
  const checkBadgeCondition = useCallback(async (condition: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      switch (condition) {
        case 'complete_first_path': {
          const { count } = await supabase
            .from('learning_paths')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .not('completed_at', 'is', null);
          return (count || 0) >= 1;
        }

        case 'complete_5_science': {
          const { data } = await supabase
            .from('activity_log')
            .select('subject_tags')
            .eq('user_id', user.id)
            .eq('action_type', 'module_completed');
          const scienceCount = (data || []).filter(a =>
            (a.subject_tags || []).some((t: string) => t.toLowerCase() === 'science')
          ).length;
          return scienceCount >= 5;
        }

        case 'complete_5_math': {
          const { data } = await supabase
            .from('activity_log')
            .select('subject_tags')
            .eq('user_id', user.id)
            .eq('action_type', 'module_completed');
          const mathCount = (data || []).filter(a =>
            (a.subject_tags || []).some((t: string) => t.toLowerCase() === 'math')
          ).length;
          return mathCount >= 5;
        }

        case 'complete_5_history': {
          const { data } = await supabase
            .from('activity_log')
            .select('subject_tags')
            .eq('user_id', user.id)
            .eq('action_type', 'module_completed');
          const historyCount = (data || []).filter(a =>
            (a.subject_tags || []).some((t: string) => t.toLowerCase() === 'history')
          ).length;
          return historyCount >= 5;
        }

        case 'streak_7': {
          const { data } = await supabase
            .from('student_currency')
            .select('current_streak')
            .eq('user_id', user.id)
            .single();
          return (data?.current_streak || 0) >= 7;
        }

        case 'streak_30': {
          const { data } = await supabase
            .from('student_currency')
            .select('current_streak')
            .eq('user_id', user.id)
            .single();
          return (data?.current_streak || 0) >= 30;
        }

        case 'complete_5_subjects': {
          const { data } = await supabase
            .from('activity_log')
            .select('subject_tags')
            .eq('user_id', user.id)
            .eq('action_type', 'module_completed');
          const allSubjects = new Set<string>();
          (data || []).forEach(a => {
            (a.subject_tags || []).forEach((t: string) => allSubjects.add(t.toLowerCase()));
          });
          return allSubjects.size >= 5;
        }

        case 'complete_50_modules': {
          const { count } = await supabase
            .from('activity_log')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('action_type', 'module_completed');
          return (count || 0) >= 50;
        }

        default:
          return false;
      }
    } catch (err) {
      console.warn('Badge condition check error:', err);
      return false;
    }
  }, [user?.id]);

  // ─── AUTO BADGE EARNING ───────────────────────────────────
  const checkAndAwardBadges = useCallback(async (): Promise<BadgeEarnedEvent | null> => {
    if (!user?.id) return null;

    try {
      const currentCatalog = catalogRef.current;
      const currentEarned = earnedBadgesRef.current;
      const earnableBadges = currentCatalog.filter(b => b.is_earnable && b.earn_condition);

      for (const badge of earnableBadges) {
        // Skip if already earned
        if (currentEarned.some(e => e.item_id === badge.id)) continue;

        const conditionMet = await checkBadgeCondition(badge.earn_condition!);
        if (!conditionMet) continue;

        // Award the badge!
        const { error: insertError } = await supabase.from('student_badges').insert({
          user_id: user.id,
          badge_id: badge.id,
          source: 'earned',
        });

        if (insertError) {
          // Might be duplicate, skip
          if (insertError.code === '23505') continue;
          console.warn('Badge insert error:', insertError);
          continue;
        }

        // Award bonus coins based on rarity
        const bonusCoins = BADGE_BONUS[badge.rarity] || 15;
        await earnCoins(bonusCoins, `Badge earned: ${badge.name}`, 'bonus', { badge_name: badge.name, badge_id: badge.id });

        // Log activity
        await supabase.from('activity_log').insert({
          user_id: user.id,
          action_type: 'badge_earned',
          metadata: { badge: badge.name, badge_id: badge.id, rarity: badge.rarity, bonus_coins: bonusCoins },
          subject_tags: [],
          duration_seconds: 0,
        });

        // Update local state
        setEarnedBadges(prev => [...prev, { item_id: badge.id, is_equipped: true, source: 'earned' }]);

        // Return the first newly earned badge for celebration
        return { badge, bonusCoins };
      }

      return null;
    } catch (err) {
      console.warn('Badge check error:', err);
      return null;
    }
  }, [user?.id, checkBadgeCondition, earnCoins]);

  // ─── MODULE COMPLETION HANDLER (combines streak + badge checks) ───
  const onModuleCompleted = useCallback(async (): Promise<{
    streakMilestone: StreakMilestone | null;
    badgeEarned: BadgeEarnedEvent | null;
  }> => {
    // Update streak first
    const streakMilestone = await updateStreak();

    // Then check badges (after streak is updated, so streak badges can trigger)
    const badgeEarned = await checkAndAwardBadges();

    // Update leaderboard modules_completed
    if (user?.id) {
      const { data: entry } = await supabase
        .from('leaderboard_entries')
        .select('modules_completed')
        .eq('user_id', user.id)
        .single();
      if (entry) {
        await supabase.from('leaderboard_entries')
          .update({ modules_completed: (entry.modules_completed || 0) + 1, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
      }
    }

    if (streakMilestone) setPendingStreakMilestone(streakMilestone);
    if (badgeEarned) setPendingBadgeEarned(badgeEarned);

    return { streakMilestone, badgeEarned };
  }, [updateStreak, checkAndAwardBadges, user?.id]);

  // ─── PURCHASE ITEM ────────────────────────────────────────
  const purchaseItem = useCallback(async (item: CatalogItem) => {
    if (!user?.id) return { success: false, error: 'Not logged in' };
    if (currencyRef.current.coins < item.coin_cost) return { success: false, error: 'Not enough coins' };

    const alreadyOwned = ownedItems.some(o => o.item_id === item.id) || earnedBadgesRef.current.some(o => o.item_id === item.id);
    if (alreadyOwned) return { success: false, error: 'Already owned' };

    const spent = await spendCoins(item.coin_cost, `Purchased ${item.name}`);
    if (!spent) return { success: false, error: 'Transaction failed' };

    try {
      if (item.category === 'badge') {
        await supabase.from('student_badges').insert({
          user_id: user.id,
          badge_id: item.id,
          source: 'purchased',
        });
        setEarnedBadges(prev => [...prev, { item_id: item.id, is_equipped: true, source: 'purchased' }]);
      } else {
        await supabase.from('student_inventory').insert({
          user_id: user.id,
          item_id: item.id,
          is_equipped: false,
        });
        setOwnedItems(prev => [...prev, { item_id: item.id, is_equipped: false, source: 'purchased' }]);
      }
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || 'Purchase failed' };
    }
  }, [user?.id, ownedItems, spendCoins]);

  // ─── EQUIP ITEM ───────────────────────────────────────────
  const equipItem = useCallback(async (itemId: string) => {
    if (!user?.id) return;
    const item = catalogRef.current.find(c => c.id === itemId);
    if (!item) return;

    try {
      const sameCategory = catalogRef.current.filter(c => c.category === item.category).map(c => c.id);
      for (const oid of sameCategory) {
        await supabase.from('student_inventory')
          .update({ is_equipped: false })
          .eq('user_id', user.id)
          .eq('item_id', oid);
      }
      await supabase.from('student_inventory')
        .update({ is_equipped: true })
        .eq('user_id', user.id)
        .eq('item_id', itemId);

      setOwnedItems(prev => prev.map(o => ({
        ...o,
        is_equipped: o.item_id === itemId ? true : sameCategory.includes(o.item_id) ? false : o.is_equipped,
      })));
    } catch (err) {
      console.warn('Equip error:', err);
    }
  }, [user?.id]);

  const isOwned = useCallback((itemId: string) => {
    return ownedItems.some(o => o.item_id === itemId) || earnedBadges.some(o => o.item_id === itemId);
  }, [ownedItems, earnedBadges]);

  const isEquipped = useCallback((itemId: string) => {
    return ownedItems.some(o => o.item_id === itemId && o.is_equipped);
  }, [ownedItems]);

  const clearStreakMilestone = useCallback(() => setPendingStreakMilestone(null), []);
  const clearBadgeEarned = useCallback(() => setPendingBadgeEarned(null), []);

  // Get next streak milestone info
  const getNextMilestone = useCallback((): StreakMilestone | null => {
    const cur = currencyRef.current.current_streak;
    return STREAK_MILESTONES.find(m => m.days > cur) || null;
  }, []);

  return {
    currency,
    catalog,
    ownedItems,
    earnedBadges,
    transactions,
    loading,
    earnCoins,
    spendCoins,
    purchaseItem,
    equipItem,
    isOwned,
    isEquipped,
    refresh: fetchAll,
    COIN_REWARDS,
    STREAK_MILESTONES,
    // Streak & Badge systems
    updateStreak,
    checkAndAwardBadges,
    onModuleCompleted,
    getNextMilestone,
    // Celebration events
    pendingStreakMilestone,
    pendingBadgeEarned,
    clearStreakMilestone,
    clearBadgeEarned,
  };
}
