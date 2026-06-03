"use client";

import { useEffect, useMemo, useState } from "react";
import { loadFoodManufacturingCases } from "../lib/food-manufacturing-data";
import type {
  DispositionFilter,
  FoodManufacturingCase,
  FoodTypeFilter
} from "../lib/food-manufacturing-types";

const FOOD_TYPE_MENU: FoodTypeFilter[] = [
  "전체",
  "주류",
  "액상차",
  "커피",
  "음료베이스",
  "곡류가공품",
  "기타가공품",
  "복합조미식품",
  "초콜릿가공품",
  "땅콩 또는 견과류가공품"
];

const DISPOSITION_MENU: DispositionFilter[] = [
  "전체",
  "품목제조정지",
  "품목류제조정지",
  "영업정지",
  "영업허가·등록취소",
  "영업소폐쇄",
  "해당제품 폐기"
];

export default function Page() {
  const [cases, setCases] = useState<FoodManufacturingCase[]>([]);
  const [selectedFoodType, setSelectedFoodType] = useState<FoodTypeFilter>("전체");
  const [selectedDisposition, setSelectedDisposition] = useState<DispositionFilter>("전체");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadCases() {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const data = await loadFoodManufacturingCases();

        if (!ignore) {
          setCases(data);
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(error instanceof Error ? error.message : "데이터를 불러오지 못했습니다.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadCases();

    return () => {
      ignore = true;
    };
  }, []);

  const filteredCases = useMemo(() => {
    return cases.filter((item) => {
      const foodTypeMatched = selectedFoodType === "전체" || item.foodType === selectedFoodType;
      const dispositionMatched =
        selectedDisposition === "전체" ||
        item.dispositionType === selectedDisposition ||
        (selectedDisposition === "해당제품 폐기" && includesDisposal(item.dispositionDetail));
      const queryMatched = !query.trim() || searchTarget(item).includes(query.trim().toLowerCase());

      return foodTypeMatched && dispositionMatched && queryMatched;
    });
  }, [cases, selectedFoodType, selectedDisposition, query]);

  const latestDispositionDate = useMemo(() => {
    const sortedDates = [...cases]
      .map((item) => item.dispositionDate)
      .filter(Boolean)
      .sort();

    return sortedDates[sortedDates.length - 1];
  }, [cases]);

  function resetFilters() {
    setSelectedFoodType("전체");
    setSelectedDisposition("전체");
    setQuery("");
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">식품안전나라 I0480 기반</p>
        <h1>식품제조가공업 행정처분 검색</h1>
        <p className="hero-description">
          식품유형, 처분종류, 검색어를 조합해 경쟁 제품군의 행정처분 사례와 위반 원인을 빠르게 확인할 수 있습니다.
          현재는 샘플 정적 데이터로 동작하며, 데이터 로더만 교체하면 내부 API 연동으로 확장할 수 있습니다.
        </p>
        <div className="summary-grid">
          <div className="summary-card">
            <strong>{filteredCases.length.toLocaleString("ko-KR")}</strong>
            <span>현재 조건 결과</span>
          </div>
          <div className="summary-card">
            <strong>{cases.length.toLocaleString("ko-KR")}</strong>
            <span>전체 샘플 사례</span>
          </div>
          <div className="summary-card">
            <strong>{latestDispositionDate ?? "-"}</strong>
            <span>최근 처분일자</span>
          </div>
        </div>
      </section>

      <section className="filter-panel" aria-label="필터 메뉴">
        <FilterRow
          title="식품유형별 메뉴"
          hint="가로 스크롤 가능"
          items={FOOD_TYPE_MENU}
          selected={selectedFoodType}
          getCount={(item) => countByFoodType(cases, item, selectedDisposition, query)}
          getIconClass={getFoodIconClass}
          onSelect={(item) => setSelectedFoodType(item as FoodTypeFilter)}
        />
        <FilterRow
          title="처분종류별 메뉴"
          hint="두 필터 동시 적용"
          items={DISPOSITION_MENU}
          selected={selectedDisposition}
          getCount={(item) => countByDisposition(cases, item, selectedFoodType, query)}
          onSelect={(item) => setSelectedDisposition(item as DispositionFilter)}
        />
      </section>

      <section className="results-panel">
        <div className="results-header">
          <div>
            <h2>검색 결과 {filteredCases.length.toLocaleString("ko-KR")}건</h2>
            <p>업체명, 식품유형, 위반내용, 처분내용, 처분일자, 인허가번호로 검색합니다.</p>
          </div>
          <div className="search-area">
            <input
              aria-label="사례 검색"
              placeholder="업체명, 위반내용, 처분일자, 인허가번호 검색"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button className="reset-button" type="button" onClick={resetFilters}>
              초기화
            </button>
          </div>
        </div>

        <div className="active-filters" aria-live="polite">
          {selectedFoodType === "전체" && selectedDisposition === "전체" && !query.trim() ? (
            <span className="placeholder-chip">필터를 선택하거나 검색어를 입력해보세요.</span>
          ) : (
            <>
              {selectedFoodType !== "전체" ? <span className="chip">식품유형: {selectedFoodType}</span> : null}
              {selectedDisposition !== "전체" ? <span className="chip">처분종류: {selectedDisposition}</span> : null}
              {query.trim() ? <span className="chip">검색: {query.trim()}</span> : null}
            </>
          )}
        </div>

        {isLoading ? <div className="empty-state">데이터를 불러오는 중입니다.</div> : null}
        {errorMessage ? <div className="error-state">오류: {errorMessage}</div> : null}
        {!isLoading && !errorMessage && filteredCases.length === 0 ? (
          <div className="empty-state">현재 조건에 맞는 행정처분 사례가 없습니다.</div>
        ) : null}
        {!isLoading && !errorMessage && filteredCases.length > 0 ? (
          <div className="card-grid">
            {filteredCases.map((item) => (
              <CaseCard item={item} key={item.id} />
            ))}
          </div>
        ) : null}
      </section>

      <p className="footer-note">
        실제 운영에서는 Vercel Environment Variables에 FOOD_API_KEY를 등록하고, 프론트는 식품안전나라를 직접 호출하지 않고
        /api/food-manufacturing 내부 API만 호출하도록 전환하면 됩니다.
      </p>
    </main>
  );
}

function FilterRow({
  title,
  hint,
  items,
  selected,
  getCount,
  getIconClass,
  onSelect
}: {
  title: string;
  hint: string;
  items: string[];
  selected: string;
  getCount: (item: string) => number;
  getIconClass?: (item: string) => string;
  onSelect: (item: string) => void;
}) {
  return (
    <div className="filter-row">
      <div className="filter-title">
        <span>{title}</span>
        <small>{hint}</small>
      </div>
      <div className="menu-scroll">
        {items.map((item) => (
          <button
            className={`filter-button ${selected === item ? "active" : ""}`}
            key={item}
            type="button"
            onClick={() => onSelect(item)}
          >
            <span className="filter-label">
              {getIconClass ? <span className={`food-icon ${getIconClass(item)}`} aria-hidden="true" /> : null}
              <span>{item}</span>
            </span>
            <span className="filter-count">{getCount(item).toLocaleString("ko-KR")}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CaseCard({ item }: { item: FoodManufacturingCase }) {
  return (
    <article className="case-card">
      <div className="card-top">
        <div>
          <h3>{item.businessName}</h3>
          <div className="license">인허가번호 {item.licenseNo}</div>
        </div>
        <span className="badge">{item.dispositionType}</span>
      </div>

      <div className="tag-row">
        <span className="tag">{item.foodType}</span>
        <span className="tag">{item.industryName}</span>
        <span className="tag">처분일자 {item.dispositionDate}</span>
      </div>

      <div className="case-section">
        <strong>위반내용</strong>
        <p>{item.violation}</p>
      </div>

      <div className="case-section">
        <strong>처분내용</strong>
        <p>{item.dispositionDetail}</p>
      </div>

      <div className="meta-list">
        {item.address ? <span>소재지: {item.address}</span> : null}
        {item.jurisdiction ? <span>관할지역: {item.jurisdiction}</span> : null}
        {item.law ? <span>관련 법령: {item.law}</span> : null}
      </div>
    </article>
  );
}

function countByFoodType(
  cases: FoodManufacturingCase[],
  foodType: string,
  disposition: DispositionFilter,
  query: string
) {
  return cases.filter((item) => {
    const foodTypeMatched = foodType === "전체" || item.foodType === foodType;
    const dispositionMatched =
      disposition === "전체" ||
      item.dispositionType === disposition ||
      (disposition === "해당제품 폐기" && includesDisposal(item.dispositionDetail));
    const queryMatched = !query.trim() || searchTarget(item).includes(query.trim().toLowerCase());
    return foodTypeMatched && dispositionMatched && queryMatched;
  }).length;
}

function countByDisposition(
  cases: FoodManufacturingCase[],
  disposition: string,
  foodType: FoodTypeFilter,
  query: string
) {
  return cases.filter((item) => {
    const foodTypeMatched = foodType === "전체" || item.foodType === foodType;
    const dispositionMatched =
      disposition === "전체" ||
      item.dispositionType === disposition ||
      (disposition === "해당제품 폐기" && includesDisposal(item.dispositionDetail));
    const queryMatched = !query.trim() || searchTarget(item).includes(query.trim().toLowerCase());
    return foodTypeMatched && dispositionMatched && queryMatched;
  }).length;
}

function searchTarget(item: FoodManufacturingCase) {
  return [
    item.businessName,
    item.foodType,
    item.violation,
    item.dispositionDetail,
    item.dispositionDate,
    item.licenseNo,
    item.industryName,
    item.address,
    item.jurisdiction,
    item.law
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function includesDisposal(dispositionDetail: string) {
  return /해당\s*제품.*폐기|해당제품.*폐기|제품\s*및\s*원료\s*폐기/.test(dispositionDetail);
}

function getFoodIconClass(item: string) {
  if (item === "전체") return "all";
  if (item.includes("주류")) return "drink";
  if (item.includes("액상차")) return "tea";
  if (item.includes("커피")) return "coffee";
  if (item.includes("음료베이스")) return "beverage";
  if (item.includes("곡류")) return "grain";
  if (item.includes("복합조미")) return "seasoning";
  if (item.includes("초콜릿")) return "chocolate";
  if (item.includes("땅콩") || item.includes("견과류")) return "peanut";
  if (item.includes("젤리")) return "jelly";
  return "processed";
}
