import type { Restaurant, Location } from "@shared/schema";

interface YelpBusiness {
  id: string;
  name: string;

  image_url: string;
  url: string;
  rating: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  location: {
    address1: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    display_address: string[];
  };
}

interface YelpSearchResponse {
  businesses: YelpBusiness[];
  total: number;
  region: {
    center: {
      longitude: number;
      latitude: number;
    };
  };
}

export async function searchBarsNearby(lat: number, lng: number, radius: number = 1000): Promise<Restaurant[]> {
  try {
    console.log('Searching for bars near:', { lat, lng, radius });

    if (!process.env.YELP_API_KEY) {
      throw new Error('YELP_API_KEY environment variable is not set');
    }

    const response = await fetch(
      `https://api.yelp.com/v3/businesses/search?term=bars&latitude=${lat}&longitude=${lng}&radius=${radius}&sort_by=distance&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.YELP_API_KEY}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Yelp API error response:', errorText);
      throw new Error(`Yelp API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data: YelpSearchResponse = await response.json();
    console.log('Yelp API response:', JSON.stringify(data, null, 2));

    if (!data.businesses || !Array.isArray(data.businesses)) {
      throw new Error('Invalid response format from Yelp API: businesses array missing');
    }

    const bars = data.businesses.map(business => {
      if (!business.coordinates) {
        console.warn('Business missing coordinates:', business.name);
        return null;
      }

      const bar: Restaurant = {
        id: parseInt(business.id.slice(-8), 16), // Convert last 8 chars of Yelp ID to number
        name: business.name,
        description: `${business.location.address1 || ''} - Rating: ${business.rating}/5`,
        image: business.image_url || 'https://placehold.co/600x400?text=No+Image',
        location: {
          lat: business.coordinates.latitude,
          lng: business.coordinates.longitude,
        },
        rating: Math.round(business.rating),
      };

      console.log('Processed bar:', bar);
      return bar;
    }).filter((bar): bar is Restaurant => bar !== null);

    console.log('Returning bars:', bars);
    return bars;
  } catch (error) {
    console.error('Error fetching bars from Yelp:', error);
    throw error;
  }
}