import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyApiKey } from '@/lib/api-auth'

/**
 * GET /api/agent/datasets/:id/preview
 * Preview first 10 rows of dataset (free)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify API key
    const apiKeyHeader = request.headers.get('authorization')
    if (!apiKeyHeader || !apiKeyHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'API key is required',
          },
        },
        { status: 401 }
      )
    }

    const apiKey = apiKeyHeader.substring(7)
    const user = await verifyApiKey(apiKey)

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid API key',
          },
        },
        { status: 401 }
      )
    }

    const { id } = await params

    // Get dataset
    const dataset = await prisma.dataProduct.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        fileUrl: true,
        fileType: true,
        isEncrypted: true,
      },
    })

    if (!dataset) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Dataset not found',
          },
        },
        { status: 404 }
      )
    }

    // Check if preview is supported
    if (dataset.isEncrypted) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PREVIEW_NOT_AVAILABLE',
            message: 'Preview is not available for encrypted datasets',
          },
        },
        { status: 400 }
      )
    }

    if (!['csv', 'json'].includes(dataset.fileType.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PREVIEW_NOT_SUPPORTED',
            message: 'Preview is only supported for CSV and JSON files',
          },
        },
        { status: 400 }
      )
    }

    // Download file from Irys
    console.log('📥 Downloading file from Irys for preview:', dataset.fileUrl)
    const fileResponse = await fetch(dataset.fileUrl)

    if (!fileResponse.ok) {
      throw new Error('Failed to download file from Irys')
    }

    const fileContent = await fileResponse.text()

    // Parse and preview based on file type
    let preview: any[] = []
    let totalRows = 0
    let columns: string[] = []

    if (dataset.fileType.toLowerCase() === 'csv') {
      const lines = fileContent.split('\n').filter((line) => line.trim())
      totalRows = lines.length - 1 // Exclude header

      if (lines.length > 0) {
        // Parse header
        columns = lines[0].split(',').map((col) => col.trim())

        // Parse first 10 data rows
        const previewLines = lines.slice(1, 11)
        preview = previewLines.map((line) => {
          const values = line.split(',').map((val) => val.trim())
          const row: any = {}
          columns.forEach((col, index) => {
            row[col] = values[index] || ''
          })
          return row
        })
      }
    } else if (dataset.fileType.toLowerCase() === 'json') {
      try {
        const jsonData = JSON.parse(fileContent)

        if (Array.isArray(jsonData)) {
          totalRows = jsonData.length
          preview = jsonData.slice(0, 10)

          // Extract columns from first object
          if (jsonData.length > 0 && typeof jsonData[0] === 'object') {
            columns = Object.keys(jsonData[0])
          }
        } else {
          // Single object
          totalRows = 1
          preview = [jsonData]
          columns = Object.keys(jsonData)
        }
      } catch (error) {
        throw new Error('Invalid JSON format')
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        preview,
        totalRows,
        previewRows: preview.length,
        columns,
      },
    })
  } catch (error) {
    console.error('Agent API - Preview dataset error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to preview dataset',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    )
  }
}

