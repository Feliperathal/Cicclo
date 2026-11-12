using System.Net;
using System.Net.Http.Json;
using System.Text;
using Cicclo.Api.DTOs;
using Microsoft.AspNetCore.Mvc;

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
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("AccountNotFound", problem?.Title);
    }

    [Fact]
    public async Task Consume_UnknownService_ReturnsNotFound()
    {
        await using var factory = new CiccloWebApplicationFactory();
        using var client = factory.CreateHttpsClient();

        var response = await client.PostAsJsonAsync(
            "/api/services/consume",
            new ConsumeServiceRequest(1, 999));
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("ServiceNotFound", problem?.Title);
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
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        var wallet = await client.GetFromJsonAsync<WalletResponse>("/api/wallet/1");

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("InsufficientBalance", problem?.Title);
        Assert.Equal("Saldo insuficiente para consumir o serviço.", problem?.Detail);
        Assert.NotNull(wallet);
        Assert.Equal(8.20m, wallet.Balance);
    }

    [Theory]
    [InlineData(0, 1)]
    [InlineData(-1, 1)]
    [InlineData(1, 0)]
    [InlineData(1, -1)]
    public async Task Consume_InvalidRequest_ReturnsBadRequest(int accountId, int serviceId)
    {
        await using var factory = new CiccloWebApplicationFactory();
        using var client = factory.CreateHttpsClient();

        var response = await client.PostAsJsonAsync(
            "/api/services/consume",
            new ConsumeServiceRequest(accountId, serviceId));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Theory]
    [InlineData("{")]
    [InlineData("{\"accountId\":\"invalid\",\"serviceId\":1}")]
    [InlineData("null")]
    [InlineData("{}")]
    public async Task Consume_WithStructurallyInvalidJson_ReturnsBadRequest(string json)
    {
        await using var factory = new CiccloWebApplicationFactory();
        using var client = factory.CreateHttpsClient();
        using var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await client.PostAsync("/api/services/consume", content);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Consume_WithoutBody_ReturnsBadRequest()
    {
        await using var factory = new CiccloWebApplicationFactory();
        using var client = factory.CreateHttpsClient();
        using var content = new StringContent(string.Empty, Encoding.UTF8, "application/json");

        var response = await client.PostAsync("/api/services/consume", content);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Consume_Concurrently_AllowsOnlyAffordableRequests()
    {
        await using var factory = new CiccloWebApplicationFactory();
        using var client = factory.CreateHttpsClient();

        var attempts = Enumerable.Range(0, 10)
            .Select(_ => client.PostAsJsonAsync(
                "/api/services/consume",
                new ConsumeServiceRequest(1, 2)));
        var responses = await Task.WhenAll(attempts);
        var wallet = await client.GetFromJsonAsync<WalletResponse>("/api/wallet/1");

        Assert.Equal(2, responses.Count(response => response.StatusCode == HttpStatusCode.OK));
        Assert.Equal(8, responses.Count(response => response.StatusCode == HttpStatusCode.Conflict));
        Assert.NotNull(wallet);
        Assert.Equal(8.20m, wallet.Balance);

        foreach (var response in responses)
        {
            response.Dispose();
        }
    }
}
