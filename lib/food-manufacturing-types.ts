export type FoodTypeFilter =
  | "전체"
  | "주류"
  | "액상차"
  | "커피"
  | "음료베이스"
  | "곡류가공품"
  | "기타가공품"
  | "복합조미식품"
  | "초콜릿가공품"
  | "땅콩 또는 견과류가공품";

export type DispositionFilter =
  | "전체"
  | "품목제조정지"
  | "품목류제조정지"
  | "영업정지"
  | "영업허가·등록취소"
  | "영업소폐쇄"
  | "해당제품 폐기";

export type FoodManufacturingCase = {
  id: string;
  businessName: string;
  foodType: Exclude<FoodTypeFilter, "전체">;
  dispositionType: Exclude<DispositionFilter, "전체" | "해당제품 폐기">;
  violation: string;
  dispositionDetail: string;
  dispositionDate: string;
  licenseNo: string;
  industryName: string;
  address?: string;
  jurisdiction?: string;
  law?: string;
};
