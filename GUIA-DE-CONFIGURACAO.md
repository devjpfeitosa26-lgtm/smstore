# 🛍️ Vitrine — Guia de Configuração Completo

Sistema de catálogo de produtos com painel para a lojista, compra via WhatsApp
e bot com IA (Gemini) — tudo em **plano gratuito**.

> Mesma stack do UaiBarber: GitHub + hospedagem estática + Supabase + Typebot.
> A única troca é a IA: **Gemini** (free tier generoso) no lugar da OpenAI (paga).

---

## 📁 Arquivos do projeto

| Arquivo | O que é |
|---|---|
| `index.html` + `vitrine.js` | **Vitrine pública** (o que o cliente vê) |
| `login.html` | Login da sua amiga |
| `painel.html` + `painel.js` | **Painel** dela (cadastrar/editar/apagar produtos) |
| `config.js` | **Onde você cola as 2 chaves do Supabase** |
| `supabase-setup.sql` | Script que cria o banco (rodar 1x) |
| `manifest.json`, `sw.js`, ícones | PWA (instalável no celular) |

---

## PASSO 1 — Criar o projeto no Supabase (grátis)

1. Acesse **supabase.com** → crie conta → **New Project**.
2. Dê um nome, escolha uma senha do banco e a região mais próxima (East US serve).
3. Abra **SQL Editor** (menu lateral) → **New query**.
4. Cole **todo** o conteúdo de `supabase-setup.sql` e clique em **RUN**.
   - Isso cria as tabelas `loja` e `produtos`, as regras de segurança (RLS)
     e o bucket de imagens.

### Criar a conta da sua amiga
5. Vá em **Authentication → Users → Add user**.
6. Preencha o e-mail e senha dela e marque **Auto Confirm User** (confirma na hora).
7. Copie o **UUID** que aparece na lista de usuários.
8. Volte no **SQL Editor** e rode (trocando os dados):

```sql
insert into public.loja (owner_id, nome_loja, whatsapp, descricao)
values ('UUID-DA-SUA-AMIGA', 'Loja da Fulana', '5562999999999', 'Produtos selecionados com carinho.');
```
> O `whatsapp` é só números: **55** (Brasil) + **DDD** + número. Ex.: `5562999998888`.
> Ela também consegue editar isso depois pelo painel, então pode deixar provisório.

### Pegar as 2 chaves
9. Vá em **Project Settings → API**. Copie:
   - **Project URL** (algo como `https://xxxx.supabase.co`)
   - **anon public key** (a chave longa marcada como `anon` / `public`)

10. Abra `config.js` e cole nos campos:

```js
window.VITRINE_CONFIG = {
  SUPABASE_URL:  'https://xxxx.supabase.co',
  SUPABASE_ANON: 'cole-a-anon-key-aqui'
};
```
> ⚠️ A `anon key` PODE ser pública (é feita pra isso). **Nunca** use a `service_role` no site.

---

## PASSO 2 — Subir no GitHub + Hospedar (grátis)

### Opção A — GitHub Pages (mais simples, 100% grátis)
1. Crie um repositório novo no GitHub.
2. Suba **todos os arquivos** desta pasta (arraste pra dentro do repositório no site).
3. No repositório: **Settings → Pages → Source: Deploy from a branch →
   Branch: main / root → Save**.
4. Em 1-2 minutos o site fica no ar em `https://seu-usuario.github.io/nome-repo/`.

### Opção B — Vercel / Netlify / Cloudflare Pages (grátis também)
- Conecte o repositório do GitHub, sem configuração de build (é site estático).
- Dá domínio grátis e deploy automático a cada push.

> Qualquer uma das duas funciona. GitHub Pages é o caminho mais econômico e direto.

---

## PASSO 3 — O Bot com IA (Typebot + Gemini)

A ideia: uma **bolha de chat** no canto da vitrine. O cliente tira dúvidas com a IA,
e quando quer comprar, o bot **redireciona pro WhatsApp da sua amiga**.

### 3.1 — Pegar a chave do Gemini (grátis)
1. Acesse **aistudio.google.com** (Google AI Studio) → **Get API key**.
2. Crie uma API key e copie. O free tier do Gemini cobre tranquilo um bot de loja.

### 3.2 — Montar o fluxo no Typebot
1. Crie conta em **typebot.io** → **Create a typebot**.
2. Monte um fluxo simples assim:

