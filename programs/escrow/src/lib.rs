use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("gxDTeSCzk9mqiokrmTb1uNbWCjQ1rj2hsj5N65K9698");

/// DataNexus Escrow Program
/// 
/// 实现去中心化的数据交易托管：
/// 1. 买家创建托管并转入 USDC
/// 2. 提供商交付数据
/// 3. 买家确认后自动释放资金（95% 给提供商，5% 给平台）
/// 4. 支持争议和退款
#[program]
pub mod datanexus_escrow {
    use super::*;

    /// 创建托管账户
    /// 
    /// 买家调用此指令创建托管，并转入 USDC
    pub fn create_escrow(
        ctx: Context<CreateEscrow>,
        amount: u64,
        request_id: String,
        proposal_id: String,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        
        // 初始化托管账户
        escrow.buyer = ctx.accounts.buyer.key();
        escrow.provider = ctx.accounts.provider.key();
        escrow.platform = ctx.accounts.platform.key();
        escrow.amount = amount;
        escrow.request_id = request_id;
        escrow.proposal_id = proposal_id;
        escrow.status = EscrowStatus::Created;
        escrow.created_at = Clock::get()?.unix_timestamp;
        escrow.bump = ctx.bumps.escrow;

        // 转账 USDC 到托管账户
        let cpi_accounts = Transfer {
            from: ctx.accounts.buyer_token_account.to_account_info(),
            to: ctx.accounts.escrow_token_account.to_account_info(),
            authority: ctx.accounts.buyer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        token::transfer(cpi_ctx, amount)?;

        escrow.status = EscrowStatus::Funded;
        escrow.funded_at = Some(Clock::get()?.unix_timestamp);

        msg!("Escrow created: {}", escrow.key());
        msg!("Amount: {} USDC", amount);
        msg!("Buyer: {}", escrow.buyer);
        msg!("Provider: {}", escrow.provider);

        Ok(())
    }

    /// 提供商标记数据已交付
    pub fn mark_delivered(ctx: Context<MarkDelivered>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;

        require!(
            escrow.status == EscrowStatus::Funded,
            EscrowError::InvalidStatus
        );

        require!(
            ctx.accounts.provider.key() == escrow.provider,
            EscrowError::Unauthorized
        );

        escrow.status = EscrowStatus::Delivered;
        escrow.delivered_at = Some(Clock::get()?.unix_timestamp);

        msg!("Data delivered for escrow: {}", escrow.key());

        Ok(())
    }

    /// 买家确认交付并释放资金
    /// 
    /// 自动分配：95% 给提供商，5% 给平台
    pub fn confirm_and_release(ctx: Context<ConfirmAndRelease>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;

        require!(
            escrow.status == EscrowStatus::Delivered,
            EscrowError::InvalidStatus
        );

        require!(
            ctx.accounts.buyer.key() == escrow.buyer,
            EscrowError::Unauthorized
        );

        // 计算分配金额
        let total_amount = escrow.amount;
        let platform_fee = total_amount
            .checked_mul(5)
            .unwrap()
            .checked_div(100)
            .unwrap(); // 5%
        let provider_amount = total_amount.checked_sub(platform_fee).unwrap(); // 95%

        msg!("Releasing funds:");
        msg!("  Total: {} USDC", total_amount);
        msg!("  Provider (95%): {} USDC", provider_amount);
        msg!("  Platform (5%): {} USDC", platform_fee);

        // 生成 PDA 签名种子
        let seeds = &[
            b"escrow",
            escrow.buyer.as_ref(),
            escrow.request_id.as_bytes(),
            &[escrow.bump],
        ];
        let signer = &[&seeds[..]];

        // 转账给提供商（95%）
        let cpi_accounts_provider = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.provider_token_account.to_account_info(),
            authority: escrow.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx_provider = CpiContext::new_with_signer(
            cpi_program.clone(),
            cpi_accounts_provider,
            signer,
        );
        token::transfer(cpi_ctx_provider, provider_amount)?;

        // 转账给平台（5%）
        let cpi_accounts_platform = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.platform_token_account.to_account_info(),
            authority: escrow.to_account_info(),
        };
        let cpi_ctx_platform = CpiContext::new_with_signer(
            cpi_program,
            cpi_accounts_platform,
            signer,
        );
        token::transfer(cpi_ctx_platform, platform_fee)?;

        escrow.status = EscrowStatus::Completed;
        escrow.completed_at = Some(Clock::get()?.unix_timestamp);

        msg!("Escrow completed: {}", escrow.key());

        Ok(())
    }

