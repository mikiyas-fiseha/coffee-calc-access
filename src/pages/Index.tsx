import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthPage from './AuthPage';
import PaymentPlansPage from './PaymentPlansPage';
import BottomNavigation from '@/components/BottomNavigation';
import SlideOutMenu from '@/components/SlideOutMenu';
import CalculatorTab from '@/components/tabs/CalculatorTab';
import DisplayTab from '@/components/tabs/DisplayTab';
import InfoTab from '@/components/tabs/InfoTab';
import AdminTab from '@/components/tabs/AdminTab';

const Index = () => {
  const { session, user, profile, loading, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('calculator');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Refresh profile on mount to ensure we have the latest data
  useEffect(() => {
    if (user && !loading) {
      refreshProfile();
    }
  }, [user, loading, refreshProfile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session || !user) {
    return <AuthPage />;
  }

  if (profile && !profile.is_paid && profile.payment_status !== 'pending') {
    return <PaymentPlansPage />;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'calculator':
        return <CalculatorTab />;
      case 'display':
        return <DisplayTab />;
      case 'info':
        return <InfoTab />;
      case 'admin':
        return <AdminTab />;
      default:
        return <CalculatorTab />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderTabContent()}
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onMenuClick={() => setIsMenuOpen(true)}
      />
      <SlideOutMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
      />
    </div>
  );
};

export default Index;
