import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Parse filters from query params
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const districts = searchParams.get('districts')?.split(',').filter(Boolean);
  const propertyTypes = searchParams.get('propertyTypes')?.split(',').filter(Boolean);
  const minBedrooms = searchParams.get('minBedrooms');
  const maxBedrooms = searchParams.get('maxBedrooms');
  const minScore = searchParams.get('minScore');
  const constructionStatuses = searchParams.get('constructionStatuses')?.split(',').filter(Boolean);
  const developers = searchParams.get('developers')?.split(',').filter(Boolean);
  const search = searchParams.get('search');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  const sortBy = searchParams.get('sortBy') || 'created_at';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  try {
    const supabase = createServerClient();

    // Build query
    let query = supabase
      .from('properties')
      .select(`
        *,
        developer:developers(*)
      `, { count: 'exact' })
      .eq('is_active', true);

    // Apply filters
    if (minPrice) {
      query = query.gte('price_min', parseInt(minPrice));
    }
    if (maxPrice) {
      query = query.lte('price_max', parseInt(maxPrice));
    }
    if (districts && districts.length > 0) {
      query = query.in('district', districts);
    }
    if (propertyTypes && propertyTypes.length > 0) {
      query = query.in('property_type', propertyTypes);
    }
    if (minBedrooms) {
      query = query.gte('bedrooms_min', parseInt(minBedrooms));
    }
    if (maxBedrooms) {
      query = query.lte('bedrooms_max', parseInt(maxBedrooms));
    }
    if (minScore) {
      query = query.gte('investment_score', parseFloat(minScore));
    }
    if (constructionStatuses && constructionStatuses.length > 0) {
      query = query.in('construction_status', constructionStatuses);
    }
    if (developers && developers.length > 0) {
      query = query.in('developer_id', developers);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,district.ilike.%${search}%`);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching properties:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      properties: data,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
