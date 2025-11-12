# Checklist Fusion - Intelligent Audit Checklist Management

A Next.js application for intelligently fusing audit checklists for dual-standard compliance. This application uses AI to analyze and merge checklist items from different compliance standards, significantly reducing time spent on dual-standard audits.

## Features

- **PDF Upload & Parsing**: Upload audit checklist PDFs with automatic parsing using Unstract API
- **Smart Caching**: File hash-based duplicate detection prevents re-parsing of previously uploaded documents
- **AI-Powered Fusion**: OpenAI GPT-4 and embeddings analyze checklist items for intelligent fusion suggestions
- **Interactive Review**: Accept, reject, or edit AI-suggested fusions with side-by-side comparison
- **Professional Export**: Generate PDF exports matching professional audit checklist formatting
- **Responsive UI**: Clean, professional interface built with shadcn/ui and Tailwind CSS

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **AI/ML**: OpenAI GPT-4 & Embeddings
- **PDF Processing**:
  - Unstract API (primary)
  - pdf.js (fallback)
  - pdf-lib (export)
- **State Management**: Zustand

## Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A Supabase project (free tier works)
- OpenAI API key
- Unstract LLMWhisperer API key (optional - app uses local PDF.js parsing as fallback)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd ChecklistAIAI
npm install
```

### 2. Set Up Supabase

**IMPORTANT**: Follow the detailed instructions in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) to avoid permission errors.

Quick version:
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API to get your URL, anon key, and service role key
3. Run the database migrations:
   - Navigate to SQL Editor in Supabase Dashboard
   - Run `supabase/migrations/001_initial_schema.sql`
   - Run `supabase/migrations/002_fix_permissions.sql`

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your API keys:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Unstract LLMWhisperer API Configuration (optional - has local fallback)
UNSTRACT_API_KEY=your-unstract-api-key
UNSTRACT_API_URL=https://llmwhisperer-api.us-central.unstract.com/api/v2

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
```

**⚠️ IMPORTANT**: The `SUPABASE_SERVICE_ROLE_KEY` is required for server-side operations. Get it from Project Settings > API in your Supabase dashboard. Keep it secret!

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Basic Workflow

1. **Upload Checklists**
   - Drag and drop or click to upload the first checklist PDF in the left panel
   - Upload the second checklist PDF in the right panel
   - The app automatically detects duplicates using file hashing

2. **Review Fusion Suggestions**
   - The middle panel displays AI-generated fusion suggestions
   - Each suggestion shows:
     - Similarity score
     - Suggested fused text
     - Source items from both checklists (expandable)
   - Actions available:
     - **Accept**: Use the AI suggestion as-is
     - **Reject**: Skip this fusion
     - **Edit**: Modify the suggested text with full editing capabilities

3. **Generate Fused Checklist**
   - Click "Generate Fused Checklist" once you've reviewed suggestions
   - The app creates a unified checklist containing:
     - All accepted/edited fused items
     - Non-fused items from both checklists
     - Source references for traceability

4. **Export PDF**
   - Click "Export as PDF" to download the fused checklist
   - The PDF matches professional audit checklist formatting
   - Includes metadata about source checklists and fusion decisions

### Performance Features

- **Caching**: Uploaded PDFs are cached in Supabase by file hash
- **Instant Response**: Re-uploading the same file retrieves cached data instantly
- **Progressive Loading**: Clear loading states during PDF parsing and AI analysis
- **Error Handling**: Graceful fallback to local PDF parsing if Unstract API is unavailable

## Project Structure

```
ChecklistAIAI/
├── app/
│   ├── api/
│   │   ├── parse-pdf/      # PDF parsing endpoint
│   │   ├── generate-fusions/ # Fusion generation endpoint
│   │   └── export-pdf/      # PDF export endpoint
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main application page
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── UploadPanel.tsx      # File upload component
│   ├── PdfPreview.tsx       # Checklist preview
│   ├── FusionSuggestionItem.tsx # Fusion suggestion card
│   └── FusionEditModal.tsx  # Edit modal
├── lib/
│   ├── types/
│   │   └── database.ts      # TypeScript types
│   ├── supabase.ts          # Supabase client
│   ├── store.ts             # Zustand state management
│   ├── pdfParser.ts         # PDF parsing logic
│   ├── fusionEngine.ts      # AI fusion engine
│   ├── pdfExporter.ts       # PDF generation
│   └── utils.ts             # Utility functions
├── utils/
│   └── fileHasher.ts        # File hashing utility
├── supabase/
│   └── migrations/          # Database migrations
└── .env.local.example       # Environment template
```

## Database Schema

### Tables

1. **checklists**
   - Stores parsed checklist data
   - Uses file_hash for duplicate detection
   - JSONB field for flexible item storage

2. **fusion_suggestions**
   - Stores AI-generated fusion suggestions
   - Links items from both checklists
   - Includes similarity scores

3. **accepted_fusions**
   - Tracks user decisions (accepted/rejected/edited)
   - Stores custom edited text
   - Links to fusion suggestions

## AI Fusion Algorithm

The fusion engine uses a multi-factor approach:

1. **Text Similarity**: OpenAI embeddings + cosine similarity
2. **Reference Matching**: Boosts similarity for matching regulatory citations
3. **Category Alignment**: Increases score for same-category items
4. **GPT-4 Generation**: Creates comprehensive fused text preserving all requirements

### Fusion Quality Factors

- Similarity threshold: 0.7 (configurable)
- Maximum suggestions: 50 (configurable)
- Context-aware merging that preserves critical requirements
- Professional, audit-appropriate language

## Customization

### Adjusting Similarity Threshold

Edit `app/page.tsx` line 134-137:

```typescript
options: {
  similarityThreshold: 0.7,  // Adjust this (0.0 - 1.0)
  maxSuggestions: 50,
}
```

### Styling

The app uses Tailwind CSS with a custom theme defined in `tailwind.config.ts`. Modify colors, spacing, and other design tokens there.

### PDF Export Format

Customize the PDF layout in `lib/pdfExporter.ts` to match your specific checklist format requirements.

## Troubleshooting

### PDF Parsing Issues

If Unstract API is unavailable, the app automatically falls back to local parsing using pdf.js. The local parser provides basic extraction but may not capture all checklist structure.

**Solution**: Ensure your UNSTRACT_API_KEY is valid, or manually structure parsed content.

### OpenAI Rate Limits

With many items, you might hit rate limits during fusion generation.

**Solution**: Reduce `maxSuggestions` or implement retry logic in `lib/fusionEngine.ts`.

### Supabase Connection

If you see database errors, verify:
- Supabase URL and anon key are correct
- Database migration has been run
- Row Level Security policies allow access

## Contributing

This project was designed for audit professionals. Contributions that improve:
- PDF parsing accuracy
- Fusion suggestion quality
- Export formatting
- Performance optimization

...are especially welcome!

## License

MIT License - See LICENSE file for details

## Support

For issues or questions, please open an issue on the GitHub repository.

---

Built with ❤️ for audit professionals
