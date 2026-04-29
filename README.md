# Dashboard de Gerenciamento de Ads - Lar Plásticos

Este projeto é uma plataforma de alta performance para monitoramento de investimentos (Google, Meta e Shopee Ads), integrando APIs do Ploomes e Shopee.

## 🧠 Engenharia por trás do Dashboard

Para garantir que o dashboard seja rápido e não "trave" as APIs externas, utilizamos duas tecnologias fundamentais:

### 1. TanStack Query (Gestão Inteligente de Dados)
O que você chamou de "Tense Care", o **TanStack Query** é o cérebro que gerencia as requisições. 
- **Cache Inteligente**: Quando você navega entre as abas ou clica em detalhes, ele não baixa os dados de novo se já os tiver. Ele usa o que está no cache primeiro e atualiza por trás, tornando a navegação instantânea.
- **Sincronização**: Ele garante que, se você tiver vários componentes precisando do mesmo dado, apenas uma chamada seja feita para o servidor.

### 2. p-limit (O Controle de Fluxo / "Peninit")
As APIs do Ploomes e Shopee têm limites de velocidade (rate limits). Se dispararmos 50 chamadas de uma vez, seríamos bloqueados. 
- Usamos o **p-limit** para criar uma "fila": definimos que apenas **2 requisições** podem ocorrer simultaneamente. 
- Isso garante que o dashboard carregue todos os dias do mês sem nunca tomar um erro de "Too Many Requests" do Ploomes.

## 📺 Monitoramento em Televisão (Real-time vs Reload)

### Como funciona hoje:
Atualmente, o sistema busca os dados no **carregamento da página**. Se uma nova venda cair no Ploomes daqui a 2 horas, o dashboard na TV continuará com os dados de 2 horas atrás até que a página seja recarregada.

### O "Cachêzinho" e a Atualização:
O sistema armazena os dados no estado do React (cache local). Ao dar reload, ele limpa esse cache e busca tudo do zero. 

### Recomendação para TV (Auto-Refresh):
Para transformar isso em um monitor de tempo real na TV, podemos configurar o **TanStack Query** com um `refetchInterval`. 
- **Futura Implementação**: Adicionar um timer (ex: 5 ou 10 minutos) para o sistema disparar a busca automaticamente em segundo plano. 
- **Vantagem**: A TV se manterá atualizada sem intervenção humana e sem o "pisca" branco de um reload de página inteira.

## 📡 Arquitetura de APIs
- **Ploomes Proxy**: O backend atua como um túnel. Ele recebe a requisição do React, adiciona a API Key secreta e o filtro de data (mensal ou diário) e entrega para o Ploomes.
- **Shopee Sync**: Um motor de busca que captura o "Saldo em Ads" e o "Gasto Real" diretamente da conta do parceiro, ignorando dados manuais quando a API está disponível.

---
*Este projeto foi estruturado para ser escalável e seguro, respeitando os limites das ferramentas de terceiros.*
