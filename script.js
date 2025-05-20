// Import pay matrix functions
import { payMatrix, getBasicPay, getIndicesForLevel, applyCPC } from '/data/pay-matrix-7th-cpc.js';

// Define pay levels (1-18 as per 7th CPC)
const payLevels = Array.from({ length: 18 }, (_, i) => i + 1);

// Define pay indices (1-40 as per 7th CPC matrix)
const payIndices = Array.from({ length: 40 }, (_, i) => i + 1);

// Log pay matrix info for debugging
console.log('Pay matrix loaded with levels:', Object.keys(payMatrix).sort((a, b) => a - b));

// DOM Elements
const payLevelSelect = document.getElementById('payLevel');
const payIndexSelect = document.getElementById('payIndex');
const currentBasicSelect = document.getElementById('currentBasic');
const currentDAInput = document.getElementById('currentDA');
const dateOfJoiningInput = document.getElementById('dateOfJoining');
const retirementDateInput = document.getElementById('retirementDate');
const incrementMonthRadios = document.getElementsByName('incrementMonth');
const currentNPSCorpusInput = document.getElementById('currentNPSCorpus');
const addPromotionBtn = document.getElementById('addPromotion');
const promotionContainer = document.getElementById('promotionContainer');
const calculateBtn = document.getElementById('calculateBtn');
const resultsSection = document.getElementById('results');
const npsResultsDiv = document.getElementById('npsResults');
const upsResultsDiv = document.getElementById('upsResults');
const projectionBody = document.getElementById('projectionBody');
let pensionChart = null;

// Initialize the application
function init() {
    // Set default dates
    const today = new Date();
    
    // Set default retirement date to 20 years from now
    const defaultRetirementDate = new Date(today);
    defaultRetirementDate.setFullYear(today.getFullYear() + 20);
    retirementDateInput.valueAsDate = defaultRetirementDate;
    
    // Set default date of joining to 20 years before retirement (for a 40-year career)
    const defaultJoiningDate = new Date(today);
    defaultJoiningDate.setFullYear(today.getFullYear() - 20);
    dateOfJoiningInput.valueAsDate = defaultJoiningDate;
    
    // Populate pay level dropdown
    payLevels.forEach(level => {
        const option = document.createElement('option');
        option.value = level;
        option.textContent = `Level ${level}`;
        payLevelSelect.appendChild(option);
    });
    
    // Set default level and populate initial basic pay options
    payLevelSelect.value = '10';
    updateBasicPayOptions();
    
    // Add event listeners
    payLevelSelect.addEventListener('change', updateBasicPayOptions);
    currentBasicSelect.addEventListener('change', updatePayIndex);
    
    // Initialize hidden pay index (for internal calculations)
    updatePayIndex();
    
    // Other event listeners
    addPromotionBtn.addEventListener('click', addPromotionEntry);
    calculateBtn.addEventListener('click', calculatePension);
}

// Update basic pay dropdown options based on selected level
function updateBasicPayOptions() {
    console.log('updateBasicPayOptions called');
    const level = payLevelSelect.value;
    console.log('Selected level:', level);
    const currentBasicPay = currentBasicSelect.value;
    console.log('Current basic pay:', currentBasicPay);
    
    // Clear existing options
    currentBasicSelect.innerHTML = '';
    
    // Get all basic pays for the selected level
    const basicPays = [];
    
    // Check if payMatrix is defined and has the selected level
    if (!payMatrix || !payMatrix[level]) {
        console.error('No pay matrix data for level:', level);
        return;
    }
    
    console.log('payMatrix[level]:', payMatrix[level]);
    const indices = Object.keys(payMatrix[level]).map(Number).sort((a, b) => a - b);
    console.log('Indices for level', level, ':', indices);
    
    // Add options for each index in the level
    indices.forEach(index => {
        const basicPay = payMatrix[level][index];
        const option = document.createElement('option');
        option.value = basicPay;
        option.textContent = `${basicPay.toLocaleString()} (Index ${index})`;
        option.dataset.index = index; // Store the index as a data attribute
        currentBasicSelect.appendChild(option);
        basicPays.push(basicPay);
    });
    
    // Set the selected value (try to maintain selection if possible)
    if (basicPays.includes(parseInt(currentBasicPay))) {
        currentBasicSelect.value = currentBasicPay;
    } else if (basicPays.length > 0) {
        // Select the first pay by default
        currentBasicSelect.selectedIndex = 0;
    }
    
    // Update the hidden pay index
    updatePayIndex();
}

