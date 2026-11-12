using Cicclo.Api.Models;

namespace Cicclo.Api.Services;

public sealed class LaundryServiceCatalog : ILaundryServiceCatalog
{
    private static readonly IReadOnlyList<LaundryService> Services = Array.AsReadOnly(
    [
        new LaundryService(1, "Lavagem", 18.90m),
        new LaundryService(2, "Secagem", 20.90m)
    ]);

    public IReadOnlyList<LaundryService> GetAll() => Services;

    public LaundryService? GetById(int id) => Services.FirstOrDefault(service => service.Id == id);
}
