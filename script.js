// Configure PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Global state
let currentBriefingData = null;
let processingTimeouts = [];

// DOM Elements
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const uploadSection = document.getElementById('uploadSection');
const processingState = document.getElementById('processingState');
const dashboard = document.getElementById('dashboard');
const decisionHeader = document.getElementById('decisionHeader');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    console.log('Brand Studio CREATE Dashboard Initialized');
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // File input change
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // Click to upload
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Prevent default drag behaviors on document
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => e.preventDefault());
}

// File handling
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        validateAndProcessFile(file);
    }
}

function handleDragOver(event) {
    event.preventDefault();
    uploadArea.classList.add('drag-over');
}

function handleDragLeave(event) {
    event.preventDefault();
    // Only remove if we're truly leaving the upload area
    if (!uploadArea.contains(event.relatedTarget)) {
        uploadArea.classList.remove('drag-over');
    }
}

function handleDrop(event) {
    event.preventDefault();
    uploadArea.classList.remove('drag-over');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        validateAndProcessFile(files[0]);
    }
}

// File validation and processing
function validateAndProcessFile(file) {
    console.log('Processing file:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    // Reset previous state
    clearProcessingTimeouts();
    
    // Validate file type
    if (file.type !== 'application/pdf') {
        showError('Invalid file type. Please upload a PDF file.');
        return;
    }
    
    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        showError('File too large. Please upload a PDF under 10MB.');
        return;
    }
    
    // Start processing
    processFile(file);
}

async function processFile(file) {
    try {
        // Show processing state
        showProcessingState();
        
        // Step 1: Extract PDF text
        updateProcessingStep(1);
        await delay(500); // Simulate processing time
        
        const pdfText = await extractTextFromPDF(file);
        console.log('PDF text extracted, length:', pdfText.length);
        
        // Step 2: AI Analysis
        updateProcessingStep(2);
        await delay(1000);
        
        const briefingData = await extractBriefingData(pdfText, file.name);
        console.log('Briefing data extracted:', briefingData);
        
        // Step 3: Validation
        updateProcessingStep(3);
        await delay(500);
        
        // Show dashboard
        await delay(500);
        showDashboard(briefingData);
        
    } catch (error) {
        console.error('Error processing file:', error);
        showError('Failed to process PDF. Please try again or check if the file is valid.');
    }
}

// PDF text extraction
async function extractTextFromPDF(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        
        let fullText = '';
        const numPages = pdf.numPages;
        
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            // Extract text from page
            const pageText = textContent.items
                .map(item => item.str)
                .join(' ');
            
            fullText += pageText + '\\n\\n';
        }
        
        if (!fullText.trim()) {
            throw new Error('No text content found in PDF');
        }
        
        return fullText;
        
    } catch (error) {
        console.error('PDF extraction error:', error);
        throw new Error('Unable to extract text from PDF. The file may be corrupted or protected.');
    }
}

// AI-powered data extraction (simulated)
async function extractBriefingData(pdfText, fileName) {
    // In production, this would call your AI service
    // For now, we'll use pattern matching and simulation
    
    const data = {
        meta: {
            source_file: fileName,
            extraction_ts: new Date().toISOString().split('T')[0]
        },
        contact: {
            responsable_commercial: extractField(pdfText, ['karolien', 'van gaever', 'responsable']) || null,
            agence_media: extractField(pdfText, ['group m', 'essence', 'mediacom', 'agence']) || null
        },
        advertiser: {
            group_or_annonceur: extractField(pdfText, ['coca-cola', 'coca cola', 'annonceur']) || null,
            brand_or_product: extractField(pdfText, ['powerade', 'marque', 'produit']) || null
        },
        brief: {
            type: extractField(pdfText, ['briefing recu', 'agence media']) || null,
            urgency: extractUrgency(pdfText),
            typologie_annonceur: extractField(pdfText, ['national', 'grands comptes']) || null,
            presentation_languages: extractLanguages(pdfText),
            attachments_present: null,
            target_persona: extractField(pdfText, ['18-54', 'sportifs', 'persona', 'cible']) || null,
            objectives: extractObjectives(pdfText),
            start_momentum_reason: extractField(pdfText, ['tbc', 'saison du sport', 'momentum']) || null,
            end_date: extractDate(pdfText, 'end'),
            key_messages: extractField(pdfText, ['choississez powerade', 'message', 'communiquer']) || null,
            media_specific_preferences: extractMediaPreferences(pdfText),
            history_with_rossel: null,
            other_campaigns_with_rossel: extractField(pdfText, ['campagne classique', 'publishing']) || null,
            notes: extractNotes(pdfText)
        },
        constraints: {
            min_budget_create_eur: 10000,
            budget_confirmed_eur_range: extractBudget(pdfText),
            proposal_deadline: extractDate(pdfText, 'deadline'),
            lead_time_business_days_after_valid_brief: 10,
            do_not: extractDoNot(pdfText),
            prefer: extractPreferences(pdfText)
        },
        creative: {
            sports_focus: extractSportsFocus(pdfText),
            audience_activity_min_sessions_per_week: extractActivityFrequency(pdfText)
        }
    };
    
    return data;
}

