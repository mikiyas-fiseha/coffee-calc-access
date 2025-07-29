import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Coffee, BarChart3, DollarSign, AlertCircle } from 'lucide-react';

interface CoffeeGrade {
  id: string;
  grade_name: string;
  lower_price: number;
  upper_price: number;
  updated_at: string;
}

interface DynamicPriceRange {
  grade_name: string;
  lower_price: number;
  upper_price: number;
  last_closing_price: number;
  last_price_date: string;
  days_without_sales: number;
}

const InfoTab = () => {
  const [grades, setGrades] = useState<CoffeeGrade[]>([]);
  const [dynamicRanges, setDynamicRanges] = useState<DynamicPriceRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDynamic, setLoadingDynamic] = useState(true);

  useEffect(() => {
    fetchGrades();
    fetchDynamicRanges();
  }, []);

  const fetchGrades = async () => {
    try {
      const { data, error } = await supabase
        .from('coffee_grades')
        .select('*')
        .order('grade_name', { ascending: true });

      if (error) throw error;
      setGrades(data || []);
    } catch (error) {
      console.error('Error fetching grades:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDynamicRanges = async () => {
    setLoadingDynamic(true);
    try {
      const dynamicGrades = [
        'LUBPAA1', 'LUBPAA2', 'LUBPAA3', 'LUBPAA4', 'LUBPAA5',
        'LWBP1', 'LWBP2', 'LWBP3', 'LWBP4',
        'LWSD1', 'LWSD2', 'LWSD3', 'LWSD4',
        'LWYC1', 'LWYC2', 'LWYC3', 'LWYC4'
      ];
      
      const ranges: DynamicPriceRange[] = [];
      
      for (const grade of dynamicGrades) {
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
      
      setDynamicRanges(ranges);
    } catch (error) {
      console.error('Error fetching dynamic ranges:', error);
    } finally {
      setLoadingDynamic(false);
    }
  };

  // Listen for daily price updates to refresh ranges
  useEffect(() => {
    const channel = supabase
      .channel('daily_price_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'daily_closing_prices'
      }, () => {
        fetchDynamicRanges();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getGradeCategory = (gradeName: string) => {
    if (gradeName.startsWith('LUBPAA')) return 'LUBPAA';
    if (gradeName.startsWith('LWBP')) return 'LWBP';
    if (gradeName.startsWith('LWSD')) return 'LWSD';
    if (gradeName.startsWith('LWYC')) return 'LWYC';
    return 'Other';
  };

  const groupedGrades = grades.reduce((acc, grade) => {
    const category = getGradeCategory(grade.grade_name);
    if (!acc[category]) acc[category] = [];
    acc[category].push(grade);
    return acc;
  }, {} as Record<string, CoffeeGrade[]>);

  const getCategoryInfo = (category: string) => {
    const info = {
      'LUBPAA': { name: 'Premium Arabica', color: 'bg-green-500', description: 'Highest quality arabica beans' },
      'LWBP': { name: 'Washed Arabica', color: 'bg-blue-500', description: 'Washed process arabica' },
      'LWSD': { name: 'Semi-Dry Arabica', color: 'bg-orange-500', description: 'Semi-dry process arabica' },
      'LWYC': { name: 'Yellow Cherry', color: 'bg-yellow-500', description: 'Yellow cherry arabica' },
      'Local Unwashed': { name: 'Local Unwashed (LUBPAA)', color: 'bg-orange-500', description: 'Local unwashed coffee grades with dynamic pricing' },
      'Local Washed': { name: 'Local Washed (LWBP)', color: 'bg-teal-500', description: 'Local washed coffee grades with dynamic pricing' },
      'Local Washed Sidama': { name: 'Local Washed Sidama (LWSD)', color: 'bg-purple-500', description: 'Local washed Sidama coffee with dynamic pricing' },
      'Local Washed Yirgachefe': { name: 'Local Washed Yirgachefe (LWYC)', color: 'bg-pink-500', description: 'Local washed Yirgachefe coffee with dynamic pricing' },
    };
    return info[category] || { name: category, color: 'bg-gray-500', description: 'Other coffee grades' };
  };

  const getDynamicGradeCategory = (grade: string) => {
    if (grade.startsWith('LUBPAA')) return 'Local Unwashed';
    if (grade.startsWith('LWBP')) return 'Local Washed';
    if (grade.startsWith('LWSD')) return 'Local Washed Sidama';
    if (grade.startsWith('LWYC')) return 'Local Washed Yirgachefe';
    return 'Other';
  };

  const groupedDynamicRanges = dynamicRanges.reduce((groups: Record<string, DynamicPriceRange[]>, range) => {
    const category = getDynamicGradeCategory(range.grade_name);
    if (!groups[category]) groups[category] = [];
    groups[category].push(range);
    return groups;
  }, {});

  const getRangeStatus = (daysWithoutSales: number) => {
    if (daysWithoutSales === 0) return { status: 'current', color: 'bg-green-500', text: 'Current' };
    if (daysWithoutSales <= 10) return { status: 'extended', color: 'bg-yellow-500', text: 'Extended' };
    return { status: 'critical', color: 'bg-red-500', text: 'Critical' };
  };

  if (loading && loadingDynamic) {
    return (
      <div className="p-4 pb-20">
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading market information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex justify-center mb-3">
          <div className="p-3 rounded-full bg-gradient-to-r from-primary to-accent">
            <BarChart3 className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-2xl font-bold">Market Information</h1>
        <p className="text-muted-foreground">Current coffee grades & price ranges</p>
      </div>

      {/* Market Overview */}
      <Card className="bg-gradient-to-r from-accent/10 to-primary/10 border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Market Overview
          </CardTitle>
          <CardDescription>
            Ethiopian coffee grade classifications and current price ranges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{grades.length}</div>
              <p className="text-sm text-muted-foreground">Fixed Grades</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{dynamicRanges.length}</div>
              <p className="text-sm text-muted-foreground">Dynamic Grades</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{Object.keys(groupedGrades).length + Object.keys(groupedDynamicRanges).length}</div>
              <p className="text-sm text-muted-foreground">Total Categories</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {grades.length > 0 ? new Date(Math.max(...grades.map(g => new Date(g.updated_at).getTime()))).toLocaleDateString() : '-'}
              </div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Price Ranges */}
      {Object.keys(groupedDynamicRanges).length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Dynamic Price Ranges</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Prices calculated based on daily closing prices with automatic adjustments for sales activity
          </p>
          
          {Object.entries(groupedDynamicRanges).map(([category, categoryRanges]) => {
            const categoryInfo = getCategoryInfo(category);
            return (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${categoryInfo.color}`}></div>
                    {categoryInfo.name}
                  </CardTitle>
                  <CardDescription>{categoryInfo.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryRanges.map((range) => {
                      const rangeStatus = getRangeStatus(range.days_without_sales);
                      return (
                        <div key={range.grade_name} className="p-4 border rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{range.grade_name}</span>
                            <div className="flex items-center gap-1">
                              <div className={`w-2 h-2 rounded-full ${rangeStatus.color}`}></div>
                              <span className="text-xs text-muted-foreground">{rangeStatus.text}</span>
                            </div>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Current Range:</span>
                              <span className="font-mono font-medium">
                                {range.lower_price && range.upper_price 
                                  ? `${range.lower_price.toFixed(2)} - ${range.upper_price.toFixed(2)}`
                                  : 'None'
                                }
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Base Price:</span>
                              <span className="font-mono">{range.last_closing_price.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Last Updated:</span>
                              <span>{new Date(range.last_price_date).toLocaleDateString()}</span>
                            </div>
                            {range.days_without_sales > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Days w/o Sales:</span>
                                <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                                  {range.days_without_sales}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Fixed Price Grades */}
      {Object.keys(groupedGrades).length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Fixed Price Grades</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Traditional coffee grades with manually set price ranges
          </p>
        </div>
      )}

      {/* Grade Categories */}
      {Object.entries(groupedGrades).map(([category, categoryGrades]) => {
        const categoryInfo = getCategoryInfo(category);
        
        return (
          <Card key={category} className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30">
              <CardTitle className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${categoryInfo.color}`}></div>
                <Coffee className="h-5 w-5" />
                {categoryInfo.name}
              </CardTitle>
              <CardDescription>{categoryInfo.description}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="text-left p-3 font-medium">Grade</th>
                      <th className="text-right p-3 font-medium">Lower Price</th>
                      <th className="text-right p-3 font-medium">Upper Price</th>
                      <th className="text-right p-3 font-medium">Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryGrades.map((grade, index) => {
                      const range = grade.upper_price - grade.lower_price;
                      const isEven = index % 2 === 0;
                      
                      return (
                        <tr
                          key={grade.id}
                          className={`border-b border-border/50 ${isEven ? 'bg-background' : 'bg-muted/20'}`}
                        >
                          <td className="p-3">
                            <Badge variant="secondary" className="font-mono">
                              {grade.grade_name}
                            </Badge>
                          </td>
                          <td className="text-right p-3 font-medium">
                            {grade.lower_price.toLocaleString()}
                          </td>
                          <td className="text-right p-3 font-medium">
                            {grade.upper_price.toLocaleString()}
                          </td>
                          <td className="text-right p-3">
                            <Badge variant="outline" className="text-xs">
                              ±{range.toLocaleString()}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Footer Note */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            Prices are in Ethiopian Birr per quintal. Market prices may vary based on quality, 
            origin, and current market conditions. Last updated: {new Date().toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default InfoTab;