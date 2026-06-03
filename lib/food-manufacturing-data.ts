import { sampleFoodManufacturingCases } from "./sample-food-manufacturing-cases";
import type { FoodManufacturingCase } from "./food-manufacturing-types";

type FoodManufacturingApiResponse = {
  cases?: FoodManufacturingCase[];
  error?: string;
  message?: string;
};

export async function loadFoodManufacturingCases(): Promise<FoodManufacturingCase[]> {
  if (typeof window === "undefined") {
    return sampleFoodManufacturingCases;
  }

  const response = await fetch("/api/food-manufacturing", {
    cache: "no-store"
  });
  const payload = (await response.json()) as FoodManufacturingApiResponse;

  if (!response.ok) {
    throw new Error(payload.error || payload.message || "데이터를 불러오지 못했습니다.");
  }

  if (!Array.isArray(payload.cases)) {
    throw new Error("응답 데이터 형식이 올바르지 않습니다.");
  }

  return payload.cases;
}
