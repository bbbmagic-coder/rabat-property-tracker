'use client';

import { useEffect, useState } from 'react';
import { Property, PropertyFilters as FilterType } from '@/types';
import { PropertyCard } from '@/components/property/PropertyCard';
import { PropertyFilters } from '@/components/filters/PropertyFilters';
import { Button } from '@/components/ui/button';
import { createBrowserClient } from '@/lib/supabase';
import { Grid3x3, Map, List, ArrowUpDown } from 'lucide-react';

export default function Dashboard() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterType>({});
  const [view, setView] = useState<'grid' | 'list' | 'map'>('grid');
  const [sortBy, setSortBy] = useState<'created_at' | 'investment_score' | 'price_min'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [selectedForCompare, setSelectedForCompare] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<any>(null);

  const supabase = createBrowserClient();

  // Fetch user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  // Fetch watchlist
  useEffect(() => {
    if (!user) return;

    const fetchWatchlist = async () => {
      const { data, error } = await supabase
        .from('user_watchlist')
        .select('property_id')
        .eq('user_id', user.id);

      if (!error && data) {
        setWatchlist(new Set(data.map((w) => w.property_id)));
      }
    };

    fetchWatchlist();
  }, [user]);

  // Fetch properties
  useEffect(() => {
    fetchProperties();
  }, [filters, sortBy, sortOrder]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
      if (filters.districts?.length) params.append('districts', filters.districts.join(','));
      if (filters.propertyTypes?.length) params.append('propertyTypes', filters.propertyTypes.join(','));
      if (filters.minBedrooms) params.append('minBedrooms', filters.minBedrooms.toString());
      if (filters.maxBedrooms) params.append('maxBedrooms', filters.maxBedrooms.toString());
      if (filters.minScore) params.append('minScore', filters.minScore.toString());
      if (filters.constructionStatus?.length) params.append('constructionStatuses', filters.constructionStatus.join(','));
      if (filters.search) params.append('search', filters.search);
      
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      params.append('limit', '50');

      const response = await fetch(`/api/properties?${params.toString()}`);
      const data = await response.json();
      
      setProperties(data.properties || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWatchlist = async (propertyId: string, isInWatchlist: boolean) => {
    if (!user) {
      alert('Jelentkezz be a kedvencek használatához!');
      return;
    }

    try {
      if (isInWatchlist) {
        // Remove from watchlist
        await fetch(`/api/watchlist?property_id=${propertyId}`, {
          method: 'DELETE',
        });
        setWatchlist((prev) => {
          const newSet = new Set(prev);
          newSet.delete(propertyId);
          return newSet;
        });
      } else {
        // Add to watchlist
        await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ property_id: propertyId }),
        });
        setWatchlist((prev) => new Set([...prev, propertyId]));
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
    }
  };

  const handleToggleCompare = (propertyId: string) => {
    setSelectedForCompare((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(propertyId)) {
        newSet.delete(propertyId);
      } else {
        if (newSet.size >= 3) {
          alert('Maximum 3 projektet lehet összehasonlítani!');
          return prev;
        }
        newSet.add(propertyId);
      }
      return newSet;
    });
  };

  const handleCompare = () => {
    if (selectedForCompare.size < 2) {
      alert('Legalább 2 projektet válassz ki!');
      return;
    }
    const ids = Array.from(selectedForCompare).join(',');
    window.open(`/compare?ids=${ids}`, '_blank');
  };

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <div className="flex items-center gap-4">
              {/* View Toggle */}
              <div className="flex items-center gap-2 border rounded-lg p-1">
                <Button
                  variant={view === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setView('grid')}
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={view === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setView('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={view === 'map' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setView('map')}
                >
                  <Map className="w-4 h-4" />
                </Button>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSort('created_at')}
                >
                  Dátum {sortBy === 'created_at' && <ArrowUpDown className="w-3 h-3 ml-1" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSort('investment_score')}
                >
                  Score {sortBy === 'investment_score' && <ArrowUpDown className="w-3 h-3 ml-1" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSort('price_min')}
                >
                  Ár {sortBy === 'price_min' && <ArrowUpDown className="w-3 h-3 ml-1" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Filters */}
          <div className="lg:col-span-1">
            <PropertyFilters
              filters={filters}
              onFiltersChange={setFilters}
              resultCount={properties.length}
            />
          </div>

          {/* Properties Grid */}
          <div className="lg:col-span-3">
            {/* Compare Bar */}
            {selectedForCompare.size > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center justify-between">
                <span className="text-sm font-medium">
                  {selectedForCompare.size} projekt kiválasztva összehasonlításhoz
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setSelectedForCompare(new Set())}>
                    Törlés
                  </Button>
                  <Button size="sm" onClick={handleCompare} disabled={selectedForCompare.size < 2}>
                    Összehasonlítás
                  </Button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Betöltés...</p>
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border">
                <p className="text-gray-600 text-lg">Nincs találat a megadott szűrőkkel</p>
                <Button variant="outline" className="mt-4" onClick={() => setFilters({})}>
                  Szűrők törlése
                </Button>
              </div>
            ) : (
              <div
                className={
                  view === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                    : 'space-y-4'
                }
              >
                {properties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    onToggleWatchlist={handleToggleWatchlist}
                    isInWatchlist={watchlist.has(property.id)}
                    showCompareCheckbox={true}
                    isSelected={selectedForCompare.has(property.id)}
                    onToggleCompare={handleToggleCompare}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
