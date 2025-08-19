// Simple, robust PDF upload and processing
console.log('Script loading...');

// Use older, more stable PDF.js version
const PDFJS_VERSION = '2.16.105';
const script = document.createElement('script');
script.src = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;
script.onload = initializePDFJS;
document.head.appendChild(script);

function initializePDFJS() {
    console.log('PDF.js loaded');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;
    console.log('PDF.js worker configured');
    initializeApp();
}

// Global state
let isProcessing = false;

function initializeApp() {
    console.log('Initializing app...');
    
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    
    if (!fileInput || !uploadArea) {
        console.error('Required elements not found');
        return;
    }
    
    // File input change event
    fileInput.addEventListener('change', function(e) {
        console.log('File input changed');
        const file = e.target.files[0];
        if (file) {
            handleFileUpload(file);
        }
    });
    
    // Click to upload
    uploadArea.addEventListener('click', function(e) {
        console.log('Upload area clicked');
        e.preventDefault();
        fileInput.click();
    });
    
    // Drag and drop
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.style.borderColor = '#007bff';
        uploadArea.style.backgroundColor = '#f8f9ff';
    });
    
    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadArea.style.borderColor = '#cbd5e1';
        uploadArea.style.backgroundColor = 'white';
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.style.borderColor = '#cbd5e1';
        uploadArea.style.backgroundColor = 'white';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });
    
    console.log('App initialized successfully');
}

async function handleFileUpload(file) {
    if (isProcessing) {
        console.log('Already processing a file');
        return;
    }
    
    console.log('Handling file upload:', {
        name: file.name,
        size: file.size,
        type: file.type
    });
    
    // Validate file
    if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file only.');
        return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
        alert('File is too large. Please upload a PDF under 10MB.');
        return;
    }
    
    isProcessing = true;
    
    try {
        // Show processing state
        showProcessing();
        
        // Extract text from PDF
        const pdfText = await extractPDFText(file);
        console.log('PDF text extracted, length:', pdfText.length);
        
        // Extract briefing data
        const briefingData = extractBriefingData(pdfText, file.name);
        console.log('Briefing data:', briefingData);
        
        // Show dashboard
        showDashboard(briefingData);
        
    } catch (error) {
        console.error('Error processing file:', error);
        alert('Error processing PDF: ' + error.message);
        showUploadSection();
    } finally {
        isProcessing = false;
    }
}

async function extractPDFText(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        
        let fullText = '';
        
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            const pageText = textContent.items
                .map(item => item.str)
                .join(' ');
            
            fullText += pageText + '\\n\\n';
        }
        
        if (!fullText.trim()) {
            throw new Error('No text found in PDF');
        }
        
        return fullText;
        
    } catch (error) {
        console.error('PDF extraction error:', error);
        throw new Error('Failed to extract text from PDF: ' + error.message);
    }
}

function extractBriefingData(pdfText, fileName) {
    const lowerText = pdfText.toLowerCase();
    
    // Simple pattern matching for demo
    const data = {
        meta: {
            source_file: fileName,
            extraction_ts: new Date().toISOString().split('T')[0]
        },
        contact: {
            responsable_commercial: extractPattern(pdfText, /karolien[\\s]+van[\\s]+gaever/i) || 
                                  extractPattern(pdfText, /responsable[\\s]*:?[\\s]*([a-z\\s]+)/i),
            agence_media: extractPattern(pdfText, /group[\\s]*m[\\s]*-[\\s]*essence[\\s]*mediacom/i) ||
                         extractPattern(pdfText, /agence[\\s]*:?[\\s]*([a-z\\s]+)/i)
        },
        advertiser: {
            group_or_annonceur: extractPattern(pdfText, /coca-cola/i) || 
                               extractPattern(pdfText, /annonceur[\\s]*:?[\\s]*([a-z\\s]+)/i),
            brand_or_product: extractPattern(pdfText, /powerade/i) ||
                             extractPattern(pdfText, /marque[\\s]*:?[\\s]*([a-z\\s]+)/i)
        },
        brief: {
            type: extractPattern(pdfText, /briefing[\\s]*recu[\\s]*via[\\s]*agence[\\s]*media/i),
            urgency: null,
            typologie_annonceur: extractPattern(pdfText, /national/i) || extractPattern(pdfText, /grands[\\s]*comptes/i),
            presentation_languages: extractLanguages(pdfText),
            attachments_present: null,
            target_persona: extractPattern(pdfText, /18-54[\\s]*-?[\\s]*sportifs/i) ||
                           extractPattern(pdfText, /cible[\\s]*:?[\\s]*([a-z0-9\\s-]+)/i),
            objectives: extractObjectives(pdfText),
            start_momentum_reason: extractPattern(pdfText, /tbc[\\s]*\\([^)]*saison[^)]*\\)/i),
            end_date: null,
            key_messages: extractPattern(pdfText, /choississez[\\s]*powerade[\\s]*quand[\\s]*vous[\\s]*faites[\\s]*du[\\s]*sport/i) ||
                         extractPattern(pdfText, /message[\\s]*:?[\\s]*([a-z\\s]+)/i),
            media_specific_preferences: extractMediaPreferences(pdfText),
            history_with_rossel: null,
            other_campaigns_with_rossel: extractPattern(pdfText, /campagne[\\s]*classique/i),
            notes: extractNotes(pdfText)
        },
        constraints: {
            min_budget_create_eur: 10000,
            budget_confirmed_eur_range: extractBudgetRange(pdfText),
            proposal_deadline: extractDate(pdfText),
            lead_time_business_days_after_valid_brief: 10,
            do_not: extractDoNots(pdfText),
            prefer: extractPreferences(pdfText)
        },
        creative: {
            sports_focus: extractSports(pdfText),
            audience_activity_min_sessions_per_week: extractActivityFrequency(pdfText)
        }
    };
    
    return data;
}