// Update the hidden pay index based on selected basic pay
function updatePayIndex() {
    const selectedOption = currentBasicSelect.options[currentBasicSelect.selectedIndex];
    if (selectedOption && selectedOption.dataset.index) {
        payIndexSelect.value = selectedOption.dataset.index;
    }
}

// Get the current basic pay (for calculations)
function getCurrentBasicPay() {
    return parseInt(currentBasicSelect.value) || 0;
}

// Add a new promotion entry
function addPromotionEntry() {
    const promotionId = Date.now();
    const promotionEntry = document.createElement('div');
    promotionEntry.className = 'promotion-entry';
    promotionEntry.dataset.id = promotionId;
    
    promotionEntry.innerHTML = `
        <div>
            <label>Promotion Date</label>
            <input type="date" class="promotion-date" required>
        </div>
        <div>
            <label>New Level</label>
            <select class="promotion-level">
                ${payLevels.map(level => 
                    `<option value="${level}">Level ${level}</option>`
                ).join('')}
            </select>
        </div>
        <div>
            <label>New Basic Pay</label>
            <select class="promotion-basic">
                ${getBasicPayOptions(payLevels[0])}
            </select>
        </div>
        <div style="display: none;">
            <label>New Index (hidden)</label>
            <select class="promotion-index">
                ${payIndices.map(index => 
                    `<option value="${index}">${index}</option>`
                ).join('')}
            </select>
        </div>
        <button type="button" class="remove-promotion" data-id="${promotionId}">×</button>
    `;
    
    promotionContainer.appendChild(promotionEntry);
    
    // Add event listeners
    const levelSelect = promotionEntry.querySelector('.promotion-level');
    const basicSelect = promotionEntry.querySelector('.promotion-basic');
    const indexSelect = promotionEntry.querySelector('.promotion-index');
    const removeBtn = promotionEntry.querySelector('.remove-promotion');
    
    // Update basic pay options when level changes
    levelSelect.addEventListener('change', () => {
        const level = levelSelect.value;
        const currentBasic = basicSelect.value;
        basicSelect.innerHTML = getBasicPayOptions(level);
        
        // Try to maintain selection if possible
        if (basicSelect.querySelector(`option[value="${currentBasic}"]`)) {
            basicSelect.value = currentBasic;
        }
        updatePromotionIndex(basicSelect, indexSelect);
    });
    
    // Update index when basic pay changes
    basicSelect.addEventListener('change', () => {
        updatePromotionIndex(basicSelect, indexSelect);
    });
    
    // Initialize index based on initial basic pay selection
    updatePromotionIndex(basicSelect, indexSelect);
    
    // Remove button handler
    removeBtn.addEventListener('click', () => {
        promotionEntry.remove();
    });
}

// Helper function to get basic pay options for a level
function getBasicPayOptions(level) {
    if (!payMatrix[level]) return '';
    
    const indices = Object.keys(payMatrix[level])
        .map(Number)
        .sort((a, b) => a - b);
    
    return indices.map(index => {
        const basicPay = payMatrix[level][index];
        return `<option value="${basicPay}" data-index="${index}">₹${basicPay.toLocaleString('en-IN')} (Index ${index})</option>`;
    }).join('');
}

// Update the promotion index based on selected basic pay
function updatePromotionIndex(basicSelect, indexSelect) {
    const selectedOption = basicSelect.options[basicSelect.selectedIndex];
    if (selectedOption && selectedOption.dataset.index) {
        indexSelect.value = selectedOption.dataset.index;
    }
}

