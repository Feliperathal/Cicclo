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
}
