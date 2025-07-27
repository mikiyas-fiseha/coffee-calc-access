import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Search, Grid3X3, Grid2X2, Grid, Lock, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Sample {
  id: string;
  grn: string;
  grade: string;
  total_value: number;
  owner_name: string;
  warehouse: string;
  image_url: string;
  upload_date: string;
  created_at: string;
}

const DisplayTab = () => {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [filteredSamples, setFilteredSamples] = useState<Sample[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('SC');
  const [columns, setColumns] = useState(2);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<Sample | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.is_paid) {
      fetchSamples();
      fetchFilterVisibility();
    } else {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    // Filter samples based on search term and warehouse
    const filtered = samples.filter(sample => {
      const matchesSearch = sample.grn.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesWarehouse = warehouseFilter === 'all' || sample.warehouse === warehouseFilter;
      return matchesSearch && matchesWarehouse;
    });
    setFilteredSamples(filtered);
  }, [samples, searchTerm, warehouseFilter]);

  const fetchSamples = async () => {
    try {
      const { data, error } = await supabase
        .from('samples')
        .select('*')
        .order('upload_date', { ascending: false }); // Most recent first

      if (error) throw error;
      setSamples(data || []);
      setFilteredSamples(data || []);
    } catch (error) {
      console.error('Error fetching samples:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load samples. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterVisibility = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'show_filters_to_users')
        .maybeSingle();

      if (error) {
        console.error('Error fetching filter visibility:', error);
        return;
      }

      // Admins and super admins always see filters
      // Regular users see filters based on admin setting
      const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
      setShowFilters(isAdmin || (data?.setting_value ?? true));
    } catch (error) {
      console.error('Error fetching filter visibility:', error);
    }
  };

  const handleImageClick = (sample: Sample) => {
    setSelectedImage(sample);
    setCurrentImageIndex(filteredSamples.findIndex(s => s.id === sample.id));
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (!selectedImage) return;
    
    let newIndex;
    if (direction === 'prev') {
      newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : filteredSamples.length - 1;
    } else {
      newIndex = currentImageIndex < filteredSamples.length - 1 ? currentImageIndex + 1 : 0;
    }
    
    setCurrentImageIndex(newIndex);
    setSelectedImage(filteredSamples[newIndex]);
  };

  const getColumnClass = () => {
    switch (columns) {
      case 2: return 'grid-cols-2';
      case 3: return 'grid-cols-3';
      case 4: return 'grid-cols-4';
      default: return 'grid-cols-2';
    }
  };

  if (!profile) {
    return (
      <div className="p-4 pb-20">
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile.is_paid) {
    return (
      <div className="p-4 pb-20">
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="w-full max-w-md text-center">
            <CardContent className="pt-6">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Premium Feature</h3>
              <p className="text-muted-foreground mb-4">
                Access to the sample gallery requires a paid subscription. 
                Upgrade your account to view coffee samples and trading data.
              </p>
              <Badge variant="outline" className="text-warning">
                Subscription Required
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 pb-20">
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading samples...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 space-y-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">Sample Gallery</h1>
        <p className="text-muted-foreground">Browse coffee trading samples</p>
      </div>

      {/* Search and Controls */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by GRN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select 
            value={warehouseFilter} 
            onValueChange={setWarehouseFilter}
            disabled={!showFilters && !(profile?.role === 'admin' || profile?.role === 'super_admin')}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by warehouse" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All warehouses</SelectItem>
              <SelectItem value="SC">SC</SelectItem>
              <SelectItem value="DI">DI</SelectItem>
              <SelectItem value="DD">DD</SelectItem>
              <SelectItem value="JM">JM</SelectItem>
              <SelectItem value="HW">HW</SelectItem>
              <SelectItem value="BH">BH</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {filteredSamples.length} sample{filteredSamples.length !== 1 ? 's' : ''} found
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={columns === 2 ? "default" : "outline"}
              size="sm"
              onClick={() => setColumns(2)}
            >
              <Grid2X2 className="h-4 w-4" />
            </Button>
            <Button
              variant={columns === 3 ? "default" : "outline"}
              size="sm"
              onClick={() => setColumns(3)}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={columns === 4 ? "default" : "outline"}
              size="sm"
              onClick={() => setColumns(4)}
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Sample Grid */}
      {filteredSamples.length === 0 ? (
        <div className="text-center py-12">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-2">No Samples Found</h3>
          <p className="text-muted-foreground">
            {searchTerm || warehouseFilter ? 'Try adjusting your search or filter.' : 'No samples have been uploaded yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(
            filteredSamples.reduce((groups: Record<string, Sample[]>, sample) => {
              const date = new Date(sample.upload_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              });
              if (!groups[date]) groups[date] = [];
              groups[date].push(sample);
              return groups;
            }, {})
          ).map(([date, dateSamples]) => (
            <div key={date} className="space-y-4">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold text-foreground">{date}</h3>
                <div className="flex-1 h-px bg-border"></div>
                <Badge variant="secondary" className="text-xs">
                  {dateSamples.length} sample{dateSamples.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              
              <div className={`grid ${getColumnClass()} gap-4`}>
                {dateSamples.map((sample) => (
                  <Dialog key={sample.id}>
                    <DialogTrigger asChild>
                      <Card 
                        className="cursor-pointer hover:shadow-lg transition-all overflow-hidden"
                        onClick={() => handleImageClick(sample)}
                      >
                        <div className="aspect-square bg-muted overflow-hidden">
                          <img
                            src={sample.image_url}
                            alt={`Sample ${sample.grn}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                            loading="lazy"
                          />
                        </div>
                        {sample.warehouse && (
                          <div className="p-2">
                            <Badge variant="outline" className="text-xs">
                              {sample.warehouse}
                            </Badge>
                          </div>
                        )}
                      </Card>
                    </DialogTrigger>
                    
                    <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col">
                      <DialogHeader className="flex-shrink-0">
                        <DialogTitle className="flex items-center justify-between">
                          <span>Sample Details</span>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigateImage('prev')}
                              disabled={filteredSamples.length <= 1}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigateImage('next')}
                              disabled={filteredSamples.length <= 1}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </DialogTitle>
                      </DialogHeader>
                      
                      <div className="flex-1 bg-muted rounded-lg overflow-hidden">
                        <img
                          src={selectedImage?.image_url}
                          alt={`Sample ${selectedImage?.grn}`}
                          className="w-full h-full object-contain"
                          style={{ userSelect: 'none', pointerEvents: 'none' }}
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DisplayTab;