# Kom igång – steg för steg

Den här guiden tar dig från noll till en fungerande bokningssida.
Allt i guiden är **gratis**. Räkna med 20–30 minuter.

Gör stegen i ordning. Kör du fast: kopiera felmeddelandet och klistra
in det i chatten med Claude, så löser vi det tillsammans.

---

## Steg 1 – Skapa ett Supabase-konto (databasen)

1. Gå till **https://supabase.com** och klicka **Start your project**.
2. Logga in med GitHub (enklast, du har redan GitHub) eller e-post.
3. Klicka **New project** och fyll i:
   - **Name:** `bokningssystem`
   - **Database password:** klicka **Generate a password** och **spara
     lösenordet** i en lösenordshanterare eller anteckning – det visas bara en gång.
   - **Region:** välj **Central EU (Frankfurt)** – närmast Sverige.
4. Klicka **Create new project** och vänta 1–2 minuter medan projektet skapas.

## Steg 2 – Skapa databasens tabeller

1. I Supabase, klicka på **SQL Editor** i menyn till vänster (ikonen `>_`).
2. Öppna filen `supabase/migrations/001_grundschema.sql` från detta
   projekt, kopiera **hela** innehållet och klistra in i rutan.
3. Klicka **Run** (eller Ctrl+Enter). Det ska stå **Success** längst ned.
4. Gör likadant med `supabase/migrations/002_testdata_frisor_lisa.sql`
   – nu finns testkunden Frisör Lisa med tjänster och öppettider.

## Steg 3 – Skapa din admin-inloggning

1. Klicka på **Authentication** i vänstermenyn, sedan fliken **Users**.
2. Klicka **Add user** → **Create new user**.
3. Fyll i din e-postadress och ett lösenord du väljer själv.
   Bocka i **Auto Confirm User** om rutan finns.
4. Klicka **Create user**.

## Steg 4 – Koppla inloggningen till Frisör Lisa

1. Gå tillbaka till **SQL Editor**.
2. Klistra in raden nedan, men **byt ut `DIN-EPOST-HÄR`** mot e-postadressen
   du använde i steg 3 (behåll fnuttarna runt adressen):

   ```sql
   update foretag
   set agare_user_id = (select id from auth.users where email = 'DIN-EPOST-HÄR')
   where slug = 'frisor-lisa';
   ```

3. Klicka **Run**. Det ska stå att 1 rad uppdaterades ("Success").

## Steg 5 – Hämta dina nycklar

1. Klicka på kugghjulet **Project Settings** längst ned i vänstermenyn,
   sedan **API**.
2. Du behöver två saker från den sidan:
   - **Project URL** – ser ut som `https://abcdefgh.supabase.co`
   - **anon public**-nyckeln – en lång rad med bokstäver och siffror
3. Låt fliken vara öppen, du behöver värdena i nästa steg.

> Nyckeln som heter **service_role** ska du ALDRIG klistra in någonstans
> utanför Supabase – den ger full åtkomst till allt.

## Steg 6 – Publicera sidan på Netlify

Du behöver inte installera något på din dator – Netlify bygger sidan
direkt från GitHub.

1. Gå till **https://app.netlify.com** och logga in.
2. Klicka **Add new site** → **Import an existing project** → **GitHub**.
3. Välj ditt repo (**ai-agent**) och godkänn åtkomst om det frågas.
4. Fyll i under **Build settings**:
   - **Branch to deploy:** den gren där koden ligger
   - **Base directory:** `bokningssystem/frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `bokningssystem/frontend/dist`
5. Klicka **Add environment variables** och lägg till två variabler
   (värdena från steg 5):
   - `VITE_SUPABASE_URL` = din Project URL
   - `VITE_SUPABASE_ANON_KEY` = din anon public-nyckel
6. Klicka **Deploy**. Efter 1–2 minuter får du en adress i stil med
   `https://nagot-namn.netlify.app` – klart!

## Steg 7 – Testa!

1. Öppna `https://DIN-ADRESS.netlify.app/frisor-lisa` **i mobilen** –
   boka en tid som om du vore kund.
2. Öppna `https://DIN-ADRESS.netlify.app/admin` och logga in med
   uppgifterna från steg 3 – din bokning ska synas under "I dag"
   eller "Kommande".
3. Testa gärna att:
   - boka två gånger och se att den första tiden försvunnit
   - avboka i adminpanelen och se att tiden blir ledig igen

---

## Valfritt: aktivera bekräftelsemail (Resend)

Bokningen fungerar utan detta – men kunden får inget mail förrän det är på.

1. Skapa ett gratiskonto på **https://resend.com** (100 mail/dag gratis).
2. I Resend: klicka **API Keys** → **Create API Key**, kopiera nyckeln.
3. Serverfunktionen som skickar mailet laddas upp med Supabase verktyg –
   **be Claude om hjälp med detta steg**, så går vi igenom det ihop
   (det kräver ett litet program på datorn eller en knapptryckning i
   Supabase gränssnitt, beroende på vad du föredrar).

> I testläge kan Resend bara skicka till **din egen** e-postadress.
> För att maila riktiga kunder verifierar man en egen domän i Resend –
> det tar vi när det blir aktuellt.

## Testa på din egen dator (helt valfritt)

Om du hellre testar lokalt innan du publicerar:

1. Installera **Node.js** från https://nodejs.org (välj LTS-versionen).
2. Öppna en terminal i mappen `bokningssystem/frontend`.
3. Kopiera filen `.env.example` till en ny fil som heter `.env` och
   fyll i värdena från steg 5.
4. Kör `npm install` (hämtar paketen) och sedan `npm run dev`.
5. Öppna adressen som visas (oftast `http://localhost:5173/frisor-lisa`).
