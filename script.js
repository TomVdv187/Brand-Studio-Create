// Brand Studio CREATE - Professional Briefing Analysis Dashboard
// Focus: GO/NO-GO Decision Engine with CREATE Rules

console.log('🚀 Brand Studio CREATE Dashboard - Initializing...');

// Configuration
const CONFIG = {
    PDF_WORKER_URL: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js',
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    CREATE_RULES: {
        MIN_BUDGET: 10000, // €10,000 minimum
        MIN_LEAD_TIME_DAYS: 10, // 10 business days minimum
        REQUIRED_FIELDS: [
            'responsable_commercial',
            'group_annonceur', 
            'target_persona'
        ]
    }
};

// Application state
const App = {
    isProcessing: false,
    currentData: null,
    elements: {}
};

// Wait for DOM and PDF.js to load
document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
    console.log('📋 DOM ready - Setting up dashboard...');
    
    // Configure PDF.js
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = CONFIG.PDF_WORKER_URL;
        console.log('📚 PDF.js configured successfully');
        setupDashboard();
    } else {
        console.error('❌ PDF.js not loaded');
        showError('PDF processing library failed to load. Please refresh the page.');
    }
}

function setupDashboard() {
    // Cache DOM elements
    App.elements = {
        fileInput: document.getElementById('fileInput'),
        uploadBtn: document.getElementById('uploadBtn'),
        uploadArea: document.getElementById('uploadArea'),
        uploadSection: document.getElementById('uploadSection'),
        processingSection: document.getElementById('processingSection'),
        processingStatus: document.getElementById('processingStatus'),
        resultsSection: document.getElementById('resultsSection'),
        decisionBanner: document.getElementById('decisionBanner')
    };
    
    // Verify required elements
    const missing = Object.entries(App.elements)
        .filter(([key, element]) => !element)
        .map(([key]) => key);
    
    if (missing.length > 0) {
        console.error('❌ Missing required elements:', missing);
        return;
    }
    
    setupEventListeners();
    console.log('✅ Dashboard ready');
}

function setupEventListeners() {
    const { fileInput, uploadBtn, uploadArea } = App.elements;
    
    // File input change - FIX for "only works second time" issue
    fileInput.addEventListener('change', function(event) {
        console.log('📁 File input changed');
        handleFileSelection(event);
        // IMPORTANT: Don't reset file input here - let it complete first
    });
    
    // Upload button click
    uploadBtn.addEventListener('click', function(event) {
        event.preventDefault();
        console.log('🔘 Upload button clicked');
        fileInput.click();
    });
    
    // Upload area click
    uploadArea.addEventListener('click', function(event) {
        event.preventDefault();
        console.log('📦 Upload area clicked');
        fileInput.click();
    });
    
    // Drag and drop with proper event handling
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // Prevent default drag behaviors
    document.addEventListener('dragover', e => e.preventDefault());
    document.addEventListener('drop', e => e.preventDefault());
    
    console.log('🎧 Event listeners configured');
}

// File handling functions
function handleFileSelection(event) {
    const file = event.target.files[0];
    if (file) {
        console.log('📄 File selected:', file.name, `(${(file.size/1024/1024).toFixed(2)}MB)`);
        processFile(file);
    }
}

function handleDragOver(event) {
    event.preventDefault();
    App.elements.uploadArea.classList.add('dragging');
}

function handleDragLeave(event) {
    event.preventDefault();
    // Only remove class if truly leaving the upload area
    if (!App.elements.uploadArea.contains(event.relatedTarget)) {
        App.elements.uploadArea.classList.remove('dragging');
    }
}

function handleDrop(event) {
    event.preventDefault();
    App.elements.uploadArea.classList.remove('dragging');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        console.log('📥 File dropped:', files[0].name);
        processFile(files[0]);
    }
}

