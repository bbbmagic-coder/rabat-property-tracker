import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServiceClient } from '@/lib/supabase';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Search sources for Rabat properties
const SEARCH_SOURCES = [
  'Mubawab.ma nouveaux projets Rabat',
  'Avito.ma projets immobiliers Rabat',
  'Sarouty.ma projets Rabat',
  'projets immobiliers Rabat 2026',
  'nouveaux programmes immobiliers Rabat',
  'Alliances développement Rabat nouveaux projets',
  'Prestigia Rabat projets',
];

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const supabase = createServiceClient();

  try {
    console.log('Starting property search...');
    
    let totalFound = 0;
    let newPropertiesAdded = 0;
    const searchResults: any[] = [];

    // Perform multiple searches
    for (const searchQuery of SEARCH_SOURCES) {
      console.log(`Searching: ${searchQuery}`);

      try {
        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          tools: [
          {
          name: 'web_search',
          type: 'custom' as any,
          } as any,
          ],
          messages: [
            {
              role: 'user',
              content: `Keress rá a következőre: "${searchQuery}". 
              
              Keress ingatlanfejlesztési projekteket Rabat környékén. Gyűjtsd össze a következő információkat minden találatról:
              
              - Projekt neve (franciául és arabul ha elérhető)
              - Fejlesztő neve
              - Pontos cím vagy negyed (district)
              - Árak (min-max, ha elérhető)
              - Lakástípusok (lakás/villa/kereskedelmi)
              - Szobaszámok
              - Területek (m²)
              - Építési állapot (tervezés/engedélyezve/építés alatt/befejezve)
              - Várható befejezési dátum
              - Forrás URL
              
              Válaszolj JSON formátumban, minden projekt egy objektum legyen. CSAK a JSON-t add vissza, semmi mást.
              
              Példa formátum:
              [
                {
                  "title": "Residence Al Houda",
                  "developer": "Alliances",
                  "district": "Hay Riad",
                  "price_min": 800000,
                  "price_max": 1500000,
                  "property_type": "apartment",
                  "bedrooms_min": 2,
                  "bedrooms_max": 4,
                  "area_min": 80,
                  "area_max": 150,
                  "construction_status": "construction",
                  "expected_completion": "2026-12",
                  "source_url": "https://..."
                }
              ]`,
            },
          ],
        });

        // Parse response
        const textContent = message.content.find((c) => c.type === 'text');
        if (textContent && 'text' in textContent) {
          const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const projects = JSON.parse(jsonMatch[0]);
            searchResults.push(...projects);
            totalFound += projects.length;
          }
        }

        // Wait a bit between searches
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error searching ${searchQuery}:`, error);
        // Continue with next search
      }
    }

    console.log(`Total projects found: ${totalFound}`);

    // Process and insert new properties
    for (const project of searchResults) {
      try {
        // Check if property already exists (by title and district)
        const { data: existing } = await supabase
          .from('properties')
          .select('id')
          .eq('title', project.title)
          .eq('district', project.district)
          .single();

        if (existing) {
          console.log(`Property already exists: ${project.title}`);
          continue;
        }

        // Get developer ID or create new developer
        let developerId = null;
        if (project.developer) {
          const { data: developer } = await supabase
            .from('developers')
            .select('id')
            .ilike('name', project.developer)
            .single();

          if (developer) {
            developerId = developer.id;
          } else {
            // Create new developer
            const { data: newDeveloper } = await supabase
              .from('developers')
              .insert({
                name: project.developer,
                rating: 3.5, // Default rating
                total_projects: 1,
              })
              .select('id')
              .single();

            if (newDeveloper) {
              developerId = newDeveloper.id;
            }
          }
        }

        // Geocode address (simplified - in production use Google Geocoding API)
        let latitude = null;
        let longitude = null;
        
        // District approximate coordinates
        const districtCoords: Record<string, [number, number]> = {
          'Agdal': [33.9716, -6.8498],
          'Hassan': [34.0209, -6.8417],
          'Hay Riad': [33.9598, -6.8672],
          'Souissi': [33.9839, -6.8365],
          'Océan': [34.0380, -6.8120],
        };

        if (project.district && districtCoords[project.district]) {
          [latitude, longitude] = districtCoords[project.district];
        }

        // Insert property
        const { error: insertError } = await supabase.from('properties').insert({
          title: project.title,
          developer_id: developerId,
          district: project.district,
          city: 'Rabat',
          latitude,
          longitude,
          price_min: project.price_min,
          price_max: project.price_max,
          property_type: project.property_type,
          bedrooms_min: project.bedrooms_min,
          bedrooms_max: project.bedrooms_max,
          area_min: project.area_min,
          area_max: project.area_max,
          construction_status: project.construction_status || 'planning',
          expected_completion_date: project.expected_completion,
          source_url: project.source_url,
          source_name: 'Web Search',
          is_active: true,
        });

        if (!insertError) {
          newPropertiesAdded++;
          console.log(`Added new property: ${project.title}`);
        } else {
          console.error(`Error inserting property:`, insertError);
        }
      } catch (error) {
        console.error(`Error processing project:`, error);
      }
    }

    const executionTime = Date.now() - startTime;

    // Log search
    await supabase.from('search_logs').insert({
      search_query: SEARCH_SOURCES.join(', '),
      results_found: totalFound,
      new_properties_added: newPropertiesAdded,
      execution_time_ms: executionTime,
      status: 'success',
    });

    console.log(`Search completed in ${executionTime}ms`);
    console.log(`New properties added: ${newPropertiesAdded}`);

    return NextResponse.json({
      success: true,
      totalFound,
      newPropertiesAdded,
      executionTimeMs: executionTime,
    });
  } catch (error) {
    console.error('Cron job error:', error);

    // Log error
    await supabase.from('search_logs').insert({
      search_query: SEARCH_SOURCES.join(', '),
      results_found: 0,
      new_properties_added: 0,
      execution_time_ms: Date.now() - startTime,
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
