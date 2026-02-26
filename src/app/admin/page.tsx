'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DemoManager from '@/lib/demo-manager';
import { User } from '@/types';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1 },
};

export default function AdminPage() {
    const [user, setUser] = useState<User | null>(null);
    const [allData, setAllData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'user' | 'badges' | 'listings' | 'trades' | 'stats'>('user');
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setUser(DemoManager.getMockUser());
        setAllData(DemoManager.adminGetAllData());
    };

    const showToast = (message: string) => {
        setToast(message);
        setTimeout(() => setToast(null), 2000);
    };

    const handleUserUpdate = (field: keyof User, value: any) => {
        DemoManager.adminSetUserField(field, value);
        loadData();
        showToast(`Updated ${field}`);
    };

    const handleAddBadge = (badgeId: string) => {
        DemoManager.adminAddBadge(badgeId);
        loadData();
        showToast('Badge added!');
    };

    const handleRemoveBadge = (badgeId: string) => {
        DemoManager.adminRemoveBadge(badgeId);
        loadData();
        showToast('Badge removed');
    };

    const handleQuickAction = (action: string) => {
        switch (action) {
            case 'add-coins':
                DemoManager.adminSetUserField('coins', (user?.coins || 0) + 100);
                break;
            case 'add-xp':
                DemoManager.adminAddXP(500);
                break;
            case 'level-up':
                DemoManager.adminSetUserField('level', (user?.level || 1) + 1);
                break;
            case 'add-trade':
                DemoManager.adminSetUserField('itemsTraded', (user?.itemsTraded || 0) + 1);
                break;
            case 'add-co2':
                DemoManager.adminSetUserField('co2Saved', (user?.co2Saved || 0) + 5);
                break;
            case 'streak':
                DemoManager.adminSetUserField('streak', (user?.streak || 0) + 1);
                break;
            case 'reset-all':
                DemoManager.resetAll();
                break;
        }
        loadData();
        showToast(`Action: ${action}`);
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-dark flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const allBadges = DemoManager.getAllBadges();
    const userBadges = user.badges || [];

    return (
        <div className="min-h-screen bg-gray-900 text-white pb-20">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-8">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                        <span className="text-4xl">🔧</span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-[900] uppercase tracking-wide">Admin Panel</h1>
                        <p className="text-white/70 text-sm">Modify demo data for pitching</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-4 py-3 bg-gray-800 flex gap-2 overflow-x-auto no-scrollbar sticky top-0 z-10">
                {(['user', 'badges', 'listings', 'trades', 'stats'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === tab
                                ? 'bg-primary text-dark'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            <motion.div
                className="px-4 py-6 space-y-6"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                key={activeTab}
            >
                {/* User Tab */}
                {activeTab === 'user' && (
                    <>
                        {/* Quick Actions */}
                        <motion.div variants={itemVariants} className="space-y-3">
                            <h2 className="text-lg font-bold text-gray-400 uppercase tracking-wide">Quick Actions</h2>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { action: 'add-coins', label: '+100 Coins', icon: '🪙' },
                                    { action: 'add-xp', label: '+500 XP', icon: '⭐' },
                                    { action: 'level-up', label: 'Level Up', icon: '📈' },
                                    { action: 'add-trade', label: '+1 Trade', icon: '🤝' },
                                    { action: 'add-co2', label: '+5kg CO₂', icon: '🌱' },
                                    { action: 'streak', label: '+1 Streak', icon: '🔥' },
                                ].map(({ action, label, icon }) => (
                                    <button
                                        key={action}
                                        onClick={() => handleQuickAction(action)}
                                        className="bg-gray-800 hover:bg-gray-700 rounded-xl p-3 flex flex-col items-center gap-1 transition-all active:scale-95"
                                    >
                                        <span className="text-2xl">{icon}</span>
                                        <span className="text-xs font-bold">{label}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>

                        {/* User Fields */}
                        <motion.div variants={itemVariants} className="space-y-3">
                            <h2 className="text-lg font-bold text-gray-400 uppercase tracking-wide">User Profile</h2>
                            <div className="bg-gray-800 rounded-2xl p-4 space-y-4">
                                {/* Name */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Name</label>
                                    <input
                                        type="text"
                                        value={user.name}
                                        onChange={(e) => handleUserUpdate('name', e.target.value)}
                                        className="w-full mt-1 bg-gray-700 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                                    <input
                                        type="email"
                                        value={user.email}
                                        onChange={(e) => handleUserUpdate('email', e.target.value)}
                                        className="w-full mt-1 bg-gray-700 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>

                                {/* Campus */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Campus</label>
                                    <input
                                        type="text"
                                        value={user.campus || ''}
                                        onChange={(e) => handleUserUpdate('campus', e.target.value)}
                                        className="w-full mt-1 bg-gray-700 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>

                                {/* Numeric Fields */}
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { key: 'coins', label: 'Coins 🪙', icon: '🪙' },
                                        { key: 'xp', label: 'XP ⭐', icon: '⭐' },
                                        { key: 'level', label: 'Level', icon: '📊' },
                                        { key: 'streak', label: 'Streak 🔥', icon: '🔥' },
                                        { key: 'itemsTraded', label: 'Items Traded', icon: '🤝' },
                                        { key: 'co2Saved', label: 'CO₂ Saved (kg)', icon: '🌱' },
                                    ].map(({ key, label }) => (
                                        <div key={key}>
                                            <label className="text-xs font-bold text-gray-500 uppercase">{label}</label>
                                            <input
                                                type="number"
                                                value={(user as any)[key] || 0}
                                                onChange={(e) => handleUserUpdate(key as keyof User, parseFloat(e.target.value) || 0)}
                                                className="w-full mt-1 bg-gray-700 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Level Title */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Level Title</label>
                                    <select
                                        value={user.levelTitle || 'Seedling'}
                                        onChange={(e) => handleUserUpdate('levelTitle', e.target.value)}
                                        className="w-full mt-1 bg-gray-700 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        {['Seedling', 'Sapling', 'Tree', 'Grove', 'Forest', 'Rainforest', 'Ecosystem'].map(title => (
                                            <option key={title} value={title}>{title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}

                {/* Badges Tab */}
                {activeTab === 'badges' && (
                    <motion.div variants={itemVariants} className="space-y-4">
                        <h2 className="text-lg font-bold text-gray-400 uppercase tracking-wide">
                            Badges ({userBadges.length}/{allBadges.length})
                        </h2>

                        <div className="grid grid-cols-2 gap-3">
                            {allBadges.map(badge => {
                                const hasBadge = userBadges.includes(badge.id);
                                return (
                                    <button
                                        key={badge.id}
                                        onClick={() => hasBadge ? handleRemoveBadge(badge.id) : handleAddBadge(badge.id)}
                                        className={`p-4 rounded-2xl text-left transition-all ${hasBadge
                                                ? 'bg-primary/20 border-2 border-primary'
                                                : 'bg-gray-800 border-2 border-gray-700 opacity-60 hover:opacity-100'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl">{badge.icon}</span>
                                            <div>
                                                <p className="font-bold text-sm">{badge.name}</p>
                                                <p className="text-xs text-gray-400">{badge.description}</p>
                                            </div>
                                        </div>
                                        <div className="mt-2 text-xs font-bold">
                                            {hasBadge ? (
                                                <span className="text-green-400">✓ Unlocked (tap to remove)</span>
                                            ) : (
                                                <span className="text-gray-500">Tap to add</span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* Listings Tab */}
                {activeTab === 'listings' && allData && (
                    <motion.div variants={itemVariants} className="space-y-4">
                        <h2 className="text-lg font-bold text-gray-400 uppercase tracking-wide">
                            Listings ({allData.listings?.length || 0})
                        </h2>

                        <div className="space-y-3">
                            {allData.listings?.map((listing: any) => (
                                <div key={listing.id} className="bg-gray-800 rounded-2xl p-4 flex items-center gap-4">
                                    <img
                                        src={listing.images?.[0] || 'https://via.placeholder.com/60'}
                                        alt={listing.title}
                                        className="w-16 h-16 rounded-xl object-cover"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold truncate">{listing.title}</p>
                                        <p className="text-sm text-gray-400">{listing.category} • 🪙 {listing.price}</p>
                                        <p className="text-xs text-gray-500">{listing.condition}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${listing.status === 'available' ? 'bg-green-500/20 text-green-400' : 'bg-gray-600 text-gray-400'
                                        }`}>
                                        {listing.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Trades Tab */}
                {activeTab === 'trades' && allData && (
                    <motion.div variants={itemVariants} className="space-y-4">
                        <h2 className="text-lg font-bold text-gray-400 uppercase tracking-wide">
                            Trades ({allData.trades?.length || 0})
                        </h2>

                        <div className="space-y-3">
                            {allData.trades?.map((trade: any) => (
                                <div key={trade.id} className="bg-gray-800 rounded-2xl p-4">
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={trade.listingImage}
                                            alt={trade.listingTitle}
                                            className="w-14 h-14 rounded-xl object-cover"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold truncate">{trade.listingTitle}</p>
                                            <p className="text-sm text-gray-400">with {trade.traderName}</p>
                                        </div>
                                        <select
                                            value={trade.status}
                                            onChange={(e) => {
                                                DemoManager.adminUpdateTrade(trade.id, { status: e.target.value });
                                                loadData();
                                                showToast('Trade updated');
                                            }}
                                            className="bg-gray-700 rounded-lg px-3 py-2 text-sm font-bold"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="accepted">Accepted</option>
                                            <option value="completed">Completed</option>
                                            <option value="declined">Declined</option>
                                        </select>
                                    </div>
                                    <div className="mt-3 flex gap-2 text-xs">
                                        {trade.offeredCoins && (
                                            <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-lg">
                                                🪙 {trade.offeredCoins} coins
                                            </span>
                                        )}
                                        {trade.offeredItem && (
                                            <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-lg">
                                                ↔ {trade.offeredItem}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Stats Tab */}
                {activeTab === 'stats' && (
                    <motion.div variants={itemVariants} className="space-y-4">
                        <h2 className="text-lg font-bold text-gray-400 uppercase tracking-wide">Current Stats</h2>

                        <div className="bg-gray-800 rounded-2xl p-5 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-green-600 flex items-center justify-center">
                                    <span className="text-4xl font-[900]">{user.level}</span>
                                </div>
                                <div>
                                    <p className="text-2xl font-[900]">{user.name}</p>
                                    <p className="text-primary font-bold">{user.levelTitle}</p>
                                    <p className="text-gray-400 text-sm">{user.email}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-700">
                                <div className="text-center">
                                    <p className="text-2xl font-[900] text-yellow-400">🪙 {user.coins}</p>
                                    <p className="text-xs text-gray-500">Coins</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-[900] text-purple-400">⭐ {user.xp}</p>
                                    <p className="text-xs text-gray-500">XP</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-[900] text-orange-400">🔥 {user.streak}</p>
                                    <p className="text-xs text-gray-500">Streak</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-700">
                                <div className="text-center">
                                    <p className="text-xl font-[900] text-blue-400">{user.itemsTraded}</p>
                                    <p className="text-xs text-gray-500">Items Traded</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xl font-[900] text-green-400">{user.co2Saved?.toFixed(1)} kg</p>
                                    <p className="text-xs text-gray-500">CO₂ Saved</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-700">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Badges ({userBadges.length})</p>
                                <div className="flex flex-wrap gap-2">
                                    {allBadges.filter(b => userBadges.includes(b.id)).map(badge => (
                                        <span key={badge.id} className="bg-gray-700 px-3 py-1 rounded-full text-sm">
                                            {badge.icon} {badge.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Reset Button */}
                        <button
                            onClick={() => handleQuickAction('reset-all')}
                            className="w-full py-4 bg-red-500/20 border-2 border-red-500 text-red-400 rounded-2xl font-bold hover:bg-red-500/30 transition-all"
                        >
                            🔄 Reset All Data to Defaults
                        </button>
                    </motion.div>
                )}
            </motion.div>

            {/* Toast */}
            {toast && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full font-bold text-sm shadow-xl border border-gray-700"
                >
                    ✓ {toast}
                </motion.div>
            )}
        </div>
    );
}
