# Desafio Técnico Cicclo

Aplicação Full Stack Mobile que simula parte do funcionamento de uma lavanderia automatizada. O backend permite consultar a carteira e os serviços disponíveis, além de simular a cobrança e a execução de um serviço. O aplicativo Expo oferece uma tela única para consultar esses dados e solicitar consumos.

**APK Android (v1.0.0):** [acessar a release e baixar o instalador](https://github.com/Feliperathal/Cicclo/releases/tag/v1.0.0). O APK funciona sem Expo Go, mas precisa de acesso ao backend em execução.

## Funcionalidades implementadas

- Consulta do saldo da conta fixa de identificador `1`.
- Catálogo dinâmico dos serviços disponíveis.
- Consumo de Lavagem e Secagem com preço controlado pelo backend.
- Débito atômico e seguro para requisições concorrentes.
- Respostas padronizadas com `ProblemDetails` e `ValidationProblemDetails`.
- Aplicativo Android via Expo Go ou APK independente, com estados de carregamento, sucesso, erro, lista vazia e servidor indisponível.
- Proteção mobile contra envios duplicados e sincronização do saldo após consumo.
- Configuração dinâmica e persistente da URL da API, sem recompilar o APK ao mudar de rede.

## Tecnologias

- .NET 10
- ASP.NET Core Web API com Controllers
- OpenAPI
- C# com nullable reference types e implicit usings
- xUnit
- React Native 0.88.1
- Expo SDK 58
- React 19.3 e TypeScript 6
- AsyncStorage
- Vitest

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

## Arquitetura

- `Cicclo.Api/Controllers`: recebe parâmetros HTTP, chama os serviços e converte resultados em DTOs.
- `Cicclo.Api/DTOs`: define os contratos externos da API sem expor diretamente o domínio.
- `Cicclo.Api/Models`: representa carteira, serviços e resultados das operações.
- `Cicclo.Api/Services`: contém o catálogo, a carteira e a orquestração do consumo.
- `Cicclo.Tests`: reúne testes unitários, integração HTTP e concorrência.
- `mobile/src/services`: centraliza URL, requisições e conversão de erros HTTP.
- `mobile/src/components`: apresenta carteira e serviços sem conter regras de negócio.

A URL ativa segue a prioridade: valor salvo pelo usuário no AsyncStorage, `EXPO_PUBLIC_API_URL` como valor inicial opcional e, por último, nenhuma URL. Sem endereço disponível, o aplicativo abre automaticamente a configuração do servidor e não envia requisições.

`WalletService` é Singleton e mantém a carteira em memória durante a execução da API. Todas as leituras e o débito usam o mesmo objeto `lock` privado. A validação do saldo e sua alteração acontecem dentro de uma única seção crítica, impedindo saldo negativo em consumos simultâneos.

## Requisitos

### Backend

- .NET SDK 10.0 ou superior compatível com `net10.0` para executar a API com `dotnet run`.
- Computador acessível pela rede utilizada pelo dispositivo Android.

### Desenvolvimento mobile

- Node.js LTS 22.13 ou superior. O projeto foi validado com Node.js 26.13.1 LTS.
- npm, instalado junto com o Node.js.
- Expo Go ou emulador Android para desenvolvimento e depuração.

### Utilização do APK

- Dispositivo Android compatível e o APK instalado.
- Backend em execução e acessível pelo dispositivo.
- Expo Go e Node.js não são necessários no celular para executar o APK.

## Executar o backend

Na raiz do repositório, restaure, compile e execute os testes:

```powershell
dotnet restore backend/Cicclo.slnx
dotnet build backend/Cicclo.slnx --no-restore
dotnet test backend/Cicclo.slnx --no-build
```

**Execução recomendada para avaliar o APK em um dispositivo Android:**

```powershell
dotnet run --project backend/Cicclo.Api --urls "http://0.0.0.0:5046"
```

Esse comando permite conexões nas interfaces de rede do computador. Configure o firewall para permitir a porta TCP `5046` somente em redes confiáveis e informe o IP acessível do computador no aplicativo (não use `0.0.0.0` como endereço do servidor no celular). Para desenvolvimento exclusivamente no próprio computador, também é possível executar `dotnet run --project backend/Cicclo.Api` utilizando os perfis locais existentes.

Pelos perfis atuais, a API utiliza `https://localhost:7219` e `http://localhost:5046`. Com o ambiente `Development`, o documento OpenAPI está disponível em:

```text
https://localhost:7219/openapi/v1.json
```

### Testes do backend

```powershell
dotnet test backend/Cicclo.slnx
```

A suíte possui 41 testes que cobrem domínio, contratos HTTP, validação, preservação do saldo e concorrência nos níveis de serviço e API.

## Executar o aplicativo mobile

O backend deve permanecer em execução enquanto o aplicativo é utilizado.

1. Instale as dependências:

   ```powershell
   cd mobile
   npm install
   ```

2. Opcionalmente, copie `.env.example` para `.env` e defina a URL inicial:

   ```env
   EXPO_PUBLIC_API_URL=http://10.0.2.2:5046
   ```

   Para um dispositivo físico, use o IPv4 local do computador, que pode ser consultado com `ipconfig`:

   ```env
   EXPO_PUBLIC_API_URL=http://192.168.x.x:5046
   ```

   Nesse cenário, execute o backend com `--urls "http://0.0.0.0:5046"`. Não use `localhost`, `127.0.0.1` ou `10.0.2.2` no dispositivo físico. O endereço também pode ser informado ou alterado pelo ícone de engrenagem no aplicativo; o `.env` não é obrigatório para o APK.

3. Inicie o Expo:

   ```powershell
   npm start
   ```

4. Abra pelo Expo Go ou pressione `a` para utilizar um emulador Android disponível.

Depois de alterar o `.env`, reinicie o Expo para que a variável seja incorporada novamente ao bundle:

```powershell
npx expo start --clear
```

No emulador Android, use normalmente `http://10.0.2.2:5046`. Se a rede local ou o firewall bloquear esse caminho, é possível criar um túnel de desenvolvimento com ADB:

```powershell
adb reverse tcp:5046 tcp:5046
```

Nesse caso, configure temporariamente `EXPO_PUBLIC_API_URL=http://127.0.0.1:5046`. O túnel vale somente para o emulador/dispositivo conectado via ADB.

Comandos adicionais:

```powershell
npm run typecheck
npm test
npx expo install --check
npm run doctor
```

### Configuração do servidor no aplicativo

O ícone de engrenagem abre a configuração dinâmica. O endereço deve conter `http://` ou `https://`, host e porta válida quando utilizada, sem credenciais, query string, fragmento ou caminho `/api`. O botão **Testar conexão** consulta `/api/services` e valida o formato do catálogo antes de confirmar a conexão. **Salvar** não exige que o servidor esteja online e persiste o endereço no AsyncStorage.

Ao trocar de servidor, saldo, serviços e mensagens anteriores são descartados. Respostas pendentes do endereço anterior são ignoradas. A configuração não pode ser aberta durante um consumo em andamento.

### APK Android

**Download do APK:** [Cicclo v1.0.0 — GitHub Releases](https://github.com/Feliperathal/Cicclo/releases/tag/v1.0.0). Na seção **Assets** da release, baixe `Cicclo-1.0.0.apk`.

O arquivo gerado localmente fica em:

```text
mobile/dist/Cicclo-1.0.0.apk
```

O diretório `mobile/dist` é ignorado pelo Git, portanto o APK não acompanha o clone do repositório. Use a release para obtê-lo. O APK foi validado no emulador Android, possui assinatura APK v2 de desenvolvimento e é destinado à avaliação local, não à publicação na Play Store.

**SHA-256 do APK validado:**

```text
58FEBCDD6E5DDEA7CFE1C0431808C4B8B19221ED79920C27D16FA68F4F4B14BF
```

Para instalar com ADB, após baixar o arquivo, ajuste o caminho do APK no comando abaixo:

```powershell
adb install -r mobile/dist/Cicclo-1.0.0.apk
```

#### Instalação sem ADB

1. Acesse a [release v1.0.0](https://github.com/Feliperathal/Cicclo/releases/tag/v1.0.0) e baixe `Cicclo-1.0.0.apk` em **Assets**.
2. Transfira o arquivo para o dispositivo Android, caso o download tenha sido feito em outro equipamento.
3. Abra o APK no Android.
4. Autorize a instalação por essa fonte quando o sistema solicitar.
5. Conclua a instalação e abra o aplicativo Cicclo.

Os nomes das opções podem variar conforme a versão e o fabricante do Android. O APK utiliza assinatura de desenvolvimento e destina-se à avaliação local, não à publicação na Play Store.

#### Fluxo recomendado para avaliação

1. Clone o repositório no computador.
2. Descubra o IPv4 local com `ipconfig`.
3. Inicie o backend com `dotnet run --project backend/Cicclo.Api --urls "http://0.0.0.0:5046"`.
4. Permita conexões de entrada TCP na porta `5046` no firewall da rede privada, se necessário.
5. Baixe o APK pela [release v1.0.0](https://github.com/Feliperathal/Cicclo/releases/tag/v1.0.0), instale e abra o aplicativo.
6. Abra a engrenagem de configuração e informe `http://IP_DO_COMPUTADOR:5046`.
7. Use **Testar conexão** e depois **Salvar**.
8. Consulte a carteira e utilize os serviços.

O aplicativo não precisa ser recompilado quando esse endereço mudar. Celular e computador precisam ter conectividade IP entre si, mas não necessariamente estar na mesma rede Wi-Fi; redes roteadas, VPNs ou conexões equivalentes também podem funcionar quando a porta estiver acessível.

O Android permite tráfego HTTP nesse APK para demonstração em uma rede local confiável. A validação de certificados HTTPS permanece ativa.

## Validação da entrega

Validações executadas em 12 de novembro de 2026:

- backend restaurado e compilado sem erros ou warnings;
- 41 testes xUnit aprovados;
- TypeScript aprovado;
- 15 testes Vitest de URL, prioridade e equivalência da configuração aprovados;
- Expo Doctor com 20/20 verificações e dependências compatíveis;
- assinatura APK v2 verificada;
- APK instalado e aberto no emulador sem Expo Go ou Metro;
- configuração de `http://10.0.2.2:5046`, teste de conexão e persistência aprovados;
- Lavagem debitou R$ 18,90 e atualizou o saldo para R$ 31,10;
- Secagem debitou R$ 20,90 e atualizou o saldo para R$ 10,20;
- nova Secagem retornou saldo insuficiente e preservou R$ 10,20;
- configuração permaneceu salva após encerramento completo;
- salvar novamente a mesma URL preservou o saldo e o catálogo já carregados;
- backend indisponível apresentou erro compreensível sem encerrar o app, e os dados foram recuperados após reiniciar a API.

Os cenários visuais foram automatizados com ADB no emulador Android. A instalação manual por gerenciador de arquivos e a execução em diferentes fabricantes/versões reais do Android não foram repetidas nesta validação final.

O `npm audit` atualmente reporta três ocorrências moderadas do mesmo problema transitivo em `minimatch`, trazido por `@expo/fingerprint`/Expo. A correção automática com `--force` rebaixa o Expo para o SDK 52 e, por isso, não deve ser aplicada sem uma atualização compatível do ecossistema.

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
- Optou-se pelo armazenamento em memória utilizando um serviço Singleton, considerando o escopo reduzido, a existência de uma única conta e o prazo do desafio. Essa abordagem elimina a necessidade de infraestrutura adicional, mantendo as regras de negócio testáveis. Como limitação, os dados são perdidos ao reiniciar a API e não são compartilhados entre múltiplas instâncias.
- Não há autenticação porque o escopo define uma única conta fixa e não inclui cadastro ou identidade de usuários.
- A verificação e o débito usam a mesma seção crítica com um objeto `lock` privado. Assim, requisições simultâneas não conseguem debitar além do saldo disponível.
- Os preços pertencem exclusivamente ao catálogo do backend. O cliente envia apenas o identificador do serviço e não controla o valor cobrado.
- Os testes priorizam regras monetárias, rejeições sem alteração do saldo, contratos HTTP, isolamento da carteira e concorrência nos níveis de serviço e HTTP.
- O mobile usa `fetch`, estado nativo do React e uma única tela; não há necessidade de Axios, navegação ou biblioteca global de estado.
- O saldo retornado pelo backend é a fonte da verdade. O aplicativo nunca calcula o débito localmente.
- Uma trava síncrona com `useRef` impede POSTs duplicados enquanto um consumo está em andamento.
- A interface possui uma única tela porque todo o fluxo cabe no mesmo contexto e não exige navegação.

## Integração com React Native e Expo

- Emulador Android padrão: use `http://10.0.2.2:5046` para alcançar a porta HTTP do computador. Dentro do Android, `localhost` representa o próprio emulador, não o computador.
- Dispositivo físico ou Expo Go: use o IP local do computador, por exemplo `http://192.168.x.x:5046`, com ambos os dispositivos na mesma rede.
- Para aceitar conexões de um dispositivo físico, inicie explicitamente o backend na interface necessária durante o desenvolvimento, por exemplo:

  ```powershell
  dotnet run --project backend/Cicclo.Api --urls "http://0.0.0.0:5046"
  ```

- Não fixe o IP da máquina no backend. Configure a URL base no aplicativo mobile conforme o ambiente.
- O APK armazena a URL escolhida localmente no AsyncStorage e permite alterá-la pelo ícone de engrenagem.
- O firewall deve permitir conexões de entrada na porta escolhida. Não exponha essa configuração diretamente à internet.
- Certificados HTTPS locais normalmente não são confiáveis em dispositivos e emuladores. Para HTTPS, instale e confie explicitamente em um certificado de desenvolvimento apropriado; nunca desative globalmente a validação de certificados.
- React Native nativo e Expo Go não dependem da política CORS do navegador. Por isso, CORS irrestrito não está habilitado. Caso uma versão web seja criada, configure apenas as origens web explícitas necessárias.

## Regras e limitações conhecidas

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

## Uso de Inteligência Artificial

Ferramentas de inteligência artificial foram utilizadas como apoio ao desenvolvimento para:

- planejar e organizar as etapas incrementais;
- sugerir implementações e estruturas de código;
- revisar regras de negócio e contratos HTTP;
- elaborar e ampliar testes unitários, HTTP e de concorrência;
- apoiar a documentação e as instruções de execução;
- auxiliar a investigação de erros observados durante build, testes e validação no emulador.

As decisões técnicas, o código entregue e os resultados das validações foram revisados pelo responsável pelo projeto.

## Melhorias futuras

Possibilidades fora do escopo desta entrega:

- persistência de saldo, consumos e transações;
- autenticação e suporte a múltiplas contas;
- idempotência para operações de consumo;
- histórico de consumos no aplicativo;
- integração com equipamentos físicos da lavanderia;
- testes end-to-end automatizados no aplicativo mobile.
