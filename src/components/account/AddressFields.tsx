import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, SearchSelect, TextField, type SearchOption } from '@/components/ui';
import { useLocationOptions } from '@/hooks/useLocationOptions';
import { locationPaths } from '@/services/locationService';
import type { LocationAddress, LocationOption } from '@/types/models';
import { addressLabel, emptyAddress } from '@/utils/location';

type AddressFieldsProps = {
  value: LocationAddress | null;
  /** `keepCoordinates` is true for postal-code edits, which do not move the area. */
  onChange: (value: LocationAddress | null, keepCoordinates?: boolean) => void;
  /** A text-only area saved before structured addresses. */
  legacyLocation?: string;
};

const OTHER_CITY = '__other__';

/** Keeps a saved choice selectable while (or if) its list has no row for it. */
function choices(rows: LocationOption[], code: string, name: string): SearchOption[] {
  const options = rows.map((row) => ({ value: row.code, label: row.name }));
  return code && !rows.some((row) => row.code === code) ? [{ value: code, label: name || 'Saved selection' }, ...options] : options;
}

/**
 * Country → region/state → province (Philippines) → municipality/city → barangay (Philippines)
 * or district → ZIP/postal code, from the backend's offline catalogue. Same rules as the website:
 * changing a level clears everything below it.
 */
