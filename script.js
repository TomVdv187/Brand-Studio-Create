// Load PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Global variables
let extractedData = null;

// DOM elements
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const processing = document.getElementById('processing');
const dashboard = document.getElementById('dashboard');

// File upload handling
fileInput.addEventListener('change', handleFileSelect);
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('drop', handleDrop);
uploadArea.addEventListener('click', () => fileInput.click());

function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'application/pdf') {
        handleFile(files[0]);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
        handleFile(file);
    }
}

async function handleFile(file) {
    showProcessing();
    
    try {
        const pdfText = await extractTextFromPDF(file);
        const extractedData = await extractBriefingData(pdfText, file.name);
        
        displayDashboard(extractedData);
        hideProcessing();
    } catch (error) {
        console.error('Error processing file:', error);
        alert('Error processing PDF file. Please try again.');
        hideProcessing();
    }
}

async function extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\\n';
    }

    return fullText;
}

async function extractBriefingData(pdfText, fileName) {
    // This would typically call an AI service like OpenAI or Anthropic
    // For now, we'll simulate the extraction based on the claude.md rules
    
    // In a real implementation, you would:
    // 1. Send the PDF text to an AI service with the claude.md prompt
    // 2. Get back structured JSON data
    // 3. Validate against the schema
    
    // For demo purposes, let's simulate with the Coca-Cola example
    return simulateExtraction(pdfText, fileName);
}

function simulateExtraction(pdfText, fileName) {
    // Check if this looks like the Coca-Cola briefing
    const isCocaCola = pdfText.toLowerCase().includes('coca-cola') || 
                      pdfText.toLowerCase().includes('powerade') ||
                      pdfText.toLowerCase().includes('karolien');
    
    if (isCocaCola) {
        return {
            "meta": {
                "source_file": fileName,
                "extraction_ts": new Date().toISOString().split('T')[0]
            },
            "contact": {
                "responsable_commercial": "Karolien Van Gaever",
                "agence_media": "Group M - Essence Mediacom"
            },
            "advertiser": {
                "group_or_annonceur": "Coca-Cola",
                "brand_or_product": "Powerade"
            },
            "brief": {
                "type": "BRIEFING RECU VIA AGENCE MEDIA",
                "urgency": null,
                "typologie_annonceur": "NATIONAL",
                "presentation_languages": ["Anglais"],
                "attachments_present": null,
                "target_persona": "18-54 - sportifs",
                "objectives": ["awareness"],
                "start_momentum_reason": "TBC (en fonction de la saison du sport)",
                "end_date": null,
                "key_messages": "Choississez Powerade quand vous faites du sport",
                "media_specific_preferences": ["LE SOIR"],
                "history_with_rossel": null,
                "other_campaigns_with_rossel": "CAMPAGNE CLASSIQUE PUBLISHING-DIGITALE-VIDEO - TV - RADIO",
                "notes": "Le client est intéressé par des propositions créatives sur le Padel, le hockey, la basket, le running. Ils veulent mettre en avant leur marque POWERADE (pour les sportifs, au minimum 2 fois de sport par semaine), pas de native, pas d'influenceurs, plutôt le digital"
            },
            "constraints": {
                "min_budget_create_eur": 10000,
                "budget_confirmed_eur_range": "20000-25000",
                "proposal_deadline": "2025-04-01",
                "lead_time_business_days_after_valid_brief": 10,
                "do_not": ["native", "influenceurs"],
                "prefer": ["digital"]
            },
            "creative": {
                "sports_focus": ["padel", "hockey", "basket", "running"],
                "audience_activity_min_sessions_per_week": 2
            }
        };
    }
    
    // Default/empty structure for other PDFs
    return {
        "meta": {
            "source_file": fileName,
            "extraction_ts": new Date().toISOString().split('T')[0]
        },
        "contact": {
            "responsable_commercial": null,
            "agence_media": null
        },
        "advertiser": {
            "group_or_annonceur": null,
            "brand_or_product": null
        },
        "brief": {
            "type": null,
            "urgency": null,
            "typologie_annonceur": null,
            "presentation_languages": null,
            "attachments_present": null,
            "target_persona": null,
            "objectives": null,
            "start_momentum_reason": null,
            "end_date": null,
            "key_messages": null,
            "media_specific_preferences": null,
            "history_with_rossel": null,
            "other_campaigns_with_rossel": null,
            "notes": null
        },
        "constraints": {
            "min_budget_create_eur": 10000,
            "budget_confirmed_eur_range": null,
            "proposal_deadline": null,
            "lead_time_business_days_after_valid_brief": 10,
            "do_not": null,
            "prefer": null
        },
        "creative": {
            "sports_focus": null,
            "audience_activity_min_sessions_per_week": null
        }
    };
}

