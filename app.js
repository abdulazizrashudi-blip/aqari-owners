/* عقاري — ثوابت ودوال واجهة مشتركة بين الصفحات (لا تتعامل مع التخزين) */

const HOME_URL = 'https://abdulazizrashudi-blip.github.io/';

const PROPERTY_TYPES = ['شقة', 'فيلا', 'أرض', 'محل تجاري', 'دوبلكس'];
const CITIES = ['الرياض', 'جدة', 'الدمام', 'مكة المكرمة', 'المدينة المنورة'];
const RENT_PERIODS = { monthly: 'شهري', yearly: 'سنوي' };
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

/* رقم مرجعي مختصر لكل عقار، مُشتق من مُعرّفه في قاعدة البيانات */
function refCode(p) {
  return 'REF-' + String(p.id || '').slice(-6).toUpperCase();
}

function propertyUrl(id) {
  return HOME_URL + 'property.html?id=' + encodeURIComponent(id);
}

/* يحوّل رقم جوال سعودي بأي صيغة شائعة (05xxxxxxxx / 5xxxxxxxx / 9665xxxxxxxx)
   إلى صيغة دولية بدون رموز، مناسبة لروابط واتساب */
function toWhatsAppNumber(phone) {
  const digits = String(phone || '').replace(/[^0-9]/g, '');
  if (!digits) return '';
  if (digits.startsWith('966')) return digits;
  if (digits.startsWith('0')) return '966' + digits.slice(1);
  if (digits.length === 9) return '966' + digits;
  return digits;
}

function whatsappLink(phone, text) {
  const num = toWhatsAppNumber(phone);
  if (!num) return '';
  const t = encodeURIComponent(text || '');
  return `https://wa.me/${num}${t ? '?text=' + t : ''}`;
}

function mapsLink(lat, lng) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

/* مشاركة رابط عقار: يستخدم واجهة المشاركة إذا متوفرة، وإلا ينسخ الرابط */
function shareProperty(id, title) {
  const url = propertyUrl(id);
  if (navigator.share) {
    navigator.share({ title: title || 'عقار', url }).catch(() => {});
    return;
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(
      () => alert('تم نسخ رابط العقار'),
      () => prompt('انسخ رابط العقار:', url)
    );
  } else {
    prompt('انسخ رابط العقار:', url);
  }
}

/* بطاقة عقار — تُستخدم بالصفحة الرئيسية ولوحات الإدارة/الملاك.
   owner تُمرَّر جاهزة ({name, phone}) لأن البيانات صارت من Firestore. */
function propertyCardHTML(p, index, owner) {
  const icon = TYPE_ICON[p.type] || '🏠';
  const statusLabel = p.status === 'rent' ? 'للإيجار' : 'للبيع';
  const badgeClass = p.status === 'rent' ? 'badge rent' : 'badge';
  const periodLabel = p.status === 'rent' && p.rentPeriod ? RENT_PERIODS[p.rentPeriod] : '';
  const priceUnit = p.status === 'rent' ? (periodLabel ? `ريال / ${periodLabel}` : 'ريال') : 'ريال';
  const url = propertyUrl(p.id);
  const wa = owner && owner.phone ? whatsappLink(owner.phone, `مهتم بعقار: ${p.title} (${refCode(p)})`) : '';
  return `
    <div class="p-card">
      <a href="${url}" class="p-thumb-link">
        <div class="p-thumb" style="background:${thumbStyle(index)}">
          <span>${icon}</span>
          <span class="${badgeClass}">${statusLabel}</span>
        </div>
      </a>
      <div class="p-body">
        <a href="${url}" class="p-title-link"><div class="p-title">${p.title}</div></a>
        <div class="p-loc">📍 ${p.city}${p.neighborhood ? ' · ' + p.neighborhood : ''} · ${p.type}</div>
        <div class="p-meta">
          <span>📐 ${p.area} م²</span>
          ${p.rooms ? `<span>🛏️ ${p.rooms} غرف</span>` : ''}
          ${owner && owner.name ? `<span>👤 ${owner.name}</span>` : ''}
        </div>
        <div class="p-ref">${refCode(p)}</div>
        <div class="p-foot">
          <div class="p-price">${formatPrice(p.price)} <small>${priceUnit}</small></div>
        </div>
        <div class="p-actions">
          ${wa ? `<a class="btn btn-wa" href="${wa}" target="_blank" rel="noopener">واتساب</a>` : ''}
          <button type="button" class="btn btn-outline" onclick="shareProperty('${p.id}', '${(p.title || '').replace(/'/g, "\\'")}')">مشاركة</button>
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

/* عقارات مشابهة (نفس المدينة أو نفس النوع)، تُستخدم بصفحة تفاصيل العقار */
function renderSimilarProperties(container, allProps, current, ownerMap) {
  const list = allProps
    .filter(p => p.id !== current.id && (p.city === current.city || p.type === current.type))
    .slice(0, 3);
  if (!list.length) {
    container.innerHTML = `<div class="empty-state"><div class="ic">🔍</div><div>ما فيه عقارات مشابهة حاليًا</div></div>`;
    return;
  }
  container.innerHTML = list.map((p, i) => propertyCardHTML(p, i, ownerMap ? ownerMap[p.ownerId] : null)).join('');
}

/* قسم إحصائيات الثقة بالصفحة الرئيسية */
function renderStats(container, stats) {
  const items = [
    { num: stats.yearsExperience, label: 'سنوات خبرة' },
    { num: stats.happyClients, label: 'عميل وثق بخدماتنا' },
    { num: stats.propertiesMarketed, label: 'عقار تم تسويقه' },
  ];
  container.innerHTML = items.map(s => `
    <div class="stat-box">
      <div class="stat-box-num">${formatPrice(s.num)}+</div>
      <div class="stat-box-label">${s.label}</div>
    </div>`).join('');
}

function fillOptions(selectEl, values, placeholder) {
  const opts = [`<option value="">${placeholder}</option>`]
    .concat(values.map(v => `<option value="${v}">${v}</option>`));
  selectEl.innerHTML = opts.join('');
}

function fillOwnerOptions(selectEl, owners) {
  selectEl.innerHTML = owners.map(o => `<option value="${o.id}">${o.name}</option>`).join('');
}

/* قائمة أحياء ديناميكية، مبنية من الأحياء الفعلية المسجّلة بالعقارات الحالية */
function fillNeighborhoodOptions(selectEl, properties) {
  const set = new Set(properties.map(p => p.neighborhood).filter(Boolean));
  const values = Array.from(set).sort((a, b) => a.localeCompare(b, 'ar'));
  fillOptions(selectEl, values, 'كل الأحياء');
}
