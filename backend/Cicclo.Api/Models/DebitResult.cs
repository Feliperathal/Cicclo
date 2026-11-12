namespace Cicclo.Api.Models;

public sealed record DebitResult(DebitStatus Status, decimal? RemainingBalance);
