import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Users, BarChart3, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import UploadSample from '@/components/admin/UploadSample';
import UserManagement from '@/components/admin/UserManagement';
import Dashboard from '@/components/admin/Dashboard';
import DailyPriceEntry from '@/components/admin/DailyPriceEntry';

const AdminTab = () => {
  const { profile } = useAuth();
  const isSuperAdmin = profile?.role === 'super_admin';
  const isAdmin = profile?.role === 'admin' || isSuperAdmin;

  // Default to first available tab based on role
  const defaultTab = isSuperAdmin ? 'dashboard' : 'upload';

  return (
    <div className="p-4 pb-20">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">Admin Panel</h1>
        <p className="text-muted-foreground">Manage samples, users, and view analytics</p>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className={`grid w-full ${isSuperAdmin ? 'grid-cols-4' : 'grid-cols-2'}`}>
          {isSuperAdmin && (
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
          )}
          {isSuperAdmin && (
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
          )}
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Daily Prices
          </TabsTrigger>
        </TabsList>

        {isSuperAdmin && (
          <TabsContent value="dashboard" className="mt-6">
            <Dashboard />
          </TabsContent>
        )}

        {isSuperAdmin && (
          <TabsContent value="users" className="mt-6">
            <UserManagement />
          </TabsContent>
        )}

        <TabsContent value="upload" className="mt-6">
          <UploadSample />
        </TabsContent>
        
        <TabsContent value="pricing" className="mt-6">
          <DailyPriceEntry />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminTab;