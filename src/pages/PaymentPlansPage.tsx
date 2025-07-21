import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Clock, Check, Star, CreditCard } from 'lucide-react';

interface PaymentPlan {
  id: string;
  duration: string;
  price: number;
  months: number;
}

const PaymentPlansPage = () => {
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_plans')
        .select('*')
        .order('months', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (plan: PaymentPlan) => {
    if (!profile) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          payment_status: 'pending',
          selected_plan: plan.duration,
        })
        .eq('user_id', profile.user_id);

      if (error) throw error;

      await refreshProfile();
      
      toast({
        title: "Payment Submitted",
        description: `Your payment for ${plan.duration} plan has been submitted for approval.`,
      });
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit payment. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getPopularPlan = () => {
    return plans.find(plan => plan.months === 6); // 6 months is popular
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading payment plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Select a subscription plan to access our premium coffee trading features and sample gallery.
          </p>
        </div>

        {/* Bank Information */}
        <Card className="mb-8 bg-gradient-to-r from-accent/10 to-primary/10 border-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-muted-foreground">Account Name</p>
                <p className="font-semibold">Mikiyas Fiseha</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Bank</p>
                <p className="font-semibold">CBE (Commercial Bank of Ethiopia)</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Account Number</p>
                <p className="font-semibold">1000300692382</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Plans */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const isPopular = plan.id === getPopularPlan()?.id;
            const pricePerMonth = plan.price / plan.months;
            
            return (
              <Card 
                key={plan.id} 
                className={`relative ${isPopular ? 'border-primary shadow-lg scale-105' : ''} hover:shadow-md transition-all`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-1">
                      <Star className="h-3 w-3 mr-1" />
                      Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{plan.duration}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold text-foreground">
                      {plan.price.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground"> Birr</span>
                  </CardDescription>
                  <div className="text-sm text-muted-foreground">
                    ~{Math.round(pricePerMonth).toLocaleString()} Birr/month
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Access to sample gallery</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Price calculator</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Market information</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>{plan.months} month{plan.months > 1 ? 's' : ''} access</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handlePayment(plan)}
                    disabled={submitting || profile?.payment_status === 'pending'}
                    className={`w-full ${isPopular ? 'bg-primary hover:bg-primary/90' : ''}`}
                    variant={isPopular ? 'default' : 'outline'}
                  >
                    {profile?.payment_status === 'pending' ? 'Payment Pending' : 'I Paid'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {profile?.payment_status === 'pending' && (
          <Card className="mt-8 bg-warning/10 border-warning/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="h-12 w-12 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
                <h3 className="font-semibold mb-2">Payment Under Review</h3>
                <p className="text-sm text-muted-foreground">
                  Your payment for <strong>{profile.selected_plan}</strong> is being reviewed. 
                  You'll receive access once it's approved by our admin team.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PaymentPlansPage;