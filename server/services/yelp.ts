import type { Restaurant } from "@shared/schema";

interface YelpBusiness {
  id: string;
  name: string;
  image_url: string;
  url: string;
  rating: number;
  location: {
    address1: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    display_address: string[];
    coordinate: {
      latitude: number;
      longitude: number;
    };
  };
}

interface YelpSearchResponse {
  businesses: YelpBusiness[];
  total: number;
  region: {
    center: {
      latitude: number;
      longitude: number;
    };
  };
}

export async function searchBarsNearby(lat: number, lng: number, radius: number = 1000): Promise<Restaurant[]> {
  try {
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
      throw new Error(`Yelp API error: ${response.status} ${response.statusText}`);
    }

    const data: YelpSearchResponse = await response.json();
    
    return data.businesses.map(business => ({
      id: parseInt(business.id.slice(-8), 16), // Convert last 8 chars of Yelp ID to number
      name: business.name,
      description: `Rating: ${business.rating}/5 stars - ${business.location.address1}`,
      image: business.image_url || 'https://placehold.co/600x400?text=No+Image',
      location: {
        lat: business.location.coordinate.latitude,
        lng: business.location.coordinate.longitude,
      },
      rating: Math.round(business.rating),
    }));
  } catch (error) {
    console.error('Error fetching bars from Yelp:', error);
    throw error;
  }
}
