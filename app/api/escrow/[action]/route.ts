/**
 * API: Anchor Escrow 操作
 * POST /api/escrow/[action]
 * 
 * 支持的操作:
 * - mark-delivered: 标记交付
 * - confirm: 确认并释放资金
 * - cancel: 取消订单
 * - raise-dispute: 发起争议
 * - resolve-dispute: 解决争议
 */

import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey, Keypair, Transaction, VersionedTransaction } from '@solana/web3.js'
import { AnchorEscrowClient, ANCHOR_CONFIG } from '@/lib/anchor-escrow-client'
import { prisma } from '@/lib/prisma'

// Wallet interface for server-side
interface Wallet {
  publicKey: PublicKey
  signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T>
  signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]>
}

// NodeWallet implementation for server-side
class NodeWallet implements Wallet {
  constructor(readonly payer: Keypair) {}

  async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
    return tx
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> {
    return txs
  }

  get publicKey(): PublicKey {
    return this.payer.publicKey
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  try {
    const { action } = await params
    const body = await request.json()
    const { buyerPublicKey, requestId, refundToBuyer } = body

    // 验证参数
    if (!buyerPublicKey || !requestId) {
      return NextResponse.json(
        { error: '缺少必需参数' },
        { status: 400 }
      )
    }

    // 加载平台钱包
    const platformSecretKey = process.env.PLATFORM_WALLET_SECRET_KEY
    if (!platformSecretKey) {
      return NextResponse.json(
        { error: '平台钱包未配置' },
        { status: 500 }
      )
    }

    const platformKeypair = Keypair.fromSecretKey(
      Buffer.from(JSON.parse(platformSecretKey))
    )
    const platformWallet = new NodeWallet(platformKeypair) as any

    // 创建客户端
    const connection = new Connection(ANCHOR_CONFIG.DEVNET_RPC, 'confirmed')
    const client = new AnchorEscrowClient(connection, platformWallet)

    const buyer = new PublicKey(buyerPublicKey)
    let signature: string
    let newStatus: string

    // 根据操作类型执行不同的逻辑
    switch (action) {
      case 'mark-delivered':
        signature = await client.markDelivered(buyer, requestId)
        newStatus = 'delivered'
        break

      case 'confirm':
        signature = await client.confirmAndRelease(buyer, requestId)
        newStatus = 'completed'
        break

      case 'cancel':
        signature = await client.cancel(buyer, requestId)
        newStatus = 'cancelled'
        break

      case 'raise-dispute':
        signature = await client.raiseDispute(buyer, requestId)
        newStatus = 'disputed'
        break

      case 'resolve-dispute':
        if (refundToBuyer === undefined) {
          return NextResponse.json(
            { error: '缺少 refundToBuyer 参数' },
            { status: 400 }
          )
        }
        signature = await client.resolveDispute(buyer, requestId, refundToBuyer)
        newStatus = refundToBuyer ? 'refunded' : 'completed'
        break

      default:
        return NextResponse.json(
          { error: `不支持的操作: ${action}` },
          { status: 400 }
        )
    }

    // 更新数据库
    await prisma.escrow.updateMany({
      where: {
        buyer: buyerPublicKey,
        requestId,
      },
      data: {
        status: newStatus,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      action,
      signature,
      status: newStatus,
      explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
    })

  } catch (error: any) {
    const { action } = await params
    console.error(`Escrow 操作失败 (${action}):`, error)
    return NextResponse.json(
      { error: error.message || 'Escrow 操作失败' },
      { status: 500 }
    )
  }
}

// GET: 获取 Escrow 状态
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  try {
    const { action } = await params
    const { searchParams } = new URL(request.url)
    const buyerPublicKey = searchParams.get('buyer')
    const requestId = searchParams.get('requestId')

    if (!buyerPublicKey || !requestId) {
      return NextResponse.json(
        { error: '缺少必需参数' },
        { status: 400 }
      )
    }

    // 从数据库获取
    const escrow = await prisma.escrow.findFirst({
      where: {
        buyer: buyerPublicKey,
        requestId,
      },
    })

    if (!escrow) {
      return NextResponse.json(
        { error: 'Escrow 不存在' },
        { status: 404 }
      )
    }

    // 从链上获取最新状态
    const platformSecretKey = process.env.PLATFORM_WALLET_SECRET_KEY
    if (platformSecretKey) {
      const platformKeypair = Keypair.fromSecretKey(
        Buffer.from(JSON.parse(platformSecretKey))
      )
      const platformWallet = new NodeWallet(platformKeypair) as any
      const connection = new Connection(ANCHOR_CONFIG.DEVNET_RPC, 'confirmed')
      const client = new AnchorEscrowClient(connection, platformWallet)

      const buyer = new PublicKey(buyerPublicKey)
      const onChainEscrow = await client.getEscrow(buyer, requestId)

      if (onChainEscrow) {
        const status = AnchorEscrowClient.getStatusString(onChainEscrow.status)
        
        return NextResponse.json({
          success: true,
          escrow: {
            ...escrow,
            onChainStatus: status,
            amount: AnchorEscrowClient.formatAmount(onChainEscrow.amount),
            createdAt: AnchorEscrowClient.formatTimestamp(onChainEscrow.createdAt),
            fundedAt: AnchorEscrowClient.formatTimestamp(onChainEscrow.fundedAt),
            deliveredAt: AnchorEscrowClient.formatTimestamp(onChainEscrow.deliveredAt),
            completedAt: AnchorEscrowClient.formatTimestamp(onChainEscrow.completedAt),
            refundedAt: AnchorEscrowClient.formatTimestamp(onChainEscrow.refundedAt),
            disputedAt: AnchorEscrowClient.formatTimestamp(onChainEscrow.disputedAt),
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      escrow,
    })

  } catch (error: any) {
    console.error('获取 Escrow 失败:', error)
    return NextResponse.json(
      { error: error.message || '获取 Escrow 失败' },
      { status: 500 }
    )
  }
}

