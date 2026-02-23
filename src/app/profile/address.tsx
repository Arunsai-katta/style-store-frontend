"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { userAPI } from "@/services/api";
import toast from "react-hot-toast";

export default function AddressManagementPage() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setIsLoading(true);
    try {
      const res = await userAPI.getProfile();
      setAddresses(res.data.addresses || []);
    } catch (error) {
      toast.error("Failed to load addresses");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingId) {
        await userAPI.updateAddress(editingId, form);
        toast.success("Address updated");
      } else {
        await userAPI.addAddress(form);
        toast.success("Address added");
      }
      setForm({
        name: "",
        phone: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
      });
      setEditingId(null);
      fetchAddresses();
    } catch (error) {
      toast.error("Failed to save address");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (address: any) => {
    setForm(address);
    setEditingId(address._id);
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      await userAPI.deleteAddress(id);
      toast.success("Address deleted");
      fetchAddresses();
    } catch (error) {
      toast.error("Failed to delete address");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-light">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Manage Addresses</h1>
        {/* Show address list if available */}
        {addresses.length > 0 && (
          <>
            <div className="space-y-4 mb-8">
              {addresses.map((address) => (
                <div key={address._id} className="border rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{address.name}</div>
                    <div className="text-sm text-gray-600">{address.addressLine1}, {address.city}, {address.state}, {address.pincode}</div>
                    <div className="text-xs text-gray-500">{address.phone}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-primary text-white rounded-lg font-semibold" onClick={() => handleEdit(address)}>
                      Edit
                    </button>
                    <button className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold" onClick={() => handleDelete(address._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {/* Add new address button */}
            {!editingId && (
              <button className="px-6 py-3 bg-primary text-white rounded-lg font-semibold mb-8" onClick={() => setEditingId('new')}>
                Add New Address
              </button>
            )}
          </>
        )}
        {/* Show add/edit form if editing or no addresses */}
        {(editingId || addresses.length === 0) && (
          <form onSubmit={handleAddOrUpdate} className="space-y-4 mb-8">
            <div className="grid grid-cols-2 gap-4">
              <input name="name" value={form.name} onChange={handleInputChange} placeholder="Name" className="px-4 py-2 border rounded-lg" required />
              <input name="phone" value={form.phone} onChange={handleInputChange} placeholder="Phone" className="px-4 py-2 border rounded-lg" required />
              <input name="addressLine1" value={form.addressLine1} onChange={handleInputChange} placeholder="Address Line 1" className="px-4 py-2 border rounded-lg col-span-2" required />
              <input name="addressLine2" value={form.addressLine2} onChange={handleInputChange} placeholder="Address Line 2" className="px-4 py-2 border rounded-lg col-span-2" />
              <input name="city" value={form.city} onChange={handleInputChange} placeholder="City" className="px-4 py-2 border rounded-lg" required />
              <input name="state" value={form.state} onChange={handleInputChange} placeholder="State" className="px-4 py-2 border rounded-lg" required />
              <input name="pincode" value={form.pincode} onChange={handleInputChange} placeholder="Pincode" className="px-4 py-2 border rounded-lg" required />
              <input name="country" value={form.country} onChange={handleInputChange} placeholder="Country" className="px-4 py-2 border rounded-lg" required />
            </div>
            <button type="submit" className="px-6 py-3 bg-primary text-white rounded-lg font-semibold disabled:opacity-50" disabled={isLoading}>
              {editingId && editingId !== 'new' ? "Update Address" : "Add Address"}
            </button>
            {editingId && (
              <button type="button" className="ml-4 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold" onClick={() => { setEditingId(null); setForm({ name: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "", pincode: "", country: "India" }); }}>
                Cancel
              </button>
            )}
          </form>
        )}
      </div>
      <Footer />
    </main>
  );
}
