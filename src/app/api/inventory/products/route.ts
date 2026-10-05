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
  const sku = typeof body.sku === "string" ? body.sku.trim() || null : null;
  const unit = typeof body.unit === "string" ? body.unit.trim() : "stuk";
  const location = typeof body.location === "string" ? body.location.trim() || null : null;
  const minimumQuantity =
    body.minimumQuantity === undefined ? 0 : Number(body.minimumQuantity);

  if (
    !name ||
    name.length > 120 ||
    (barcode !== null && barcode.length > 128) ||
    (sku !== null && sku.length > 64) ||
    !unit ||
    unit.length > 20 ||
    (location !== null && location.length > 100) ||
    !Number.isFinite(minimumQuantity) ||
    !hasInventoryPrecision(minimumQuantity) ||
    minimumQuantity < 0 ||
    minimumQuantity > 1000000
  ) {
    return NextResponse.json(
      { error: "Controleer de artikelnaam, barcode, eenheid en minimumvoorraad." },
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
