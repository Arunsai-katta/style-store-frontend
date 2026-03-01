'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search, CheckCircle, XCircle, Eye,
  ChevronLeft, ChevronRight, RotateCcw, X,
  CreditCard, Smartphone, Banknote, RefreshCw, ChevronDown,
} from 'lucide-react';
import { returnAPI } from '@/services/api';
import { formatPrice, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ReturnRequest {
  _id: string;
  returnNumber: string;
  order: { _id: string; orderNumber: string; payment?: { method: string } };
  user?: { name: string; email: string };
  items: { name: string; quantity: number; reason: string; refundAmount: number }[];
  refundDetails: {
    totalAmount: number;
    method: string;
    upiId?: string;
    bankDetails?: { accountNumber?: string; ifscCode?: string; accountHolderName?: string; bankName?: string };
    payoutId?: string;
    payoutStatus?: string;
    transactionId?: string;
    processedAt?: string;
  };
  status: string;
  createdAt: string;
  adminNotes?: string;
  rejectionReason?: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-700',
  refund_initiated: 'bg-purple-100 text-purple-700',
  refunded: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
  received: 'bg-indigo-100 text-indigo-700',
  inspected: 'bg-cyan-100 text-cyan-700',
};

const payoutStatusColors: Record<string, string> = {
  not_required: 'text-gray-400',
  queued: 'text-yellow-500',
  processing: 'text-blue-500',
  processed: 'text-green-600',
  failed: 'text-red-500',
  cancelled: 'text-gray-400',
};

export default function AdminReturns() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => { fetchReturns(); }, [currentPage, statusFilter]);

  const fetchReturns = async () => {
    try {
      setIsLoading(true);
      const params: any = { page: currentPage, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      const response = await returnAPI.getAllReturns(params);
      setReturns(response.data.returns);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch {
      toast.error('Failed to load return requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this return request?')) return;
    try {
      await returnAPI.approveReturn(id);
      toast.success('Return approved');
      fetchReturns();
      setIsModalOpen(false);
    } catch { toast.error('Failed to approve return'); }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    try {
      await returnAPI.rejectReturn(id, { reason });
      toast.success('Return rejected');
      fetchReturns();
      setIsModalOpen(false);
    } catch { toast.error('Failed to reject return'); }
  };

  const handleProcessRefund = async (id: string) => {
    if (!confirm('Process refund now? This will initiate the payment immediately.')) return;
    setProcessingId(id);
    try {
      const res = await returnAPI.processRefund(id);
      const { refund } = res.data;
      if (refund.method === 'payout') {
        toast.success(`₹${refund.total} payout initiated via UPI/bank (${refund.payoutStatus})`);
      } else {
        toast.success(`₹${refund.total} refunded to original card`);
      }
      fetchReturns();
      setIsModalOpen(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to process refund');
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkRefunded = async (id: string) => {
    const ref = prompt('Optional: Enter UPI UTR / transaction reference (or leave blank):');
    if (ref === null) return; // cancelled
    try {
      await returnAPI.markRefunded(id, ref ? { transactionReference: ref } : undefined);
      toast.success('Refund marked as completed');
      fetchReturns();
      setIsModalOpen(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to mark refunded');
    }
  };

  const filtered = returns.filter(r =>
    r.returnNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.order?.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount = returns.filter(r => r.status === 'pending').length;
  const readyForRefund = returns.filter(r => ['approved', 'inspected'].includes(r.status)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black">Return Requests</h1>
          <p className="text-gray-600">Manage and process customer returns</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 bg-yellow-50 text-yellow-700 px-4 py-2 rounded-lg text-sm font-medium">
              <RotateCcw className="w-4 h-4" />
              {pendingCount} Pending
            </div>
          )}
          {readyForRefund > 0 && (
            <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-lg text-sm font-medium">
              <CreditCard className="w-4 h-4" />
              {readyForRefund} Ready for Refund
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by return #, order #, or customer..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="relative min-w-[160px]">
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="w-full appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white bg-none cursor-pointer"
          >
            <option value="" disabled hidden>Filter by Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="inspected">Inspected</option>
            <option value="rejected">Rejected</option>
            <option value="refunded">Refunded</option>
          </select>
          {statusFilter ? (
            <button
              onClick={() => { setStatusFilter(''); setCurrentPage(1); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              title="Clear filter"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <ChevronDown className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <RotateCcw className="w-14 h-14 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">No return requests found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b text-sm">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Return #</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Order</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Customer</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Refund To</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((ret, i) => (
                    <motion.tr
                      key={ret._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b hover:bg-gray-50 text-sm"
                    >
                      <td className="py-3 px-4 font-mono text-xs text-primary">{ret.returnNumber}</td>
                      <td className="py-3 px-4 font-medium">{ret.order?.orderNumber}</td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{ret.user?.name}</p>
                        <p className="text-xs text-gray-400">{ret.user?.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        {ret.refundDetails?.method === 'original_payment' ? (
                          <span className="flex items-center gap-1 text-gray-500 text-xs"><CreditCard className="w-3 h-3" /> Original card</span>
                        ) : ret.refundDetails?.upiId ? (
                          <span className="flex items-center gap-1 text-gray-500 text-xs"><Smartphone className="w-3 h-3" /> {ret.refundDetails.upiId}</span>
                        ) : ret.refundDetails?.bankDetails?.accountNumber ? (
                          <span className="flex items-center gap-1 text-gray-500 text-xs"><Banknote className="w-3 h-3" /> ****{ret.refundDetails.bankDetails.accountNumber.slice(-4)}</span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                        {ret.refundDetails?.payoutStatus && ret.refundDetails.payoutStatus !== 'not_required' && (
                          <p className={`text-xs mt-0.5 ${payoutStatusColors[ret.refundDetails.payoutStatus] || 'text-gray-500'}`}>
                            Payout: {ret.refundDetails.payoutStatus}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold">{formatPrice(ret.refundDetails?.totalAmount)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[ret.status] || 'bg-gray-100 text-gray-600'}`}>
                          {ret.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setSelectedReturn(ret); setIsModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-primary transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                          {ret.status === 'pending' && (
                            <>
                              <button onClick={() => handleApprove(ret._id)} className="p-1.5 text-gray-400 hover:text-green-600 transition-colors" title="Approve"><CheckCircle className="w-4 h-4" /></button>
                              <button onClick={() => handleReject(ret._id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Reject"><XCircle className="w-4 h-4" /></button>
                            </>
                          )}
                          {['approved', 'inspected'].includes(ret.status) && (
                            <button
                              onClick={() => handleProcessRefund(ret._id)}
                              disabled={processingId === ret._id}
                              className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              <CreditCard className="w-3 h-3" />
                              {processingId === ret._id ? '…' : 'Refund'}
                            </button>
                          )}
                          {ret.status === 'refund_initiated' && (
                            <button
                              onClick={() => handleMarkRefunded(ret._id)}
                              className="flex items-center gap-1 px-2 py-1 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              <CheckCircle className="w-3 h-3" /> Mark Refunded
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
              <span className="text-gray-500">{filtered.length} requests</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 border rounded-lg hover:bg-gray-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                <span className="text-gray-600">Page {currentPage} of {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 border rounded-lg hover:bg-gray-50 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {isModalOpen && selectedReturn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto"
          >
            <div className="p-5 border-b flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold">Return {selectedReturn.returnNumber}</h2>
                <p className="text-gray-500 text-sm">Order {selectedReturn.order?.orderNumber}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-5 space-y-5">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[selectedReturn.status] || 'bg-gray-100 text-gray-600'}`}>
                  {selectedReturn.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </span>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-semibold text-sm mb-2">Items</h3>
                <div className="space-y-2">
                  {selectedReturn.items?.map((item, i) => (
                    <div key={i} className="flex justify-between py-2 border-b text-sm">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity} • Reason: {item.reason}</p>
                      </div>
                      <span className="font-semibold">{formatPrice(item.refundAmount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Refund details */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between font-semibold">
                  <span>Total Refund</span>
                  <span>{formatPrice(selectedReturn.refundDetails?.totalAmount)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {selectedReturn.refundDetails?.method === 'original_payment' ? (
                    <><CreditCard className="w-4 h-4" /> Refund to original card</>
                  ) : selectedReturn.refundDetails?.upiId ? (
                    <><Smartphone className="w-4 h-4" /> UPI: <strong>{selectedReturn.refundDetails.upiId}</strong></>
                  ) : selectedReturn.refundDetails?.bankDetails?.accountNumber ? (
                    <><Banknote className="w-4 h-4" />
                      Bank: <strong>{selectedReturn.refundDetails.bankDetails.accountHolderName}</strong> —
                      Acc: {selectedReturn.refundDetails.bankDetails.accountNumber},
                      IFSC: {selectedReturn.refundDetails.bankDetails.ifscCode}
                    </>
                  ) : null}
                </div>
                {selectedReturn.refundDetails?.payoutId && (
                  <div className="text-xs text-gray-500 space-y-1 border-t pt-2 mt-2">
                    <div className="flex justify-between"><span>Payout ID</span><span className="font-mono">{selectedReturn.refundDetails.payoutId}</span></div>
                    <div className="flex justify-between">
                      <span>Payout Status</span>
                      <span className={payoutStatusColors[selectedReturn.refundDetails.payoutStatus || ''] || 'text-gray-500'}>
                        {selectedReturn.refundDetails.payoutStatus}
                      </span>
                    </div>
                  </div>
                )}
                {selectedReturn.refundDetails?.transactionId && (
                  <div className="text-xs text-gray-500 border-t pt-2 flex justify-between">
                    <span>Razorpay Refund ID</span>
                    <span className="font-mono">{selectedReturn.refundDetails.transactionId}</span>
                  </div>
                )}
                {selectedReturn.refundDetails?.processedAt && (
                  <div className="text-xs text-gray-400">Processed: {formatDate(selectedReturn.refundDetails.processedAt)}</div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 flex-wrap">
                {selectedReturn.status === 'pending' && (
                  <>
                    <button onClick={() => handleApprove(selectedReturn._id)} className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors">
                      <CheckCircle className="w-4 h-4" /> Approve
                    </button>
                    <button onClick={() => handleReject(selectedReturn._id)} className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-700 transition-colors">
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </>
                )}
                {['approved', 'inspected'].includes(selectedReturn.status) && (
                  <button
                    onClick={() => handleProcessRefund(selectedReturn._id)}
                    disabled={processingId === selectedReturn._id}
                    className="flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    <CreditCard className="w-4 h-4" />
                    {processingId === selectedReturn._id ? 'Processing…' : 'Process Refund'}
                  </button>
                )}
                {selectedReturn.status === 'refund_initiated' && (
                  <div className="w-full space-y-2">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                      <p className="font-medium">Manual transfer required</p>
                      <p className="mt-1">Please transfer <strong>{formatPrice(selectedReturn.refundDetails?.totalAmount)}</strong> to:</p>
                      {selectedReturn.refundDetails?.upiId ? (
                        <p className="mt-1 font-mono text-sm flex items-center gap-1"><Smartphone className="w-4 h-4" /> {selectedReturn.refundDetails.upiId}</p>
                      ) : selectedReturn.refundDetails?.bankDetails?.accountNumber ? (
                        <p className="mt-1 font-mono text-sm flex items-center gap-1"><Banknote className="w-4 h-4" /> {selectedReturn.refundDetails.bankDetails.accountNumber} | IFSC: {selectedReturn.refundDetails.bankDetails.ifscCode}</p>
                      ) : null}
                    </div>
                    <button
                      onClick={() => handleMarkRefunded(selectedReturn._id)}
                      className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" /> Mark as Refunded
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
