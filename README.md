# Brand Studio Create - Briefing Dashboard

A web-based dashboard for automatically processing and analyzing marketing briefings according to CREATE criteria.

## Features

- **PDF Upload**: Drag & drop or click to upload briefing PDFs
- **Automated Extraction**: Extracts structured data from briefings using AI
- **Go/No-Go Decision**: Automatically evaluates briefings against CREATE criteria
- **Visual Dashboard**: Clean, responsive interface showing all extracted information
- **Real-time Processing**: Instant feedback on briefing acceptance/rejection

## How It Works

1. **Upload**: Drop a briefing PDF onto the dashboard
2. **Extract**: The system extracts text and applies the claude.md extraction rules
3. **Analyze**: Evaluates the briefing against CREATE criteria:
   - Minimum budget requirement (€10,000)
   - Lead time requirements (10 business days)
   - Required fields completion
4. **Display**: Shows a comprehensive dashboard with Go/No-Go decision

## Go/No-Go Criteria

### Automatic REJECTION if:
- Budget < €10,000 minimum
- Insufficient lead time (< 10 business days)
- Missing critical information:
  - Responsible commercial contact
  - Advertiser group/name
  - Target persona

### Automatic ACCEPTANCE if:
- All budget requirements met
- Sufficient lead time
- All required fields completed

## Files Structure

```
├── index.html          # Main dashboard interface
├── script.js           # JavaScript functionality
├── styles.css          # Styling and responsive design
├── claude.md           # AI extraction rules and schema
└── README.md           # This documentation
```

## Usage Instructions

1. Open `index.html` in a web browser
2. Upload a briefing PDF by:
   - Clicking "Select PDF File" button, or
   - Dragging and dropping the PDF onto the upload area
3. Wait for processing (typically 2-5 seconds)
4. Review the automated Go/No-Go decision
5. Examine all extracted briefing details in the dashboard

## Technical Implementation

- **Frontend**: Pure HTML/CSS/JavaScript (no framework dependencies)
- **PDF Processing**: PDF.js library for client-side text extraction
- **AI Integration**: Ready for OpenAI/Anthropic API integration
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Development Notes

### Current Implementation
- Uses simulated AI extraction for demo purposes
- Includes the Coca-Cola/Powerade briefing example
- All extraction rules from claude.md are implemented

### Production Readiness
To deploy in production, you'll need to:

1. **Integrate AI Service**: 
   - Add API calls to OpenAI/Anthropic
   - Replace the `simulateExtraction()` function with real AI processing
   - Add error handling for API failures

2. **Add Security**:
   - File upload validation and sanitization
   - API key protection (use server-side proxy)
   - User authentication if required

3. **Database Integration**:
   - Save extracted briefings for tracking
   - Store Go/No-Go decisions and reasons
   - Add briefing history and analytics

## Browser Compatibility

- Chrome 70+ ✅
- Firefox 70+ ✅  
- Safari 14+ ✅
- Edge 79+ ✅

## Demo Data

The dashboard includes demo extraction for the Coca-Cola/Powerade briefing. Upload any PDF containing "Coca-Cola", "Powerade", or "Karolien" to see the full extraction in action.

## License

Internal use only - Rossel Advertising CREATE Team