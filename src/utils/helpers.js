export const STATUS_OPTIONS = [
    { id: 'lead', label: 'Nuevo Lead', color: 'bg-blue-100 text-blue-700' },
    { id: 'contactado', label: 'Contactado', color: 'bg-purple-100 text-purple-700' },
    { id: 'reunion', label: 'En Reuniones', color: 'bg-yellow-100 text-yellow-700' },
    { id: 'negociacion', label: 'Negociación', color: 'bg-orange-100 text-orange-700' },
    { id: 'cerrado', label: 'Cliente Cerrado', color: 'bg-green-100 text-green-700' },
    { id: 'perdido', label: 'Perdido', color: 'bg-gray-100 text-gray-500' },
];

export const PAYMENT_STATUS = [
    { id: 'na', label: 'N/A', color: 'bg-gray-100 text-gray-500' },
    { id: 'pendiente', label: 'Pendiente', color: 'bg-red-100 text-red-700' },
    { id: 'parcial', label: 'Parcial', color: 'bg-yellow-100 text-yellow-700' },
    { id: 'pagado', label: 'Pagado', color: 'bg-green-100 text-green-700' },
];

export const INTEREST_OPTIONS = [
    { id: 'web', label: 'Web', color: 'bg-blue-100 text-blue-700' },
    { id: 'gm', label: 'GM', color: 'bg-indigo-100 text-indigo-700' },
    { id: 'sercotec', label: 'SERCOTEC', color: 'bg-orange-100 text-orange-700' },
];

export const EVENT_TYPES = [
    { id: 'meeting', label: 'Reunión', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { id: 'call', label: 'Llamada', color: 'bg-green-100 text-green-700 border-green-200' },
    { id: 'deadline', label: 'Entrega', color: 'bg-red-100 text-red-700 border-red-200' },
    { id: 'other', label: 'Otro', color: 'bg-gray-100 text-gray-700 border-gray-200' },
];

export const QUICK_NOTES = [
    "No contestó", "Me pidió llamar mañana", "Envié propuesta", "Reunión agendada", "Interesado, seguimiento alto"
];

export const parseCSVLine = (text) => {
    const re_value = /(?!\s*$)\s*(?:'([^']*)'|"([^"]*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g;
    const a = [];
    text.replace(re_value, function (m0, m1, m2, m3) {
        if (m1 !== undefined) a.push(m1.replace(/\\'/g, "'"));
        else if (m2 !== undefined) a.push(m2.replace(/\\"/g, '"'));
        else if (m3 !== undefined) a.push(m3);
        return '';
    });
    if (/,\s*$/.test(text)) a.push('');
    return a;
};

export const calculateCompositeScore = (data) => {
    let webScore = 0;
    const web = (data.website || '').toLowerCase();
    const isSocialMedia = web.includes('instagram.com') || web.includes('facebook.com') || web.includes('tiktok.com') || web.includes('linkedin.com');

    if (!web || isSocialMedia) webScore = 100;
    else webScore = 0;

    let gbpScore = 0;
    const isClaimed = data.is_claimed === 'true' || data.is_claimed === true;
    const isVerified = data.verified === 'true' || data.verified === true;
    const reviewCount = parseInt(data.review_count || 0);
    const rating = parseFloat(data.rating || 0);

    if (!isClaimed) gbpScore += 40;
    if (!isVerified) gbpScore += 20;
    if (reviewCount < 5) gbpScore += 20;
    if (rating > 0 && rating < 4.0) gbpScore += 20;
    if (gbpScore > 100) gbpScore = 100;

    let sercotecScore = 0;
    if (isClaimed) sercotecScore += 25;
    if (isVerified) sercotecScore += 25;
    if (reviewCount > 10) sercotecScore += 20;
    if (rating >= 4.0) sercotecScore += 10;
    if (data.phone_number && data.phone_number.length > 5) sercotecScore += 10;
    if (data.full_address && data.full_address.length > 10) sercotecScore += 10;
    if (sercotecScore > 100) sercotecScore = 100;

    const generalScore = Math.round((webScore * 0.4) + (gbpScore * 0.4) + (sercotecScore * 0.2));

    return { webScore, gbpScore, sercotecScore, generalScore };
};
