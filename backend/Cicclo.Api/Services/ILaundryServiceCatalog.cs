using Cicclo.Api.Models;

namespace Cicclo.Api.Services;

public interface ILaundryServiceCatalog
{
    IReadOnlyList<LaundryService> GetAll();

    LaundryService? GetById(int id);
}
