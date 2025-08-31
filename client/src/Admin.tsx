import React from 'react';
import { AdminProvider } from './contexts/AdminContext';
import { ShoppingCartProvider } from './contexts/ShoppingCartContext';
import AuthWrapper from './components/auth/AuthWrapper';
import AdminDashboard from './components/AdminDashboard';

const Admin: React.FC = () => {
	return (
		<AdminProvider>
			<ShoppingCartProvider>
				<AuthWrapper>
					<AdminDashboard />
				</AuthWrapper>
			</ShoppingCartProvider>
		</AdminProvider>
	);
};

export default Admin;
