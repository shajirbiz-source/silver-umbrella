let state = {
    annualCTC: 1150000,
    pfRestricted: 15000,
    pfEnabled: true,
    ptEnabled: true,
    esiEnabled: true
};

function formatCurrency(n) {
    return "₹" + n.toLocaleString("en-IN");
}

function calculateFromCTC(ctc, pfCap, enablePF, enablePT, enableESI) {

    const monthlyCTC = Math.round(ctc / 12);

    const employerEPS = enablePF ? 1250 : 0;
    const employerEPF = enablePF ? Math.round(pfCap * 0.12) - employerEPS : 0;
    const edli = enablePF ? 75 : 0;
    const epfAdmin = enablePF ? Math.round(pfCap * 0.005) : 0;

    let tempGross = monthlyCTC - (employerEPF + employerEPS + edli + epfAdmin);

    const esiApplicable = enableESI && tempGross <= 21000;
    const employerESI = esiApplicable ? Math.round(tempGross * 0.0325) : 0;

    const totalEmployerCharges =
        employerEPF + employerEPS + edli + epfAdmin + employerESI;

    const grossSalary = monthlyCTC - totalEmployerCharges;

    // UPDATED — Basic = 50% of Gross
    const basicDA = Math.round(grossSalary * 0.50);
    const hra = Math.round(basicDA * 0.50);
    const specialAllowance = grossSalary - basicDA - hra;

    const employeePF = enablePF ? Math.round(pfCap * 0.12) : 0;
    const employeeESI = esiApplicable ? Math.round(grossSalary * 0.0075) : 0;
    const professionalTax = enablePT && grossSalary > 15000 ? 200 : 0;

    const totalDeductions =
        employeePF + employeeESI + professionalTax;

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
        totalEmployerCharges,
        esiApplicable,
        pfEnabled: enablePF,
        ptEnabled: enablePT,
        esiEnabled: enableESI
    };
}

function renderFlowSteps(calc) {
    document.getElementById("flowSteps").innerHTML = `
        <div class="flow-step"><div class="step-number">1</div>Annual CTC: <strong>${formatCurrency(state.annualCTC)}</strong></div>
        <div class="flow-arrow">↓</div>
        <div class="flow-step"><div class="step-number">2</div>Monthly CTC: <strong>${formatCurrency(calc.monthlyCTC)}</strong></div>
        <div class="flow-arrow">↓</div>
        <div class="flow-step"><div class="step-number">3</div>Gross Salary: <strong>${formatCurrency(calc.grossSalary)}</strong></div>
        <div class="flow-arrow">↓</div>
        <div class="flow-step"><div class="step-number">4</div>
            Basic 50% = ${formatCurrency(calc.basicDA)}, HRA = ${formatCurrency(calc.hra)}, SA = ${formatCurrency(calc.specialAllowance)}
        </div>
        <div class="flow-arrow">↓</div>
        <div class="flow-step"><div class="step-number">5</div>Net In-Hand: <strong>${formatCurrency(calc.netSalary)}</strong></div>
    `;
}

function renderSalaryComponents(calc) {
    document.getElementById("salaryComponents").innerHTML = `
        <tr><td>Basic + DA (50%)</td><td>${formatCurrency(calc.basicDA)}</td></tr>
        <tr><td>HRA (50% of Basic)</td><td>${formatCurrency(calc.hra)}</td></tr>
        <tr><td>Special Allowance</td><td>${formatCurrency(calc.specialAllowance)}</td></tr>
        <tr class="row-bold row-highlight"><td>Gross Salary</td><td>${formatCurrency(calc.grossSalary)}</td></tr>
    `;
}

function renderDeductions(calc) {
    let html = "";

    if (calc.pfEnabled)
        html += `<tr><td>Employee PF (12%)</td><td>${formatCurrency(calc.employeePF)}</td></tr>`;

    if (calc.esiApplicable)
        html += `<tr><td>Employee ESI (0.75%)</td><td>${formatCurrency(calc.employeeESI)}</td></tr>`;

    if (calc.ptEnabled)
        html += `<tr><td>Professional Tax</td><td>${formatCurrency(calc.professionalTax)}</td></tr>`;

    html += `<tr class="row-bold row-highlight-red">
        <td>Total Deductions</td><td>${formatCurrency(calc.totalDeductions)}</td>
    </tr>`;

    document.getElementById("deductionsTable").innerHTML = html;
}

