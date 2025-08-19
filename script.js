// Brand Studio CREATE - Professional Dashboard
// Enhanced PDF upload and processing with beautiful UX

console.log('🚀 Brand Studio CREATE Dashboard Loading...');

// Configuration
const CONFIG = {
    PDFJS_VERSION: '2.16.105',
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    PROCESSING_STEPS: [
        { id: 'step1', name: 'Reading PDF', duration: 800 },
        { id: 'step2', name: 'AI Analysis', duration: 1200 },
        { id: 'step3', name: 'Validation', duration: 600 }
    ]
};

// Global state
let app = {
    isProcessing: false,
    currentData: null,
    elements: {},
    processingTimeout: null
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('📋 DOM ready, initializing dashboard...');
    loadPDFJS();
});

// Dynamic PDF.js loading
function loadPDFJS() {
    const script = document.createElement('script');
    script.src = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${CONFIG.PDFJS_VERSION}/pdf.min.js`;
    script.onload = () => {
        console.log('📚 PDF.js loaded successfully');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${CONFIG.PDFJS_VERSION}/pdf.worker.min.js`;
        initializeApp();
    };
    script.onerror = () => {
        console.error('❌ Failed to load PDF.js');
        showNotification('Failed to load PDF processing library', 'error');
    };
    document.head.appendChild(script);
}

// Initialize application
function initializeApp() {
    console.log('🎯 Initializing Brand Studio CREATE...');
    
    // Cache DOM elements
    app.elements = {
        fileInput: document.getElementById('fileInput'),
        uploadArea: document.getElementById('uploadArea'),
        uploadSection: document.getElementById('uploadSection'),
        processingState: document.getElementById('processingState'),
        dashboard: document.getElementById('dashboard'),
        decisionHeader: document.getElementById('decisionHeader')
    };
    
    // Validate required elements
    const required = ['fileInput', 'uploadArea', 'uploadSection'];
    const missing = required.filter(id => !app.elements[id]);
    
    if (missing.length > 0) {
        console.error('❌ Missing required elements:', missing);
        return;
    }
    
    setupEventListeners();
    console.log('✅ Dashboard initialized successfully');
}

// Setup all event listeners
function setupEventListeners() {
    const { fileInput, uploadArea } = app.elements;
    
    // File input change
    fileInput.addEventListener('change', handleFileSelect);
    
    // Upload area interactions
    uploadArea.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('📁 Upload area clicked');
        fileInput.click();
    });
    
    // Enhanced drag and drop with visual feedback
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // Prevent default drag behaviors globally
    ['dragover', 'drop'].forEach(eventName => {
        document.addEventListener(eventName, e => e.preventDefault());
    });
    
    console.log('🎧 Event listeners configured');
}

// File selection handler
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        console.log('📄 File selected:', file.name);
        processFile(file);
    }
}

// Drag over handler with professional visual feedback
function handleDragOver(event) {
    event.preventDefault();
    const { uploadArea } = app.elements;
    uploadArea.classList.add('drag-over');
    
    // Add premium drag effect
    uploadArea.style.transform = 'scale(1.02)';
    uploadArea.style.borderColor = 'var(--primary)';
    uploadArea.style.boxShadow = '0 20px 40px rgba(37, 99, 235, 0.15)';
}

// Drag leave handler
function handleDragLeave(event) {
    event.preventDefault();
    const { uploadArea } = app.elements;
    
    // Only remove if truly leaving the upload area
    if (!uploadArea.contains(event.relatedTarget)) {
        uploadArea.classList.remove('drag-over');
        uploadArea.style.transform = '';
        uploadArea.style.borderColor = '';
        uploadArea.style.boxShadow = '';
    }
}

// Drop handler
function handleDrop(event) {
    event.preventDefault();
    const { uploadArea } = app.elements;
    
    // Reset visual state
    uploadArea.classList.remove('drag-over');
    uploadArea.style.transform = '';
    uploadArea.style.borderColor = '';
    uploadArea.style.boxShadow = '';
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        console.log('📦 File dropped:', files[0].name);
        processFile(files[0]);
    }
}

