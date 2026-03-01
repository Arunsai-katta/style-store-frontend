'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, MapPin, Heart, LogOut, User, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuthStore } from '@/store/authStore';

export default function AccountPage() {
    const router = useRouter();
    const { isAuthenticated, user, logout } = useAuthStore();

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login?redirect=/account');
        }
    }, [isAuthenticated, router]);

    if (!isAuthenticated || !user) return null;

    const accountLinks = [
        {
            href: '/orders',
            icon: Package,
            label: 'My Orders',
            description: 'Track and view your past orders',
            color: 'bg-blue-50 text-blue-600',
        },
        {
            href: '/profile/address',
            icon: MapPin,
            label: 'Saved Addresses',
            description: 'Manage your delivery addresses',
            color: 'bg-green-50 text-green-600',
        },
        {
            href: '/wishlist',
            icon: Heart,
            label: 'Wishlist',
            description: 'Items you have saved for later',
            color: 'bg-red-50 text-red-600',
        },
    ];

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    return (
        <main className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
                {/* Profile Header */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5"
                >
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold text-black truncate">{user.name}</h1>
                        <p className="text-gray-500 text-sm truncate">{user.email}</p>
                        {user.phone && (
                            <p className="text-gray-400 text-xs mt-0.5">{user.phone}</p>
                        )}
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 transition-colors self-end sm:self-auto"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </motion.div>

                {/* Quick Access Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {accountLinks.map((item, i) => (
                        <motion.div
                            key={item.href}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                        >
                            <Link
                                href={item.href}
                                className="flex items-center gap-4 bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group"
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                                    <item.icon className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-black text-sm">{item.label}</p>
                                    <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{item.description}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors flex-shrink-0" />
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* Account Info */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="bg-white rounded-2xl shadow-sm p-6"
                >
                    <h2 className="font-semibold text-black mb-4">Account Details</h2>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-500">Full Name</span>
                            <span className="font-medium text-black">{user.name}</span>
                        </div>
                        <div className={`flex justify-between items-center py-2 ${user.phone ? 'border-b border-gray-100' : ''}`}>
                            <span className="text-gray-500">Email</span>
                            <span className="font-medium text-black truncate ml-4 text-right">{user.email}</span>
                        </div>
                        {user.phone && (
                            <div className="flex justify-between items-center py-2">
                                <span className="text-gray-500">Phone</span>
                                <span className="font-medium text-black">{user.phone}</span>
                            </div>
                        )}
                        {/* <div className="flex justify-between items-center py-2">
                            <span className="text-gray-500">Account Type</span>
                            <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full capitalize">
                                {user.role || 'Customer'}
                            </span>
                        </div> */}
                    </div>
                </motion.div>
            </div>

            <Footer />
        </main>
    );
}
