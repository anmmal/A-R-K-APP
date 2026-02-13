const state = { qty: 0, online: true, registered: false };

const ids = (id) => document.getElementById(id);
const qtyEl = ids('qty'); const totalEl = ids('total'); const orderStateEl = ids('orderState');

function updateTotals() {
  qtyEl.textContent = state.qty;
  totalEl.textContent = (state.qty * 1.75 * 1.05).toFixed(2) + ' KWD';
}

async function loadMenu() {
  const res = await fetch('/api/menu');
  const data = await res.json();
  const html = data.items.map((item) => `<article class="item"><strong>${item.nameEn}</strong><p class="muted">${item.nameAr}</p><div class="space"><span>${item.category}</span><strong>${item.priceKwd.toFixed(2)} KWD</strong></div></article>`).join('');
  ids('menuGrid').innerHTML = html;
}

async function loadImpact() {
  const [impactRes, locationsRes, walletRes] = await Promise.all([fetch('/api/impact'), fetch('/api/locations'), fetch('/api/wallet')]);
  const impact = await impactRes.json();
  const locs = await locationsRes.json();
  const wallet = await walletRes.json();
  ids('impactTxt').textContent = `${impact.impact.text} • CO₂ saved: ${impact.impact.co2SavedKg}kg`;
  ids('points').textContent = wallet.wallet.points.toLocaleString();
  ids('locList').innerHTML = locs.locations.map((l) => `<div class="space"><span>${l.name}</span><span class="muted">${l.distanceKm}km • ${l.openUntil}</span></div>`).join('');
}

async function placeOrder() {
  if (!state.online || state.qty === 0) {
    orderStateEl.textContent = 'Payment failed or unavailable. Check network / cart.';
    orderStateEl.style.color = '#b91c1c';
    return;
  }
  const res = await fetch('/api/orders', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId: 'user-ark-1', mode: 'pickup', payWithPoints: false, items: [{ id: 'latte-oat', qty: state.qty }] }) });
  const data = await res.json();
  if (!res.ok) {
    orderStateEl.textContent = data.error;
    orderStateEl.style.color = '#b91c1c';
    return;
  }
  orderStateEl.textContent = `Order ${data.order.id} confirmed • ETA ${data.etaMinutes} min`;
  orderStateEl.style.color = '#16a34a';
}

function setupTabs() {
  const buttons = [...document.querySelectorAll('.nav button')];
  const tabs = [...document.querySelectorAll('.tab')];
  buttons.forEach((btn) => btn.addEventListener('click', () => {
    buttons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    tabs.forEach((tab) => tab.classList.add('hidden'));
    ids(btn.dataset.tab).classList.remove('hidden');
  }));
}

ids('plus').onclick = () => { state.qty += 1; updateTotals(); };
ids('minus').onclick = () => { state.qty = Math.max(0, state.qty - 1); updateTotals(); };
ids('placeOrder').onclick = placeOrder;
ids('registerBtn').onclick = () => { state.registered = true; ids('registerMsg').textContent = 'Account created. Rewards and history are now synced.'; };
ids('networkBtn').onclick = () => {
  state.online = !state.online;
  ids('networkBtn').textContent = state.online ? 'Online' : 'Offline';
  ids('networkHint').classList.toggle('hidden', state.online);
};

setupTabs();
updateTotals();
loadMenu();
loadImpact();
