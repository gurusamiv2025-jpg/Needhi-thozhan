import React, { useState, useRef, useEffect, useMemo } from "react";

/* ────────────────────────────────────────────────────────────────────────
   Needhi Thozhan · நீதி தோழன் — an empathetic constitutional-rights & legal-aid
   companion for India. Three modes: Ask · Draft · Find. Multilingual.
   Design language: the illuminated original Constitution of India —
   ink-navy, gold-leaf, leaf-green, on warm manuscript paper.
──────────────────────────────────────────────────────────────────────── */

// ── Click-to-call / click-to-visit: phone numbers become tel: links, domain-shaped
// values (like nalsa.gov.in) become real https links, anything else stays plain text. ──
function isPhoneLike(s) {
  if (!s) return false;
  const stripped = String(s).replace(/[\s\-().]/g, "");
  return /^\+?\d{3,}$/.test(stripped);
}
function isWebsiteLike(s) {
  if (!s) return false;
  return /^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+(\.[a-z]{2,})(\/\S*)?$/i.test(String(s).trim());
}
function telHref(s) {
  return "tel:" + String(s).replace(/[^\d+]/g, "");
}
function webHref(s) {
  const v = String(s).trim();
  return /^https?:\/\//i.test(v) ? v : "https://" + v;
}
function ContactLink({ value, className }) {
  if (!value) return null;
  if (isPhoneLike(value)) return <a href={telHref(value)} className={className + " nm-tel"}>{value}</a>;
  if (isWebsiteLike(value)) return <a href={webHref(value)} target="_blank" rel="noopener noreferrer" className={className + " nm-tel"}>{value}</a>;
  return <span className={className}>{value}</span>;
}

// ── The Ashoka Chakra: the wheel of law. Logo + "thinking" indicator. ──
function Chakra({ size = 26, spin = false }) {
  const spokes = Array.from({ length: 24 });
  return (
    <span
      className={"nm-chakra" + (spin ? " nm-chakra-spin" : "")}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="3.5" />
        <circle cx="50" cy="50" r="6" fill="currentColor" />
        {spokes.map((_, i) => (
          <line
            key={i}
            x1="50" y1="50"
            x2={50 + 45 * Math.cos((i * 15 * Math.PI) / 180)}
            y2={50 + 45 * Math.sin((i * 15 * Math.PI) / 180)}
            stroke="currentColor" strokeWidth="1.4"
          />
        ))}
        {spokes.map((_, i) => (
          <circle
            key={"d" + i}
            cx={50 + 45 * Math.cos((i * 15 * Math.PI) / 180)}
            cy={50 + 45 * Math.sin((i * 15 * Math.PI) / 180)}
            r="1.6" fill="currentColor"
          />
        ))}
      </svg>
    </span>
  );
}

// ── Small ornamental divider drawn from manuscript borders ──
function Ornament() {
  return (
    <div className="nm-ornament" aria-hidden="true">
      <span className="nm-orn-line" />
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M12 2c2 4 6 6 6 10s-4 6-6 10c-2-4-6-6-6-10s4-6 6-10z" stroke="currentColor" strokeWidth="1.1" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
      </svg>
      <span className="nm-orn-line" />
    </div>
  );
}

