using Cicclo.Api.Models;

namespace Cicclo.Api.Services;

public interface IWalletService
{
    Wallet? GetWallet(int accountId);

    decimal? GetBalance(int accountId);

    bool AccountExists(int accountId);
}
