using Cicclo.Api.DTOs;
using Cicclo.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Cicclo.Api.Controllers;

[ApiController]
[Route("api/services")]
public sealed class ServicesController(ILaundryServiceCatalog serviceCatalog) : ControllerBase
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
}
