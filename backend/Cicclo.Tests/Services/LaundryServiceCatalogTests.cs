using Cicclo.Api.Services;

namespace Cicclo.Tests.Services;

public sealed class LaundryServiceCatalogTests
{
    [Fact]
    public void GetAll_ReturnsConfiguredServicesWithCorrectPrices()
    {
        var catalog = new LaundryServiceCatalog();

        var services = catalog.GetAll();

        Assert.Collection(
            services,
            service =>
            {
                Assert.Equal(1, service.Id);
                Assert.Equal("Lavagem", service.Name);
                Assert.Equal(18.90m, service.Price);
            },
            service =>
            {
                Assert.Equal(2, service.Id);
                Assert.Equal("Secagem", service.Name);
                Assert.Equal(20.90m, service.Price);
            });
    }

    [Theory]
    [InlineData(1, "Lavagem", 18.90)]
    [InlineData(2, "Secagem", 20.90)]
    public void GetById_ReturnsExpectedService(int id, string expectedName, decimal expectedPrice)
    {
        var catalog = new LaundryServiceCatalog();

        var service = catalog.GetById(id);

        Assert.NotNull(service);
        Assert.Equal(expectedName, service.Name);
        Assert.Equal(expectedPrice, service.Price);
    }

    [Fact]
    public void GetById_ReturnsNullForUnknownService()
    {
        var catalog = new LaundryServiceCatalog();

        var service = catalog.GetById(999);

        Assert.Null(service);
    }
}
