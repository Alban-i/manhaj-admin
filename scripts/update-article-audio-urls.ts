/**
 * Script to update article content to use new media URLs after migration.
 * This script replaces old audio URLs in article content with new media URLs.
 */

import { createClient } from '@/providers/supabase/server-role';

interface MediaMapping {
  oldUrl: string;
  newUrl: string;
  originalName: string;
}

const updateArticleAudioUrls = async () => {
  const supabase = await createClient();
  
  try {
    console.log('Starting article audio URL updates...');
    
    // 1. Get all media entries for audio files
    const { data: mediaFiles, error: mediaError } = await supabase
      .from('media')
      .select('*')
      .eq('media_type', 'audio');
    
    if (mediaError) {
      throw mediaError;
    }
    
    if (!mediaFiles || mediaFiles.length === 0) {
      console.log('No audio media files found.');
      return;
    }
    
    // 2. Create mapping between old and new URLs
    const urlMappings: MediaMapping[] = [];
    
    for (const media of mediaFiles) {
      // Generate old URL (from audios bucket)
      const { data: { publicUrl: oldUrl } } = supabase.storage
        .from('audios')
        .getPublicUrl(media.file_name);
      
      urlMappings.push({
        oldUrl,
        newUrl: media.url,
        originalName: media.original_name
      });
    }
    
    console.log(`Found ${urlMappings.length} audio URL mappings.`);
    
    // 3. Get all article translations
    const { data: articles, error: articlesError } = await supabase
      .from('article_translations')
      .select('id, content, title');

    if (articlesError) {
      throw articlesError;
    }

    if (!articles || articles.length === 0) {
      console.log('No article translations found.');
      return;
    }

    console.log(`Processing ${articles.length} article translations...`);
    
    // 4. Update each article's content
    let updatedCount = 0;
    
    for (const article of articles) {
      let updatedContent = article.content;
      let hasChanges = false;
      
      // Replace each old URL with new URL
      for (const mapping of urlMappings) {
        const oldUrlRegex = new RegExp(mapping.oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        if (oldUrlRegex.test(updatedContent)) {
          updatedContent = updatedContent.replace(oldUrlRegex, mapping.newUrl);
          hasChanges = true;
          console.log(`  → Updated URL in article "${article.title}": ${mapping.originalName}`);
        }
      }
      
      // Update the article translation if changes were made
      if (hasChanges) {
        const { error: updateError } = await supabase
          .from('article_translations')
          .update({ content: updatedContent })
          .eq('id', article.id);
        
        if (updateError) {
          console.error(`Error updating article "${article.title}":`, updateError);
          continue;
        }
        
        updatedCount++;
        console.log(`✓ Updated article: "${article.title}"`);
      }
    }
    
    console.log('');
    console.log(`Successfully updated ${updatedCount} articles.`);
    console.log('Audio URL migration completed!');
    
  } catch (error) {
    console.error('URL update failed:', error);
    process.exit(1);
  }
};

// Run the update
if (require.main === module) {
  updateArticleAudioUrls()
    .then(() => {
      console.log('URL update script completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('URL update script failed:', error);
      process.exit(1);
    });
}

export default updateArticleAudioUrls;