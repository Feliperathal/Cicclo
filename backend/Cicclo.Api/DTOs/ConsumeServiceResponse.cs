namespace Cicclo.Api.DTOs;

public sealed record ConsumeServiceResponse(
    Guid TransactionId,
    int ServiceId,
    decimal Amount,
    decimal RemainingBalance,
    string Status);
