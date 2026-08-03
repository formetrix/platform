export {
  createPropertyFromParcel,
  createTestIngestionDeps,
  importParcel,
  refreshParcel,
  searchParcels,
  type IngestionDependencies,
} from "@/lib/properties/ingestion/services";
export {
  createMemoryParcelStore,
  createSupabaseParcelStore,
  getDefaultParcelStore,
} from "@/lib/properties/ingestion/parcel-store";
export type {
  CreatePropertyFromParcelInput,
  CreatePropertyFromParcelResult,
  ImportParcelResult,
  ParcelSearchInput,
  ParcelStore,
  ParcelUpsertInput,
  RefreshParcelResult,
  SearchParcelsResult,
} from "@/lib/properties/ingestion/types";