// Get all promotion entries
function getPromotionEntries() {
    const entries = [];
    const promotionElements = document.querySelectorAll('.promotion-entry');
    
    promotionElements.forEach(el => {
        entries.push({
            date: new Date(el.querySelector('.promotion-date').value),
            level: parseInt(el.querySelector('.promotion-level').value),
            index: parseInt(el.querySelector('.promotion-index').value)
        });
    });
    
    // Sort promotions by date
    return entries.sort((a, b) => a.date - b.date);
}

// Main calculation function
// Helper function to calculate years and months between two dates
function calculateService(startDate, endDate) {
    let years = endDate.getFullYear() - startDate.getFullYear();
    let months = endDate.getMonth() - startDate.getMonth();
    
    if (months < 0 || (months === 0 && endDate.getDate() < startDate.getDate())) {
        years--;
        months += 12;
    }
    
    // Add partial month if needed
    if (endDate.getDate() < startDate.getDate()) {
        months--;
    }
    
    return { years, months };
}

function calculatePension() {
    // Get input values
    const currentBasic = getCurrentBasicPay();
    const currentDA = parseFloat(currentDAInput.value) || 0;
    const dateOfJoining = new Date(dateOfJoiningInput.value);
    const retirementDate = new Date(retirementDateInput.value);
    const incrementMonth = parseInt(document.querySelector('input[name="incrementMonth"]:checked').value);
    const currentNPSCorpus = parseFloat(currentNPSCorpusInput.value) || 0;
    
    // Calculate total service
    const service = calculateService(dateOfJoining, retirementDate);
    const totalServiceYears = service.years + (service.months / 12);
    
    // Check UPS eligibility (minimum 10 years of service)
    const isUPSEligible = totalServiceYears >= 10;
    
    // Validate dates
    if (retirementDate <= dateOfJoining) {
        alert('Retirement date must be after date of joining');
        return;
    }
    
    // Validate inputs
    if (!retirementDate || retirementDate <= new Date()) {
        alert('Please select a valid retirement date in the future.');
        return;
    }
    
    // Get and validate promotions
    const promotions = getPromotionEntries();
    for (const promotion of promotions) {
        if (isNaN(promotion.date.getTime()) || promotion.date <= new Date()) {
            alert('Please enter valid future dates for promotions.');
            return;
        }
    }
    
    // Initialize variables for simulation
    const today = new Date();
    let currentDate = new Date(today);
    currentDate.setDate(1); // Start from the beginning of the current month
    
    let year = currentDate.getFullYear();
    let month = currentDate.getMonth();
    
    let basic = currentBasic;
    let daPercent = currentDA;
    let level = parseInt(payLevelSelect.value);
    let index = parseInt(payIndexSelect.value);
    
    // Track events for chart annotations
    const events = [];
    
    // NPS variables
    let npsCorpus = 0; // Start with 0, we'll add current corpus later if provided
    const npsReturnRate = 0.08; // 8% annual return
    
    // If current NPS corpus is provided, we'll add it at the current date
    const hasInitialCorpus = currentNPSCorpus > 0;
    
    // Data for results
    const projectionData = [];
    
    // Simulation loop (month by month until retirement)
    while (currentDate < retirementDate) {
        // Track if this is a CPC year (2026, 2036, etc.)
        const isCPCYear = year % 10 === 6;
        
        // Handle January of CPC year
        if (isCPCYear && month === 0) { // January of CPC year
            // For January increment: Apply increment first, then fitment factor
            if (incrementMonth === 0) { // January increment
                // Apply increment first
                if (index < 40) {
                    index++;
                    // Update basic pay based on new index
                    basic = getBasicPay(level, index);
                }
            }
            
            // Store pre-CPC values for reference
            const preCPCBasic = basic;
            
            // Apply fitment factor (2.0 for next CPC)
            basic *= 2.0;
            daPercent = 0; // Reset DA to 0%
            
            // Record CPC event
            events.push({
                type: 'cpc',
                year: currentDate.getFullYear(),
                month: currentDate.getMonth(),
                before: preCPCBasic,
                after: basic,
                daPercent: 0,
                level: level,
                index: index
            });
            
            // Update the pay matrix for future calculations
            applyCPC();
        } 
        // Regular increment handling for non-CPC January or July increment
        else if (month === incrementMonth) {
            // Move to next index, but don't exceed 40
            if (index < 40) {
                index++;
                // Update basic pay based on new index
                basic = getBasicPay(level, index);
            }
        }
        
        // Check for DA revision (every January and July)
        if (month === 0 || month === 6) { // January or July
            if (isCPCYear && month === 0) {
                // In January of CPC year, DA is already reset to 0%
                // Next DA increase will be in July of the same year (6 months later)
            } else {
                // Regular DA increase (3% every 6 months)
                daPercent += 3;
            }
        }
        
        // Check for promotions
        const promotion = promotions.find(p => 
            p.date.getFullYear() === year && 
            p.date.getMonth() === month
        );
        
        if (promotion) {
            const prePromoBasic = basic;
            const prePromoLevel = level;
            const prePromoIndex = index;
            
            level = promotion.level;
            index = promotion.index;
            basic = getBasicPay(level, index);
            
            // Record promotion event
            events.push({
                type: 'promotion',
                year: currentDate.getFullYear(),
                month: currentDate.getMonth(),
                before: prePromoBasic,
                after: basic,
                daPercent: daPercent,
                fromLevel: prePromoLevel,
                toLevel: level,
                fromIndex: prePromoIndex,
                toIndex: index
            });
        }
        
        // Calculate DA amount
        const daAmount = basic * (daPercent / 100);
        const totalSalary = basic + daAmount;
        
        // Calculate NPS contribution (10% employee + 14% government = 24% of basic + DA)
        const npsContribution = totalSalary * 0.24;
        
        // Only process contributions for current and future months
        const isCurrentOrFutureMonth = currentDate >= today;
        
        if (isCurrentOrFutureMonth) {
            // Add initial corpus only once, at the start of the simulation
            if (hasInitialCorpus && currentDate.getTime() === today.setDate(1)) {
                npsCorpus = currentNPSCorpus;
            }
            
            // Apply monthly return to existing corpus and add current month's contribution
            npsCorpus = npsCorpus * (1 + npsReturnRate / 12) + npsContribution;
        }
        
        // Store yearly data
        if (month === 0) { // January of each year
            // Check for events in this year
            const yearEvents = events.filter(e => e.year === year);
            
            projectionData.push({
                year: `${year}${yearEvents.length > 0 ? ' *' : ''}`,
                basic,
                daPercent,
                totalSalary,
                npsCorpus: npsCorpus,
                events: [...yearEvents] // Copy events for this year
            });
        }
        
        // Move to next month
        month++;
        if (month > 11) {
            month = 0;
            year++;
        }
        currentDate = new Date(year, month, 1);
    }
    
    // Calculate final results
    // NPS Results
    // Ensure we don't show negative values
    npsCorpus = Math.max(0, npsCorpus);
    const npsLumpSum = npsCorpus * 0.6; // 60% lump sum
    const npsAnnuity = npsCorpus * 0.4; // 40% annuity
    const npsMonthlyPension = (npsAnnuity * 0.065) / 12; // 6.5% of annuity as monthly pension
    
    // UPS Results (last 10 months average)
    const last10Months = projectionData.slice(-10);
    const avgLast10Months = last10Months.reduce((sum, item) => sum + item.totalSalary, 0) / last10Months.length;
    
    // Calculate UPS pension (50% of last 10 months average, only if eligible)
    let upsMonthlyPension = null;
    let upsPensionProjection = null;
    
    if (isUPSEligible) {
        // Calculate base pension (50% of average last 10 months' basic + DA)
        const basePension = avgLast10Months * 0.5;
        upsMonthlyPension = basePension;
        upsPensionProjection = [];
        
        // Project UPS pension with flat DA increases (3% every 6 months)
        const yearsToProject = 20; // Project for 20 years
        
        // Add initial pension (year 0)
        upsPensionProjection.push({
            year: 0,
            pension: basePension,
            daIncrease: 0,
            totalPension: basePension,
            daPercent: 0
        });
        
        // Project for next 20 years with DA increase every 6 months
        let currentDA = 0; // Start with 0% DA
        
        for (let year = 1; year <= yearsToProject; year++) {
            // First half-year (January) - increase DA by 3%
            currentDA += 3;
            const midYearPension = basePension * (1 + currentDA / 100);
            const midYearDA = midYearPension - basePension;
            
            // Second half-year (July) - increase DA by another 3%
            currentDA += 3;
            const endYearPension = basePension * (1 + currentDA / 100);
            const endYearDA = endYearPension - basePension;
            
            // Calculate average DA for the year
            const avgDA = (midYearDA + endYearDA) / 2;
            const avgPension = basePension + avgDA;
            
            // Store the projection for this year
            upsPensionProjection.push({
                year,
                pension: basePension,
                daIncrease: avgDA,
                totalPension: avgPension,
                daPercent: currentDA
            });
        }
    }
    
    // Calculate gratuity (Last drawn basic × completed half-years × 0.5, max ₹25 lakh)
    const lastDrawnBasic = last10Months[last10Months.length - 1].basic;
    const completedHalfYears = Math.floor((service.years * 12 + service.months) / 6);
    const gratuity = Math.min(
        lastDrawnBasic * completedHalfYears * 0.5,
        2500000 // Max ₹25 lakh
    );
    
    // Store service information for display
    const serviceInfo = {
        years: service.years,
        months: service.months,
        isUPSEligible,
        gratuity, // Gratuity is applicable to all employees regardless of pension scheme
        upsPensionProjection // Will be null if not eligible for UPS
    };
    
    // Display results
    displayResults({
        npsCorpus,
        npsLumpSum,
        npsMonthlyPension,
        upsMonthlyPension,
        projectionData,
        serviceInfo,
        events // Pass the events array to displayResults
    });
    
    // Show results section
    resultsSection.classList.remove('hidden');
}

