import { NextResponse } from "next/server";
import { requireInventoryUser } from "@/lib/inventory/api-auth";
import { hasInventoryPrecision } from "@/lib/inventory/validation";

export async function GET(request: Request) {
  const auth = await requireInventoryUser();
  if ("response" in auth) {
    return auth.response;
  }

  const searchParams = new URL(request.url).searchParams;
  const requestedLimit = Number(searchParams.get("limit") ?? 30);
  const requestedOffset = Number(searchParams.get("offset") ?? 0);
  const movementType = searchParams.get("type");
  const productId = searchParams.get("productId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (
    !Number.isInteger(requestedLimit) ||
    requestedLimit < 1 ||
    requestedLimit > 100 ||
    !Number.isInteger(requestedOffset) ||
    requestedOffset < 0 ||
    requestedOffset > 100000 ||
    (movementType !== null && movementType !== "in" && movementType !== "out") ||
    (productId !== null && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(productId)) ||
    (from !== null && (!Number.isFinite(Date.parse(from)) || from.length > 40)) ||
    (to !== null && (!Number.isFinite(Date.parse(to)) || to.length > 40)) ||
    (from !== null && to !== null && Date.parse(from) >= Date.parse(to))
  ) {
    return NextResponse.json({ error: "Ongeldige filters voor de voorraadgeschiedenis." }, { status: 400 });
  }

  let query = auth.supabase
    .from("inventory_movements")
    .select("*")
    .order("created_at", { ascending: false });
  if (movementType) query = query.eq("movement_type", movementType);
  if (productId) query = query.eq("product_id", productId);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lt("created_at", to);

  const { data: movements, error } = await query.range(requestedOffset, requestedOffset + requestedLimit);

  if (error) {
    console.error("Voorraadmutaties ophalen mislukt:", error.message);
    return NextResponse.json(
      { error: "De voorraadgeschiedenis kon niet worden opgehaald." },
      { status: 500 },
    );
  }

  const pageMovements = movements.slice(0, requestedLimit);
  const hasMore = movements.length > requestedLimit;
  const productIds = [...new Set(pageMovements.map((movement) => movement.product_id))];
  const { data: products, error: productsError } = productIds.length
    ? await auth.supabase
        .from("inventory_products")
        .select("id, name, sku, unit")
        .in("id", productIds)
    : { data: [], error: null };

  if (productsError) {
    console.error("Namen van voorraadartikelen ophalen mislukt:", productsError.message);
    return NextResponse.json(
      { error: "De voorraadgeschiedenis kon niet worden opgehaald." },
      { status: 500 },
    );
  }

  const productNames = new Map(products.map((product) => [product.id, product]));

  return NextResponse.json({
    movements: pageMovements.map((movement) => ({
      ...movement,
      product: productNames.get(movement.product_id) ?? null,
    })),
    hasMore,
  });
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
    return NextResponse.json({ error: "Ongeldige voorraadmutatie." }, { status: 400 });
  }

  const body = input as Record<string, unknown>;
  const productId = typeof body.productId === "string" ? body.productId : "";
  const movementType = body.movementType;
  const quantity = typeof body.quantity === "number" ? body.quantity : Number.NaN;
  const note = typeof body.note === "string" ? body.note.trim() || null : null;

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(productId) ||
    (movementType !== "in" && movementType !== "out") ||
    (body.note !== undefined && typeof body.note !== "string") ||
    !Number.isFinite(quantity) ||
    !hasInventoryPrecision(quantity) ||
    quantity <= 0 ||
    quantity > 1000000 ||
    (note !== null && note.length > 250)
  ) {
    return NextResponse.json(
      { error: "Controleer het artikel, de mutatiesoort, het aantal en de opmerking." },
      { status: 400 },
    );
  }

  const { data, error } = await auth.supabase.rpc("record_inventory_movement", {
    p_product_id: productId,
    p_movement_type: movementType,
    p_quantity: quantity,
    p_note: note,
  });

  if (error) {
    if (error.code === "P0001") {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error.code === "P0002") {
      return NextResponse.json({ error: "Dit artikel is niet meer beschikbaar." }, { status: 404 });
    }
    if (error.code === "22023" || error.code === "42501") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Voorraadmutatie opslaan mislukt:", error.message);
    return NextResponse.json(
      { error: "De voorraadmutatie kon niet worden opgeslagen." },
      { status: 500 },
    );
  }

  return NextResponse.json({ movement: data[0] }, { status: 201 });
}
