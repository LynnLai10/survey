import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAdmin } from '../../contexts/AdminContext';
import api from '../../utils/axiosConfig';

interface BankInfo {
	_id: string;
	title: string;
	description: string;
	priceOneTime?: number;
	type: string;
	tags?: string[];
	questionCount?: number;
}

const QuestionBankCheckoutPage: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const { navigate } = useAdmin();
	const [bank, setBank] = useState<BankInfo | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const loadBank = async () => {
			try {
				const resp = await api.get(`/public-banks/${id}`);
				setBank(resp.data);
			} catch (err) {
				console.error('Failed to load bank', err);
			}
		};
		loadBank();
	}, [id]);

	const handleConfirm = async () => {
		if (!id) return;
		setLoading(true);
		try {
			const resp = await api.post('/checkout/free', { bankId: id });
			const orderId = resp.data.orderId;
			console.log('analytics:free_bank_checkout_confirmed', {
				bankId: id,
				orderId,
			});
			navigate(`/checkout/success?orderId=${orderId}`);
		} catch (err) {
			console.error('Failed to complete purchase', err);
		} finally {
			setLoading(false);
		}
	};

	if (!bank) {
		return <div>Loading...</div>;
	}

	const isFree = !bank.priceOneTime || bank.priceOneTime === 0;

	return (
		<div className='max-w-xl mx-auto bg-white p-6 rounded-lg shadow'>
			<h2 className='text-xl font-bold mb-4'>{bank.title}</h2>
			<p className='mb-2'>{bank.description}</p>
			{bank.tags && bank.tags.length > 0 && (
				<p className='mb-2 text-sm text-gray-600'>Tags: {bank.tags.join(', ')}</p>
			)}
			{bank.questionCount !== undefined && (
				<p className='mb-2 text-sm text-gray-600'>Questions: {bank.questionCount}</p>
			)}
			<p className='mb-4 font-semibold'>
				Price: ${bank.priceOneTime ? bank.priceOneTime.toFixed(2) : '0.00'}
			</p>
			{isFree && <p className='mb-4 text-green-700'>This bank is free to claim.</p>}
			<button
				onClick={handleConfirm}
				disabled={loading}
				className='px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50'
			>
				{loading ? 'Processing...' : 'Confirm Purchase'}
			</button>
			<div className='mt-8 p-4 border rounded text-center text-sm text-gray-500'>
				Recommended banks coming soon...
			</div>
		</div>
	);
};

export default QuestionBankCheckoutPage;