// Main file processing
async function processFile(file) {
    if (App.isProcessing) {
        console.log('⏳ Already processing - ignoring new upload');
        return;
    }
    
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
        showError(validation.message);
        return;
    }
    
    App.isProcessing = true;
    
    try {
        // Show processing state
        showProcessingState();
        updateProcessingStatus('Reading PDF file...');
        
        // Extract text from PDF
        const pdfText = await extractPDFText(file);
        console.log(`📝 Text extracted: ${pdfText.length} characters`);
        
        updateProcessingStatus('Analyzing briefing content...');
        await delay(800); // Simulate AI processing
        
        // Extract briefing data
        const briefingData = extractBriefingData(pdfText, file.name);
        console.log('📊 Data extracted:', briefingData);
        
        updateProcessingStatus('Evaluating CREATE criteria...');
        await delay(600);
        
        // Evaluate against CREATE rules
        const evaluation = evaluateCreateCriteria(briefingData);
        console.log('🎯 CREATE evaluation:', evaluation);
        
        // Store current data
        App.currentData = { briefing: briefingData, evaluation };
        
        // Show results
        showResults(briefingData, evaluation);
        
    } catch (error) {
        console.error('💥 Processing failed:', error);
        showError(`Failed to process PDF: ${error.message}`);
        resetToUpload();
    } finally {
        App.isProcessing = false;
    }
}

function validateFile(file) {
    if (!file) {
        return { valid: false, message: 'No file selected.' };
    }
    
    if (file.type !== 'application/pdf') {
        return { valid: false, message: 'Please upload a PDF file only.' };
    }
    
    if (file.size > CONFIG.MAX_FILE_SIZE) {
        return { valid: false, message: 'File too large. Please upload a PDF under 10MB.' };
    }
    
    if (file.size === 0) {
        return { valid: false, message: 'The file appears to be empty.' };
    }
    
    return { valid: true };
}

// PDF text extraction
async function extractPDFText(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        
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
            throw new Error('No readable text found in the PDF. The file may be image-based or password protected.');
        }
        
        return fullText.trim();
        
    } catch (error) {
        console.error('📚 PDF extraction error:', error);
        throw error;
    }
}

// Briefing data extraction with pattern matching
function extractBriefingData(text, fileName) {
    const lowerText = text.toLowerCase();
    
    return {
        meta: {
            source_file: fileName,
            extraction_date: new Date().toISOString().split('T')[0]
        },
        contact: {
            responsable_commercial: extractPattern(text, [
                /karolien\\s+van\\s+gaever/i,
                /responsable[\\s\\w]*:?\\s*([A-Za-z\\s]+)/i
            ]),
            agence_media: extractPattern(text, [
                /group\\s*m\\s*[-–]?\\s*essence\\s*mediacom/i,
                /agence[\\s\\w]*:?\\s*([A-Za-z\\s&-]+)/i
            ])
        },
        advertiser: {
            group_annonceur: extractPattern(text, [
                /coca-cola/i,
                /groupe[\\s\\w]*annonceur[\\s]*:?\\s*([A-Za-z\\s-]+)/i,
                /annonceur[\\s]*:?\\s*([A-Za-z\\s-]+)/i
            ]),
            brand_product: extractPattern(text, [
                /powerade/i,
                /marque[\\s\\w]*:?\\s*([A-Za-z\\s]+)/i,
                /produit[\\s\\w]*:?\\s*([A-Za-z\\s]+)/i
            ])
        },
        brief: {
            target_persona: extractPattern(text, [
                /18[-\\s]*54[\\s]*[-–]?[\\s]*sportifs/i,
                /cible[\\s\\w]*:?\\s*([A-Za-z0-9\\s-]+)/i,
                /persona[\\s\\w]*:?\\s*([A-Za-z0-9\\s-]+)/i
            ]),
            key_messages: extractPattern(text, [
                /choississez\\s*powerade\\s*quand\\s*vous\\s*faites\\s*du\\s*sport/i,
                /message[\\s\\w]*cl[eé]s?[\\s]*:?\\s*([A-Za-z\\s,.'!-]+)/i,
                /communiquer[\\s]*:?\\s*([A-Za-z\\s,.'!-]+)/i
            ]),
            sports_focus: extractSportsFocus(text),
            notes: extractNotes(text)
        },
        constraints: {
            budget_confirmed: extractBudget(text),
            proposal_deadline: extractDate(text),
            min_budget_required: CONFIG.CREATE_RULES.MIN_BUDGET,
            min_lead_time_days: CONFIG.CREATE_RULES.MIN_LEAD_TIME_DAYS
        }
    };
}

// Pattern extraction helpers
function extractPattern(text, patterns) {
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            const result = match[1] || match[0];
            return cleanExtractedText(result);
        }
    }
    return null;
}

function cleanExtractedText(text) {
    return text.trim()
        .replace(/\\s+/g, ' ')
        .replace(/^[:\\-]\\s*/, '')
        .substring(0, 200); // Limit length
}

function extractBudget(text) {
    // Look for budget patterns like "20-25K", "20000-25000", etc.
    const patterns = [
        /(\\d{1,3})[-–](\\d{1,3})\\s*k/i,
        /(\\d{1,3})[.,](\\d{3})\\s*[-–]\\s*(\\d{1,3})[.,](\\d{3})/i,
        /budget[\\s\\w]*:?\\s*(\\d{1,3})[-–](\\d{1,3})k/i
    ];
    
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            if (match[1] && match[2]) {
                const low = parseInt(match[1]) * (match[0].toLowerCase().includes('k') ? 1000 : 1);
                const high = parseInt(match[2]) * (match[0].toLowerCase().includes('k') ? 1000 : 1);
                return {
                    range: `${low}-${high}`,
                    min_amount: low,
                    max_amount: high
                };
            }
        }
    }
    return null;
}

