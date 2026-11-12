# Desafio Técnico Cicclo

Aplicação Full Stack Mobile que simula parte do funcionamento de uma lavanderia automatizada. O backend permite consultar a carteira e os serviços disponíveis, além de simular a cobrança e a execução de um serviço. O aplicativo mobile ainda não foi implementado.

## Tecnologias

- .NET 10
- ASP.NET Core Web API com Controllers
- OpenAPI
- C# com nullable reference types e implicit usings
- xUnit
- React Native 0.88.1
- Expo SDK 58
- React 19.3 e TypeScript 6

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
├── mobile/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   └── App.tsx
├── .gitignore
└── README.md
```

## Requisitos

- .NET SDK 10.0 ou superior compatível com `net10.0`.
- Node.js LTS 22.13 ou superior. O projeto foi validado com Node.js 26.13.0 LTS.
- npm, instalado junto com o Node.js.
- Expo Go em um dispositivo ou um emulador Android configurado.

## Executar o backend

Na raiz do repositório:

```powershell
dotnet restore backend/Cicclo.slnx
dotnet build backend/Cicclo.slnx --no-restore
dotnet test backend/Cicclo.slnx --no-build
dotnet run --project backend/Cicclo.Api
```

Pelos perfis atuais, a API utiliza `https://localhost:7219` e `http://localhost:5046`. Com o ambiente `Development`, o documento OpenAPI está disponível em:

```text
https://localhost:7219/openapi/v1.json
```

## Executar o aplicativo mobile

O backend deve permanecer em execução enquanto o aplicativo é utilizado.

1. Instale as dependências:

   ```powershell
   cd mobile
   npm install
   ```

2. Copie `.env.example` para `.env` e ajuste a URL:

   ```env
   EXPO_PUBLIC_API_URL=http://10.0.2.2:5046
   ```

3. Inicie o Expo:

   ```powershell
   npm start
   ```

4. Abra pelo Expo Go ou pressione `a` para utilizar um emulador Android disponível.

No emulador Android, use normalmente `http://10.0.2.2:5046`. Se a rede local ou o firewall bloquear esse caminho, é possível criar um túnel de desenvolvimento com ADB:

```powershell
adb reverse tcp:5046 tcp:5046
```

Nesse caso, configure temporariamente `EXPO_PUBLIC_API_URL=http://127.0.0.1:5046`. O túnel vale somente para o emulador/dispositivo conectado via ADB.

Comandos adicionais:

```powershell
npm run typecheck
npx expo install --check
npx expo-doctor
```

Não foi gerado APK nesta etapa.

## Endpoints

| Método | Rota | Sucesso | Erros possíveis |
|---|---|---|---|
| GET | `/api/wallet/{accountId}` | 200 | 400, 404 |
| GET | `/api/services` | 200 | — |
| POST | `/api/services/consume` | 200 | 400, 404, 409 |

### Consultar carteira

```http
GET /api/wallet/1
```

```json
{
  "accountId": 1,
  "balance": 50.00
}
```

### Listar serviços

```http
GET /api/services
```

```json
[
  {
    "id": 1,
    "name": "Lavagem",
    "price": 18.90
  },
  {
    "id": 2,
    "name": "Secagem",
    "price": 20.90
  }
]
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

- `400 Bad Request`: parâmetros, corpo ou JSON inválidos; retorna `ValidationProblemDetails` nativo do ASP.NET Core.
- `404 Not Found`: conta ou serviço inexistente; retorna `ProblemDetails`.
- `409 Conflict`: saldo insuficiente; retorna `ProblemDetails`.

Exemplo de saldo insuficiente:

```json
{
  "title": "InsufficientBalance",
  "status": 409,
  "detail": "Saldo insuficiente para consumir o serviço."
}
```

## Decisões técnicas

- `WalletService` é Singleton para conservar o saldo durante toda a execução da única instância da API.
- Não há banco de dados porque o desafio exige armazenamento efêmero em memória.
- A verificação e o débito usam a mesma seção crítica com um objeto `lock` privado. Assim, requisições simultâneas não conseguem debitar além do saldo disponível.
- Os preços pertencem exclusivamente ao catálogo do backend. O cliente envia apenas o identificador do serviço e não controla o valor cobrado.
- Os testes priorizam regras monetárias, rejeições sem alteração do saldo, contratos HTTP, isolamento da carteira e concorrência nos níveis de serviço e HTTP.
- O mobile usa `fetch`, estado nativo do React e uma única tela; não há necessidade de Axios, navegação ou biblioteca global de estado.
- O saldo retornado pelo backend é a fonte da verdade. O aplicativo nunca calcula o débito localmente.
- Uma trava síncrona com `useRef` impede POSTs duplicados enquanto um consumo está em andamento.

## Integração com React Native e Expo

- Emulador Android padrão: use `http://10.0.2.2:5046` para alcançar a porta HTTP do computador. Dentro do Android, `localhost` representa o próprio emulador, não o computador.
- Dispositivo físico ou Expo Go: use o IP local do computador, por exemplo `http://192.168.x.x:5046`, com ambos os dispositivos na mesma rede.
- Para aceitar conexões de um dispositivo físico, inicie explicitamente o backend na interface necessária durante o desenvolvimento, por exemplo:

  ```powershell
  dotnet run --project backend/Cicclo.Api --urls "http://0.0.0.0:5046"
  ```

- Não fixe o IP da máquina no backend. Configure a URL base no aplicativo mobile conforme o ambiente.
- O firewall deve permitir conexões de entrada na porta escolhida. Não exponha essa configuração diretamente à internet.
- Certificados HTTPS locais normalmente não são confiáveis em dispositivos e emuladores. Para HTTPS, instale e confie explicitamente em um certificado de desenvolvimento apropriado; nunca desative globalmente a validação de certificados.
- React Native nativo e Expo Go não dependem da política CORS do navegador. Por isso, CORS irrestrito não está habilitado. Caso uma versão web seja criada, configure apenas as origens web explícitas necessárias.

## Regras e limitações

- A única conta disponível possui identificador `1` e saldo inicial de R$ 50,00.
- Lavagem custa R$ 18,90 e secagem custa R$ 20,90.
- O débito ocorre somente quando o saldo é maior ou igual ao preço do serviço.
- A validação do saldo e o débito são atômicos, protegidos por `lock` dentro do serviço Singleton da carteira.
- Operações rejeitadas não alteram o saldo e o saldo nunca pode ficar negativo.
- O consumo representa apenas uma simulação de cobrança e execução do serviço; não existe integração com equipamentos físicos.
- Não há idempotência: requisições de consumo repetidas representam cobranças independentes.
- A carteira é armazenada em memória, sem banco de dados, e volta ao saldo inicial quando a API é reiniciada.
- Não há autenticação e apenas a conta de identificador `1` existe.
- Não existe persistência de transações; o identificador retornado representa somente o consumo atual.
- Em caso de perda da resposta do POST, o aplicativo atualiza a carteira, mas não repete automaticamente o consumo. Sem idempotência ou histórico, não é possível confirmar pelo mobile qual transação foi processada.
- O aplicativo exige acesso de rede ao backend e não possui modo offline.
