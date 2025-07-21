# Art Exhibit Documentation Flow

An ultra-minimal Next.js single-page app that visualizes an art exhibit's documentation as a directed graph. The main node represents the exhibit itself, and secondary nodes can represent various types of documentation including audio files, PDFs, external links, text notes, and video embeds.

## Features

- **User Authentication**: Secure login and signup with Supabase
- **Interactive Graph Canvas**: Full-screen React Flow canvas that starts empty for complete creative freedom
- **Exhibit Nodes**: Create nodes with image carousels to showcase exhibit photos
- **Multiple Documentation Types**:
  - 🎵 Audio files (MP3 narration)
  - 📄 PDF documents (catalogues)
  - 🔗 External links (artist bio, press coverage)
  - 📝 Plain text (curator notes)
  - 🎥 Video embeds (walkthroughs, interviews)
  - 🖼️ Images (artwork details, sketches) - supports multiple images with carousel
- **Drag-and-Drop Interface**: Add new nodes by dragging onto the canvas
- **Node Management**: Edit and delete nodes via right-click context menu
- **Connection Drawing**: Click-and-drag to create edges between nodes
- **Responsive Design**: Full viewport canvas with centered modals

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI Library**: shadcn/ui (Tailwind-based components)
- **Graph Visualization**: React Flow
- **Image Carousel**: Embla Carousel
- **State Management**: Zustand
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier available at [supabase.com](https://supabase.com))

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd vargas-luna
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Create a new project on [Supabase](https://supabase.com)
   - Copy your project URL and anon key from the project settings
   - Create a `.env.local` file in the root directory:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Adding Documentation Nodes

1. Click the "Add Node" button in the top-left corner, or
2. Drag anywhere on the canvas to open the node creation dialog
3. Select the documentation type:
   - Audio
   - PDF
   - External Link
   - Text
   - Video
   - Image
4. Enter a title and relevant content/URL
5. Click "Create Node"

### Connecting Nodes

1. Hover over a node to see connection handles
2. Click and drag from the bottom handle of one node to the top handle of another
3. Release to create a connection

### Viewing Documentation

- **Exhibit Node**: Click to open image carousel
- **Audio Node**: Click to open audio player dialog
- **PDF Node**: Click to view embedded PDF
- **Link Node**: Click to open in new tab
- **Text Node**: Click to view formatted text
- **Video Node**: Click to watch embedded video (supports YouTube and MP4)
- **Image Node**: Click to view images in a carousel (supports multiple images)

### Managing Nodes

- **Edit**: Right-click on any node and select "Edit"
- **Delete**: Right-click on any node and select "Delete"

## Project Structure

```
vargas-luna/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Main page component
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ExhibitFlow.tsx    # Main flow canvas component
│   ├── nodes/             # Custom node components
│   ├── modals/            # Modal components for each node type
│   └── dialogs/           # Dialog components for node management
├── lib/                   # Utilities and stores
│   ├── store.ts           # Zustand state management
│   └── types.ts           # TypeScript type definitions
└── public/                # Static assets
    └── images/            # Exhibit images
```

## Data Model

### Node Types

```typescript
type DocumentationType = 'audio' | 'pdf' | 'link' | 'text' | 'video' | 'exhibit' | 'image';

interface DocumentationNodeData {
  id: string;
  type: DocumentationType;
  title: string;
  content?: string;    // For text nodes
  url?: string;        // For audio, pdf, link, video nodes
  images?: string[];   // For exhibit and image nodes carousel
}
```

## Build and Deploy

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

## Future Enhancements

- Persistent storage with API integration
- Export/import graph configurations
- Collaborative editing features
- Additional node types (3D models, interactive timelines)
- Custom node styling options
- Search and filter functionality

## License

This project is open source and available under the MIT License.
