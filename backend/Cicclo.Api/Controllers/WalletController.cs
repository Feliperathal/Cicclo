using System.ComponentModel.DataAnnotations;
using Cicclo.Api.DTOs;
using Cicclo.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Cicclo.Api.Controllers;

[ApiController]
[Route("api/wallet")]
public sealed class WalletController(IWalletService walletService) : ControllerBase
{
    [HttpGet("{accountId}")]
    [ProducesResponseType<WalletResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public ActionResult<WalletResponse> GetByAccountId(
        [FromRoute, Range(1, int.MaxValue)] int accountId)
    {
        var wallet = walletService.GetWallet(accountId);

        if (wallet is null)
        {
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "AccountNotFound",
                detail: "Conta não encontrada.");
        }

        return Ok(new WalletResponse(wallet.AccountId, wallet.Balance));
    }
}
