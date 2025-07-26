import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { BarChart3, Users, DollarSign, Clock, Settings } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    paidUsers: 0,
    pendingPayments: 0,
    estimatedRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showFiltersToUsers, setShowFiltersToUsers] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(false);
  
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
    if (profile?.role === 'super_admin') {
      fetchFilterSettings();
    }
  }, [profile]);

  const fetchStats = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('is_paid, payment_status, selected_plan');

      if (error) throw error;

      const totalUsers = profiles?.length || 0;
      const paidUsers = profiles?.filter(p => p.is_paid).length || 0;
      const pendingPayments = profiles?.filter(p => p.payment_status === 'pending').length || 0;
      
      // Estimate revenue based on selected plans
      const estimatedRevenue = profiles?.reduce((sum, profile) => {
        if (!profile.is_paid || !profile.selected_plan) return sum;
        
        const planPrices: Record<string, number> = {
          '1 Month': 2000,
          '3 Months': 6000,
          '6 Months': 10000,
          '1 Year': 20000,
        };
        
        return sum + (planPrices[profile.selected_plan] || 0);
      }, 0) || 0;

      setStats({
        totalUsers,
        paidUsers,
        pendingPayments,
        estimatedRevenue,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'show_filters_to_users')
        .maybeSingle();

      if (error) {
        console.error('Error fetching filter settings:', error);
        return;
      }

      setShowFiltersToUsers(data?.setting_value ?? true);
    } catch (error) {
      console.error('Error fetching filter settings:', error);
    }
  };

  const updateFilterSettings = async (showFilters: boolean) => {
    setSettingsLoading(true);
    try {
      const { error } = await supabase
        .from('admin_settings')
        .update({ setting_value: showFilters })
        .eq('setting_key', 'show_filters_to_users');

      if (error) throw error;

      setShowFiltersToUsers(showFilters);
      toast({
        title: "Settings Updated",
        description: `Filter visibility ${showFilters ? 'enabled' : 'disabled'} for regular users.`,
      });
    } catch (error) {
      console.error('Error updating filter settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update settings. Please try again.",
      });
    } finally {
      setSettingsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toString(),
      icon: Users,
      description: 'All registered users',
    },
    {
      title: 'Paid Users',
      value: stats.paidUsers.toString(),
      icon: DollarSign,
      description: 'Users with active subscriptions',
    },
    {
      title: 'Pending Payments',
      value: stats.pendingPayments.toString(),
      icon: Clock,
      description: 'Awaiting approval',
    },
    {
      title: 'Estimated Revenue',
      value: `${stats.estimatedRevenue.toLocaleString()} Birr`,
      icon: BarChart3,
      description: 'Total revenue from subscriptions',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Super Admin Settings */}
      {profile?.role === 'super_admin' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Super Admin Settings
            </CardTitle>
            <CardDescription>
              Control application settings and user experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-filters">Show Filters to Users</Label>
                <p className="text-sm text-muted-foreground">
                  Allow regular users to see filter options (warehouse, etc.) in the Display section
                </p>
              </div>
              <Switch
                id="show-filters"
                checked={showFiltersToUsers}
                onCheckedChange={updateFilterSettings}
                disabled={settingsLoading}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;