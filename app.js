/* عقاري — منطق البيانات المشترك بين الصفحات
   ملاحظة: هذا موقع عرض (Demo) يعمل بالكامل داخل المتصفح باستخدام localStorage.
   أي إضافة أو حذف يُحفظ في متصفحك فقط، ولا يُرسل إلى أي خادم. */

const STORAGE_KEYS = {
  properties: 'aqari_properties_v1',
  owners: 'aqari_owners_v1',
};

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

const SEED_OWNERS = [
  { id: 'o1', name: 'ماجد العتيبي', phone: '966501112233+', email: 'majed.oteibi@example.com' },
  { id: 'o2', name: 'نورة القحطاني', phone: '966502223344+', email: 'noura.q@example.com' },
  { id: 'o3', name: 'خالد الحربي', phone: '966503334455+', email: 'khalid.harbi@example.com' },
];

const SEED_PROPERTIES = [
  { id: 'p1', title: 'شقة عصرية بحي النرجس', city: 'الرياض', type: 'شقة', status: 'sale', price: 620000, area: 165, rooms: 3, ownerId: 'o1', featured: true },
  { id: 'p2', title: 'فيلا دورين مع مسبح', city: 'جدة', type: 'فيلا', status: 'sale', price: 1850000, area: 420, rooms: 6, ownerId: 'o2', featured: true },
  { id: 'p3', title: 'دوبلكس راقي قريب من الخدمات', city: 'الدمام', type: 'دوبلكس', status: 'rent', price: 45000, area: 260, rooms: 4, ownerId: 'o3', featured: false },
  { id: 'p4', title: 'أرض سكنية مخططة', city: 'مكة المكرمة', type: 'أرض', status: 'sale', price: 980000, area: 600, rooms: 0, ownerId: 'o2', featured: false },
  { id: 'p5', title: 'محل تجاري على شارع رئيسي', city: 'المدينة المنورة', type: 'محل تجاري', status: 'rent', price: 60000, area: 90, rooms: 1, ownerId: 'o1', featured: false },
  { id: 'p6', title: 'شقة مفروشة للإيجار الشهري', city: 'الرياض', type: 'شقة', status: 'rent', price: 4200, area: 110, rooms: 2, ownerId: 'o3', featured: true },
];

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}
function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) { /* تجاهل بيئات بدون تخزين */ }
}

function ensureSeeded() {
  if (!localStorage.getItem(STORAGE_KEYS.properties)) {
    writeJSON(STORAGE_KEYS.properties, SEED_PROPERTIES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.owners)) {
    writeJSON(STORAGE_KEYS.owners, SEED_OWNERS);
  }
}

function getProperties() { ensureSeeded(); return readJSON(STORAGE_KEYS.properties, []); }
function saveProperties(list) { writeJSON(STORAGE_KEYS.properties, list); }
function getOwners() { ensureSeeded(); return readJSON(STORAGE_KEYS.owners, []); }
function saveOwners(list) { writeJSON(STORAGE_KEYS.owners, list); }

function getOwnerName(ownerId) {
  const owner = getOwners().find(o => o.id === ownerId);
  return owner ? owner.name : 'غير محدد';
}

function formatPrice(num) {
  return Number(num).toLocaleString('en-US');
}

function uid(prefix) {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function thumbStyle(index) {
  return THUMB_GRADIENTS[index % THUMB_GRADIENTS.length];
}

/* ---------- بطاقة عقار (تُستخدم في الصفحة الرئيسية) ---------- */
function propertyCardHTML(p, index) {
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
          <span>👤 ${getOwnerName(p.ownerId)}</span>
        </div>
        <div class="p-foot">
          <div class="p-price">${formatPrice(p.price)} <small>${priceUnit}</small></div>
        </div>
      </div>
    </div>`;
}

function renderProperties(container, list) {
  if (!list.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="ic">🔍</div>
        <div>ما فيه عقارات مطابقة لبحثك حالياً</div>
      </div>`;
    return;
  }
  container.innerHTML = list.map((p, i) => propertyCardHTML(p, i)).join('');
}

/* ---------- تعبئة قوائم select الفلاتر/الفورم ---------- */
function fillOptions(selectEl, values, placeholder) {
  const opts = [`<option value="">${placeholder}</option>`]
    .concat(values.map(v => `<option value="${v}">${v}</option>`));
  selectEl.innerHTML = opts.join('');
}

function fillOwnerOptions(selectEl) {
  const owners = getOwners();
  selectEl.innerHTML = owners.map(o => `<option value="${o.id}">${o.name}</option>`).join('');
}