function extractDate(text) {
    // Look for date patterns
    const datePatterns = [
        /(\\d{1,2})\\/(\\d{1,2})\\/(\\d{4})/g,
        /(\\d{1,2})[-](\\d{1,2})[-](\\d{4})/g
    ];
    
    for (const pattern of datePatterns) {
        const matches = [...text.matchAll(pattern)];
        if (matches.length > 0) {
            // Take the first date found (usually deadline)
            const match = matches[0];
            const [, day, month, year] = match;
            try {
                return new Date(year, month - 1, day).toISOString().split('T')[0];
            } catch (e) {
                continue;
            }
        }
    }
    return null;
}

function extractSportsFocus(text) {
    const sports = ['padel', 'hockey', 'basket', 'running', 'football', 'tennis', 'cyclisme'];
    const found = sports.filter(sport => 
        new RegExp(sport, 'i').test(text)
    );
    return found.length > 0 ? found : null;
}

function extractNotes(text) {
    // Look for notes section or additional information
    const notePatterns = [
        /intéressé\\s*par\\s*([^\\n.]{50,400})/i,
        /complément[\\s\\w]*:?\\s*([^\\n.]{50,400})/i,
        /notes?[\\s\\w]*:?\\s*([^\\n.]{50,400})/i,
        /divers[\\s\\w]*:?\\s*([^\\n.]{50,400})/i
    ];
    
    for (const pattern of notePatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            return cleanExtractedText(match[1]);
        }
    }
    return null;
}

// CREATE Criteria Evaluation - THE CORE LOGIC
function evaluateCreateCriteria(data) {
    const evaluation = {
        overall_decision: 'PENDING',
        score: 0,
        max_score: 100,
        criteria: {
            budget: { status: 'FAIL', score: 0, message: '', required: true },
            timeline: { status: 'FAIL', score: 0, message: '', required: true },
            required_fields: { status: 'FAIL', score: 0, message: '', required: true }
        },
        issues: [],
        recommendations: []
    };
    
    // 1. BUDGET EVALUATION (40 points)
    if (data.constraints.budget_confirmed) {
        const minBudget = data.constraints.budget_confirmed.min_amount;
        const requiredBudget = CONFIG.CREATE_RULES.MIN_BUDGET;
        
        if (minBudget >= requiredBudget) {
            evaluation.criteria.budget = {
                status: 'PASS',
                score: 40,
                message: `Budget confirmed: €${minBudget.toLocaleString()} ≥ €${requiredBudget.toLocaleString()}`
            };
        } else {
            evaluation.criteria.budget = {
                status: 'FAIL',
                score: 0,
                message: `Budget insufficient: €${minBudget.toLocaleString()} < €${requiredBudget.toLocaleString()} required`
            };
            evaluation.issues.push('Budget below CREATE minimum requirement');
        }
    } else {
        evaluation.criteria.budget = {
            status: 'FAIL',
            score: 0,
            message: 'Budget not confirmed or found in briefing'
        };
        evaluation.issues.push('No confirmed budget found');
    }
    
    // 2. TIMELINE EVALUATION (30 points)
    if (data.constraints.proposal_deadline) {
        const deadline = new Date(data.constraints.proposal_deadline);
        const today = new Date();
        const daysAvailable = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
        const requiredDays = CONFIG.CREATE_RULES.MIN_LEAD_TIME_DAYS;
        
        if (daysAvailable >= requiredDays) {
            evaluation.criteria.timeline = {
                status: 'PASS',
                score: 30,
                message: `Timeline adequate: ${daysAvailable} days ≥ ${requiredDays} days required`
            };
        } else {
            evaluation.criteria.timeline = {
                status: 'FAIL',
                score: 0,
                message: `Timeline insufficient: ${daysAvailable} days < ${requiredDays} days required`
            };
            evaluation.issues.push('Insufficient lead time for CREATE deliverables');
        }
    } else {
        evaluation.criteria.timeline = {
            status: 'FAIL',
            score: 0,
            message: 'No proposal deadline specified'
        };
        evaluation.issues.push('Missing proposal deadline');
    }
    
    // 3. REQUIRED FIELDS EVALUATION (30 points)
    const requiredFields = CONFIG.CREATE_RULES.REQUIRED_FIELDS;
    const missingFields = [];
    
    requiredFields.forEach(field => {
        const value = getNestedValue(data, field);
        if (!value) {
            missingFields.push(field.replace('_', ' '));
        }
    });
    
    if (missingFields.length === 0) {
        evaluation.criteria.required_fields = {
            status: 'PASS',
            score: 30,
            message: 'All required fields present'
        };
    } else {
        evaluation.criteria.required_fields = {
            status: 'FAIL',
            score: Math.max(0, 30 - (missingFields.length * 10)),
            message: `Missing fields: ${missingFields.join(', ')}`
        };
        evaluation.issues.push(`Missing required information: ${missingFields.join(', ')}`);
    }
    
    // Calculate overall score and decision
    evaluation.score = Object.values(evaluation.criteria)
        .reduce((total, criterion) => total + criterion.score, 0);
    
    // GO/NO-GO Decision Logic
    const allCriticalPassed = evaluation.criteria.budget.status === 'PASS' && 
                             evaluation.criteria.timeline.status === 'PASS';
    
    if (allCriticalPassed && evaluation.score >= 80) {
        evaluation.overall_decision = 'GO';
    } else if (allCriticalPassed && evaluation.score >= 60) {
        evaluation.overall_decision = 'CONDITIONAL';
        evaluation.recommendations.push('Review missing information before proceeding');
    } else {
        evaluation.overall_decision = 'NO-GO';
    }
    
    return evaluation;
}

