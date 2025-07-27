import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Calendar, DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface DailyPrice {
  id: string;
  grade_name: string;
  closing_price: number;
  price_date: string;
  entered_by: string;
}

interface PriceRange {
  grade_name: string;
  lower_price: number;
  upper_price: number;
  last_closing_price: number;
  last_price_date: string;
  days_without_sales: number;
}

const DailyPriceEntry = () => {
  const grades = [
    'LUBPAA1', 'LUBPAA2', 'LUBPAA3', 'LUBPAA4', 'LUBPAA5',
    'LWBP1', 'LWBP2', 'LWBP3', 'LWBP4',
    'LWSD1', 'LWSD2', 'LWSD3', 'LWSD4',
    'LWYC1', 'LWYC2', 'LWYC3', 'LWYC4'
  ];

  const [prices, setPrices] = useState<Record<string, string>>({});
  const [todaysPrices, setTodaysPrices] = useState<DailyPrice[]>([]);
  const [priceRanges, setPriceRanges] = useState<PriceRange[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRanges, setLoadingRanges] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchTodaysPrices();
    fetchPriceRanges();
  }, [selectedDate]);

  const fetchTodaysPrices = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_closing_prices')
        .select('*')
        .eq('price_date', selectedDate);

      if (error) throw error;
      setTodaysPrices(data || []);
      
      // Pre-fill form with existing prices
      const existingPrices: Record<string, string> = {};
      data?.forEach(price => {
        existingPrices[price.grade_name] = price.closing_price.toString();
      });
      setPrices(existingPrices);
    } catch (error) {
      console.error('Error fetching today\'s prices:', error);
    }
  };

  const fetchPriceRanges = async () => {
    setLoadingRanges(true);
    try {
      const ranges: PriceRange[] = [];
      
      for (const grade of grades) {
        const { data, error } = await supabase.rpc('get_current_price_range', {
          grade_name_param: grade
        });

        if (error) {
          console.error(`Error fetching range for ${grade}:`, error);
          continue;
        }

        if (data && data.length > 0) {
          ranges.push(data[0]);
        }
      }
      
      setPriceRanges(ranges);
    } catch (error) {
      console.error('Error fetching price ranges:', error);
    } finally {
      setLoadingRanges(false);
    }
  };

  const handlePriceChange = (grade: string, value: string) => {
    setPrices(prev => ({
      ...prev,
      [grade]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.user_id) return;

    setLoading(true);
    try {
      const updates = [];
      
      for (const [grade, price] of Object.entries(prices)) {
        if (price && !isNaN(Number(price))) {
          const existingPrice = todaysPrices.find(p => p.grade_name === grade);
          
          if (existingPrice) {
            // Update existing price
            updates.push(
              supabase
                .from('daily_closing_prices')
                .update({
                  closing_price: Number(price),
                  entered_by: profile.user_id
                })
                .eq('id', existingPrice.id)
            );
          } else {
            // Insert new price
            updates.push(
              supabase
                .from('daily_closing_prices')
                .insert({
                  grade_name: grade,
                  closing_price: Number(price),
                  price_date: selectedDate,
                  entered_by: profile.user_id
                })
            );
          }
        }
      }

      const results = await Promise.all(updates);
      const errors = results.filter(result => result.error);
      
      if (errors.length > 0) {
        throw new Error('Some prices failed to save');
      }

      toast({
        title: "Prices Updated",
        description: `Successfully updated ${updates.length} closing prices for ${selectedDate}.`,
      });

      await fetchTodaysPrices();
      await fetchPriceRanges();
    } catch (error) {
      console.error('Error saving prices:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save prices. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getGradeCategory = (grade: string) => {
    if (grade.startsWith('LUBPAA')) return 'Local Unwashed';
    if (grade.startsWith('LWBP')) return 'Local Washed';
    if (grade.startsWith('LWSD')) return 'Local Washed Sidama';
    if (grade.startsWith('LWYC')) return 'Local Washed Yirgachefe';
    return 'Other';
  };

  const groupedGrades = grades.reduce((groups: Record<string, string[]>, grade) => {
    const category = getGradeCategory(grade);
    if (!groups[category]) groups[category] = [];
    groups[category].push(grade);
    return groups;
  }, {});

  const getPriceRange = (grade: string) => {
    return priceRanges.find(range => range.grade_name === grade);
  };

  const getRangeStatus = (daysWithoutSales: number) => {
    if (daysWithoutSales === 0) return { status: 'current', color: 'bg-green-500', text: 'Current (±10%)' };
    if (daysWithoutSales <= 10) return { status: 'extended', color: 'bg-yellow-500', text: `Extended (±15%) - ${daysWithoutSales} days` };
    return { status: 'critical', color: 'bg-red-500', text: `Critical (±15%) - ${daysWithoutSales} days` };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Daily Price Entry</h2>
          <p className="text-muted-foreground">Enter closing prices for coffee grades</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      {/* Current Price Ranges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Current Price Ranges
          </CardTitle>
          <CardDescription>
            Active price ranges based on recent closing prices and sales activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingRanges ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(groupedGrades).map(([category, categoryGrades]) => (
                <div key={category} className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground">{category}</h4>
                  {categoryGrades.map(grade => {
                    const range = getPriceRange(grade);
                    if (!range) return null;
                    
                    const rangeStatus = getRangeStatus(range.days_without_sales);
                    
                    return (
                      <div key={grade} className="p-3 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{grade}</span>
                          <Badge variant="secondary" className="text-xs">
                            <div className={`w-2 h-2 rounded-full ${rangeStatus.color} mr-1`}></div>
                            {rangeStatus.text}
                          </Badge>
                        </div>
                        <div className="text-xs space-y-1">
                          <div className="flex justify-between">
                            <span>Range:</span>
                            <span className="font-mono">
                              {range.lower_price.toFixed(2)} - {range.upper_price.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Last Price:</span>
                            <span className="font-mono">{range.last_closing_price.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Date:</span>
                            <span>{new Date(range.last_price_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Enter Closing Prices
          </CardTitle>
          <CardDescription>
            Enter closing prices for {new Date(selectedDate).toLocaleDateString()}. Leave empty if no sales occurred.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {Object.entries(groupedGrades).map(([category, categoryGrades]) => (
              <div key={category}>
                <h4 className="font-semibold mb-3 text-foreground">{category}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {categoryGrades.map(grade => {
                    const existingPrice = todaysPrices.find(p => p.grade_name === grade);
                    return (
                      <div key={grade} className="space-y-2">
                        <Label htmlFor={grade} className="text-sm">
                          {grade}
                          {existingPrice && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Updated
                            </Badge>
                          )}
                        </Label>
                        <Input
                          id={grade}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={prices[grade] || ''}
                          onChange={(e) => handlePriceChange(grade, e.target.value)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPrices({})}
                disabled={loading}
              >
                Clear All
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Prices'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Price Range Logic
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="font-medium">Current Range (±10%)</span>
              </div>
              <p className="text-xs text-muted-foreground">
                When sales are recorded on the same day as price entry
              </p>
            </div>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="font-medium">Extended Range (±15%)</span>
              </div>
              <p className="text-xs text-muted-foreground">
                1-10 working days without sales, range widens automatically
              </p>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="font-medium">Critical Range (±15%)</span>
              </div>
              <p className="text-xs text-muted-foreground">
                More than 10 working days without sales, requires attention
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyPriceEntry;