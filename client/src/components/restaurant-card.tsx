import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

interface RestaurantCardProps {
  name: string;
  description: string;
  image: string;
  rating: number;
}

export function RestaurantCard({ name, description, image, rating }: RestaurantCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-video relative">
        <img
          src={image}
          alt={name}
          className="object-cover w-full h-full"
        />
      </div>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{name}</h3>
          <div className="flex items-center">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="ml-1">{rating}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
