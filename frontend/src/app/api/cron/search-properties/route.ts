import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServiceClient } from '@/lib/supabase';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Search sources for Rabat properties
const SEARCH_QUERIES = [
  'Mubawab nouveaux projets immobiliers Rabat 2026',
  'Avito projets neufs Rabat Hay Riad',
  'nouveaux programmes immobiliers Rabat Souissi',
  'Prestigia Rabat nouveaux projets',
  'Alliances développement Rabat',
];

export async function GET(request: NextRequest) {
  // Verify cron secret
  //const authHeader = request.headers.get('authorization');
  //if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  //}

  const startTime = Date.now();
  const supabase = createServiceClient();

  try {
    console.log('Starting property search with web search...');
    
    let totalFound = 0;
    let newPropertiesAdded = 0;

    // Try each search query
    for (const query of SEARCH_QUERIES) {
      console.log(`Searching: ${query}`);

      try {
        // Use Claude with web search capability
        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          messages: [
            {
              role: 'user',
              content: `Search the web for: "${query}"

Find real estate development projects in Rabat, Morocco. Extract the following information for each project you find:

- Project name (French and Arabic if available)
- Developer name
- District/neighborhood
- Price range (min-max in MAD)
- Property type (apartment/villa/commercial/mixed)
- Number of bedrooms (min-max)
- Area size in m² (min-max)
- Construction status (planning/approved/construction/completed)
- Expected completion date
- Source URL

Return ONLY a valid JSON array with this exact structure:
[
  {
    "title": "Project Name",
    "developer": "Developer Name",
    "district": "District Name",
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
]

If you find multiple projects, include all of them in the array. If you find no projects, return an empty array: []

IMPORTANT: Return ONLY the JSON array, no other text, no markdown, no explanations.`,
            },
          ],
        });

        // Parse response
        const textContent = message.content.find((c) => c.type === 'text');
        if (textContent && 'text' in textContent) {
          let jsonText = textContent.text.trim();
          
          // Remove markdown code blocks if present
          jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
          
          // Try to find JSON array
          const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            try {
              const projects = JSON.parse(jsonMatch[0]);
              
              if (Array.isArray(projects) && projects.length > 0) {
                console.log(`Found ${projects.length} projects from: ${query}`);
                totalFound += projects.length;

                // Process each project
                for (const project of projects) {
                  try {
                    // Check if property already exists
                    const { data: existing } = await supabase
                      .from('properties')
                      .select('id')
                      .eq('title', project.title)
                      .maybeSingle();

                    if (existing) {
                      console.log(`Property already exists: ${project.title}`);
                      continue;
                    }

                    // Get or create developer
                    let developerId = null;
                    if (project.developer) {
                      const { data: developer } = await supabase
                        .from('developers')
                        .select('id')
                        .ilike('name', project.developer)
                        .maybeSingle();

                      if (developer) {
                        developerId = developer.id;
                      } else {
                        // Create new developer
                        const { data: newDeveloper } = await supabase
                          .from('developers')
                          .insert({
                            name: project.developer,
                            rating: 3.5,
                            total_projects: 1,
                          })
                          .select('id')
                          .single();

                        if (newDeveloper) {
                          developerId = newDeveloper.id;
                        }
                      }
                    }

                    // Approximate coordinates for districts
                    const districtCoords: Record<string, [number, number]> = {
                      'Agdal': [33.9716, -6.8498],
                      'Hassan': [34.0209, -6.8417],
                      'Hay Riad': [33.9598, -6.8672],
                      'Souissi': [33.9839, -6.8365],
                      'Océan': [34.0380, -6.8120],
                      'Témara': [33.9280, -6.9060],
                      'Bouregreg': [34.0250, -6.8320],
                    };

                    let latitude = null;
                    let longitude = null;
                    
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
                      investment_score: 50, // Default, will be recalculated
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
              }
            } catch (parseError) {
              console.error(`JSON parse error for query "${query}":`, parseError);
            }
          } else {
            console.log(`No JSON found in response for: ${query}`);
          }
        }

        // Wait between searches to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } catch (error) {
        console.error(`Error searching ${query}:`, error);
        // Continue with next search
      }
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
        ? `Successfully added ${newPropertiesAdded} new properties`
        : 'No new properties found, but search completed successfully',
    });
  } catch (error) {
    console.error('Cron job error:', error);

    const executionTime = Date.now() - startTime;

    // Log error
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