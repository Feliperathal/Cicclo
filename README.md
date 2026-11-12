# Desafio Técnico Cicclo

Aplicação Full Stack Mobile que simula parte do funcionamento de uma lavanderia automatizada. O backend permite consultar a carteira e os serviços disponíveis, além de simular a cobrança e a execução de um serviço. O aplicativo mobile ainda não foi implementado.

## Tecnologias

- .NET 10
- ASP.NET Core Web API com Controllers
- OpenAPI
- C# com nullable reference types e implicit usings
- xUnit
- React Native com Expo e TypeScript (planejado para uma etapa posterior)

## Estrutura do repositório

```text
Cicclo/
├── backend/
│   ├── Cicclo.slnx
│   ├── Cicclo.Api/
│   │   ├── Controllers/
│   │   ├── DTOs/
│   │   ├── Models/
│   │   ├── Services/
│   │   └── Program.cs
│   └── Cicclo.Tests/
├── .gitignore
└── README.md
```

O diretório `mobile/` será criado quando o aplicativo React Native for iniciado.

## Requisitos

- .NET SDK 10.0 ou superior compatível com `net10.0`.

## Executar o backend

Na raiz do repositório:

```powershell
dotnet restore backend/Cicclo.slnx
dotnet build backend/Cicclo.slnx --no-restore
dotnet test backend/Cicclo.slnx --no-build
dotnet run --project backend/Cicclo.Api
```

Com o ambiente `Development`, o documento OpenAPI estará disponível em `/openapi/v1.json`.

## Endpoints

### Consultar carteira

```http
GET /api/wallet/1
```

### Listar serviços

```http
GET /api/services
```

### Consumir serviço

```http
POST /api/services/consume
Content-Type: application/json

{
  "accountId": 1,
  "serviceId": 1
}
```

Exemplo de resposta `200 OK`:

```json
{
  "transactionId": "d4ee0f33-071c-499e-bc32-f246e166b541",
  "serviceId": 1,
  "amount": 18.90,
  "remainingBalance": 31.10,
  "status": "Completed"
}
```

Possíveis respostas de erro:

- `400 Bad Request`: corpo da requisição inválido.
- `404 Not Found`: conta ou serviço inexistente.
- `409 Conflict`: saldo insuficiente.

Os erros de negócio retornam os campos `error` e `message`.

## Regras e limitações

- A única conta disponível possui identificador `1` e saldo inicial de R$ 50,00.
- Lavagem custa R$ 18,90 e secagem custa R$ 20,90.
- O débito ocorre somente quando o saldo é maior ou igual ao preço do serviço.
- A validação do saldo e o débito são atômicos, protegidos por `lock` dentro do serviço Singleton da carteira.
- Operações rejeitadas não alteram o saldo e o saldo nunca pode ficar negativo.
- O consumo representa apenas uma simulação de cobrança e execução do serviço; não existe integração com equipamentos físicos.
- Não há idempotência: requisições de consumo repetidas representam cobranças independentes.
- A carteira é armazenada em memória, sem banco de dados, e volta ao saldo inicial quando a API é reiniciada.
