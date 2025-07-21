import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, Image, Camera } from 'lucide-react';

const UploadSample = () => {
  const [formData, setFormData] = useState({
    grn: '',
    grade: '',
    totalValue: '',
    ownerName: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
    
    if (!imageFile || !user) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill all fields and select an image.",
      });
      return;
    }

    setUploading(true);

    try {
      // Upload image to Cloudinary
      const imageUrl = await uploadToCloudinary(imageFile);

      // Save sample data to Supabase
      const { error } = await supabase
        .from('samples')
        .insert({
          grn: formData.grn,
          grade: formData.grade,
          total_value: parseFloat(formData.totalValue),
          owner_name: formData.ownerName,
          image_url: imageUrl,
          uploaded_by: user.id,
          upload_date: formData.date,
        });

      if (error) throw error;

      toast({
        title: "Sample Uploaded",
        description: "Coffee sample has been uploaded successfully!",
      });

      // Reset form
      setFormData({
        grn: '',
        grade: '',
        totalValue: '',
        ownerName: '',
        date: new Date().toISOString().split('T')[0],
      });
      setImageFile(null);
      setImagePreview(null);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "Failed to upload sample. Please try again.",
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
          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="image">Sample Image</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
              {imagePreview ? (
                <div className="space-y-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                  >
                    Remove Image
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Click to upload sample image
                  </p>
                  <Button type="button" variant="outline" asChild>
                    <label htmlFor="image" className="cursor-pointer">
                      <Image className="h-4 w-4 mr-2" />
                      Choose Image
                    </label>
                  </Button>
                </div>
              )}
              <input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                required
              />
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grn">GRN</Label>
              <Input
                id="grn"
                name="grn"
                value={formData.grn}
                onChange={handleInputChange}
                placeholder="Enter GRN"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade">Grade</Label>
              <Input
                id="grade"
                name="grade"
                value={formData.grade}
                onChange={handleInputChange}
                placeholder="e.g., LUBPAA1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalValue">Total Value (Birr)</Label>
              <Input
                id="totalValue"
                name="totalValue"
                type="number"
                step="0.01"
                value={formData.totalValue}
                onChange={handleInputChange}
                placeholder="Enter total value"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerName">Owner Name</Label>
              <Input
                id="ownerName"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleInputChange}
                placeholder="Enter owner name"
                required
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
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Sample'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default UploadSample;