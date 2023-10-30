# Beat-em-up

Bem-vindo ao Beat-em-up, a aplicação Next que vai transformar suas sessões de música em experiências incríveis! 🎶

## Descrição

O Beat-em-up é uma aplicação desenvolvida com Next.js, projetada para elevar sua experiência musical. Seja você um músico profissional, um entusiasta ou apenas alguém que ama uma boa batida, o Beat-em-up é a ferramenta perfeita para você.

## Funcionalidades Principais

1. **Exploração Musical:** Descubra novas músicas e artistas enquanto navega por uma interface intuitiva e amigável.

2. **Compatibilidade com Dispositivos Móveis:** Leve a festa com você! O Beat-em-up é totalmente responsivo, garantindo uma experiência consistente em todos os dispositivos.

## Como Iniciar

1. **Instalação de Dependências:**
   ```bash
   npm install
   # ou
   yarn install
   ```

2. **Inicie o Servidor de Desenvolvimento:**
   ```bash
   npm run dev
   # ou
   yarn dev
   ```

3. **Acesse no Navegador:**
   Abra seu navegador e visite [http://localhost:3000](http://localhost:3000) para experimentar o Beat-em-up.

---

4. **Como criar esse banco de dados no Supabase:**

```markdown
# Guia de Configuração do Banco de Dados no Supabase

Este guia fornece instruções passo a passo para configurar o banco de dados no Supabase, incluindo tabelas, políticas de segurança e gatilhos necessários para o seu aplicativo. Certifique-se de seguir cada etapa cuidadosamente para garantir o funcionamento correto do seu sistema.

## Tabela de Usuários (users)

Esta tabela contém os dados do usuário e é configurada para permitir que os usuários visualizem e atualizem apenas seus próprios dados. 

```sql
create table users (
  id uuid references auth.users not null primary key,
  full_name text,
  avatar_url text,
  billing_address jsonb,
  payment_method jsonb
);

alter table users
  enable row level security;

create policy "Can view own user data." on users
  for select using (auth.uid() = id);

create policy "Can update own user data." on users
  for update using (auth.uid() = id);
```

Além disso, um gatilho é configurado para criar automaticamente uma entrada de usuário quando um novo usuário se cadastra via Supabase Auth.

```sql
create function public.handle_new_user()
returns trigger as
$$
  begin
    insert into public.users (id, full_name, avatar_url)
    values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
    return new;
  end;
$$
language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
    execute procedure public.handle_new_user();
```

## Tabela de Clientes (customers)

Esta tabela mapeia os IDs de usuário para os IDs de cliente do Stripe e é configurada como privada, sem acesso direto pelos usuários.

```sql
create table customers (
  id uuid references auth.users not null primary key,
  stripe_customer_id text
);

alter table customers enable row level security;
-- Sem políticas, pois esta é uma tabela privada sem acesso do usuário.
```

## Tabela de Produtos (products)

A tabela de produtos armazena informações sincronizadas com o Stripe via webhooks.

```sql
create table products (
  id text primary key,
  active boolean,
  name text,
  description text,
  image text,
  metadata jsonb
);

alter table products
  enable row level security;

create policy "Allow public read-only access." on products
  for select using (true);
```

## Tabela de Preços (prices)

A tabela de preços também é sincronizada com o Stripe e contém informações sobre os preços dos produtos.

```sql
-- Definição de tipos
create type pricing_type as enum ('one_time', 'recurring');
create type pricing_plan_interval as enum ('day', 'week', 'month', 'year');

create table prices (
  id text primary key,
  product_id text references products,
  active boolean,
  description text,
  unit_amount bigint,
  currency text check (char_length(currency) = 3),
  type pricing_type,
  interval pricing_plan_interval,
  interval_count integer,
  trial_period_days integer,
  metadata jsonb
);

alter table prices
  enable row level security;

create policy "Allow public read-only access." on prices
  for select using (true);
```

## Tabela de Assinaturas (subscriptions)

A tabela de assinaturas gerencia informações sobre as assinaturas dos usuários, sincronizadas com o Stripe.

```sql
-- Definição de tipos
create type subscription_status as enum ('trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid');

create table subscriptions (
  id text primary key,
  user_id uuid references auth.users not null,
  status subscription_status,
  metadata jsonb,
  price_id text references prices,
  quantity integer,
  cancel_at_period_end boolean,
  created timestamp with time zone default timezone('utc'::text, now()) not null,
  current_period_start timestamp with time zone default timezone('utc'::text, now()) not null,
  current_period_end timestamp with time zone default timezone('utc'::text, now()) not null,
  ended_at timestamp with time zone default timezone('utc'::text, now()),
  cancel_at timestamp with time zone default timezone('utc'::text, now()),
  canceled_at timestamp with time zone default timezone('utc'::text, now()),
  trial_start timestamp with time zone default timezone('utc'::text, now()),
  trial_end timestamp with time zone default timezone('utc'::text, now())
);

alter table subscriptions
  enable row level security;

create policy "Can only view own subs data." on subscriptions
  for select using (auth.uid() = user_id);
```

## Tabelas em Tempo Real (Realtime Subscriptions)

Somente tabelas públicas podem ser ouvidas em tempo real.

```sql
drop publication if exists supabase_realtime;
create publication supabase_realtime
  for table products, prices;
```

Siga estas instruções para criar e configurar com sucesso o banco de dados no Supabase para o seu aplicativo.



5. **Configuração das Variáveis de Ambiente:**

Para utilizar este projeto, você precisará configurar as variáveis de ambiente no arquivo `.env.local`. Siga as instruções abaixo para obter as chaves necessárias do Supabase e Stripe:

## Configuração do Supabase

1. Acesse as configurações do seu projeto no [Supabase](https://app.supabase.io/).
2. Vá para a seção **Configurações** e clique na aba **API**.
3. Copie e cole as seguintes informações no arquivo `.env.local`, substituindo os espaços em branco pelos valores correspondentes:

```env
NEXT_PUBLIC_SUPABASE_URL=URL_DO_SEU_PROJETO_SUPABASE
NEXT_PUBLIC_SUPABASE_ANON_KEY=CHAVE_ANONIMA_SUPABASE
SUPABASE_SERVICE_ROLE_KEY=CHAVE_DO_SERVICO_SUPABASE
```

Lembre-se de manter essas chaves em segredo e não compartilhá-las publicamente.

## Configuração do Stripe

1. Acesse [Stripe Dashboard](https://dashboard.stripe.com/).
2. Vá para a seção **API** e copie as chaves necessárias.
3. Cole as informações no arquivo `.env.local`:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=CHAVE_PUBLICA_STRIPE
STRIPE_SECRET_KEY=CHAVE_SECRETA_STRIPE
STRIPE_WEBHOOK_SECRET=SEGREDO_DO_WEBHOOK_STRIPE
```

Novamente, mantenha essas chaves em segredo para garantir a segurança do seu aplicativo.

Certifique-se de que o arquivo `.env.local` está no mesmo diretório do seu projeto. Com essas configurações, seu aplicativo estará pronto para se comunicar com o Supabase e o Stripe. Se ainda não tiver, você pode usar o arquivo `.env.example` como referência para criar o `.env.local`.

Lembre-se de nunca compartilhar essas chaves publicamente e mantê-las seguras.

Esperamos que você aproveite o Beat-em-up tanto quanto nós aproveitamos desenvolvê-lo! 🎉🔊
