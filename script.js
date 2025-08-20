// Brand Studio CREATE - Professional Dashboard
console.log('🚀 Brand Studio CREATE Dashboard Loading...');

// Configuration
const CONFIG = {
    PDF_WORKER_URL: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js',
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    CREATE_RULES: {
        MIN_BUDGET: 10000, // €10,000 minimum
        MIN_LEAD_TIME_DAYS: 10, // 10 business days minimum
        REQUIRED_FIELDS: ['responsable_commercial', 'group_annonceur', 'target_persona']
    }
};

// Application state
let isProcessing = false;
let currentData = null;
let elements = {};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 DOM ready - Initializing dashboard...');
    
    // Configure PDF.js
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = CONFIG.PDF_WORKER_URL;
        console.log('📚 PDF.js configured');
        setupDashboard();
    } else {
        console.error('❌ PDF.js not loaded');
        alert('PDF processing library failed to load. Please refresh the page.');
    }
});

function setupDashboard() {
    // Cache DOM elements
    elements = {
        fileInput: document.getElementById('fileInput'),
        uploadBtn: document.getElementById('uploadBtn'),
        uploadArea: document.getElementById('uploadArea'),
        uploadSection: document.getElementById('uploadSection'),
        processingSection: document.getElementById('processingSection'),
        processingStatus: document.getElementById('processingStatus'),
        resultsSection: document.getElementById('resultsSection'),
        decisionBanner: document.getElementById('decisionBanner')
    };
    
    // Verify all elements exist
    const missing = Object.entries(elements)
        .filter(([key, element]) => !element)
        .map(([key]) => key);
    
    if (missing.length > 0) {
        console.error('❌ Missing DOM elements:', missing);
        return;
    }
    
    setupEventListeners();
    console.log('✅ Dashboard initialized successfully');
}

function setupEventListeners() {
    const { fileInput, uploadBtn, uploadArea } = elements;
    
    // File input change
    fileInput.addEventListener('change', function(event) {
        console.log('📁 File selected');
        handleFileSelection(event);
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
    
    // Drag and drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // Prevent default drag behaviors
    document.addEventListener('dragover', e => e.preventDefault());
    document.addEventListener('drop', e => e.preventDefault());
    
    console.log('🎧 Event listeners configured');
}

// File handling
function handleFileSelection(event) {
    const file = event.target.files[0];
    if (file) {
        console.log('📄 Processing file:', file.name, `(${(file.size/1024/1024).toFixed(2)}MB)`);
        processFile(file);
    }
}

function handleDragOver(event) {
    event.preventDefault();
    elements.uploadArea.classList.add('dragging');
}

function handleDragLeave(event) {
    event.preventDefault();
    if (!elements.uploadArea.contains(event.relatedTarget)) {
        elements.uploadArea.classList.remove('dragging');
    }
}

function handleDrop(event) {
    event.preventDefault();
    elements.uploadArea.classList.remove('dragging');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        console.log('📥 File dropped:', files[0].name);
        processFile(files[0]);
    }
}

// Main processing function
async function processFile(file) {
    if (isProcessing) {
        console.log('⏳ Already processing - ignoring');
        return;
    }
    
    // Validate file
    if (!validateFile(file)) {
        return;
    }
    
    isProcessing = true;
    
    try {
        showProcessingState();
        updateProcessingStatus('Reading PDF file...');
        
        // Extract text
        const pdfText = await extractPDFText(file);
        console.log(`📝 Extracted ${pdfText.length} characters`);
        
        updateProcessingStatus('Analyzing briefing content...');
        await delay(800);
        
        // Extract data
        const briefingData = extractBriefingData(pdfText, file.name);
        console.log('📊 Data extracted:', briefingData);
        
        updateProcessingStatus('Evaluating CREATE criteria...');
        await delay(600);
        
        // Evaluate
        const evaluation = evaluateCreateCriteria(briefingData);
        console.log('🎯 Evaluation complete:', evaluation);
        
        // Store and show results
        currentData = { briefing: briefingData, evaluation };
        showResults(briefingData, evaluation);
        
    } catch (error) {
        console.error('💥 Processing failed:', error);
        alert(`Failed to process PDF: ${error.message}`);
        resetToUpload();
    } finally {
        isProcessing = false;
    }
}

function validateFile(file) {
    if (!file) {
        alert('No file selected.');
        return false;
    }
    
    if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file only.');
        return false;
    }
    
    if (file.size > CONFIG.MAX_FILE_SIZE) {
        alert('File too large. Please upload a PDF under 10MB.');
        return false;
    }
    
    if (file.size === 0) {
        alert('The file appears to be empty.');
        return false;
    }
    
    return true;
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
            }
        }
        
        if (!fullText.trim()) {
            throw new Error('No readable text found in PDF');
        }
        
        return fullText.trim();
        
    } catch (error) {
        console.error('📚 PDF extraction error:', error);
        throw error;
    }
}

