import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdmin } from '../../contexts/AdminContext';
import api from '../../utils/axiosConfig';

interface PurchaseRecord {
  _id: string;
  bankId: {
    _id: string;
    title: string;
    description: string;
    questionCount: number;
  };
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  type: 'free' | 'paid';
  createdAt: string;
}

interface Entitlement {
  _id: string;
  bankId: {
    _id: string;
    title: string;
    description: string;
    questionCount: number;
  };
  accessType: 'free' | 'purchased' | 'subscription';
  status: 'active' | 'expired' | 'cancelled';
  purchasePrice?: number;
  currency: string;
  grantedAt: string;
  expiresAt?: string;
}

const PurchaseHistoryPage: React.FC = () => {
  const { navigate } = useAdmin();
  const { t } = useTranslation('admin');
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<PurchaseRecord[]>([]);
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'entitlements'>('orders');

  useEffect(() => {
    fetchPurchaseHistory();
  }, []);

  const fetchPurchaseHistory = async () => {
    setLoading(true);
    try {
      const [ordersResponse, entitlementsResponse] = await Promise.all([
        api.get('/orders/history'),
        api.get('/entitlements/my-access')
      ]);

      if (ordersResponse.data.success) {
        setOrders(ordersResponse.data.orders || []);
      }

      if (entitlementsResponse.data.success) {
        setEntitlements(entitlementsResponse.data.entitlements || []);
      }
    } catch (error) {
      console.error('Failed to fetch purchase history:', error);
      // For development, show mock data
      setOrders([
        {
          _id: '1',
          bankId: {
            _id: '1',
            title: 'JavaScript Fundamentals',
            description: 'Comprehensive JavaScript question bank',
            questionCount: 150
          },
          amount: 0,
          currency: 'USD',
          status: 'paid',
          type: 'free',
          createdAt: new Date().toISOString()
        },
        {
          _id: '2',
          bankId: {
            _id: '2',
            title: 'React Advanced Patterns',
            description: 'Advanced React concepts and patterns',
            questionCount: 200
          },
          amount: 29.99,
          currency: 'USD',
          status: 'paid',
          type: 'paid',
          createdAt: new Date(Date.now() - 86400000).toISOString()
        }
      ]);

      setEntitlements([
        {
          _id: '1',
          bankId: {
            _id: '1',
            title: 'JavaScript Fundamentals',
            description: 'Comprehensive JavaScript question bank',
            questionCount: 150
          },
          accessType: 'free',
          status: 'active',
          currency: 'USD',
          grantedAt: new Date().toISOString()
        },
        {
          _id: '2',
          bankId: {
            _id: '2',
            title: 'React Advanced Patterns',
            description: 'Advanced React concepts and patterns',
            questionCount: 200
          },
          accessType: 'purchased',
          status: 'active',
          purchasePrice: 29.99,
          currency: 'USD',
          grantedAt: new Date(Date.now() - 86400000).toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToMarketplace = () => {
    navigate('/admin/question-banks?tab=marketplace');
  };

  const handleUseBank = (bankId: string) => {
    navigate(`/admin?preselectedBank=${bankId}&t=${Date.now()}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string, type: 'order' | 'entitlement' = 'order') => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
    
    if (type === 'order') {
      switch (status) {
        case 'paid':
          return `${baseClasses} bg-green-100 text-green-700`;
        case 'pending':
          return `${baseClasses} bg-yellow-100 text-yellow-700`;
        case 'failed':
          return `${baseClasses} bg-red-100 text-red-700`;
        default:
          return `${baseClasses} bg-gray-100 text-gray-700`;
      }
    } else {
      switch (status) {
        case 'active':
          return `${baseClasses} bg-green-100 text-green-700`;
        case 'expired':
          return `${baseClasses} bg-red-100 text-red-700`;
        case 'cancelled':
          return `${baseClasses} bg-gray-100 text-gray-700`;
        default:
          return `${baseClasses} bg-gray-100 text-gray-700`;
      }
    }
  };

  const getAccessTypeBadge = (accessType: string) => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
    
    switch (accessType) {
      case 'free':
        return `${baseClasses} bg-blue-100 text-blue-700`;
      case 'purchased':
        return `${baseClasses} bg-purple-100 text-purple-700`;
      case 'subscription':
        return `${baseClasses} bg-orange-100 text-orange-700`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-700`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading purchase history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              {t('questionBanks.marketplace.purchaseHistory', 'Purchase History')}
            </h1>
            <button
              onClick={handleBackToMarketplace}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← {t('questionBanks.marketplace.backToMarketplace', 'Back to Marketplace')}
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            {t('questionBanks.marketplace.purchaseHistoryDescription', 'View your question bank purchases and access history')}
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('orders')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'orders'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('questionBanks.marketplace.orderHistory', 'Order History')} ({orders.length})
              </button>
              <button
                onClick={() => setActiveTab('entitlements')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'entitlements'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('questionBanks.marketplace.myAccess', 'My Access')} ({entitlements.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'orders' ? (
              // Orders Tab
              <div>
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {t('questionBanks.marketplace.noOrders', 'No orders yet')}
                    </h3>
                    <p className="text-gray-500">
                      {t('questionBanks.marketplace.noOrdersDescription', 'Your purchase history will appear here')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-medium text-gray-900">{order.bankId.title}</h3>
                              <span className={getStatusBadge(order.status)}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                              {order.type === 'free' && (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                                  Free
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{order.bankId.description}</p>
                            <div className="text-xs text-gray-500">
                              <span>{order.bankId.questionCount} questions</span>
                              <span className="mx-2">•</span>
                              <span>Purchased {formatDate(order.createdAt)}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-gray-900">
                              {order.amount === 0 ? 'Free' : `$${order.amount.toFixed(2)}`}
                            </div>
                            <div className="text-xs text-gray-500">{order.currency}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Entitlements Tab
              <div>
                {entitlements.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {t('questionBanks.marketplace.noAccess', 'No access granted yet')}
                    </h3>
                    <p className="text-gray-500">
                      {t('questionBanks.marketplace.noAccessDescription', 'Question banks you have access to will appear here')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {entitlements.map((entitlement) => (
                      <div key={entitlement._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-medium text-gray-900">{entitlement.bankId.title}</h3>
                              <span className={getStatusBadge(entitlement.status, 'entitlement')}>
                                {entitlement.status.charAt(0).toUpperCase() + entitlement.status.slice(1)}
                              </span>
                              <span className={getAccessTypeBadge(entitlement.accessType)}>
                                {entitlement.accessType.charAt(0).toUpperCase() + entitlement.accessType.slice(1)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{entitlement.bankId.description}</p>
                            <div className="text-xs text-gray-500">
                              <span>{entitlement.bankId.questionCount} questions</span>
                              <span className="mx-2">•</span>
                              <span>Access granted {formatDate(entitlement.grantedAt)}</span>
                              {entitlement.expiresAt && (
                                <>
                                  <span className="mx-2">•</span>
                                  <span>Expires {formatDate(entitlement.expiresAt)}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <div className="text-right">
                              <div className="text-lg font-semibold text-gray-900">
                                {entitlement.purchasePrice 
                                  ? `$${entitlement.purchasePrice.toFixed(2)}` 
                                  : 'Free'
                                }
                              </div>
                              {entitlement.purchasePrice && (
                                <div className="text-xs text-gray-500">{entitlement.currency}</div>
                              )}
                            </div>
                            {entitlement.status === 'active' && (
                              <button
                                onClick={() => handleUseBank(entitlement.bankId._id)}
                                className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors"
                              >
                                {t('questionBanks.marketplace.useNow', 'Use now')}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseHistoryPage;