using System.Net;
using System.Net.Http.Json;
using Cicclo.Api.DTOs;

namespace Cicclo.Tests.Integration;

public sealed class ConsumeServiceEndpointsTests
{
    [Fact]
    public async Task Consume_ValidRequest_ReturnsTransactionAndUpdatesWallet()
    {
        await using var factory = new CiccloWebApplicationFactory();
        using var client = factory.CreateHttpsClient();

        var response = await client.PostAsJsonAsync(
            "/api/services/consume",
            new ConsumeServiceRequest(1, 1));
        var consumption = await response.Content.ReadFromJsonAsync<ConsumeServiceResponse>();
        var wallet = await client.GetFromJsonAsync<WalletResponse>("/api/wallet/1");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(consumption);
        Assert.NotEqual(Guid.Empty, consumption.TransactionId);
        Assert.Equal(1, consumption.ServiceId);
        Assert.Equal(18.90m, consumption.Amount);
        Assert.Equal(31.10m, consumption.RemainingBalance);
        Assert.Equal("Completed", consumption.Status);
        Assert.NotNull(wallet);
        Assert.Equal(31.10m, wallet.Balance);
    }

    [Fact]
    public async Task Consume_UnknownAccount_ReturnsNotFound()
    {
        await using var factory = new CiccloWebApplicationFactory();
        using var client = factory.CreateHttpsClient();

        var response = await client.PostAsJsonAsync(
            "/api/services/consume",
            new ConsumeServiceRequest(999, 1));
        var error = await response.Content.ReadFromJsonAsync<ErrorResponse>();

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("AccountNotFound", error?.Error);
    }

    [Fact]
    public async Task Consume_UnknownService_ReturnsNotFound()
    {
        await using var factory = new CiccloWebApplicationFactory();
        using var client = factory.CreateHttpsClient();

        var response = await client.PostAsJsonAsync(
            "/api/services/consume",
            new ConsumeServiceRequest(1, 999));
        var error = await response.Content.ReadFromJsonAsync<ErrorResponse>();

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("ServiceNotFound", error?.Error);
    }

    [Fact]
    public async Task Consume_WithInsufficientBalance_ReturnsConflictWithoutChangingBalance()
    {
        await using var factory = new CiccloWebApplicationFactory();
        using var client = factory.CreateHttpsClient();
        var request = new ConsumeServiceRequest(1, 2);
        await client.PostAsJsonAsync("/api/services/consume", request);
        await client.PostAsJsonAsync("/api/services/consume", request);

        var response = await client.PostAsJsonAsync("/api/services/consume", request);
        var error = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        var wallet = await client.GetFromJsonAsync<WalletResponse>("/api/wallet/1");

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("InsufficientBalance", error?.Error);
        Assert.Equal("Saldo insuficiente para consumir o serviço.", error?.Message);
        Assert.NotNull(wallet);
        Assert.Equal(8.20m, wallet.Balance);
    }

    [Theory]
    [InlineData(0, 1)]
    [InlineData(1, 0)]
    public async Task Consume_InvalidRequest_ReturnsBadRequest(int accountId, int serviceId)
    {
        await using var factory = new CiccloWebApplicationFactory();
        using var client = factory.CreateHttpsClient();

        var response = await client.PostAsJsonAsync(
            "/api/services/consume",
            new ConsumeServiceRequest(accountId, serviceId));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
