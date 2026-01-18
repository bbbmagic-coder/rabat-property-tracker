'use client';

import { Property } from '@/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  formatPrice,
  formatDistance,
  getScoreColor,
  getScoreBgColor,
  getStatusColor,
  parsePriceRange,
  parseBedroomRange,
  parseAreaRange,
  formatRelativeTime,
} from '@/lib/utils';
import { MapPin, Star, Building2, Calendar, Ruler, Bed, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface PropertyCardProps {
  property: Property;
  onToggleWatchlist?: (propertyId: string, isInWatchlist: boolean) => void;
  isInWatchlist?: boolean;
  showCompareCheckbox?: boolean;
  isSelected?: boolean;
  onToggleCompare?: (propertyId: string) => void;
}

export function PropertyCard({
  property,
  onToggleWatchlist,
  isInWatchlist = false,
  showCompareCheckbox = false,
  isSelected = false,
  onToggleCompare,
}: PropertyCardProps) {
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  const handleWatchlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!onToggleWatchlist) return;
    
    setWatchlistLoading(true);
    try {
      await onToggleWatchlist(property.id, isInWatchlist);
    } finally {
      setWatchlistLoading(false);
    }
  };

  const handleCompareToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (onToggleCompare) {
      onToggleCompare(property.id);
    }
  };

  const imageUrl = property.image_urls?.[0] || '/placeholder-property.jpg';

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 relative">
      {showCompareCheckbox && (
        <div className="absolute top-4 left-4 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleCompareToggle}
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>
      )}

      <Link href={`/property/${property.id}`}>
        {/* Image */}
        <div className="relative h-48 bg-gray-200">
          <img
            src={imageUrl}
            alt={property.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '/placeholder-property.jpg';
            }}
          />
          
          {/* Watchlist Star */}
          <button
            onClick={handleWatchlistToggle}
            disabled={watchlistLoading}
            className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition"
          >
            <Star
              className={`w-5 h-5 ${
                isInWatchlist ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
              }`}
            />
          </button>

          {/* Investment Score Badge */}
          <div className="absolute bottom-4 right-4">
            <Badge
              variant="default"
              className={`${getScoreBgColor(property.investment_score)} ${getScoreColor(
                property.investment_score
              )} text-lg font-bold px-3 py-1`}
            >
              {Math.round(property.investment_score)}/100
            </Badge>
          </div>
        </div>

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg line-clamp-2 flex-1">
              {property.title}
            </h3>
          </div>

          {/* Location */}
          <div className="flex items-center text-gray-600 text-sm mt-1">
            <MapPin className="w-4 h-4 mr-1" />
            <span>
              {property.district && `${property.district}, `}
              {property.city}
            </span>
          </div>

          {/* Developer */}
          {property.developer && (
            <div className="flex items-center text-gray-600 text-sm mt-1">
              <Building2 className="w-4 h-4 mr-1" />
              <span>{property.developer.name}</span>
            </div>
          )}
        </CardHeader>

        <CardContent className="pb-3">
          {/* Price */}
          <div className="text-2xl font-bold text-blue-600 mb-3">
            {parsePriceRange(property.price_min, property.price_max)}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            {(property.bedrooms_min || property.bedrooms_max) && (
              <div className="flex items-center">
                <Bed className="w-4 h-4 mr-1" />
                <span>{parseBedroomRange(property.bedrooms_min, property.bedrooms_max)}</span>
              </div>
            )}

            {(property.area_min || property.area_max) && (
              <div className="flex items-center">
                <Ruler className="w-4 h-4 mr-1" />
                <span>{parseAreaRange(property.area_min, property.area_max)}</span>
              </div>
            )}

            {property.construction_status && (
              <div className="col-span-2">
                <Badge className={getStatusColor(property.construction_status)}>
                  {property.construction_status === 'planning' && 'Tervezés'}
                  {property.construction_status === 'approved' && 'Engedélyezve'}
                  {property.construction_status === 'construction' && 'Építés alatt'}
                  {property.construction_status === 'completed' && 'Befejezve'}
                </Badge>
              </div>
            )}
          </div>

          {/* Key Distances */}
          {(property.distance_to_university ||
            property.distance_to_beach ||
            property.distance_to_transport) && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-500 space-y-1">
                {property.distance_to_university && (
                  <div>🎓 Egyetem: {formatDistance(property.distance_to_university)}</div>
                )}
                {property.distance_to_beach && (
                  <div>🏖️ Strand: {formatDistance(property.distance_to_beach)}</div>
                )}
                {property.distance_to_transport && (
                  <div>🚇 Tömegközlekedés: {formatDistance(property.distance_to_transport)}</div>
                )}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-0 flex justify-between items-center text-xs text-gray-500">
          <div className="flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            <span>{formatRelativeTime(property.created_at)}</span>
          </div>
          <Button variant="link" size="sm" className="p-0 h-auto">
            Részletek →
          </Button>
        </CardFooter>
      </Link>
    </Card>
  );
}
