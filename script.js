// State management
let state = {
    annualCTC: 1150000,
    pfRestricted: 15000,
    pfEnabled: true,
    ptEnabled: true,
    esiEnabled: true
};

// Format currency
function formatCurrency(amount) {
    return '₹' + amount.toLocaleString('en-IN');
}

// Calculate salary breakdown
function calculateFromCTC(ctc, pfCap, enablePF, enablePT, enableESI) {
    const monthlyCTC = Math.round(ctc / 12);
    
    // Employer statutory charges
    const employerEPS = enablePF ? 1250 : 0;
    const employerEPF = enablePF ? Math.round(pfCap * 0.12) - employerEPS : 0;
    const edli = enablePF ? 75 : 0;
    const epfAdmin = enablePF ? Math.round(pfCap * 0.005) : 0;
    const edliAdmin = enablePF ? Math.round(pfCap * 0.0001) : 0;
    
    // Calculate gross (approximate first)
    let tempGross = monthlyCTC - (employerEPF + employerEPS + edli + epfAdmin + edliAdmin);
    
    // ESI applicability
    const esiApplicable = enableESI && tempGross <= 21000;
    const employerESI = esiApplicable ? Math.round(tempGross * 0.0325) : 0;
    
    const totalEmployerCharges = employerEPF + employerEPS + edli + epfAdmin + edliAdmin + employerESI;
    
    // Final gross salary
    const grossSalary = monthlyCTC - totalEmployerCharges;
    
    // Salary components
    const basicDA = Math.round(grossSalary * 0.40);
    const hra = Math.round(basicDA * 0.50);
    const specialAllowance = grossSalary - basicDA - hra;
    
    // Employee deductions
    const employeePF = enablePF ? Math.round(pfCap * 0.12) : 0;
    const employeeESI = esiApplicable ? Math.round(grossSalary * 0.0075) : 0;
    const professionalTax = (enablePT && grossSalary > 15000) ? 200 : 0;
    const totalDeductions = employeePF + employeeESI + professionalTax;
    
    // Net salary
    const netSalary = grossSalary - totalDeductions;
    
    return {
        monthlyCTC,
        grossSalary,
        basicDA,
        hra,
        specialAllowance,
        employeePF,
        employeeESI,
        professionalTax,
        totalDeductions,
        netSalary,
        employerEPF,
        employerEPS,
        employerESI,
        edli,
        epfAdmin,
        edliAdmin,
        totalEmployerCharges,
        esiApplicable,
        pfEnabled: enablePF,
        ptEnabled: enablePT,
        esiEnabled: enableESI
    };
}

// Render flow steps
function renderFlowSteps(calc) {
    const flowSteps = document.getElementById('flowSteps');
    const steps = [
        { num: 1, text: `Annual CTC: <strong style="color: #9333ea">${formatCurrency(state.annualCTC)}</strong>` },
        { arrow: '↓ Divide by 12 months' },
        { num: 2, text: `Monthly CTC: <strong>${formatCurrency(calc.monthlyCTC)}</strong>` },
        { arrow: `↓ Subtract employer statutory charges (${formatCurrency(calc.totalEmployerCharges)})` },
        { num: 3, text: `Gross Salary: <strong style="color: #2563eb">${formatCurrency(calc.grossSalary)}</strong>` },
        { arrow: '↓ Split: Basic (40%), HRA (50% of Basic), Special Allowance (balance)' },
        { num: 4, text: `Components: Basic (${formatCurrency(calc.basicDA)}), HRA (${formatCurrency(calc.hra)}), SA (${formatCurrency(calc.specialAllowance)})` },
        { arrow: `↓ Subtract employee deductions: PF + PT (${formatCurrency(calc.totalDeductions)})` },
        { num: 5, text: `Net In-Hand Salary: <strong style="color: #16a34a">${formatCurrency(calc.netSalary)}</strong>` }
    ];
    
    flowSteps.innerHTML = steps.map(step => {
        if (step.arrow) {
            return `<div class="flow-arrow">${step.arrow}</div>`;
        } else {
            return `
                <div class="flow-step">
                    <div class="step-number">${step.num}</div>
                    <span>${step.text}</span>
                </div>
            `;
        }
    }).join('');
}

// Render salary components table
function renderSalaryComponents(calc) {
    const table = document.getElementById('salaryComponents');
    const rows = [
        { label: 'Basic Salary + DA (40%)', amount: calc.basicDA },
        { label: 'HRA (50% of Basic)', amount: calc.hra },
        { label: 'Special Allowance', amount: calc.specialAllowance },
        { label: 'Gross Salary', amount: calc.grossSalary, bold: true, highlight: 'blue' }
    ];
    
    table.innerHTML = rows.map(row => `
        <tr class="${row.bold ? 'row-bold' : ''} ${row.highlight ? 'row-highlight' : ''}">
            <td>${row.label}</td>
            <td>${formatCurrency(row.amount)}</td>
        </tr>
    `).join('');
}