function displayDashboard(data) {
    extractedData = data;
    
    // Show dashboard
    document.querySelector('.upload-section').style.display = 'none';
    dashboard.style.display = 'block';
    
    // Determine Go/No-Go decision
    const decision = evaluateGoNoGo(data);
    displayDecision(decision);
    
    // Populate all fields
    populateFields(data);
}

function evaluateGoNoGo(data) {
    const issues = [];
    
    // Check minimum budget
    if (data.constraints.budget_confirmed_eur_range) {
        const budgetRange = data.constraints.budget_confirmed_eur_range.split('-');
        const minBudget = parseInt(budgetRange[0]);
        if (minBudget < data.constraints.min_budget_create_eur) {
            issues.push(`Budget insuffisant: €${minBudget.toLocaleString()} < €${data.constraints.min_budget_create_eur.toLocaleString()} requis`);
        }
    } else {
        issues.push('Budget non confirmé');
    }
    
    // Check proposal deadline vs lead time
    if (data.constraints.proposal_deadline) {
        const deadline = new Date(data.constraints.proposal_deadline);
        const today = new Date();
        const leadTimeMs = data.constraints.lead_time_business_days_after_valid_brief * 24 * 60 * 60 * 1000;
        const requiredDate = new Date(today.getTime() + leadTimeMs);
        
        if (deadline < requiredDate) {
            issues.push(`Délai insuffisant: ${data.constraints.lead_time_business_days_after_valid_brief} jours ouvrables requis`);
        }
    } else {
        issues.push('Date limite non spécifiée');
    }
    
    // Check required fields
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
    const banner = document.getElementById('decisionBanner');
    const icon = document.getElementById('decisionIcon');
    const title = document.getElementById('decisionTitle');
    const message = document.getElementById('decisionMessage');
    
    banner.className = `decision-banner ${decision.status.toLowerCase().replace('-', '')}`;
    
    if (decision.status === 'GO') {
        icon.innerHTML = '✓';
        title.textContent = 'GO - Brief Accepté';
        message.textContent = 'Tous les critères sont remplis. Ce briefing peut être traité par CREATE.';
    } else {
        icon.innerHTML = '✗';
        title.textContent = 'NO-GO - Brief Refusé';
        message.textContent = `Issues identifiées: ${decision.issues.join(', ')}`;
    }
}

function populateFields(data) {
    // Contact
    setText('responsable_commercial', data.contact.responsable_commercial);
    setText('agence_media', data.contact.agence_media);
    
    // Advertiser
    setText('group_or_annonceur', data.advertiser.group_or_annonceur);
    setText('brand_or_product', data.advertiser.brand_or_product);
    
    // Brief
    setText('brief_type', data.brief.type);
    setText('urgency', data.brief.urgency);
    setText('typologie_annonceur', data.brief.typologie_annonceur);
    setText('presentation_languages', data.brief.presentation_languages?.join(', '));
    setText('target_persona', data.brief.target_persona);
    setText('objectives', data.brief.objectives?.join(', '));
    setText('key_messages', data.brief.key_messages);
    setText('media_specific_preferences', data.brief.media_specific_preferences?.join(', '));
    setText('notes', data.brief.notes);
    
    // Constraints
    setText('budget_confirmed_eur_range', 
        data.constraints.budget_confirmed_eur_range ? 
        `€${data.constraints.budget_confirmed_eur_range.replace('-', ' - €')}` : null);
    setText('proposal_deadline', 
        data.constraints.proposal_deadline ? 
        new Date(data.constraints.proposal_deadline).toLocaleDateString('fr-FR') : null);
    
    // Creative
    setText('sports_focus', data.creative.sports_focus?.join(', '));
    setText('audience_activity_min_sessions_per_week', 
        data.creative.audience_activity_min_sessions_per_week ? 
        `${data.creative.audience_activity_min_sessions_per_week} sessions/week` : null);
    setText('do_not', data.constraints.do_not?.join(', '));
    setText('prefer', data.constraints.prefer?.join(', '));
}

function setText(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value || '-';
    }
}

function showProcessing() {
    document.querySelector('.upload-section .upload-area').style.display = 'none';
    processing.style.display = 'block';
}

function hideProcessing() {
    processing.style.display = 'none';
    document.querySelector('.upload-section .upload-area').style.display = 'flex';
}

// Reset functionality
function resetDashboard() {
    dashboard.style.display = 'none';
    document.querySelector('.upload-section').style.display = 'block';
    fileInput.value = '';
    extractedData = null;
}