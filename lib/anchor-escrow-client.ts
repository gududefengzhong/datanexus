/**
 * Anchor Escrow Client
 * 完整的 Anchor 智能合约客户端库
 * 支持所有 7 个核心功能
 */

import { Connection, PublicKey, Transaction, Keypair } from '@solana/web3.js'
import { AnchorProvider, Program, Wallet, BN } from '@coral-xyz/anchor'
import { 
  getAssociatedTokenAddress, 
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction 
} from '@solana/spl-token'
import idl from '../target/idl/datanexus_escrow.json'

// 配置常量
export const ANCHOR_CONFIG = {
  PROGRAM_ID: new PublicKey('gxDTeSCzk9mqiokrmTb1uNbWCjQ1rj2hsj5N65K9698'),
  USDC_MINT: new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'),
  DEVNET_RPC: 'https://api.devnet.solana.com',
}

// Escrow 状态枚举
export enum EscrowStatus {
  Created = 'created',
  Funded = 'funded',
  Delivered = 'delivered',
  Disputed = 'disputed',
  Completed = 'completed',
  Refunded = 'refunded',
  Cancelled = 'cancelled',
}

// Escrow 数据结构
export interface EscrowAccount {
  buyer: PublicKey
  provider: PublicKey
  platform: PublicKey
  amount: BN
  requestId: string
  proposalId: string
  status: EscrowStatus
  createdAt: BN
  fundedAt: BN | null
  deliveredAt: BN | null
  completedAt: BN | null
  refundedAt: BN | null
  disputedAt: BN | null
  bump: number
}

/**
 * Anchor Escrow 客户端类
 */
export class AnchorEscrowClient {
  private connection: Connection
  private program: Program
  private wallet: Wallet

