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
      <div className='max-w-xl mx-auto bg-white p-6 rounded-lg shadow'>
        <h2 className='text-xl font-bold mb-4'>Order Not Found</h2>
        <button
          onClick={() => navigate('/admin/question-banks')}
          className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
        >
          Back to Question Banks
        </button>
      </div>
    );
  }

  if (!bank) {
    return <div>Loading...</div>;
  }

  return (
    <div className='max-w-xl mx-auto bg-white p-6 rounded-lg shadow'>
      <h2 className='text-xl font-bold mb-4'>Order Confirmation</h2>
      <p className='mb-6'>✅ You’ve successfully added {bank.title} to your library.</p>
      <button
        onClick={() => navigate('/admin/question-banks?tab=my-banks')}
        className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
      >
        Go to My Question Banks
      </button>
      {recommendations.length > 0 && (
        <div className='mt-8'>
          <h3 className='font-semibold mb-4'>Upgrade to Pro</h3>
          <div className='grid gap-4 md:grid-cols-2'>
            {recommendations.map(rec => (
              <PublicQuestionBankCard key={rec._id} bank={rec} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBankConfirmationPage;
