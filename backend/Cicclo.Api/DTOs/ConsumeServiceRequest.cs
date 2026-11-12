using System.ComponentModel.DataAnnotations;

namespace Cicclo.Api.DTOs;

public sealed record ConsumeServiceRequest(
    [Range(1, int.MaxValue)] int AccountId,
    [Range(1, int.MaxValue)] int ServiceId);
