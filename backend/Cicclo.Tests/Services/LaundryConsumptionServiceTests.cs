using Cicclo.Api.Models;
using Cicclo.Api.Services;

namespace Cicclo.Tests.Services;

public sealed class LaundryConsumptionServiceTests
{
    [Fact]
    public void Consume_Washing_DebitsExpectedAmount()
    {
        var (service, wallet) = CreateServices();

        var result = service.Consume(1, 1);

        Assert.Equal(ConsumptionStatus.Completed, result.Status);
        Assert.NotNull(result.TransactionId);
        Assert.NotEqual(Guid.Empty, result.TransactionId.Value);
        Assert.Equal(1, result.ServiceId);
        Assert.Equal(18.90m, result.Amount);
        Assert.Equal(31.10m, result.RemainingBalance);
        Assert.Equal(31.10m, wallet.GetBalance(1));
    }

    [Fact]
    public void Consume_Drying_DebitsExpectedAmount()
    {
        var (service, wallet) = CreateServices();

        var result = service.Consume(1, 2);

        Assert.Equal(ConsumptionStatus.Completed, result.Status);
        Assert.Equal(20.90m, result.Amount);
        Assert.Equal(29.10m, result.RemainingBalance);
        Assert.Equal(29.10m, wallet.GetBalance(1));
    }

    [Fact]
    public void Consume_WashingThenDrying_LeavesExpectedBalance()
    {
        var (service, wallet) = CreateServices();

        service.Consume(1, 1);
        var result = service.Consume(1, 2);

        Assert.Equal(ConsumptionStatus.Completed, result.Status);
        Assert.Equal(10.20m, result.RemainingBalance);
        Assert.Equal(10.20m, wallet.GetBalance(1));
    }

    [Fact]
    public void Consume_WithInsufficientBalance_DoesNotChangeWallet()
    {
        var (service, wallet) = CreateServices();
        service.Consume(1, 2);
        service.Consume(1, 2);

        var result = service.Consume(1, 2);

        Assert.Equal(ConsumptionStatus.InsufficientBalance, result.Status);
        Assert.Equal(8.20m, result.RemainingBalance);
        Assert.Equal(8.20m, wallet.GetBalance(1));
    }

    [Fact]
    public void Consume_WithUnknownAccount_DoesNotChangeWallet()
    {
        var (service, wallet) = CreateServices();

        var result = service.Consume(999, 1);

        Assert.Equal(ConsumptionStatus.AccountNotFound, result.Status);
        Assert.Equal(50.00m, wallet.GetBalance(1));
    }

    [Fact]
    public void Consume_WithUnknownService_DoesNotChangeWallet()
    {
        var (service, wallet) = CreateServices();

        var result = service.Consume(1, 999);

        Assert.Equal(ConsumptionStatus.ServiceNotFound, result.Status);
        Assert.Equal(50.00m, wallet.GetBalance(1));
    }

    [Fact]
    public void Consume_UsesPriceProvidedByCatalog()
    {
        var wallet = new WalletService();
        var catalog = new FixedPriceCatalog(7.25m);
        var service = new LaundryConsumptionService(wallet, catalog);

        var result = service.Consume(1, 1);

        Assert.Equal(ConsumptionStatus.Completed, result.Status);
        Assert.Equal(7.25m, result.Amount);
        Assert.Equal(42.75m, result.RemainingBalance);
    }

    private static (LaundryConsumptionService Service, WalletService Wallet) CreateServices()
    {
        var wallet = new WalletService();
        var catalog = new LaundryServiceCatalog();

        return (new LaundryConsumptionService(wallet, catalog), wallet);
    }

    private sealed class FixedPriceCatalog(decimal price) : ILaundryServiceCatalog
    {
        private readonly LaundryService _service = new(1, "Teste", price);

        public IReadOnlyList<LaundryService> GetAll() => [_service];

        public LaundryService? GetById(int id) => id == _service.Id ? _service : null;
    }
}