    /// 退款给买家（仅平台可调用，用于争议解决）
    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;

        // 只允许在 Disputed 状态退款
        require!(
            escrow.status == EscrowStatus::Disputed,
            EscrowError::InvalidStatus
        );

        // 只有平台可以发起退款（仲裁后）
        require!(
            ctx.accounts.authority.key() == escrow.platform,
            EscrowError::Unauthorized
        );

        let amount = escrow.amount;

        // 生成 PDA 签名种子
        let seeds = &[
            b"escrow",
            escrow.buyer.as_ref(),
            escrow.request_id.as_bytes(),
            &[escrow.bump],
        ];
        let signer = &[&seeds[..]];

        // 退款给买家
        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.buyer_token_account.to_account_info(),
            authority: escrow.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        
        token::transfer(cpi_ctx, amount)?;

        escrow.status = EscrowStatus::Refunded;
        escrow.refunded_at = Some(Clock::get()?.unix_timestamp);

        msg!("Escrow refunded: {}", escrow.key());
        msg!("Amount: {} USDC", amount);

        Ok(())
    }

    /// 取消托管（仅在交付前）
    pub fn cancel(ctx: Context<Cancel>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;

        // 只允许在 Funded 状态取消（交付前）
        require!(
            escrow.status == EscrowStatus::Funded,
            EscrowError::InvalidStatus
        );

        // 只有买家可以取消
        require!(
            ctx.accounts.buyer.key() == escrow.buyer,
            EscrowError::Unauthorized
        );

        let amount = escrow.amount;

        // 生成 PDA 签名种子
        let seeds = &[
            b"escrow",
            escrow.buyer.as_ref(),
            escrow.request_id.as_bytes(),
            &[escrow.bump],
        ];
        let signer = &[&seeds[..]];

        // 退款给买家
        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.buyer_token_account.to_account_info(),
            authority: escrow.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        token::transfer(cpi_ctx, amount)?;

        escrow.status = EscrowStatus::Cancelled;

        msg!("Escrow cancelled: {}", escrow.key());
        msg!("Refunded amount: {} USDC", amount);

        Ok(())
    }

    /// 买家发起争议
    pub fn raise_dispute(ctx: Context<RaiseDispute>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;

        // 只允许在 Delivered 状态发起争议
        require!(
            escrow.status == EscrowStatus::Delivered,
            EscrowError::InvalidStatus
        );

        // 只有买家可以发起争议
        require!(
            ctx.accounts.buyer.key() == escrow.buyer,
            EscrowError::Unauthorized
        );

        escrow.status = EscrowStatus::Disputed;
        escrow.disputed_at = Some(Clock::get()?.unix_timestamp);

        msg!("Dispute raised for escrow: {}", escrow.key());
        msg!("Buyer: {}", escrow.buyer);

        Ok(())
    }

    /// 平台解决争议（退款或释放）
    pub fn resolve_dispute(
        ctx: Context<ResolveDispute>,
        refund_to_buyer: bool,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;

        // 只允许在 Disputed 状态解决争议
        require!(
            escrow.status == EscrowStatus::Disputed,
            EscrowError::InvalidStatus
        );

        // 只有平台可以解决争议
        require!(
            ctx.accounts.platform.key() == escrow.platform,
            EscrowError::Unauthorized
        );

        let amount = escrow.amount;

        // 生成 PDA 签名种子
        let seeds = &[
            b"escrow",
            escrow.buyer.as_ref(),
            escrow.request_id.as_bytes(),
            &[escrow.bump],
        ];
        let signer = &[&seeds[..]];

        if refund_to_buyer {
            // 退款给买家
            let cpi_accounts = Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.buyer_token_account.to_account_info(),
                authority: escrow.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

            token::transfer(cpi_ctx, amount)?;

            escrow.status = EscrowStatus::Refunded;
            escrow.refunded_at = Some(Clock::get()?.unix_timestamp);

            msg!("Dispute resolved: Refunded to buyer");
            msg!("Amount: {} USDC", amount);
        } else {
            // 释放给提供商（95/5）
            let total_amount = amount;
            let platform_fee = total_amount.checked_mul(5).unwrap().checked_div(100).unwrap();
            let provider_amount = total_amount.checked_sub(platform_fee).unwrap();

            // 转账给提供商（95%）
            let cpi_accounts_provider = Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.provider_token_account.to_account_info(),
                authority: escrow.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx_provider = CpiContext::new_with_signer(cpi_program.clone(), cpi_accounts_provider, signer);

            token::transfer(cpi_ctx_provider, provider_amount)?;

            // 转账给平台（5%）
            let cpi_accounts_platform = Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.platform_token_account.to_account_info(),
                authority: escrow.to_account_info(),
            };
            let cpi_ctx_platform = CpiContext::new_with_signer(cpi_program, cpi_accounts_platform, signer);

            token::transfer(cpi_ctx_platform, platform_fee)?;

            escrow.status = EscrowStatus::Completed;
            escrow.completed_at = Some(Clock::get()?.unix_timestamp);

            msg!("Dispute resolved: Released to provider");
            msg!("Provider amount: {} USDC (95%)", provider_amount);
            msg!("Platform fee: {} USDC (5%)", platform_fee);
        }

        Ok(())
    }
}

