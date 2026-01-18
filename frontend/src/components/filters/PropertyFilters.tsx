'use client';

import { useState } from 'react';
import { PropertyFilters as FilterType, RABAT_DISTRICTS, PROPERTY_TYPES, CONSTRUCTION_STATUSES } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, SlidersHorizontal } from 'lucide-react';

interface PropertyFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
  resultCount?: number;
}

export function PropertyFilters({ filters, onFiltersChange, resultCount }: PropertyFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handlePriceChange = (field: 'minPrice' | 'maxPrice', value: string) => {
    const numValue = value === '' ? undefined : parseInt(value);
    onFiltersChange({ ...filters, [field]: numValue });
  };

  const handleDistrictToggle = (district: string) => {
    const currentDistricts = filters.districts || [];
    const newDistricts = currentDistricts.includes(district)
      ? currentDistricts.filter((d) => d !== district)
      : [...currentDistricts, district];
    onFiltersChange({ ...filters, districts: newDistricts });
  };

  const handlePropertyTypeToggle = (type: string) => {
    const currentTypes = filters.propertyTypes || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type];
    onFiltersChange({ ...filters, propertyTypes: newTypes });
  };

  const handleStatusToggle = (status: string) => {
    const currentStatuses = filters.constructionStatus || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status];
    onFiltersChange({ ...filters, constructionStatus: newStatuses });
  };

  const handleReset = () => {
    onFiltersChange({});
  };

  const activeFilterCount = [
    filters.minPrice,
    filters.maxPrice,
    filters.districts?.length,
    filters.propertyTypes?.length,
    filters.minBedrooms,
    filters.maxBedrooms,
    filters.minScore,
    filters.constructionStatus?.length,
  ].filter(Boolean).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5" />
          Szűrők
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFilterCount}
            </Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          {resultCount !== undefined && (
            <span className="text-sm text-gray-600">{resultCount} találat</span>
          )}
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? 'Összecsuk' : 'Kinyit'}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Price Range */}
          <div>
            <label className="text-sm font-medium mb-2 block">Ár (MAD)</label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.minPrice || ''}
                onChange={(e) => handlePriceChange('minPrice', e.target.value)}
              />
              <Input
                type="number"
                placeholder="Max"
                value={filters.maxPrice || ''}
                onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
              />
            </div>
          </div>

          {/* Districts */}
          <div>
            <label className="text-sm font-medium mb-2 block">Negyed</label>
            <div className="flex flex-wrap gap-2">
              {RABAT_DISTRICTS.map((district) => (
                <Badge
                  key={district}
                  variant={filters.districts?.includes(district) ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/80"
                  onClick={() => handleDistrictToggle(district)}
                >
                  {district}
                  {filters.districts?.includes(district) && (
                    <X className="w-3 h-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Property Types */}
          <div>
            <label className="text-sm font-medium mb-2 block">Ingatlan típus</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(PROPERTY_TYPES).map(([key, label]) => (
                <Badge
                  key={key}
                  variant={filters.propertyTypes?.includes(key) ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/80"
                  onClick={() => handlePropertyTypeToggle(key)}
                >
                  {label}
                  {filters.propertyTypes?.includes(key) && (
                    <X className="w-3 h-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Bedrooms */}
          <div>
            <label className="text-sm font-medium mb-2 block">Szobák száma</label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.minBedrooms || ''}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    minBedrooms: e.target.value === '' ? undefined : parseInt(e.target.value),
                  })
                }
              />
              <Input
                type="number"
                placeholder="Max"
                value={filters.maxBedrooms || ''}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    maxBedrooms: e.target.value === '' ? undefined : parseInt(e.target.value),
                  })
                }
              />
            </div>
          </div>

          {/* Investment Score */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Min. befektetési score: {filters.minScore || 0}
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={filters.minScore || 0}
              onChange={(e) =>
                onFiltersChange({ ...filters, minScore: parseInt(e.target.value) })
              }
              className="w-full"
            />
          </div>

          {/* Construction Status */}
          <div>
            <label className="text-sm font-medium mb-2 block">Építési állapot</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CONSTRUCTION_STATUSES).map(([key, label]) => (
                <Badge
                  key={key}
                  variant={filters.constructionStatus?.includes(key) ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/80"
                  onClick={() => handleStatusToggle(key)}
                >
                  {label}
                  {filters.constructionStatus?.includes(key) && (
                    <X className="w-3 h-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Search */}
          <div>
            <label className="text-sm font-medium mb-2 block">Keresés</label>
            <Input
              type="text"
              placeholder="Cím, leírás, negyed..."
              value={filters.search || ''}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            />
          </div>

          {/* Reset Button */}
          {activeFilterCount > 0 && (
            <Button variant="outline" onClick={handleReset} className="w-full">
              <X className="w-4 h-4 mr-2" />
              Szűrők törlése
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
}
