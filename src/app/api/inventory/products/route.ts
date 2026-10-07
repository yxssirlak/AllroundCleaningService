import { NextResponse } from "next/server";
import { requireInventoryUser } from "@/lib/inventory/api-auth";
import { hasInventoryPrecision } from "@/lib/inventory/validation";

export async function GET() {
  const auth = await requireInventoryUser();
  if ("response" in auth) {
    return auth.response;
  }

  const { data, error } = await auth.supabase
    .from("inventory_products")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true })
    .limit(500);

  if (error) {
    console.error("Voorraadartikelen ophalen mislukt:", error.message);
    return NextResponse.json(
      { error: "De voorraadartikelen konden niet worden opgehaald." },
      { status: 500 },
    );
  }

  return NextResponse.json({ products: data });
}

export async function POST(request: Request) {
  const auth = await requireInventoryUser();
  if ("response" in auth) {
    return auth.response;
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json(
      { error: "De aanvraag bevat geen geldige JSON." },
      { status: 400 },
    );
  }

  if (typeof input !== "object" || input === null) {
    return NextResponse.json({ error: "Ongeldige artikelgegevens." }, { status: 400 });
  }

  const body = input as Record<string, unknown>;
  if (
    (body.barcode !== undefined && typeof body.barcode !== "string") ||
    (body.sku !== undefined && typeof body.sku !== "string") ||
    (body.unit !== undefined && typeof body.unit !== "string") ||
    (body.location !== undefined && typeof body.location !== "string") ||
    (body.minimumQuantity !== undefined && typeof body.minimumQuantity !== "number")
  ) {
    return NextResponse.json(
      { error: "Controleer de artikelgegevens en gebruik de juiste waardes." },
      { status: 400 },
    );
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const barcode = typeof body.barcode === "string" ? body.barcode.trim() || null : null;
  const sku = typeof body.sku === "string" ? body.sku.trim() : "";
  const unit = typeof body.unit === "string" ? body.unit.trim() : "stuk";
  const location = typeof body.location === "string" ? body.location.trim() || null : null;
  const minimumQuantity =
    body.minimumQuantity === undefined ? 0 : Number(body.minimumQuantity);

  if (
    !name ||
    name.length > 120 ||
    (barcode !== null && barcode.length > 128) ||
    !sku ||
    sku.length > 64 ||
    !unit ||
    unit.length > 20 ||
    (location !== null && location.length > 100) ||
    !Number.isFinite(minimumQuantity) ||
    !hasInventoryPrecision(minimumQuantity) ||
    minimumQuantity < 0 ||
    minimumQuantity > 1000000
  ) {
    return NextResponse.json(
      { error: "Vul een artikelnaam en artikelcode in en controleer de barcode, eenheid en minimumvoorraad." },
      { status: 400 },
    );
  }

  const { data, error } = await auth.supabase
    .from("inventory_products")
    .insert({
      name,
      barcode,
      sku,
      unit,
      location,
      minimum_quantity: minimumQuantity,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Deze barcode of artikelcode is al aan een artikel gekoppeld." },
        { status: 409 },
      );
    }

    console.error("Voorraadartikel aanmaken mislukt:", error.message);
    return NextResponse.json(
      { error: "Het artikel kon niet worden opgeslagen." },
      { status: 500 },
    );
  }

  return NextResponse.json({ product: data }, { status: 201 });
}

export async function DELETE(request: Request) {
  const auth = await requireInventoryUser();
  if ("response" in auth) {
    return auth.response;
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json(
      { error: "De aanvraag bevat geen geldige JSON." },
      { status: 400 },
    );
  }

  if (typeof input !== "object" || input === null) {
    return NextResponse.json({ error: "Ongeldig artikel." }, { status: 400 });
  }

  const body = input as Record<string, unknown>;
  const requestedIds =
    Array.isArray(body.ids) ? body.ids : typeof body.id === "string" ? [body.id] : null;
  if (
    !requestedIds ||
    requestedIds.length === 0 ||
    requestedIds.length > 500 ||
    requestedIds.some((id) => typeof id !== "string")
  ) {
    return NextResponse.json({ error: "Ongeldig artikel." }, { status: 400 });
  }

  const ids = [...new Set((requestedIds as string[]).map((id) => id.trim()))];
  if (
    ids.length !== requestedIds.length ||
    ids.some((id) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
  ) {
    return NextResponse.json({ error: "Ongeldig artikel." }, { status: 400 });
  }

  const { data: activeProducts, error: lookupError } = await auth.supabase
    .from("inventory_products")
    .select("id")
    .in("id", ids)
    .eq("is_active", true);

  if (lookupError) {
    console.error("Te verwijderen voorraadartikelen controleren mislukt:", lookupError.message);
    return NextResponse.json(
      { error: "De artikelen konden niet worden gecontroleerd." },
      { status: 500 },
    );
  }

  if (activeProducts.length !== ids.length) {
    return NextResponse.json(
      { error: "Een of meer geselecteerde artikelen bestaan niet meer of zijn al verwijderd. Vernieuw de lijst." },
      { status: 404 },
    );
  }

  const { data, error } = await auth.supabase
    .from("inventory_products")
    .update({ is_active: false })
    .in("id", ids)
    .eq("is_active", true)
    .select("id");

  if (error) {
    console.error("Voorraadartikel verwijderen mislukt:", error.message);
    return NextResponse.json(
      { error: "Het artikel kon niet worden verwijderd." },
      { status: 500 },
    );
  }

  if (data.length !== ids.length) {
    return NextResponse.json(
      { error: "Niet alle geselecteerde artikelen konden worden verwijderd. Vernieuw de lijst en probeer opnieuw." },
      { status: 409 },
    );
  }

  return NextResponse.json({ success: true, ids: data.map((product) => product.id) });
}
