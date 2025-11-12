/**
 * Create a USDC token account for a wallet on Solana Devnet
 * 
 * This script will:
 * 1. Check if the wallet has a USDC token account
 * 2. If not, create one
 * 3. Optionally airdrop some USDC for testing
 * 
 * Usage:
 *   node scripts/create-usdc-account.mjs
 * 
 * Note: You need to have your wallet connected in the browser
 * This is a manual guide - you'll need to use Solana CLI or Phantom wallet
 */

import { Connection, PublicKey } from '@solana/web3.js'
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token'

// USDC Mint Address on Devnet (Circle Official)
const USDC_MINT_DEVNET = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'

async function main() {
  const walletAddress = process.argv[2]

  if (!walletAddress) {
    console.error('❌ Error: Please provide a wallet address')
    console.log('')
    console.log('Usage:')
    console.log('  node scripts/create-usdc-account.mjs <WALLET_ADDRESS>')
    console.log('')
    console.log('Example:')
    console.log('  node scripts/create-usdc-account.mjs 1s1qGa8aZLbLfiGJEogq6163k3XrqcbDgE6fWjhAu2M')
    process.exit(1)
  }

  console.log('🔧 USDC Token Account Setup Guide')
  console.log('=' .repeat(60))
  console.log('')
  console.log('Wallet Address:', walletAddress)
  console.log('')

  try {
    // Connect to Solana Devnet
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
    const walletPubkey = new PublicKey(walletAddress)
    const usdcMint = new PublicKey(USDC_MINT_DEVNET)

    // Get Associated Token Address
    const tokenAccount = await getAssociatedTokenAddress(
      usdcMint,
      walletPubkey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    )

    console.log('📍 Your USDC Token Account will be:', tokenAccount.toBase58())
    console.log('')

    // Check if account exists
    const accountInfo = await connection.getAccountInfo(tokenAccount)

    if (accountInfo) {
      console.log('✅ USDC token account already exists!')
      const balance = await connection.getTokenAccountBalance(tokenAccount)
      console.log('💰 Current balance:', balance.value.uiAmount, 'USDC')
      console.log('')
      return
    }

    console.log('❌ USDC token account does NOT exist yet')
    console.log('')
    console.log('📝 Here are 3 ways to create it:')
    console.log('')

    // Method 1: Solana CLI
    console.log('━'.repeat(60))
    console.log('Method 1: Using Solana CLI (Recommended)')
    console.log('━'.repeat(60))
    console.log('')
    console.log('Step 1: Install Solana CLI (if not installed)')
    console.log('  macOS/Linux:')
    console.log('    sh -c "$(curl -sSfL https://release.solana.com/stable/install)"')
    console.log('')
    console.log('Step 2: Configure for Devnet')
    console.log('  solana config set --url https://api.devnet.solana.com')
    console.log('')
    console.log('Step 3: Get some SOL for transaction fees')
    console.log('  solana airdrop 2', walletAddress)
    console.log('')
    console.log('Step 4: Create USDC token account')
    console.log('  spl-token create-account', USDC_MINT_DEVNET, '--owner', walletAddress)
    console.log('')
    console.log('Step 5: (Optional) Get some USDC for testing')
    console.log('  Visit: https://faucet.circle.com/')
    console.log('  Or use: spl-token mint', USDC_MINT_DEVNET, '10', '--owner', walletAddress)
    console.log('  (Note: You need mint authority for the second option)')
    console.log('')

    // Method 2: Phantom Wallet
    console.log('━'.repeat(60))
    console.log('Method 2: Using Phantom Wallet (Easiest)')
    console.log('━'.repeat(60))
    console.log('')
    console.log('Step 1: Open Phantom wallet')
    console.log('Step 2: Click the network selector (top right)')
    console.log('Step 3: Select "Devnet"')
    console.log('Step 4: Click "Receive" button')
    console.log('Step 5: Search for "USDC"')
    console.log('Step 6: Click "Add Token" or "Create Account"')
    console.log('Step 7: The token account will be created automatically')
    console.log('')
    console.log('Then get some USDC:')
    console.log('  - Use Phantom\'s built-in Devnet faucet')
    console.log('  - Or visit: https://faucet.circle.com/')
    console.log('')

    // Method 3: Circle Faucet
    console.log('━'.repeat(60))
    console.log('Method 3: Using Circle USDC Faucet (Automatic)')
    console.log('━'.repeat(60))
    console.log('')
    console.log('Step 1: Visit https://faucet.circle.com/')
    console.log('Step 2: Select "Solana Devnet"')
    console.log('Step 3: Enter your wallet address:', walletAddress)
    console.log('Step 4: Click "Get USDC"')
    console.log('')
    console.log('Note: The faucet will automatically create the token account')
    console.log('      and send you some USDC for testing!')
    console.log('')

    // Check SOL balance
    const solBalance = await connection.getBalance(walletPubkey)
    const solBalanceInSol = solBalance / 1_000_000_000

    console.log('━'.repeat(60))
    console.log('Current Wallet Status')
    console.log('━'.repeat(60))
    console.log('')
    console.log('💎 SOL Balance:', solBalanceInSol, 'SOL')
    
    if (solBalanceInSol < 0.01) {
      console.log('⚠️  Warning: Low SOL balance!')
      console.log('   You need SOL to pay for transaction fees.')
      console.log('   Get some SOL first:')
      console.log('     solana airdrop 2', walletAddress, '--url https://api.devnet.solana.com')
      console.log('')
    } else {
      console.log('✅ You have enough SOL for transaction fees')
      console.log('')
    }

    console.log('━'.repeat(60))
    console.log('After Creating the Token Account')
    console.log('━'.repeat(60))
    console.log('')
    console.log('Run this command to verify:')
    console.log('  node scripts/check-usdc-account.mjs', walletAddress)
    console.log('')

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

main()

