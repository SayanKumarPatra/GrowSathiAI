// ============================================================
//  CALCX — Calculator Logic
// ============================================================

const resultEl    = document.getElementById('result');
const expressionEl = document.getElementById('expression');

let currentInput  = '0';
let previousInput = '';
let operator      = null;
let shouldReset   = false;  // reset display on next digit
let justEvaluated = false;  // track if = was just pressed

// ── Helpers ─────────────────────────────────────────────────

function updateDisplay(value) {
  // Trim very long numbers
  let display = parseFloat(value).toString();
  if (display.length > 12) {
    display = parseFloat(value).toPrecision(9);
  }
  resultEl.textContent = display;
  resultEl.classList.remove('equals-flash');
}

function setExpression(text) {
  expressionEl.textContent = text;
}

function formatSymbol(op) {
  const map = { '*': '×', '/': '÷', '+': '+', '-': '−' };
  return map[op] || op;
}

// ── Core Calculator ──────────────────────────────────────────

function calculate(a, b, op) {
  a = parseFloat(a);
  b = parseFloat(b);
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/': return b === 0 ? 'Error' : a / b;
    default:  return b;
  }
}

// ── Button Actions ───────────────────────────────────────────

function handleNumber(value) {
  if (shouldReset || justEvaluated) {
    currentInput  = value === '.' ? '0.' : value;
    shouldReset   = false;
    justEvaluated = false;
  } else {
    if (value === '.' && currentInput.includes('.')) return;
    if (currentInput === '0' && value !== '.') {
      currentInput = value;
    } else {
      if (currentInput.replace('-', '').length >= 12) return;
      currentInput += value;
    }
  }
  updateDisplay(currentInput);
}

function handleOperator(op) {
  // Chain operators: evaluate first if there's a pending one
  if (operator && !shouldReset && !justEvaluated) {
    const result = calculate(previousInput, currentInput, operator);
    currentInput = String(result);
    updateDisplay(currentInput);
  }

  previousInput = currentInput;
  operator      = op;
  shouldReset   = true;
  justEvaluated = false;

  setExpression(`${previousInput} ${formatSymbol(op)}`);
  highlightOperator(op);
}

function handleEquals() {
  if (!operator || !previousInput) return;

  const expr = `${previousInput} ${formatSymbol(operator)} ${currentInput}`;
  const result = calculate(previousInput, currentInput, operator);

  setExpression(expr + ' =');
  currentInput  = String(result);
  operator      = null;
  previousInput = '';
  shouldReset   = true;
  justEvaluated = true;

  updateDisplay(currentInput);

  // Flash animation
  resultEl.classList.add('equals-flash');
  setTimeout(() => resultEl.classList.remove('equals-flash'), 400);

  clearOperatorHighlight();
}

function handleClear() {
  currentInput  = '0';
  previousInput = '';
  operator      = null;
  shouldReset   = false;
  justEvaluated = false;
  updateDisplay('0');
  setExpression('');
  clearOperatorHighlight();
}

function handleSign() {
  if (currentInput === '0' || currentInput === 'Error') return;
  currentInput = String(parseFloat(currentInput) * -1);
  updateDisplay(currentInput);
}

function handlePercent() {
  if (currentInput === 'Error') return;
  currentInput = String(parseFloat(currentInput) / 100);
  updateDisplay(currentInput);
}

// ── Operator Highlight ───────────────────────────────────────

function highlightOperator(op) {
  clearOperatorHighlight();
  document.querySelectorAll('.btn-operator').forEach(btn => {
    if (btn.dataset.value === op) btn.classList.add('active-op');
  });
}

function clearOperatorHighlight() {
  document.querySelectorAll('.btn-operator').forEach(btn => {
    btn.classList.remove('active-op');
  });
}

// ── Event Delegation ─────────────────────────────────────────

document.querySelector('.buttons').addEventListener('click', e => {
  const btn = e.target.closest('.btn');
  if (!btn) return;

  const action = btn.dataset.action;
  const value  = btn.dataset.value;

  if (action === 'clear')   handleClear();
  else if (action === 'sign')    handleSign();
  else if (action === 'percent') handlePercent();
  else if (action === 'equals')  handleEquals();
  else if (value && '+-*/'.includes(value)) handleOperator(value);
  else if (value) handleNumber(value);
});

// ── Keyboard Support ─────────────────────────────────────────

document.addEventListener('keydown', e => {
  if (e.key >= '0' && e.key <= '9') handleNumber(e.key);
  else if (e.key === '.')  handleNumber('.');
  else if (e.key === '+')  handleOperator('+');
  else if (e.key === '-')  handleOperator('-');
  else if (e.key === '*')  handleOperator('*');
  else if (e.key === '/')  { e.preventDefault(); handleOperator('/'); }
  else if (e.key === 'Enter' || e.key === '=') handleEquals();
  else if (e.key === 'Escape') handleClear();
  else if (e.key === '%')  handlePercent();
  else if (e.key === 'Backspace') {
    if (currentInput.length > 1 && currentInput !== 'Error') {
      currentInput = currentInput.slice(0, -1);
      updateDisplay(currentInput);
    } else {
      currentInput = '0';
      updateDisplay('0');
    }
  }
});
