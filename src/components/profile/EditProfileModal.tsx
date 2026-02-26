'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User } from '@/types';

interface EditProfileModalProps {
    user: User;
    onClose: () => void;
    onSave: (data: Partial<User>) => Promise<void>;
}

export const EditProfileModal = ({ user, onClose, onSave }: EditProfileModalProps) => {
    const [name, setName] = useState(user.name);
    const [campus, setCampus] = useState(user.campus || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        await onSave({ name, campus });
        setIsSubmitting(false);
        onClose();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/80 backdrop-blur-sm"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white dark:bg-dark-surface w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border-2 border-dark"
            >
                {/* Header */}
                <div className="p-5 border-b-2 border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-[900] text-dark dark:text-white uppercase tracking-wide">
                        Edit Profile
                    </h2>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <span className="material-symbols-outlined text-dark dark:text-gray-300">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <div className="flex justify-center mb-4">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full border-4 border-primary overflow-hidden">
                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            </div>
                            <button className="absolute bottom-0 right-0 w-8 h-8 bg-dark text-white rounded-full flex items-center justify-center border-2 border-white">
                                <span className="material-symbols-outlined text-sm">edit</span>
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-dark dark:text-white mb-1">DISPLAY NAME</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-transparent focus:border-primary focus:outline-none font-bold dark:text-white transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-dark dark:text-white mb-1">CAMPUS</label>
                        <input
                            value={campus}
                            onChange={(e) => setCampus(e.target.value)}
                            className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-transparent focus:border-primary focus:outline-none font-medium dark:text-white transition-colors"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t-2 border-gray-100 dark:border-gray-700 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 font-bold text-dark dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !name}
                        className="flex-[2] py-3 bg-primary text-dark font-black uppercase tracking-wide rounded-xl shadow-brutal hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>Save Changes</span>
                                <span className="material-symbols-outlined">check</span>
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};
