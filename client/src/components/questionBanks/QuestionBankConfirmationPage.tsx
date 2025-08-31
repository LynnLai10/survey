import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAdmin } from '../../contexts/AdminContext';
import api from '../../utils/axiosConfig';
import PublicQuestionBankCard from './PublicQuestionBankCard';
import { PublicQuestionBank } from '../../hooks/usePublicQuestionBanks';

const QuestionBankConfirmationPage: React.FC = () => {
  const location = useLocation();
  const { navigate } = useAdmin();
  const [bank, setBank] = useState<PublicQuestionBank | null>(null);
  const [recommendations, setRecommendations] = useState<PublicQuestionBank[]>([]);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const orderId = params.get('orderId');
    if (!orderId) {
      setMissing(true);
      return;
    }

    console.log('analytics:free_bank_success_viewed', { orderId });

    const loadData = async () => {
      try {
        const resp = await api.get(`/orders/${orderId}`);
        setBank({
          _id: resp.data.bank._id,
          title: resp.data.bank.title,
          description: resp.data.bank.description,
          tags: resp.data.bank.tags || [],
          questionCount: resp.data.bank.questionCount || 0,
          lastUpdated: new Date().toISOString(),
          type: resp.data.bank.type === 'free' ? 'FREE' : 'PAID',
          price: resp.data.bank.priceOneTime,
          entitlement: 'Owned',
        });
      } catch (err) {
        console.error('Failed to load order', err);
        setMissing(true);
      }
    };
    loadData();
  }, [location.search]);

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const resp = await api.get('/public-banks?type=paid&pageSize=3');
        const recs = (resp.data.banks || []).slice(0, 3).map((b: any) => ({
          _id: b._id,
          title: b.title,
          description: b.description,
          tags: b.tags || [],
          questionCount: b.questionCount,
          lastUpdated: b.lastUpdated,
          type: b.type,
          price: b.price,
          entitlement: 'Locked',
        }));
        setRecommendations(recs);
      } catch (err) {
        console.error('Failed to load recommendations', err);
      }
    };
    loadRecommendations();
  }, []);

  if (missing) {
    return (
      <div className='min-h-screen bg-gray-50 py-8 px-4'>
        <div className='max-w-xl mx-auto bg-white p-4 sm:p-6 rounded-lg shadow'>
          <h2 className='text-lg sm:text-xl font-bold mb-4'>Order Not Found</h2>
          <button
            onClick={() => navigate('/admin/question-banks')}
            className='w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors'
          >
            Back to Question Banks
          </button>
        </div>
      </div>
    );
  }

  if (!bank) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center px-4'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 py-6 sm:py-8 px-4'>
      <div className='max-w-6xl mx-auto'>
        {/* Success Card */}
        <div className='bg-white rounded-lg shadow-sm p-4 sm:p-6 md:p-8 mb-6'>
          {/* Success Icon */}
          <div className='flex justify-center mb-4'>
            <div className='w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center'>
              <svg className='w-8 h-8 sm:w-10 sm:h-10 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
              </svg>
            </div>
          </div>
          
          {/* Success Message */}
          <h2 className='text-xl sm:text-2xl font-bold text-center mb-3'>Order Confirmed!</h2>
          <p className='text-center text-gray-600 mb-6'>
            You've successfully added <span className='font-semibold'>{bank.title}</span> to your library.
          </p>
          
          {/* Bank Details Card */}
          <div className='bg-gray-50 rounded-lg p-4 mb-6'>
            <h3 className='font-semibold text-gray-900 mb-2'>{bank.title}</h3>
            <p className='text-sm text-gray-600 mb-2'>{bank.description}</p>
            <div className='flex flex-wrap gap-2 text-xs'>
              <span className='px-2 py-1 bg-green-100 text-green-700 rounded'>
                {bank.type === 'FREE' ? 'Free' : `Paid - $${bank.price}`}
              </span>
              <span className='px-2 py-1 bg-blue-100 text-blue-700 rounded'>
                {bank.questionCount} questions
              </span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className='flex flex-col sm:flex-row gap-3'>
            <button
              onClick={() => navigate('/admin?preselectedBank=' + bank._id)}
              className='flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
            >
              Use Question Bank Now
            </button>
            <button
              onClick={() => navigate('/admin/question-banks?tab=my-banks')}
              className='flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors'
            >
              Go to My Question Banks
            </button>
          </div>
        </div>

        {/* Recommendations Section */}
        {recommendations.length > 0 && (
          <div>
            <h3 className='text-lg font-semibold mb-4 px-2'>You might also like</h3>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              {recommendations.map(rec => (
                <PublicQuestionBankCard key={rec._id} bank={rec} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionBankConfirmationPage;
