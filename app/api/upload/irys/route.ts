import { NextRequest, NextResponse } from 'next/server'
import { uploadToIrys } from '@/lib/irys'

export async function POST(request: NextRequest) {
  try {
    // Get the file from form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size (100MB max)
    const MAX_SIZE = 100 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large (max 100MB)' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['text/csv', 'application/json', 'application/octet-stream']
    const fileName = file.name.toLowerCase()
    const isValidType =
      allowedTypes.includes(file.type) ||
      fileName.endsWith('.csv') ||
      fileName.endsWith('.json') ||
      fileName.endsWith('.parquet')

    if (!isValidType) {
      return NextResponse.json(
        { error: 'Invalid file type. Only CSV, JSON, and Parquet are allowed' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Determine content type
    let contentType = file.type
    if (fileName.endsWith('.csv')) contentType = 'text/csv'
    if (fileName.endsWith('.json')) contentType = 'application/json'
    if (fileName.endsWith('.parquet')) contentType = 'application/octet-stream'

    // Upload to Irys
    const metadata = {
      'File-Name': file.name,
      'File-Size': file.size.toString(),
      'Upload-Timestamp': new Date().toISOString(),
    }

    const result = await uploadToIrys(buffer, contentType, metadata)

    return NextResponse.json({
      success: true,
      transactionId: result.transactionId,
      url: result.url,
      cost: result.cost,
    })
  } catch (error) {
    console.error('Irys upload error:', error)

    // Check if it's an Irys-specific error
    if (error instanceof Error) {
      if (error.message.includes('Insufficient balance')) {
        return NextResponse.json(
          {
            error: 'Insufficient Irys balance. Please fund your account.',
            details: error.message,
          },
          { status: 402 }
        )
      }

      if (error.message.includes('IRYS_PRIVATE_KEY')) {
        return NextResponse.json(
          {
            error: 'Irys not configured. Please contact administrator.',
            details: 'IRYS_PRIVATE_KEY not set',
          },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

