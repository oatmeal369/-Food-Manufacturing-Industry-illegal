import { sampleFoodManufacturingCases } from "./sample-food-manufacturing-cases";
import type { FoodManufacturingCase } from "./food-manufacturing-types";

export async function loadFoodManufacturingCases(): Promise<FoodManufacturingCase[]> {
  // Static-first implementation.
  // Later OpenAPI integration can replace this function body with:
  // const response = await fetch("/api/food-manufacturing");
  // if (!response.ok) throw new Error("데이터를 불러오지 못했습니다.");
  // return (await response.json()).cases;
  return sampleFoodManufacturingCases;
}
