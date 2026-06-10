# KPIs - Plano de Sprints

Este documento serve como referencia rapida para a evolucao do modulo de KPIs semanais do GTI.

## Sprint KPI 0 - Auditoria e Plano Tecnico

Status: concluida

Objetivo: entender o projeto atual antes de alterar.

Entregas:
- Rotas, layout, sidebar/mobile nav e padroes de services/hooks inspecionados.
- Migrations, RLS e modulo de OKRs revisados.
- Planilha `Indicadores Transportes.xlsx` inspecionada como fonte inicial de KPIs.
- Supabase MCP testado contra o projeto real.
- Plano tecnico e riscos documentados na conversa.

## Sprint KPI 1 - Banco, Migrations, Seeds e RLS

Status: concluida localmente

Objetivo: criar a base de dados do modulo.

Entregas:
- Criar tabelas `kpi_groups`, `kpis`, `kpi_assignments`, `kpi_weekly_values`, `kpi_action_plans`, `kpi_offenders`, `kpi_comments` e `kpi_activity_logs`.
- Criar indices recomendados.
- Criar helper SQL `can_edit_kpi(kpi_id uuid)`.
- Ativar RLS e criar policies para leitura, criacao, edicao e comentarios.
- Seedar grupo `Principal`.
- Seedar KPIs iniciais com base em `Indicadores Transportes.xlsx`.
- Atualizar tipos Supabase se a geracao estiver disponivel.

Observacao: a migration foi criada localmente. A aplicacao no Supabase remoto deve ser feita em uma etapa controlada, depois de revisao/validacao do SQL.

## Sprint KPI 2 - Services, Hooks e Helpers

Status: concluida

Objetivo: criar camada de dados e dominio.

Entregas:
- Services e hooks para KPIs, valores semanais, planos de acao e ofensores.
- Schemas Zod.
- Helpers de semana ISO.
- Helpers de avaliacao, formatacao, delta e tendencia.
- Testes unitarios dos helpers e payloads.

## Sprint KPI 3 - Pagina Principal e Tabela Semanal

Status: concluida

Objetivo: criar a aba de KPIs com tabela semanal.

Entregas:
- Rota `/kpis`.
- Entrada no menu.
- Header, tabs `Meus KPIs` e `Equipe`.
- Filtros basicos.
- Tabela agrupada por secao.
- Colunas semanais com semana atual destacada.
- Meta, tendencia, sparkline e estados visuais.
- Loading, empty e error states.

## Sprint KPI 4 - Edicao de Valores Semanais

Status: concluida

Objetivo: permitir lancamento semanal dos KPIs.

Entregas:
- Celula semanal editavel.
- Upsert em `kpi_weekly_values`.
- Snapshot de meta.
- Avaliacao automatica de status.
- Atualizacao otimista, rollback e toasts.
- Activity log.

## Sprint KPI 5 - Detalhe do KPI, Graficos e Historico

Status: pendente

Objetivo: criar visao detalhada do KPI.

Entregas:
- Drawer ou pagina de detalhe.
- Cabecalho do KPI.
- Grafico de historico semanal.
- Linha de meta.
- Resumo de variacao, melhor/pior semana e semanas fora da meta.
- Edicao basica e arquivamento por soft delete.

## Sprint KPI 6 - Plano de Acao e Ofensores

Status: pendente

Objetivo: implementar acompanhamento operacional.

Entregas:
- `KpiActionPlanSection`.
- Criar, editar e remover plano de acao.
- Campos Restricao, Acao, Prazo e Status.
- Contador de restricoes.
- CRUD simples de ofensores.
- Grafico de abertura/ofensores.

## Sprint KPI 7 - Visao de Equipe, Filtros Avancados e Polimento

Status: pendente

Objetivo: finalizar uso real do modulo.

Entregas:
- Filtros avancados.
- Visao da equipe.
- Filtro de KPIs fora da meta.
- Filtro de KPIs com plano aberto.
- Responsividade mobile.
- Realtime/invalidation.
- Documentacao curta de uso.

## Sprint KPI 8 - Testes, Hardening e Entrega

Status: concluida

Objetivo: garantir estabilidade.

Entregas:
- Testes unitarios, componentes e E2E basico.
- Revisao de RLS.
- Revisao de indices.
- Build final.
- Checklist de seguranca.

## Fonte Inicial de KPIs

Arquivo: `Indicadores Transportes.xlsx`

Tabela: `Indicadores`

Colunas:
- `Indicador`
- `Meta`
- `Produto`
- `Responsavel`
- `Observacoes`

Regra de escala:
- Percentuais na planilha usam escala decimal, como `0.96`.
- No modulo KPI, percentuais sao armazenados na escala visual, como `96.0`.