// Render deductions table
function renderDeductions(calc) {
    const table = document.getElementById('deductionsTable');
    const rows = [];
    
    if (calc.pfEnabled) {
        rows.push({ label: `Employee PF (12% of ${formatCurrency(state.pfRestricted)})`, amount: calc.employeePF });
    }
    if (calc.esiApplicable) {
        rows.push({ label: 'Employee ESI (0.75%)', amount: calc.employeeESI });
    }
    if (calc.ptEnabled) {
        rows.push({ label: 'Professional Tax', amount: calc.professionalTax });
    }
    rows.push({ label: 'Total Deductions', amount: calc.totalDeductions, bold: true, highlight: 'red' });
    
    table.innerHTML = rows.map(row => `
        <tr class="${row.bold ? 'row-bold' : ''} ${row.highlight ? 'row-highlight-' + row.highlight : ''}">
            <td>${row.label}</td>
            <td>${formatCurrency(row.amount)}</td>
        </tr>
    `).join('');
    
    if (!calc.pfEnabled && !calc.ptEnabled && !calc.esiApplicable) {
        table.innerHTML += '<tr><td colspan="2" style="text-align: center; color: #6b7280; font-style: italic; font-size: 0.75rem;">No deductions enabled</td></tr>';
    }
}

// Render employer costs table
function renderEmployerCosts(calc) {
    const table = document.getElementById('employerCosts');
    const rows = [
        { label: 'Gross Salary to Employee', amount: calc.grossSalary },
        { header: '+ Employer Statutory Contributions' }
    ];
    
    if (calc.pfEnabled) {
        rows.push({ label: 'EPF (Employee Provident Fund)', amount: calc.employerEPF, indent: true });
        rows.push({ label: 'EPS (Employee Pension Scheme)', amount: calc.employerEPS, indent: true });
    }
    if (calc.esiApplicable) {
        rows.push({ label: 'ESI - Employer (3.25%)', amount: calc.employerESI, indent: true });
    }
    if (calc.pfEnabled) {
        rows.push({ label: 'EDLI (Insurance)', amount: calc.edli, indent: true });
        rows.push({ label: 'EPF Admin Charges (0.5%)', amount: calc.epfAdmin, indent: true });
        rows.push({ label: 'EDLI Admin Charges (0.01%)', amount: calc.edliAdmin, indent: true });
    }
    rows.push({ label: 'Total Employer Charges', amount: calc.totalEmployerCharges, bold: true, highlight: 'purple' });
    
    table.innerHTML = rows.map(row => {
        if (row.header) {
            return `<tr><td colspan="2" class="row-header">${row.header}</td></tr>`;
        }
        return `
            <tr class="${row.bold ? 'row-bold' : ''} ${row.highlight ? 'row-highlight-' + row.highlight : ''}">
                <td class="${row.indent ? 'row-indent' : ''}">${row.label}</td>
                <td>${formatCurrency(row.amount)}</td>
            </tr>
        `;
    }).join('');
    
    if (!calc.pfEnabled && !calc.esiApplicable) {
        table.innerHTML += '<tr><td colspan="2" style="text-align: center; color: #6b7280; font-style: italic; font-size: 0.75rem;">No employer contributions (PF and ESI disabled)</td></tr>';
    }
}

// Render summary
function renderSummary(calc) {
    const summaryGrid = document.getElementById('summaryGrid');
    const summaryCards = [
        { label: 'Annual CTC', amount: state.annualCTC, color: 'purple' },
        { label: 'Annual Gross', amount: calc.grossSalary * 12, color: 'blue' },
        { label: 'Total Deductions', amount: calc.totalDeductions * 12, color: 'red' },
        { label: 'Annual In-Hand', amount: calc.netSalary * 12, color: 'green' }
    ];
    
    summaryGrid.innerHTML = summaryCards.map(card => `
        <div class="summary-card ${card.color}">
            <p class="card-label">${card.label}</p>
            <p class="card-amount">${formatCurrency(card.amount)}</p>
        </div>
    `).join('');
    
    const summaryStats = document.getElementById('summaryStats');
    summaryStats.innerHTML = `
        <div class="stat-item">
            <p>Take-home %</p>
            <p>${((calc.netSalary * 12 / state.annualCTC) * 100).toFixed(1)}%</p>
        </div>
        <div class="stat-item">
            <p>Employer Cost %</p>
            <p>${((calc.totalEmployerCharges / calc.grossSalary) * 100).toFixed(1)}%</p>
        </div>
        <div class="stat-item">
            <p>Total Deductions %</p>
            <p>${((calc.totalDeductions / calc.grossSalary) * 100).toFixed(1)}%</p>
        </div>
    `;
}

