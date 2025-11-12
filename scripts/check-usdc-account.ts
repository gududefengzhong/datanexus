/**
 * Check if a wallet has a USDC token account on Solana Devnet
 * 
 * Usage:
 *   npx ts-node scripts/check-usdc-account.ts <WALLET_ADDRESS>
 * 
 * Example:
 *   npx ts-node scripts/check-usdc-account.ts 1s1qGa8aZLbLfiGJEogq6163k3XrqcbDgE6fWjhAu2M
 */

import { Connection, PublicKey } from '@solana/web3.js'
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token'

// USDC Mint Address on Devnet
const USDC_MINT_DEVNET = 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr'

async function checkUSDCAccount(walletAddress: string) {
  try {
    console.log('🔍 Checking USDC account for wallet:', walletAddress)
    console.log('')

    // Connect to Solana Devnet
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed')

    // Get wallet public key
    const walletPubkey = new PublicKey(walletAddress)

    // Get USDC mint
    const usdcMint = new PublicKey(USDC_MINT_DEVNET)

    // Get Associated Token Address
    const tokenAccount = await getAssociatedTokenAddress(
      usdcMint,
      walletPubkey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    )

    console.log('📍 Expected USDC Token Account:', tokenAccount.toBase58())
    console.log('')

    // Check if account exists
    const accountInfo = await connection.getAccountInfo(tokenAccount)

    if (!accountInfo) {
      console.log('❌ USDC token account does NOT exist')
      console.log('')
      console.log('📝 To create a USDC token account, you can:')
      console.log('')
      console.log('Option 1: Use Solana CLI')
      console.log('  1. Install Solana CLI: https://docs.solana.com/cli/install-solana-cli-tools')
      console.log('  2. Run: solana config set --url https://api.devnet.solana.com')
      console.log('  3. Run: spl-token create-account', USDC_MINT_DEVNET)
      console.log('')
      console.log('Option 2: Get USDC from a faucet')
      console.log('  - Visit: https://faucet.circle.com/')
      console.log('  - Or use Phantom wallet\'s built-in Devnet faucet')
      console.log('')
      console.log('Option 3: Receive USDC from another wallet')
      console.log('  - The token account will be created automatically when you receive USDC')
      console.log('')
      return
    }

    console.log('✅ USDC token account EXISTS')
    console.log('')

    // Get token balance
    const balance = await connection.getTokenAccountBalance(tokenAccount)
    
    console.log('💰 Balance:', balance.value.uiAmount, 'USDC')
    console.log('   Raw amount:', balance.value.amount)
    console.log('   Decimals:', balance.value.decimals)
    console.log('')

    if (balance.value.uiAmount === 0) {
      console.log('⚠️  Warning: Your USDC balance is 0')
      console.log('')
      console.log('📝 To get USDC on Devnet:')
      console.log('  - Visit: https://faucet.circle.com/')
      console.log('  - Or use Phantom wallet\'s built-in Devnet faucet')
      console.log('')
    } else {
      console.log('✅ You have enough USDC to make purchases!')
      console.log('')
    }

    // Check SOL balance (for transaction fees)
    const solBalance = await connection.getBalance(walletPubkey)
    const solBalanceInSol = solBalance / 1_000_000_000

    console.log('💎 SOL Balance:', solBalanceInSol, 'SOL')
    
    if (solBalanceInSol < 0.01) {
      console.log('⚠️  Warning: Low SOL balance. You need SOL for transaction fees.')
      console.log('   Run: solana airdrop 2', walletAddress, '--url https://api.devnet.solana.com')
      console.log('')
    } else {
      console.log('✅ You have enough SOL for transaction fees!')
      console.log('')
    }

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error)
  }
}

// Get wallet address from command line
const walletAddress = process.argv[2]

if (!walletAddress) {
  console.error('❌ Error: Please provide a wallet address')
  console.log('')
  console.log('Usage:')
  console.log('  npx ts-node scripts/check-usdc-account.ts <WALLET_ADDRESS>')
  console.log('')
  console.log('Example:')
  console.log('  npx ts-node scripts/check-usdc-account.ts 1s1qGa8aZLbLfiGJEogq6163k3XrqcbDgE6fWjhAu2M')
  process.exit(1)
}

checkUSDCAccount(walletAddress)

