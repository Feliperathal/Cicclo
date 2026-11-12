using Cicclo.Api.Models;

namespace Cicclo.Api.Services;

public interface ILaundryConsumptionService
{
    LaundryConsumptionResult Consume(int accountId, int serviceId);
}