// Helper functions for extraction
function extractPattern(text, pattern) {
    const match = text.match(pattern);
    return match ? match[1] || match[0] : null;
}

function extractLanguages(text) {
    const languages = [];
    if (/anglais/i.test(text)) languages.push('Anglais');
    if (/français/i.test(text)) languages.push('Français');
    if (/néerlandais/i.test(text)) languages.push('Néerlandais');
    return languages.length > 0 ? languages : null;
}

function extractObjectives(text) {
    const objectives = [];
    if (/awareness/i.test(text)) objectives.push('awareness');
    if (/consideration/i.test(text)) objectives.push('consideration');
    if (/activation|conversion/i.test(text)) objectives.push('activation_conversion');
    return objectives.length > 0 ? objectives : null;
}

function extractMediaPreferences(text) {
    const media = [];
    if (/le[\\s]*soir/i.test(text)) media.push('LE SOIR');
    if (/sudinfo/i.test(text)) media.push('SUDINFO');
    if (/rtl/i.test(text)) media.push('RTL');
    return media.length > 0 ? media : null;
}

function extractBudgetRange(text) {
    const match = text.match(/(\\d{1,3})[-–](\\d{1,3})k/i);
    if (match) {
        const low = parseInt(match[1]) * 1000;
        const high = parseInt(match[2]) * 1000;
        return `${low}-${high}`;
    }
    return null;
}

