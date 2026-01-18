import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const SEARCH_QUERIES = [
  'site:avito.ma immobilier Rabat neuf',
  'site:avito.ma appartement Rabat neuf projet',
  'site:mubawab.ma nouveau projet Rabat',
  'site:mubawab.ma résidence Rabat neuf',
  'immobilier neuf Rabat Hay Riad',
  'projet immobilier Rabat Souissi',
];

interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
}

async function googleCustomSearch(query: string): Promise<GoogleSearchResult[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !searchEngineId) {
    console.error('Google Search API credentials not configured');
    return [];
  }

  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&num=10`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Google Search API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      console.log(`No results found for: ${query}`);
      return [];
    }

    return data.items.map((item: any) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet || '',
    }));
  } catch (error) {
    console.error(`Error in Google Search for "${query}":`, error);
    return [];
  }
}

function extractPropertyData(result: GoogleSearchResult) {
  const { title, link, snippet } = result;
  const text = (title + ' ' + snippet).toLowerCase();

  // Extract price
  const priceMatch = text.match(/(\d[\d\s,\.]*)\s*(?:dh|mad|dhs|dirham)/i);
  let priceMin = undefined;
  let priceMax = undefined;
  if (priceMatch) {
    const priceStr = priceMatch[1].replace(/[\s,\.]/g, '');
    const price = parseInt(priceStr);
    if (price > 10000) {
      priceMin = Math.floor(price * 0.95);
      priceMax = Math.floor(price * 1.05);
    }
  }

  // Extract bedrooms
  const bedroomsMatch = text.match(/(\d+)\s*(?:chambres?|ch\b|bedroom)/i);
  const bedrooms = bedroomsMatch ? parseInt(bedroomsMatch[1]) : undefined;

  // Extract area
  const areaMatch = text.match(/(\d+)\s*m[²2]/i);
  const area = areaMatch ? parseInt(areaMatch[1]) : undefined;

  // Extract district
  const districts = ['Agdal', 'Hassan', 'Hay Riad', 'Souissi', 'Océan', 'Témara', 'Salé', 'Bouregreg', 'Hay Nahda', 'Aviation'];
  let district = undefined;
  for (const d of districts) {
    if (text.includes(d.toLowerCase())) {
      district = d;
      break;
    }
  }

  // Property type
  let propertyType = 'apartment';
  if (text.includes('villa') || text.includes('maison')) {
    propertyType = 'villa';
  } else if (text.includes('terrain') || text.includes('land')) {
    propertyType = 'land';
  } else if (text.includes('commerce') || text.includes('local')) {
    propertyType = 'commercial';
  }

  // Construction status
  let constructionStatus = 'approved';
  if (text.includes('neuf') || text.includes('nouveau') || text.includes('new') || text.includes('projet')) {
    constructionStatus = 'construction';
  } else if (text.includes('vefa') || text.includes('sur plan')) {
    constructionStatus = 'planning';
  }

  // Source
  let sourceName = 'Google Search';
  if (link.includes('avito.ma')) {
    sourceName = 'Avito.ma';
  } else if (link.includes('mubawab.ma')) {
    sourceName = 'Mubawab.ma';
  }

  return {
    title,
    link,
    snippet,
    priceMin,
    priceMax,
    bedrooms,
    area,
    district,
    propertyType,
    constructionStatus,
    sourceName,
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const supabase = createServiceClient();

  try {
    console.log('Starting property search via Google Custom Search...');
    
    let totalFound = 0;
    let newPropertiesAdded = 0;

    for (const query of SEARCH_QUERIES) {
      console.log(`Searching Google: ${query}`);
      
      const results = await googleCustomSearch(query);
      totalFound += results.length;

      for (const result of results) {
        try {
          // Check if property already exists
          const { data: existing } = await supabase
            .from('properties')
            .select('id')
            .eq('source_url', result.link)
            .maybeSingle();

          if (existing) {
            console.log(`Property already exists: ${result.title}`);
            continue;
          }

          const propertyData = extractPropertyData(result);

          // District coordinates
          const districtCoords: Record<string, [number, number]> = {
            'Agdal': [33.9716, -6.8498],
            'Hassan': [34.0209, -6.8417],
            'Hay Riad': [33.9598, -6.8672],
            'Souissi': [33.9839, -6.8365],
            'Océan': [34.0380, -6.8120],
            'Témara': [33.9280, -6.9060],
            'Salé': [34.0531, -6.7982],
            'Bouregreg': [34.0250, -6.8320],
            'Hay Nahda': [33.9845, -6.8534],
            'Aviation': [33.9500, -6.8600],
          };

          let latitude = 33.9716; // Default Rabat center
          let longitude = -6.8498;
          
          if (propertyData.district && districtCoords[propertyData.district]) {
            [latitude, longitude] = districtCoords[propertyData.district];
          }

          // Insert property
          const { error: insertError } = await supabase.from('properties').insert({
            title: propertyData.title,
            description: propertyData.snippet.substring(0, 500),
            district: propertyData.district || 'Rabat',
            city: 'Rabat',
            latitude,
            longitude,
            price_min: propertyData.priceMin,
            price_max: propertyData.priceMax,
            property_type: propertyData.propertyType,
            bedrooms_min: propertyData.bedrooms,
            bedrooms_max: propertyData.bedrooms,
            area_min: propertyData.area,
            area_max: propertyData.area,
            construction_status: propertyData.constructionStatus,
            source_url: propertyData.link,
            source_name: propertyData.sourceName,
            is_active: true,
            investment_score: 55, // Default
          });

          if (!insertError) {
            newPropertiesAdded++;
            console.log(`Added new property: ${propertyData.title}`);
          } else {
            console.error(`Error inserting property:`, insertError);
          }
        } catch (error) {
          console.error(`Error processing result:`, error);
        }
      }

      // Wait between searches to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    const executionTime = Date.now() - startTime;

    // Log search
    await supabase.from('search_logs').insert({
      search_query: SEARCH_QUERIES.join(', '),
      results_found: totalFound,
      new_properties_added: newPropertiesAdded,
      execution_time_ms: executionTime,
      status: 'success',
    });

    console.log(`Search completed in ${executionTime}ms`);
    console.log(`Total found: ${totalFound}, New added: ${newPropertiesAdded}`);

    return NextResponse.json({
      success: true,
      totalFound,
      newPropertiesAdded,
      executionTimeMs: executionTime,
      message: newPropertiesAdded > 0 
        ? `Successfully added ${newPropertiesAdded} new properties via Google Search`
        : totalFound > 0 
          ? 'Properties found but already exist in database'
          : 'No new properties found',
    });
  } catch (error) {
    console.error('Cron job error:', error);

    const executionTime = Date.now() - startTime;

    await supabase.from('search_logs').insert({
      search_query: SEARCH_QUERIES.join(', '),
      results_found: 0,
      new_properties_added: 0,
      execution_time_ms: executionTime,
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}