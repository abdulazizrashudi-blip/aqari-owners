/* عقاري — ثوابت ودوال واجهة مشتركة بين الصفحات (لا تتعامل مع التخزين) */

const PROPERTY_TYPES = ['شقة', 'فيلا', 'أرض', 'محل تجاري', 'دوبلكس'];
const CITIES = ['الرياض', 'جدة', 'الدمام', 'مكة المكرمة', 'المدينة المنورة'];
const THUMB_GRADIENTS = [
  'linear-gradient(135deg,#1b3358,#12233f)',
  'linear-gradient(135deg,#c8a05d,#8a6a2f)',
  'linear-gradient(135deg,#2f5d62,#12333a)',
  'linear-gradient(135deg,#6b4226,#3a2214)',
  'linear-gradient(135deg,#334155,#1b2432)',
];
const TYPE_ICON = {
  'شقة': '🏢',
  'فيلا': '🏡',
  'أرض': '🗺️',
  'محل تجاري': '🏬',
  'دوبلكس': '🏘️',
};

function formatPrice(num) {
  return Number(num || 0).toLocaleString('en-US');
}

function thumbStyle(index) {
  return THUMB_GRADIENTS[index % THUMB_GRADIENTS.length];
}

/* بطاقة عقار — تُستخدم بالصفحة الرئيسية ولوحات الإدارة/الملاك.
   ownerName تُمرَّر جاهزة (بدل ما تُحسب هنا) لأن البيانات صارت من Firestore. */
function propertyCardHTML(p, index, ownerName) {
  const icon = TYPE_ICON[p.type] || '🏠';
  const statusLabel = p.status === 'rent' ? 'للإيجار' : 'للبيع';
  const badgeClass = p.status === 'rent' ? 'badge rent' : 'badge';
  const priceUnit = p.status === 'rent' ? 'ريال / سنويًا' : 'ريال';
  return `
    <div class="p-card">
      <div class="p-thumb" style="background:${thumbStyle(index)}">
        <span>${icon}</span>
        <span class="${badgeClass}">${statusLabel}</span>
      </div>
      <div class="p-body">
        <div class="p-title">${p.title}</div>
        <div class="p-loc">📍 ${p.city} · ${p.type}</div>
        <div class="p-meta">
          <span>📐 ${p.area} م²</span>
          ${p.rooms ? `<span>🛏️ ${p.rooms} غرف</span>` : ''}
          ${ownerName ? `<span>👤 ${ownerName}</span>` : ''}
        </div>
        <div class="p-foot">
          <div class="p-price">${formatPrice(p.price)} <small>${priceUnit}</small></div>
        </div>
      </div>
    </div>`;
}

function renderProperties(container, list, ownerMap) {
  if (!list.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="ic">🔍</div>
        <div>ما فيه عقارات مطابقة لبحثك حالياً</div>
      </div>`;
    return;
  }
  container.innerHTML = list.map((p, i) => propertyCardHTML(p, i, ownerMap ? ownerMap[p.ownerId] : null)).join('');
}

function fillOptions(selectEl, values, placeholder) {
  const opts = [`<option value="">${placeholder}</option>`]
    .concat(values.map(v => `<option value="${v}">${v}</option>`));
  selectEl.innerHTML = opts.join('');
}

function fillOwnerOptions(selectEl, owners) {
  selectEl.innerHTML = owners.map(o => `<option value="${o.id}">${o.name}</option>`).join('');
}
