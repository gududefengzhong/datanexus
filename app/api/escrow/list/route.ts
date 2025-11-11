/**
 * API: 获取 Escrow 列表
 * GET /api/escrow/list?walletAddress=...
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('walletAddress')

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Missing walletAddress parameter' },
        { status: 400 }
      )
    }

    // 查询用户的所有 Escrow（作为买家、提供商或平台）
    const escrows = await prisma.escrow.findMany({
      where: {
        OR: [
          { buyer: walletAddress },
          { provider: walletAddress },
          { platform: walletAddress },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      escrows,
    })

  } catch (error: any) {
    console.error('Failed to load escrow list:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to load escrow list' },
      { status: 500 }
    )
  }
}