function renderEmployerCosts(calc) {
    let html = `
        <tr><td>Gross Salary</td><td>${formatCurrency(calc.grossSalary)}</td></tr>
        <tr><td colspan="2" class="row-header">+ Employer Statutory Contributions</td></tr>
    `;

    if (calc.pfEnabled) {
        html += `<tr><td class="row-indent">EPF</td><td>${formatCurrency(calc.employerEPF)}</td></tr>`;
        html += `<tr><td class="row-indent">EPS</td><td>${formatCurrency(calc.employerEPS)}</td></tr>`;
        html += `<tr><td class="row-indent">EDLI (Insurance)</td><td>${formatCurrency(calc.edli)}</td></tr>`;
        html += `<tr><td class="row-indent">EPF Admin Charges</td><td>${formatCurrency(calc.epfAdmin)}</td></tr>`;
    }

    if (calc.esiApplicable)
        html += `<tr><td class="row-indent">ESI Employer</td><td>${formatCurrency(calc.employerESI)}</td></tr>`;

    html += `
        <tr class="row-bold row-highlight-purple">
            <td>Total Employer Charges</td>
            <td>${formatCurrency(calc.totalEmployerCharges)}</td>
        </tr>
    `;

    document.getElementById("employerCosts").innerHTML = html;
}

function renderSummary(calc) {
    document.getElementById("summaryGrid").innerHTML = `
        <div class="summary-card purple"><p>Annual CTC</p><p>${formatCurrency(state.annualCTC)}</p></div>
        <div class="summary-card blue"><p>Annual Gross</p><p>${formatCurrency(calc.grossSalary * 12)}</p></div>
        <div class="summary-card red"><p>Total Deductions</p><p>${formatCurrency(calc.totalDeductions * 12)}</p></div>
        <div class="summary-card green"><p>Annual In-Hand</p><p>${formatCurrency(calc.netSalary * 12)}</p></div>
    `;

    document.getElementById("summaryStats").innerHTML = `
        <div class="stat-item"><p>Take-home %</p><p>${((calc.netSalary * 12 / state.annualCTC) * 100).toFixed(1)}%</p></div>
        <div class="stat-item"><p>Employer Cost %</p><p>${((calc.totalEmployerCharges / calc.grossSalary) * 100).toFixed(1)}%</p></div>
        <div class="stat-item"><p>Total Deduction %</p><p>${((calc.totalDeductions / calc.grossSalary) * 100).toFixed(1)}%</p></div>
    `;
}

function renderNotes(calc) {
    document.getElementById("notesList").innerHTML = `
        <li>Annual CTC = ${formatCurrency(state.annualCTC)}</li>
        <li>Gross = Monthly CTC − Employer Contributions</li>
        <li>Basic = 50% of Gross, HRA = 50% of Basic</li>
        <li>Special Allowance = Gross − Basic − HRA</li>
        <li>PF, ESI & PT applied based on eligibility</li>
    `;
}

function updateDisplay() {
    const calc = calculateFromCTC(
        state.annualCTC,
        state.pfRestricted,
        state.pfEnabled,
        state.ptEnabled,
        state.esiEnabled
    );

    document.getElementById("monthlyInHand").textContent = formatCurrency(calc.netSalary);
    document.getElementById("annualInHand").textContent = formatCurrency(calc.netSalary * 12);
    document.getElementById("monthlyCTC").textContent = formatCurrency(calc.monthlyCTC);
    document.getElementById("annualCTCDisplay").textContent = formatCurrency(state.annualCTC);

    renderFlowSteps(calc);
    renderSalaryComponents(calc);
    renderDeductions(calc);
    renderEmployerCosts(calc);
    renderSummary(calc);
    renderNotes(calc);
}

document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("annualCTC").addEventListener("input", e => {
        state.annualCTC = Number(e.target.value);
        updateDisplay();
    });

    document.getElementById("pfRestricted").addEventListener("input", e => {
        state.pfRestricted = Number(e.target.value);
        updateDisplay();
    });

    const toggles = [
        { id: "pfToggle", key: "pfEnabled" },
        { id: "ptToggle", key: "ptEnabled" },
        { id: "esiToggle", key: "esiEnabled" }
    ];

    toggles.forEach(t => {
        const el = document.getElementById(t.id);
        el.classList.add("active");
        el.addEventListener("click", () => {
            state[t.key] = !state[t.key];
            el.classList.toggle("active");
            updateDisplay();
        });
    });

    updateDisplay();
});
