'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ReloopBuzz } from '@/components/home/ReloopBuzz';

import { useAuth } from '@/lib/contexts/AuthContext';
import { StreakBadge } from '@/components/ui/StreakBadge';
import { StoriesBar } from '@/components/ui/StoriesBar';
import { User } from '@/types';
import DemoManager from '@/lib/demo-manager';
import { DBService } from '@/lib/firebase/db';
import { formatRupeeValue } from '@/lib/eco-coins';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 }
  }
};

export default function HomePage() {
  const { user, isLoading, isDemo } = useAuth();
  const router = useRouter();
  const [streak, setStreak] = useState(1);
  const [userRank, setUserRank] = useState(12); // Default fallback
  const [totalUsers, setTotalUsers] = useState(50);
  const [percentile, setPercentile] = useState(75);
  const [rankChange, setRankChange] = useState(0);

  useEffect(() => {
    setStreak(user?.badges?.length || 1);
  }, [user]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Fetch user rank from Firebase
  useEffect(() => {
    const fetchRank = async () => {
      if (isDemo || !user?.uid) {
        // Demo mode fallback
        setUserRank(12);
        setTotalUsers(50);
        setPercentile(75);
        return;
      }

      try {
        const rankData = await DBService.getUserRank(user.uid);
        if (rankData) {
          const prevRank = typeof window !== 'undefined'
            ? parseInt(localStorage.getItem('reloop_prev_rank') || String(rankData.rank))
            : rankData.rank;

          setUserRank(rankData.rank);
          setTotalUsers(rankData.total);
          setPercentile(rankData.percentile);
          setRankChange(prevRank - rankData.rank);

          if (typeof window !== 'undefined') {
            localStorage.setItem('reloop_prev_rank', rankData.rank.toString());
          }
        }
      } catch (error) {
        console.error('Error fetching user rank:', error);
      }
    };

    fetchRank();
  }, [user?.uid, isDemo]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-b from-sky-200 to-white dark:from-dark-bg dark:to-dark-surface pb-28"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header - Compact */}
      <motion.header className="sticky top-0 z-40 bg-sky-200/95 dark:bg-dark-bg/95 backdrop-blur-md px-5 py-3 border-b-2 border-transparent" variants={itemVariants}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black uppercase italic tracking-tighter text-dark dark:text-white">ReLoop</h1>
            <div className="flex items-center gap-2 bg-white dark:bg-dark-surface neo-border rounded-full px-3 py-1 shadow-brutal-sm">
              <StreakBadge streak={streak} />
              <div className="w-px h-3 bg-gray-300 dark:bg-gray-600" />
              <span className="text-xs font-black text-primary">⚡ {user.xp}</span>
              <div className="w-px h-3 bg-gray-300 dark:bg-gray-600" />
              <span className="text-xs font-black text-amber-500">🪙 {user.coins} ({formatRupeeValue(user.coins)})</span>
            </div>
          </div>
          <Link href="/profile" className="relative group">
            <div className="w-11 h-11 rounded-full neo-border overflow-hidden shadow-brutal-sm bg-gray-200 dark:bg-gray-700 group-hover:scale-105 transition-transform relative">
              <Image
                src={user.avatar || 'https://ui-avatars.com/api/?name=User'}
                alt="Profile"
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full border-2 border-dark flex items-center justify-center z-10">
              <span className="text-[8px] font-black text-dark">{user.level}</span>
            </div>
          </Link>
        </div>
      </motion.header>

      <div className="px-5 pb-20 space-y-4">
        {/* Success Stories Bar - Compact */}
        <motion.div variants={itemVariants}>
          <p className="font-extrabold text-dark dark:text-white text-xs mb-1 ml-1">Community Stories</p>
          <StoriesBar />
        </motion.div>

        {/* Recycling Bag Deposit - MAIN HERO */}
        <motion.div variants={itemVariants} className="relative group">
          <div className="absolute inset-0 bg-dark rounded-[2rem] translate-x-1 translate-y-1"></div>
          <Link href="/smart-bags" className="block">
            <div className="relative bg-[#FDE047] rounded-[2rem] border-4 border-dark overflow-hidden min-h-[160px]">
              {/* Background Decoration */}
              <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none rotate-12">
                <span className="material-symbols-outlined text-[120px]">inventory_2</span>
              </div>

              <div className="p-6 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-dark rounded-2xl flex items-center justify-center shadow-brutal-sm">
                    <span className="material-symbols-outlined text-white text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-[900] text-dark uppercase tracking-tight leading-none">Recycling<br />Bag Deposit</h2>
                    <p className="text-dark/70 font-bold text-sm mt-1">Submit full bags here</p>
                  </div>
                </div>
                <div className="bg-dark text-white rounded-2xl px-5 py-4 flex flex-col items-center justify-center gap-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-1 transition-all">
                  <span className="material-symbols-outlined text-2xl">qr_code_scanner</span>
                  <span className="font-black text-xs uppercase tracking-wide">Manage</span>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>



        {/* Stats Cards - Beautified */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
          {/* Rank Card */}
          <Link href="/impact?tab=leaderboard" className="relative group">
            <div className="absolute inset-0 bg-dark rounded-2xl translate-x-0.5 translate-y-0.5"></div>
            <div className="relative bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40 rounded-2xl border-2 border-dark dark:border-gray-600 p-4 transition-all group-hover:translate-x-0.5 group-hover:translate-y-0.5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl border-2 border-dark dark:border-gray-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl text-white">leaderboard</span>
                </div>
                <div>
                  <p className="text-2xl font-[900] text-dark dark:text-white leading-none">#{userRank}</p>
                  <p className="text-[10px] text-dark/50 dark:text-gray-400 font-bold">Campus Rank</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-blue-600 dark:text-blue-400">Top {100 - percentile}%</span>
                <span className="material-symbols-outlined text-sm text-dark/40 dark:text-gray-500">arrow_forward</span>
              </div>
            </div>
          </Link>

          {/* CO2 Card */}
          <Link href="/impact?tab=personal" className="relative group">
            <div className="absolute inset-0 bg-dark rounded-2xl translate-x-0.5 translate-y-0.5"></div>
            <div className="relative bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 rounded-2xl border-2 border-dark dark:border-gray-600 p-4 transition-all group-hover:translate-x-0.5 group-hover:translate-y-0.5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl border-2 border-dark dark:border-gray-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl text-white">eco</span>
                </div>
                <div>
                  <p className="text-2xl font-[900] text-dark dark:text-white leading-none">{user.co2Saved}</p>
                  <p className="text-[10px] text-dark/50 dark:text-gray-400 font-bold">kg CO₂ Saved</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-green-600 dark:text-green-400">Your Impact</span>
                <span className="material-symbols-outlined text-sm text-dark/40 dark:text-gray-500">arrow_forward</span>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Quick Actions - Compact Grid */}
        <motion.div variants={itemVariants}>
          <p className="font-black text-dark dark:text-white text-sm uppercase tracking-tight mb-2 ml-1">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/rewards" className="relative h-20 rounded-xl bg-[#2A9D8F] neo-border shadow-brutal hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer overflow-hidden group">
              <div className="relative h-full flex items-center gap-2 px-2 z-10">
                <div className="w-9 h-9 rounded-full bg-dark flex items-center justify-center text-white border-2 border-white shrink-0">
                  <span className="material-symbols-outlined text-base">redeem</span>
                </div>
                <p className="text-white text-xs font-black uppercase leading-tight tracking-tight">Rewards</p>
              </div>
            </Link>
            <Link href="/missions" className="relative h-20 rounded-xl bg-[#FFB703] neo-border shadow-brutal hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer overflow-hidden group">
              <div className="relative h-full flex items-center gap-2 px-2 z-10">
                <div className="w-9 h-9 rounded-full bg-dark flex items-center justify-center text-white border-2 border-white shrink-0">
                  <span className="material-symbols-outlined text-base">flag</span>
                </div>
                <p className="text-dark text-xs font-black uppercase leading-tight tracking-tight">Missions</p>
              </div>
            </Link>
            <Link href="/community" className="relative h-20 rounded-xl bg-[#9B5DE5] neo-border shadow-brutal hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer overflow-hidden group">
              <div className="relative h-full flex items-center gap-2 px-2 z-10">
                <div className="w-9 h-9 rounded-full bg-dark flex items-center justify-center text-white border-2 border-white shrink-0">
                  <span className="material-symbols-outlined text-base">palette</span>
                </div>
                <p className="text-white text-xs font-black uppercase leading-tight tracking-tight">DIY</p>
              </div>
            </Link>
            <Link href="/charity" className="relative h-20 rounded-xl bg-[#E76F51] neo-border shadow-brutal hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer overflow-hidden group">
              <div className="relative h-full flex items-center gap-2 px-2 z-10">
                <div className="w-9 h-9 rounded-full bg-dark flex items-center justify-center text-white border-2 border-white shrink-0">
                  <span className="material-symbols-outlined text-base">volunteer_activism</span>
                </div>
                <p className="text-white text-xs font-black uppercase leading-tight tracking-tight">Donate</p>
              </div>
            </Link>
          </div>
        </motion.div>

        {/* ReloopBuzz Carousel */}
        <motion.div variants={itemVariants}>
          <ReloopBuzz />
        </motion.div>

      </div>
    </motion.div>
  );
}
