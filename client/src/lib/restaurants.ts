import type { Restaurant } from "@shared/schema";

const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: 1,
    name: "The Cozy Corner",
    description: "Intimate bistro with farm-to-table cuisine",
    image: "https://images.unsplash.com/photo-1648396705951-5dce63b1db84",
    location: { lat: 40.7128, lng: -74.006 },
    rating: 4
  },
  {
    id: 2,
    name: "Urban Plate",
    description: "Modern American cuisine in an industrial setting",
    image: "https://images.unsplash.com/photo-1705917893728-d5c594c98d51",
    location: { lat: 40.7138, lng: -74.008 },
    rating: 5
  },
  {
    id: 3,
    name: "Sushi Master",
    description: "Premium sushi and Japanese delicacies",
    image: "https://images.unsplash.com/photo-1597595272404-d8a0da48ec8f",
    location: { lat: 40.7148, lng: -74.003 },
    rating: 5
  }
];

export function getMockRestaurants(): Restaurant[] {
  return MOCK_RESTAURANTS;
}
