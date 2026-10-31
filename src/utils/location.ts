import type { LocationAddress, LocationOption } from '@/types/models';

export const emptyAddress: LocationAddress = {
  countryCode: '',
  country: '',
  regionCode: '',
  region: '',
  provinceCode: '',
  province: '',
  municipalityCode: '',
  municipality: '',
  barangayCode: '',
  barangay: '',
  postalCode: '',
};

/** The public label the backend composes: barangay, city, province, region, country. */
export function addressLabel(address: LocationAddress) {
  const parts = [address.barangay, address.municipality, address.province, address.region, address.country].map((part) => part.trim());
  return [...new Set(parts.filter(Boolean))].join(', ');
}

/**
 * First problem with an address before it is sent; the backend still validates the hierarchy.
 * `country` is the catalogue row, for its postal rules.
 */
export function addressIssue(address: LocationAddress, country?: LocationOption): string | null {
  if (!address.countryCode) return 'Choose your country.';
  if (address.municipality.trim().length < 2) return 'Choose your municipality or city.';
  if (address.countryCode === 'PH' && !address.barangayCode) return 'Choose your barangay.';
  const postal = address.postalCode.trim();
  if (country?.postalFormat && !postal) return `Enter your ${address.countryCode === 'PH' || address.countryCode === 'US' ? 'ZIP' : 'postal'} code.`;
  if (postal && country?.postalRegex) {
    try {
      if (!new RegExp(country.postalRegex).test(postal.toUpperCase())) return `Enter a valid ZIP or postal code for ${country.name}.`;
    } catch {
      // A pattern this engine cannot read is left to the backend.
    }
  }
  return null;
}

/** "Barangay 74, Tacloban City, Leyte, Eastern Visayas, Philippines" → "Barangay 74, Tacloban City", for tight spaces. */
export function shortLocation(location: string) {
  return location.split(',').map((part) => part.trim()).filter(Boolean).slice(0, 2).join(', ');
}

/** "3 km away" from a nearby feed; empty when the feed is not filtered by location. */
export function distanceLabel(km: number | null | undefined) {
  if (km == null) return '';
  return `${km < 1 ? '<1' : Math.round(km)} km away`;
}