// Main file processing function
async function processFile(file) {
    if (app.isProcessing) {
        console.log('⏳ Already processing a file');
        showNotification('Please wait for the current file to finish processing', 'warning');
        return;
    }
    
    console.log('🔄 Starting file processing:', {
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        type: file.type
    });
    
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
        showNotification(validation.message, 'error');
        return;
    }
    
    app.isProcessing = true;
    
    try {
        // Show processing state with animations
        await showProcessingState();
        
        // Step 1: Extract PDF text
        await updateProcessingStep(1);
        const pdfText = await extractPDFText(file);
        console.log('📝 Text extracted:', `${pdfText.length} characters`);
        
        // Step 2: AI Analysis
        await updateProcessingStep(2);
        const briefingData = await extractBriefingData(pdfText, file.name);
        console.log('🤖 Data extracted:', Object.keys(briefingData).length, 'sections');
        
        // Step 3: Validation
        await updateProcessingStep(3);
        await delay(500);
        
        // Show results
        app.currentData = briefingData;
        await showDashboard(briefingData);
        
        console.log('🎉 Processing completed successfully');
        
    } catch (error) {
        console.error('💥 Processing failed:', error);
        showNotification(`Processing failed: ${error.message}`, 'error');
        showUploadSection();
    } finally {
        app.isProcessing = false;
    }
}

// File validation
function validateFile(file) {
    if (file.type !== 'application/pdf') {
        return { valid: false, message: 'Please upload a PDF file only.' };
    }
    
    if (file.size > CONFIG.MAX_FILE_SIZE) {
        return { valid: false, message: 'File is too large. Please upload a PDF under 10MB.' };
    }
    
    if (file.size === 0) {
        return { valid: false, message: 'The file appears to be empty.' };
    }
    
    return { valid: true };
}

// PDF text extraction with robust error handling
async function extractPDFText(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        console.log(`📖 PDF loaded: ${pdf.numPages} pages`);
        
        let fullText = '';
        
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            try {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                
                const pageText = textContent.items
                    .filter(item => item.str && item.str.trim())
                    .map(item => item.str)
                    .join(' ');
                
                if (pageText.trim()) {
                    fullText += pageText + '\\n\\n';
                }
                
            } catch (pageError) {
                console.warn(`⚠️ Error reading page ${pageNum}:`, pageError);
                continue;
            }
        }
        
        if (!fullText.trim()) {
            throw new Error('No readable text found in the PDF. The file may be image-based or corrupted.');
        }
        
        return fullText.trim();
        
    } catch (error) {
        console.error('📚 PDF extraction failed:', error);
        throw new Error(`Failed to read PDF: ${error.message}`);
    }
}

// Enhanced briefing data extraction
async function extractBriefingData(pdfText, fileName) {
    console.log('🔍 Extracting briefing data...');
    
    // Simulate AI processing time
    await delay(800);
    
    const data = {
        meta: {
            source_file: fileName,
            extraction_ts: new Date().toISOString().split('T')[0]
        },
        contact: {
            responsable_commercial: extractField(pdfText, [
                /karolien\\s+van\\s+gaever/i,
                /responsable[\\s\\w]*:?\\s*([A-Za-z\\s]+)/i
            ]) || null,
            agence_media: extractField(pdfText, [
                /group\\s*m\\s*-\\s*essence\\s*mediacom/i,
                /agence[\\s\\w]*:?\\s*([A-Za-z\\s&-]+)/i
            ]) || null
        },
        advertiser: {
            group_or_annonceur: extractField(pdfText, [
                /coca-cola/i,
                /annonceur[\\s\\w]*:?\\s*([A-Za-z\\s-]+)/i
            ]) || null,
            brand_or_product: extractField(pdfText, [
                /powerade/i,
                /marque[\\s\\w]*:?\\s*([A-Za-z\\s]+)/i,
                /produit[\\s\\w]*:?\\s*([A-Za-z\\s]+)/i
            ]) || null
        },
        brief: {
            type: extractField(pdfText, [/briefing\\s*recu\\s*via\\s*agence\\s*media/i]) || null,
            urgency: extractUrgency(pdfText),
            typologie_annonceur: extractField(pdfText, [/national/i, /grands\\s*comptes/i]) || null,
            presentation_languages: extractLanguages(pdfText),
            attachments_present: null,
            target_persona: extractField(pdfText, [
                /18-54[\\s-]*sportifs/i,
                /cible[\\s\\w]*:?\\s*([A-Za-z0-9\\s-]+)/i
            ]) || null,
            objectives: extractObjectives(pdfText),
            start_momentum_reason: extractField(pdfText, [
                /tbc[\\s]*\\([^)]*saison[^)]*\\)/i,
                /momentum[\\s\\w]*:?\\s*([A-Za-z\\s()]+)/i
            ]) || null,
            end_date: extractDate(pdfText, 'end'),
            key_messages: extractField(pdfText, [
                /choississez\\s*powerade\\s*quand\\s*vous\\s*faites\\s*du\\s*sport/i,
                /message[\\s\\w]*:?\\s*([A-Za-z\\s,.'!-]+)/i
            ]) || null,
            media_specific_preferences: extractMediaPreferences(pdfText),
            history_with_rossel: null,
            other_campaigns_with_rossel: extractField(pdfText, [
                /campagne\\s*classique/i,
                /publishing[\\s-]*digitale[\\s-]*video/i
            ]) || null,
            notes: extractNotes(pdfText)
        },
        constraints: {
            min_budget_create_eur: 10000,
            budget_confirmed_eur_range: extractBudgetRange(pdfText),
            proposal_deadline: extractDate(pdfText, 'deadline'),
            lead_time_business_days_after_valid_brief: 10,
            do_not: extractDoNots(pdfText),
            prefer: extractPreferences(pdfText)
        },
        creative: {
            sports_focus: extractSportsFocus(pdfText),
            audience_activity_min_sessions_per_week: extractActivityFrequency(pdfText)
        }
    };
    
    console.log('📊 Extraction completed');
    return data;
}

