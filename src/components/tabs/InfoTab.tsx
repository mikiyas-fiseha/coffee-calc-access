import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Coffee, BarChart3 } from 'lucide-react';

interface CoffeeGrade {
  id: string;
  grade_name: string;
  lower_price: number;
  upper_price: number;
  updated_at: string;
}

const InfoTab = () => {
  const [grades, setGrades] = useState<CoffeeGrade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGrades();
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
    };
    return info[category] || { name: category, color: 'bg-gray-500', description: 'Other coffee grades' };
  };

  if (loading) {
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
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">
                {grades.length}
              </p>
              <p className="text-sm text-muted-foreground">Active Grades</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-accent">
                {Object.keys(groupedGrades).length}
              </p>
              <p className="text-sm text-muted-foreground">Categories</p>
            </div>
          </div>
        </CardContent>
      </Card>

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