// Text extraction helper functions
function extractField(text, keywords) {
    const lowerText = text.toLowerCase();
    for (const keyword of keywords) {
        const index = lowerText.indexOf(keyword.toLowerCase());
        if (index !== -1) {
            // Extract surrounding context
            const start = Math.max(0, index - 50);
            const end = Math.min(text.length, index + keyword.length + 100);
            const context = text.substring(start, end);
            
            // Try to extract specific value patterns
            const patterns = [
                /([A-Z][a-z]+ [A-Z][a-z]+)/g, // Names
                /([A-Z][a-z]+(?:[ -][A-Z][a-z]+)*)/g, // Company names
            ];
            
            for (const pattern of patterns) {
                const matches = context.match(pattern);
                if (matches && matches.length > 0) {
                    return matches[0].trim();
                }
            }
            
            return keyword; // Fallback
        }
    }
    return null;
}

function extractBudget(text) {
    const budgetPattern = /(\\d{1,3}[kK]|\\d{1,3}[.,]\\d{3}|\\d{5,})/g;
    const matches = text.match(budgetPattern);
    if (matches && matches.length >= 2) {
        const amounts = matches.map(m => {
            if (m.toLowerCase().includes('k')) {
                return parseInt(m.replace(/[kK]/g, '')) * 1000;
            }
            return parseInt(m.replace(/[.,]/g, ''));
        });
        
        amounts.sort((a, b) => a - b);
        return `${amounts[0]}-${amounts[amounts.length - 1]}`;
    }
    
    // Check for specific patterns like "20-25K"
    const rangePattern = /(\\d{1,3})[-–](\\d{1,3})[kK]/i;
    const rangeMatch = text.match(rangePattern);
    if (rangeMatch) {
        const low = parseInt(rangeMatch[1]) * 1000;
        const high = parseInt(rangeMatch[2]) * 1000;
        return `${low}-${high}`;
    }
    
    return null;
}