  constructor(
    connection: Connection,
    wallet: Wallet,
    programId: PublicKey = ANCHOR_CONFIG.PROGRAM_ID
  ) {
    this.connection = connection
    this.wallet = wallet
    
    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    })
    
    this.program = new Program(idl as any, provider)
  }

  /**
   * 计算 Escrow PDA
   */
  getEscrowPDA(buyer: PublicKey, requestId: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('escrow'),
        buyer.toBuffer(),
        Buffer.from(requestId),
      ],
      this.program.programId
    )
  }

  /**
   * 获取 Escrow 账户数据
   */
  async getEscrow(buyer: PublicKey, requestId: string): Promise<EscrowAccount | null> {
    try {
      const [escrowPda] = this.getEscrowPDA(buyer, requestId)
      const escrowAccount = await this.program.account.escrow.fetch(escrowPda)
      return escrowAccount as any
    } catch (error) {
      console.error('获取 Escrow 失败:', error)
      return null
    }
  }

  /**
   * 检查并创建 Associated Token Account
   */
  async ensureTokenAccount(
    owner: PublicKey,
    mint: PublicKey = ANCHOR_CONFIG.USDC_MINT,
    allowOwnerOffCurve = false
  ): Promise<PublicKey> {
    const tokenAccount = await getAssociatedTokenAddress(
      mint,
      owner,
      allowOwnerOffCurve
    )

    const accountInfo = await this.connection.getAccountInfo(tokenAccount)
    
    if (!accountInfo) {
      // 创建 ATA
      const createIx = createAssociatedTokenAccountInstruction(
        this.wallet.publicKey,
        tokenAccount,
        owner,
        mint
      )
      
      const tx = new Transaction().add(createIx)
      const signature = await this.wallet.sendTransaction(tx, this.connection)
      await this.connection.confirmTransaction(signature, 'confirmed')
    }

    return tokenAccount
  }

  /**
   * 1. 创建 Escrow
   */
  async createEscrow(
    provider: PublicKey,
    platform: PublicKey,
    amount: number, // USDC 金额（小数）
    requestId: string,
    proposalId: string
  ): Promise<string> {
    const buyer = this.wallet.publicKey
    const [escrowPda] = this.getEscrowPDA(buyer, requestId)
    
    // 转换金额为 lamports
    const amountLamports = new BN(Math.floor(amount * 1_000_000))

    // 获取 token 账户
    const buyerTokenAccount = await this.ensureTokenAccount(buyer)
    const escrowTokenAccount = await this.ensureTokenAccount(escrowPda, ANCHOR_CONFIG.USDC_MINT, true)

    // 调用智能合约
    const tx = await this.program.methods
      .createEscrow(amountLamports, requestId, proposalId)
      .accounts({
        buyer,
        provider,
        platform,
        escrow: escrowPda,
        buyerTokenAccount,
        escrowTokenAccount,
        usdcMint: ANCHOR_CONFIG.USDC_MINT,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc()

    await this.connection.confirmTransaction(tx, 'confirmed')
    return tx
  }

  /**
   * 2. 标记交付
   */
  async markDelivered(
    buyer: PublicKey,
    requestId: string
  ): Promise<string> {
    const [escrowPda] = this.getEscrowPDA(buyer, requestId)

    const tx = await this.program.methods
      .markDelivered()
      .accounts({
        provider: this.wallet.publicKey,
        escrow: escrowPda,
      })
      .rpc()

    await this.connection.confirmTransaction(tx, 'confirmed')
    return tx
  }

  /**
   * 3. 确认并释放资金 (95/5)
   */
  async confirmAndRelease(
    buyer: PublicKey,
    requestId: string
  ): Promise<string> {
    const [escrowPda] = this.getEscrowPDA(buyer, requestId)
    const escrow = await this.getEscrow(buyer, requestId)
    
    if (!escrow) {
      throw new Error('Escrow 不存在')
    }

    // 获取 token 账户
    const escrowTokenAccount = await getAssociatedTokenAddress(
      ANCHOR_CONFIG.USDC_MINT,
      escrowPda,
      true
    )
    const providerTokenAccount = await this.ensureTokenAccount(escrow.provider)
    const platformTokenAccount = await this.ensureTokenAccount(escrow.platform)

    const tx = await this.program.methods
      .confirmAndRelease()
      .accounts({
        buyer: this.wallet.publicKey,
        escrow: escrowPda,
        escrowTokenAccount,
        providerTokenAccount,
        platformTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc()

    await this.connection.confirmTransaction(tx, 'confirmed')
    return tx
  }

  /**
   * 4. 取消订单（交付前）
   */
  async cancel(
    buyer: PublicKey,
    requestId: string
  ): Promise<string> {
    const [escrowPda] = this.getEscrowPDA(buyer, requestId)

    // 获取 token 账户
    const escrowTokenAccount = await getAssociatedTokenAddress(
      ANCHOR_CONFIG.USDC_MINT,
      escrowPda,
      true
    )
    const buyerTokenAccount = await this.ensureTokenAccount(buyer)

    const tx = await this.program.methods
      .cancel()
      .accounts({
        buyer: this.wallet.publicKey,
        escrow: escrowPda,
        escrowTokenAccount,
        buyerTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc()

    await this.connection.confirmTransaction(tx, 'confirmed')
    return tx
  }

  /**
   * 5. 买家发起争议
   */
  async raiseDispute(
    buyer: PublicKey,
    requestId: string
  ): Promise<string> {
    const [escrowPda] = this.getEscrowPDA(buyer, requestId)

    const tx = await this.program.methods
      .raiseDispute()
      .accounts({
        escrow: escrowPda,
        buyer: this.wallet.publicKey,
      })
      .rpc()

    await this.connection.confirmTransaction(tx, 'confirmed')
    return tx
  }

  /**
   * 6. 平台解决争议
   */
  async resolveDispute(
    buyer: PublicKey,
    requestId: string,
    refundToBuyer: boolean
  ): Promise<string> {
    const [escrowPda] = this.getEscrowPDA(buyer, requestId)
    const escrow = await this.getEscrow(buyer, requestId)
    
    if (!escrow) {
      throw new Error('Escrow 不存在')
    }

    // 获取 token 账户
    const escrowTokenAccount = await getAssociatedTokenAddress(
      ANCHOR_CONFIG.USDC_MINT,
      escrowPda,
      true
    )
    const buyerTokenAccount = await this.ensureTokenAccount(escrow.buyer)
    const providerTokenAccount = await this.ensureTokenAccount(escrow.provider)
    const platformTokenAccount = await this.ensureTokenAccount(escrow.platform)

    const tx = await this.program.methods
      .resolveDispute(refundToBuyer)
      .accounts({
        escrow: escrowPda,
        platform: this.wallet.publicKey,
        escrowTokenAccount,
        buyerTokenAccount,
        providerTokenAccount,
        platformTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc()

    await this.connection.confirmTransaction(tx, 'confirmed')
    return tx
  }

  /**
   * 获取 Escrow 状态的可读字符串
   */
  static getStatusString(status: any): EscrowStatus {
    if (status.created) return EscrowStatus.Created
    if (status.funded) return EscrowStatus.Funded
    if (status.delivered) return EscrowStatus.Delivered
    if (status.disputed) return EscrowStatus.Disputed
    if (status.completed) return EscrowStatus.Completed
    if (status.refunded) return EscrowStatus.Refunded
    if (status.cancelled) return EscrowStatus.Cancelled
    return EscrowStatus.Created
  }

  /**
   * 格式化金额（lamports 转 USDC）
   */
  static formatAmount(lamports: BN): number {
    return lamports.toNumber() / 1_000_000
  }

  /**
   * 格式化时间戳
   */
  static formatTimestamp(timestamp: BN | null): Date | null {
    if (!timestamp) return null
    return new Date(timestamp.toNumber() * 1000)
  }
}

/**
 * 创建客户端实例的便捷函数
 */
export function createAnchorEscrowClient(
  wallet: Wallet,
  rpcUrl: string = ANCHOR_CONFIG.DEVNET_RPC
): AnchorEscrowClient {
  const connection = new Connection(rpcUrl, 'confirmed')
  return new AnchorEscrowClient(connection, wallet)
}

