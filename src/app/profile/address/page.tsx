'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Plus, Pencil, Trash2, ChevronLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { userAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
    name: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
};

export default function AddressPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();

    const [addresses, setAddresses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login?redirect=/profile/address');
            return;
        }
        fetchAddresses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]);

    const fetchAddresses = async () => {
        setIsLoading(true);
        try {
            const res = await userAPI.getProfile();
            setAddresses(res.data.user?.addresses || res.data.addresses || []);
        } catch {
            toast.error('Failed to load addresses');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const openAdd = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setShowForm(true);
    };

    const openEdit = (address: any) => {
        setForm({
            name: address.name || '',
            phone: address.phone || '',
            addressLine1: address.addressLine1 || '',
            addressLine2: address.addressLine2 || '',
            city: address.city || '',
            state: address.state || '',
            pincode: address.pincode || '',
            country: address.country || 'India',
        });
        setEditingId(address._id);
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        setForm(EMPTY_FORM);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!/^[0-9]{10}$/.test(form.phone.trim())) {
            toast.error('Please enter a valid 10-digit phone number');
            return;
        }
        if (!/^[0-9]{6}$/.test(form.pincode.trim())) {
            toast.error('Please enter a valid 6-digit pincode');
            return;
        }

        setIsSaving(true);
        try {
            if (editingId) {
                await userAPI.updateAddress(editingId, form);
                toast.success('Address updated');
            } else {
                await userAPI.addAddress(form);
                toast.success('Address added');
            }
            handleCancel();
            fetchAddresses();
        } catch {
            toast.error('Failed to save address');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this address?')) return;
        try {
            await userAPI.deleteAddress(id);
            toast.success('Address deleted');
            fetchAddresses();
        } catch {
            toast.error('Failed to delete address');
        }
    };

    return (
        <main className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Link href="/account" className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-black">Saved Addresses</h1>
                        <p className="text-sm text-gray-500">Manage your delivery addresses</p>
                    </div>
                </div>

                {/* Address List */}
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2].map((i) => (
                            <div key={i} className="h-24 bg-white rounded-xl animate-pulse shadow-sm" />
                        ))}
                    </div>
                ) : addresses.length === 0 && !showForm ? (
                    <div className="bg-white rounded-xl shadow-sm p-10 text-center">
                        <MapPin className="w-14 h-14 text-gray-300 mx-auto mb-3" />
                        <h3 className="font-semibold text-gray-900 mb-1">No addresses yet</h3>
                        <p className="text-sm text-gray-500 mb-5">Add a delivery address to get started</p>
                        <button
                            onClick={openAdd}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Address
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="space-y-3">
                            {addresses.map((address, i) => (
                                <motion.div
                                    key={address._id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.06 }}
                                    className="bg-white rounded-xl shadow-sm p-4 sm:p-5"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex gap-3 min-w-0">
                                            <div className="mt-0.5 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <MapPin className="w-4 h-4 text-primary" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-black">{address.name}</p>
                                                <p className="text-sm text-gray-600 mt-0.5">
                                                    {address.addressLine1}
                                                    {address.addressLine2 ? `, ${address.addressLine2}` : ''}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {address.city}, {address.state} – {address.pincode}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-0.5">{address.phone}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => openEdit(address)}
                                                className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(address._id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Add new button (when list has items and form is hidden) */}
                        {!showForm && (
                            <button
                                onClick={openAdd}
                                className="flex items-center gap-2 w-full justify-center py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary hover:text-primary transition-colors font-medium"
                            >
                                <Plus className="w-4 h-4" />
                                Add New Address
                            </button>
                        )}
                    </>
                )}

                {/* Add / Edit Form */}
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-xl shadow-sm p-5"
                    >
                        <h2 className="font-semibold text-black mb-4">
                            {editingId ? 'Edit Address' : 'New Address'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={handleInputChange}
                                    placeholder="Full name"
                                    required
                                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                />
                                <input
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleInputChange}
                                    placeholder="Phone (10 digits)"
                                    required
                                    inputMode="numeric"
                                    maxLength={10}
                                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                />
                                <input
                                    name="addressLine1"
                                    value={form.addressLine1}
                                    onChange={handleInputChange}
                                    placeholder="Address line 1"
                                    required
                                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:col-span-2"
                                />
                                <input
                                    name="addressLine2"
                                    value={form.addressLine2}
                                    onChange={handleInputChange}
                                    placeholder="Address line 2 (optional)"
                                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:col-span-2"
                                />
                                <input
                                    name="city"
                                    value={form.city}
                                    onChange={handleInputChange}
                                    placeholder="City"
                                    required
                                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                />
                                <input
                                    name="state"
                                    value={form.state}
                                    onChange={handleInputChange}
                                    placeholder="State"
                                    required
                                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                />
                                <input
                                    name="pincode"
                                    value={form.pincode}
                                    onChange={handleInputChange}
                                    placeholder="Pincode (6 digits)"
                                    required
                                    inputMode="numeric"
                                    maxLength={6}
                                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                />
                                <input
                                    name="country"
                                    value={form.country}
                                    onChange={handleInputChange}
                                    placeholder="Country"
                                    required
                                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                />
                            </div>

                            <div className="flex gap-3 pt-1">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                                >
                                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingId ? 'Update Address' : 'Save Address'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </div>

            <Footer />
        </main>
    );
}
