// Initialize Chart.js
let loanChart;
let currentScheduleType = 'monthly';

// DOM Elements
const loanAmountInput = document.getElementById('loan-amount');
const interestRateInput = document.getElementById('interest-rate');
const loanTenureInput = document.getElementById('loan-tenure');
const loanAmountSlider = document.getElementById('loan-amount-slider');
const interestRateSlider = document.getElementById('interest-rate-slider');
const loanTenureSlider = document.getElementById('loan-tenure-slider');
const scheduleBody = document.getElementById('schedule-body');

// Initialize input values with slider values
loanAmountInput.value = loanAmountSlider.value;
interestRateInput.value = interestRateSlider.value;
loanTenureInput.value = loanTenureSlider.value;

// Add event listeners for sliders
loanAmountSlider.addEventListener('input', (e) => {
    loanAmountInput.value = e.target.value;
    calculateEMI();
});

interestRateSlider.addEventListener('input', (e) => {
    interestRateInput.value = e.target.value;
    calculateEMI();
});

loanTenureSlider.addEventListener('input', (e) => {
    loanTenureInput.value = e.target.value;
    calculateEMI();
});

// Add event listeners for input fields
loanAmountInput.addEventListener('input', (e) => {
    loanAmountSlider.value = e.target.value;
    calculateEMI();
});

interestRateInput.addEventListener('input', (e) => {
    interestRateSlider.value = e.target.value;
    calculateEMI();
});

loanTenureInput.addEventListener('input', (e) => {
    loanTenureSlider.value = e.target.value;
    calculateEMI();
});

function calculateEMI() {
    // Get input values
    const loanAmount = parseFloat(loanAmountInput.value);
    const interestRate = parseFloat(interestRateInput.value);
    const loanTenure = parseFloat(loanTenureInput.value);

    // Validate inputs
    if (isNaN(loanAmount) || isNaN(interestRate) || isNaN(loanTenure)) {
        return;
    }

    if (loanAmount <= 0 || interestRate <= 0 || loanTenure <= 0) {
        return;
    }

    // Convert annual interest rate to monthly
    const monthlyInterestRate = interestRate / 12 / 100;
    const numberOfPayments = loanTenure * 12;

    // Calculate EMI using the formula: EMI = P × r × (1 + r)^n/((1 + r)^n - 1)
    const emi = loanAmount * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments) 
                / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);

    // Calculate total payment and total interest
    const totalPayment = emi * numberOfPayments;
    const totalInterest = totalPayment - loanAmount;

    // Format numbers to Indian currency format
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Update the result display with animation
    updateResultWithAnimation('monthly-emi', formatCurrency(emi));
    updateResultWithAnimation('total-interest', formatCurrency(totalInterest));
    updateResultWithAnimation('total-payment', formatCurrency(totalPayment));
    updateResultWithAnimation('principal-amount', formatCurrency(loanAmount));
    updateResultWithAnimation('interest-amount', formatCurrency(totalInterest));

    // Update chart
    updateChart(loanAmount, totalInterest);

    // Generate and display repayment schedule
    generateRepaymentSchedule(loanAmount, monthlyInterestRate, numberOfPayments, emi);
}

function updateResultWithAnimation(elementId, value) {
    const element = document.getElementById(elementId);
    element.style.opacity = '0';
    element.style.transform = 'translateY(10px)';
    
    setTimeout(() => {
        element.textContent = value;
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
    }, 200);
}

function updateChart(principal, interest) {
    const ctx = document.getElementById('loanChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (loanChart) {
        loanChart.destroy();
    }

    // Create new chart
    loanChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Principal Amount', 'Interest Amount'],
            datasets: [{
                data: [principal, interest],
                backgroundColor: [
                    '#3b82f6',  // Blue for principal
                    '#ef4444'   // Red for interest
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            return new Intl.NumberFormat('en-IN', {
                                style: 'currency',
                                currency: 'INR',
                                maximumFractionDigits: 0
                            }).format(value);
                        }
                    }
                }
            },
            cutout: '70%'
        }
    });
}

function generateRepaymentSchedule(loanAmount, monthlyInterestRate, numberOfPayments, emi) {
    let balance = loanAmount;
    let schedule = [];
    let currentDate = new Date();

    for (let i = 1; i <= numberOfPayments; i++) {
        const interestPayment = balance * monthlyInterestRate;
        const principalPayment = emi - interestPayment;
        balance -= principalPayment;

        schedule.push({
            date: new Date(currentDate.getFullYear(), currentDate.getMonth() + i - 1, currentDate.getDate()),
            emi: emi,
            principal: principalPayment,
            interest: interestPayment,
            balance: Math.max(0, balance)
        });
    }

    displaySchedule(schedule);
}

