using System.Net;
using System.Net.Http.Json;
using Cicclo.Api.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace Cicclo.Tests.Integration;

public sealed class WalletEndpointsTests
{
    [Fact]
    public async Task GetWallet_ForExistingAccount_ReturnsWallet()
    {
        await using var factory = new CiccloWebApplicationFactory();
        using var client = factory.CreateHttpsClient();

        var response = await client.GetAsync("/api/wallet/1");
        var wallet = await response.Content.ReadFromJsonAsync<WalletResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(wallet);
        Assert.Equal(1, wallet.AccountId);
        Assert.Equal(50.00m, wallet.Balance);
    }

    [Fact]
    public async Task GetWallet_ForUnknownAccount_ReturnsNotFound()
    {
        await using var factory = new CiccloWebApplicationFactory();
        using var client = factory.CreateHttpsClient();

        var response = await client.GetAsync("/api/wallet/999");
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("AccountNotFound", problem?.Title);
    }

    [Theory]
    [InlineData("0")]
    [InlineData("-1")]
    [InlineData("invalid")]
    public async Task GetWallet_WithInvalidAccountId_ReturnsBadRequest(string accountId)
    {
        await using var factory = new CiccloWebApplicationFactory();
        using var client = factory.CreateHttpsClient();

        var response = await client.GetAsync($"/api/wallet/{accountId}");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Theory]
    [InlineData("2")]
    public async Task GetWallet_WithNotFoundAccountId_ReturnsNotFound(string accountId)
    {
        await using var factory = new CiccloWebApplicationFactory();
        using var client = factory.CreateHttpsClient();

        var response = await client.GetAsync($"/api/wallet/{accountId}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
