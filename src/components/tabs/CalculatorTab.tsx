import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calculator, Coffee } from 'lucide-react';

const CalculatorTab = () => {
  const [weight, setWeight] = useState<string>('');
  const [pricePerFeresula, setPricePerFeresula] = useState<string>('');
  const [result, setResult] = useState<number | null>(null);

  const calculateTotal = () => {
    const weightNum = parseFloat(weight);
    const priceNum = parseFloat(pricePerFeresula);
    
    if (!weightNum || !priceNum) {
      return;
    }
    
    // Formula: total = weight × (price / 17) × 1.155
    const total = weightNum * (priceNum / 17) * 1.155;
    setResult(total);
  };

  const clearCalculation = () => {
    setWeight('');
    setPricePerFeresula('');
    setResult(null);
  };

  return (
    <div className="p-4 pb-20 space-y-6">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-3">
          <div className="p-3 rounded-full bg-gradient-to-r from-primary to-accent">
            <Calculator className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-2xl font-bold">Coffee Calculator</h1>
        <p className="text-muted-foreground">Calculate total with 15.5% surcharge</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coffee className="h-5 w-5" />
            Price Calculation
          </CardTitle>
          <CardDescription>
            Enter weight and price per Feresula (17 kg) to calculate total
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                placeholder="Enter weight in kg"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="text-lg"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price">Price per Feresula (17 kg)</Label>
              <div className="relative">
                <Input
                  id="price"
                  type="number"
                  placeholder="Enter price in Birr"
                  value={pricePerFeresula}
                  onChange={(e) => setPricePerFeresula(e.target.value)}
                  className="text-lg pr-12"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  Birr
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={calculateTotal}
              className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              disabled={!weight || !pricePerFeresula}
            >
              Calculate
            </Button>
            <Button 
              variant="outline" 
              onClick={clearCalculation}
              className="px-6"
            >
              Clear
            </Button>
          </div>

          {result !== null && (
            <Card className="bg-gradient-to-r from-accent/10 to-primary/10 border-accent/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Total Amount</p>
                  <p className="text-3xl font-bold text-foreground">
                    {result.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} <span className="text-lg text-muted-foreground">Birr</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Includes 15.5% surcharge
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="bg-muted/30 rounded-lg p-4">
            <h4 className="font-medium mb-2">Calculation Formula:</h4>
            <p className="text-sm text-muted-foreground">
              Total = Weight × (Price ÷ 17) × 1.155
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              The 1.155 factor includes a 15.5% surcharge
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalculatorTab;