/**
 * Anchor Escrow SDK
 * 
 * 与 Solana Anchor 托管程序交互的 TypeScript SDK
 */

import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js'
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from '@solana/spl-token'
import { Program, AnchorProvider, web3, BN, Idl } from '@project-serum/anchor'
import idl from './idl/datanexus_escrow.json'

// 程序 ID (已部署到 Devnet)
const PROGRAM_ID = new PublicKey('gxDTeSCzk9mqiokrmTb1uNbWCjQ1rj2hsj5N65K9698')

// USDC Mint (Devnet)
const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU')

// USDC 精度
const USDC_DECIMALS = 6

// Solana RPC
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'

// 平台钱包
const PLATFORM_WALLET = new PublicKey(
  process.env.PLATFORM_WALLET || 'YOUR_PLATFORM_WALLET'
)

/**
 * 托管状态
 */
export enum EscrowStatus {
  Created = 'Created',
  Funded = 'Funded',
  Delivered = 'Delivered',
  Completed = 'Completed',
  Refunded = 'Refunded',
  Cancelled = 'Cancelled',
}

/**
 * 托管账户数据
 */
export interface EscrowAccount {
  buyer: PublicKey
  provider: PublicKey
  platform: PublicKey
  amount: BN
  requestId: string
  proposalId: string
  status: EscrowStatus
  createdAt: BN
  fundedAt?: BN
  deliveredAt?: BN
  completedAt?: BN
  refundedAt?: BN
  bump: number
}

/**
 * Anchor Escrow 客户端
 */
export class AnchorEscrowClient {
  private connection: Connection
  private program: Program

  constructor() {
    this.connection = new Connection(SOLANA_RPC_URL, 'confirmed')
    
    // 创建一个虚拟的 provider（用于只读操作）
    const provider = new AnchorProvider(
      this.connection,
      {} as any, // 不需要钱包进行只读操作
      { commitment: 'confirmed' }
    )

    this.program = new Program(idl as Idl, PROGRAM_ID, provider)
  }

  /**
   * 派生托管账户 PDA
   */
  async deriveEscrowPDA(
    buyer: PublicKey,
    requestId: string
  ): Promise<[PublicKey, number]> {
    return await PublicKey.findProgramAddress(
      [
        Buffer.from('escrow'),
        buyer.toBuffer(),
        Buffer.from(requestId),
      ],
      PROGRAM_ID
    )
  }

  /**
   * 创建托管账户
   * 
   * @param buyer 买家公钥
   * @param provider 提供商公钥
   * @param amount 托管金额（USDC）
   * @param requestId 需求 ID
   * @param proposalId 提案 ID
   * @returns 序列化的交易（需要买家签名）
   */
  async createEscrow(
    buyer: PublicKey,
    provider: PublicKey,
    amount: number,
    requestId: string,
    proposalId: string
  ): Promise<{ transaction: Transaction; escrowPDA: PublicKey }> {
    // 派生托管 PDA
    const [escrowPDA] = await this.deriveEscrowPDA(buyer, requestId)

    // 获取 Token 账户
    const buyerTokenAccount = await getAssociatedTokenAddress(USDC_MINT, buyer)
    const escrowTokenAccount = await getAssociatedTokenAddress(USDC_MINT, escrowPDA, true)

    // 转换金额
    const amountBN = new BN(amount * Math.pow(10, USDC_DECIMALS))

    // 创建交易
    const transaction = new Transaction()

    // 检查托管的 Token 账户是否存在
    try {
      await getAccount(this.connection, escrowTokenAccount)
    } catch (error) {
      // 创建托管的 Token 账户
      transaction.add(
        createAssociatedTokenAccountInstruction(
          buyer,
          escrowTokenAccount,
          escrowPDA,
          USDC_MINT
        )
      )
    }

    // 调用 create_escrow 指令
    const ix = await this.program.methods
      .createEscrow(amountBN, requestId, proposalId)
      .accounts({
        escrow: escrowPDA,
        buyer,
        provider,
        platform: PLATFORM_WALLET,
        buyerTokenAccount,
        escrowTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .instruction()

    transaction.add(ix)

    // 获取最新的 blockhash
    const { blockhash } = await this.connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = buyer

    return { transaction, escrowPDA }
  }

  /**
   * 标记数据已交付
   */
  async markDelivered(
    provider: PublicKey,
    escrowPDA: PublicKey
  ): Promise<Transaction> {
    const transaction = new Transaction()

    const ix = await this.program.methods
      .markDelivered()
      .accounts({
        escrow: escrowPDA,
        provider,
      })
      .instruction()

    transaction.add(ix)

    const { blockhash } = await this.connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = provider

    return transaction
  }

  /**
   * 确认交付并释放资金
   */
  async confirmAndRelease(
    buyer: PublicKey,
    provider: PublicKey,
    escrowPDA: PublicKey
  ): Promise<Transaction> {
    const escrowTokenAccount = await getAssociatedTokenAddress(USDC_MINT, escrowPDA, true)
    const providerTokenAccount = await getAssociatedTokenAddress(USDC_MINT, provider)
    const platformTokenAccount = await getAssociatedTokenAddress(USDC_MINT, PLATFORM_WALLET)

    const transaction = new Transaction()

    // 检查提供商的 Token 账户
    try {
      await getAccount(this.connection, providerTokenAccount)
    } catch (error) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          buyer,
          providerTokenAccount,
          provider,
          USDC_MINT
        )
      )
    }

    const ix = await this.program.methods
      .confirmAndRelease()
      .accounts({
        escrow: escrowPDA,
        buyer,
        escrowTokenAccount,
        providerTokenAccount,
        platformTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction()

    transaction.add(ix)

    const { blockhash } = await this.connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = buyer

    return transaction
  }

  /**
   * 退款
   */
  async refund(
    authority: PublicKey,
    buyer: PublicKey,
    escrowPDA: PublicKey
  ): Promise<Transaction> {
    const escrowTokenAccount = await getAssociatedTokenAddress(USDC_MINT, escrowPDA, true)
    const buyerTokenAccount = await getAssociatedTokenAddress(USDC_MINT, buyer)

    const transaction = new Transaction()

    const ix = await this.program.methods
      .refund()
      .accounts({
        escrow: escrowPDA,
        authority,
        escrowTokenAccount,
        buyerTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction()

    transaction.add(ix)

    const { blockhash } = await this.connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = authority

    return transaction
  }

  /**
   * 取消托管
   */
  async cancel(buyer: PublicKey, escrowPDA: PublicKey): Promise<Transaction> {
    const transaction = new Transaction()

    const ix = await this.program.methods
      .cancel()
      .accounts({
        escrow: escrowPDA,
        buyer,
      })
      .instruction()

    transaction.add(ix)

    const { blockhash } = await this.connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = buyer

    return transaction
  }

  /**
   * 获取托管账户数据
   */
  async getEscrow(escrowPDA: PublicKey): Promise<EscrowAccount | null> {
    try {
      const escrowAccount = await this.program.account.escrow.fetch(escrowPDA)
      return escrowAccount as EscrowAccount
    } catch (error) {
      console.error('Failed to fetch escrow account:', error)
      return null
    }
  }

  /**
   * 获取托管账户余额
   */
  async getEscrowBalance(escrowPDA: PublicKey): Promise<number> {
    try {
      const escrowTokenAccount = await getAssociatedTokenAddress(USDC_MINT, escrowPDA, true)
      const accountInfo = await getAccount(this.connection, escrowTokenAccount)
      return Number(accountInfo.amount) / Math.pow(10, USDC_DECIMALS)
    } catch (error) {
      console.error('Failed to get escrow balance:', error)
      return 0
    }
  }

  /**
   * 获取所有托管账户（按买家）
   */
  async getEscrowsByBuyer(buyer: PublicKey): Promise<EscrowAccount[]> {
    try {
      const escrows = await this.program.account.escrow.all([
        {
          memcmp: {
            offset: 8, // 跳过 discriminator
            bytes: buyer.toBase58(),
          },
        },
      ])
      return escrows.map((e) => e.account as EscrowAccount)
    } catch (error) {
      console.error('Failed to fetch escrows by buyer:', error)
      return []
    }
  }

  /**
   * 获取所有托管账户（按提供商）
   */
  async getEscrowsByProvider(provider: PublicKey): Promise<EscrowAccount[]> {
    try {
      const escrows = await this.program.account.escrow.all([
        {
          memcmp: {
            offset: 8 + 32, // 跳过 discriminator + buyer
            bytes: provider.toBase58(),
          },
        },
      ])
      return escrows.map((e) => e.account as EscrowAccount)
    } catch (error) {
      console.error('Failed to fetch escrows by provider:', error)
      return []
    }
  }
}

/**
 * 创建全局客户端实例
 */
export const anchorEscrowClient = new AnchorEscrowClient()

