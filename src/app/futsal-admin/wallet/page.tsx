'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

interface WalletBooking {
  booking_id: number;
  booking_date: string;
  total_amount: number;
  amount_paid: number;
  booking_type: string;
  cancelled_by?: string;
}

interface WalletData {
  bookings: WalletBooking[];
  totalIncome: number;
  totalCommission: number;
  totalAdvance: number;
  totalReceivable: number;
}

export default function FutsalAdminWallet() {
  const router = useRouter();
  const { role, hydrated, tokens } = useAuthStore();
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredStartDate, setFilteredStartDate] = useState('');
  const [filteredEndDate, setFilteredEndDate] = useState('');
  const [admin, setAdmin] = useState<any>(null);

  useEffect(() => {
    if (hydrated) {
      if (role !== 'futsal_admin') {
        router.push('/futsal-admin/signin');
        return;
      }

      const storedUser = sessionStorage.getItem('futsal_admin');
      if (storedUser) {
        setAdmin(JSON.parse(storedUser));
      } else {
        router.push('/futsal-admin/signin');
        return;
      }
    }
  }, [role, hydrated, router]);

  useEffect(() => {
    if (admin) {
      fetchWalletData();
    }
  }, [admin, filteredStartDate, filteredEndDate]);

  const fetchWalletData = async () => {
    if (!admin) return;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filteredStartDate) params.append('startDate', filteredStartDate);
      if (filteredEndDate) params.append('endDate', filteredEndDate);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/futsal-admins/${admin.id}/wallet?${params}`, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWalletData(data);
      } else {
        console.error('Failed to fetch wallet data');
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowFilter = () => {
    setFilteredStartDate(startDate);
    setFilteredEndDate(endDate);
  };

  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
    setFilteredStartDate('');
    setFilteredEndDate('');
  };

  const formatCurrency = (amount: number | string | null | undefined) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
    return `Rs. ${numAmount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA'); // YYYY-MM-DD format
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-linear-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-linear-to-r from-gray-900 via-green-900 to-blue-900 backdrop-blur-md shadow-2xl border-b border-green-500/20">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/futsal-admin/dashboard')}
              className="bg-transparent text-white font-bold py-2 px-3 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-white/20 hover:border-white/40"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-3xl font-bold text-white drop-shadow-lg">
              Wallet - {admin?.futsal_name || ''}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Date Filter */}
          <div className="bg-white rounded-lg p-6 mb-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Filter by Date Range
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex items-end">
                {(filteredStartDate || filteredEndDate) && startDate === filteredStartDate && endDate === filteredEndDate ? (
                  <button
                    onClick={handleClearFilter}
                    className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-all duration-300"
                  >
                    Clear Filter
                  </button>
                ) : (
                  <button
                    onClick={handleShowFilter}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-all duration-300"
                  >
                    Show
                  </button>
                )}
              </div>
            </div>
            {(filteredStartDate || filteredEndDate) && startDate === filteredStartDate && endDate === filteredEndDate && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  Showing bookings from <strong>{filteredStartDate ? formatDate(filteredStartDate) : 'beginning'}</strong> to <strong>{filteredEndDate ? formatDate(filteredEndDate) : 'end'}</strong>
                </p>
              </div>
            )}
          </div>

          {/* Summary Cards */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-lg p-6 shadow-lg border-l-4 border-gray-300 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : walletData && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-lg p-6 shadow-lg border-l-4 border-green-500">
                <h3 className="text-sm font-medium text-gray-500">Total Income</h3>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(walletData.totalIncome)}</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-lg border-l-4 border-blue-500">
                <h3 className="text-sm font-medium text-gray-500">Total Commission (5%)</h3>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(walletData.totalCommission)}</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-lg border-l-4 border-yellow-500">
                <h3 className="text-sm font-medium text-gray-500">Total Advance</h3>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(walletData.totalAdvance)}</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-lg border-l-4 border-purple-500">
                <h3 className="text-sm font-medium text-gray-500">Admin Receivable</h3>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(walletData.totalReceivable)}</p>
              </div>
            </div>
          )}

          {/* Bookings Table */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Booking Details
              </h2>
            </div>

            {loading ? (
              <div className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/6 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/6"></div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booking ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booking Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Advance Paid
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Special Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      5% Commission
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admin Receivable
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {walletData?.bookings.map((booking) => {
                    const totalAmount = parseFloat(booking.total_amount as any);
                    const commission = totalAmount * 0.05;
                    const adminReceivable = totalAmount - commission;

                    return (
                      <tr key={booking.booking_id} className={booking.cancelled_by ? 'bg-red-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {booking.booking_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(booking.booking_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(totalAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(parseFloat(booking.amount_paid as any))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {booking.booking_type !== 'normal' ? 'Yes' : 'No'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          {formatCurrency(commission)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {formatCurrency(adminReceivable)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {walletData && walletData.bookings.length > 0 && (
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={2} className="px-6 py-4 text-sm font-medium text-gray-900">
                        Grand Total
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {formatCurrency(walletData.bookings.reduce((sum, b) => sum + parseFloat(b.total_amount as any), 0))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {formatCurrency(walletData.totalAdvance)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        -
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">
                        {formatCurrency(walletData.totalCommission)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                        {formatCurrency(walletData.totalReceivable)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
              </div>
            )}

            {walletData && walletData.bookings.length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filteredStartDate || filteredEndDate ? 'Try adjusting your date filter or clear the filter to see all bookings.' : 'No bookings available for this futsal.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}