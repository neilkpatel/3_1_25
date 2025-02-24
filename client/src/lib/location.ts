import type { Location } from "@shared/schema";

export async function getCurrentLocation(): Promise<Location> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    console.log('Requesting location access...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Location access granted:', position.coords);
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        let errorMessage = "Unable to get your location. ";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Please enable location access in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage += "Location request timed out.";
            break;
          default:
            errorMessage += "An unknown error occurred.";
        }

        console.error('Location error:', {
          code: error.code,
          message: error.message,
          fullError: errorMessage
        });

        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,  // Increased timeout to 10 seconds
        maximumAge: 0
      }
    );
  });
}

export function isLocationPermissionGranted(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!navigator.permissions) {
      resolve(false);
      return;
    }

    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      resolve(result.state === 'granted');
    });
  });
}