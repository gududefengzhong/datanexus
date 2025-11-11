import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { DatanexusEscrow } from "../target/types/datanexus_escrow";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo } from "@solana/spl-token";
import { assert } from "chai";

describe("datanexus-escrow", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.DatanexusEscrow as Program<DatanexusEscrow>;

  let mint: PublicKey;
  let buyerTokenAccount: PublicKey;
  let providerTokenAccount: PublicKey;
  let platformTokenAccount: PublicKey;
  let escrowTokenAccount: PublicKey;

  const buyer = Keypair.generate();
  const provider_user = Keypair.generate();
  const platform = Keypair.generate();

  const requestId = "test-request-001";
  const proposalId = "test-proposal-001";
  const amount = new anchor.BN(1_000_000); // 1 USDC (6 decimals)

  before(async () => {
    // Airdrop SOL to test accounts
    await provider.connection.requestAirdrop(buyer.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(provider_user.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(platform.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);

    // Wait for airdrops to confirm
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create USDC mint (6 decimals)
    mint = await createMint(
      provider.connection,
      buyer,
      buyer.publicKey,
      null,
      6
    );

    // Create token accounts
    buyerTokenAccount = await createAccount(
      provider.connection,
      buyer,
      mint,
      buyer.publicKey
    );

    providerTokenAccount = await createAccount(
      provider.connection,
      provider_user,
      mint,
      provider_user.publicKey
    );

    platformTokenAccount = await createAccount(
      provider.connection,
      platform,
      mint,
      platform.publicKey
    );

    // Mint USDC to buyer
    await mintTo(
      provider.connection,
      buyer,
      mint,
      buyerTokenAccount,
      buyer,
      10_000_000 // 10 USDC
    );

    console.log("Setup complete:");
    console.log("  Mint:", mint.toBase58());
    console.log("  Buyer:", buyer.publicKey.toBase58());
    console.log("  Provider:", provider_user.publicKey.toBase58());
    console.log("  Platform:", platform.publicKey.toBase58());
  });

  it("Creates an escrow", async () => {
    const [escrowPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        buyer.publicKey.toBuffer(),
        Buffer.from(requestId),
      ],
      program.programId
    );

    // Create escrow token account
    escrowTokenAccount = await createAccount(
      provider.connection,
      buyer,
      mint,
      escrowPda,
      undefined
    );

    const tx = await program.methods
      .createEscrow(amount, requestId, proposalId)
      .accounts({
        escrow: escrowPda,
        buyer: buyer.publicKey,
        provider: provider_user.publicKey,
        platform: platform.publicKey,
        buyerTokenAccount: buyerTokenAccount,
        escrowTokenAccount: escrowTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([buyer])
      .rpc();

    console.log("Escrow created:", tx);

    // Verify escrow account
    const escrowAccount = await program.account.escrow.fetch(escrowPda);
    assert.equal(escrowAccount.buyer.toBase58(), buyer.publicKey.toBase58());
    assert.equal(escrowAccount.provider.toBase58(), provider_user.publicKey.toBase58());
    assert.equal(escrowAccount.amount.toString(), amount.toString());
    assert.equal(escrowAccount.requestId, requestId);
    assert.equal(escrowAccount.proposalId, proposalId);
  });

  it("Marks data as delivered", async () => {
    const [escrowPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        buyer.publicKey.toBuffer(),
        Buffer.from(requestId),
      ],
      program.programId
    );

    const tx = await program.methods
      .markDelivered()
      .accounts({
        escrow: escrowPda,
        provider: provider_user.publicKey,
      })
      .signers([provider_user])
      .rpc();

    console.log("Data marked as delivered:", tx);

    // Verify status
    const escrowAccount = await program.account.escrow.fetch(escrowPda);
    assert.equal(escrowAccount.status.delivered !== undefined, true);
  });

  it("Confirms and releases funds", async () => {
    const [escrowPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        buyer.publicKey.toBuffer(),
        Buffer.from(requestId),
      ],
      program.programId
    );

    const tx = await program.methods
      .confirmAndRelease()
      .accounts({
        escrow: escrowPda,
        buyer: buyer.publicKey,
        escrowTokenAccount: escrowTokenAccount,
        providerTokenAccount: providerTokenAccount,
        platformTokenAccount: platformTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([buyer])
      .rpc();

    console.log("Funds released:", tx);

    // Verify status
    const escrowAccount = await program.account.escrow.fetch(escrowPda);
    assert.equal(escrowAccount.status.completed !== undefined, true);

    // Verify token balances
    const providerBalance = await provider.connection.getTokenAccountBalance(providerTokenAccount);
    const platformBalance = await provider.connection.getTokenAccountBalance(platformTokenAccount);

    console.log("Provider received:", providerBalance.value.uiAmount, "USDC");
    console.log("Platform received:", platformBalance.value.uiAmount, "USDC");

    // 95% to provider, 5% to platform
    assert.equal(providerBalance.value.amount, "950000"); // 0.95 USDC
    assert.equal(platformBalance.value.amount, "50000");  // 0.05 USDC
  });
});

