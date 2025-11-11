import { NextRequest, NextResponse } from 'next/server'
import { verifyApiKey } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

const PLATFORM_FEE_RATE = 0.05

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get platform statistics
 *     description: Get comprehensive platform statistics and metrics
 *     tags:
 *       - Admin
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Platform statistics
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  try {
    // Verify API key (in production, add admin role check)
    await verifyApiKey(request)

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            products: true,
            orders: true,
          },
        },
      },
    })

    // Get all datasets
    const datasets = await prisma.dataProduct.findMany({
      select: {
        id: true,
        category: true,
        price: true,
        purchases: true,
        views: true,
        createdAt: true,
      },
    })

    // Get all completed orders
    const orders = await prisma.order.findMany({
      where: { status: 'completed' },
      select: {
        amount: true,
        createdAt: true,
      },
    })

    // Get all requests
    const requests = await prisma.dataRequest.findMany({
      select: {
        status: true,
        budget: true,
        createdAt: true,
      },
    })

    // Get all proposals
    const proposals = await prisma.proposal.findMany({
      select: {
        status: true,
        price: true,
        createdAt: true,
      },
    })

    // Get ratings
    const ratings = await prisma.providerRating.findMany({
      select: {
        rating: true,
        createdAt: true,
      },
    })

    // Get disputes
    const disputes = await prisma.dispute.findMany({
      select: {
        status: true,
        createdAt: true,
      },
    })

    // Get refunds
    const refunds = await prisma.refund.findMany({
      select: {
        amount: true,
        status: true,
        createdAt: true,
      },
    })

    // Calculate user statistics
    const providers = users.filter((u) => u._count.products > 0)
    const buyers = users.filter((u) => u._count.orders > 0)
    const activeUsers = users.filter(
      (u) => u._count.products > 0 || u._count.orders > 0
    )

    // Calculate time-based statistics
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const newUsersThisWeek = users.filter((u) => u.createdAt >= oneWeekAgo).length
    const newUsersThisMonth = users.filter((u) => u.createdAt >= oneMonthAgo).length

    // Calculate revenue statistics
    const totalRevenue = orders.reduce((sum, order) => sum + order.amount, 0)
    const platformFee = totalRevenue * PLATFORM_FEE_RATE
    const providerRevenue = totalRevenue - platformFee

    const thisWeekOrders = orders.filter((o) => o.createdAt >= oneWeekAgo)
    const thisWeekRevenue = thisWeekOrders.reduce((sum, o) => sum + o.amount, 0)

    const thisMonthOrders = orders.filter((o) => o.createdAt >= oneMonthAgo)
    const thisMonthRevenue = thisMonthOrders.reduce((sum, o) => sum + o.amount, 0)

    // Calculate proposal revenue
    const confirmedProposals = proposals.filter((p) => p.status === 'confirmed')
    const proposalRevenue = confirmedProposals.reduce((sum, p) => sum + p.price, 0)
    const proposalPlatformFee = proposalRevenue * PLATFORM_FEE_RATE

    // Dataset statistics
    const categoryStats = datasets.reduce((acc, ds) => {
      acc[ds.category] = (acc[ds.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const avgPrice =
      datasets.length > 0
        ? datasets.reduce((sum, ds) => sum + ds.price, 0) / datasets.length
        : 0

    const avgRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0

    // Request marketplace statistics
    const requestStats = {
      total: requests.length,
      pending: requests.filter((r) => r.status === 'pending').length,
      matched: requests.filter((r) => r.status === 'matched').length,
      in_progress: requests.filter((r) => r.status === 'in_progress').length,
      completed: requests.filter((r) => r.status === 'completed').length,
      cancelled: requests.filter((r) => r.status === 'cancelled').length,
      disputed: requests.filter((r) => r.status === 'disputed').length,
    }

    const proposalStats = {
      total: proposals.length,
      pending: proposals.filter((p) => p.status === 'pending').length,
      accepted: proposals.filter((p) => p.status === 'accepted').length,
      delivered: proposals.filter((p) => p.status === 'delivered').length,
      confirmed: proposals.filter((p) => p.status === 'confirmed').length,
      rejected: proposals.filter((p) => p.status === 'rejected').length,
    }

    // Sync status (check how many items are synced to chain)
    const ratingsWithIrys = await prisma.providerRating.count({
      where: { irysId: { not: null } },
    })
    const disputesWithIrys = await prisma.dispute.count({
      where: { irysId: { not: null } },
    })
    const refundsWithIrys = await prisma.refund.count({
      where: { irysId: { not: null } },
    })

    const totalSyncableItems = ratings.length + disputes.length + refunds.length
    const totalSyncedItems = ratingsWithIrys + disputesWithIrys + refundsWithIrys
    const syncRate =
      totalSyncableItems > 0 ? (totalSyncedItems / totalSyncableItems) * 100 : 100

    return NextResponse.json({
      success: true,
      stats: {
        overview: {
          totalRevenue: totalRevenue + proposalRevenue,
          platformFee: platformFee + proposalPlatformFee,
          providerRevenue: providerRevenue + (proposalRevenue - proposalPlatformFee),
          totalTransactions: orders.length + confirmedProposals.length,
          activeUsers: activeUsers.length,
          totalUsers: users.length,
        },
        users: {
          total: users.length,
          providers: providers.length,
          buyers: buyers.length,
          active: activeUsers.length,
          newThisWeek: newUsersThisWeek,
          newThisMonth: newUsersThisMonth,
        },
        datasets: {
          total: datasets.length,
          totalViews: datasets.reduce((sum, ds) => sum + ds.views, 0),
          totalPurchases: datasets.reduce((sum, ds) => sum + ds.purchases, 0),
          avgPrice,
          avgRating,
          byCategory: categoryStats,
        },
        transactions: {
          total: orders.length,
          thisWeek: thisWeekOrders.length,
          thisMonth: thisMonthOrders.length,
          thisWeekRevenue,
          thisMonthRevenue,
        },
        requestMarketplace: {
          requests: requestStats,
          proposals: proposalStats,
          totalBudget: requests.reduce((sum, r) => sum + r.budget, 0),
          totalProposalValue: proposals.reduce((sum, p) => sum + p.price, 0),
          confirmedRevenue: proposalRevenue,
        },
        trustAndSafety: {
          totalRatings: ratings.length,
          avgRating,
          totalDisputes: disputes.length,
          activeDisputes: disputes.filter((d) => d.status === 'pending').length,
          totalRefunds: refunds.length,
          refundAmount: refunds.reduce((sum, r) => sum + r.amount, 0),
        },
        onchainSync: {
          syncRate: syncRate.toFixed(2) + '%',
          totalItems: totalSyncableItems,
          syncedItems: totalSyncedItems,
          ratings: {
            total: ratings.length,
            synced: ratingsWithIrys,
          },
          disputes: {
            total: disputes.length,
            synced: disputesWithIrys,
          },
          refunds: {
            total: refunds.length,
            synced: refundsWithIrys,
          },
        },
      },
    })
  } catch (error) {
    console.error('Platform stats error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get platform stats',
        },
      },
      { status: 500 }
    )
  }
}

