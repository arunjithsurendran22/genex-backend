export interface transactionPoolInterface {
  wallets: [
    {
      worker_wallet: string;
      status: string;
    }
  ];
  tokenAddress: string;
  master_wallet: string;
}

export interface withdrawInterface {
  amount: number;
  master_wallet: string;
  toWallet_pubkey: string;
}