// ── Type-to-filter dropdown (used for the TN district picker). Writes to the
// same value/onChange interface as a plain <select>, so callers don't change. ──
function SearchableSelect({ value, onChange, options, placeholder, noMatchText }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [query, options]);

  useEffect(() => {
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) { setOpen(false); setQuery(""); }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function pick(v) {
    onChange(v);
    setOpen(false);
    setQuery("");
  }
  function onKeyDown(e) {
    if (e.key === "Escape") { setOpen(false); setQuery(""); e.target.blur(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setHighlight((h) => Math.min(h + 1, filtered.length - 1)); return; }
    if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); return; }
    if (e.key === "Enter") { e.preventDefault(); if (filtered[highlight]) pick(filtered[highlight]); return; }
  }

  return (
    <div className="nm-combo" ref={wrapRef}>
      <input
        className="nm-combo-input"
        value={open ? query : (value || "")}
        placeholder={placeholder}
        onFocus={() => { setOpen(true); setQuery(""); setHighlight(0); }}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setHighlight(0); }}
        onKeyDown={onKeyDown}
      />
      {open && (
        <div className="nm-combo-list">
          {filtered.length === 0 && <div className="nm-combo-empty">{noMatchText}</div>}
          {filtered.map((o, i) => (
            <div
              key={o}
              className={"nm-combo-opt" + (i === highlight ? " nm-combo-opt-hi" : "") + (o === value ? " nm-combo-opt-sel" : "")}
              onMouseDown={(e) => { e.preventDefault(); pick(o); }}
              onMouseEnter={() => setHighlight(i)}
            >
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const LANGUAGES = [
  { code: "en", label: "English", native: "English", voice: "en-IN" },
  { code: "hi", label: "Hindi", native: "हिन्दी", voice: "hi-IN" },
  { code: "ta", label: "Tamil", native: "தமிழ்", voice: "ta-IN" },
];

const TOPICS = [
  { key: "fundamental", label: "My basic rights", hint: "Fundamental Rights, simply put", seed: "Explain my Fundamental Rights under the Indian Constitution in simple terms." },
  { key: "police", label: "Police & arrest", hint: "Stopped, detained, or arrested?", seed: "What are my rights if the police stop, detain, or arrest me?" },
  { key: "women", label: "Women's safety", hint: "Harassment & protection", seed: "I want to understand my legal protections against harassment as a woman. Where do I start?" },
  { key: "harassment", label: "Workplace harassment", hint: "POSH Act, filing a complaint", seed: "I'm facing harassment at my workplace. What are my rights under the POSH Act and how do I file a complaint?" },
  { key: "domestic", label: "Domestic violence", hint: "Protection, shelter, orders", seed: "I'm facing domestic violence at home. What protection can I get under the law and how do I get help?" },
  { key: "work", label: "Work & wages", hint: "Unpaid, unfair, or unsafe", seed: "My employer hasn't paid my wages. What are my rights and what can I do?" },
  { key: "rent", label: "Rent & housing", hint: "Deposits, illegal eviction", seed: "My landlord is trying to illegally evict me and won't return my deposit. What are my rights as a tenant?" },
  { key: "consumer", label: "Consumer rights", hint: "Faulty goods, refunds", seed: "I was sold a defective product and the seller refuses a refund. What are my consumer rights?" },
  { key: "cheque", label: "Cheque bounce", hint: "Section 138, unpaid dues", seed: "A cheque given to me has bounced. What are my legal options under Section 138?" },
  { key: "rti", label: "RTI & information", hint: "Filing, or no response", seed: "I filed an RTI and got no response within the deadline. What can I do about RTI non-response?" },
  { key: "cyber", label: "Cyber & online", hint: "Fraud, blackmail, misuse", seed: "I've been cheated in an online scam. What should I do and who do I report it to?" },
];

const HELPLINES = [
  { key: "emergency", name: "Emergency", num: "112" },
  { key: "legalAid", name: "Legal aid (NALSA)", num: "15100" },
  { key: "women", name: "Women", num: "1091" },
  { key: "child", name: "Child", num: "1098" },
  { key: "cyber", name: "Cyber crime", num: "1930" },
];

// Each draft type drives a short guided form (name, date, optional amount, details)
// instead of a blank textarea — faster and more reliable for a live demo.
const DRAFT_TYPES = [
  { key: "rent", label: "Rent Deposit Demand Notice", desc: "Demand your security deposit back from a landlord.", needsAmount: true, amountLabel: "Deposit amount (₹)" },
  { key: "consumer", label: "Consumer Complaint Letter", desc: "For defective goods or deficient service.", needsAmount: true, amountLabel: "Amount paid (₹)" },
  { key: "rti", label: "RTI Application", desc: "Ask a public authority for information under the RTI Act, 2005.", needsAmount: false },
  { key: "salary", label: "Salary Due Legal Notice", desc: "Demand unpaid wages from an employer.", needsAmount: true, amountLabel: "Amount due (₹)" },
  { key: "harassment", label: "Workplace Harassment Complaint", desc: "A formal complaint under the POSH Act, 2013.", needsAmount: false },
  { key: "custom", label: "Custom Document", desc: "Describe any problem. The AI will draft the right legal document.", needsAmount: false },
];

// State High Court locations — this is stable government structure (seats essentially
// never move), unlike volatile political officeholders, so it's safe to state directly
// without the same verification caution as current-facts.json. Every state's Legal
// Services Authority (SLSA) is headquartered at its High Court.
const STATE_HIGH_COURTS = {
  "andhra pradesh": { court: "High Court of Andhra Pradesh", city: "Amaravati" },
  "arunachal pradesh": { court: "Gauhati High Court (jurisdiction)", city: "Guwahati, Assam" },
  "assam": { court: "Gauhati High Court", city: "Guwahati" },
  "bihar": { court: "Patna High Court", city: "Patna" },
  "chhattisgarh": { court: "High Court of Chhattisgarh", city: "Bilaspur" },
  "delhi": { court: "Delhi High Court", city: "New Delhi" },
  "goa": { court: "Bombay High Court (Goa Bench)", city: "Panaji" },
  "gujarat": { court: "High Court of Gujarat", city: "Ahmedabad" },
  "haryana": { court: "Punjab & Haryana High Court", city: "Chandigarh" },
  "himachal pradesh": { court: "High Court of Himachal Pradesh", city: "Shimla" },
  "jammu and kashmir": { court: "High Court of Jammu & Kashmir and Ladakh", city: "Srinagar / Jammu" },
  "jharkhand": { court: "High Court of Jharkhand", city: "Ranchi" },
  "karnataka": { court: "High Court of Karnataka", city: "Bengaluru" },
  "kerala": { court: "High Court of Kerala", city: "Ernakulam (Kochi)" },
  "madhya pradesh": { court: "High Court of Madhya Pradesh", city: "Jabalpur" },
  "maharashtra": { court: "Bombay High Court", city: "Mumbai" },
  "manipur": { court: "High Court of Manipur", city: "Imphal" },
  "meghalaya": { court: "High Court of Meghalaya", city: "Shillong" },
  "mizoram": { court: "Gauhati High Court (Aizawl Bench)", city: "Aizawl" },
  "nagaland": { court: "Gauhati High Court (Kohima Bench)", city: "Kohima" },
  "odisha": { court: "High Court of Orissa", city: "Cuttack" },
  "puducherry": { court: "Madras High Court (jurisdiction)", city: "Chennai" },
  "punjab": { court: "Punjab & Haryana High Court", city: "Chandigarh" },
  "rajasthan": { court: "High Court of Rajasthan", city: "Jodhpur" },
  "sikkim": { court: "High Court of Sikkim", city: "Gangtok" },
  "tamil nadu": { court: "Madras High Court", city: "Chennai" },
  "telangana": { court: "High Court for the State of Telangana", city: "Hyderabad" },
  "tripura": { court: "High Court of Tripura", city: "Agartala" },
  "uttar pradesh": { court: "Allahabad High Court", city: "Prayagraj (Allahabad)" },
  "uttarakhand": { court: "High Court of Uttarakhand", city: "Nainital" },
  "west bengal": { court: "Calcutta High Court", city: "Kolkata" },
};
// Common abbreviations and typos (e.g. the exact "tamilmadu" slip we saw in testing) —
// resolved before lookup so a small typing mistake doesn't just silently show nothing.
const STATE_ALIASES = {
  "up": "uttar pradesh", "u.p.": "uttar pradesh", "uttarpradesh": "uttar pradesh",
  "mp": "madhya pradesh", "m.p.": "madhya pradesh", "madhyapradesh": "madhya pradesh",
  "ap": "andhra pradesh", "andhrapradesh": "andhra pradesh",
  "wb": "west bengal", "westbengal": "west bengal",
  "j&k": "jammu and kashmir", "jammu & kashmir": "jammu and kashmir", "jammu kashmir": "jammu and kashmir",
  "pondicherry": "puducherry",
  "orissa": "odisha",
  "tamilnadu": "tamil nadu", "tamilmadu": "tamil nadu", "tamil madu": "tamil nadu",
};
function resolveHighCourt(stateName) {
  if (!stateName) return null;
  let key = stateName.trim().toLowerCase();
  key = STATE_ALIASES[key] || key;
  return STATE_HIGH_COURTS[key] || null;
}

// For states other than Tamil Nadu, we don't have verified per-district phone
// numbers — inventing them would be actively dangerous in a legal-aid tool. Instead
// this card uses facts that are universally true for every district in India,
// under the Legal Services Authorities Act, 1987, plus the official locator.
const GENERIC_FIND_TR = {
  en: {
    title: "Quick reference — while we look up more",
    slsaNote: (court, city) => `Headquartered at the ${court}, ${city} — this is where your state's free legal aid authority is based.`,
    dlsaName: "District Legal Services Authority",
    dlsaNote: (d, s) => `Located inside the ${d ? d + " " : ""}District Court Complex${s ? ", " + s : ""} — every district in India has one, by law.`,
    findExact: "Find the verified number",
    findExactNote: "Official NALSA district locator — enter your state & district for the confirmed DLSA contact",
    honestyNote: "We show only facts we can verify — the national helpline and your state's High Court location are stable, confirmed facts. We won't invent a specific district phone number we can't confirm; the official NALSA locator link below has the real one.",
  },
  hi: {
    title: "त्वरित संदर्भ — बाकी जानकारी खोजते समय",
    slsaNote: (court, city) => `${court}, ${city} में स्थित है — यहीं आपके राज्य का मुफ़्त कानूनी सहायता प्राधिकरण आधारित है।`,
    dlsaName: "ज़िला विधिक सेवा प्राधिकरण",
    dlsaNote: (d, s) => `${d ? d + " " : ""}ज़िला न्यायालय परिसर में स्थित है${s ? ", " + s : ""} — भारत के हर ज़िले में एक होता है, कानून के अनुसार।`,
    findExact: "सत्यापित नंबर खोजें",
    findExactNote: "आधिकारिक NALSA ज़िला लोकेटर — पुष्टि किए गए DLSA संपर्क के लिए अपना राज्य व ज़िला दर्ज करें",
    honestyNote: "हम केवल वे तथ्य दिखाते हैं जिनकी हम पुष्टि कर सकते हैं — राष्ट्रीय हेल्पलाइन और आपके राज्य के हाई कोर्ट का स्थान स्थिर, पुष्ट तथ्य हैं। हम किसी ज़िले का फ़ोन नंबर नहीं बनाएंगे जिसकी हम पुष्टि नहीं कर सकते — नीचे दिए NALSA लोकेटर लिंक में असली नंबर है।",
  },
  ta: {
    title: "விரைவு தகவல் — மேலும் விவரங்களைத் தேடும்போது",
    slsaNote: (court, city) => `${court}, ${city}-ல் அமைந்துள்ளது — உங்கள் மாநிலத்தின் இலவச சட்ட உதவி ஆணையம் இங்கே அமைந்துள்ளது.`,
    dlsaName: "மாவட்ட சட்ட சேவை ஆணையம்",
    dlsaNote: (d, s) => `${d ? d + " " : ""}மாவட்ட நீதிமன்ற வளாகத்தில் அமைந்துள்ளது${s ? ", " + s : ""} — இந்தியாவின் ஒவ்வொரு மாவட்டத்திலும் சட்டப்படி ஒன்று உள்ளது.`,
    findExact: "சரிபார்க்கப்பட்ட எண்ணைக் கண்டறியவும்",
    findExactNote: "அதிகாரப்பூர்வ NALSA மாவட்ட லொகேட்டர் — உறுதிசெய்யப்பட்ட DLSA தொடர்புக்கு உங்கள் மாநிலம் & மாவட்டத்தை உள்ளிடவும்",
    honestyNote: "நாங்கள் உறுதிப்படுத்த முடிந்த தகவல்களை மட்டுமே காட்டுகிறோம் — தேசிய ஹெல்ப்லைன் மற்றும் உங்கள் மாநில உயர் நீதிமன்ற இருப்பிடம் உறுதியான, சரிபார்க்கப்பட்ட தகவல்கள். உறுதிப்படுத்த முடியாத மாவட்ட எண்ணை நாங்கள் உருவாக்க மாட்டோம் — கீழே உள்ள NALSA இணைப்பில் உண்மையான எண் உள்ளது.",
  },
};
function genericFindContacts(lang, stateName, districtName) {
  const t = GENERIC_FIND_TR[lang.code] || GENERIC_FIND_TR.en;
  const hc = resolveHighCourt(stateName);
  const contacts = [{ name: "NALSA (National)", contact: "15100", note: "Free legal aid helpline, toll-free, all India" }];
  if (hc) {
    contacts.push({ name: `${stateName?.trim() || "Your state"} Legal Services Authority (SLSA)`, contact: "", note: t.slsaNote(hc.court, hc.city) });
  }
  contacts.push({ name: t.dlsaName, contact: "", note: t.dlsaNote(districtName?.trim(), stateName?.trim()) });
  contacts.push({ name: t.findExact, contact: "nalsa.gov.in", note: t.findExactNote });
  return contacts;
}

// Tamil Nadu districts, for the Find-legal-aid dropdown (works instantly, no API call).
const TN_DISTRICTS = [
  "Ariyalur","Chengalpattu","Chennai","Coimbatore","Cuddalore","Dharmapuri","Dindigul",
  "Erode","Kallakurichi","Kancheepuram","Kanyakumari","Karur","Krishnagiri","Madurai",
  "Mayiladuthurai","Nagapattinam","Namakkal","Nilgiris","Perambalur","Pudukkottai",
  "Ramanathapuram","Ranipet","Salem","Sivaganga","Tenkasi","Thanjavur","Theni",
  "Thoothukudi","Tiruchirappalli","Tirunelveli","Tirupathur","Tiruppur","Tiruvallur",
  "Tiruvannamalai","Tiruvarur","Vellore","Viluppuram","Virudhunagar",
];

// Delhi districts
const DELHI_DISTRICTS = [
  "Central (Tis Hazari)","East (Karkardooma)","New Delhi (Patiala House)","North (Rohini)",
  "North-East (Karkardooma)","North-West (Rohini)","Shahdara (Karkardooma)",
  "South (Saket)","South-East (Saket)","South-West (Dwarka)","West (Tis Hazari)",
];

// Static reference contacts — shown immediately, independent of the AI call,
// so this tab never goes blank even if the network drops mid-demo.
const TN_CONTACTS = [
  { name: "NALSA (National)", contact: "15100", note: "Free legal aid helpline, toll-free, all India" },
  { name: "Tamil Nadu State Legal Services Authority", contact: "044-2534 4700", note: "High Court campus, Chennai · tnlsa.tn.gov.in" },
  { name: "TN State Commission for Women", contact: "044-2821 8300", note: "Complaints on harassment & women's safety in Tamil Nadu" },
  { name: "TN Labour Welfare / Labour Commissionerate", contact: "044-2859 5876", note: "Unpaid wages & labour rights complaints in Tamil Nadu" },
];
const T = {
  en: {
    tagline: "your justice friend", ask: "Ask a question", draft: "Draft a document", find: "Find legal aid",
    headTitle: "Constitutional Rights & Legal Aid", headNote: "Free guidance · Not a substitute for a lawyer",
    heroPre: "We, the People of India,", heroH1: "Know your rights.", heroH2: "Understand the process.",
    heroP: "Ask about any right, law, or legal step in plain words — no legal background needed. I'll explain it simply, tell you the concrete steps you can take, and point you to free help.",
    whereHelp: "Where can I help?", needNow: "Need help now?",
    placeholder: "Describe your situation or ask about a right…",
    disclaimer: "General legal information, not legal advice. For your case, contact free legal aid (NALSA · 15100) or a lawyer. In an emergency, call 112.",
    thinking: "Looking into your rights…", newChat: "New", save: "Save", retry: "🔄 Try again",
    offline: "Connection issue — showing a general example while we retry.",
    draftPick: "What would you like to draft?", generate: "Generate draft", drafting: "Drafting your document…",
    copy: "Copy", copied: "Copied", download: "Download", print: "Print / Save as PDF", yourDraft: "Your draft", tips: "Tips",
    fieldName: "Full name", fieldDate: "Date of incident", fieldDetails: "What happened",
    detailsPh: "Briefly describe what happened, in your own words…",
    findTitle: "Free legal aid near you", findSub: "Every citizen has a right to free legal aid through their District Legal Services Authority. Tell me where you are.",
    nearMe: "📍 Find legal aid near me", nearMePolice: "🚓 Find nearest police station", nearMeLoading: "Getting your location…", nearMeError: "Couldn't access your location — you can still search by state and district below.",
    stateLbl: "State", distLbl: "District", findBtn: "Show more details", finding: "Finding your options…",
    otherState: "Other state / UT", otherStatePh: "Type your state", selectDistrict: "Select your district", noMatches: "No matching district",
    tnQuickTitle: "Tamil Nadu — quick reference", qualifiesH: "Who qualifies", coveredH: "What's covered",
    applyH: "How to apply", contactsH: "Contacts", dlsaH: "Your District Legal Services Authority",
    rightsH: "Your rights", stepsH: "Steps you can take", resH: "Where to get real help", urgentH: "Act on this soon", call112: "Call 112", call15100: "Call 15100",
    memoryLabel: "Remembering {n} past topic(s) on this device", memoryClear: "Clear",
    ttsVoiceMissing: "Your device doesn't have a voice installed for this language, so playback used a different one. Add language voices in your phone/PC's Settings → Language & Speech for accurate pronunciation.",
  },
  hi: {
    tagline: "आपका न्याय मित्र", ask: "सवाल पूछें", draft: "दस्तावेज़ बनाएँ", find: "कानूनी सहायता खोजें",
    headTitle: "संवैधानिक अधिकार और कानूनी सहायता", headNote: "मुफ़्त मार्गदर्शन · वकील का विकल्प नहीं",
    heroPre: "हम, भारत के लोग,", heroH1: "अपने अधिकार जानें।", heroH2: "प्रक्रिया समझें।",
    heroP: "किसी भी अधिकार, कानून या कानूनी कदम के बारे में सरल शब्दों में पूछें — किसी कानूनी जानकारी की ज़रूरत नहीं। मैं इसे आसान भाषा में समझाऊँगा, ठोस कदम बताऊँगा और मुफ़्त मदद की ओर ले जाऊँगा।",
    whereHelp: "मैं कहाँ मदद कर सकता हूँ?", needNow: "अभी मदद चाहिए?",
    placeholder: "अपनी स्थिति बताएं या किसी अधिकार के बारे में पूछें…",
    disclaimer: "यह सामान्य जानकारी है, कानूनी सलाह नहीं। अपने मामले के लिए मुफ़्त कानूनी सहायता (NALSA · 15100) या वकील से संपर्क करें। आपातकाल में 112 पर कॉल करें।",
    thinking: "आपके अधिकार देख रहा हूँ…", newChat: "नया", save: "सहेजें", retry: "🔄 फिर से कोशिश करें",
    offline: "कनेक्शन में समस्या — फिर से कोशिश करते समय एक सामान्य उदाहरण दिखा रहे हैं।",
    draftPick: "आप क्या बनाना चाहेंगे?", generate: "मसौदा बनाएँ", drafting: "आपका दस्तावेज़ बन रहा है…",
    copy: "कॉपी", copied: "कॉपी हो गया", download: "डाउनलोड", print: "प्रिंट / PDF सहेजें", yourDraft: "आपका मसौदा", tips: "सुझाव",
    fieldName: "पूरा नाम", fieldDate: "घटना की तारीख", fieldDetails: "क्या हुआ",
    detailsPh: "अपने शब्दों में संक्षेप में बताएं कि क्या हुआ…",
    findTitle: "आपके पास मुफ़्त कानूनी सहायता", findSub: "हर नागरिक को ज़िला विधिक सेवा प्राधिकरण के ज़रिये मुफ़्त कानूनी सहायता का अधिकार है। बताइए आप कहाँ हैं।",
    nearMe: "📍 मेरे पास कानूनी सहायता खोजें", nearMePolice: "🚓 नज़दीकी पुलिस स्टेशन खोजें", nearMeLoading: "आपका स्थान प्राप्त कर रहे हैं…", nearMeError: "आपका स्थान नहीं मिल सका — आप नीचे राज्य व ज़िला से खोज सकते हैं।",
    stateLbl: "राज्य", distLbl: "ज़िला", findBtn: "और जानकारी दिखाएँ", finding: "आपके विकल्प खोज रहा हूँ…",
    otherState: "अन्य राज्य / UT", otherStatePh: "अपना राज्य लिखें", selectDistrict: "अपना ज़िला चुनें", noMatches: "कोई मेल खाता ज़िला नहीं",
    tnQuickTitle: "तमिलनाडु — त्वरित संदर्भ", qualifiesH: "कौन पात्र है", coveredH: "क्या शामिल है",
    applyH: "आवेदन कैसे करें", contactsH: "संपर्क", dlsaH: "आपका ज़िला विधिक सेवा प्राधिकरण",
    rightsH: "आपके अधिकार", stepsH: "आप ये कदम उठा सकते हैं", resH: "असली मदद कहाँ मिलेगी", urgentH: "इस पर जल्दी कार्रवाई करें", call112: "112 पर कॉल करें", call15100: "15100 पर कॉल करें",
    memoryLabel: "इस डिवाइस पर {n} पिछले विषय याद हैं", memoryClear: "मिटाएं",
    ttsVoiceMissing: "आपके डिवाइस पर इस भाषा की आवाज़ नहीं है, इसलिए एक अलग आवाज़ का उपयोग हुआ। सही उच्चारण के लिए Settings → Language & Speech में भाषा जोड़ें।",
  },
  ta: {
    tagline: "உங்கள் நீதி நண்பன்", ask: "கேள்வி கேளுங்கள்", draft: "ஆவணம் தயாரிக்கவும்", find: "சட்ட உதவி தேடுங்கள்",
    headTitle: "அரசியலமைப்பு உரிமைகள் & சட்ட உதவி", headNote: "இலவச வழிகாட்டல் · வழக்கறிஞருக்கு மாற்றல்ல",
    heroPre: "நாம், இந்திய மக்கள்,", heroH1: "உங்கள் உரிமைகளை அறியுங்கள்.", heroH2: "நடைமுறையைப் புரிந்துகொள்ளுங்கள்.",
    heroP: "எந்த உரிமை, சட்டம் அல்லது சட்ட நடவடிக்கை பற்றியும் எளிய சொற்களில் கேளுங்கள் — சட்டப் பின்னணி தேவையில்லை. நான் எளிமையாக விளக்கி, நீங்கள் எடுக்கக்கூடிய உறுதியான நடவடிக்கைகளைச் சொல்லி, இலவச உதவிக்கு வழிகாட்டுவேன்.",
    whereHelp: "நான் எங்கே உதவ முடியும்?", needNow: "இப்போது உதவி வேண்டுமா?",
    placeholder: "உங்கள் நிலைமையை விவரிக்கவும் அல்லது உரிமை பற்றி கேளுங்கள்…",
    disclaimer: "இது பொது தகவல், சட்ட ஆலோசனை அல்ல. உங்கள் வழக்கிற்கு இலவச சட்ட உதவி (NALSA · 15100) அல்லது வழக்கறிஞரை அணுகவும். அவசரத்தில் 112 ஐ அழைக்கவும்.",
    thinking: "உங்கள் உரிமைகளைப் பார்க்கிறேன்…", newChat: "புதியது", save: "சேமி", retry: "🔄 மீண்டும் முயற்சிக்கவும்",
    offline: "இணைப்பு சிக்கல் — மீண்டும் முயற்சிக்கும் போது ஒரு பொதுவான உதாரணத்தைக் காட்டுகிறோம்.",
    draftPick: "எதைத் தயாரிக்க விரும்புகிறீர்கள்?", generate: "வரைவு உருவாக்கு", drafting: "உங்கள் ஆவணம் தயாராகிறது…",
    copy: "நகலெடு", copied: "நகலெடுக்கப்பட்டது", download: "பதிவிறக்கு", print: "பிரிண்ட் / PDF சேமி", yourDraft: "உங்கள் வரைவு", tips: "குறிப்புகள்",
    fieldName: "முழுப்பெயர்", fieldDate: "நிகழ்வு நடந்த தேதி", fieldDetails: "என்ன நடந்தது",
    detailsPh: "என்ன நடந்தது என்பதை உங்கள் சொந்த வார்த்தைகளில் சுருக்கமாக விவரிக்கவும்…",
    findTitle: "உங்களருகே இலவச சட்ட உதவி", findSub: "ஒவ்வொரு குடிமகனுக்கும் மாவட்ட சட்ட சேவை ஆணையம் மூலம் இலவச சட்ட உதவி பெற உரிமை உண்டு. நீங்கள் எங்கே இருக்கிறீர்கள் என்று சொல்லுங்கள்.",
    nearMe: "📍 எனக்கு அருகில் சட்ட உதவி கண்டறியவும்", nearMePolice: "🚓 அருகிலுள்ள காவல் நிலையம்", nearMeLoading: "உங்கள் இருப்பிடத்தைப் பெறுகிறோம்…", nearMeError: "உங்கள் இருப்பிடத்தை அணுக முடியவில்லை — கீழே மாநிலம் & மாவட்டம் மூலம் தேடலாம்.",
    stateLbl: "மாநிலம்", distLbl: "மாவட்டம்", findBtn: "மேலும் விவரங்களைக் காட்டு", finding: "உங்கள் வழிகளைத் தேடுகிறேன்…",
    otherState: "வேறு மாநிலம் / UT", otherStatePh: "உங்கள் மாநிலத்தை தட்டச்சு செய்யவும்", selectDistrict: "உங்கள் மாவட்டத்தைத் தேர்ந்தெடுக்கவும்", noMatches: "பொருந்தும் மாவட்டம் இல்லை",
    tnQuickTitle: "தமிழ்நாடு — விரைவு தகவல்", qualifiesH: "யார் தகுதியுடையவர்", coveredH: "என்ன அடங்கும்",
    applyH: "எப்படி விண்ணப்பிப்பது", contactsH: "தொடர்புகள்", dlsaH: "உங்கள் மாவட்ட சட்ட சேவை ஆணையம்",
    rightsH: "உங்கள் உரிமைகள்", stepsH: "நீங்கள் எடுக்கக்கூடிய நடவடிக்கைகள்", resH: "உண்மையான உதவி எங்கே", urgentH: "இதில் விரைவில் நடவடிக்கை எடுங்கள்", call112: "112-ஐ அழைக்கவும்", call15100: "15100-ஐ அழைக்கவும்",
    memoryLabel: "இந்தச் சாதனத்தில் {n} முந்தைய தலைப்புகள் நினைவில் உள்ளன", memoryClear: "அழி",
    ttsVoiceMissing: "உங்கள் சாதனத்தில் இந்த மொழிக்கான குரல் இல்லை, எனவே வேறு குரல் பயன்படுத்தப்பட்டது. சரியான உச்சரிப்புக்கு Settings → Language & Speech-இல் மொழியைச் சேர்க்கவும்.",
  },
};
const tr = (lang, key) => (T[lang.code] && T[lang.code][key]) || T.en[key];

// ── Lightweight memory across visits — stored ONLY in this browser (localStorage),
// never sent anywhere but back into the AI's own prompt. This is real "memory" in
// the honest sense: a short summary of past questions re-inserted as context, not
// model fine-tuning or training, which isn't how a hosted API model works. ──
const HISTORY_KEY = "nt-history";
const HISTORY_MAX = 5;

function loadHistory() {
  try {
    const raw = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch { return []; }
}
function rememberQuestion(questionText) {
  try {
    const summary = String(questionText || "").trim().replace(/\s+/g, " ").slice(0, 100);
    if (!summary) return;
    const history = loadHistory();
    history.push({ q: summary, at: Date.now() });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-HISTORY_MAX)));
  } catch {}
}
function clearHistory() {
  try { localStorage.removeItem(HISTORY_KEY); } catch {}
}
// Builds a short block to append to the system prompt — empty string if there's no
// history yet, so a first-time visitor's prompt is completely unaffected.
function buildMemoryContext(lang) {
  const history = loadHistory();
  if (history.length === 0) return "";
  const list = history.map((h) => `- ${h.q}`).join("\n");
  return `\n\nRETURNING USER — on this device, they previously asked about (most recent last):\n${list}\nUse this ONLY if it naturally helps continuity (e.g. a follow-up makes more sense in light of it). Do not repeat this list back to the user, do not assume their current question relates to it unless it clearly does, and do not carry over urgency or emotional tone from a past question into an unrelated new one. Respond in ${lang.label}.`;
}

// Per-item translations for the sidebar/topic/draft/helpline data, keyed by item `key`.
const TOPIC_TR = {
  hi: {
    fundamental: { label: "मेरे मूल अधिकार", hint: "मौलिक अधिकार, सरल भाषा में" },
    police: { label: "पुलिस व गिरफ़्तारी", hint: "रोका, हिरासत, या गिरफ़्तार?" },
    women: { label: "महिला सुरक्षा", hint: "उत्पीड़न व सुरक्षा" },
    harassment: { label: "कार्यस्थल उत्पीड़न", hint: "POSH अधिनियम, शिकायत दर्ज करें" },
    domestic: { label: "घरेलू हिंसा", hint: "सुरक्षा, आश्रय, आदेश" },
    work: { label: "काम व वेतन", hint: "अवैतनिक, अनुचित, या असुरक्षित" },
    rent: { label: "किराया व आवास", hint: "जमा राशि, अवैध बेदखली" },
    consumer: { label: "उपभोक्ता अधिकार", hint: "ख़राब सामान, रिफ़ंड" },
    cheque: { label: "चेक बाउंस", hint: "धारा 138, बकाया राशि" },
    rti: { label: "RTI व जानकारी", hint: "आवेदन, या कोई जवाब नहीं" },
    cyber: { label: "साइबर व ऑनलाइन", hint: "धोखाधड़ी, ब्लैकमेल, दुरुपयोग" },
  },
  ta: {
    fundamental: { label: "எனது அடிப்படை உரிமைகள்", hint: "அடிப்படை உரிமைகள், எளிமையாக" },
    police: { label: "காவல் & கைது", hint: "தடுத்து நிறுத்தப்பட்டீர்களா?" },
    women: { label: "பெண்கள் பாதுகாப்பு", hint: "துன்புறுத்தல் & பாதுகாப்பு" },
    harassment: { label: "பணியிட துன்புறுத்தல்", hint: "POSH சட்டம், புகார் அளிக்க" },
    domestic: { label: "குடும்ப வன்முறை", hint: "பாதுகாப்பு, தங்குமிடம், உத்தரவுகள்" },
    work: { label: "வேலை & ஊதியம்", hint: "செலுத்தப்படாத, நியாயமற்ற" },
    rent: { label: "வாடகை & குடியிருப்பு", hint: "டெபாசிட், சட்டவிரோத வெளியேற்றம்" },
    consumer: { label: "நுகர்வோர் உரிமைகள்", hint: "தரமற்ற பொருட்கள், பணம் திரும்பப்" },
    cheque: { label: "காசோலை மறுப்பு", hint: "பிரிவு 138, நிலுவைத் தொகை" },
    rti: { label: "RTI & தகவல்", hint: "விண்ணப்பம், அல்லது பதில் இல்லை" },
    cyber: { label: "சைபர் & ஆன்லைன்", hint: "மோசடி, மிரட்டல், தவறான பயன்பாடு" },
  },
};
const trTopic = (lang, topic) => (TOPIC_TR[lang.code]?.[topic.key]) || { label: topic.label, hint: topic.hint };

const DRAFT_TR = {
  hi: {
    rent: { label: "किराया जमा राशि नोटिस", desc: "मकान मालिक से अपनी जमा राशि वापस माँगें।" },
    consumer: { label: "उपभोक्ता शिकायत पत्र", desc: "ख़राब सामान या सेवा के लिए।" },
    rti: { label: "RTI आवेदन", desc: "RTI अधिनियम, 2005 के तहत जानकारी माँगें।" },
    salary: { label: "वेतन बकाया कानूनी नोटिस", desc: "नियोक्ता से बकाया वेतन माँगें।" },
    harassment: { label: "कार्यस्थल उत्पीड़न शिकायत", desc: "POSH अधिनियम, 2013 के तहत औपचारिक शिकायत।" },
  },
  ta: {
    rent: { label: "வாடகை டெபாசிட் கோரிக்கை நோட்டீஸ்", desc: "வீட்டுரிமையாளரிடம் உங்கள் டெபாசிட்டைக் கோருங்கள்." },
    consumer: { label: "நுகர்வோர் புகார் கடிதம்", desc: "தரமற்ற பொருள் அல்லது சேவைக்கு." },
    rti: { label: "RTI விண்ணப்பம்", desc: "RTI சட்டம், 2005-ன் கீழ் தகவல் கோருங்கள்." },
    salary: { label: "சம்பள நிலுவை சட்ட நோட்டீஸ்", desc: "முதலாளியிடம் நிலுவைத் தொகையை கோருங்கள்." },
    harassment: { label: "பணியிட துன்புறுத்தல் புகார்", desc: "POSH சட்டம், 2013-ன் கீழ் முறையான புகார்." },
  },
};
const trDraft = (lang, d) => (DRAFT_TR[lang.code]?.[d.key]) || { label: d.label, desc: d.desc };

const HELPLINE_TR = {
  hi: { emergency: "आपातकाल", legalAid: "कानूनी सहायता (NALSA)", women: "महिला", child: "बच्चे", cyber: "साइबर अपराध" },
  ta: { emergency: "அவசரநிலை", legalAid: "சட்ட உதவி (NALSA)", women: "பெண்கள்", child: "குழந்தை", cyber: "சைபர் குற்றம்" },
};
const trHelpline = (lang, h) => (HELPLINE_TR[lang.code]?.[h.key]) || h.name;

function langLine(lang) {
  return lang.code === "en"
    ? "Respond in clear, simple English."
    : `Respond ENTIRELY in ${lang.label} (${lang.native}). Use natural, everyday ${lang.label} that an ordinary person understands. Keep legal reference codes (Article numbers, Act names, helpline numbers) recognizable.`;
}

// A small, hand-checked reference list — not a substitute for full legal research,
// but a concrete anti-hallucination anchor: the model is told to prefer these exact
// citations/figures over guessing when a question touches one of these topics.
const VERIFIED_FACTS = `VERIFIED REFERENCE FACTS (hand-checked — prefer these exact citations/figures over guessing whenever relevant; do not dump this whole list on the user, only use what's relevant to their question, in your own words):
- Article 14: Right to equality before the law.
- Article 19: Freedoms of speech, assembly, movement, residence, and profession (subject to reasonable restrictions).
- Article 20(3): No person can be compelled to be a witness against themselves.
- Article 21: Right to life and personal liberty; cannot be denied except by procedure established by law.
- Article 22: Right to be informed of the grounds of arrest and to consult a lawyer; must be produced before a magistrate within 24 hours (BNSS Sec. 58, was CrPC Sec. 57).
- Article 32: Right to move the Supreme Court directly for enforcement of Fundamental Rights.
- Article 39A: State's duty to ensure free legal aid — implemented via the Legal Services Authorities Act, 1987 (NALSA / SLSA / DLSA, helpline 15100).
- RTI Act 2005: Public Information Officer must respond within 30 days; application fee is Rs.10; if there's no response or an unsatisfactory one, a first appeal can be filed with the Appellate Authority.
- POSH Act 2013: A complaint to the Internal Committee (or Local Committee if there is no IC) should be made within 3 months of the incident, extendable by the Committee for valid reasons.
- Protection of Women from Domestic Violence Act 2005: A Protection Officer or the Magistrate's Court can grant protection, residence, and monetary relief orders.
- Section 138, Negotiable Instruments Act 1881 (cheque bounce): a written demand notice must be sent within 30 days of the bounce; if unpaid within 15 days of that notice, a criminal complaint can be filed within 1 month after that.
- Payment of Wages Act 1936 / Code on Wages 2019: unpaid-wage complaints can be made to the Labour Commissioner / Payment of Wages Authority.
- Consumer Protection Act 2019: complaints go to the District Consumer Disputes Redressal Commission for goods/services deficiencies.`;

const ASK_SYSTEM = (lang) => `You are Needhi Thozhan ("Justice Friend"), a warm, empathetic legal-aid and constitutional-awareness assistant for people in India. You explain rights and legal procedures in simple, plain language for ordinary citizens who may be stressed, scared, or unfamiliar with legal terms. Avoid jargon; when you must use a legal term, explain it in one line.

SCOPE: The Indian Constitution (Fundamental Rights, Directive Principles, key Articles) and Indian legal procedures. Cite provisions accurately: Articles of the Constitution; current statutes including the Bharatiya Nyaya Sanhita (BNS) 2023, Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023, and Bharatiya Sakshya Adhiniyam (BSA) 2023 (which replaced the IPC, CrPC and Evidence Act on 1 July 2024 — mention the older name in parentheses when it aids recognition). Also RTI Act 2005, Consumer Protection Act 2019, POSH Act 2013 (workplace sexual harassment — Internal Committee complaints), Protection of Women from Domestic Violence Act 2005 (PWDVA — protection orders, residence orders, shelter), SC/ST (Prevention of Atrocities) Act, Motor Vehicles Act, labour codes and the Payment of Wages Act 1936 (unpaid salary), Section 138 of the Negotiable Instruments Act 1881 (cheque bounce — criminal complaint within 30 days of bounce, after a 15-day demand notice), state Rent Control laws and general tenancy principles (illegal eviction without notice or court order, security deposit recovery), the RTI Act's first-appeal process (when a Public Information Officer fails to respond within 30 days), IT Act 2000, and others as relevant. Be specifically ready to help with: workplace harassment, illegal eviction, RTI non-response, cheque bounce, and domestic violence — these are common situations this app is built to cover well.

TONE: Empathetic, respectful, non-judgmental, calm — never alarmist. Briefly validate the person's feelings, then inform clearly.

ACCURACY: Be precise. NEVER invent Article or section numbers. If unsure of an exact citation, describe the right in general terms instead of fabricating one. If a matter clearly needs a lawyer or is urgent/dangerous, say so plainly.

${VERIFIED_FACTS}

BOUNDARIES: You give general legal information, not legal advice for a specific case, and you are not a lawyer. Point people to free legal aid — NALSA and State/District Legal Services Authorities, helpline 15100 — and emergency services when someone is in danger. If a question is outside Indian law or not a legal/rights matter, gently redirect or answer briefly.

WORKFLOW & INTERACTIVITY (Decision Tree): For complex or multi-step situations (like a refused police complaint or an eviction), do NOT just dump a huge list of hypothetical scenarios. Instead, use an interactive "decision tree" approach: give a brief, calming overview, and use the "reply" to ask ONE clarifying question about their exact situation (e.g., "Did the police give you a written acknowledgement?"). Then, use the "suggestions" array to provide the user with the possible answers to your question (e.g., ["Yes, I have an acknowledgement", "No, they refused"]). This guides the user step-by-step to the exact action they need.

${langLine(lang)}

EXAMPLE (this is the depth and tone to aim for — not too short, not padded; adapt structure to the actual question per the LENGTH rule below):
User: "My landlord won't return my deposit"
{"reply":"I understand how stressful this feels, especially when it's your own money being withheld. You have clear legal standing here — let's get it back.","urgent":false,"rights":[{"title":"Right to deposit refund","reference":"State tenancy principles","detail":"A landlord cannot withhold your deposit without a valid, itemized reason — general delay is not lawful."}],"steps":["Send a written demand notice with a clear deadline (e.g. 15 days).","Keep your rental agreement and payment proof.","If ignored, file a complaint with the Rent Control Court or Consumer Forum."],"resources":[{"name":"Legal aid (NALSA)","contact":"15100","note":"Free help drafting the demand notice"}],"suggestions":["Can you help me draft the demand notice?","What if my landlord threatens eviction instead?"]}

RESPOND WITH ONLY a single valid JSON object — no markdown, no code fences, no text before or after:
{
  "reply": string,            // REQUIRED. 1-4 sentences, empathetic plain-language lead.
  "urgent": boolean,          // true ONLY if there is immediate danger or a strict legal deadline.
  "needs_lawyer": boolean,    // true ONLY if the case is too complex/nuanced for simple advice and strictly requires professional counsel.
  "rights": [ { "title": string, "reference": string, "detail": string } ],   // optional. reference e.g. "Article 22", "BNSS Sec. 47 (was CrPC 50)". Omit if none apply.
  "steps": [ string ],        // optional. Ordered, concrete actions. Keep each short.
  "resources": [ { "name": string, "contact": string, "note": string } ],  // optional. Helplines/authorities.
  "suggestions": [ string ]   // optional. 2-4 short follow-ups in the user's first person.
}
If you need more detail, use "reply" to ask ONE gentle clarifying question and offer "suggestions". Do not repeat a generic disclaimer (the app shows one) — but do flag genuine urgency or if they need a lawyer. All human-readable text must be in the required language.

LENGTH: Match the response depth to the question's actual complexity. A simple factual question (e.g. "what's the emergency number") needs 1-2 sentences and can skip rights/steps/resources entirely. A genuine situational question needs the full structure — rights, steps, resources — and should not be compressed below 3 rights / 4 steps if the situation warrants that much detail. Never pad a simple answer to seem thorough, and never shrink a genuinely complex situation just to save space. Keep the JSON well-formed and complete regardless of length — a shorter complete answer is always better than a longer truncated one. Output only the JSON object and nothing after it.`;

const DRAFT_SYSTEM = (lang, typeLabel) => `You are Needhi Thozhan's document assistant for India. Draft a ready-to-use "${typeLabel}" based on the user's details, in correct Indian format.

RULES:
- Use the right legal basis for this specific document type:
  · RTI Application → Right to Information Act 2005, addressed to the Public Information Officer, mention the 30-day response timeline and Rs.10 application fee.
  · Rent Deposit Demand Notice → cite the applicable state Rent Control principles / general tenancy law, give a clear deadline (e.g. 15 days) for the deposit's return before further legal action.
  · Consumer Complaint Letter → Consumer Protection Act 2019, addressed to the seller/service provider first, mention the District Consumer Disputes Redressal Commission as the next step if unresolved.
  · Salary Due Legal Notice → Payment of Wages Act 1936 / Code on Wages 2019, addressed to the employer, give a clear deadline before a labour complaint or Section 138 (if a cheque bounced) becomes the next step.
  · Workplace Harassment Complaint → POSH Act 2013, addressed to the Internal Committee (IC) of the organisation, reference the right to a time-bound inquiry.
  · Custom Document → Read the user's details and dynamically determine the correct legal document type (e.g., Police Complaint, Writ Petition, Eviction Notice) and apply the correct Indian legal format and statutes.
- NEVER invent facts the user did not give. Where information is missing, insert a clearly marked placeholder like [Your full name], [Address], [Date], [Reference no.] so they can fill it in.
- Keep it usable by a layperson: correct but not over-complicated.
- ${langLine(lang)} Write the document body in that language, but keep proper nouns, Act names, and placeholders recognizable.

${VERIFIED_FACTS}

RESPOND WITH ONLY a single valid JSON object — no markdown, no code fences:
{
  "document": string,      // the full draft. Use \\n for line breaks. Ready to copy.
  "tips": [ string ],      // 2-4 short tips for using/filing it.
  "reminders": [ string ]  // 1-3 important reminders (deadlines, fees, where to submit).
}`;

const FIND_SYSTEM = (lang) => `You are Needhi Thozhan's legal-aid locator for India. The user gives a State and District. Explain how they can get FREE legal aid through their District Legal Services Authority (DLSA) under the Legal Services Authorities Act, 1987.

RULES:
- Do NOT invent a specific street address or phone number you are not sure of. Instead explain that the DLSA is located in the District Court complex, and direct them to official sources: the National Legal Services Authority (nalsa.gov.in), their State Legal Services Authority website, and the toll-free legal aid helpline 15100.
- IMPORTANT HONESTY RULE: For any state OTHER than Tamil Nadu, explicitly state in 'findYourDlsa' that you cannot provide a verified local address/phone for that specific district, and direct them to call 15100 to get the verified local contact.
- Be encouraging and clear about their entitlement.
- ${langLine(lang)}

RESPOND WITH ONLY a single valid JSON object — no markdown, no code fences:
{
  "intro": string,            // 1-2 warm sentences confirming their right to free legal aid.
  "findYourDlsa": string,     // where the DLSA is and how to reach it, mentioning 15100, nalsa.gov.in and the State authority.
  "eligibility": [ string ],  // who qualifies for free legal aid.
  "services": [ string ],     // what the free help covers.
  "steps": [ string ],        // how to apply.
  "contacts": [ { "name": string, "contact": string, "note": string } ]
}`;

// Close any strings/brackets left open by a truncated (token-limited) response,
// so a cut-off reply still parses into everything received so far.
function balanceAndClose(t) {
  let out = "", inStr = false, esc = false;
  const stack = [];
  for (const c of t) {
    out += c;
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "{" || c === "[") stack.push(c);
    else if (c === "}") { if (stack[stack.length - 1] === "{") stack.pop(); }
    else if (c === "]") { if (stack[stack.length - 1] === "[") stack.pop(); }
  }
  if (inStr) out += '"';            // close an unterminated string
  out = out.replace(/\s+$/, "").replace(/,$/, "");
  if (stack[stack.length - 1] === "{") {
    // inside an object: drop a dangling "key": with no value, or a bare "key" with no colon
    out = out
      .replace(/"(?:\\.|[^"\\])*"\s*:\s*$/, "")
      .replace(/([{,])\s*"(?:\\.|[^"\\])*"$/, "$1")
      .replace(/,$/, "");
  }
  for (let i = stack.length - 1; i >= 0; i--) out += stack[i] === "{" ? "}" : "]";
  return out.replace(/,(\s*[}\]])/g, "$1");
}

function extractJSON(text) {
  if (!text) return null;
  let t = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  const first = t.indexOf("{");
  if (first === -1) return null;
  t = t.slice(first);
  const last = t.lastIndexOf("}");
  if (last > 0) { try { return JSON.parse(t.slice(0, last + 1)); } catch {} }
  try { return JSON.parse(t); } catch {}
  try { return JSON.parse(balanceAndClose(t)); } catch {}
  return null;
}

// Pull a single string field out of a response we couldn't fully parse,
// so the user always sees clean prose — never raw JSON.
function fieldFromRaw(text, field) {
  if (!text) return null;
  const m = text.match(new RegExp('"' + field + '"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"'));
  if (m) { try { return JSON.parse('"' + m[1] + '"'); } catch { return m[1]; } }
  return null;
}

function replyFromRaw(text) {
  const r = fieldFromRaw(text, "reply");
  if (r) return r;
  const cleaned = (text || "").replace(/```/g, "").trim();
  return cleaned && !cleaned.startsWith("{") ? cleaned : null;
}

async function callLLM(system, messages, effort, temp, fileObj = null) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // Vision can take a bit longer
  try {
    let res;
    if (fileObj && fileObj.file) {
      const fd = new FormData();
      fd.append("file", fileObj.file);
      fd.append("payload", JSON.stringify({ system, messages, effort, temp }));
      res = await fetch("/api/analyze-document", {
        method: "POST",
        body: fd,
        signal: controller.signal,
      });
    } else {
      res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system, messages, effort, temp }),
        signal: controller.signal,
      });
    }
    if (!res.ok) {
      let msg = "The assistant is unavailable right now.";
      try { const e = await res.json(); if (e.error) msg = e.error; } catch {}
      const err = new Error(msg);
      if (res.status === 429) err.rateLimited = true; // distinct from a real outage — just needs a moment
      throw err;
    }
    const data = await res.json();
    return (data.content || "").trim();
  } catch (e) {
    if (e.name === "AbortError") throw new Error("Request timed out.");
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

// Self-repair: if the model's response can't be parsed as valid JSON (rare — usually a
// truncation or formatting slip), give it ONE fast, cheap chance to fix its own output
// before falling back to the generic "couldn't understand that" message. This never runs
// on the normal successful path — zero added cost/latency unless something already failed.
async function repairJSON(rawText) {
  try {
    const repaired = await callLLM(
      "The following text should be a single valid JSON object but is malformed, truncated, or has formatting errors. Return ONLY the corrected, complete, valid JSON object with the same content and meaning as what's recoverable — no markdown, no explanation, no extra text before or after.",
      [{ role: "user", content: String(rawText || "").slice(0, 3000) }], // cap input — fixing format, not re-processing a huge document
      "low", 0.1 // fast and deterministic — this is a formatting fix, not new reasoning
    );
    return extractJSON(repaired);
  } catch {
    return null; // repair itself failed — caller falls through to its existing fallback
  }
}

// A pre-written, always-available answer shown if the API call fails during a live
// demo — so the screen never goes blank or shows a raw error.
const OFFLINE_FALLBACK = {
  reply: "I'm having trouble reaching my legal knowledge right now — here's a general example while we retry.",
  urgent: false,
  rights: [
    { title: "Right to Constitutional Remedies", reference: "Article 32", detail: "You can approach the Supreme Court directly if your Fundamental Rights are violated." },
    { title: "Right to Equality", reference: "Article 14", detail: "The law treats everyone equally and cannot discriminate against you." },
  ],
  steps: ["Note down the key facts and dates of your situation.", "Try asking again in a moment.", "If urgent, contact the numbers on the left directly."],
  resources: [{ name: "Legal aid (NALSA)", contact: "15100", note: "Free 24-hour legal aid helpline" }],
  suggestions: [],
};
const OFFLINE_TR = {
  hi: "मुझे अभी अपनी कानूनी जानकारी तक पहुँचने में परेशानी हो रही है — फिर से कोशिश करते समय यहाँ एक सामान्य उदाहरण है।",
  ta: "இப்போது எனது சட்டத் தகவலை அணுகுவதில் சிக்கல் உள்ளது — மீண்டும் முயற்சிக்கும் போது இதோ ஒரு பொதுவான உதாரணம்.",
};
const offlineReply = (lang) => OFFLINE_TR[lang.code] || OFFLINE_FALLBACK.reply;

// Hand-written, pre-verified answers for the highest-value demo topics — instant (0-second
// lag), zero API call, zero hallucination risk. English only — we won't hand-translate legal
// content into 12 languages without native-speaker review, so non-English selections still
// go through the live API as normal. Every fact here was cross-checked against this app's
// own VERIFIED_FACTS block and against live API answers already confirmed correct earlier.
const CACHED_ANSWERS = {
  fundamental: {
    reply: "Here's a simple overview of the main Fundamental Rights every Indian citizen has under the Constitution.",
    urgent: false,
    rights: [
      { title: "Right to Equality", reference: "Article 14-18", detail: "All people are equal before the law and cannot be discriminated against on grounds like religion, race, caste, sex, or place of birth." },
      { title: "Right to Freedom", reference: "Article 19-22", detail: "You have freedom of speech, assembly, movement, and the right to practice any profession, plus protection against arbitrary arrest." },
      { title: "Right against Exploitation", reference: "Article 23-24", detail: "Protects against human trafficking, forced labour, and child labour in hazardous jobs." },
      { title: "Right to Constitutional Remedies", reference: "Article 32", detail: "You can approach the Supreme Court directly if any of your Fundamental Rights are violated." },
    ],
    steps: [
      "Read the Constitution's Preamble and Part III (Articles 12-35) for the full list.",
      "If you feel a right is being violated, note down exactly what happened and when.",
      "You can file a writ petition directly in the Supreme Court (Article 32) or your High Court (Article 226).",
      "For free help, contact NALSA or your State Legal Services Authority.",
    ],
    resources: [{ name: "Legal aid (NALSA)", contact: "15100", note: "Free legal aid and advice, 24x7" }],
    suggestions: ["What are my rights if the police arrest me?", "How do I file a writ petition?"],
  },
  police: {
    reply: "If police stop, detain, or arrest you, the Constitution gives you clear, specific protections.",
    urgent: false,
    rights: [
      { title: "Right to be informed and consult a lawyer", reference: "Article 22", detail: "You must be told why you are being detained or arrested, and you can consult a lawyer of your choice." },
      { title: "Right against self-incrimination", reference: "Article 20(3)", detail: "You cannot be forced to be a witness against yourself — you may remain silent." },
      { title: "Right to be produced before a magistrate", reference: "BNSS Sec. 58 (was CrPC Sec. 57)", detail: "If arrested, you must be presented before the nearest magistrate within 24 hours, excluding travel time." },
    ],
    steps: [
      "Stay calm and ask politely whether you are being detained or arrested, and why.",
      "Ask the officer to show identification.",
      "Clearly state you wish to consult a lawyer and that you will remain silent until counsel is present.",
      "If arrested, make sure you (or someone on your behalf) are produced before a magistrate within 24 hours.",
    ],
    resources: [
      { name: "Legal aid (NALSA)", contact: "15100", note: "Free legal aid and advice, 24x7" },
      { name: "Police Emergency Helpline", contact: "112", note: "For immediate safety concerns" },
    ],
    suggestions: ["What if I can't afford a lawyer?", "What are my Fundamental Rights?"],
  },
};

// Shown ONLY when the failure was specifically a rate limit (too many questions in a short
// window) — accurate wording matters here, since "trouble reaching my legal knowledge"
// would wrongly suggest a real outage when actually it's just a moment's wait.
const RATE_LIMIT_TR = {
  en: "We're getting a lot of questions right now — trying again in a few seconds...",
  hi: "अभी बहुत सारे सवाल आ रहे हैं — कुछ सेकंड में फिर से कोशिश कर रहे हैं...",
  ta: "இப்போது நிறைய கேள்விகள் வருகின்றன — சில நொடிகளில் மீண்டும் முயற்சிக்கிறோம்...",
};
const rateLimitRetryingText = (lang) => RATE_LIMIT_TR[lang.code] || RATE_LIMIT_TR.en;

export default function NeedhiThozhan() {
  const [mode, setMode] = useState("ask");
  const [lang, setLang] = useState(LANGUAGES[0]);
  const rtl = lang.code === "ur";

  // Ask
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [listening, setListening] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const fileInputRef = useRef(null);
  // Draft
  const [draftType, setDraftType] = useState(DRAFT_TYPES[0]);
  const [draftFields, setDraftFields] = useState({ name: "", date: "", amount: "", details: "" });
  const [draftResult, setDraftResult] = useState(null);
  const [draftLoading, setDraftLoading] = useState(false);
  // Find
  const [findState, setFindState] = useState("Tamil Nadu");
  const [findDistrict, setFindDistrict] = useState("");
  const [findResult, setFindResult] = useState(null);
  const [findLoading, setFindLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const scrollRef = useRef(null);
  const taRef = useRef(null);
  const recRef = useRef(null);

  const voiceOK = useMemo(
    () => typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition),
    []
  );
  const ttsOK = useMemo(() => typeof window !== "undefined" && "speechSynthesis" in window, []);
  const geoOK = useMemo(() => typeof navigator !== "undefined" && "geolocation" in navigator, []);
  const [geoError, setGeoError] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [speakingId, setSpeakingId] = useState(null);
  const [ttsVoiceMissing, setTtsVoiceMissing] = useState(false);
  const [feedback, setFeedback] = useState({}); // { [messageId]: "up" | "down" }
  const [historyCount, setHistoryCount] = useState(() => loadHistory().length);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile-only slide-in sidebar

  function findNearMe(query) {
    if (!geoOK) return;
    setGeoError(false);
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        const { latitude, longitude } = pos.coords;
        const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${latitude},${longitude},14z`;
        window.open(url, "_blank", "noopener,noreferrer");
      },
      () => { setGeoLoading(false); setGeoError(true); }, // denied, unavailable, or timed out
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  }

  function handleFeedback(id, value) {
    setFeedback((f) => ({ ...f, [id]: f[id] === value ? null : value }));

    const msgIndex = messages.findIndex(m => m.id === id);
    if (msgIndex === -1) return;
    const msg = messages[msgIndex];
    
    let queryText = "Unknown query";
    if (msgIndex > 0 && messages[msgIndex - 1].role === "user") {
      queryText = messages[msgIndex - 1].content;
    }
    
    const responseSummary = String(msg.content).slice(0, 500);

    fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: queryText, response_summary: responseSummary, feedback_type: value }),
    }).catch(e => console.error("Failed to send feedback:", e));
  }

  useEffect(() => {
    if (!loading) {
      setLoadingStep(0);
      return;
    }
    const timer1 = setTimeout(() => setLoadingStep(1), 1500);
    const timer2 = setTimeout(() => setLoadingStep(2), 3500);
    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, [loading]);

  // Browsers load available system TTS voices asynchronously — cache them once loaded,
  // rather than calling getVoices() fresh each time (often returns empty on first call).
  const voicesRef = useRef([]);
  useEffect(() => {
    if (!ttsOK) return;
    const load = () => { voicesRef.current = window.speechSynthesis.getVoices(); };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, [ttsOK]);

  function handleSpeak(id, text) {
    if (!ttsOK) return;
    const synth = window.speechSynthesis;
    if (speakingId === id) { synth.cancel(); setSpeakingId(null); return; } // tap again to stop
    synth.cancel(); // only one answer speaks at a time
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang.voice;
    // Explicitly pick a real installed voice for this language if one exists — setting
    // .lang alone doesn't always make the browser choose the best available voice.
    // If no matching voice is installed on this device, this can't create one — that's a
    // genuine OS limitation (Windows: Settings → Time & Language → Speech → Add voices),
    // not something fixable in code, so it falls back to the system default voice.
    const voices = voicesRef.current;
    const wanted = lang.voice.toLowerCase();
    const match =
      voices.find((v) => v.lang.toLowerCase() === wanted) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(wanted.slice(0, 2)));
    if (match) u.voice = match;
    setTtsVoiceMissing(!match && lang.code !== "en");
    u.rate = 0.95; // slightly slower for clarity
    u.onend = () => setSpeakingId((cur) => (cur === id ? null : cur));
    u.onerror = () => setSpeakingId((cur) => (cur === id ? null : cur));
    synth.speak(u);
    setSpeakingId(id);
  }

  // Stop any speech in progress when switching tabs, changing language, or on unmount —
  // an answer in the wrong language or from a screen you left would be confusing.
  useEffect(() => {
    return () => { if (ttsOK) window.speechSynthesis.cancel(); };
  }, [ttsOK]);
  useEffect(() => {
    if (ttsOK) { window.speechSynthesis.cancel(); setSpeakingId(null); }
    setTtsVoiceMissing(false);
  }, [mode, lang, ttsOK]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, mode]);

  // Sidebar/hero topic taps go through here first — instant cached answer if available
  // (English only, see CACHED_ANSWERS), otherwise the normal live API call via send().
  function handleTopicSelect(topic) {
    const cached = lang.code === "en" ? CACHED_ANSWERS[topic.key] : null;
    if (!cached) { send(topic.seed); return; }
    if (loading) return;
    const userMsg = { id: Date.now(), role: "user", text: topic.seed };
    const assistantMsg = { id: Date.now() + 1, role: "assistant", payload: cached, raw: JSON.stringify(cached) };
    setMessages((c) => [...c, userMsg, assistantMsg]);
    rememberQuestion(topic.seed); // keep memory behavior consistent with live answers
    setHistoryCount(loadHistory().length);
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return alert("File is too large (max 10MB)");
    
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setAttachment({ file, previewUrl: ev.target.result, type: 'image' });
      reader.readAsDataURL(file);
    } else {
      setAttachment({ file, previewUrl: null, type: 'pdf', name: file.name });
    }
  }

  async function send(text) {
    const content = (text ?? input).trim();
    if ((!content && !attachment) || loading) return;
    setInput("");
    
    const currentAttachment = attachment;
    if (currentAttachment) setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (taRef.current) taRef.current.style.height = "auto";
    const userMsg = { id: Date.now(), role: "user", text: content, attachment: currentAttachment };
    const next = [...messages, userMsg];
    setMessages(next);
    setLoading(true);
    const memoryContext = buildMemoryContext(lang);
    if (content) rememberQuestion(content);
    setHistoryCount(loadHistory().length);
    const MAX_HISTORY_TURNS = 6;
    const windowed = next.slice(-MAX_HISTORY_TURNS);
    const apiMessages = windowed.map((m) =>
      m.role === "user" ? { role: "user", content: m.text }
        : { role: "assistant", content: m.raw || JSON.stringify(m.payload || {}) }
    );
    try {
      let out;
      try {
        out = await callLLM(ASK_SYSTEM(lang) + memoryContext, apiMessages, "medium", 0.3, currentAttachment);
      } catch (e) {
        if (e.rateLimited) {
          // A rate limit isn't a real outage — pause briefly and try once more automatically,
          // rather than immediately showing the user a "something's wrong" message.
          await new Promise((r) => setTimeout(r, 4000));
          out = await callLLM(ASK_SYSTEM(lang) + memoryContext, apiMessages, "medium", 0.3, currentAttachment);
        } else {
          throw e;
        }
      }
      let parsed = extractJSON(out);
      if (!parsed || !(parsed.reply || parsed.rights || parsed.steps || parsed.resources)) {
        const repaired = await repairJSON(out); // one fast, cheap attempt to fix malformed output
        if (repaired && (repaired.reply || repaired.rights || repaired.steps || repaired.resources)) parsed = repaired;
      }
      const payload =
        parsed && (parsed.reply || parsed.rights || parsed.steps || parsed.resources)
          ? parsed
          : { reply: replyFromRaw(out) || "I'm sorry — could you try asking that again?" };
      setMessages((c) => [...c, { id: Date.now() + 1, role: "assistant", payload, raw: JSON.stringify(payload) }]);
    } catch (e) {
      // Network/API failure (e.g. flaky venue WiFi, or a rate limit that didn't clear even
      // after one retry) — never show a raw error or blank screen; show accurate wording
      // (rate limit vs. real connectivity issue are different problems) plus a retry chip.
      const payload = e?.rateLimited
        ? { ...OFFLINE_FALLBACK, reply: rateLimitRetryingText(lang), suggestions: [tr(lang, "retry")] }
        : { ...OFFLINE_FALLBACK, reply: offlineReply(lang), suggestions: [tr(lang, "retry")] };
      setMessages((c) => [...c, { id: Date.now() + 1, role: "assistant", payload, raw: content }]);
    } finally { setLoading(false); }
  }

  function onDraftField(key, value) {
    setDraftFields((f) => ({ ...f, [key]: value }));
  }

  async function runDraft() {
    if (!draftFields.details.trim() || draftLoading) return;
    setDraftLoading(true); setDraftResult(null);
    const detailsBlock =
      `Full name: ${draftFields.name.trim() || "[not given]"}\n` +
      `Date: ${draftFields.date.trim() || "[not given]"}\n` +
      (draftType.needsAmount ? `${draftType.amountLabel || "Amount"}: ${draftFields.amount.trim() || "[not given]"}\n` : "") +
      `What happened: ${draftFields.details.trim()}`;
    try {
      const out = await callLLM(DRAFT_SYSTEM(lang, draftType.label),
        [{ role: "user", content: `Draft a ${draftType.label}. Details from me:\n${detailsBlock}` }], undefined, 0.15);
      let parsed = extractJSON(out);
      if (!parsed || !parsed.document) {
        const repaired = await repairJSON(out); // one fast, cheap attempt to fix malformed output
        if (repaired && repaired.document) parsed = repaired;
      }
      if (parsed && parsed.document) {
        setDraftResult(parsed);
      } else {
        let doc = fieldFromRaw(out, "document");
        if (!doc && out && !out.trim().startsWith("{")) doc = out.trim();
        setDraftResult({
          document: doc || "",
          tips: parsed?.tips || [],
          reminders: doc ? (parsed?.reminders || []) : ["Couldn't format the draft cleanly — please tap Generate again."],
        });
      }
    } catch {
      setDraftResult({ document: "", tips: [], reminders: ["Couldn't generate the draft — the connection may be unstable. Please tap Generate again."] });
    } finally { setDraftLoading(false); }
  }

  async function runFind() {
    if (!findState.trim() || findLoading) return;
    setFindLoading(true); setFindResult(null);
    try {
      const out = await callLLM(FIND_SYSTEM(lang),
        [{ role: "user", content: `State: ${findState.trim()}${findDistrict.trim() ? `, District: ${findDistrict.trim()}` : ""}. How do I get free legal aid here?` }], undefined, 0.2);
      const parsed = extractJSON(out);
      if (parsed && (parsed.intro || parsed.findYourDlsa)) {
        setFindResult(parsed);
      } else {
        setFindResult({
          intro: replyFromRaw(out) || fieldFromRaw(out, "intro") || "I couldn't format this cleanly — please try again. Meanwhile, the free legal-aid helpline is 15100.",
          findYourDlsa: "", eligibility: [], services: [], steps: [], contacts: [],
        });
      }
    } catch {
      setFindResult({ intro: "Couldn't fetch this right now — please try again. Meanwhile, the free legal-aid helpline is 15100.", findYourDlsa: "", eligibility: [], services: [], steps: [], contacts: [] });
    } finally { setFindLoading(false); }
  }

  function onKey(e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }
  function handleSuggest(s) {
    if (s === tr(lang, "retry")) {
      const lastUser = [...messages].reverse().find((m) => m.role === "user");
      if (lastUser) { send(lastUser.text); return; }
    }
    send(s);
  }
  function autoGrow(e) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  }
  function copy(text) {
    try { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch {}
  }
  async function downloadDoc() {
    if (!draftResult?.document) return;
    try {
      const { Document, Packer, Paragraph, TextRun } = await import("docx");
      const { saveAs } = await import("file-saver");
      
      const paragraphs = draftResult.document.split('\n').map(line => {
        return new Paragraph({
          children: [new TextRun({ text: line, font: "Georgia", size: 24 })],
          spacing: { after: 120 }
        });
      });
      
      const doc = new Document({
        sections: [{ properties: {}, children: paragraphs }]
      });
      
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${draftType.key}-draft.docx`);
    } catch (e) {
      console.error("Failed to create docx, falling back to txt:", e);
      const blob = new Blob([draftResult.document], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${draftType.key}-draft.txt`; a.click();
      URL.revokeObjectURL(url);
    }
  }
  function printDoc() {
    if (!draftResult?.document) return;
    const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const w = window.open("", "_blank");
    if (!w) return; // popup blocked — Copy/Download still work as fallback
    w.document.write(`<!doctype html><meta charset="utf-8"><title>${esc(draftType.label)}</title>
      <style>body{font-family:Georgia,'Noto Serif',serif;max-width:680px;margin:48px auto;padding:0 24px;color:#222;line-height:1.7;white-space:pre-wrap}
      @media print{body{margin:0;padding:24px}}</style>
      <pre style="font-family:inherit;white-space:pre-wrap;margin:0">${esc(draftResult.document)}</pre>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300); // let fonts/layout settle before the print dialog opens
  }
  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    if (listening && recRef.current) { recRef.current.stop(); return; }
    const r = new SR();
    r.lang = lang.voice; r.interimResults = false; r.maxAlternatives = 1;
    r.onresult = (e) => setInput((p) => (p ? p + " " : "") + e.results[0][0].transcript);
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recRef.current = r; setListening(true); r.start();
  }
  function exportChat() {
    if (!messages.length) return;
    const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const parts = messages.map((m) => {
      if (m.role === "user") return `<div class="u"><b>You asked</b><p>${esc(m.text)}</p></div>`;
      const p = m.payload || {};
      let h = `<div class="a"><b>Needhi Thozhan</b><p>${esc(p.reply)}</p>`;
      if (p.rights?.length) h += `<h4>Your rights</h4>` + p.rights.map((r) => `<p><b>${esc(r.title)}</b> <em>${esc(r.reference)}</em><br>${esc(r.detail)}</p>`).join("");
      if (p.steps?.length) h += `<h4>Steps</h4><ol>` + p.steps.map((s) => `<li>${esc(s)}</li>`).join("") + `</ol>`;
      if (p.resources?.length) h += `<h4>Where to get help</h4>` + p.resources.map((r) => `<p><b>${esc(r.name)}</b> ${esc(r.contact)} — ${esc(r.note)}</p>`).join("");
      return h + `</div>`;
    }).join("");
    const html = `<!doctype html><meta charset="utf-8"><title>Needhi Thozhan — Guidance</title><style>body{font-family:Georgia,serif;max-width:720px;margin:40px auto;padding:0 20px;color:#222;line-height:1.6}h1{color:#16233F}.u{background:#16233F;color:#F3EEDF;padding:12px 16px;border-radius:10px;margin:18px 0}.u p{margin:6px 0 0}.a{border-left:3px solid #B0842B;padding:4px 0 4px 16px;margin:18px 0}h4{color:#B0842B;margin:14px 0 4px;text-transform:uppercase;font-size:12px;letter-spacing:1px}em{color:#B0842B;font-style:normal;font-size:12px}.d{margin-top:30px;padding-top:16px;border-top:1px solid #ddd;font-size:12px;color:#777}</style><h1>Needhi Thozhan — Your guidance</h1>${parts}<div class="d">General legal information, not legal advice. For your case, contact free legal aid (NALSA · 15100) or a lawyer. Emergency: 112.</div>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "needhi-thozhan-guidance.html"; a.click();
    URL.revokeObjectURL(url);
  }

  const started = messages.length > 0;
  const modes = [
    { key: "ask", label: tr(lang, "ask") },
    { key: "draft", label: tr(lang, "draft") },
    { key: "find", label: tr(lang, "find") },
  ];

  return (
    <div className={"nm-root" + (rtl ? " nm-rtl" : "")}>
      <style>{css}</style>
      <div className="nm-grain" aria-hidden="true" />

      {/* Sidebar */}
      {/* Mobile-only backdrop — tapping it closes the slide-in sidebar */}
      {sidebarOpen && <div className="nm-backdrop" onClick={() => setSidebarOpen(false)} />}

      <aside className={"nm-side" + (sidebarOpen ? " nm-side-open" : "")}>
        <button className="nm-side-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
        <div className="nm-brand">
          <span className="nm-logo"><Chakra size={32} /></span>
          <div>
            <div className="nm-brand-name">Needhi Thozhan</div>
            <div className="nm-brand-sub">நீதி தோழன் · {tr(lang, "tagline")}</div>
          </div>
        </div>

        {mode === "ask" && (
          <>
            <div className="nm-side-label">{tr(lang, "whereHelp")}</div>
            <div className="nm-topics">
              {TOPICS.map((t) => {
                const tt = trTopic(lang, t);
                return (
                  <button key={t.key} className="nm-topic" onClick={() => { handleTopicSelect(t); setSidebarOpen(false); }} disabled={loading}>
                    <span className="nm-topic-label">{tt.label}</span>
                    <span className="nm-topic-hint">{tt.hint}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {mode === "draft" && (
          <>
            <div className="nm-side-label">{tr(lang, "draftPick")}</div>
            <div className="nm-topics">
              {DRAFT_TYPES.map((d) => {
                const dt = trDraft(lang, d);
                return (
                  <button key={d.key} className={"nm-topic" + (draftType.key === d.key ? " nm-topic-active" : "")}
                    onClick={() => { setDraftType(d); setDraftResult(null); setDraftFields({ name: "", date: "", amount: "", details: "" }); setSidebarOpen(false); }} disabled={draftLoading}>
                    <span className="nm-topic-label">{dt.label}</span>
                    <span className="nm-topic-hint">{dt.desc}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {mode === "find" && (
          <div className="nm-side-note">
            <Ornament />
            <p>{lang.code === "hi" ? "मुफ़्त कानूनी सहायता अनुच्छेद 39A और विधिक सेवा प्राधिकरण अधिनियम, 1987 के तहत एक अधिकार है — भारत के हर ज़िले में उपलब्ध।"
              : lang.code === "ta" ? "இலவச சட்ட உதவி பெறுவது சரத்து 39A மற்றும் சட்ட சேவைகள் ஆணையங்கள் சட்டம், 1987-ன் கீழ் ஒரு உரிமை — இந்தியாவின் ஒவ்வொரு மாவட்டத்திலும் கிடைக்கும்."
              : "Free legal aid is a right under Article 39A and the Legal Services Authorities Act, 1987 — available in every district of India."}</p>
          </div>
        )}

        <div className="nm-side-foot">
          <div className="nm-side-label">{tr(lang, "needNow")}</div>
          <ul className="nm-helplines">
            {HELPLINES.map((h) => (<li key={h.key}><span>{trHelpline(lang, h)}</span><a href={telHref(h.num)} className="nm-tel-side">{h.num}</a></li>))}
          </ul>
          {historyCount > 0 && (
            <div className="nm-memory">
              <span>{tr(lang, "memoryLabel").replace("{n}", historyCount)}</span>
              <button onClick={() => { clearHistory(); setHistoryCount(0); }}>{tr(lang, "memoryClear")}</button>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="nm-main">
        <header className="nm-head">
          <div className="nm-head-left">
            <button className="nm-hamburger" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
            <span className="nm-head-chakra"><Chakra size={20} /></span>
            <span className="nm-head-title">{tr(lang, "headTitle")}</span>
          </div>
          <div className="nm-head-right">
            <div className="nm-modes">
              {modes.map((m) => (
                <button key={m.key} className={"nm-mode" + (mode === m.key ? " nm-mode-on" : "")} onClick={() => setMode(m.key)}>
                  {m.label}
                </button>
              ))}
            </div>
            <select className="nm-lang" value={lang.code}
              onChange={(e) => setLang(LANGUAGES.find((l) => l.code === e.target.value))} aria-label="Language">
              {LANGUAGES.map((l) => (<option key={l.code} value={l.code}>{l.native}</option>))}
            </select>
          </div>
        </header>

        <div className="nm-scroll" ref={scrollRef} dir={rtl ? "rtl" : "ltr"}>
          <div className="nm-thread">

            {/* ── ASK ── */}
            {mode === "ask" && (
              <>
                {!started && (
                  <section className="nm-hero">
                    <div className="nm-preamble nm-r1">{tr(lang, "heroPre")}</div>
                    <h1 className="nm-hero-h nm-r2">{tr(lang, "heroH1")}<br />{tr(lang, "heroH2")}</h1>
                    <Ornament />
                    <p className="nm-hero-p nm-r3">{tr(lang, "heroP")}</p>
                    <div className="nm-hero-topics nm-r4">
                      {TOPICS.slice(0, 6).map((t) => (
                        <button key={t.key} className="nm-chip" onClick={() => handleTopicSelect(t)} disabled={loading}>{trTopic(lang, t).label}</button>
                      ))}
                    </div>
                  </section>
                )}
                {messages.map((m) =>
                  m.role === "user" ? (
                    <div key={m.id} className="nm-row nm-row-user" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      {m.attachment && m.attachment.type === 'image' && (
                        <img src={m.attachment.previewUrl} alt="Uploaded" style={{ maxWidth: '200px', borderRadius: '12px', border: '1px solid var(--edge)' }} />
                      )}
                      {m.attachment && m.attachment.type === 'pdf' && (
                        <div style={{ background: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: '1px solid var(--edge)', color: 'var(--ink)' }}>
                          📄 {m.attachment.name}
                        </div>
                      )}
                      {m.text && <div className="nm-user-bubble">{m.text}</div>}
                    </div>
                  ) : (
                    <div key={m.id} className="nm-row nm-row-bot">
                      <div className="nm-bot-mark"><Chakra size={20} /></div>
                      <GuidanceCard payload={m.payload} id={m.id} onSuggest={handleSuggest} loading={loading} lang={lang} onCopy={copy}
                        ttsOK={ttsOK} speakingId={speakingId} onSpeak={handleSpeak}
                        feedbackValue={feedback[m.id]} onFeedback={handleFeedback} />
                    </div>
                  )
                )}
                {loading && (
                  <div className="nm-row nm-row-bot">
                    <div className="nm-bot-mark nm-thinking-mark"><Chakra size={20} spin /></div>
                    <div className="nm-thinking">
                      {loadingStep === 0 ? "Processing request..." : loadingStep === 1 ? "Searching legal database..." : "Drafting response..."}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── DRAFT ── */}
            {mode === "draft" && (
              <section className="nm-panel">
                <div className="nm-panel-head">
                  <h2 className="nm-panel-h">{trDraft(lang, draftType).label}</h2>
                  <p className="nm-panel-sub">{trDraft(lang, draftType).desc}</p>
                </div>
                <div className="nm-guided-fields">
                  <div className="nm-guided-row">
                    <label className="nm-field">
                      <span>{tr(lang, "fieldName")}</span>
                      <input value={draftFields.name} onChange={(e) => onDraftField("name", e.target.value)} />
                    </label>
                    <label className="nm-field">
                      <span>{tr(lang, "fieldDate")}</span>
                      <input type="date" value={draftFields.date} onChange={(e) => onDraftField("date", e.target.value)} />
                    </label>
                    {draftType.needsAmount && (
                      <label className="nm-field nm-field-amount">
                        <span>{draftType.amountLabel}</span>
                        <input inputMode="numeric" value={draftFields.amount} onChange={(e) => onDraftField("amount", e.target.value)} />
                      </label>
                    )}
                  </div>
                  <textarea className="nm-bigfield" placeholder={tr(lang, "detailsPh")}
                    value={draftFields.details} onChange={(e) => onDraftField("details", e.target.value)} rows={4} />
                </div>
                <button className="nm-primary" onClick={runDraft} disabled={draftLoading || !draftFields.details.trim()}>
                  {draftLoading ? tr(lang, "drafting") : tr(lang, "generate")}
                </button>

                {draftLoading && <div className="nm-panel-loading"><Chakra size={26} spin /><span>{tr(lang, "drafting")}</span></div>}

                {draftResult && (
                  <div className="nm-draft-out">
                    {draftResult.checklist?.length > 0 && (
                      <div className="nm-block" style={{ marginBottom: '24px', background: 'var(--paper)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--gold-line)' }}>
                        <div className="nm-block-h" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          Document Checklist
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                          {draftResult.checklist.map((item, i) => (
                            <label key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '14px', color: '#3A382E' }}>
                              <input type="checkbox" style={{ marginTop: '3px', width: '16px', height: '16px', accentColor: 'var(--gold-deep)' }} />
                              <span style={{ lineHeight: '1.4' }}>{item}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                    {draftResult.document && (
                      <div className="nm-draft-bar">
                        <span className="nm-draft-label">{tr(lang, "yourDraft")}</span>
                        <div className="nm-draft-actions">
                          <button className="nm-mini" onClick={() => copy(draftResult.document)}>{copied ? tr(lang, "copied") : tr(lang, "copy")}</button>
                          <button className="nm-mini" onClick={downloadDoc}>{tr(lang, "download")}</button>
                          <button className="nm-mini" onClick={printDoc}>{tr(lang, "print")}</button>
                        </div>
                      </div>
                    )}
                    {draftResult.document && (
                      <div className="nm-paper"><span className="nm-corner nm-c1" /><span className="nm-corner nm-c2" /><span className="nm-corner nm-c3" /><span className="nm-corner nm-c4" />
                        <pre className="nm-doc">{draftResult.document}</pre>
                      </div>
                    )}
                    {draftResult.reminders?.length > 0 && (
                      <div className="nm-callout">
                        {draftResult.reminders.map((r, i) => (<div key={i} className="nm-callout-line">⚑ {r}</div>))}
                      </div>
                    )}
                    {draftResult.tips?.length > 0 && (
                      <div className="nm-block">
                        <div className="nm-block-h">{tr(lang, "tips")}</div>
                        <ul className="nm-tips">{draftResult.tips.map((t, i) => (<li key={i}>{t}</li>))}</ul>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* ── FIND ── */}
            {mode === "find" && (
              <section className="nm-panel">
                <div className="nm-panel-head">
                  <h2 className="nm-panel-h">{tr(lang, "findTitle")}</h2>
                  <p className="nm-panel-sub">{tr(lang, "findSub")}</p>
                </div>
                {geoOK && (
                  <div className="nm-nearme-wrap">
                    <div className="nm-nearme-btns">
                      <button className="nm-nearme" onClick={() => findNearMe("District Legal Services Authority")} disabled={geoLoading}>
                        {geoLoading ? tr(lang, "nearMeLoading") : tr(lang, "nearMe")}
                      </button>
                      <button className="nm-nearme nm-nearme-police" onClick={() => findNearMe("police station")} disabled={geoLoading}>
                        {geoLoading ? tr(lang, "nearMeLoading") : tr(lang, "nearMePolice")}
                      </button>
                    </div>
                    {geoError && <span className="nm-nearme-error">{tr(lang, "nearMeError")}</span>}
                  </div>
                )}
                <div style={{ marginBottom: '16px', padding: '12px 16px', background: 'var(--paper)', border: '1px solid var(--gold-line)', borderRadius: '8px', fontSize: '13px', lineHeight: '1.5', color: '#4A463A' }}>
                  {findState === "Tamil Nadu" ? 
                    <><span style={{ color: 'var(--leaf)', fontWeight: 'bold' }}>✓ Verified contact data:</span> We've manually verified contact details for all 38 Tamil Nadu districts.</> : 
                    <><span style={{ color: 'var(--gold-deep)', fontWeight: 'bold' }}>ⓘ General guidance:</span> We've manually verified contact details for Tamil Nadu. For other states, we provide general guidance and point you to NALSA's official directory rather than guessing local contact details.</>
                  }
                </div>
                <div className="nm-find-fields">
                  <label className="nm-field">
                    <span>{tr(lang, "stateLbl")}</span>
                    <select value={findState === "Tamil Nadu" ? "Tamil Nadu" : "__other"}
                      onChange={(e) => { setFindState(e.target.value === "__other" ? "" : "Tamil Nadu"); setFindDistrict(""); setFindResult(null); }}>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="__other">{tr(lang, "otherState")}</option>
                    </select>
                  </label>
                  {findState !== "Tamil Nadu" ? (
                    <label className="nm-field">
                      <span>{tr(lang, "otherState")}</span>
                      <input value={findState} onChange={(e) => setFindState(e.target.value)} placeholder={tr(lang, "otherStatePh")} />
                    </label>
                  ) : (
                    <label className="nm-field">
                      <span>{tr(lang, "distLbl")}</span>
                      <SearchableSelect
                        value={findDistrict}
                        onChange={setFindDistrict}
                        options={TN_DISTRICTS}
                        placeholder={tr(lang, "selectDistrict")}
                        noMatchText={tr(lang, "noMatches")}
                      />
                    </label>
                  )}
                  {findState !== "Tamil Nadu" && (
                    <label className="nm-field">
                      <span>{tr(lang, "distLbl")}</span>
                      <input value={findDistrict} onChange={(e) => setFindDistrict(e.target.value)} placeholder="e.g. Vellore" />
                    </label>
                  )}
                </div>

                {/* Instant, static reference — works even offline, for ANY state, not just Tamil Nadu */}
                {findState === "Tamil Nadu" ? (
                  <div className="nm-find-card nm-find-static">
                    <div className="nm-block-h nm-leaf">{tr(lang, "tnQuickTitle")}</div>
                    <div className="nm-res">
                      {TN_CONTACTS.map((r, i) => (
                        <div className="nm-res-item" key={i}>
                          <div className="nm-res-top"><span className="nm-res-name">{r.name}</span><ContactLink value={r.contact} className="nm-res-contact" /></div>
                          <span className="nm-res-note">{r.note}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : findState.trim() ? (
                  <div className="nm-find-card nm-find-static">
                    <div className="nm-block-h nm-leaf">{(GENERIC_FIND_TR[lang.code] || GENERIC_FIND_TR.en).title}</div>
                    <div className="nm-res">
                      {genericFindContacts(lang, findState, findDistrict).map((r, i) => (
                        <div className="nm-res-item" key={i}>
                          <div className="nm-res-top"><span className="nm-res-name">{r.name}</span>{r.contact && <ContactLink value={r.contact} className="nm-res-contact" />}</div>
                          <span className="nm-res-note">{r.note}</span>
                        </div>
                      ))}
                    </div>
                    <div className="nm-honesty-note">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/><path d="M12 8v.01M12 11v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                      <span>{(GENERIC_FIND_TR[lang.code] || GENERIC_FIND_TR.en).honestyNote}</span>
                    </div>
                  </div>
                ) : null}

                <button className="nm-primary" onClick={runFind} disabled={findLoading || !findState.trim()}>
                  {findLoading ? tr(lang, "finding") : tr(lang, "findBtn")}
                </button>

                {findLoading && <div className="nm-panel-loading"><Chakra size={26} spin /><span>{tr(lang, "finding")}</span></div>}

                {findResult && (
                  <div className="nm-find-out">
                    {findResult.intro && <p className="nm-find-intro">{findResult.intro}</p>}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', marginBottom: '12px', background: findState === 'Tamil Nadu' ? 'rgba(65, 123, 90, 0.1)' : 'rgba(168,124,42,0.1)', color: findState === 'Tamil Nadu' ? 'var(--leaf)' : 'var(--gold-deep)' }}>
                      {findState === 'Tamil Nadu' ? '✓ Verified contact data' : 'ⓘ General guidance — confirm locally via NALSA 15100'}
                    </div>
                    {findResult.findYourDlsa && (
                      <div className="nm-find-card">
                        <div className="nm-block-h nm-leaf">{tr(lang, "dlsaH")}</div>
                        <p>{findResult.findYourDlsa}</p>
                      </div>
                    )}
                    <div className="nm-find-grid">
                      {findResult.eligibility?.length > 0 && (
                        <div className="nm-block"><div className="nm-block-h">{tr(lang, "qualifiesH")}</div>
                          <ul className="nm-tips">{findResult.eligibility.map((s, i) => <li key={i}>{s}</li>)}</ul></div>
                      )}
                      {findResult.services?.length > 0 && (
                        <div className="nm-block"><div className="nm-block-h">{tr(lang, "coveredH")}</div>
                          <ul className="nm-tips">{findResult.services.map((s, i) => <li key={i}>{s}</li>)}</ul></div>
                      )}
                    </div>
                    {findResult.steps?.length > 0 && (
                      <div className="nm-block"><div className="nm-block-h">{tr(lang, "applyH")}</div>
                        <ol className="nm-steps">{findResult.steps.map((s, i) => (<li key={i}><span className="nm-step-n">{i + 1}</span><span>{s}</span></li>))}</ol></div>
                    )}
                    {findResult.contacts?.length > 0 && (
                      <div className="nm-block"><div className="nm-block-h nm-leaf">{tr(lang, "contactsH")}</div>
                        <div className="nm-res">{findResult.contacts.map((r, i) => (
                          <div className="nm-res-item" key={i}>
                            <div className="nm-res-top"><span className="nm-res-name">{r.name}</span>{r.contact && <ContactLink value={r.contact} className="nm-res-contact" />}</div>
                            {r.note && <span className="nm-res-note">{r.note}</span>}
                          </div>))}
                        </div></div>
                    )}
                  </div>
                )}
              </section>
            )}
          </div>
        </div>

        {/* Composer (ask mode only) */}
        {mode === "ask" && (
          <div className="nm-composer-wrap">
            <div className="nm-composer-tools">
              {started && <button className="nm-tool" onClick={() => { setMessages([]); setFeedback({}); if (ttsOK) { window.speechSynthesis.cancel(); setSpeakingId(null); } }}>{tr(lang, "newChat")}</button>}
              {started && <button className="nm-tool" onClick={exportChat}>↓ {tr(lang, "save")}</button>}
            </div>
            <input type="file" ref={fileInputRef} style={{ display: "none" }} accept="image/jpeg,image/png,application/pdf" onChange={handleFileSelect} capture="environment" />
            {attachment && (
              <div className="nm-attachment-preview">
                <button className="nm-attachment-clear" onClick={() => { setAttachment(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>✕</button>
                {attachment.type === 'image' ? (
                  <img src={attachment.previewUrl} alt="Preview" />
                ) : (
                  <div className="nm-attachment-pdf">📄 {attachment.name}</div>
                )}
              </div>
            )}
            <div className="nm-composer">
              <textarea ref={taRef} className="nm-input" placeholder={tr(lang, "placeholder")}
                value={input} onChange={autoGrow} onKeyDown={onKey} rows={1} dir={rtl ? "rtl" : "ltr"} />
              
              <button className="nm-mic" onClick={() => fileInputRef.current?.click()} aria-label="Attach document or photo">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>

              {voiceOK && (
                <button className={"nm-mic" + (listening ? " nm-mic-on" : "")} onClick={startVoice} aria-label="Voice input">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 15a3 3 0 003-3V6a3 3 0 10-6 0v6a3 3 0 003 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M18 11a6 6 0 01-12 0M12 18v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
              )}
              <button className="nm-send" onClick={() => send()} disabled={loading || (!input.trim() && !attachment)} aria-label="Send">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
            {ttsVoiceMissing && <div className="nm-tts-notice">{tr(lang, "ttsVoiceMissing")}</div>}
            <div className="nm-disclaimer">{tr(lang, "disclaimer")}</div>
          </div>
        )}
      </main>
    </div>
  );
}

function GuidanceCard({ payload, id, onSuggest, loading, lang, onCopy, ttsOK, speakingId, onSpeak, feedbackValue, onFeedback }) {
  const { reply, urgent, needs_lawyer, rights, steps, resources, suggestions } = payload || {};
  const plain = useMemo(() => {
    let s = (reply || "") + "\n";
    if (rights?.length) s += "\nYOUR RIGHTS\n" + rights.map((r) => `• ${r.title} (${r.reference}): ${r.detail}`).join("\n");
    if (steps?.length) s += "\n\nSTEPS\n" + steps.map((x, i) => `${i + 1}. ${x}`).join("\n");
    if (resources?.length) s += "\n\nHELP\n" + resources.map((r) => `• ${r.name} — ${r.contact} (${r.note})`).join("\n");
    return s.trim();
  }, [payload]);

  return (
    <div className={"nm-card" + (urgent ? " nm-card-urgent" : "")}>
      {urgent && (
        <div className="nm-crisis">
          <div className="nm-crisis-head">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 3l10 18H2L12 3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/>
              <path d="M12 10v4M12 17h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
            <span>{tr(lang, "urgentH")}</span>
          </div>
          <div className="nm-crisis-btns">
            <a href="tel:112" className="nm-crisis-btn nm-crisis-btn-primary">{tr(lang, "call112")}</a>
            <a href="tel:15100" className="nm-crisis-btn">{tr(lang, "call15100")}</a>
          </div>
        </div>
      )}
      {needs_lawyer && !urgent && (
        <div className="nm-crisis" style={{ background: 'linear-gradient(135deg, #16233F, #2A3B5C)' }}>
          <div className="nm-crisis-head">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/>
            </svg>
            <span>Needs Professional Counsel</span>
          </div>
          <div style={{ fontSize: '13.5px', marginTop: '6px', lineHeight: '1.5', paddingBottom: '10px' }}>
            This situation is complex. We strongly recommend speaking to a qualified advocate rather than acting on general guidance alone. Free legal aid is available.
          </div>
          <div className="nm-crisis-btns">
            <a href="tel:15100" className="nm-crisis-btn nm-crisis-btn-primary">Call NALSA (15100)</a>
          </div>
        </div>
      )}
      {reply && <p className="nm-reply">{reply}</p>}

      {rights?.length > 0 && (
        <div className="nm-block">
          <div className="nm-block-h">{tr(lang, "rightsH")}</div>
          <div className="nm-rights">
            {rights.map((r, i) => (
              <div className="nm-right" key={i}>
                <div className="nm-right-top">
                  <span className="nm-right-title">{r.title}</span>
                  {r.reference && <span className="nm-ref">{r.reference}</span>}
                </div>
                {r.detail && <p className="nm-right-detail">{r.detail}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {steps?.length > 0 && (
        <div className="nm-block">
          <div className="nm-block-h">{tr(lang, "stepsH")}</div>
          <ol className="nm-steps">
            {steps.map((s, i) => (<li key={i}><span className="nm-step-n">{i + 1}</span><span>{s}</span></li>))}
          </ol>
        </div>
      )}

      {resources?.length > 0 && (
        <div className="nm-block">
          <div className="nm-block-h nm-leaf">{tr(lang, "resH")}</div>
          <div className="nm-res">
            {resources.map((r, i) => (
              <div className="nm-res-item" key={i}>
                <div className="nm-res-top"><span className="nm-res-name">{r.name}</span>{r.contact && <ContactLink value={r.contact} className="nm-res-contact" />}</div>
                {r.note && <span className="nm-res-note">{r.note}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="nm-card-foot">
        {suggestions?.length > 0 && (
          <div className="nm-suggests">
            {suggestions.map((s, i) => (
              <button key={i} className="nm-suggest" onClick={() => onSuggest(s)} disabled={loading}>{s}</button>
            ))}
          </div>
        )}
        <div className="nm-card-actions">
          <div className="nm-feedback">
            <button className={"nm-fb" + (feedbackValue === "up" ? " nm-fb-up-on" : "")}
              onClick={() => onFeedback(id, "up")} aria-label="Helpful">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M7 11v9H4a1 1 0 01-1-1v-7a1 1 0 011-1h3zm0 0l4.5-8a2 2 0 013.8 1.2L14.5 9H19a2 2 0 012 2.3l-1.3 7A2 2 0 0117.7 20H10a3 3 0 01-3-3v-6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>
            </button>
            <button className={"nm-fb" + (feedbackValue === "down" ? " nm-fb-down-on" : "")}
              onClick={() => onFeedback(id, "down")} aria-label="Not helpful">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ transform: "rotate(180deg)" }}><path d="M7 11v9H4a1 1 0 01-1-1v-7a1 1 0 011-1h3zm0 0l4.5-8a2 2 0 013.8 1.2L14.5 9H19a2 2 0 012 2.3l-1.3 7A2 2 0 0117.7 20H10a3 3 0 01-3-3v-6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>
            </button>
          </div>
          {ttsOK && plain && (
            <button className={"nm-speak" + (speakingId === id ? " nm-speak-on" : "")}
              onClick={() => onSpeak(id, plain)} aria-label={speakingId === id ? "Stop reading" : "Listen"}>
              {speakingId === id ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/></svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 010 7M19 6a8 8 0 010 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
              )}
            </button>
          )}
          <button className="nm-copy" onClick={() => onCopy(plain)} aria-label="Copy guidance">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M5 15V5a2 2 0 012-2h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,400&family=Inter:wght@400;500;600;700&family=Noto+Serif+Devanagari:wght@400;600&family=Noto+Sans+Tamil:wght@400;600&display=swap');

.nm-root *{ box-sizing:border-box; }
.nm-root{
  --ink:#16233F; --ink-2:#223255; --gold:#A87C2A; --gold-lit:#CBA24B; --gold-deep:#7E5C14;
  --gold-line:rgba(168,124,42,.32); --leaf:#37634E; --paper:#F5EFE2; --paper-2:#FCF8EF;
  --card:#FFFDF8; --edge:#E5DAC1; --text:#2B2A26; --muted:#756A54; --urgent:#96271F;
  position:relative; display:flex; height:100vh; width:100%; overflow:hidden;
  font-family:'Inter','Noto Sans Tamil','Noto Serif Devanagari',system-ui,sans-serif; color:var(--text);
  background:
    radial-gradient(1100px 560px at 82% -12%, #FCF7EC 0%, transparent 58%),
    radial-gradient(900px 500px at 5% 110%, #F1E9D6 0%, transparent 55%),
    var(--paper);
}
.nm-rtl{ direction:rtl; }
.nm-grain{ position:absolute; inset:0; pointer-events:none; z-index:0; opacity:.4; mix-blend-mode:multiply;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E"); }
.nm-root button{ font-family:inherit; cursor:pointer; }
.nm-root button:disabled{ cursor:default; opacity:.5; }
.nm-root :focus-visible{ outline:2px solid var(--gold); outline-offset:2px; border-radius:6px; }
.nm-side,.nm-main{ position:relative; z-index:1; }

/* Chakra */
.nm-chakra{ display:inline-block; line-height:0; }
.nm-chakra-spin svg{ animation:nm-spin 3.4s linear infinite; transform-origin:50% 50%; }
@keyframes nm-spin{ to{ transform:rotate(360deg); } }

/* Ornament */
.nm-ornament{ display:flex; align-items:center; gap:12px; color:var(--gold); margin:14px 0; }
.nm-orn-line{ height:1px; width:46px; background:linear-gradient(90deg,transparent,var(--gold-line),var(--gold)); }
.nm-ornament svg:last-child+.nm-orn-line,.nm-ornament .nm-orn-line:last-child{ background:linear-gradient(270deg,transparent,var(--gold-line),var(--gold)); }

/* Sidebar */
.nm-side{ width:290px; flex-shrink:0; background:linear-gradient(180deg,#16233F,#121B31);
  color:#EDE7D6; display:flex; flex-direction:column; padding:22px 18px; border-right:1px solid rgba(0,0,0,.25); }
.nm-brand{ display:flex; align-items:center; gap:12px; padding-bottom:20px;
  border-bottom:1px solid rgba(203,162,75,.28); margin-bottom:20px; }
.nm-logo{ color:var(--gold-lit); filter:drop-shadow(0 0 6px rgba(203,162,75,.25)); }
.nm-brand-name{ font-family:'Fraunces',serif; font-weight:600; font-size:22px; color:#FBF6E9; letter-spacing:.2px; }
.nm-brand-sub{ font-size:11px; color:#B6AC90; letter-spacing:.3px; margin-top:2px; }
.nm-side-label{ font-size:11px; text-transform:uppercase; letter-spacing:1.5px; color:var(--gold-lit); margin-bottom:11px; font-weight:600; }
.nm-topics{ display:flex; flex-direction:column; gap:7px; overflow-y:auto; flex:1; margin:0 -4px; padding:0 4px 4px; }
.nm-topic{ text-align:left; background:rgba(255,255,255,.03); border:1px solid rgba(237,231,214,.10);
  border-radius:10px; padding:10px 13px; color:#EDE7D6; transition:all .16s ease; display:flex; flex-direction:column; gap:2px; }
.nm-topic:hover:not(:disabled){ background:rgba(203,162,75,.14); border-color:var(--gold-line); transform:translateX(3px); }
.nm-topic-active{ background:rgba(203,162,75,.18); border-color:var(--gold-lit); }
.nm-topic-label{ font-weight:600; font-size:13.5px; }
.nm-topic-hint{ font-size:11.5px; color:#A69C82; line-height:1.35; }
.nm-side-note{ flex:1; color:#CFC6AE; }
.nm-side-note p{ font-size:13px; line-height:1.6; }
.nm-side-foot{ margin-top:18px; padding-top:16px; border-top:1px solid rgba(203,162,75,.28); }
.nm-memory{ display:flex; align-items:center; justify-content:space-between; gap:8px; margin-top:14px;
  padding-top:12px; border-top:1px solid rgba(255,255,255,.08); font-size:11px; color:#9B927A; line-height:1.4; }
.nm-memory button{ flex-shrink:0; background:transparent; border:none; color:#C9A24A; font-size:11px; font-weight:600;
  text-decoration:underline; text-underline-offset:2px; padding:2px 4px; }
.nm-memory button:hover{ color:#FBF6E9; }
.nm-helplines{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:6px; }
.nm-helplines li{ display:flex; justify-content:space-between; align-items:baseline; font-size:12.5px; color:#CFC6AE; }
.nm-helplines b{ color:#FBF6E9; font-variant-numeric:tabular-nums; letter-spacing:.5px; }
.nm-tel-side{ color:#FBF6E9; font-variant-numeric:tabular-nums; letter-spacing:.5px; font-weight:700; text-decoration:none; border-bottom:1px dashed rgba(251,246,233,.35); transition:opacity .15s ease; }
.nm-tel-side:hover{ opacity:.75; }

/* Main */
.nm-main{ flex:1; display:flex; flex-direction:column; min-width:0; }
.nm-head{ display:flex; justify-content:space-between; align-items:center; gap:14px; padding:13px 24px;
  border-bottom:1px solid var(--edge); background:rgba(252,248,239,.78); backdrop-filter:blur(8px); flex-wrap:wrap; }
.nm-head-left{ display:flex; align-items:center; gap:10px; }
.nm-hamburger{ display:none; background:transparent; border:none; color:var(--ink); padding:6px; border-radius:8px; flex-shrink:0; }
.nm-hamburger:hover{ background:var(--paper-2); }
.nm-side-close{ display:none; }
.nm-backdrop{ position:fixed; inset:0; background:rgba(15,20,35,.5); z-index:40; animation:nm-fade .2s ease; }
.nm-head-chakra{ color:var(--gold); }
.nm-head-title{ font-family:'Fraunces',serif; font-weight:600; font-size:17px; color:var(--ink); }
.nm-head-right{ display:flex; align-items:center; gap:12px; }
.nm-modes{ display:flex; background:var(--paper-2); border:1px solid var(--edge); border-radius:10px; padding:3px; }
.nm-mode{ border:none; background:transparent; padding:7px 13px; font-size:12.5px; font-weight:600; color:var(--muted); border-radius:7px; transition:all .15s ease; white-space:nowrap; }
.nm-mode:hover{ color:var(--ink); }
.nm-mode-on{ background:var(--ink); color:#F3EEDF; box-shadow:0 1px 6px rgba(22,35,63,.25); }
.nm-lang{ font-family:inherit; font-size:13px; font-weight:600; color:var(--ink); background:var(--paper-2);
  border:1px solid var(--edge); border-radius:9px; padding:8px 10px; cursor:pointer; }

.nm-scroll{ flex:1; overflow-y:auto; }
.nm-thread{ max-width:770px; margin:0 auto; padding:30px 26px 24px; }

/* Hero */
.nm-hero{ padding:22px 0 8px; }
.nm-preamble{ font-family:'Fraunces',serif; font-style:italic; font-size:17px; color:var(--gold); letter-spacing:.3px; margin-bottom:8px; }
.nm-hero-h{ font-family:'Fraunces',serif; font-weight:600; font-size:40px; line-height:1.1; color:var(--ink); margin:0; letter-spacing:-.5px; }
.nm-hero-p{ font-size:15.5px; line-height:1.68; color:#4A4636; max-width:580px; margin:2px 0 22px; }
.nm-hero-topics{ display:flex; flex-wrap:wrap; gap:9px; }
.nm-chip{ background:var(--paper-2); border:1px solid var(--edge); border-radius:999px; padding:9px 17px;
  font-size:13.5px; font-weight:500; color:var(--ink-2); transition:all .16s ease; }
.nm-chip:hover:not(:disabled){ border-color:var(--gold); background:#fff; color:var(--ink); box-shadow:0 3px 12px rgba(168,124,42,.14); transform:translateY(-1px); }
.nm-r1{ animation:nm-rise .5s .02s both; } .nm-r2{ animation:nm-rise .5s .12s both; }
.nm-r3{ animation:nm-rise .5s .22s both; } .nm-r4{ animation:nm-rise .5s .32s both; }
@keyframes nm-rise{ from{ opacity:0; transform:translateY(12px); } to{ opacity:1; transform:none; } }

/* Rows */
.nm-row{ margin-bottom:22px; animation:nm-fade .4s ease; }
@keyframes nm-fade{ from{ opacity:0; transform:translateY(8px); } to{ opacity:1; transform:none; } }
.nm-row-user{ display:flex; justify-content:flex-end; }
.nm-user-bubble{ background:linear-gradient(135deg,#1B2A48,#16233F); color:#F3EEDF; padding:12px 16px;
  border-radius:16px 16px 4px 16px; max-width:78%; font-size:14.5px; line-height:1.55; box-shadow:0 3px 14px rgba(22,35,63,.18); }
.nm-rtl .nm-user-bubble{ border-radius:16px 16px 16px 4px; }
.nm-row-bot{ display:flex; gap:12px; align-items:flex-start; }
.nm-bot-mark{ flex-shrink:0; width:34px; height:34px; border-radius:50%; background:var(--paper-2);
  border:1px solid var(--gold-line); display:flex; align-items:center; justify-content:center; color:var(--gold); margin-top:2px; }
.nm-thinking-mark{ color:var(--gold-lit); }

/* Card */
.nm-card{ background:var(--card); border:1px solid var(--edge); border-radius:4px 16px 16px 16px;
  padding:18px 20px; max-width:calc(100% - 46px); box-shadow:0 4px 20px rgba(22,35,63,.07); position:relative; }
.nm-rtl .nm-card{ border-radius:16px 4px 16px 16px; }
.nm-card::before{ content:""; position:absolute; left:0; top:14px; bottom:14px; width:3px;
  background:linear-gradient(var(--gold-lit),var(--gold)); border-radius:2px; }
.nm-rtl .nm-card::before{ left:auto; right:0; }
.nm-card-urgent{ border-color:rgba(150,39,31,.4); }
.nm-card-urgent::before{ background:linear-gradient(#B4443A,var(--urgent)); }
.nm-crisis{ background:linear-gradient(135deg,#B4443A,var(--urgent)); color:#FFF6F0; border-radius:12px;
  padding:15px 17px; margin-bottom:16px; box-shadow:0 6px 20px rgba(150,39,31,.30); }
.nm-crisis-head{ display:flex; align-items:center; gap:9px; font-weight:700; font-size:14.5px; margin-bottom:12px; letter-spacing:.2px; }
.nm-crisis-head svg{ flex-shrink:0; }
.nm-crisis-btns{ display:flex; gap:8px; flex-wrap:wrap; }
.nm-crisis-btn{ display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,.16);
  border:1px solid rgba(255,255,255,.45); color:#FFF; text-decoration:none; font-weight:700; font-size:13.5px;
  padding:9px 17px; border-radius:999px; transition:all .15s ease; }
.nm-crisis-btn:hover{ background:rgba(255,255,255,.28); transform:translateY(-1px); }
.nm-crisis-btn-primary{ background:#FFF; color:var(--urgent); border-color:#FFF; }
.nm-crisis-btn-primary:hover{ background:#FFF6F0; }
.nm-reply{ margin:0; font-size:15px; line-height:1.64; color:#33352E; }
.nm-block{ margin-top:16px; padding-top:15px; border-top:1px solid var(--gold-line); }
.nm-block-h{ font-family:'Fraunces',serif; font-weight:600; font-size:12.5px; text-transform:uppercase; letter-spacing:1.3px; color:var(--gold); margin-bottom:11px; }
.nm-block-h.nm-leaf{ color:var(--leaf); }

.nm-rights{ display:flex; flex-direction:column; gap:11px; }
.nm-right-top{ display:flex; align-items:center; gap:9px; flex-wrap:wrap; margin-bottom:3px; }
.nm-right-title{ font-weight:600; font-size:14px; color:var(--ink); }
.nm-ref{ font-size:11px; font-weight:600; color:var(--gold-deep); background:rgba(168,124,42,.10);
  border:1px solid var(--gold-line); padding:2px 8px; border-radius:5px; letter-spacing:.2px; }
.nm-right-detail{ margin:0; font-size:13.5px; line-height:1.56; color:#565244; }

.nm-steps{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:10px; }
.nm-steps li{ display:flex; gap:11px; font-size:14px; line-height:1.5; color:#3B382E; align-items:flex-start; }
.nm-step-n{ flex-shrink:0; width:22px; height:22px; border-radius:50%; background:var(--ink); color:#F3EEDF;
  font-size:12px; font-weight:600; display:flex; align-items:center; justify-content:center; margin-top:1px; }

.nm-res{ display:flex; flex-direction:column; gap:8px; }
.nm-res-item{ background:var(--paper-2); border:1px solid var(--edge); border-left:3px solid var(--leaf); border-radius:9px; padding:9px 12px; }
.nm-res-top{ display:flex; align-items:baseline; gap:10px; flex-wrap:wrap; }
.nm-res-name{ font-weight:600; font-size:13.5px; color:var(--ink); }
.nm-res-contact{ font-size:13px; font-weight:700; color:var(--leaf); font-variant-numeric:tabular-nums; letter-spacing:.3px; }
a.nm-res-contact.nm-tel{ text-decoration:none; border-bottom:1px dashed rgba(55,99,78,.4); transition:opacity .15s ease; }
a.nm-res-contact.nm-tel:hover{ opacity:.75; }
.nm-res-note{ display:block; font-size:12.5px; color:var(--muted); margin-top:2px; }

.nm-card-foot{ display:flex; align-items:flex-end; justify-content:space-between; gap:10px; margin-top:16px; }
.nm-suggests{ display:flex; flex-wrap:wrap; gap:8px; }
.nm-suggest{ background:transparent; border:1px dashed var(--gold-line); border-radius:999px; padding:7px 13px; font-size:12.5px; color:var(--ink-2); transition:all .15s ease; }
.nm-suggest:hover:not(:disabled){ border-style:solid; border-color:var(--gold); background:#fff; }
.nm-card-actions{ display:flex; align-items:center; gap:4px; flex-shrink:0; }
.nm-copy{ flex-shrink:0; background:transparent; border:none; color:var(--muted); padding:6px; border-radius:7px; transition:all .15s ease; }
.nm-copy:hover{ color:var(--gold); background:var(--paper-2); }
.nm-speak{ flex-shrink:0; background:transparent; border:none; color:var(--muted); padding:6px; border-radius:7px; transition:all .15s ease; }
.nm-speak:hover{ color:var(--leaf); background:var(--paper-2); }
.nm-speak-on{ color:var(--leaf); background:rgba(55,99,78,.10); animation:nm-speak-pulse 1.6s ease infinite; }
@keyframes nm-speak-pulse{ 0%,100%{ opacity:1; } 50%{ opacity:.55; } }
.nm-feedback{ display:flex; align-items:center; gap:2px; padding-right:6px; margin-right:2px; border-right:1px solid var(--edge); }
.nm-fb{ flex-shrink:0; background:transparent; border:none; color:var(--muted); padding:6px; border-radius:7px; transition:all .15s ease; }
.nm-fb:hover{ color:var(--ink); background:var(--paper-2); }
.nm-fb-up-on{ color:var(--gold); background:rgba(168,124,42,.12); }
.nm-fb-down-on{ color:var(--urgent); background:rgba(150,39,31,.10); }

.nm-thinking{ align-self:center; font-size:14px; color:var(--muted); font-style:italic; font-family:'Fraunces',serif; padding-top:6px; }

/* Panels (draft + find) */
.nm-panel{ animation:nm-fade .4s ease; }
.nm-panel-head{ margin-bottom:16px; }
.nm-panel-h{ font-family:'Fraunces',serif; font-weight:600; font-size:26px; color:var(--ink); margin:0 0 4px; }
.nm-panel-sub{ font-size:14px; color:var(--muted); margin:0; line-height:1.5; }
.nm-bigfield{ width:100%; border:1px solid var(--edge); border-radius:14px; background:var(--card); padding:14px 16px;
  font-family:inherit; font-size:14.5px; line-height:1.6; color:var(--text); resize:vertical; min-height:130px; outline:none; transition:border-color .15s ease; white-space:pre-wrap; }
.nm-bigfield::placeholder{ color:#A69C86; }
.nm-bigfield:focus{ border-color:var(--gold); box-shadow:0 2px 16px rgba(168,124,42,.12); }
.nm-primary{ margin-top:14px; background:linear-gradient(135deg,#1B2A48,#16233F); color:#F6F1E3; border:none;
  padding:13px 26px; border-radius:12px; font-size:14.5px; font-weight:600; box-shadow:0 4px 16px rgba(22,35,63,.22); transition:all .16s ease; }
.nm-primary:hover:not(:disabled){ transform:translateY(-1px); box-shadow:0 6px 22px rgba(22,35,63,.28); }
.nm-nearme-wrap{ margin-bottom:16px; }
.nm-nearme-btns{ display:flex; gap:10px; flex-wrap:wrap; }
.nm-nearme{ background:linear-gradient(135deg,var(--gold-lit),var(--gold)); color:#1A1508; border:none;
  padding:12px 22px; border-radius:12px; font-size:14px; font-weight:700; box-shadow:0 4px 16px rgba(168,124,42,.28); transition:all .16s ease; }
.nm-nearme:hover:not(:disabled){ transform:translateY(-1px); box-shadow:0 6px 22px rgba(168,124,42,.35); }
.nm-nearme-police{ background:linear-gradient(135deg,#3A5A82,var(--ink)); color:#F3EEDF; box-shadow:0 4px 16px rgba(22,35,63,.24); }
.nm-nearme-police:hover:not(:disabled){ box-shadow:0 6px 22px rgba(22,35,63,.3); }
.nm-nearme-error{ display:block; margin-top:8px; font-size:12.5px; color:var(--muted); }
.nm-panel-loading{ display:flex; align-items:center; gap:12px; color:var(--gold); margin-top:26px; font-family:'Fraunces',serif; font-style:italic; font-size:15px; }
.nm-panel-loading span{ color:var(--muted); }

/* Draft output — "paper" */
.nm-draft-out{ margin-top:26px; animation:nm-fade .4s ease; }
.nm-draft-bar{ display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
.nm-draft-label{ font-family:'Fraunces',serif; font-weight:600; font-size:13px; text-transform:uppercase; letter-spacing:1.3px; color:var(--gold); }
.nm-draft-actions{ display:flex; gap:8px; }
.nm-mini{ background:var(--paper-2); border:1px solid var(--edge); color:var(--ink-2); font-size:12.5px; font-weight:600; padding:6px 13px; border-radius:8px; transition:all .15s ease; }
.nm-mini:hover{ border-color:var(--gold); color:var(--ink); }
.nm-paper{ position:relative; background:
    repeating-linear-gradient(transparent, transparent 30px, rgba(168,124,42,.05) 31px),
    var(--card); border:1px solid var(--edge); border-radius:6px; padding:26px 28px; box-shadow:0 6px 26px rgba(22,35,63,.09); }
.nm-corner{ position:absolute; width:16px; height:16px; border:1.5px solid var(--gold-line); }
.nm-c1{ top:8px; left:8px; border-right:none; border-bottom:none; }
.nm-c2{ top:8px; right:8px; border-left:none; border-bottom:none; }
.nm-c3{ bottom:8px; left:8px; border-right:none; border-top:none; }
.nm-c4{ bottom:8px; right:8px; border-left:none; border-top:none; }
.nm-doc{ margin:0; font-family:'Fraunces',Georgia,serif; font-size:14px; line-height:1.75; color:#2E2C26; white-space:pre-wrap; word-wrap:break-word; }
.nm-callout{ margin-top:14px; background:rgba(150,39,31,.05); border:1px solid rgba(150,39,31,.2); border-radius:10px; padding:12px 14px; }
.nm-callout-line{ font-size:13px; color:var(--urgent); font-weight:500; line-height:1.5; }
.nm-tips{ margin:0; padding-left:18px; display:flex; flex-direction:column; gap:6px; }
.nm-tips li{ font-size:13.5px; line-height:1.55; color:#4A463A; }

/* Find */
.nm-find-fields{ display:flex; gap:12px; flex-wrap:wrap; }
.nm-field{ flex:1; min-width:180px; display:flex; flex-direction:column; gap:6px; }
.nm-field span{ font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:.8px; color:var(--muted); }
.nm-field input,.nm-field select{ border:1px solid var(--edge); border-radius:11px; background:var(--card); padding:12px 14px; font-family:inherit; font-size:14.5px; color:var(--text); outline:none; transition:border-color .15s ease; }
.nm-field input:focus,.nm-field select:focus{ border-color:var(--gold); box-shadow:0 2px 14px rgba(168,124,42,.1); }
.nm-combo{ position:relative; }
.nm-combo-input{ width:100%; border:1px solid var(--edge); border-radius:11px; background:var(--card); padding:12px 14px;
  font-family:inherit; font-size:14.5px; color:var(--text); outline:none; transition:border-color .15s ease; }
.nm-combo-input:focus{ border-color:var(--gold); box-shadow:0 2px 14px rgba(168,124,42,.1); }
.nm-combo-list{ position:absolute; top:calc(100% + 6px); left:0; right:0; z-index:20; max-height:240px; overflow-y:auto;
  background:var(--card); border:1px solid var(--edge); border-radius:11px; box-shadow:0 8px 26px rgba(22,35,63,.14); padding:5px; }
.nm-combo-opt{ padding:9px 12px; border-radius:8px; font-size:14px; color:var(--text); cursor:pointer; transition:background .1s ease; }
.nm-combo-opt-hi{ background:var(--paper-2); }
.nm-combo-opt-sel{ font-weight:700; color:var(--gold-deep); }
.nm-combo-empty{ padding:10px 12px; font-size:13px; color:var(--muted); font-style:italic; }
.nm-combo-list::-webkit-scrollbar{ width:8px; }
.nm-combo-list::-webkit-scrollbar-thumb{ background:var(--edge); border-radius:8px; }
.nm-find-static{ margin-bottom:16px; }
.nm-honesty-note{ display:flex; align-items:flex-start; gap:8px; margin-top:14px; padding-top:12px;
  border-top:1px dashed var(--gold-line); font-size:12px; line-height:1.55; color:var(--muted); }
.nm-honesty-note svg{ flex-shrink:0; margin-top:1px; color:var(--gold); }
.nm-guided-fields{ display:flex; flex-direction:column; gap:12px; margin-bottom:4px; }
.nm-guided-row{ display:flex; gap:12px; flex-wrap:wrap; }
.nm-field-amount{ max-width:200px; }
.nm-find-out{ margin-top:26px; animation:nm-fade .4s ease; }
.nm-find-intro{ font-size:15.5px; line-height:1.65; color:#3A382E; font-family:'Fraunces',serif; margin:0 0 18px; }
.nm-find-card{ background:var(--card); border:1px solid var(--edge); border-left:3px solid var(--leaf); border-radius:10px; padding:16px 18px; margin-bottom:16px; }
.nm-find-card p{ margin:0; font-size:14px; line-height:1.62; color:#3B382E; }
.nm-find-grid{ display:grid; grid-template-columns:1fr 1fr; gap:18px; }

/* Composer */
.nm-composer-wrap{ border-top:1px solid var(--edge); background:rgba(252,248,239,.9); backdrop-filter:blur(8px); padding:10px 26px 12px; }
.nm-composer-tools{ max-width:770px; margin:0 auto 8px; display:flex; gap:8px; }
.nm-tool{ background:var(--paper-2); border:1px solid var(--edge); color:var(--muted); font-size:12px; font-weight:600; padding:5px 12px; border-radius:8px; transition:all .15s ease; }
.nm-tool:hover{ border-color:var(--gold); color:var(--ink); }
.nm-composer{ max-width:770px; margin:0 auto; display:flex; align-items:flex-end; gap:8px; background:#fff;
  border:1px solid var(--edge); border-radius:16px; padding:8px 8px 8px 16px; box-shadow:0 3px 16px rgba(22,35,63,.07); transition:all .15s ease; }
.nm-composer:focus-within{ border-color:var(--gold); box-shadow:0 3px 20px rgba(168,124,42,.15); }
.nm-input{ flex:1; border:none; outline:none; resize:none; font-size:14.5px; line-height:1.5; font-family:inherit; color:var(--text); background:transparent; max-height:160px; padding:6px 0; }
.nm-input::placeholder{ color:#A69C86; }
.nm-attachment-preview{ position:relative; background:#fff; border:1px solid var(--edge); border-radius:12px; padding:8px; margin-bottom:8px; display:inline-block; max-width:100%; box-shadow:0 2px 8px rgba(0,0,0,0.05); }
.nm-attachment-preview img{ max-height:120px; max-width:100%; border-radius:6px; object-fit:contain; }
.nm-attachment-pdf{ font-size:13px; font-weight:600; color:var(--ink); padding:10px 16px; display:flex; align-items:center; gap:8px; }
.nm-attachment-clear{ position:absolute; top:-8px; right:-8px; background:var(--urgent); color:#fff; border:none; width:24px; height:24px; border-radius:12px; font-size:12px; font-weight:bold; cursor:pointer; box-shadow:0 2px 4px rgba(0,0,0,0.2); }
.nm-attachment-clear:hover{ transform:scale(1.1); }
.nm-mic{ flex-shrink:0; width:40px; height:40px; border:1px solid var(--edge); border-radius:12px; background:var(--paper-2); color:var(--muted); display:flex; align-items:center; justify-content:center; transition:all .15s ease; }
.nm-mic:hover{ color:var(--gold); border-color:var(--gold); }
.nm-mic-on{ background:var(--urgent); color:#fff; border-color:var(--urgent); animation:nm-pulse 1.2s ease infinite; }
@keyframes nm-pulse{ 0%,100%{ box-shadow:0 0 0 0 rgba(150,39,31,.4); } 50%{ box-shadow:0 0 0 6px rgba(150,39,31,0); } }
.nm-send{ flex-shrink:0; width:40px; height:40px; border:none; border-radius:12px; background:var(--ink); color:#F3EEDF; display:flex; align-items:center; justify-content:center; transition:background .15s ease; }
.nm-send:hover:not(:disabled){ background:var(--gold); }
.nm-rtl .nm-send svg{ transform:scaleX(-1); }
.nm-disclaimer{ max-width:770px; margin:9px auto 0; font-size:11.5px; line-height:1.5; color:var(--muted); text-align:center; }
.nm-tts-notice{ max-width:770px; margin:9px auto 0; font-size:11.5px; line-height:1.5; color:var(--gold-deep);
  text-align:center; background:rgba(168,124,42,.08); border:1px solid var(--gold-line); border-radius:8px; padding:6px 12px; }

.nm-scroll::-webkit-scrollbar,.nm-topics::-webkit-scrollbar{ width:8px; }
.nm-scroll::-webkit-scrollbar-thumb{ background:var(--edge); border-radius:8px; }
.nm-topics::-webkit-scrollbar-thumb{ background:rgba(203,162,75,.25); border-radius:8px; }

@media (max-width:860px){
  .nm-side{ position:fixed; top:0; left:0; height:100vh; width:min(300px,84vw); z-index:50;
    transform:translateX(-100%); transition:transform .25s ease; box-shadow:0 0 40px rgba(0,0,0,.35); }
  .nm-side-open{ transform:translateX(0); }
  .nm-hamburger{ display:flex; align-items:center; justify-content:center; }
  .nm-side-close{ display:flex; align-items:center; justify-content:center; position:absolute; top:16px; right:16px;
    background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); color:#EDE7D6; padding:7px; border-radius:8px; }
  .nm-side-close:hover{ background:rgba(255,255,255,.12); }
  .nm-head{ padding:11px 16px; }
  .nm-head-title{ display:none; }
  .nm-modes{ flex:1; }
  .nm-mode{ flex:1; padding:7px 8px; }
  .nm-hero-h{ font-size:30px; }
  .nm-thread{ padding:22px 16px 16px; }
  .nm-composer-wrap{ padding-left:16px; padding-right:16px; }
  .nm-card{ max-width:100%; }
  .nm-find-grid{ grid-template-columns:1fr; }
  .nm-card-foot{ flex-wrap:wrap; }
  .nm-crisis-btns{ width:100%; }
  .nm-crisis-btn{ flex:1; justify-content:center; }
}
@media (prefers-reduced-motion:reduce){
  .nm-chakra-spin svg{ animation-duration:6s; }
  .nm-row,.nm-hero,.nm-panel,.nm-r1,.nm-r2,.nm-r3,.nm-r4,.nm-draft-out,.nm-find-out{ animation:none; }
  .nm-mic-on{ animation:none; }
  .nm-speak-on{ animation:none; }
}
`;
