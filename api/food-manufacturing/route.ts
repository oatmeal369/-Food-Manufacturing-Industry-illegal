import { NextResponse } from "next/server";
import type { FoodManufacturingCase } from "../../../lib/food-manufacturing-types";

const API_NAME = "I0480";
const PAGE_SIZE = 1000;

export const dynamic = "force-dynamic";

type I0480Row = Record<string, unknown>;

export async function GET() {
  const apiKey = process.env.FOOD_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "FOOD_API_KEY 환경변수가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  try {
    const firstPage = await fetchI0480(apiKey, 1, PAGE_SIZE);
    const totalCount = firstPage.totalCount;
    const rows = [...firstPage.rows];

    for (let startIdx = PAGE_SIZE + 1; startIdx <= totalCount; startIdx += PAGE_SIZE) {
      const endIdx = Math.min(startIdx + PAGE_SIZE - 1, totalCount);
      const page = await fetchI0480(apiKey, startIdx, endIdx);
      rows.push(...page.rows);
    }

    return NextResponse.json({
      total_count: totalCount,
      fetched_count: rows.length,
      cases: rows.map(rowToCase)
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "식품안전나라 OpenAPI 호출에 실패했습니다.",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 502 }
    );
  }
}

async function fetchI0480(apiKey: string, startIdx: number, endIdx: number) {
  const url = `http://openapi.foodsafetykorea.go.kr/api/${encodeURIComponent(
    apiKey
  )}/${API_NAME}/json/${startIdx}/${endIdx}`;

  const response = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} (${startIdx}-${endIdx})`);
  }

  const json = await response.json();
  const payload = json[API_NAME] ?? json[API_NAME.toLowerCase()] ?? json;
  const result = payload.RESULT ?? {};

  if (result.CODE && result.CODE !== "INFO-000") {
    throw new Error(`${result.CODE}: ${result.MSG ?? "API 오류"}`);
  }

  return {
    totalCount: Number(payload.total_count ?? 0),
    rows: normalizeRows(payload.row)
  };
}

function normalizeRows(rows: unknown): I0480Row[] {
  if (!rows) {
    return [];
  }
  return Array.isArray(rows) ? (rows as I0480Row[]) : [rows as I0480Row];
}

function rowToCase(row: I0480Row, index: number): FoodManufacturingCase {
  const violation = pick(row, "VILTCN");
  const dispositionDetail = pick(row, "DSPSCN");

  return {
    id: pick(row, "DSPSDTLS_SEQ") || String(index),
    businessName: pick(row, "PRCSCITYPOINT_BSSHNM"),
    foodType: inferFoodType(violation, pick(row, "INDUTY_CD_NM")),
    dispositionType: inferDispositionType(pick(row, "DSPS_TYPECD_NM")),
    violation,
    dispositionDetail,
    dispositionDate: formatDate(pick(row, "DSPS_DCSNDT")),
    licenseNo: pick(row, "LCNS_NO"),
    industryName: pick(row, "INDUTY_CD_NM"),
    address: pick(row, "ADDR"),
    jurisdiction: pick(row, "DSPS_INSTTCD_NM"),
    law: pick(row, "LAWORD_CD_NM")
  };
}

function pick(row: I0480Row, key: string) {
  const value = row[key];
  return value === undefined || value === null ? "" : String(value).trim();
}

function inferFoodType(violation: string, industryName: string): FoodManufacturingCase["foodType"] {
  if (industryName.includes("주류") || /탁주|막걸리|동동주|맥주|양조/.test(violation)) return "주류";
  if (violation.includes("액상차")) return "액상차";
  if (violation.includes("커피")) return "커피";
  if (violation.includes("음료베이스")) return "음료베이스";
  if (violation.includes("곡류가공품")) return "곡류가공품";
  if (violation.includes("기타가공품")) return "기타가공품";
  if (violation.includes("복합조미식품")) return "복합조미식품";
  if (violation.includes("초콜릿가공품") || violation.includes("초콜릿")) return "초콜릿가공품";
  if (/땅콩|견과류가공품|견과류/.test(violation)) return "땅콩 또는 견과류가공품";
  return "기타가공품";
}

function inferDispositionType(value: string): FoodManufacturingCase["dispositionType"] {
  const normalized = value.replace(/ㆍ/g, "·").replace(/\s+/g, "");
  if (normalized === "품목제조정지") return "품목제조정지";
  if (normalized === "품목류제조정지") return "품목류제조정지";
  if (normalized === "영업정지") return "영업정지";
  if (normalized === "영업허가·등록취소") return "영업허가·등록취소";
  if (normalized === "영업소폐쇄") return "영업소폐쇄";
  return "영업정지";
}

function formatDate(value: string) {
  const digits = value.replace(/[^\d]/g, "").slice(0, 8);
  if (digits.length !== 8) {
    return value;
  }
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}
