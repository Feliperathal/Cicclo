# Desafio Técnico Cicclo

Estrutura inicial de uma aplicação Full Stack Mobile que simulará parte do funcionamento de uma lavanderia automatizada. Nesta etapa, somente a base do backend e dos testes está configurada; as regras de negócio, os endpoints e o aplicativo mobile ainda não foram implementados.

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

## Funcionalidades planejadas

As próximas etapas deverão permitir consultar o saldo de uma carteira digital, listar os serviços de lavagem e secagem e consumir um serviço usando o saldo disponível. Esses recursos ainda não estão implementados.

A carteira será armazenada em memória por um serviço Singleton, sem banco de dados. Consequentemente, seu estado será perdido sempre que a API for reiniciada.
