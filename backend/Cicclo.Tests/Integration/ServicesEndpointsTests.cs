using System.Net;
using System.Net.Http.Json;
using Cicclo.Api.DTOs;
using Cicclo.Api.Models;
using Cicclo.Api.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Cicclo.Tests.Integration;

public sealed class ServicesEndpointsTests
{
    [Fact]
    public async Task GetServices_ReturnsConfiguredServices()
    {
        await using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/services");
        var services = await response.Content.ReadFromJsonAsync<LaundryServiceResponse[]>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(services);
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

    [Fact]
    public async Task GetServices_WhenCatalogIsEmpty_ReturnsEmptyCollection()
    {
        await using var factory = new EmptyCatalogApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/services");
        var services = await response.Content.ReadFromJsonAsync<LaundryServiceResponse[]>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(services);
        Assert.Empty(services);
    }

    private sealed class EmptyCatalogApplicationFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.ConfigureTestServices(services =>
            {
                services.RemoveAll<ILaundryServiceCatalog>();
                services.AddSingleton<ILaundryServiceCatalog, EmptyLaundryServiceCatalog>();
            });
        }
    }

    private sealed class EmptyLaundryServiceCatalog : ILaundryServiceCatalog
    {
        public IReadOnlyList<LaundryService> GetAll() => Array.Empty<LaundryService>();

        public LaundryService? GetById(int id) => null;
    }
}
