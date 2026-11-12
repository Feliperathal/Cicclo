using Cicclo.Api.Models;

namespace Cicclo.Api.Services;

public sealed class LaundryConsumptionService(
    IWalletService walletService,
    ILaundryServiceCatalog serviceCatalog) : ILaundryConsumptionService
{
    public LaundryConsumptionResult Consume(int accountId, int serviceId)
    {
        if (!walletService.AccountExists(accountId))
        {
            return new LaundryConsumptionResult(ConsumptionStatus.AccountNotFound);
        }

        var laundryService = serviceCatalog.GetById(serviceId);

        if (laundryService is null)
        {
            return new LaundryConsumptionResult(ConsumptionStatus.ServiceNotFound);
        }

        var debitResult = walletService.TryDebit(accountId, laundryService.Price);
        return debitResult.Status switch
        {
            DebitStatus.Completed => new LaundryConsumptionResult(
                ConsumptionStatus.Completed,
                Guid.NewGuid(),
                laundryService.Id,
                laundryService.Price,
                debitResult.RemainingBalance),

            DebitStatus.AccountNotFound => new LaundryConsumptionResult(ConsumptionStatus.AccountNotFound),

            DebitStatus.InsufficientBalance => new LaundryConsumptionResult(
                ConsumptionStatus.InsufficientBalance,
                RemainingBalance: debitResult.RemainingBalance),

            DebitStatus.InvalidAmount => throw new InvalidOperationException(
                "The configured laundry service price must be greater than zero."),
            _ => throw new InvalidOperationException("Unknown debit status.")
        };
    }
}
