using Cicclo.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddSingleton<IWalletService, WalletService>();
builder.Services.AddSingleton<ILaundryServiceCatalog, LaundryServiceCatalog>();
builder.Services.AddScoped<ILaundryConsumptionService, LaundryConsumptionService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.MapControllers();

app.Run();

public partial class Program;