// Data extraction
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
                /oneplus/i,
                /coca-cola/i,
                /groupe[\\s\\w]*annonceur[\\s]*:?\\s*([A-Za-z\\s-]+)/i,
                /annonceur[\\s]*:?\\s*([A-Za-z\\s-]+)/i
            ]),
            brand_product: extractPattern(text, [
                /nord\\s*5/i,
                /powerade/i,
                /marque[\\s\\w]*:?\\s*([A-Za-z\\s]+)/i,
                /produit[\\s\\w]*:?\\s*([A-Za-z\\s]+)/i
            ])
        },
        brief: {
            target_persona: extractPattern(text, [
                /studenten/i,
                /18[-\\s]*54[\\s]*[-–]?[\\s]*sportifs/i,
                /cible[\\s\\w]*:?\\s*([A-Za-z0-9\\s-]+)/i,
                /persona[\\s\\w]*:?\\s*([A-Za-z0-9\\s-]+)/i
            ]),
            key_messages: extractPattern(text, [
                /back\\s*to\\s*school/i,
                /choississez\\s*powerade/i,
                /message[\\s\\w]*cl[eé]s?[\\s]*:?\\s*([A-Za-z\\s,.'!-]+)/i
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
        .substring(0, 200);
}

function extractBudget(text) {
    const patterns = [
        /(\\d{1,3})[-–](\\d{1,3})\\s*k/i,
        /€\\s*(\\d{1,3})[.,](\\d{3})/i,
        /budget[\\s\\w]*:?\\s*(\\d+)/i
    ];
    
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            let amount = parseInt(match[1]) || 0;
            if (match[0].toLowerCase().includes('k')) {
                amount *= 1000;
            }
            if (match[2]) {
                const high = parseInt(match[2]) * (match[0].toLowerCase().includes('k') ? 1000 : 1);
                return {
                    range: `${amount}-${high}`,
                    min_amount: amount,
                    max_amount: high
                };
            }
            return {
                range: amount.toString(),
                min_amount: amount,
                max_amount: amount
            };
        }
    }
    return null;
}

function extractDate(text) {
    const datePatterns = [
        /(\\d{1,2})\\/(\\d{1,2})\\/(\\d{4})/g,
        /(\\d{1,2})[-](\\d{1,2})[-](\\d{4})/g
    ];
    
    for (const pattern of datePatterns) {
        const matches = [...text.matchAll(pattern)];
        if (matches.length > 0) {
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
    const sports = ['padel', 'hockey', 'basket', 'running', 'football', 'tennis'];
    const found = sports.filter(sport => new RegExp(sport, 'i').test(text));
    return found.length > 0 ? found : null;
}

function extractNotes(text) {
    const notePatterns = [
        /intéressé\\s*par\\s*([^\\n.]{50,400})/i,
        /complément[\\s\\w]*:?\\s*([^\\n.]{50,400})/i,
        /notes?[\\s\\w]*:?\\s*([^\\n.]{50,400})/i
    ];
    
    for (const pattern of notePatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            return cleanExtractedText(match[1]);
        }
    }
    return null;
}

// CREATE evaluation
function evaluateCreateCriteria(data) {
    const evaluation = {
        overall_decision: 'PENDING',
        score: 0,
        max_score: 100,
        criteria: {
            budget: { status: 'FAIL', score: 0, message: '' },
            timeline: { status: 'FAIL', score: 0, message: '' },
            required_fields: { status: 'FAIL', score: 0, message: '' }
        },
        issues: [],
        recommendations: []
    };
    
    // Budget evaluation (40 points)
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
                message: `Budget insufficient: €${minBudget.toLocaleString()} < €${requiredBudget.toLocaleString()}`
            };
            evaluation.issues.push('Budget below CREATE minimum');
        }
    } else {
        evaluation.criteria.budget = {
            status: 'FAIL',
            score: 0,
            message: 'Budget not confirmed'
        };
        evaluation.issues.push('No confirmed budget found');
    }
    
    // Timeline evaluation (30 points)
    if (data.constraints.proposal_deadline) {
        const deadline = new Date(data.constraints.proposal_deadline);
        const today = new Date();
        const daysAvailable = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
        const requiredDays = CONFIG.CREATE_RULES.MIN_LEAD_TIME_DAYS;
        
        if (daysAvailable >= requiredDays) {
            evaluation.criteria.timeline = {
                status: 'PASS',
                score: 30,
                message: `Timeline adequate: ${daysAvailable} days ≥ ${requiredDays} days`
            };
        } else {
            evaluation.criteria.timeline = {
                status: 'FAIL',
                score: 0,
                message: `Timeline insufficient: ${daysAvailable} days < ${requiredDays} days`
            };
            evaluation.issues.push('Insufficient lead time');
        }
    } else {
        evaluation.criteria.timeline = {
            status: 'FAIL',
            score: 0,
            message: 'No deadline specified'
        };
        evaluation.issues.push('Missing deadline');
    }
    
    // Required fields (30 points)
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
            message: `Missing: ${missingFields.join(', ')}`
        };
        evaluation.issues.push(`Missing: ${missingFields.join(', ')}`);
    }
    
    // Calculate overall score
    evaluation.score = Object.values(evaluation.criteria)
        .reduce((total, criterion) => total + criterion.score, 0);
    
    // Final decision
    const allCriticalPassed = evaluation.criteria.budget.status === 'PASS' && 
                             evaluation.criteria.timeline.status === 'PASS';
    
    if (allCriticalPassed && evaluation.score >= 80) {
        evaluation.overall_decision = 'GO';
    } else if (allCriticalPassed && evaluation.score >= 60) {
        evaluation.overall_decision = 'CONDITIONAL';
        evaluation.recommendations.push('Review missing information');
    } else {
        evaluation.overall_decision = 'NO-GO';
    }
    
    return evaluation;
}

