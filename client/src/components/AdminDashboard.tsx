import React, { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useAdmin } from '../contexts/AdminContext';
import { useSurveys } from '../hooks/useSurveys';
import api from '../utils/axiosConfig';
import AdminNavbar from './layout/AdminNavbar';
import AdminHeader from './layout/AdminHeader';
import AdminFooter from './layout/AdminFooter';
import NavigationTabs from './navigation/NavigationTabs';
import SurveyListView from './surveys/SurveyListView';
import SurveyDetailView from './surveys/SurveyDetailView';
import CandidateDetailView from './surveys/CandidateDetailView';
import QuestionBanksTabbedView from './questionBanks/QuestionBanksTabbedView';
import QuestionBankDetailView from './questionBanks/QuestionBankDetailView';
import QuestionBankCheckoutPage from './questionBanks/QuestionBankCheckoutPage';
import QuestionBankConfirmationPage from './questionBanks/QuestionBankConfirmationPage';
import ProfileView from './profile/ProfileView';
import BillingView from './billing/BillingView';
import CollectionsListView from './collections/CollectionsListView';
import CollectionDetailView from './collections/CollectionDetailView';
import CreateSurveyModal from './modals/CreateSurveyModal';
import EditSurveyModal from './modals/EditSurveyModal';
import ScoringModal from './modals/ScoringModal';
import QuestionBankModal from './modals/QuestionBankModal';
import EditQuestionBankModal from './modals/EditQuestionBankModal';
import ShoppingCartModal from './questionBanks/ShoppingCartModal';
import CheckoutPage from './questionBanks/CheckoutPage';
import PurchaseHistoryPage from './questionBanks/PurchaseHistoryPage';

const AdminDashboard: React.FC = () => {
	const {
		tab,
		selectedSurvey,
		selectedQuestionBankDetail,
		setSelectedSurvey,
		setTab,
		surveys,
		setShowCreateModal,
		setNewSurvey,
	} = useAdmin();
	const { loadSurveys } = useSurveys();
	const location = useLocation();
	const params = useParams();
	const navigate = useNavigate();

	const [isLoadingSurvey, setIsLoadingSurvey] = useState(false);

	// Handle preselected question bank from URL
	useEffect(() => {
		const searchParams = new URLSearchParams(location.search);
		const preselectedBankId = searchParams.get('preselectedBank');

		if (preselectedBankId) {
			// Clear the URL parameter FIRST to avoid re-triggering
			const newUrl = new URL(window.location.href);
			newUrl.searchParams.delete('preselectedBank');
			newUrl.searchParams.delete('t'); // Remove timestamp parameter too
			
			// Use replace instead of replaceState to ensure URL is updated
			window.history.replaceState({}, document.title, newUrl.pathname + newUrl.search);
			
			// Then open create survey modal with preselected question bank (Assessment type only)
			setNewSurvey(prev => ({
				...prev,
				type: 'assessment', // Question banks are only for assessments
				sourceType: 'question_bank',
				questionBankId: preselectedBankId,
			}));
			setShowCreateModal(true);
		}
	}, [location.search, setNewSurvey, setShowCreateModal]); // Trigger on search params changes to handle preselectedBank

	// Load survey based on URL params when component mounts or params change
	useEffect(() => {
		const loadSurveyFromUrl = async () => {
			// Check if we're on a survey detail route
			if (params.id && location.pathname.includes('/survey/')) {
				setIsLoadingSurvey(true);

				try {
					// First try to find the survey in existing surveys
					let survey = surveys.find(s => s._id === params.id);

					// If not found, fetch directly from API
					if (!survey) {
						const response = await api.get(`/admin/surveys/${params.id}`);
						survey = response.data;
						// Also trigger a reload of all surveys to keep state in sync
						loadSurveys();
					}

					// Set the survey if found and not already selected
					if (survey && (!selectedSurvey || selectedSurvey._id !== survey._id)) {
						setSelectedSurvey(survey);
						setTab('detail');
					}
				} catch (error) {
					console.error('Error loading survey:', error);
				} finally {
					setIsLoadingSurvey(false);
				}
			}
		};

		loadSurveyFromUrl();
	}, [params.id, location.pathname]);

	const renderContent = () => {
		// Show loading state while survey is being loaded
		if (isLoadingSurvey) {
			return (
				<div className='flex items-center justify-center h-64'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
				</div>
			);
		}

               // Check if we're on a candidate detail route
               if (location.pathname.includes('/candidate/') && params.responseId && params.surveyId) {
                       return (
                               <CandidateDetailView
                                       responseId={params.responseId}
                                       onBack={async () => {
						// Navigate back to survey statistics tab without page refresh
						navigate(`/admin/survey/${params.surveyId}/statistics`, { replace: true });

						// Ensure the survey is loaded and selected
						let survey = surveys.find(s => s._id === params.surveyId);
						if (!survey) {
							// If survey not found in current list, fetch it
							try {
								const response = await api.get(`/admin/surveys/${params.surveyId}`);
								survey = response.data;
							} catch (error) {
								console.error('Error loading survey:', error);
								return;
							}
						}

						if (survey) {
							setSelectedSurvey(survey);
							setTab('detail');
						}
					}}
                               />
                       );
               }

                // Question bank checkout and confirmation pages
                if (location.pathname.startsWith('/checkout/success')) {
                        return <QuestionBankConfirmationPage />;
                }
                if (location.pathname.startsWith('/checkout/bank/')) {
                        return <QuestionBankCheckoutPage />;
                }
		if (location.pathname === '/checkout') {
			return <CheckoutPage />;
		}

		if (location.pathname === '/admin/purchase-history') {
			return <PurchaseHistoryPage />;
		}

		// Check if we're on a survey detail route (including tabs)
		if (params.id && location.pathname.includes('/survey/') && selectedSurvey) {
			return <SurveyDetailView survey={selectedSurvey} />;
		}

		// Collection detail route
		if (params.id && location.pathname.includes('/collections/')) {
			return <CollectionDetailView />;
		}

		if (tab === 'detail' && selectedSurvey) {
			return <SurveyDetailView survey={selectedSurvey} />;
		}

		if (tab === 'question-banks') {
			if (selectedQuestionBankDetail) {
				return <QuestionBankDetailView questionBank={selectedQuestionBankDetail} />;
			}
			return <QuestionBanksTabbedView />;
		}

		if (tab === 'collections') {
			return <CollectionsListView />;
		}

		if (tab === 'profile') {
			return <ProfileView />;
		}

		if (tab === 'billing') {
			return <BillingView />;
		}

		// Default: survey list view
		return <SurveyListView />;
	};

	// Check if we're on candidate detail route to adjust layout
	const isCandidateDetailRoute = location.pathname.includes('/candidate/');

	return (
		<div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col'>
			{/* Top Navigation */}
			<AdminNavbar />

			{/* Main Content - flex-1 makes it take remaining space */}
			<div className='flex-1 w-full mx-auto px-4 pt-8' style={{ maxWidth: '1440px' }}>
				{!isCandidateDetailRoute && <AdminHeader />}
				{!isCandidateDetailRoute && <NavigationTabs />}
				{renderContent()}

				{/* Modals */}
				<CreateSurveyModal />
				<EditSurveyModal />
				<ScoringModal />
				<QuestionBankModal />
				<EditQuestionBankModal />
				<ShoppingCartModal />
			</div>

			{/* Footer - stays at bottom */}
			<AdminFooter />
		</div>
	);
};

export default AdminDashboard;
