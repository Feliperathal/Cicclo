namespace Cicclo.Api.Models;

public sealed class Wallet
{
    internal Wallet(int accountId, decimal balance)
    {
        AccountId = accountId;
        Balance = balance;
    }

    public int AccountId { get; }

    public decimal Balance { get; }
}