function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
        if (current && current[key] !== undefined && current[key] !== null) {
            return current[key];
        }
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

// UI functions
function showProcessingState() {
    elements.uploadSection.style.display = 'none';
    elements.processingSection.style.display = 'flex';
    elements.resultsSection.style.display = 'none';
}

function updateProcessingStatus(message) {
    elements.processingStatus.textContent = message;
    console.log('📍', message);
}

function showResults(briefingData, evaluation) {
    elements.uploadSection.style.display = 'none';
    elements.processingSection.style.display = 'none';
    elements.resultsSection.style.display = 'block';
    
    displayDecisionBanner(evaluation);
    displayEvaluationDetails(evaluation);
    displayExtractedData(briefingData);
}

function displayDecisionBanner(evaluation) {
    const banner = elements.decisionBanner;
    const icon = document.getElementById('decisionIcon');
    const title = document.getElementById('decisionTitle');
    const message = document.getElementById('decisionMessage');
    const score = document.getElementById('decisionScore');
    
    banner.className = 'decision-banner';
    
    if (evaluation.overall_decision === 'GO') {
        banner.classList.add('go');
        icon.innerHTML = '<i class="fas fa-check"></i>';
        title.textContent = 'GO - Brief Approved';
        message.textContent = 'All CREATE criteria met. Approved for processing.';
    } else if (evaluation.overall_decision === 'CONDITIONAL') {
        banner.classList.add('nogo');
        icon.innerHTML = '<i class="fas fa-exclamation"></i>';
        title.textContent = 'CONDITIONAL - Review Required';
        message.textContent = 'Core criteria met but additional info needed.';
    } else {
        banner.classList.add('nogo');
        icon.innerHTML = '<i class="fas fa-times"></i>';
        title.textContent = 'NO-GO - Brief Rejected';
        message.textContent = 'CREATE criteria not met. See details below.';
    }
    
    score.textContent = `Score: ${evaluation.score}/${evaluation.max_score}`;
}

