import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calculator, Coffee } from 'lucide-react';

const CalculatorTab = () => {
  const [weight, setWeight] = useState<string>('');
  const [lot, setLot] = useState<string>('');
  const [pricePerFeresula, setPricePerFeresula] = useState<string>('');
  const [weightResult, setWeightResult] = useState<number | null>(null);
  const [lotResult, setLotResult] = useState<number | null>(null);
  const [useWeight, setUseWeight] = useState<boolean>(true);
  const [useLot, setUseLot] = useState<boolean>(false);

  const calculateTotal = () => {
    const priceNum = parseFloat(pricePerFeresula);
    
    if (!priceNum) {
      return;
    }
    
    // Weight calculation: total = weight × (price / 17) × 1.155
    if (useWeight && weight) {
      const weightNum = parseFloat(weight);
      if (weightNum) {
        const weightTotal = weightNum * (priceNum / 17) * 1.155;
        setWeightResult(weightTotal);
      }
    }
    
    // Lot calculation: total = (lot × 150 × price in feresula) × 1.155
    if (useLot && lot) {
      const lotNum = parseFloat(lot);
      if (lotNum) {
        const lotTotal = (lotNum * 150 * priceNum) * 1.155;
        setLotResult(lotTotal);
      }
    }
  };

  const clearCalculation = () => {
    setWeight('');
    setLot('');
    setPricePerFeresula('');
    setWeightResult(null);
    setLotResult(null);
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
            <div className="space-y-3">
              <Label className="text-base font-medium">Calculation Methods</Label>
              <div className="flex gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={useWeight}
                    onChange={(e) => setUseWeight(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Weight Formula</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={useLot}
                    onChange={(e) => setUseLot(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Lot Formula</span>
                </label>
              </div>
            </div>

            {useWeight && (
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
            )}

            {useLot && (
              <div className="space-y-2">
                <Label htmlFor="lot">Lot Quantity</Label>
                <Input
                  id="lot"
                  type="number"
                  placeholder="Enter lot quantity"
                  value={lot}
                  onChange={(e) => setLot(e.target.value)}
                  className="text-lg"
                />
              </div>
            )}
            
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
              disabled={!pricePerFeresula || (!useWeight && !useLot) || (useWeight && !weight) || (useLot && !lot)}
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

          {(weightResult !== null || lotResult !== null) && (
            <div className="space-y-4">
              {weightResult !== null && (
                <Card className="bg-gradient-to-r from-accent/10 to-primary/10 border-accent/20">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Weight Formula Result</p>
                      <p className="text-3xl font-bold text-foreground">
                        {weightResult.toLocaleString('en-US', {
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

              {lotResult !== null && (
                <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Lot Formula Result</p>
                      <p className="text-3xl font-bold text-foreground">
                        {lotResult.toLocaleString('en-US', {
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

              <Card className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
                <CardContent className="pt-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
                    ⚠️ Results may vary due to weight inaccuracies
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="bg-muted/30 rounded-lg p-4">
            <h4 className="font-medium mb-2">Calculation Formulas:</h4>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">
                  <strong>Weight Formula:</strong> Weight × (Price ÷ 17) × 1.155
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  <strong>Lot Formula:</strong> (Lot × 150 × Price) × 1.155
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                The 1.155 factor includes a 15.5% surcharge
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalculatorTab;