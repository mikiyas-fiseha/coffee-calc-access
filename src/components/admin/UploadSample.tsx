import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, Image, Camera, Plus, X, Trash2 } from 'lucide-react';

const UploadSample = () => {
  const [formData, setFormData] = useState({
    grn: '',
    grade: '',
    totalValue: '',
    ownerName: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const filesArray = Array.from(files);
      setImageFiles(prev => [...prev, ...filesArray]);
      
      // Create previews for new files
      filesArray.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          setImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllImages = () => {
    setImageFiles([]);
    setImagePreviews([]);
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'firsttime');
    formData.append('cloud_name', 'dvrft93br');

    try {
      const response = await fetch(
        'https://api.cloudinary.com/v1_1/dvrft93br/image/upload',
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to upload image to Cloudinary');
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (imageFiles.length === 0 || !user) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please select at least one image.",
      });
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = imageFiles.map(async (file) => {
        // Upload image to Cloudinary
        const imageUrl = await uploadToCloudinary(file);

        // Save sample data to Supabase
        return supabase
          .from('samples')
          .insert({
            grn: formData.grn || null,
            grade: formData.grade || null,
            total_value: formData.totalValue ? parseFloat(formData.totalValue) : null,
            owner_name: formData.ownerName || null,
            image_url: imageUrl,
            uploaded_by: user.id,
            upload_date: formData.date,
          });
      });

      const results = await Promise.all(uploadPromises);
      
      // Check for any errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error(`${errors.length} uploads failed`);
      }

      toast({
        title: "Samples Uploaded",
        description: `${imageFiles.length} coffee sample${imageFiles.length > 1 ? 's' : ''} uploaded successfully!`,
      });

      // Reset form
      setFormData({
        grn: '',
        grade: '',
        totalValue: '',
        ownerName: '',
        date: new Date().toISOString().split('T')[0],
      });
      setImageFiles([]);
      setImagePreviews([]);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "Failed to upload samples. Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Sample
        </CardTitle>
        <CardDescription>
          Add a new coffee sample to the gallery
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mode Toggle */}
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant={!bulkMode ? "default" : "outline"}
              onClick={() => setBulkMode(false)}
              size="sm"
            >
              Single Upload
            </Button>
            <Button
              type="button"
              variant={bulkMode ? "default" : "outline"}
              onClick={() => setBulkMode(true)}
              size="sm"
            >
              Bulk Upload
            </Button>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="image">Sample Image{bulkMode ? 's' : ''}</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
              {imagePreviews.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearAllImages}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                    <Button type="button" variant="outline" size="sm" asChild>
                      <label htmlFor="image" className="cursor-pointer">
                        <Plus className="h-4 w-4 mr-2" />
                        Add More
                      </label>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Click to upload sample image{bulkMode ? 's' : ''}
                  </p>
                  <Button type="button" variant="outline" asChild>
                    <label htmlFor="image" className="cursor-pointer">
                      <Image className="h-4 w-4 mr-2" />
                      Choose Image{bulkMode ? 's' : ''}
                    </label>
                  </Button>
                </div>
              )}
              <input
                id="image"
                type="file"
                accept="image/*"
                multiple={bulkMode}
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grn">GRN <span className="text-muted-foreground">(Optional)</span></Label>
              <Input
                id="grn"
                name="grn"
                value={formData.grn}
                onChange={handleInputChange}
                placeholder="Enter GRN"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade">Grade <span className="text-muted-foreground">(Optional)</span></Label>
              <Input
                id="grade"
                name="grade"
                value={formData.grade}
                onChange={handleInputChange}
                placeholder="e.g., LUBPAA1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalValue">Total Value (Birr) <span className="text-muted-foreground">(Optional)</span></Label>
              <Input
                id="totalValue"
                name="totalValue"
                type="number"
                step="0.01"
                value={formData.totalValue}
                onChange={handleInputChange}
                placeholder="Enter total value"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerName">Owner Name <span className="text-muted-foreground">(Optional)</span></Label>
              <Input
                id="ownerName"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleInputChange}
                placeholder="Enter owner name"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            disabled={uploading || imageFiles.length === 0}
          >
            {uploading ? 'Uploading...' : `Upload ${imageFiles.length} Sample${imageFiles.length !== 1 ? 's' : ''}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default UploadSample;