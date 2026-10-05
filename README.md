# Allround Cleaning Service

Bedrijfsportaal voor Allround Cleaning Service, gebouwd met Next.js 16, React 19,
Supabase en PostgreSQL.

## Lokaal starten

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Het dashboard is beschikbaar
op `/dashboard`; voorraadbeheer staat op `/erp/voorraad`.

## Voorraadbeheer instellen

Voorraadmutaties worden opgeslagen in PostgreSQL via Supabase. De voorraad-API
vereist een ingelogde gebruiker; er is geen publieke registratie.

1. Maak een Supabase-project aan.
2. Kopieer `.env.example` naar `.env.local` en vul de project-URL en
   publishable key in vanuit de Supabase projectinstellingen:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
   ```

   Stel deze variabelen ook in vóór een productiebuild.

3. Voer [`supabase/migrations/20261005160000_inventory.sql`](./supabase/migrations/20261005160000_inventory.sql)
   uit in de SQL Editor van het Supabase-project.
4. Schakel openbare registratie uit en nodig gebruikers alleen uit via
   Supabase Authentication.
5. Voeg iedere bevoegde gebruiker expliciet toe aan `inventory_members`. Voer
   bijvoorbeeld in de SQL Editor uit, met het e-mailadres van een reeds
   aangemaakte Supabase-gebruiker:

   ```sql
   insert into public.inventory_members (user_id)
   select id from auth.users where email = 'beheerder@allround-cleaning.nl'
   on conflict (user_id) do nothing;
   ```

6. Herstart de Next.js-server en open `/erp/voorraad`.

De migratie maakt de artikelcatalogus en mutatiegeschiedenis aan, zet
Row-Level Security aan en beperkt toegang tot expliciet toegelaten
magazijngebruikers. Voorraadwijzigingen worden als één atomische
databasemutatie opgeslagen; een afboeking kan de voorraad niet onder nul
brengen. De realtime-publicatie houdt open magazijnschermen synchroon; als die
verbinding wegvalt, wordt de voorraad periodiek opnieuw opgehaald. Alle
toegelaten gebruikers werken in deze eerste versie in dezelfde bedrijfsvoorraad.

## Magazijnworkflow

- Scan een barcode met een USB-/handscanner (die tekst invoert en Enter verstuurt)
  of open de camera-scanner op een apparaat met cameratoegang.
- Voeg onbekende artikelen toe aan de catalogus met eenheid, barcode,
  magazijnlocatie en optionele minimumvoorraad.
- Boek ontvangen goederen in of verbruikte/uitgegeven goederen af.
- Bekijk de actuele voorraad en de laatste 30 mutaties.

Voor cameratoegang is HTTPS nodig, behalve op `localhost`. Als een artikel nog
geen barcode heeft, kun je het ook selecteren vanuit de catalogus.
.
NEXT_PUBLIC_SUPABASE_URL=https://xxsviljyttgtehfwkoll.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4c3ZpbGp5dHRndGVoZndrb2xsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMDcwOTUsImV4cCI6MjEwNjc4MzA5NX0.Bqpk9AEpR6unQbxOHxVmFyxtMxjtfQD67boWMiGCyL8
