import React from 'react';
import AppLayout from '@/components/AppLayout';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppProvider } from '@/contexts/AppContext';

const Index: React.FC = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <AppLayout />
      </AppProvider>
    </AuthProvider>
  );
};

export default Index;