export function AddressFields({ value, onChange, legacyLocation }: AddressFieldsProps) {
  const address = value ?? emptyAddress;
  const ph = address.countryCode === 'PH';
  const parentKey = `${address.countryCode}:${address.regionCode}:${address.provinceCode}`;
  // Outside the Philippines a town missing from the catalogue can be typed in.
  const [customCityKey, setCustomCityKey] = useState<string | null>(null);

  const countries = useLocationOptions(locationPaths.countries);
  const regions = useLocationOptions(address.countryCode ? locationPaths.regions(address.countryCode) : null);
  const provinces = useLocationOptions(ph && address.regionCode ? locationPaths.provinces(address.regionCode) : null);
  const canChooseCity = Boolean(address.countryCode && !regions.loading && !regions.error && (address.regionCode || regions.options.length === 0));
  const cities = useLocationOptions(
    canChooseCity ? locationPaths.municipalities(address.countryCode, address.regionCode, address.provinceCode) : null,
  );
  const barangays = useLocationOptions(ph && address.municipalityCode ? locationPaths.barangays(address.municipalityCode) : null);

  const country = countries.options.find((row) => row.code === address.countryCode);
  const customCity =
    !ph &&
    canChooseCity &&
    (customCityKey === parentKey || (!cities.loading && !cities.error && cities.options.length === 0) || (!address.municipalityCode && Boolean(address.municipality)));
  const failed = [countries, regions, provinces, cities, barangays].filter((list) => list.error);
  const zipLabel = ph || address.countryCode === 'US' ? 'ZIP code' : 'Postal code';
  const belowCity = { barangayCode: '', barangay: '', postalCode: '' };

  function chooseCountry(code: string) {
    setCustomCityKey(null);
    const row = countries.options.find((option) => option.code === code);
    onChange({ ...emptyAddress, countryCode: code, country: row?.name ?? '' });
  }

  function chooseCity(code: string) {
    if (code === OTHER_CITY) {
      setCustomCityKey(parentKey);
      return onChange({ ...address, municipalityCode: '', municipality: '', ...belowCity });
    }
    const row = cities.options.find((option) => option.code === code);
    onChange({ ...address, municipalityCode: code, municipality: row?.name ?? '', ...belowCity });
  }

  const cityOptions = choices(cities.options, address.municipalityCode, address.municipality);
  if (!ph && cityOptions.length) cityOptions.push({ value: OTHER_CITY, label: 'Enter another municipality or city' });

  return (
    <View style={styles.wrap}>
      <SearchSelect
        label="Country"
        value={address.country}
        selected={address.countryCode}
        options={choices(countries.options, address.countryCode, address.country)}
        onSelect={chooseCountry}
        placeholder="Choose country"
        loading={countries.loading}
        disabled={Boolean(countries.error)}
      />
      {address.countryCode ? (
        <>
          <SearchSelect
            label="Region / state"
            value={address.region}
            selected={address.regionCode}
            options={choices(regions.options, address.regionCode, address.region)}
            onSelect={(code) => {
              setCustomCityKey(null);
              const row = regions.options.find((option) => option.code === code);
              onChange({ ...emptyAddress, countryCode: address.countryCode, country: address.country, regionCode: code, region: row?.name ?? '' });
            }}
            placeholder={!regions.loading && !regions.options.length ? 'Not used for this country' : 'Choose region or state'}
            loading={regions.loading}
            disabled={Boolean(regions.error) || !regions.options.length}
          />
          {ph ? (
            <SearchSelect
              label="Province"
              value={address.province}
              selected={address.provinceCode}
              options={[{ value: '', label: 'No province / independent city' }, ...choices(provinces.options, address.provinceCode, address.province)]}
              onSelect={(code) => {
                const row = provinces.options.find((option) => option.code === code);
                onChange({ ...address, provinceCode: code, province: row?.name ?? '', municipalityCode: '', municipality: '', ...belowCity });
              }}
              placeholder="No province / independent city"
              loading={provinces.loading}
              disabled={!address.regionCode || Boolean(provinces.error) || (!provinces.loading && !provinces.options.length)}
            />
          ) : null}
          {customCity ? (
            <TextField
              label="Municipality / city"
              value={address.municipality}
              onChangeText={(text) => onChange({ ...address, municipalityCode: '', municipality: text, barangay: '', postalCode: '' })}
              placeholder="Enter municipality or city"
              maxLength={100}
              editable={canChooseCity}
            />
          ) : (
            <SearchSelect
              label="Municipality / city"
              value={address.municipality}
              selected={address.municipalityCode}
              options={cityOptions}
              onSelect={chooseCity}
              placeholder="Choose municipality or city"
              loading={cities.loading}
              disabled={!canChooseCity || Boolean(cities.error)}
            />
          )}
          {ph ? (
            <SearchSelect
              label="Barangay"
              value={address.barangay}
              selected={address.barangayCode}
              options={choices(barangays.options, address.barangayCode, address.barangay)}
              onSelect={(code) => {
                const row = barangays.options.find((option) => option.code === code);
                onChange({ ...address, barangayCode: code, barangay: row?.name ?? '' });
              }}
              placeholder="Choose barangay"
              loading={barangays.loading}
              disabled={!address.municipalityCode || Boolean(barangays.error)}
            />
          ) : (
            <TextField
              label="District / locality (optional)"
              value={address.barangay}
              onChangeText={(text) => onChange({ ...address, barangay: text })}
              placeholder="Enter district, suburb or locality"
              maxLength={100}
              editable={Boolean(address.municipality)}
            />
          )}
          <TextField
            label={country?.postalFormat ? zipLabel : `${zipLabel} (optional)`}
            value={address.postalCode}
            onChangeText={(text) => onChange({ ...address, postalCode: text }, true)}
            placeholder={country?.postalFormat || 'Postal code, if applicable'}
            maxLength={20}
            autoCapitalize="characters"
            autoComplete="postal-code"
            keyboardType={ph ? 'number-pad' : 'default'}
            editable={Boolean(address.municipality)}
          />
          {addressLabel(address) ? (
            <AppText variant="caption" color="ink" weight="semibold">
              {addressLabel(address)}
            </AppText>
          ) : null}
        </>
      ) : legacyLocation ? (
        <AppText variant="caption">Current area: {legacyLocation}. Choose a country above to replace it.</AppText>
      ) : null}
      {failed.map((list, index) => (
        <View key={index} style={styles.row}>
          <AppText variant="caption" color="red" style={styles.flex}>
            {list.error}
          </AppText>
          <Pressable accessibilityRole="button" onPress={list.retry} hitSlop={8}>
            <AppText variant="caption" color="orange" weight="bold">
              Try again
            </AppText>
          </Pressable>
        </View>
      ))}
      <AppText variant="caption">Places: Countries States Cities Database (ODbL) · Philippine PSGC data</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
