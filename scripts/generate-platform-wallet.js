/**
 * 生成平台钱包
 * 
 * 使用方法: node scripts/generate-platform-wallet.js
 */

const { Keypair } = require('@solana/web3.js')
const bs58 = require('bs58')
const fs = require('fs')
const path = require('path')

console.log('🔐 生成 Solana 平台钱包...\n')

// 生成新的 Keypair
const keypair = Keypair.generate()

// 获取公钥（钱包地址）
const publicKey = keypair.publicKey.toBase58()

// 获取私钥（Base58 编码）
const privateKey = bs58.encode(keypair.secretKey)

console.log('✅ 钱包生成成功！\n')
console.log('📋 钱包信息:')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`公钥 (钱包地址):`)
console.log(`  ${publicKey}`)
console.log('')
console.log(`私钥 (Base58):`)
console.log(`  ${privateKey}`)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

// 保存到 JSON 文件（Solana CLI 格式）
const walletPath = path.join(__dirname, '..', 'platform-wallet.json')
fs.writeFileSync(walletPath, JSON.stringify(Array.from(keypair.secretKey)))
console.log(`💾 钱包已保存到: ${walletPath}\n`)

// 更新 .env.local
const envPath = path.join(__dirname, '..', '.env.local')
let envContent = ''

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf-8')
  console.log('📝 更新 .env.local...')
} else {
  console.log('📝 创建 .env.local...')
}

// 移除旧的配置
envContent = envContent
  .split('\n')
  .filter(line => !line.startsWith('PLATFORM_WALLET=') && !line.startsWith('PLATFORM_PRIVATE_KEY='))
  .join('\n')

// 添加新的配置
if (envContent && !envContent.endsWith('\n')) {
  envContent += '\n'
}

envContent += `\n# Solana 平台钱包配置 (自动生成)\n`
envContent += `PLATFORM_WALLET=${publicKey}\n`
envContent += `PLATFORM_PRIVATE_KEY=${privateKey}\n`

fs.writeFileSync(envPath, envContent)
console.log(`✅ .env.local 已更新\n`)

// 显示下一步操作
console.log('🚀 下一步操作:')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('1. 获取测试 SOL (用于支付交易费):')
console.log(`   solana airdrop 2 ${publicKey} --url devnet`)
console.log('   或访问: https://faucet.solana.com/')
console.log('')
console.log('2. 获取测试 USDC:')
console.log('   访问: https://spl-token-faucet.com/')
console.log('   USDC Mint: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU')
console.log('')
console.log('3. 查看钱包余额:')
console.log(`   https://explorer.solana.com/address/${publicKey}?cluster=devnet`)
console.log('')
console.log('4. 重启开发服务器:')
console.log('   npm run dev')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

console.log('⚠️  安全提示:')
console.log('  - 请妥善保管私钥，不要泄露给任何人')
console.log('  - 不要将 .env.local 提交到 Git')
console.log('  - 生产环境请使用硬件钱包或密钥管理服务\n')

