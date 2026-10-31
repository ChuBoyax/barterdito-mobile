import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';

import { userService } from '@/services';
import type { DetectedArea } from '@/services/userService';
import { errorMessage } from '@/utils/format';

export type FoundArea = DetectedArea & { gpsLatitude: number; gpsLongitude: number };

const TIMEOUT_MS = 15_000;

function withTimeout<T>(promise: Promise<T>, message: string) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), TIMEOUT_MS);
    promise.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

/**
 * "Use my location" in Edit profile, as on the website: reads the device position, asks the
 * backend to name the area, and hands it back for review. Nothing is saved until the profile is.
 */
export function useCurrentArea(onFound: (area: FoundArea) => void) {
  const [locating, setLocating] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  // Permission is off for good: only the system Settings can turn it back on.
  const [blocked, setBlocked] = useState(false);
  // Bumped by cancel/unmount so a late result never overwrites a newer choice.
  const generation = useRef(0);
  useEffect(() => () => void generation.current++, []);

  function cancel() {
    generation.current++;
    setLocating(false);
    setStatus('');
    setError('');
    setBlocked(false);
  }

  async function locate() {
    cancel();
    const token = generation.current;
    const current = () => token === generation.current;
    setLocating(true);
    setStatus('Getting your location…');
    try {
      if (!(await Location.hasServicesEnabledAsync())) {
        throw new Error('Location services are off. Turn them on, or choose your address below.');
      }
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!current()) return;
      if (!permission.granted) {
        setBlocked(!permission.canAskAgain);
        throw new Error(
          permission.canAskAgain
            ? 'Location permission was denied. Allow it to use your location, or choose your address below.'
            : 'Location access is off for Barterdito. Turn it on in Settings, or choose your address below.',
        );
      }
      const position =
        (await Location.getLastKnownPositionAsync({ maxAge: 60_000, requiredAccuracy: 100 })) ??
        (await withTimeout(
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
          'Finding your location took too long. Try again, or choose your address below.',
        ));
      if (!current()) return;
      const { latitude, longitude } = position.coords;
      setStatus('Finding your barangay, municipality or city, and province…');
      const area = await userService.resolveCurrentArea(latitude, longitude);
      if (!current()) return;
      onFound({ ...area, gpsLatitude: latitude, gpsLongitude: longitude });
      setStatus('Location found. Review the address and postal code, then save your profile.');
    } catch (caught) {
      if (!current()) return;
      setStatus('');
      setError(errorMessage(caught, 'Could not find your area. Try again, or choose your address below.'));
    } finally {
      if (current()) setLocating(false);
    }
  }

  return { locating, status, error, blocked, locate, cancel };
}
