namespace Cicclo.Api.Models;

public sealed record LaundryConsumptionResult(
    ConsumptionStatus Status,
    Guid? TransactionId = null,
    int? ServiceId = null,
    decimal? Amount = null,
    decimal? RemainingBalance = null);
