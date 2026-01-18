import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// Mubawab RSS feeds for Rabat
const RSS_FEEDS = [
  'https://www.mubawab.ma/fr/st/rabat/immobilier-a-vendre:rss',
  'https://www.mubawab.ma/fr/st/temara/immobilier-a-vendre:rss',
  'https://www.mubawab.ma/fr/st/sale/immobilier-a-vendre:rss',
];

interface PropertyData {
  title: string;
  link: string;
  description: string;
  price?: number;
  district?: string;
  bedrooms?: number;
  area?: number;
}

async function parseRSSFeed(url: string): Promise<PropertyData[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch RSS: ${response.status}`);
      return [];
    }

    const xmlText = await response.text();
    const properties: PropertyData[] = [];

    // Simple XML parsing for <item> elements
    const itemMatches = xmlText.match(/<item>[\s\S]*?<\/item>/g);
    
    if (!itemMatches) {
      console.log('No items found in RSS feed');
      return [];
    }

    console.log(`Found ${itemMatches.length} items in feed`);

    for (const item of itemMatches.slice(0, 10)) { // Process max 10 per feed
      try {
        // Extract title
        const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
        const title = titleMatch ? titleMatch[1].trim() : null;

        // Extract link
        const linkMatch = item.match(/<link>(.*?)<\/link>/);
        const link = linkMatch ? linkMatch[1].trim() : null;

        // Extract description
        const descMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/);
        const description = descMatch ? descMatch[1].trim() : '';

        if (!title || !link) continue;

        // Extract price from title or description
        const priceMatch = (title + ' ' + description).match(/(\d[\d\s,\.]*)\s*(?:DH|MAD|Dhs)/i);
        let price = null;
        if (priceMatch) {
          const priceStr = priceMatch[1].replace(/[\s,]/g, '');
          price = parseInt(priceStr);
        }

        // Extract bedrooms
        const bedroomsMatch = description.match(/(\d+)\s*(?:chambres?|ch|bedroom)/i);
        const bedrooms = bedroomsMatch ? parseInt(bedroomsMatch[1]) : null;

        // Extract area
        const areaMatch = description.match(/(\d+)\s*m[²2]/i);
        const area = areaMatch ? parseInt(areaMatch[1]) : null;

        // Extract district from title or description
        const districtMatch = (title + ' ' + description).match(/(?:à|in|،)\s*([A-Za-zÀ-ÿ\s]+?)(?:,|،|\s*-|\s*\|)/);
        const district = districtMatch ? districtMatch[1].trim() : null;

        properties.push({
          title,
          link,
          description: description.substring(0, 500), // Limit description length
          price,
          district,
          bedrooms,
          area,
        });
      } catch (err) {
        console.error('Error parsing item:', err);
      }
    }

    return properties;
  } catch (error) {
    console.error(`Error fetching RSS feed ${url}:`, error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  // TEMPORARILY DISABLED FOR TESTING
  // const authHeader = request.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  const startTime = Date.now();
  const supabase = createServiceClient();

  try {
    console.log('Starting property search from RSS feeds...');
    
    let totalFound = 0;
    let newPropertiesAdded = 0;

    // Fetch and parse each RSS feed
    for (const feedUrl of RSS_FEEDS) {
      console.log(`Fetching RSS feed: ${feedUrl}`);
      
      const properties = await parseRSSFeed(feedUrl);
      totalFound += properties.length;

      // Process each property
      for (const property of properties) {
        try {
          // Check if property already exists (by source URL)
          const { data: existing } = await supabase
            .from('properties')
            .select('id')
            .eq('source_url', property.link)
            .maybeSingle();

          if (existing) {
            console.log(`Property already exists: ${property.title}`);
            continue;
          }

          // District coordinates mapping
          const districtCoords: Record<string, [number, number]> = {
            'Agdal': [33.9716, -6.8498],
            'Hassan': [34.0209, -6.8417],
            'Hay Riad': [33.9598, -6.8672],
            'Souissi': [33.9839, -6.8365],
            'Océan': [34.0380, -6.8120],
            'Témara': [33.9280, -6.9060],
            'Salé': [34.0531, -6.7982],
            'Bouregreg': [34.0250, -6.8320],
            'Ryad': [33.9598, -6.8672],
            'Hay Nahda': [33.9845, -6.8534],
          };

          let latitude = 33.9716; // Default Rabat center
          let longitude = -6.8498;
          
          if (property.district) {
            // Try exact match
            const coords = districtCoords[property.district];
            if (coords) {
              [latitude, longitude] = coords;
            } else {
              // Try fuzzy match
              const districtLower = property.district.toLowerCase();
              for (const [key, value] of Object.entries(districtCoords)) {
                if (districtLower.includes(key.toLowerCase()) || key.toLowerCase().includes(districtLower)) {
                  [latitude, longitude] = value;
                  break;
                }
              }
            }
          }

          // Determine property type from title/description
          let propertyType = 'apartment'; // default
          const text = (property.title + ' ' + property.description).toLowerCase();
          if (text.includes('villa') || text.includes('maison')) {
            propertyType = 'villa';
          } else if (text.includes('terrain') || text.includes('land')) {
            propertyType = 'land';
          } else if (text.includes('commerce') || text.includes('local')) {
            propertyType = 'commercial';
          }

          // Determine construction status
          let constructionStatus = 'approved';
          if (text.includes('neuf') || text.includes('nouveau') || text.includes('new')) {
            constructionStatus = 'construction';
          } else if (text.includes('projet') || text.includes('prochainement')) {
            constructionStatus = 'planning';
          }

          // Insert property
          const { error: insertError } = await supabase.from('properties').insert({
            title: property.title,
            description: property.description,
            district: property.district || 'Rabat',
            city: 'Rabat',
            latitude,
            longitude,
            price_min: property.price ? Math.floor(property.price * 0.95) : null,
            price_max: property.price ? Math.floor(property.price * 1.05) : null,
            property_type: propertyType,
            bedrooms_min: property.bedrooms,
            bedrooms_max: property.bedrooms,
            area_min: property.area,
            area_max: property.area,
            construction_status: constructionStatus,
            source_url: property.link,
            source_name: 'Mubawab RSS',
            is_active: true,
            investment_score: 50, // Default, will be recalculated
          });

          if (!insertError) {
            newPropertiesAdded++;
            console.log(`Added new property: ${property.title}`);
          } else {
            console.error(`Error