// Calculate real value adjusted for inflation (6.94% average)
function calculateRealValue(amount, yearsInFuture) {
    const inflationRate = 1 - 0.0694; // 6.94% inflation
    return amount * Math.pow(inflationRate, yearsInFuture);
}

// Display calculation results
function displayResults(results) {
    // Format numbers with commas
    const format = num => Math.round(num).toLocaleString('en-IN');
    
    // Calculate real values for 20 years from now
    const yearsInFuture = 20;
    const realValueNPSLumpSum = calculateRealValue(results.npsLumpSum, yearsInFuture);
    const realValueNPSMonthly = calculateRealValue(results.npsMonthlyPension, yearsInFuture);
    const realValueGratuity = calculateRealValue(results.serviceInfo.gratuity, yearsInFuture);
    
    // Calculate real value of UPS pension if eligible
    let realValueUPSMonthly = null;
    if (results.serviceInfo.isUPSEligible && results.upsMonthlyPension !== null) {
        const finalUPSPension = results.serviceInfo.upsPensionProjection[results.serviceInfo.upsPensionProjection.length - 1].totalPension;
        realValueUPSMonthly = calculateRealValue(finalUPSPension, yearsInFuture);
    }
    
    // Service Information
    const serviceInfo = results.serviceInfo;
    const serviceText = `Total Service: ${serviceInfo.years} years, ${serviceInfo.months} months`;
    const upsEligibility = serviceInfo.isUPSEligible ? 
        '<span style="color:green">Eligible for UPS Pension</span>' : 
        '<span style="color:red">Not eligible for UPS Pension (minimum 10 years required)</span>';
    
    // NPS Results
    npsResultsDiv.innerHTML = `
        <div class="result-section">
            <h4>Service Information</h4>
            <p>${serviceText}</p>
            <p>${upsEligibility}</p>
        </div>
        <div class="result-section">
            <h4>NPS (New Pension Scheme)</h4>
            <p><strong>Gratuity (approx):</strong> ₹${format(serviceInfo.gratuity)}</p>
            <p><strong>Final NPS Corpus:</strong> ₹${format(results.npsCorpus)}</p>
            <p><strong>Lump Sum (60%):</strong> ₹${format(results.npsLumpSum)}</p>
            <p><strong>Monthly Pension (40% annuity @6.5%):</strong> ₹${format(results.npsMonthlyPension)}</p>
            
            <div class="real-value-section" style="margin: 20px -15px; padding: 15px; background-color: #f0f7ff; border-radius: 5px; border: 1px solid #d0e3ff;">
                <h4 style="margin-top: 0; color: #0d6efd;">💡 Real Value in Today's Terms</h4>
                <p style="margin-bottom: 10px; color: #495057; font-size: 0.9em;">
                    Adjusted for <strong>6.94% average annual inflation</strong> over ${yearsInFuture} years
                </p>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 10px;">
                    <div>
                        <p style="margin: 5px 0; font-weight: 500;">Lump Sum (60%):</p>
                        <p style="margin: 5px 0; font-weight: 500;">Monthly Pension:</p>
                        <p style="margin: 5px 0; font-weight: 500;">Gratuity:</p>
                    </div>
                    <div>
                        <p style="margin: 5px 0;">₹${format(realValueNPSLumpSum)} <small class="text-muted">(₹${format(results.npsLumpSum)} nominal)</small></p>
                        <p style="margin: 5px 0;">₹${format(realValueNPSMonthly)}/mo <small class="text-muted">(₹${format(results.npsMonthlyPension)} nominal)</small></p>
                        <p style="margin: 5px 0;">₹${format(realValueGratuity)} <small class="text-muted">(₹${format(serviceInfo.gratuity)} nominal)</small></p>
                        <p style="margin: 15px 0 5px 0; padding-top: 10px; border-top: 1px solid #d0e3ff; font-size: 0.9em;">
                            <span style="color: #0a58ca; font-weight: 500;">💡 If withdrawn over 20 years:</span><br>
                            <span style="font-size: 0.95em;">≈ ₹${Math.round(realValueNPSLumpSum / (20 * 12)).toLocaleString()}/mo</span> <small class="text-muted">(in today's terms)</small>
                        </p>
                    </div>
                </div>
                
                <div style="background-color: #e6f2ff; padding: 8px 12px; border-radius: 4px; margin-top: 10px;">
                    <p style="margin: 0 0 10px 0; font-size: 0.85em; color: #0a58ca;">
                        <strong>Note:</strong> Due to inflation, ₹1 in the future will have the same purchasing power as ₹${(1 / Math.pow(1.0694, yearsInFuture)).toFixed(2)} today.
                    </p>
                    <div style="display: flex; align-items: flex-start; margin-top: 8px;">
                        <span style="margin-right: 8px; font-size: 1.1em;">📌</span>
                        <p style="margin: 0; font-size: 0.85em; color: #0a58ca;">
                            <strong>NPS projections are based on assumed average returns</strong> (8% corpus growth, 6.5% annuity rate).<br>
                            <span style="opacity: 0.9;">Actual returns may vary and are not guaranteed.</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;
            
    // UPS Results (only show if eligible)
    let upsHtml = '';
    if (serviceInfo.isUPSEligible && results.upsMonthlyPension !== null) {
        const initialPension = results.upsMonthlyPension;
        const finalPension = serviceInfo.upsPensionProjection[serviceInfo.upsPensionProjection.length - 1].totalPension;
        const totalDAGrowth = ((finalPension - initialPension) / initialPension * 100).toFixed(1);
        
        // Calculate total UPS pension over 20 years (sum of all monthly payments)
        let totalUpsPension = 0;
        let totalUpsPensionReal = 0;
        serviceInfo.upsPensionProjection.forEach((yearData, yearIndex) => {
            // For each month in the year
            for (let month = 0; month < 12; month++) {
                const monthsFromNow = yearIndex * 12 + month;
                const monthlyPension = yearData.totalPension;
                totalUpsPension += monthlyPension;
                totalUpsPensionReal += calculateRealValue(monthlyPension, monthsFromNow / 12);
            }
        });
        
        // Create projection table
        let projectionRows = '';
        serviceInfo.upsPensionProjection.forEach((yearData, index) => {
            if (index % 2 === 0 || index === serviceInfo.upsPensionProjection.length - 1) {
                projectionRows += `
                    <tr>
                        <td>${yearData.year}</td>
                        <td>₹${format(yearData.pension)}</td>
                        <td>${yearData.year === 0 ? 'N/A' : `+${format(yearData.daIncrease)}`}</td>
                        <td>₹${format(yearData.totalPension)}</td>
                    </tr>`;
            }
        });
        
        upsHtml = `
            <div class="result-section">
                <h4>UPS (Unique Pension Scheme)</h4>
                <p><strong>Gratuity (approx):</strong> ₹${format(serviceInfo.gratuity)}</p>
                <p><strong>Initial Monthly Pension:</strong> ₹${format(initialPension)}</p>
                <p><strong>After 20 Years (with DA):</strong> ₹${format(finalPension)} (${totalDAGrowth}% increase)</p>
                <div style="background: #f8f9fa; padding: 10px; border-radius: 4px; margin: 10px 0; border-left: 3px solid #0d6efd;">
                    <p style="margin: 5px 0; font-weight: 500;">Total 20-Year UPS Pension Value:</p>
                    <p style="margin: 5px 0 0 0; font-size: 1.1em;">
                        ₹${format(Math.round(totalUpsPension))} <small class="text-muted">(nominal)</small><br>
                        <span style="color: #0a58ca;">₹${format(Math.round(totalUpsPensionReal))}</span> <small class="text-muted">(in today's terms)</small>
                    </p>
                    <p style="margin: 5px 0 0 0; font-size: 0.85em; color: #6c757d;">
                        Based on 3% DA increase every 6 months
                    </p>
                </div>
                <div class="real-value-section" style="margin: 20px -15px; padding: 15px; background-color: #f0f7ff; border-radius: 5px; border: 1px solid #d0e3ff;">
                    <h4 style="margin-top: 0; color: #0d6efd;">💡 Real Value in Today's Terms</h4>
                    <p style="margin-bottom: 10px; color: #495057; font-size: 0.9em;">
                        Adjusted for <strong>6.94% average annual inflation</strong> over ${yearsInFuture} years
                    </p>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 10px;">
                        <div>
                            <p style="margin: 5px 0; font-weight: 500;">Monthly Pension (after DA):</p>
                            <p style="margin: 5px 0; font-weight: 500;">Gratuity:</p>
                        </div>
                        <div>
                            <p style="margin: 5px 0;">₹${format(realValueUPSMonthly)}/mo <small class="text-muted">(₹${format(finalPension)} nominal)</small></p>
                            <p style="margin: 5px 0;">₹${format(realValueGratuity)} <small class="text-muted">(₹${format(serviceInfo.gratuity)} nominal)</small></p>
                        </div>
                    </div>
                    
                    <div style="background-color: #e6f2ff; padding: 8px 12px; border-radius: 4px; margin-top: 10px;">
                        <p style="margin: 0; font-size: 0.85em; color: #0a58ca;">
                            <strong>Note:</strong> Due to inflation, ₹1 in the future will have the same purchasing power as ₹${(1 / Math.pow(1.0694, yearsInFuture)).toFixed(2)} today.
                        </p>
                    </div>
                </div>
                
                <div class="table-container">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <h5 style="margin: 0;">Pension Projection with DA Growth (3% every 6 months)</h5>
                        <div style="font-size: 0.85em; color: #495057; background: #f8f9fa; padding: 4px 8px; border-radius: 4px; display: inline-flex; align-items: center;">
                            <span style="margin-right: 4px;">ℹ️</span>
                            <span>Pension continues for life (20 years shown for planning)</span>
                        </div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Year</th>
                                <th>Base Pension</th>
                                <th>DA Increase</th>
                                <th>Total Pension</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${projectionRows}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } else {
        upsHtml = `
            <div class="result-section" style="opacity: 0.7;">
                <h4>UPS (Unique Pension Scheme) - Not Eligible</h4>
                <p><strong>Gratuity (approx):</strong> ₹${format(serviceInfo.gratuity)}</p>
                <div class="ineligible-notice">
                    <p>❌ <strong>Not eligible for UPS pension</strong></p>
                    <p>Minimum 10 years of service required (Current: ${serviceInfo.years} years, ${serviceInfo.months} months)</p>
                    <p>Note: Gratuity is still applicable as per NPS rules.</p>
                </div>
            </div>
        `;
    }
    upsResultsDiv.innerHTML = upsHtml;
    
    // Update projection table
    projectionBody.innerHTML = results.projectionData.map(item => `
        <tr>
            <td>${item.year}</td>
            <td>₹${format(item.basic)}</td>
            <td>${item.daPercent.toFixed(2)}%</td>
            <td>₹${format(item.totalSalary)}</td>
            <td>₹${format(item.npsCorpus)}</td>
        </tr>
    `).join('');
    
    // Create/update chart with events (use events from results if available)
    updateChart(results.projectionData, results.events || []);
}

