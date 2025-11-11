// 获取第一个用户的 API Key
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    const apiKey = await prisma.apiKey.findFirst({
      include: {
        user: {
          select: {
            id: true,
            walletAddress: true,
          },
        },
      },
    })

    if (!apiKey) {
      console.log('❌ 没有找到 API Key')
      console.log('请先创建用户和 API Key')
      console.log('')
      console.log('创建方法:')
      console.log('  POST /api/auth/register')
      console.log('  POST /api/keys')
      return
    }

    // API Key 存储的是哈希值，我们需要从 keyPrefix 推断原始值
    // 但实际上我们需要完整的 API Key，这里只能显示前缀
    console.log('✅ 找到 API Key:')
    console.log('  用户 ID:', apiKey.user.id)
    console.log('  钱包地址:', apiKey.user.walletAddress)
    console.log('  Key 名称:', apiKey.name)
    console.log('  Key 前缀:', apiKey.keyPrefix)
    console.log('')
    console.log('⚠️  注意: API Key 已加密存储，无法直接读取')
    console.log('请使用创建 API Key 时返回的完整密钥')
    console.log('')
    console.log('如果没有保存，请创建新的 API Key:')
    console.log('  POST /api/keys')
  } catch (error) {
    console.error('❌ 错误:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()

