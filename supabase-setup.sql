-- ============================================================
--  VITRINE — Setup do banco no Supabase
--  Cole tudo isto no SQL Editor do Supabase e clique em RUN.
-- ============================================================

-- ──────────────────────────────────────────────
-- 1) PERFIL DA LOJA (dados da sua amiga)
--    Guarda nome da loja, whatsapp e textos da vitrine.
-- ──────────────────────────────────────────────
create table if not exists public.loja (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users(id) on delete cascade,
  nome_loja    text not null default 'Minha Loja',
  whatsapp     text not null default '5562999999999', -- só números, com DDI 55
  descricao    text default 'Produtos selecionados com carinho.',
  cor_tema     text default '#b5651d',
  criado_em    timestamptz default now()
);

-- Cada usuária só pode ter um perfil de loja
create unique index if not exists loja_owner_unico on public.loja(owner_id);

-- ──────────────────────────────────────────────
-- 2) PRODUTOS
-- ──────────────────────────────────────────────
create table if not exists public.produtos (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  nome        text not null,
  descricao   text default '',
  preco       numeric(10,2) not null default 0,
  categoria   text default 'Geral',          -- Casa, Perfumes, Eletrônicos...
  imagem_url  text default '',
  estoque     int default 1,                  -- 0 = esgotado
  ativo       boolean default true,           -- false = oculto na vitrine
  destaque    boolean default false,
  criado_em   timestamptz default now()
);

create index if not exists produtos_owner_idx on public.produtos(owner_id);
create index if not exists produtos_categoria_idx on public.produtos(categoria);

-- ──────────────────────────────────────────────
-- 3) ROW LEVEL SECURITY
--    A VITRINE é pública (qualquer um lê produtos ativos).
--    Só a dona logada cria/edita/apaga os SEUS produtos.
-- ──────────────────────────────────────────────
alter table public.loja      enable row level security;
alter table public.produtos  enable row level security;

-- LOJA: qualquer um pode ler (pra vitrine mostrar nome/whatsapp)
drop policy if exists loja_leitura_publica on public.loja;
create policy loja_leitura_publica on public.loja
  for select using (true);

-- LOJA: só a dona mexe no próprio registro
drop policy if exists loja_dona_escreve on public.loja;
create policy loja_dona_escreve on public.loja
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- PRODUTOS: leitura pública apenas dos ativos
drop policy if exists produtos_leitura_publica on public.produtos;
create policy produtos_leitura_publica on public.produtos
  for select using (ativo = true);

-- PRODUTOS: a dona vê todos os seus (inclusive inativos)
drop policy if exists produtos_dona_le_tudo on public.produtos;
create policy produtos_dona_le_tudo on public.produtos
  for select using (auth.uid() = owner_id);

-- PRODUTOS: a dona insere/edita/apaga os seus
drop policy if exists produtos_dona_escreve on public.produtos;
create policy produtos_dona_escreve on public.produtos
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ──────────────────────────────────────────────
-- 4) STORAGE — bucket público pras fotos dos produtos
-- ──────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('produtos', 'produtos', true)
on conflict (id) do nothing;

-- Qualquer um pode VER as imagens (vitrine pública)
drop policy if exists storage_leitura_publica on storage.objects;
create policy storage_leitura_publica on storage.objects
  for select using (bucket_id = 'produtos');

-- Só usuários logados podem subir/alterar/apagar imagens
drop policy if exists storage_logado_escreve on storage.objects;
create policy storage_logado_escreve on storage.objects
  for insert with check (bucket_id = 'produtos' and auth.role() = 'authenticated');

drop policy if exists storage_logado_apaga on storage.objects;
create policy storage_logado_apaga on storage.objects
  for delete using (bucket_id = 'produtos' and auth.role() = 'authenticated');

-- ============================================================
--  PRONTO. Depois de rodar:
--  1. Crie a conta da sua amiga em Authentication > Users > Add user
--     (email + senha). Confirme o email manualmente ali mesmo.
--  2. Pegue o UUID dela e rode UMA VEZ o insert abaixo trocando os dados:
--
--  insert into public.loja (owner_id, nome_loja, whatsapp, descricao)
--  values ('UUID-DA-SUA-AMIGA', 'Loja da Fulana', '5562999999999', 'Texto da loja');
-- ============================================================
