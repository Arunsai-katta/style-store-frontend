'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Upload,
  X,
  Plus,
  Trash2,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { productAPI, uploadAPI } from '@/services/api';
import toast from 'react-hot-toast';

interface ColorVariant {
  _id?: string;
  colorName: string;
  colorCode: string;
  images: string[];
  sizes: { size: string; quantity: number }[];
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const CATEGORIES = ['t-shirts', 'hoodies', 'sweatshirts'];

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<{ [key: string]: boolean }>({});
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    shortDescription: '',
    category: '',
    originalPrice: '',
    sellingPrice: '',
    material: '',
    fit: '',
    weight: '',
    careInstructions: '',
    isFeatured: false,
    isActive: true,
  });
  
  const [colorVariants, setColorVariants] = useState<ColorVariant[]>([]);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setIsLoading(true);
      const response = await productAPI.getProduct(productId);
      const product = response.data.product;
      
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        category: product.category || '',
        originalPrice: product.originalPrice?.toString() || '',
        sellingPrice: product.sellingPrice?.toString() || '',
        material: product.specifications?.material || '',
        fit: product.specifications?.fit || '',
        weight: product.specifications?.weight?.toString() || '',
        careInstructions: product.specifications?.careInstructions?.join('\n') || '',
        isFeatured: product.isFeatured || false,
        isActive: product.isActive !== false,
      });

      // Ensure all sizes are present for each variant
      const variantsWithAllSizes = (product.colorVariants || []).map((v: any) => ({
        ...v,
        sizes: SIZES.map(size => {
          const existingSize = v.sizes?.find((s: any) => s.size === size);
          return existingSize || { size, quantity: 0 };
        }),
      }));

      setColorVariants(variantsWithAllSizes);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
      router.push('/admin/products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleColorVariantChange = (index: number, field: keyof ColorVariant, value: any) => {
    setColorVariants(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSizeQuantityChange = (variantIndex: number, size: string, quantity: number) => {
    setColorVariants(prev => {
      const updated = [...prev];
      updated[variantIndex].sizes = updated[variantIndex].sizes.map(s =>
        s.size === size ? { ...s, quantity } : s
      );
      return updated;
    });
  };

  const addColorVariant = () => {
    setColorVariants(prev => [
      ...prev,
      {
        colorName: '',
        colorCode: '#000000',
        images: [],
        sizes: SIZES.map(size => ({ size, quantity: 0 })),
      },
    ]);
  };

  const removeColorVariant = (index: number) => {
    if (colorVariants.length === 1) {
      toast.error('At least one color variant is required');
      return;
    }
    setColorVariants(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (variantIndex: number, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const uploadKey = `variant-${variantIndex}`;
    setUploadingImages(prev => ({ ...prev, [uploadKey]: true }));

    try {
      const uploadedUrls: string[] = [];
      
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image`);
          continue;
        }
        
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 5MB)`);
          continue;
        }

        const response = await uploadAPI.uploadSingle(file, 'products');
        uploadedUrls.push(response.data.url);
      }

      if (uploadedUrls.length > 0) {
        setColorVariants(prev => {
          const updated = [...prev];
          updated[variantIndex].images = [...updated[variantIndex].images, ...uploadedUrls];
          return updated;
        });
        toast.success(`${uploadedUrls.length} image(s) uploaded successfully`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploadingImages(prev => ({ ...prev, [uploadKey]: false }));
    }
  };

  const removeImage = (variantIndex: number, imageIndex: number) => {
    setColorVariants(prev => {
      const updated = [...prev];
      updated[variantIndex].images = updated[variantIndex].images.filter((_, i) => i !== imageIndex);
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.sku || !formData.category || !formData.originalPrice) {
      toast.error('Please fill in all required fields');
      return;
    }

    for (const variant of colorVariants) {
      if (!variant.colorName) {
        toast.error('All color variants must have a color name');
        return;
      }
      if (variant.images.length === 0) {
        toast.error(`Please upload at least one image for ${variant.colorName}`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const productData = {
        name: formData.name,
        sku: formData.sku,
        description: formData.description,
        shortDescription: formData.shortDescription,
        category: formData.category,
        originalPrice: parseFloat(formData.originalPrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        specifications: {
          material: formData.material || undefined,
          fit: formData.fit || undefined,
          weight: formData.weight ? parseFloat(formData.weight) : undefined,
          careInstructions: formData.careInstructions ? formData.careInstructions.split('\n').filter(Boolean) : [],
        },
        isFeatured: formData.isFeatured,
        isActive: formData.isActive,
        colorVariants: colorVariants.map(v => ({
          ...v,
          sizes: v.sizes.filter(s => s.quantity > 0),
        })),
      };

      await productAPI.updateProduct(productId, productData);
      toast.success('Product updated successfully');
      router.push('/admin/products');
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast.error(error.response?.data?.message || 'Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/products"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-black">Edit Product</h1>
          <p className="text-gray-600">Update product details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter product name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., TSH-001-BLK"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Select category</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Original Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="originalPrice"
                value={formData.originalPrice}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="499"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selling Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="sellingPrice"
                value={formData.sellingPrice}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="399"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Short Description
              </label>
              <input
                type="text"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Brief description for product cards"
                maxLength={150}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Detailed product description"
              />
            </div>
          </div>
        </div>

        {/* Specifications */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Specifications</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
              <input
                type="text"
                name="material"
                value={formData.material}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., 100% Cotton"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fit</label>
              <input
                type="text"
                name="fit"
                value={formData.fit}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., Regular Fit"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (g)</label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="200"
                min="0"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Care Instructions (one per line)
              </label>
              <textarea
                name="careInstructions"
                value={formData.careInstructions}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Machine wash cold&#10;Do not bleach&#10;Tumble dry low"
              />
            </div>
          </div>
        </div>

        {/* Color Variants */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Color Variants</h2>
            <button
              type="button"
              onClick={addColorVariant}
              className="flex items-center gap-2 text-primary hover:text-primary-600"
            >
              <Plus className="w-4 h-4" />
              Add Color
            </button>
          </div>

          <div className="space-y-6">
            {colorVariants.map((variant, variantIndex) => (
              <motion.div
                key={variantIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-medium">Color Variant {variantIndex + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removeColorVariant(variantIndex)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={variant.colorName}
                      onChange={(e) => handleColorVariantChange(variantIndex, 'colorName', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="e.g., Black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color Code
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={variant.colorCode}
                        onChange={(e) => handleColorVariantChange(variantIndex, 'colorCode', e.target.value)}
                        className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={variant.colorCode}
                        onChange={(e) => handleColorVariantChange(variantIndex, 'colorCode', e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                </div>

                {/* Image Upload */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Images <span className="text-red-500">*</span>
                  </label>
                  
                  <input
                    ref={(el) => { fileInputRefs.current[variantIndex] = el; }}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImageUpload(variantIndex, e.target.files)}
                    className="hidden"
                  />

                  <div className="flex flex-wrap gap-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[variantIndex]?.click()}
                        disabled={uploadingImages[`variant-${variantIndex}`]}
                        className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
                      >
                        {uploadingImages[`variant-${variantIndex}`] ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <ImageIcon className="w-5 h-5" />
                        )}
                        <span className="text-sm">From Device</span>
                      </button>
                    </div>

                    {variant.images.map((image, imageIndex) => (
                      <div key={imageIndex} className="relative w-24 h-24">
                        <img
                          src={image}
                          alt={`${variant.colorName} ${imageIndex + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(variantIndex, imageIndex)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Upload images from your device. Max 5MB per image.
                  </p>
                </div>

                {/* Sizes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock by Size</label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                    {variant.sizes.map((sizeData) => (
                      <div key={sizeData.size}>
                        <label className="block text-xs text-gray-500 mb-1">{sizeData.size}</label>
                        <input
                          type="number"
                          value={sizeData.quantity}
                          onChange={(e) => handleSizeQuantityChange(variantIndex, sizeData.size, parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-center"
                          min="0"
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Settings</h2>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="text-sm">Active</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleInputChange}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="text-sm">Featured Product</span>
            </label>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <Link
            href="/admin/products"
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Update Product
          </button>
        </div>
      </form>
    </div>
  );
}