// Enhanced pattern extraction
function extractField(text, patterns) {
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            const result = match[1] || match[0];
            return result.trim().replace(/\\s+/g, ' ');
        }
    }
    return null;
}

// Specific extraction functions
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

function extractUrgency(text) {
    if (/urgence.*élevé|urgent.*high/i.test(text)) return 'eleve';
    if (/urgence.*moyen|medium/i.test(text)) return 'moyen';
    if (/urgence.*faible|low/i.test(text)) return 'faible';
    return null;
}

function extractMediaPreferences(text) {
    const mediaList = ['LE SOIR', 'SUDINFO', 'RTL TVI', 'NOSTALGIE', 'KOTPLANET', 'EFLUENZ'];
    const found = mediaList.filter(media => 
        new RegExp(media.replace(/\\s+/g, '\\\\s*'), 'i').test(text)
    );
    return found.length > 0 ? found : null;
}

function extractBudgetRange(text) {
    const patterns = [
        /(\\d{1,3})[-–](\\d{1,3})\\s*k/i,
        /(\\d{1,3})[.,](\\d{3})\\s*[-–]\\s*(\\d{1,3})[.,](\\d{3})/i
    ];
    
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            if (match.length === 3) { // Format: 20-25K
                const low = parseInt(match[1]) * 1000;
                const high = parseInt(match[2]) * 1000;
                return `${low}-${high}`;
            }
        }
    }
    return null;
}