function extractDate(text, type) {
    const datePatterns = [
        /\\d{1,2}\\/\\d{1,2}\\/\\d{4}/g,
        /\\d{4}-\\d{1,2}-\\d{1,2}/g,
        /\\d{1,2}[-\\/]\\d{1,2}[-\\/]\\d{4}/g
    ];
    
    for (const pattern of datePatterns) {
        const matches = text.match(pattern);
        if (matches) {
            // Convert to ISO format
            const dateStr = matches[0];
            try {
                const date = new Date(dateStr);
                if (!isNaN(date.getTime())) {
                    return date.toISOString().split('T')[0];
                }
            } catch (e) {
                continue;
            }
        }
    }
    return null;
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

function extractUrgency(text) {
    if (/élevé|urgent|high/i.test(text)) return 'eleve';
    if (/moyen|medium/i.test(text)) return 'moyen';
    if (/faible|low/i.test(text)) return 'faible';
    return null;
}

function extractMediaPreferences(text) {
    const mediaOptions = ['LE SOIR', 'SUDINFO', 'RTL', 'NOSTALGIE', 'KOTPLANET', 'EFLUENZ'];
    const found = mediaOptions.filter(media => 
        text.toLowerCase().includes(media.toLowerCase())
    );
    return found.length > 0 ? found : null;
}

function extractSportsFocus(text) {
    const sports = [];
    if (/padel/i.test(text)) sports.push('padel');
    if (/hockey/i.test(text)) sports.push('hockey');
    if (/basket/i.test(text)) sports.push('basket');
    if (/running/i.test(text)) sports.push('running');
    if (/football/i.test(text)) sports.push('football');
    return sports.length > 0 ? sports : null;
}

function extractActivityFrequency(text) {
    const freqPattern = /(\\d+)\\s*(?:fois|times|x)\\s*(?:par|per)?\\s*(?:semaine|week)/i;
    const match = text.match(freqPattern);
    return match ? parseInt(match[1]) : null;
}

function extractDoNot(text) {
    const doNot = [];
    if (/pas de native|no native/i.test(text)) doNot.push('native');
    if (/pas d'influenceurs|no influencers/i.test(text)) doNot.push('influenceurs');
    return doNot.length > 0 ? doNot : null;
}

function extractPreferences(text) {
    const prefer = [];
    if (/plutôt.*digital|prefer.*digital/i.test(text)) prefer.push('digital');
    if (/programmatic/i.test(text)) prefer.push('programmatic');
    return prefer.length > 0 ? prefer : null;
}

function extractNotes(text) {
    // Look for additional notes section
    const notesPattern = /(?:notes?|complément|divers)[\\s:]*([^\\n]+(?:\\n[^\\n]+)*)/i;
    const match = text.match(notesPattern);
    if (match && match[1]) {
        return match[1].trim().substring(0, 500); // Limit length
    }
    
    // Fallback: look for common note patterns
    if (text.toLowerCase().includes('intéressé par')) {
        const startIndex = text.toLowerCase().indexOf('intéressé par');
        const endIndex = Math.min(text.length, startIndex + 300);
        return text.substring(startIndex, endIndex).trim();
    }
    
    return null;
}

// UI State Management
function showProcessingState() {
    uploadSection.style.display = 'none';
    processingState.style.display = 'block';
    dashboard.style.display = 'none';
    
    // Reset steps
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
}

function updateProcessingStep(stepNumber) {
    // Remove active class from all steps
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    
    // Add active class to current step
    const currentStep = document.getElementById(`step${stepNumber}`);
    if (currentStep) {
        currentStep.classList.add('active');
    }
}

function showDashboard(data) {
    currentBriefingData = data;
    
    // Hide processing, show dashboard
    processingState.style.display = 'none';
    dashboard.style.display = 'block';
    dashboard.classList.add('fade-in');
    
    // Evaluate and display decision
    const decision = evaluateGoNoGo(data);
    displayDecision(decision);
    
    // Populate dashboard fields
    populateFields(data);
}

function showError(message) {
    // Hide processing states
    processingState.style.display = 'none';
    uploadSection.style.display = 'block';
    
    // Show error message
    alert(message); // TODO: Replace with better error UI
    
    // Reset file input
    fileInput.value = '';
}

// Go/No-Go Decision Logic
function evaluateGoNoGo(data) {
    const issues = [];
    
    // Budget validation
    if (data.constraints.budget_confirmed_eur_range) {
        const budgetRange = data.constraints.budget_confirmed_eur_range.split('-');
        const minBudget = parseInt(budgetRange[0]);
        
        if (minBudget < data.constraints.min_budget_create_eur) {
            issues.push(`Budget insuffisant: €${minBudget.toLocaleString()} < €${data.constraints.min_budget_create_eur.toLocaleString()} requis`);
        }
    } else {
        issues.push('Budget non confirmé');
    }
    
    // Deadline validation
    if (data.constraints.proposal_deadline) {
        const deadline = new Date(data.constraints.proposal_deadline);
        const today = new Date();
        const leadTimeDays = data.constraints.lead_time_business_days_after_valid_brief;
        const requiredDate = new Date();
        requiredDate.setDate(today.getDate() + leadTimeDays);
        
        if (deadline < requiredDate) {
            issues.push(`Délai insuffisant: ${leadTimeDays} jours ouvrables requis`);
        }
    } else {
        issues.push('Date limite non spécifiée');
    }
    
    // Required fields validation
    if (!data.contact.responsable_commercial) {
        issues.push('Responsable commercial manquant');
    }
    
    if (!data.advertiser.group_or_annonceur) {
        issues.push('Groupe annonceur manquant');
    }
    
    if (!data.brief.target_persona) {
        issues.push('Persona cible manquant');
    }
    
    return {
        status: issues.length === 0 ? 'GO' : 'NO-GO',
        issues: issues
    };
}

function displayDecision(decision) {
    const icon = document.getElementById('decisionIcon');
    const title = document.getElementById('decisionTitle');
    const message = document.getElementById('decisionMessage');
    
    // Remove existing classes
    decisionHeader.className = 'decision-header';
    
    if (decision.status === 'GO') {
        decisionHeader.classList.add('go');
        icon.textContent = '✓';
        title.textContent = 'GO - Brief Accepté';
        message.textContent = 'Tous les critères CREATE sont remplis. Ce briefing peut être traité.';
    } else {
        decisionHeader.classList.add('nogo');
        icon.textContent = '✗';
        title.textContent = 'NO-GO - Brief Refusé';
        message.textContent = `Problèmes identifiés: ${decision.issues.slice(0, 2).join(', ')}${decision.issues.length > 2 ? '...' : ''}`;
    }
}

// Field Population
function populateFields(data) {
    // Contact information
    setFieldValue('responsable_commercial', data.contact.responsable_commercial);
    setFieldValue('agence_media', data.contact.agence_media);
    
    // Advertiser
    setFieldValue('group_or_annonceur', data.advertiser.group_or_annonceur);
    setFieldValue('brand_or_product', data.advertiser.brand_or_product);
    
    // Brief details
    setFieldValue('brief_type', data.brief.type);
    setFieldValue('urgency', data.brief.urgency);
    setFieldValue('typologie_annonceur', data.brief.typologie_annonceur);
    setFieldValue('presentation_languages', data.brief.presentation_languages?.join(', '));
    setFieldValue('target_persona', data.brief.target_persona);
    setFieldValue('objectives', data.brief.objectives?.join(', '));
    
    // Constraints
    setFieldValue('budget_confirmed_eur_range', 
        data.constraints.budget_confirmed_eur_range ? 
        `€${data.constraints.budget_confirmed_eur_range.replace('-', ' - €')}` : null
    );
    setFieldValue('proposal_deadline', 
        data.constraints.proposal_deadline ? 
        formatDate(data.constraints.proposal_deadline) : null
    );
    
    // Creative
    setFieldValue('sports_focus', data.creative.sports_focus?.join(', '));
    setFieldValue('audience_activity_min_sessions_per_week', 
        data.creative.audience_activity_min_sessions_per_week ? 
        `${data.creative.audience_activity_min_sessions_per_week} sessions/week` : null
    );
    setFieldValue('do_not', data.constraints.do_not?.join(', '));
    setFieldValue('prefer', data.constraints.prefer?.join(', '));
    
    // Messages and notes
    setFieldValue('key_messages', data.brief.key_messages);
    setFieldValue('media_specific_preferences', data.brief.media_specific_preferences?.join(', '));
    setFieldValue('notes', data.brief.notes);
}

function setFieldValue(fieldId, value) {
    const element = document.getElementById(fieldId);
    if (element) {
        element.textContent = value || '-';
        
        // Add visual indicators
        if (value) {
            element.classList.remove('text-muted');
            
            // Special styling for certain fields
            if (fieldId === 'do_not' && value !== '-') {
                element.classList.add('warning');
            } else if (fieldId === 'prefer' && value !== '-') {
                element.classList.add('success');
            }
        } else {
            element.classList.add('text-muted');
        }
    }
}

// Utility Functions
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
    return new Promise(resolve => {
        const timeout = setTimeout(resolve, ms);
        processingTimeouts.push(timeout);
    });
}

function clearProcessingTimeouts() {
    processingTimeouts.forEach(timeout => clearTimeout(timeout));
    processingTimeouts = [];
}

// Reset functionality
function resetDashboard() {
    // Clear state
    currentBriefingData = null;
    clearProcessingTimeouts();
    
    // Reset UI
    dashboard.style.display = 'none';
    processingState.style.display = 'none';
    uploadSection.style.display = 'block';
    
    // Reset file input
    fileInput.value = '';
    
    // Remove drag over class
    uploadArea.classList.remove('drag-over');
    
    console.log('Dashboard reset');
}

// Make resetDashboard available globally
window.resetDashboard = resetDashboard;