// Render notes
function renderNotes(calc) {
    const notesList = document.getElementById('notesList');
    const notes = [
        `<strong>Input:</strong> Annual CTC = ${formatCurrency(state.annualCTC)}`,
        `<strong>Step 1:</strong> Monthly CTC = ${formatCurrency(state.annualCTC)} ÷ 12 = ${formatCurrency(calc.monthlyCTC)}`,
        `<strong>Step 2:</strong> Gross = Monthly CTC - Employer charges (${formatCurrency(calc.totalEmployerCharges)}) = ${formatCurrency(calc.grossSalary)}`,
        `<strong>Step 3:</strong> Basic + DA = 40% of Gross = ${formatCurrency(calc.basicDA)}`,
        `<strong>Step 4:</strong> HRA = 50% of Basic = ${formatCurrency(calc.hra)}`,
        `<strong>Step 5:</strong> Special Allowance = Balance = ${formatCurrency(calc.specialAllowance)}`,
        `<strong>Step 6:</strong> Net In-Hand = Gross - Deductions (${formatCurrency(calc.totalDeductions)}) = ${formatCurrency(calc.netSalary)}`,
        `<strong>PF Status:</strong> ${calc.pfEnabled ? `Enabled - Calculated on ${formatCurrency(state.pfRestricted)}` : 'Disabled'}`,
        `<strong>PT Status:</strong> ${calc.ptEnabled ? 'Enabled - ₹200/month' : 'Disabled'}`,
        `<strong>ESI Status:</strong> ${calc.esiEnabled ? (calc.esiApplicable ? `Applicable (Gross ≤ ₹21,000) - Employee: 0.75%, Employer: 3.25%` : 'Enabled but not applicable (Gross > ₹21,000)') : 'Disabled'}`,
        `Use the toggle switches above to enable/disable PF, PT, and ESI components`,
        `Employer additionally pays ${formatCurrency(calc.totalEmployerCharges * 12)}/year in statutory contributions`
    ];
    
    notesList.innerHTML = notes.map(note => `<li>${note}</li>`).join('');
}

// Update all displays
function updateDisplay() {
    const calc = calculateFromCTC(
        state.annualCTC,
        state.pfRestricted,
        state.pfEnabled,
        state.ptEnabled,
        state.esiEnabled
    );
    
    // Update highlight boxes
    document.getElementById('monthlyInHand').textContent = formatCurrency(calc.netSalary);
    document.getElementById('annualInHand').textContent = formatCurrency(calc.netSalary * 12);
    document.getElementById('monthlyCTC').textContent = formatCurrency(calc.monthlyCTC);
    document.getElementById('annualCTCDisplay').textContent = formatCurrency(state.annualCTC);
    
    // Render all sections
    renderFlowSteps(calc);
    renderSalaryComponents(calc);
    renderDeductions(calc);
    renderEmployerCosts(calc);
    renderSummary(calc);
    renderNotes(calc);
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Input listeners
    document.getElementById('annualCTC').addEventListener('input', function(e) {
        state.annualCTC = Number(e.target.value) || 0;
        updateDisplay();
    });
    
    document.getElementById('pfRestricted').addEventListener('input', function(e) {
        state.pfRestricted = Number(e.target.value) || 0;
        updateDisplay();
    });
    
    // Toggle listeners
    const pfToggle = document.getElementById('pfToggle');
    const ptToggle = document.getElementById('ptToggle');
    const esiToggle = document.getElementById('esiToggle');
    
    pfToggle.classList.add('active');
    ptToggle.classList.add('active');
    esiToggle.classList.add('active');
    
    pfToggle.addEventListener('click', function() {
        state.pfEnabled = !state.pfEnabled;
        pfToggle.classList.toggle('active');
        updateDisplay();
    });
    
    ptToggle.addEventListener('click', function() {
        state.ptEnabled = !state.ptEnabled;
        ptToggle.classList.toggle('active');
        updateDisplay();
    });
    
    esiToggle.addEventListener('click', function() {
        state.esiEnabled = !state.esiEnabled;
        esiToggle.classList.toggle('active');
        updateDisplay();
    });
    
    // Initial render
    updateDisplay();
});