/// 托管账户数据结构
#[account]
pub struct Escrow {
    pub buyer: Pubkey,           // 买家
    pub provider: Pubkey,        // 提供商
    pub platform: Pubkey,        // 平台
    pub amount: u64,             // 托管金额（USDC，6 位小数）
    pub request_id: String,      // 需求 ID
    pub proposal_id: String,     // 提案 ID
    pub status: EscrowStatus,    // 状态
    pub created_at: i64,         // 创建时间
    pub funded_at: Option<i64>,  // 充值时间
    pub delivered_at: Option<i64>, // 交付时间
    pub completed_at: Option<i64>, // 完成时间
    pub refunded_at: Option<i64>,  // 退款时间
    pub disputed_at: Option<i64>,  // 争议时间
    pub bump: u8,                // PDA bump
}

/// 托管状态
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum EscrowStatus {
    Created,    // 已创建
    Funded,     // 已充值
    Delivered,  // 已交付
    Disputed,   // 争议中
    Completed,  // 已完成
    Refunded,   // 已退款
    Cancelled,  // 已取消
}

/// 创建托管的上下文
#[derive(Accounts)]
#[instruction(amount: u64, request_id: String, proposal_id: String)]
pub struct CreateEscrow<'info> {
    #[account(
        init,
        payer = buyer,
        space = 8 + 32 + 32 + 32 + 8 + 64 + 64 + 1 + 8 + 9 + 9 + 9 + 9 + 9 + 1,
        seeds = [b"escrow", buyer.key().as_ref(), request_id.as_bytes()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    /// CHECK: Provider address
    pub provider: AccountInfo<'info>,

    /// CHECK: Platform address
    pub platform: AccountInfo<'info>,

    #[account(mut)]
    pub buyer_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

/// 标记已交付的上下文
#[derive(Accounts)]
pub struct MarkDelivered<'info> {
    #[account(mut)]
    pub escrow: Account<'info, Escrow>,

    pub provider: Signer<'info>,
}

/// 确认并释放资金的上下文
#[derive(Accounts)]
pub struct ConfirmAndRelease<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.buyer.as_ref(), escrow.request_id.as_bytes()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,

    pub buyer: Signer<'info>,

    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub provider_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub platform_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

/// 退款的上下文
#[derive(Accounts)]
pub struct Refund<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.buyer.as_ref(), escrow.request_id.as_bytes()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,

    pub authority: Signer<'info>,

    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub buyer_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

/// 取消的上下文
#[derive(Accounts)]
pub struct Cancel<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.buyer.as_ref(), escrow.request_id.as_bytes()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,

    pub buyer: Signer<'info>,

    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub buyer_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

/// 发起争议的上下文
#[derive(Accounts)]
pub struct RaiseDispute<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.buyer.as_ref(), escrow.request_id.as_bytes()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,

    pub buyer: Signer<'info>,
}

/// 解决争议的上下文
#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.buyer.as_ref(), escrow.request_id.as_bytes()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,

    pub platform: Signer<'info>,

    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub buyer_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub provider_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub platform_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

/// 错误代码
#[error_code]
pub enum EscrowError {
    #[msg("Invalid escrow status for this operation")]
    InvalidStatus,

    #[msg("Unauthorized: You don't have permission to perform this action")]
    Unauthorized,

    #[msg("Invalid amount")]
    InvalidAmount,
}

