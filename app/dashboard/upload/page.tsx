'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, Unlock, Shield, Info } from 'lucide-react'

// Form validation schema
const uploadSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  category: z.string().min(1, 'Please select a category'),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Price must be a positive number',
  }),
  file: z.any().refine((files) => files?.length > 0, 'Please select a file'),
})

type UploadFormData = z.infer<typeof uploadSchema>

const CATEGORIES = [
  'Financial Data',
  'Healthcare',
  'E-commerce',
  'Social Media',
  'IoT Sensors',
  'Weather',
  'Transportation',
  'Education',
  'Other',
]

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const ALLOWED_TYPES = ['.csv', '.json', '.parquet']

export default function UploadPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isEncrypted, setIsEncrypted] = useState(true) // Default to encrypted for privacy

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('File size must be less than 100MB')
      return
    }

    // Validate file type
    const fileExtension = '.' + selectedFile.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED_TYPES.includes(fileExtension)) {
      setError(`File type must be one of: ${ALLOWED_TYPES.join(', ')}`)
      return
    }

    setFile(selectedFile)
    setError(null)
    setValue('file', e.target.files)
  }

  const onSubmit = async (data: UploadFormData) => {
    if (!file) {
      setError('Please select a file')
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      // Step 1: Upload file to Irys (30%)
      setUploadProgress(10)
      const formData = new FormData()
      formData.append('file', file)

      // Add product name and description for NFT collection creation
      if (isEncrypted) {
        formData.append('productName', data.name)
        formData.append('productDescription', data.description)
      }

      // Use hybrid encryption endpoint (v3.0) if encryption is enabled
      const uploadEndpoint = isEncrypted ? '/api/upload/hybrid' : '/api/upload/irys'
      const token = localStorage.getItem('auth_token')

      const uploadResponse = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: isEncrypted
          ? {
              Authorization: `Bearer ${token}`,
            }
          : undefined,
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || 'Failed to upload file to Irys')
      }

      const uploadResult = await uploadResponse.json()
      const { transactionId, url } = uploadResult
      setUploadProgress(40)

      // Debug: Log upload result
      console.log('Upload result:', uploadResult)
      console.log('Is encrypted:', isEncrypted)
      console.log('Encryption data:', uploadResult.encryption)

      // Step 2: Create product in database (70%)
      const productData = {
        name: data.name,
        description: data.description,
        category: data.category,
        price: parseFloat(data.price),
        fileUrl: url,
        irysTransactionId: transactionId,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        fileName: file.name,
        // Include encryption metadata if encrypted
        ...(isEncrypted && uploadResult.encryption
          ? {
              isEncrypted: true,
              encryptionVersion: uploadResult.encryption.encryptionVersion || '3.0',
              encryptionMethod: uploadResult.encryption.encryptionMethod || 'hybrid',
              // Hybrid encryption: only store the encryption KEY in database
              // The encrypted file is stored on Irys
              encryptionKeyCiphertext: uploadResult.encryption.encryptionKeyCiphertext,
              encryptionKeyIv: uploadResult.encryption.encryptionKeyIv,
              encryptionKeyAuthTag: uploadResult.encryption.encryptionKeyAuthTag,
            }
          : {}),
      }

      // Debug: Log product data
      console.log('Product data to create:', productData)

      const createResponse = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(productData),
      })

      if (!createResponse.ok) {
        throw new Error('Failed to create product')
      }

      const product = await createResponse.json()
      setUploadProgress(100)

      // Success! Redirect to product page
      setTimeout(() => {
        router.push(`/products/${product.id}`)
      }, 500)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Upload failed')
      setUploadProgress(0)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="container max-w-3xl py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Upload Dataset</h1>
        <p className="mt-2 text-muted-foreground">
          Upload your data to Irys and list it on the marketplace
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dataset Information</CardTitle>
          <CardDescription>
            Fill in the details about your dataset. All fields are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file">Data File *</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="file"
                  type="file"
                  accept={ALLOWED_TYPES.join(',')}
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('file')?.click()}
                  disabled={uploading}
                  className="w-full"
                >
                  {file ? `Selected: ${file.name}` : 'Choose File'}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <span>Supported formats:</span>
                {ALLOWED_TYPES.map((type) => (
                  <Badge key={type} variant="outline">
                    {type}
                  </Badge>
                ))}
                <span>• Max size: 100MB</span>
              </div>
              {file && (
                <div className="text-sm text-green-600">
                  ✓ Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
              {errors.file && (
                <p className="text-sm text-red-600">{errors.file.message as string}</p>
              )}
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Dataset Name *</Label>
              <Input
                id="name"
                placeholder="e.g., NYC Taxi Trip Data 2024"
                {...register('name')}
                disabled={uploading}
              />
              {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your dataset, what it contains, and how it can be used..."
                rows={4}
                {...register('description')}
                disabled={uploading}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select onValueChange={(value) => setValue('category', value)} disabled={uploading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price">Price (USDC) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register('price')}
                disabled={uploading}
              />
              {errors.price && <p className="text-sm text-red-600">{errors.price.message}</p>}
            </div>

            {/* Encryption Toggle */}
            <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="encryption" className="text-base font-semibold">
                      {isEncrypted ? (
                        <>
                          <Lock className="inline h-4 w-4" /> Encrypted Upload
                        </>
                      ) : (
                        <>
                          <Unlock className="inline h-4 w-4" /> Public Upload
                        </>
                      )}
                    </Label>
                    <Badge variant={isEncrypted ? 'default' : 'secondary'}>
                      {isEncrypted ? 'Recommended' : 'Not Recommended'}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isEncrypted
                      ? 'Your data will be encrypted using AES-256-GCM. Only you and buyers can decrypt and access it.'
                      : 'Your data will be publicly accessible on Irys. Anyone can download it without payment.'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant={isEncrypted ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIsEncrypted(!isEncrypted)}
                  disabled={uploading}
                  className="ml-4"
                >
                  {isEncrypted ? 'Enabled' : 'Disabled'}
                </Button>
              </div>

              {isEncrypted && (
                <div className="flex items-start gap-2 rounded-md bg-background p-3 text-sm">
                  <Shield className="mt-0.5 h-4 w-4 text-primary" />
                  <div className="flex-1">
                    <div className="font-medium">Privacy Protection</div>
                    <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                      <li>✓ Military-grade AES-256-GCM encryption</li>
                      <li>✓ Only you and buyers can access the data</li>
                      <li>✓ Automatic access control after purchase</li>
                      <li>✓ Stored securely on Irys (Arweave)</li>
                    </ul>
                  </div>
                </div>
              )}

              {!isEncrypted && (
                <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  <Info className="mt-0.5 h-4 w-4" />
                  <div className="flex-1">
                    <div className="font-medium">Warning: Data Privacy Risk</div>
                    <p className="mt-1 text-xs">
                      Without encryption, anyone can access your data directly from Irys without
                      purchasing. This defeats the purpose of a paid data marketplace.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
            )}

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button type="submit" disabled={uploading} className="flex-1">
                {uploading ? 'Uploading...' : 'Upload & List Dataset'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={uploading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

