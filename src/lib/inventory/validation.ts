export function hasInventoryPrecision(value: number) {
  return Number(value.toFixed(3)) === value;
}
