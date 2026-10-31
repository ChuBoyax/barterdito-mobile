import type { LocationAddress, LocationOption, ProfileArea } from '@/types/models';
import { apiRequest } from './api';

/** Backend `location_address` JSON. */
export type AddressRow = {
  country_code: string;
  country?: string;
  region_code?: string;
  region?: string;
  province_code?: string;
  province?: string;
  municipality_code?: string;
  municipality?: string;
  barangay_code?: string;
  barangay?: string;
  postal_code?: string;
};

/** Location fields shared by the session user and profile responses. */
export type AreaRow = {
  location?: string;
  location_latitude?: number | null;
  location_longitude?: number | null;
  location_address?: AddressRow | null;
  gps_latitude?: number | null;
  gps_longitude?: number | null;
};

type OptionRow = { code: string; name: string; postal_format?: string; postal_regex?: string };

export function toAddress(row: AddressRow | null | undefined): LocationAddress | null {
  if (!row?.country_code) return null;
  return {
    countryCode: row.country_code,
    country: row.country ?? '',
    regionCode: row.region_code ?? '',
    region: row.region ?? '',
    provinceCode: row.province_code ?? '',
    province: row.province ?? '',
    municipalityCode: row.municipality_code ?? '',
    municipality: row.municipality ?? '',
    barangayCode: row.barangay_code ?? '',
    barangay: row.barangay ?? '',
    postalCode: row.postal_code ?? '',
  };
}

export function toAddressRow(address: LocationAddress): Required<AddressRow> {
  return {
    country_code: address.countryCode,
    country: address.country,
    region_code: address.regionCode,
    region: address.region,
    province_code: address.provinceCode,
    province: address.province,
    municipality_code: address.municipalityCode,
    municipality: address.municipality.trim(),
    barangay_code: address.barangayCode,
    barangay: address.barangay.trim(),
    postal_code: address.postalCode.trim(),
  };
}

export function toArea(row: AreaRow): ProfileArea {
  return {
    location: row.location ?? '',
    locationLatitude: row.location_latitude ?? null,
    locationLongitude: row.location_longitude ?? null,
    locationAddress: toAddress(row.location_address),
    gpsLatitude: row.gps_latitude ?? null,
    gpsLongitude: row.gps_longitude ?? null,
  };
}

const params = (values: Record<string, string>) =>
  Object.entries(values)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');

/** Catalogue requests, also used as cache keys. Children need their parent's code. */
export const locationPaths = {
  countries: 'countries',
  regions: (countryCode: string) => `regions?${params({ country_code: countryCode })}`,
  provinces: (regionCode: string) => `provinces?${params({ region_code: regionCode })}`,
  municipalities: (countryCode: string, regionCode: string, provinceCode: string) =>
    `municipalities?${params({ country_code: countryCode, region_code: regionCode, province_code: provinceCode })}`,
  barangays: (municipalityCode: string) => `barangays?${params({ municipality_code: municipalityCode })}`,
};

export const locationService = {
  /** The backend's offline country → region → (province) → city → barangay catalogue; public. */
  async options(path: string): Promise<LocationOption[]> {
    const rows = await apiRequest<OptionRow[]>(`/locations/${path}`, { timeout: 15_000 });
    return rows.map((row) => ({
      code: row.code,
      name: row.name,
      postalFormat: row.postal_format || undefined,
      postalRegex: row.postal_regex || undefined,
    }));
  },
};
