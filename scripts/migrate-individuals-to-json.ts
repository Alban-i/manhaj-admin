/**
 * Migration Script: Backfill description_json for existing individuals
 *
 * This script parses existing HTML description using TipTap's generateJSON utility
 * and stores the JSON representation in the description_json column.
 *
 * Usage:
 *   bun run scripts/migrate-individuals-to-json.ts
 *   bun run scripts/migrate-individuals-to-json.ts --dry-run
 *   bun run scripts/migrate-individuals-to-json.ts --batch-size=10
 */

import { createClient } from '@supabase/supabase-js';
import { generateJSON } from '@tiptap/html';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Strike from '@tiptap/extension-strike';
import Code from '@tiptap/extension-code';
import CodeBlock from '@tiptap/extension-code-block';
import Heading from '@tiptap/extension-heading';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Blockquote from '@tiptap/extension-blockquote';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import HardBreak from '@tiptap/extension-hard-break';
import Link from '@tiptap/extension-link';
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table';
import Image from '@tiptap/extension-image';
import Highlight from '@tiptap/extension-highlight';
import { Node, Mark } from '@tiptap/core';

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// Create Supabase client with service key for full access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const batchSizeArg = args.find((arg) => arg.startsWith('--batch-size='));
const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1], 10) : 50;

// Custom extensions for parsing
const AudioExtension = Node.create({
  name: 'audio',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      src: { default: null },
      title: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: 'audio[data-audio="true"]' }];
  },
});

const VideoExtension = Node.create({
  name: 'video',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      src: { default: null },
      title: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: 'video[data-video="true"]' }];
  },
});

const CustomDocumentExtension = Node.create({
  name: 'customDocument',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      src: { default: null },
      title: { default: null },
      fileType: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-document="true"]' }];
  },
});

const DynamicPostReferenceExtension = Node.create({
  name: 'dynamicPostReference',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      postId: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-type="dynamic-post-reference"]' }];
  },
});

const QuoteWithSourceExtension = Node.create({
  name: 'quoteWithSource',
  group: 'block',
  content: 'block+',
  addAttributes() {
    return {
      sourceLabel: { default: '' },
      sourceUrl: { default: null },
      direction: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: 'blockquote[data-quote-type="quote-with-source"]' }];
  },
});

const QuoteWithTranslationExtension = Node.create({
  name: 'quoteWithTranslation',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      original: { default: '' },
      translation: { default: '' },
      sourceLabel: { default: '' },
      sourceUrl: { default: null },
      style: { default: 'regular' },
    };
  },
  parseHTML() {
    return [{ tag: 'blockquote[data-quote-type="quote-with-translation"]' }];
  },
});

const GlossaryTermMark = Mark.create({
  name: 'glossaryTerm',
  addAttributes() {
    return {
      termId: { default: null },
      definition: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: 'span.glossary-term' }];
  },
});

const CustomImageExtension = Image.extend({
  name: 'customImage',
  addAttributes() {
    return {
      ...this.parent?.(),
      legend: { default: '' },
      alignment: { default: 'center' },
    };
  },
});

// Configure TipTap extensions for parsing
const extensions = [
  Document.extend({
    content: 'block+',
  }),
  Paragraph,
  Text,
  Bold,
  Italic,
  Strike,
  Code,
  CodeBlock,
  Heading.configure({ levels: [1, 2, 3, 4, 5, 6] }),
  BulletList,
  OrderedList,
  ListItem,
  Blockquote,
  HorizontalRule,
  HardBreak,
  Link,
  Table,
  TableRow,
  TableHeader,
  TableCell,
  CustomImageExtension,
  Highlight,
  AudioExtension,
  VideoExtension,
  CustomDocumentExtension,
  DynamicPostReferenceExtension,
  QuoteWithSourceExtension,
  QuoteWithTranslationExtension,
  GlossaryTermMark,
];

async function migrateIndividuals() {
  console.log('Starting description_json migration for individuals...');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Batch size: ${batchSize}`);
  console.log('');

  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  // Fetch individuals without description_json
  const { data: individuals, error: fetchError } = await supabase
    .from('individuals')
    .select('id, slug, description, description_json')
    .is('description_json', null)
    .not('description', 'is', null)
    .order('created_at', { ascending: false })
    .limit(batchSize);

  if (fetchError) {
    console.error('Error fetching individuals:', fetchError);
    process.exit(1);
  }

  if (!individuals || individuals.length === 0) {
    console.log('No individuals found without description_json. Migration complete!');
    return;
  }

  console.log(`Found ${individuals.length} individuals to migrate.\n`);

  for (const individual of individuals) {
    processed++;
    console.log(`[${processed}/${individuals.length}] Processing: ${individual.slug}`);

    if (!individual.description || individual.description.trim() === '') {
      console.log('  Skipped: Empty description');
      skipped++;
      continue;
    }

    try {
      // Parse HTML to JSON using TipTap
      const json = generateJSON(individual.description, extensions);

      if (!json || !json.content) {
        console.log('  Skipped: Failed to generate JSON');
        skipped++;
        continue;
      }

      console.log(`  Parsed: ${json.content.length} nodes`);

      if (dryRun) {
        console.log('  DRY RUN: Would update individual');
        succeeded++;
        continue;
      }

      // Update the individual with description_json
      const { error: updateError } = await supabase
        .from('individuals')
        .update({ description_json: json })
        .eq('id', individual.id);

      if (updateError) {
        console.error(`  Error updating: ${updateError.message}`);
        failed++;
        continue;
      }

      console.log('  Success: Updated description_json');
      succeeded++;
    } catch (error) {
      console.error(`  Error parsing: ${error}`);
      failed++;
    }
  }

  console.log('\n--- Migration Summary ---');
  console.log(`Total processed: ${processed}`);
  console.log(`Succeeded: ${succeeded}`);
  console.log(`Failed: ${failed}`);
  console.log(`Skipped: ${skipped}`);

  if (!dryRun && individuals.length === batchSize) {
    console.log(`\nNote: Batch limit reached. Run again to continue migration.`);
  }
}

// Run the migration
migrateIndividuals()
  .then(() => {
    console.log('\nMigration script completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