function extractDate(text) {
    const match = text.match(/(\\d{1,2})\\/(\\d{1,2})\\/(\\d{4})/);
    if (match) {
        const [, day, month, year] = match;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return null;
}

function extractSports(text) {
    const sports = [];
    if (/padel/i.test(text)) sports.push('padel');
    if (/hockey/i.test(text)) sports.push('hockey');
    if (/basket/i.test(text)) sports.push('basket');
    if (/running/i.test(text)) sports.push('running');
    return sports.length > 0 ? sports : null;
}

function extractDoNots(text) {
    const doNots = [];
    if (/pas[\\s]*de[\\s]*native/i.test(text)) doNots.push('native');
    if (/pas[\\s]*d.influenceurs/i.test(text)) doNots.push('influenceurs');
    return doNots.length > 0 ? doNots : null;
}

function extractPreferences(text) {
    const prefs = [];
    if (/plutôt[\\s]*.*digital/i.test(text)) prefs.push('digital');
    return prefs.length > 0 ? prefs : null;
}

function extractActivityFrequency(text) {
    const match = text.match(/(\\d+)[\\s]*fois[\\s]*.*semaine/i);
    return match ? parseInt(match[1]) : null;
}

function extractNotes(text) {
    // Look for the notes section
    if (/intéressé[\\s]*par/i.test(text)) {
        const startIndex = text.toLowerCase().indexOf('intéressé par');
        return text.substring(startIndex, Math.min(text.length, startIndex + 200)).trim();
    }
    return null;
}

// UI Functions
function showProcessing() {
    console.log('Showing processing state');
    const uploadSection = document.getElementById('uploadSection');
    const processingState = document.getElementById('processingState');
    
    if (uploadSection) uploadSection.style.display = 'none';
    if (processingState) processingState.style.display = 'block';
}

function showUploadSection() {
    console.log('Showing upload section');
    const uploadSection = document.getElementById('uploadSection');
    const processingState = document.getElementById('processingState');
    const dashboard = document.getElementById('dashboard');
    
    if (uploadSection) uploadSection.style.display = 'block';
    if (processingState) processingState.style.display = 'none';
    if (dashboard) dashboard.style.display = 'none';
}

function showDashboard(data) {
    console.log('Showing dashboard with data:', data);
    
    const uploadSection = document.getElementById('uploadSection');
    const processingState = document.getElementById('processingState');
    const dashboard = document.getElementById('dashboard');
    
    if (uploadSection) uploadSection.style.display = 'none';
    if (processingState) processingState.style.display = 'none';
    if (dashboard) dashboard.style.display = 'block';
    
    // Evaluate Go/No-Go
    const decision = evaluateDecision(data);
    displayDecision(decision);
    
    // Populate fields
    populateFields(data);
}

function evaluateDecision(data) {
    const issues = [];
    
    // Check budget
    if (data.constraints.budget_confirmed_eur_range) {
        const [low] = data.constraints.budget_confirmed_eur_range.split('-');
        if (parseInt(low) < 10000) {
            issues.push('Budget insuffisant');
        }
    } else {
        issues.push('Budget non confirmé');
    }
    
    // Check required fields
    if (!data.contact.responsable_commercial) issues.push('Contact manquant');
    if (!data.advertiser.group_or_annonceur) issues.push('Annonceur manquant');
    if (!data.brief.target_persona) issues.push('Persona manquant');
    
    return {
        status: issues.length === 0 ? 'GO' : 'NO-GO',
        issues: issues
    };
}

function displayDecision(decision) {
    const header = document.getElementById('decisionHeader');
    const icon = document.getElementById('decisionIcon');
    const title = document.getElementById('decisionTitle');
    const message = document.getElementById('decisionMessage');
    
    if (!header || !icon || !title || !message) return;
    
    header.className = 'decision-header ' + (decision.status === 'GO' ? 'go' : 'nogo');
    
    if (decision.status === 'GO') {
        icon.textContent = '✓';
        title.textContent = 'GO - Brief Accepté';
        message.textContent = 'Tous les critères CREATE sont remplis.';
    } else {
        icon.textContent = '✗';
        title.textContent = 'NO-GO - Brief Refusé';
        message.textContent = `Problèmes: ${decision.issues.join(', ')}`;
    }
}

function populateFields(data) {
    // Contact
    setField('responsable_commercial', data.contact.responsable_commercial);
    setField('agence_media', data.contact.agence_media);
    
    // Advertiser
    setField('group_or_annonceur', data.advertiser.group_or_annonceur);
    setField('brand_or_product', data.advertiser.brand_or_product);
    
    // Brief
    setField('brief_type', data.brief.type);
    setField('urgency', data.brief.urgency);
    setField('typologie_annonceur', data.brief.typologie_annonceur);
    setField('presentation_languages', data.brief.presentation_languages?.join(', '));
    setField('target_persona', data.brief.target_persona);
    setField('objectives', data.brief.objectives?.join(', '));
    setField('key_messages', data.brief.key_messages);
    setField('media_specific_preferences', data.brief.media_specific_preferences?.join(', '));
    setField('notes', data.brief.notes);
    
    // Constraints
    setField('budget_confirmed_eur_range', 
        data.constraints.budget_confirmed_eur_range ? 
        `€${data.constraints.budget_confirmed_eur_range.replace('-', ' - €')}` : null);
    setField('proposal_deadline', data.constraints.proposal_deadline);
    
    // Creative
    setField('sports_focus', data.creative.sports_focus?.join(', '));
    setField('audience_activity_min_sessions_per_week', 
        data.creative.audience_activity_min_sessions_per_week ? 
        `${data.creative.audience_activity_min_sessions_per_week} sessions/week` : null);
    setField('do_not', data.constraints.do_not?.join(', '));
    setField('prefer', data.constraints.prefer?.join(', '));
}

function setField(fieldId, value) {
    const element = document.getElementById(fieldId);
    if (element) {
        element.textContent = value || '-';
    }
}

// Reset function
function resetDashboard() {
    console.log('Resetting dashboard');
    showUploadSection();
    
    // Clear file input
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';
    
    isProcessing = false;
}

// Make reset available globally
window.resetDashboard = resetDashboard;

console.log('Script loaded successfully');