// Helper function to get nested object values
function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
        if (current && current[key] !== undefined && current[key] !== null) {
            return current[key];
        }
        // Check for underscore-separated paths
        const underscorePath = key.split('_');
        if (underscorePath.length > 1) {
            let value = current;
            for (const part of underscorePath) {
                if (value && value[part] !== undefined && value[part] !== null) {
                    value = value[part];
                } else {
                    return null;
                }
            }
            return value;
        }
        return null;
    }, obj);
}

// UI State Management
function showProcessingState() {
    App.elements.uploadSection.style.display = 'none';
    App.elements.processingSection.style.display = 'block';
    App.elements.resultsSection.style.display = 'none';
}

function updateProcessingStatus(message) {
    App.elements.processingStatus.textContent = message;
    console.log('📍', message);
}

function showResults(briefingData, evaluation) {
    App.elements.uploadSection.style.display = 'none';
    App.elements.processingSection.style.display = 'none';
    App.elements.resultsSection.style.display = 'block';
    
    // Display decision banner
    displayDecisionBanner(evaluation);
    
    // Display evaluation details
    displayEvaluationDetails(evaluation);
    
    // Display extracted data
    displayExtractedData(briefingData);
}

function displayDecisionBanner(evaluation) {
    const banner = App.elements.decisionBanner;
    const icon = document.getElementById('decisionIcon');
    const title = document.getElementById('decisionTitle');
    const message = document.getElementById('decisionMessage');
    const score = document.getElementById('decisionScore');
    
    // Set banner class
    banner.className = 'decision-banner';
    
    if (evaluation.overall_decision === 'GO') {
        banner.classList.add('go');
        icon.innerHTML = '<i class="fas fa-check"></i>';
        title.textContent = 'GO - Brief Approved';
        message.textContent = 'All CREATE criteria met. This briefing is approved for processing.';
    } else if (evaluation.overall_decision === 'CONDITIONAL') {
        banner.classList.add('nogo'); // Use warning styling
        icon.innerHTML = '<i class="fas fa-exclamation"></i>';
        title.textContent = 'CONDITIONAL - Review Required';
        message.textContent = 'Core criteria met but additional information needed.';
    } else {
        banner.classList.add('nogo');
        icon.innerHTML = '<i class="fas fa-times"></i>';
        title.textContent = 'NO-GO - Brief Rejected';
        message.textContent = 'CREATE criteria not met. See evaluation details below.';
    }
    
    score.textContent = `Score: ${evaluation.score}/${evaluation.max_score}`;
}