// Update the chart with projection data and events
function updateChart(data, events = []) {
    const ctx = document.getElementById('pensionChart').getContext('2d');
    
    // Destroy previous chart if it exists
    if (pensionChart) {
        pensionChart.destroy();
    }
    
    // Create new chart
    pensionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(item => item.year),
            datasets: [
                {
                    label: 'Basic Pay',
                    data: data.map(item => item.basic),
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                },
                {
                    label: 'Total Salary',
                    data: data.map(item => item.totalSalary),
                    borderColor: 'rgb(54, 162, 235)',
                    tension: 0.1
                },
                {
                    label: 'NPS Corpus',
                    data: data.map(item => item.npsCorpus),
                    borderColor: 'rgb(255, 99, 132)',
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index',
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += '₹' + context.parsed.y.toLocaleString('en-IN');
                                
                                // Add event info to tooltip if available
                                const yearData = data[context.dataIndex];
                                if (yearData.events && yearData.events.length > 0) {
                                    label += '\n\n' + yearData.events.map(event => {
                                        if (event.type === 'cpc') {
                                            return `📈 CPC ${event.year}: Basic × 2.0 (₹${event.before.toLocaleString('en-IN')} → ₹${event.after.toLocaleString('en-IN')})`;
                                        } else if (event.type === 'promotion') {
                                            return `🎯 Promotion: Level ${event.fromLevel}-${event.fromIndex} → ${event.toLevel}-${event.toIndex}\n   Basic: ₹${event.before.toLocaleString('en-IN')} → ₹${event.after.toLocaleString('en-IN')} (+${Math.round((event.after/event.before - 1) * 100)}%)`;
                                        }
                                        return '';
                                    }).join('\n\n');
                                }
                            }
                            return label;
                        }
                    }
                },
                annotation: {
                    annotations: events.map(event => ({
                        type: 'line',
                        mode: 'vertical',
                        scaleID: 'x',
                        value: data.findIndex(d => d.year.startsWith(event.year.toString())),
                        borderColor: event.type === 'cpc' ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 0, 255, 0.5)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        label: {
                            enabled: true,
                            content: event.type === 'cpc' ? 'CPC ' + event.year : 'Promotion',
                            position: 'top',
                            backgroundColor: event.type === 'cpc' ? 'rgba(255, 0, 0, 0.7)' : 'rgba(0, 0, 255, 0.7)'
                        }
                    }))
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value.toLocaleString('en-IN');
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += '₹' + context.parsed.y.toLocaleString('en-IN');
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Export functions needed by other modules
export {
    init,
    updateBasicPayOptions,
    addPromotionEntry,
    updatePromotionIndex,
    getBasicPayOptions
};
