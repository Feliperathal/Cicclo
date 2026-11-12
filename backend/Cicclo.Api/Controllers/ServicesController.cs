using Cicclo.Api.DTOs;
using Cicclo.Api.Models;
using Cicclo.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Cicclo.Api.Controllers;

[ApiController]
[Route("api/services")]
public sealed class ServicesController(
    ILaundryServiceCatalog serviceCatalog,
    ILaundryConsumptionService consumptionService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<LaundryServiceResponse>>(StatusCodes.Status200OK)]
    public ActionResult<IReadOnlyList<LaundryServiceResponse>> GetAll()
    {
        var services = serviceCatalog.GetAll()
            .Select(service => new LaundryServiceResponse(service.Id, service.Name, service.Price))
            .ToArray();

        return Ok(services);
    }

    [HttpPost("consume")]
    [ProducesResponseType<ConsumeServiceResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public ActionResult<ConsumeServiceResponse> Consume([FromBody] ConsumeServiceRequest request)
    {
        var result = consumptionService.Consume(request.AccountId, request.ServiceId);

        return result.Status switch
        {
            ConsumptionStatus.Completed => Ok(new ConsumeServiceResponse(
                result.TransactionId!.Value,
                result.ServiceId!.Value,
                result.Amount!.Value,
                result.RemainingBalance!.Value,
                "Completed")),

            ConsumptionStatus.AccountNotFound => Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "AccountNotFound",
                detail: "Conta não encontrada."),

            ConsumptionStatus.ServiceNotFound => Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "ServiceNotFound",
                detail: "Serviço não encontrado."),

            ConsumptionStatus.InsufficientBalance => Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "InsufficientBalance",
                detail: "Saldo insuficiente para consumir o serviço."),
            _ => throw new InvalidOperationException("Unknown consumption status.")
        };
    }
}