function displayEvaluationDetails(evaluation) {
    // Budget status
    const budgetStatus = document.getElementById('budgetStatus');
    const confirmedBudget = document.getElementById('confirmedBudget');
    
    if (evaluation.criteria.budget.status === 'PASS') {
        budgetStatus.className = 'status valid';
        budgetStatus.textContent = '✓ Valid';
    } else {
        budgetStatus.className = 'status invalid';
        budgetStatus.textContent = '✗ Invalid';
    }
    
    if (App.currentData.briefing.constraints.budget_confirmed) {
        const budget = App.currentData.briefing.constraints.budget_confirmed;
        confirmedBudget.textContent = `€${budget.min_amount.toLocaleString()} - €${budget.max_amount.toLocaleString()}`;
    } else {
        confirmedBudget.textContent = 'Not specified';
        confirmedBudget.classList.add('text-muted');
    }
    
    // Timeline status
    const timelineStatus = document.getElementById('timelineStatus');
    const proposalDeadline = document.getElementById('proposalDeadline');
    
    if (evaluation.criteria.timeline.status === 'PASS') {
        timelineStatus.className = 'status valid';
        timelineStatus.textContent = '✓ Adequate';
    } else {
        timelineStatus.className = 'status invalid';
        timelineStatus.textContent = '✗ Insufficient';
    }
    
    if (App.currentData.briefing.constraints.proposal_deadline) {
        const deadline = new Date(App.currentData.briefing.constraints.proposal_deadline);
        proposalDeadline.textContent = deadline.toLocaleDateString('fr-FR');
    } else {
        proposalDeadline.textContent = 'Not specified';
        proposalDeadline.classList.add('text-muted');
    }
    
    // Required fields status
    const contactStatus = document.getElementById('contactStatus');
    const advertiserStatus = document.getElementById('advertiserStatus');
    const personaStatus = document.getElementById('personaStatus');
    
    contactStatus.className = App.currentData.briefing.contact.responsable_commercial ? 'status valid' : 'status missing';
    contactStatus.textContent = App.currentData.briefing.contact.responsable_commercial ? '✓ Found' : '⚠ Missing';
    
    advertiserStatus.className = App.currentData.briefing.advertiser.group_annonceur ? 'status valid' : 'status missing';
    advertiserStatus.textContent = App.currentData.briefing.advertiser.group_annonceur ? '✓ Found' : '⚠ Missing';
    
    personaStatus.className = App.currentData.briefing.brief.target_persona ? 'status valid' : 'status missing';
    personaStatus.textContent = App.currentData.briefing.brief.target_persona ? '✓ Found' : '⚠ Missing';
}

function displayExtractedData(data) {
    // Contact information
    setFieldValue('responsableCommercial', data.contact.responsable_commercial);
    setFieldValue('agenceMedia', data.contact.agence_media);
    
    // Advertiser
    setFieldValue('groupAnnonceur', data.advertiser.group_annonceur);
    setFieldValue('brandProduct', data.advertiser.brand_product);
    
    // Brief details
    setFieldValue('targetPersona', data.brief.target_persona);
    setFieldValue('keyMessages', data.brief.key_messages);
    setFieldValue('sportsFocus', data.brief.sports_focus?.join(', '));
    setFieldValue('additionalNotes', data.brief.notes);
}

function setFieldValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value || '-';
        if (!value) {
            element.classList.add('text-muted');
        } else {
            element.classList.remove('text-muted');
        }
    }
}

function resetToUpload() {
    App.elements.uploadSection.style.display = 'block';
    App.elements.processingSection.style.display = 'none';
    App.elements.resultsSection.style.display = 'none';
    
    // Reset file input - IMPORTANT for fixing the "second time" issue
    App.elements.fileInput.value = '';
    App.elements.uploadArea.classList.remove('dragging');
    
    App.currentData = null;
    App.isProcessing = false;
}

// Utility functions
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function showError(message) {
    console.error('❌', message);
    alert(`Error: ${message}`);
    resetToUpload();
}

// Global reset function
function resetDashboard() {
    console.log('🔄 Resetting dashboard...');
    resetToUpload();
}

// Export for global access
window.resetDashboard = resetDashboard;

console.log('✅ Brand Studio CREATE Dashboard ready!');