```
[Mensagem de boas-vindas]
   "Oi! Posso tirar dúvidas sobre os produtos. O que você procura?"
        ↓
[Input de texto]  → salva na variável  {{pergunta}}
        ↓
[Bloco HTTP Request → API do Gemini]   (ver 3.3)
        ↓
[Mensagem]  exibe a resposta da IA  {{resposta}}
        ↓
[Botões]  "Tirar outra dúvida"  |  "Quero comprar 🛒"
        ↓ (se "Quero comprar")
[Redirect]  →  https://wa.me/5562999998888?text=Olá!%20Quero%20comprar
```

### 3.3 — Bloco HTTP Request chamando o Gemini
No bloco **HTTP request** do Typebot:

- **Método:** `POST`
- **URL:**
  ```
  https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=SUA_CHAVE_GEMINI
  ```
  > Use `gemini-2.5-flash` (rápido e gratuito). Se o nome do modelo mudar,
  > confira os modelos disponíveis no Google AI Studio.
- **Headers:** `Content-Type: application/json`
- **Body (JSON):**
  ```json
  {
    "system_instruction": {
      "parts": [{ "text": "Você é a atendente virtual da loja da Fulana. Seja simpática e objetiva. Tire dúvidas sobre perfumes, produtos para casa e eletrônicos (notebooks, SSDs, memórias). Nunca feche a venda no chat: quando o cliente quiser comprar, oriente a clicar no botão Quero comprar para falar no WhatsApp." }]
    },
    "contents": [
      { "parts": [{ "text": "{{pergunta}}" }] }
    ]
  }
  ```
- **Salvar resposta em variável:** mapeie o caminho
  `candidates.0.content.parts.0.text` → variável `{{resposta}}`.
  (No Typebot, em "Save in variable", use o seletor para apontar esse campo.)

> 💡 **Alternativa mais fácil:** o Typebot tem um **bloco OpenAI nativo**
> (plug-and-play). Se preferir não mexer em JSON, use OpenAI — mas ela é paga.
> Como o pedido é gastar o mínimo, o caminho do Gemini via HTTP acima é o gratuito.

### 3.4 — Colocar o bot no site
1. No Typebot: **Share → Embed → Bubble**. Copie o **ID público** do typebot
   (aparece na URL/embed, algo como `minha-loja-abc123`).
2. Abra `index.html`, ache este trecho e troque `SEU-FLUXO-TYPEBOT`:

```js
Typebot.initBubble({
  typebot: "SEU-FLUXO-TYPEBOT",   // ← cole o ID aqui
  ...
})
```

---

## PASSO 4 — Como sua amiga usa o painel

1. Ela acessa `.../login.html` e entra com e-mail e senha.
2. Aba **Produtos**: botão **+ Novo produto** → preenche nome, preço, categoria,
   estoque, descrição e **sobe a foto** (vai direto pro Supabase Storage).
3. Pode marcar **Visível na vitrine** (oculta sem apagar) e **Destaque**.
4. Pode **editar** ✏️ ou **apagar** 🗑️ qualquer produto.
5. Aba **Dados da loja**: muda o nome da loja, o **WhatsApp** e a frase da vitrine.

Tudo que ela salvar aparece **na hora** na vitrine pública (é o mesmo banco).

---

## 🔄 Como funciona a compra (resumo do fluxo)

```
Cliente abre a vitrine
   ├─ navega/filtra/busca produtos
   ├─ (opcional) conversa com o bot/IA pra tirar dúvidas
   └─ clica "🛒 Comprar pelo WhatsApp"
          ↓
   Abre o WhatsApp da sua amiga com a mensagem já pronta
   (nome do produto + preço + pergunta se está disponível)
          ↓
   A venda é fechada por ela, direto no WhatsApp.
```

Nenhum dado de pagamento passa pelo site — ele é uma **vitrine + atendimento**,
exatamente como você pediu. Simples, barato e seguro.

---

## ✅ Checklist rápido

- [ ] Rodei o `supabase-setup.sql`
- [ ] Criei a conta da minha amiga e inseri a loja com o WhatsApp dela
- [ ] Colei `SUPABASE_URL` e `SUPABASE_ANON` no `config.js`
- [ ] Subi tudo no GitHub e ativei a hospedagem
- [ ] Criei o fluxo no Typebot com o Gemini e colei o ID no `index.html`
- [ ] Testei: cadastrar produto no painel → aparece na vitrine → botão abre o WhatsApp
```
