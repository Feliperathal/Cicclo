using Cicclo.Api.Models;

namespace Cicclo.Api.Services;

public sealed class WalletService : IWalletService
{
    private readonly object _syncRoot = new();
    private readonly List<Wallet> _wallets =
    [
        new Wallet(1, 50.00m)
    ];

    public Wallet? GetWallet(int accountId)
    {
        lock (_syncRoot)
        {
            var wallet = _wallets.Find(wallet => wallet.AccountId == accountId);

            return wallet is null
                ? null
                : new Wallet(wallet.AccountId, wallet.Balance);
        }
    }

    public decimal? GetBalance(int accountId)
    {
        lock (_syncRoot)
        {
            return _wallets.Find(wallet => wallet.AccountId == accountId)?.Balance;
        }
    }

    public bool AccountExists(int accountId)
    {
        lock (_syncRoot)
        {
            return _wallets.Exists(wallet => wallet.AccountId == accountId);
        }
    }

    public DebitResult TryDebit(int accountId, decimal amount)
    {
        lock (_syncRoot)
        {
            var walletIndex = _wallets.FindIndex(wallet => wallet.AccountId == accountId);

            if (walletIndex < 0)
            {
                return new DebitResult(DebitStatus.AccountNotFound, null);
            }

            var wallet = _wallets[walletIndex];

            if (amount <= 0)
            {
                return new DebitResult(DebitStatus.InvalidAmount, wallet.Balance);
            }

            if (wallet.Balance < amount)
            {
                return new DebitResult(DebitStatus.InsufficientBalance, wallet.Balance);
            }

            var remainingBalance = wallet.Balance - amount;
            _wallets[walletIndex] = new Wallet(wallet.AccountId, remainingBalance);

            return new DebitResult(DebitStatus.Completed, remainingBalance);
        }
    }
}