function displaySchedule(schedule) {
    scheduleBody.innerHTML = '';
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Create payment detail modal if it doesn't exist
    if (!document.getElementById('paymentDetailModal')) {
        const modal = document.createElement('div');
        modal.id = 'paymentDetailModal';
        modal.className = 'payment-detail-modal';
        modal.innerHTML = `
            <div class="payment-detail-content">
                <div class="payment-detail-header">
                    <h4>Payment Details</h4>
                    <button class="close-modal" onclick="closePaymentModal()">&times;</button>
                </div>
                <div id="paymentDetailBody"></div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    if (currentScheduleType === 'yearly') {
        // Group by year
        const yearlySchedule = {};
        schedule.forEach((payment, index) => {
            const year = payment.date.getFullYear();
            if (!yearlySchedule[year]) {
                yearlySchedule[year] = {
                    date: new Date(year, 0, 1),
                    emi: 0,
                    principal: 0,
                    interest: 0,
                    balance: payment.balance
                };
            }
            yearlySchedule[year].emi += payment.emi;
            yearlySchedule[year].principal += payment.principal;
            yearlySchedule[year].interest += payment.interest;
        });

        Object.values(yearlySchedule).forEach((yearlyPayment, index) => {
            const isMobile = window.innerWidth <= 480;
            
            if (isMobile) {
                // Card layout for mobile
                const row = document.createElement('div');
                row.className = 'schedule-row';
                row.innerHTML = `
                    <div class="schedule-cell" data-label="Period">${formatDate(yearlyPayment.date)}</div>
                    <div class="schedule-cell" data-label="EMI">${formatCurrency(yearlyPayment.emi)}</div>
                    <div class="schedule-cell principal" data-label="Principal">${formatCurrency(yearlyPayment.principal)}</div>
                    <div class="schedule-cell interest" data-label="Interest">${formatCurrency(yearlyPayment.interest)}</div>
                    <div class="schedule-cell balance" data-label="Balance">${formatCurrency(yearlyPayment.balance)}</div>
                `;
                scheduleBody.appendChild(row);
            } else {
                // Grid layout for desktop
                const row = document.createElement('div');
                row.className = 'schedule-row';
                row.innerHTML = `
                    <div class="schedule-cell">${formatDate(yearlyPayment.date)}</div>
                    <div class="schedule-cell">${formatCurrency(yearlyPayment.emi)}</div>
                    <div class="schedule-cell principal">${formatCurrency(yearlyPayment.principal)}</div>
                    <div class="schedule-cell interest">${formatCurrency(yearlyPayment.interest)}</div>
                    <div class="schedule-cell balance">${formatCurrency(yearlyPayment.balance)}</div>
                `;
                scheduleBody.appendChild(row);
            }
        });
    } else {
        // Monthly schedule
        schedule.forEach((payment, index) => {
            const isMobile = window.innerWidth <= 480;
            
            if (isMobile) {
                // Card layout for mobile
                const row = document.createElement('div');
                row.className = 'schedule-row';
                row.innerHTML = `
                    <div class="schedule-cell" data-label="Period">${formatDate(payment.date)}</div>
                    <div class="schedule-cell" data-label="EMI">${formatCurrency(payment.emi)}</div>
                    <button class="view-details-btn" onclick="showPaymentDetail(${index})">
                        <i class="fas fa-info-circle"></i> View details
                    </button>
                `;
                row.setAttribute('data-index', index);
                scheduleBody.appendChild(row);
            } else {
                // Grid layout for desktop
                const row = document.createElement('div');
                row.className = 'schedule-row';
                row.innerHTML = `
                    <div class="schedule-cell">${formatDate(payment.date)}</div>
                    <div class="schedule-cell">${formatCurrency(payment.emi)}</div>
                    <div class="schedule-cell principal">${formatCurrency(payment.principal)}</div>
                    <div class="schedule-cell interest">${formatCurrency(payment.interest)}</div>
                    <div class="schedule-cell balance">${formatCurrency(payment.balance)}</div>
                `;
                scheduleBody.appendChild(row);
            }
        });
    }
    
    // Store the schedule data for the modal
    window.paymentSchedule = schedule;
}

// Function to show payment detail modal
function showPaymentDetail(index) {
    const payment = window.paymentSchedule[index];
    const modal = document.getElementById('paymentDetailModal');
    const detailBody = document.getElementById('paymentDetailBody');
    
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };
    
    detailBody.innerHTML = `
        <div class="payment-detail-row">
            <div class="payment-detail-label">Date</div>
            <div class="payment-detail-value">${formatDate(payment.date)}</div>
        </div>
        <div class="payment-detail-row">
            <div class="payment-detail-label">EMI</div>
            <div class="payment-detail-value">${formatCurrency(payment.emi)}</div>
        </div>
        <div class="payment-detail-row">
            <div class="payment-detail-label">Principal</div>
            <div class="payment-detail-value principal">${formatCurrency(payment.principal)}</div>
        </div>
        <div class="payment-detail-row">
            <div class="payment-detail-label">Interest</div>
            <div class="payment-detail-value interest">${formatCurrency(payment.interest)}</div>
        </div>
        <div class="payment-detail-row">
            <div class="payment-detail-label">Balance</div>
            <div class="payment-detail-value balance">${formatCurrency(payment.balance)}</div>
        </div>
    `;
    
    modal.style.display = 'flex';
}

// Function to close payment detail modal
function closePaymentModal() {
    const modal = document.getElementById('paymentDetailModal');
    modal.style.display = 'none';
}

// Add resize event listener to update the schedule when the window is resized
window.addEventListener('resize', () => {
    calculateEMI();
});

function showSchedule(type) {
    currentScheduleType = type;
    const buttons = document.querySelectorAll('.schedule-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase() === type) {
            btn.classList.add('active');
        }
    });
    calculateEMI(); // Recalculate to update schedule
}

// Initial calculation
calculateEMI(); 