function displayEvaluationDetails(evaluation) {
    // Budget
    const budgetStatus = document.getElementById('budgetStatus');
    const confirmedBudget = document.getElementById('confirmedBudget');
    
    budgetStatus.className = evaluation.criteria.budget.status === 'PASS' ? 'status valid' : 'status invalid';
    budgetStatus.textContent = evaluation.criteria.budget.status === 'PASS' ? '✓ Valid' : '✗ Invalid';
    
    if (currentData.briefing.constraints.budget_confirmed) {
        const budget = currentData.briefing.constraints.budget_confirmed;
        confirmedBudget.textContent = `€${budget.min_amount.toLocaleString()} - €${budget.max_amount.toLocaleString()}`;
    } else {
        confirmedBudget.textContent = 'Not specified';
        confirmedBudget.classList.add('text-muted');
    }
    
    // Timeline
    const timelineStatus = document.getElementById('timelineStatus');
    const proposalDeadline = document.getElementById('proposalDeadline');
    
    timelineStatus.className = evaluation.criteria.timeline.status === 'PASS' ? 'status valid' : 'status invalid';
    timelineStatus.textContent = evaluation.criteria.timeline.status === 'PASS' ? '✓ Adequate' : '✗ Insufficient';
    
    if (currentData.briefing.constraints.proposal_deadline) {
        const deadline = new Date(currentData.briefing.constraints.proposal_deadline);
        proposalDeadline.textContent = deadline.toLocaleDateString();
    } else {
        proposalDeadline.textContent = 'Not specified';
        proposalDeadline.classList.add('text-muted');
    }
    
    // Required fields
    const contactStatus = document.getElementById('contactStatus');
    const advertiserStatus = document.getElementById('advertiserStatus');
    const personaStatus = document.getElementById('personaStatus');
    
    contactStatus.className = currentData.briefing.contact.responsable_commercial ? 'status valid' : 'status missing';
    contactStatus.textContent = currentData.briefing.contact.responsable_commercial ? '✓ Found' : '⚠ Missing';
    
    advertiserStatus.className = currentData.briefing.advertiser.group_annonceur ? 'status valid' : 'status missing';
    advertiserStatus.textContent = currentData.briefing.advertiser.group_annonceur ? '✓ Found' : '⚠ Missing';
    
    personaStatus.className = currentData.briefing.brief.target_persona ? 'status valid' : 'status missing';
    personaStatus.textContent = currentData.briefing.brief.target_persona ? '✓ Found' : '⚠ Missing';
}

function displayExtractedData(data) {
    // Contact
    setFieldValue('responsableCommercial', data.contact.responsable_commercial);
    setFieldValue('agenceMedia', data.contact.agence_media);
    
    // Advertiser
    setFieldValue('groupAnnonceur', data.advertiser.group_annonceur);
    setFieldValue('brandProduct', data.advertiser.brand_product);
    
    // Brief
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
    elements.uploadSection.style.display = 'block';
    elements.processingSection.style.display = 'none';
    elements.resultsSection.style.display = 'none';
    
    elements.fileInput.value = '';
    elements.uploadArea.classList.remove('dragging');
    
    currentData = null;
    isProcessing = false;
}

// Utility functions
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Global functions
function resetDashboard() {
    console.log('🔄 Resetting dashboard');
    resetToUpload();
}

window.resetDashboard = resetDashboard;

console.log('✅ Brand Studio CREATE Dashboard Ready!');