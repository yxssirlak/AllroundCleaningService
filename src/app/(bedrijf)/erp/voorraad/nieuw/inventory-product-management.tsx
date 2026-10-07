"use client";

import { useState } from "react";
import DeleteInventoryProducts from "./delete-inventory-products";
import NewInventoryProductForm from "./new-inventory-product-form";

type Props = {
  initialBarcode: string;
  returnPath: string;
};

export default function InventoryProductManagement({ initialBarcode, returnPath }: Props) {
  const [action, setAction] = useState<"add" | "remove">("add");

  return (
    <>
      <div className="inventory-management-actions" role="group" aria-label="Artikelbeheeractie">
        <button
          className={`inventory-management-choice${action === "add" ? " active" : ""}`}
          type="button"
          aria-pressed={action === "add"}
          onClick={() => setAction("add")}
        >
          Artikel toevoegen
        </button>
        <button
          className={`inventory-management-choice${action === "remove" ? " active" : ""}`}
          type="button"
          aria-pressed={action === "remove"}
          onClick={() => setAction("remove")}
        >
          Artikel verwijderen
        </button>
      </div>
      {action === "add" ? (
        <NewInventoryProductForm initialBarcode={initialBarcode} returnPath={returnPath} />
      ) : (
        <DeleteInventoryProducts />
      )}
    </>
  );
}
