import { NextRequest, NextResponse } from 'next/server'
import { verifyApiKey } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

/**
 * @swagger
 * /api/provider/dashboard:
 *   get:
 *     summary: Get provider dashboard data
 *     description: Get comprehensive dashboard data for the provider
 *     tags:
 *       - Provider
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  try {
    // Verify API key
    const user = await verifyApiKey(request)

    // Get all provider's datasets
    const datasets = await prisma.dataProduct.findMany({
      where: { providerId: user.id },
      select: {
        id: true,
        name: true,
        price: true,
        purchases: true,
        views: true,
        createdAt: true,
      },
    })

    // Get all orders for provider's datasets
    const orders = await prisma.order.findMany({
      where: {
        product: {
          providerId: user.id,
        },
        status: 'completed',
      },
      select: {
        amount: true,
        createdAt: true,
      },
    })

    // Get provider reputation
    const reputation = await prisma.providerReputation.findUnique({
      where: { providerId: user.id },
      select: {
        reputationScore: true,
        badges: true,
        totalSales: true,
        totalRevenue: true,
        averageRating: true,
        totalRatings: true,
        totalDisputes: true,
        totalRefunds: true,
      },
    })

    // Get proposals
    const proposals = await prisma.proposal.findMany({
      where: { providerId: user.id },
      select: {
        id: true,
        status: true,
        price: true,
        createdAt: true,
      },
    })

    // Calculate statistics
    const totalRevenue = orders.reduce((sum, order) => sum + order.amount, 0)
    const totalSales = orders.length
    const totalDatasets = datasets.length
    const totalViews = datasets.reduce((sum, ds) => sum + ds.views, 0)

    // Calculate this month's revenue
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonthOrders = orders.filter((order) => order.createdAt >= firstDayOfMonth)
    const thisMonthRevenue = thisMonthOrders.reduce((sum, order) => sum + order.amount, 0)

    // Calculate platform fee (5%)
    const PLATFORM_FEE_RATE = 0.05
    const platformFee = totalRevenue * PLATFORM_FEE_RATE
    const netRevenue = totalRevenue - platformFee

    // Top selling datasets
    const topDatasets = datasets
      .sort((a, b) => b.purchases - a.purchases)
      .slice(0, 5)
      .map((ds) => ({
        id: ds.id,
        name: ds.name,
        purchases: ds.purchases,
        revenue: ds.purchases * ds.price,
      }))

    // Proposal statistics
    const proposalStats = {
      total: proposals.length,
      pending: proposals.filter((p) => p.status === 'pending').length,
      accepted: proposals.filter((p) => p.status === 'accepted').length,
      delivered: proposals.filter((p) => p.status === 'delivered').length,
      confirmed: proposals.filter((p) => p.status === 'confirmed').length,
      rejected: proposals.filter((p) => p.status === 'rejected').length,
    }

    // Revenue from proposals
    const proposalRevenue = proposals
      .filter((p) => p.status === 'confirmed')
      .reduce((sum, p) => sum + p.price, 0)

    return NextResponse.json({
      success: true,
      dashboard: {
        overview: {
          totalRevenue: totalRevenue + proposalRevenue,
          netRevenue: (totalRevenue + proposalRevenue) * (1 - PLATFORM_FEE_RATE),
          platformFee: (totalRevenue + proposalRevenue) * PLATFORM_FEE_RATE,
          thisMonthRevenue,
          totalSales: totalSales + proposalStats.confirmed,
          totalDatasets,
          totalViews,
          totalProposals: proposals.length,
        },
        reputation: reputation || {
          reputationScore: 0,
          badges: [],
          totalSales: 0,
          totalRevenue: 0,
          averageRating: 0,
          totalRatings: 0,
          totalDisputes: 0,
          totalRefunds: 0,
        },
        datasets: {
          total: totalDatasets,
          topSelling: topDatasets,
        },
        proposals: proposalStats,
        recentActivity: {
          recentOrders: orders.slice(0, 10).map((order) => ({
            amount: order.amount,
            createdAt: order.createdAt,
          })),
          recentProposals: proposals.slice(0, 10).map((p) => ({
            id: p.id,
            status: p.status,
            price: p.price,
            createdAt: p.createdAt,
          })),
        },
      },
    })
  } catch (error) {
    console.error('Provider dashboard error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get dashboard data',
        },
      },
      { status: 500 }
    )
  }
}

