using Cicclo.Api.Models;
using Cicclo.Api.Services;

namespace Cicclo.Tests.Services;

public sealed class WalletServiceTests
{
    [Fact]
    public void GetWallet_ReturnsFixedAccountWithInitialBalance()
    {
        var service = new WalletService();

        var wallet = service.GetWallet(1);

        Assert.NotNull(wallet);
        Assert.Equal(1, wallet.AccountId);
        Assert.Equal(50.00m, wallet.Balance);
    }

    [Fact]
    public void GetBalance_ReturnsInitialBalanceForFixedAccount()
    {
        var service = new WalletService();

        var balance = service.GetBalance(1);

        Assert.Equal(50.00m, balance);
    }

    [Fact]
    public void AccountExists_ReturnsFalseForUnknownAccount()
    {
        var service = new WalletService();

        var exists = service.AccountExists(2);

        Assert.False(exists);
        Assert.Null(service.GetWallet(2));
        Assert.Null(service.GetBalance(2));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void TryDebit_WithNonPositiveAmount_IsRejectedWithoutChangingBalance(decimal amount)
    {
        var service = new WalletService();

        var result = service.TryDebit(1, amount);

        Assert.Equal(DebitStatus.InvalidAmount, result.Status);
        Assert.Equal(50.00m, result.RemainingBalance);
        Assert.Equal(50.00m, service.GetBalance(1));
    }

    [Fact]
    public void TryDebit_WithInsufficientBalance_IsRejectedWithoutChangingBalance()
    {
        var service = new WalletService();

        var result = service.TryDebit(1, 50.01m);

        Assert.Equal(DebitStatus.InsufficientBalance, result.Status);
        Assert.Equal(50.00m, result.RemainingBalance);
        Assert.Equal(50.00m, service.GetBalance(1));
    }

    [Fact]
    public async Task TryDebit_Concurrently_NeverOverdrawsWallet()
    {
        var service = new WalletService();

        var attempts = Enumerable.Range(0, 10)
            .Select(_ => Task.Run(() => service.TryDebit(1, 20.90m)));
        var results = await Task.WhenAll(attempts);

        Assert.Equal(2, results.Count(result => result.Status == DebitStatus.Completed));
        Assert.Equal(8, results.Count(result => result.Status == DebitStatus.InsufficientBalance));
        Assert.Equal(8.20m, service.GetBalance(1));
        Assert.True(service.GetBalance(1) >= 0);
    }
}