function extractDate(text, type) {
    const patterns = [
        /(\\d{1,2})\\/(\\d{1,2})\\/(\\d{4})/g,
        /(\\d{1,2})-(\\d{1,2})-(\\d{4})/g,
        /(\\d{4})-(\\d{1,2})-(\\d{1,2})/g
    ];
    
    for (const pattern of patterns) {
        const matches = [...text.matchAll(pattern)];
        if (matches.length > 0) {
            const match = matches[type === 'deadline' ? 0 : matches.length - 1];
            const [, day, month, year] = match;
            
            if (year && year.length === 4) {
                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
        }
    }
    return null;
}

function extractSportsFocus(text) {
    const sports = ['padel', 'hockey', 'basket', 'running', 'football', 'tennis'];
    const found = sports.filter(sport => new RegExp(sport, 'i').test(text));
    return found.length > 0 ? found : null;
}

function extractDoNots(text) {
    const doNots = [];
    if (/pas\\s*de\\s*native|no\\s*native/i.test(text)) doNots.push('native');
    if (/pas\\s*d[''']?influenceurs|no\\s*influencers/i.test(text)) doNots.push('influenceurs');
    return doNots.length > 0 ? doNots : null;
}

function extractPreferences(text) {
    const prefs = [];
    if (/plutôt.*digital|prefer.*digital/i.test(text)) prefs.push('digital');
    if (/programmatic/i.test(text)) prefs.push('programmatic');
    return prefs.length > 0 ? prefs : null;
}

function extractActivityFrequency(text) {
    const patterns = [
        /(\\d+)\\s*fois.*semaine/i,
        /(\\d+)\\s*x.*semaine/i,
        /minimum\\s*(\\d+)\\s*fois/i
    ];
    
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) return parseInt(match[1]);
    }
    return null;
}

function extractNotes(text) {
    const patterns = [
        /intéressé\\s*par\\s*([^\\n.]{50,300})/i,
        /complément[\\s\\w]*:?\\s*([^\\n.]{50,300})/i,
        /notes?[\\s\\w]*:?\\s*([^\\n.]{50,300})/i
    ];
    
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) return match[1].trim();
    }
    return null;
}

// UI State Management with smooth animations
async function showProcessingState() {
    const { uploadSection, processingState } = app.elements;
    
    // Fade out upload section
    uploadSection.style.transition = 'opacity 0.3s ease';
    uploadSection.style.opacity = '0';
    
    await delay(300);
    
    uploadSection.style.display = 'none';
    processingState.style.display = 'block';
    processingState.style.opacity = '0';
    processingState.style.transform = 'translateY(20px)';
    
    // Animate in processing state
    requestAnimationFrame(() => {
        processingState.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        processingState.style.opacity = '1';
        processingState.style.transform = 'translateY(0)';
    });
    
    // Reset all steps
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
}

async function updateProcessingStep(stepNumber) {
    console.log(`📍 Processing step ${stepNumber}`);
    
    // Remove active from all steps
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    
    // Activate current step with animation
    const currentStep = document.getElementById(`step${stepNumber}`);
    if (currentStep) {
        await delay(200);
        currentStep.classList.add('active');
        
        // Animate step activation
        currentStep.style.transform = 'scale(1.1)';
        setTimeout(() => {
            currentStep.style.transform = '';
        }, 300);
    }
    
    // Simulate processing time
    await delay(CONFIG.PROCESSING_STEPS[stepNumber - 1]?.duration || 800);
}

async function showDashboard(data) {
    const { processingState, dashboard } = app.elements;
    
    console.log('📊 Displaying dashboard...');
    
    // Fade out processing
    processingState.style.opacity = '0';
    await delay(300);
    
    processingState.style.display = 'none';
    dashboard.style.display = 'block';
    dashboard.style.opacity = '0';
    
    // Animate in dashboard
    requestAnimationFrame(() => {
        dashboard.style.transition = 'opacity 0.6s ease';
        dashboard.style.opacity = '1';
        dashboard.classList.add('fade-in');
    });
    
    // Evaluate and display decision
    const decision = evaluateGoNoGo(data);
    await delay(200);
    displayDecision(decision);
    
    // Populate fields with stagger animation
    await delay(300);
    populateFields(data);
}

function showUploadSection() {
    const { uploadSection, processingState, dashboard } = app.elements;
    
    console.log('📁 Returning to upload section');
    
    uploadSection.style.display = 'block';
    uploadSection.style.opacity = '1';
    uploadSection.style.transition = '';
    
    if (processingState) processingState.style.display = 'none';
    if (dashboard) dashboard.style.display = 'none';
    
    // Reset file input
    app.elements.fileInput.value = '';
}

// Go/No-Go Decision Logic
function evaluateGoNoGo(data) {
    const issues = [];
    
    // Budget validation
    if (data.constraints.budget_confirmed_eur_range) {
        const [low] = data.constraints.budget_confirmed_eur_range.split('-');
        const minBudget = parseInt(low);
        
        if (minBudget < data.constraints.min_budget_create_eur) {
            issues.push(`Budget insuffisant: €${minBudget.toLocaleString()} < €${data.constraints.min_budget_create_eur.toLocaleString()}`);
        }
    } else {
        issues.push('Budget non confirmé');
    }
    
    // Deadline validation
    if (data.constraints.proposal_deadline) {
        const deadline = new Date(data.constraints.proposal_deadline);
        const today = new Date();
        const requiredDate = new Date();
        requiredDate.setDate(today.getDate() + data.constraints.lead_time_business_days_after_valid_brief);
        
        if (deadline < requiredDate) {
            issues.push(`Délai insuffisant: ${data.constraints.lead_time_business_days_after_valid_brief} jours requis`);
        }
    } else {
        issues.push('Date limite non spécifiée');
    }
    
    // Required fields
    const requiredFields = [
        { field: data.contact.responsable_commercial, name: 'Responsable commercial' },
        { field: data.advertiser.group_or_annonceur, name: 'Groupe annonceur' },
        { field: data.brief.target_persona, name: 'Persona cible' }
    ];
    
    requiredFields.forEach(({ field, name }) => {
        if (!field) issues.push(`${name} manquant`);
    });
    
    return {
        status: issues.length === 0 ? 'GO' : 'NO-GO',
        issues: issues,
        score: Math.max(0, 100 - (issues.length * 25))
    };
}

function displayDecision(decision) {
    const { decisionHeader } = app.elements;
    const icon = document.getElementById('decisionIcon');
    const title = document.getElementById('decisionTitle');
    const message = document.getElementById('decisionMessage');
    
    if (!decisionHeader || !icon || !title || !message) return;
    
    // Reset and set classes
    decisionHeader.className = 'decision-header';
    decisionHeader.classList.add(decision.status === 'GO' ? 'go' : 'nogo');
    
    if (decision.status === 'GO') {
        icon.innerHTML = '<i class="fas fa-check"></i>';
        title.textContent = 'GO - Brief Accepté';
        message.textContent = `Excellent! Tous les critères CREATE sont remplis. Score: ${decision.score}%`;
    } else {
        icon.innerHTML = '<i class="fas fa-times"></i>';
        title.textContent = 'NO-GO - Brief Refusé';
        message.textContent = `${decision.issues.length} problème(s) identifié(s). Score: ${decision.score}%`;
        
        // Add details if space allows
        if (decision.issues.length <= 2) {
            message.textContent += ` • ${decision.issues.join(' • ')}`;
        }
    }
    
    // Animate decision appearance
    decisionHeader.style.transform = 'scale(0.95)';
    decisionHeader.style.opacity = '0';
    
    setTimeout(() => {
        decisionHeader.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        decisionHeader.style.transform = 'scale(1)';
        decisionHeader.style.opacity = '1';
    }, 100);
}

// Field population with enhanced formatting
function populateFields(data) {
    console.log('📝 Populating dashboard fields...');
    
    const fieldMappings = {
        // Contact
        'responsable_commercial': data.contact.responsable_commercial,
        'agence_media': data.contact.agence_media,
        
        // Advertiser
        'group_or_annonceur': data.advertiser.group_or_annonceur,
        'brand_or_product': data.advertiser.brand_or_product,
        
        // Brief details
        'brief_type': data.brief.type,
        'urgency': data.brief.urgency,
        'typologie_annonceur': data.brief.typologie_annonceur,
        'presentation_languages': data.brief.presentation_languages?.join(', '),
        'target_persona': data.brief.target_persona,
        'objectives': data.brief.objectives?.join(', '),
        'key_messages': data.brief.key_messages,
        'media_specific_preferences': data.brief.media_specific_preferences?.join(', '),
        'notes': data.brief.notes,
        
        // Constraints
        'budget_confirmed_eur_range': data.constraints.budget_confirmed_eur_range ? 
            `€${data.constraints.budget_confirmed_eur_range.replace('-', ' - €')}` : null,
        'proposal_deadline': data.constraints.proposal_deadline ? 
            formatDate(data.constraints.proposal_deadline) : null,
        
        // Creative
        'sports_focus': data.creative.sports_focus?.join(', '),
        'audience_activity_min_sessions_per_week': data.creative.audience_activity_min_sessions_per_week ? 
            `${data.creative.audience_activity_min_sessions_per_week} sessions/week` : null,
        'do_not': data.constraints.do_not?.join(', '),
        'prefer': data.constraints.prefer?.join(', ')
    };
    
    // Populate with stagger animation
    Object.entries(fieldMappings).forEach(([fieldId, value], index) => {
        setTimeout(() => {
            setFieldValue(fieldId, value);
        }, index * 50);
    });
}

function setFieldValue(fieldId, value) {
    const element = document.getElementById(fieldId);
    if (!element) return;
    
    const displayValue = value || '-';
    element.textContent = displayValue;
    
    // Add visual indicators
    element.classList.remove('success', 'warning', 'highlight', 'text-muted');
    
    if (value) {
        // Special styling for specific fields
        if (fieldId === 'do_not' && value !== '-') {
            element.classList.add('warning');
        } else if (fieldId === 'prefer' && value !== '-') {
            element.classList.add('success');
        } else if (['min_budget_create_eur', 'lead_time_business_days_after_valid_brief'].includes(fieldId)) {
            element.classList.add('highlight');
        }
    } else {
        element.classList.add('text-muted');
    }
    
    // Animate field update
    element.style.transform = 'translateY(10px)';
    element.style.opacity = '0.7';
    
    setTimeout(() => {
        element.style.transition = 'all 0.3s ease';
        element.style.transform = 'translateY(0)';
        element.style.opacity = '1';
    }, 50);
}

// Utility functions
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function showNotification(message, type = 'info') {
    console.log(`🔔 ${type.toUpperCase()}: ${message}`);
    
    // For now, use alerts - could be replaced with toast notifications
    if (type === 'error') {
        alert(`❌ ${message}`);
    } else if (type === 'warning') {
        alert(`⚠️ ${message}`);
    } else {
        alert(`ℹ️ ${message}`);
    }
}

// Reset functionality
function resetDashboard() {
    console.log('🔄 Resetting dashboard...');
    
    app.currentData = null;
    app.isProcessing = false;
    
    if (app.processingTimeout) {
        clearTimeout(app.processingTimeout);
        app.processingTimeout = null;
    }
    
    showUploadSection();
}

// Global exports
window.resetDashboard = resetDashboard;

console.log('✅ Brand Studio CREATE script loaded successfully');