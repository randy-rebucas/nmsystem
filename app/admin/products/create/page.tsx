'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

export default function CreateProductPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [useImageUrl, setUseImageUrl] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    cost: '',
    sellingPrice: '',
    imageUrl: '',
    isActive: true,
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      setImageFile(file);
      setError('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setForm({ ...form, imageUrl: '' });
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      let imageData: string | undefined = undefined;

      if (useImageUrl && form.imageUrl) {
        imageData = form.imageUrl;
      } else if (imageFile) {
        imageData = await convertFileToBase64(imageFile);
      }

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          cost: parseFloat(form.cost),
          sellingPrice: parseFloat(form.sellingPrice),
          image: imageData,
          isActive: form.isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create product');
        return;
      }
      // Redirect to products list page after successful creation
      router.push('/admin/products');
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin">Admin</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin/products">Products</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Create</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Create Product</h1>
        <p className="text-sm text-muted-foreground">
          Add a new product to the catalog.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
          <CardDescription>Fill in the information below to create a new product.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="Enter product name"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, description: e.target.value })}
                  placeholder="Enter product description (optional)"
                  rows={4}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <Switch
                    id="useImageUrl"
                    checked={useImageUrl}
                    onCheckedChange={setUseImageUrl}
                  />
                  <Label htmlFor="useImageUrl" className="cursor-pointer">
                    Use image URL instead of uploading
                  </Label>
                </div>
                {useImageUrl ? (
                  <div className="space-y-2">
                    <Label htmlFor="imageUrl">Image URL</Label>
                    <Input
                      id="imageUrl"
                      type="url"
                      value={form.imageUrl}
                      onChange={(e) => {
                        setForm({ ...form, imageUrl: e.target.value });
                        setImagePreview(e.target.value);
                      }}
                      placeholder="https://example.com/image.jpg"
                    />
                    {form.imageUrl && (
                      <div className="mt-2">
                        <img
                          src={form.imageUrl}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-md border"
                          onError={() => setImagePreview(null)}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="image">Product Image</Label>
                    {imagePreview ? (
                      <div className="relative inline-block">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-48 h-48 object-cover rounded-md border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8"
                          onClick={removeImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-full">
                        <label
                          htmlFor="image"
                          className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">
                              PNG, JPG, GIF up to 5MB
                            </p>
                          </div>
                          <input
                            id="image"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageChange}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Cost (₱) *</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  required
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">
                  Base cost of the product.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sellingPrice">Selling Price (₱) *</Label>
                <Input
                  id="sellingPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.sellingPrice}
                  onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                  required
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">
                  Final price customers will pay.
                </p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="isActive" className="text-base">
                      Product Status
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Enable or disable this product for purchase.
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={form.isActive}
                    onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                asChild
              >
                <Link href="/admin/products">Cancel</Link>
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? 'Creating...' : 'Create Product'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

