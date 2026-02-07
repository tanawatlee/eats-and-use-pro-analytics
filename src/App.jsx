import React, { useState, useMemo, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, initializeFirestore, collection, doc, setDoc, addDoc, onSnapshot, query, getDoc, updateDoc, deleteDoc,
  orderBy, limit, where 
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  ShoppingCart, Package, Users, FileSpreadsheet, 
  Plus, Search, Edit2, Trash2, ChevronRight, ChevronLeft,
  Download, X, Box, Store, Truck, CreditCard, Leaf, 
  UserCheck, ArrowLeft, ClipboardList, Eye, CloudCog, 
  ToggleLeft, ToggleRight, AlertTriangle, Loader2,
  BadgePercent, Landmark, Container, Activity, Globe,
  TrendingUp, TrendingDown, Target, Award, ShoppingBag,
  Zap, Calendar, BarChart3, PieChart, Users2, LayoutGrid, Receipt,
  Calculator, Tag, ShieldCheck, Info, Percent, Hash, Printer, FileText,
  MoreVertical, CheckCircle2, Building2, FileCheck, Copy,
  ImagePlus, Wand2, ScanBarcode, UploadCloud, Settings,
  Phone, Mail, MapPin, User, MessageCircle, Smartphone, Filter,
  FileDown, CalendarRange, Brain, Sparkles, Bot, MessageSquare,
  Lightbulb, Rocket, Key, Save
} from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyAhVwzAENOTpyNTohAJMJMIXo_yTuANdlo",
  authDomain: "eats-and-use-pro-analytics-pos.firebaseapp.com",
  projectId: "eats-and-use-pro-analytics-pos",
  storageBucket: "eats-and-use-pro-analytics-pos.firebasestorage.app",
  messagingSenderId: "832797285616",
  appId: "1:832797285616:web:91013603d7c8891518f635",
  measurementId: "G-NN4T32GXZL"
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, { experimentalForceLongPolling: true });
const auth = getAuth(app);

// --- Helpers ---
const getThaiDate = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });

const safeDate = (val) => {
  if (!val) return '-';
  try {
    if (typeof val === 'object' && val && typeof val.toDate === 'function') {
      return val.toDate().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
    }
    if (val instanceof Date) {
        return val.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
    }
    return String(val);
  } catch (e) {
    return '-';
  }
};

const safeStr = (val) => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') return '-';
    return String(val);
};

// --- Thai Baht Text Helper ---
const ThaiBahtText = (amount) => {
  const num = parseFloat(amount);
  if (isNaN(num)) return "";
  const numStr = num.toFixed(2);
  const [baht, satang] = numStr.split('.');
  
  const textNum = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
  const textUnit = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];
  
  const read = (n) => {
    let res = "";
    const len = n.length;
    for (let i = 0; i < len; i++) {
        const d = parseInt(n[i]);
        const pos = len - 1 - i;
        if (d === 0) continue;
        if (pos % 6 === 1 && d === 2) res += "ยี่";
        else if (pos % 6 === 1 && d === 1) res += "";
        else if (pos % 6 === 0 && d === 1 && i > 0) res += "เอ็ด";
        else res += textNum[d];
        
        if (pos % 6 !== 0 || d !== 1 || len === 1) res += textUnit[pos % 6]; // Fix units
        else if (pos % 6 === 0) res += textUnit[pos % 6];

        if (pos > 0 && pos % 6 === 0) res += "ล้าน";
    }
    res = res.replace("หนึ่งสิบ", "สิบ");
    res = res.replace("สิบหนึ่ง", "สิบเอ็ด");
    if(res.endsWith("หนึ่ง") && res.length > 4) res = res.substring(0, res.length-5) + "เอ็ด"; 
    
    return res;
  }

  const readNumber = (number) => {
        const numberStr = parseFloat(number).toString();
        const length = numberStr.length;
        let text = '';
        
        for (let i = 0; i < length; i++) {
            const digit = parseInt(numberStr.charAt(i));
            const pos = length - i - 1;
            
            if (digit !== 0) {
                if (pos % 6 === 1 && digit === 1) {
                    text += '';
                } else if (pos % 6 === 1 && digit === 2) {
                    text += 'ยี่';
                } else if (pos % 6 === 0 && digit === 1 && i > 0) { 
                    text += 'เอ็ด';
                } else {
                    text += textNum[digit];
                }
                text += textUnit[pos % 6];
            }
            
            if (pos > 0 && pos % 6 === 0) {
                text += 'ล้าน';
            }
        }
        
        if(text.startsWith("เอ็ด")) text = text.replace("เอ็ด", "หนึ่ง");
        if(text === "") text = "ศูนย์";
        return text;
  };

  let text = readNumber(baht) + "บาท";
  
  if (parseInt(satang) === 0) {
      text += "ถ้วน";
  } else {
      text += readNumber(satang) + "สตางค์";
  }
  
  return text;
};

// --- Global Styles Injection ---
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+Thai:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap');
    
    * {
      font-family: 'Inter', 'Noto Sans Thai', sans-serif !important;
    }

    .font-mono-receipt {
      font-family: 'JetBrains Mono', 'Noto Sans Thai', monospace !important;
    }

    #root {
      width: 100% !important;
      max-width: none !important;
      margin: 0 !important;
      padding: 0 !important;
      height: 100dvh;
    }
    body, html {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #FDFCF8;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #D7BA9D; border-radius: 10px; }
    .glass-morphism {
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(215, 186, 157, 0.3);
    }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    
    @media print {
      @page { margin: 0; size: auto; }
      body, html { 
        height: auto !important; 
        overflow: visible !important; 
        background: white !important; 
      }
      
      body * {
        visibility: hidden;
      }
      
      .invoice-preview-container, .invoice-preview-container * {
        visibility: visible !important;
      }
      
      .invoice-preview-container {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 30px !important; 
        background-color: white !important;
        border: none !important;
        box-shadow: none !important;
        min-height: auto !important;
        z-index: 99999 !important;
        border-radius: 0 !important;
      }

      .no-print { display: none !important; }
      .print-only { display: block !important; }
      .modal-content { box-shadow: none !important; border: none !important; max-width: 100% !important; width: 100% !important; position: static !important; }
      
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  `}</style>
);

const channelConfig = {
  Offline: { brandIcon: Store, color: '#433D3C' },
  Shopee: { brandIcon: BadgePercent, color: '#EE4D2D' },
  Lazada: { brandIcon: Landmark, color: '#000083' },
  TikTok: { brandIcon: Activity, color: '#000000' },
  Line: { brandIcon: Globe, color: '#06C755' }
};

// --- Modal Component ---
const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-md" }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className={`bg-white rounded-[32px] w-full ${maxWidth} overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 text-[#433D3C] modal-content`}>
        <div className="p-6 border-b border-[#F5F0E6] flex justify-between items-center bg-[#FDFCF8] no-print">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-[#F5F0E6] rounded-full transition-colors text-[#8B8A73]"><X size={20} /></button>
        </div>
        <div className="p-8 max-h-[85vh] overflow-y-auto custom-scrollbar print:p-0 print:overflow-visible print:max-h-none">{children}</div>
      </div>
    </div>
  );
};

// --- Sidebar Component ---
const Sidebar = ({ currentView, setView, iDevMode, handleToggleMode, currentAppId, openSettings, settingsData }) => {
  const menuGroups = [
    {
      title: 'FRONT OFFICE',
      items: [
        { id: 'pos', icon: ShoppingCart, label: 'ขายสินค้า' }
      ]
    },
    {
      title: 'BACK OFFICE',
      items: [
        { id: 'inventory', icon: Package, label: 'คลังสินค้า' },
        { id: 'contacts', icon: Users, label: 'ฐานข้อมูล CRM' }
      ]
    },
    {
      title: 'FINANCE & DATA',
      items: [
        { id: 'accounting', icon: CreditCard, label: 'สมุดบัญชี' },
        { id: 'tax_report', icon: FileCheck, label: 'ภาษีซื้อ-ขาย' },
        { id: 'reports', icon: BarChart3, label: 'รายงาน & วิเคราะห์' }
      ]
    },
    {
      title: 'STRATEGY',
      items: [
        { id: 'ai_consultant', icon: Brain, label: 'ที่ปรึกษา AI อัจฉริยะ' }
      ]
    }
  ];

  const isDevMode = iDevMode;

  return (
    <aside className="w-64 bg-[#F5F0E6] flex flex-col h-full border-r border-[#D7BA9D]/30 transition-all flex-shrink-0 no-print">
      <div className="p-8 flex flex-col items-center text-center">
        <div className="w-14 h-14 bg-[#B3543D] rounded-full flex items-center justify-center text-white mb-4 shadow-lg shadow-[#B3543D]/20 overflow-hidden relative">
            {settingsData?.logo ? (
                <img src={settingsData.logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
                <Leaf size={28} />
            )}
        </div>
        <h1 className="text-xl font-extrabold text-[#433D3C] tracking-tight">{settingsData?.shopName || 'eats and use'}</h1>
        <p className="text-[11px] text-[#8B8A73] uppercase tracking-[0.2em] font-bold mt-1">Pro Analytics</p>
      </div>
      
      <nav className="flex-1 px-4 overflow-y-auto custom-scrollbar space-y-6">
        {menuGroups.map((group, idx) => (
          <div key={idx}>
            <p className="px-4 mb-2 text-[10px] font-black text-[#8B8A73]/60 uppercase tracking-widest">{group.title}</p>
            <div className="space-y-2">
              {group.items.map(item => (
                <button key={item.id} onClick={() => setView(item.id)} className={`flex items-center w-full px-5 py-3.5 space-x-3 rounded-2xl transition-all ${currentView === item.id ? 'bg-white text-[#B3543D] shadow-sm border border-[#D7BA9D]/30' : 'text-[#8B8A73] hover:bg-white/50'}`}>
                  <item.icon size={20} className={currentView === item.id ? 'text-[#B3543D]' : ''} /> <span className="font-bold text-[14px]">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-5 text-center space-y-3 mt-auto">
        <button onClick={handleToggleMode} className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all border shadow-sm ${isDevMode ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-700'}`}>
          <div className="flex flex-col text-left"><span className="text-[10px] opacity-70 uppercase tracking-wider">Mode</span><span className="text-[11px]">{isDevMode ? 'DEV-TEST' : 'PRODUCTION'}</span></div>
          {isDevMode ? <ToggleLeft size={24}/> : <ToggleRight size={24}/>}
        </button>
        <div className="bg-[#E8E1D5] rounded-2xl p-3 border border-[#D7BA9D]/30 flex justify-between items-center">
             <div className="flex items-center gap-2 text-[#433D3C] font-bold text-[11px]">
                <CloudCog size={14} className="text-[#B3543D]"/>
                <span className="font-mono">ID: {currentAppId ? currentAppId.slice(0,8) : '...'}</span>
             </div>
             <button onClick={openSettings} className="p-1.5 hover:bg-white/50 rounded-lg text-[#8B8A73] transition-colors"><Settings size={16}/></button>
        </div>
      </div>
    </aside>
  );
};

// --- Contact Picker Modal ---
const ContactPickerModal = ({ isOpen, onClose, contacts, type, onSelect }) => {
  const [search, setSearch] = useState('');
  
  const filtered = useMemo(() => {
    if (!contacts) return [];
    const list = contacts.filter(c => c.type === type);
    if (!search) return list;
    return list.filter(c => 
      (safeStr(c.name)).toLowerCase().includes(search.toLowerCase()) || 
      (safeStr(c.taxId)).includes(search)
    );
  }, [contacts, type, search]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`ค้นหา${type === 'customer' ? 'ลูกค้า' : 'คู่ค้า'}`} maxWidth="max-w-lg">
      <div className="space-y-4">
        <div className="relative text-left">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B8A73]" size={18} />
          <input 
            type="text" 
            placeholder={`ค้นหาชื่อ หรือ เลขผู้เสียภาษี...`} 
            className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-2xl pl-12 pr-4 py-3.5 text-[15px] focus:border-[#B3543D] outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar text-left">
          {filtered?.length === 0 ? (
            <p className="text-center text-[#8B8A73] text-sm py-10 italic">ไม่พบข้อมูลผู้ติดต่อ</p>
          ) : filtered?.map(c => (
            <div 
              key={c.id} 
              onClick={() => { onSelect(c); onClose(); }}
              className="flex justify-between items-center p-4 bg-[#FDFCF8] border border-[#D7BA9D]/20 rounded-2xl hover:border-[#B3543D] hover:bg-white cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-white border border-[#D7BA9D]/20 rounded-xl flex items-center justify-center text-[#B3543D]">
                  {type === 'customer' ? <Users size={20}/> : <Truck size={20}/>}
                </div>
                <div>
                  <p className="text-[15px] font-bold text-[#433D3C]">{safeStr(c.name)}</p>
                  <p className="text-[11px] text-[#8B8A73] font-mono mt-0.5">Tax ID: {safeStr(c.taxId) || '-'} | สาขา: {safeStr(c.branch)}</p>
                </div>
              </div>
              <ChevronRight className="text-[#D7BA9D] group-hover:text-[#B3543D]" size={18} />
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

// --- Main App ---
const App = () => {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('pos');
  const [searchTerm, setSearchTerm] = useState('');
  const [reportSubView, setReportSubView] = useState('overview');
  const [crmTypeFilter, setCrmTypeFilter] = useState('all');
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState('loading');
  const [authErrorMessage, setAuthErrorMessage] = useState('');

  const [inventoryTab, setInventoryTab] = useState('overview'); 
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false); 

  const [reportFilterType, setReportFilterType] = useState('today');
  const [reportSelectedMonth, setReportSelectedMonth] = useState(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }).slice(0, 7));
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());

  const [ledgerTimeFilter, setLedgerTimeFilter] = useState('all');
  const [ledgerSelectedMonth, setLedgerSelectedMonth] = useState(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }).slice(0, 7));
  const [isLedgerMonthPickerOpen, setIsLedgerMonthPickerOpen] = useState(false);
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState('all'); 
  const [ledgerPickerYear, setLedgerPickerYear] = useState(new Date().getFullYear());

  const [taxTab, setTaxTab] = useState('output'); 
  const [taxSelectedMonth, setTaxSelectedMonth] = useState(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }).slice(0, 7));
  const [isTaxMonthPickerOpen, setIsTaxMonthPickerOpen] = useState(false);
  const [taxPickerYear, setTaxPickerYear] = useState(new Date().getFullYear());
  
  const [isLedgerExportModalOpen, setLedgerExportModalOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState(getThaiDate());
  const [exportEndDate, setExportEndDate] = useState(getThaiDate());
  const [exportLedgerType, setExportLedgerType] = useState('all');

  const [isMovementExportModalOpen, setMovementExportModalOpen] = useState(false);
  const [movementStartDate, setMovementStartDate] = useState(getThaiDate());
  const [movementEndDate, setMovementEndDate] = useState(getThaiDate());

  const [isDevMode, setIsDevMode] = useState(() => localStorage.getItem('isDevMode') === 'true');
  const appId = isDevMode ? 'dev-test' : 'eats-and-use-2026';

  // --- AI States ---
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [aiRole, setAiRole] = useState('CFO'); 
  const [aiExternalApiKey, setAiExternalApiKey] = useState(() => localStorage.getItem('ai_api_key') || '');

  const [settings, setSettings] = useState({
      shopName: 'EATS AND USE PRO',
      shopNameTh: 'บริษัท อีทส์ แอนด์ ยูส โปร จำกัด',
      address: '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110',
      taxId: '010555XXXXXXX',
      branch: 'สำนักงานใหญ่',
      phone: '02-XXX-XXXX',
      logo: null,
      signature: null
  });
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  const logoInputRef = useRef(null);
  const signatureInputRef = useRef(null);

  const handleToggleMode = () => {
    const newMode = !isDevMode;
    setIsDevMode(newMode);
    localStorage.setItem('isDevMode', String(newMode));
  };

  const [products, setProducts] = useState([]);
  const [lots, setLots] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [cart, setCart] = useState([]);

  const [salesChannel, setSalesChannel] = useState('Offline');
  const [orderId, setOrderId] = useState(''); 
  const [discountAmount, setDiscountAmount] = useState(''); 
  const [cashCoupon, setCashCoupon] = useState(''); 
  const [shippingIncome, setShippingIncome] = useState(''); 
  const [actualShippingCost, setActualShippingCost] = useState(''); 
  const [platformFee, setPlatformFee] = useState(''); 
  const [posAdjustment, setPosAdjustment] = useState(''); 
  const [posVatType, setPosVatType] = useState('none'); 
  const [isFullTax, setIsFullTax] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ name: '', taxId: '', branch: '00000', address: '' });

  const [isProductModalOpen, setProductModalOpen] = useState(false);
  const [isStockModalOpen, setStockModalOpen] = useState(false);
  const [isVendorPickerOpen, setVendorPickerOpen] = useState(false);
  const [isCustomerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [isContactModalOpen, setContactModalOpen] = useState(false);
  const [isExpenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseVendorPickerOpen, setExpenseVendorPickerOpen] = useState(false);
  const [isReceiptModalOpen, setReceiptModalOpen] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [isEditTransactionModalOpen, setEditTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [isDeleteProdConfirmOpen, setDeleteProdConfirmOpen] = useState(false);
  const [deletingProdId, setDeletingProdId] = useState(null);

  const [isDeleteContactConfirmOpen, setDeleteContactConfirmOpen] = useState(false);
  const [deletingContactId, setDeletingContactId] = useState(null);
  
  const [isFullTaxConverterOpen, setFullTaxConverterOpen] = useState(false);
  const [fullTaxData, setFullTaxData] = useState(null);
  const [fullTaxCustomerPickerOpen, setFullTaxCustomerPickerOpen] = useState(false);
  const [isFullInvoicePreviewOpen, setFullInvoicePreviewOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceType, setInvoiceType] = useState('original'); 

  const [newProduct, setNewProduct] = useState({ 
    name: '', sku: '', category: 'เครื่องดื่ม', brand: '', uom: 'ชิ้น', 
    price: '', cost: '', minStock: 5, barcode: '', image: null 
  });
  const [newStock, setNewStock] = useState({ 
    lotNo: '', 
    receiveDate: getThaiDate(), 
    vendor: '', 
    taxId: '',
    taxInvoiceNo: '', 
    taxType: 'none', 
    items: [], 
    discount: 0, 
    voucher: 0 
  });
  const [stockItemInput, setStockItemInput] = useState({ productId: '', qty: '', cost: '' });
  
  const [newContact, setNewContact] = useState({ 
      type: 'customer',
      code: '',
      name: '', 
      taxId: '', 
      branch: '00000', 
      group: 'General',
      contactPerson: '',
      phone: '', 
      mobile: '',
      email: '', 
      lineId: '',
      facebook: '',
      address: '', 
      shippingAddress: '',
      creditTerm: '',
      note: ''
  });

  const [newExpense, setNewExpense] = useState({ 
      date: getThaiDate(), 
      category: 'อุปกรณ์แพ็คของ', 
      amount: '', 
      note: '', 
      vendor: '', 
      vendorId: '', 
      discount: '', 
      adjustments: '', 
      cashCoupon: '',
      taxType: 'none', 
      taxInvoiceNo: '' 
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
        try { document.body.removeChild(script); } catch(e) {}
    }
  }, []);

  const derivedValues = useMemo(() => {
    const totalProductPrice = cart?.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.qty || 0)), 0) || 0;
    const discount = Number(discountAmount || 0);
    const shipping = Number(shippingIncome || 0);
    const coupon = Number(cashCoupon || 0);
    const platform = Number(platformFee || 0);
    const actualShip = Number(actualShippingCost || 0);
    const adjust = Number(posAdjustment || 0);
    
    const priceAfterDiscount = Math.max(0, totalProductPrice - discount);

    let vat = 0;
    let beforeVat = 0;
    let totalWithVat = 0;
    
    if (posVatType === 'exclude') {
         beforeVat = priceAfterDiscount;
         vat = priceAfterDiscount * 0.07;
         totalWithVat = priceAfterDiscount + vat;
    } else if (posVatType === 'include') {
         beforeVat = priceAfterDiscount / 1.07;
         vat = priceAfterDiscount - beforeVat;
         totalWithVat = priceAfterDiscount;
    } else {
         beforeVat = priceAfterDiscount;
         vat = 0;
         totalWithVat = priceAfterDiscount;
    }

    const grandTotal = Math.max(0, totalWithVat + shipping - platform - actualShip);
    const netPayable = Math.max(0, grandTotal - coupon);
    const finalPayout = netPayable + adjust;
    
    return { 
        totalProductPrice, 
        discount, 
        priceAfterDiscount, 
        beforeVat, 
        vat, 
        totalWithVat, 
        shipping, 
        grandTotal, 
        coupon, 
        netPayable, 
        finalPayout 
    };
  }, [cart, discountAmount, shippingIncome, platformFee, actualShippingCost, posAdjustment, posVatType, cashCoupon]);

  const inventorySummary = useMemo(() => {
    if (!products) return [];
    return products.map((p, idx) => {
      const pLots = lots?.filter(l => l.productId === p.id) || [];
      const remaining = pLots.reduce((s, l) => s + (Number(l.remainingQty) || 0), 0);
      const value = pLots.reduce((s, l) => s + (Number(l.remainingQty) * Number(l.cost || 0)), 0);
      return { ...p, index: idx + 1, remaining, totalValue: value };
    });
  }, [products, lots]);

  const stockMovementReport = useMemo(() => {
    if (!products || !transactions || !lots) return [];
    
    const salesMap = {};
    transactions.filter(t => t.type === 'income').forEach(t => {
        if (t.items && Array.isArray(t.items)) {
            t.items.forEach(i => {
                const n = safeStr(i.name);
                salesMap[n] = (salesMap[n] || 0) + (Number(i.qty) || 0);
            });
        }
    });

    return products.map(p => {
        const pLots = lots.filter(l => l.productId === p.id);
        const totalIn = pLots.reduce((sum, l) => sum + (Number(l.initialQty) || 0), 0);
        const currentStock = pLots.reduce((sum, l) => sum + (Number(l.remainingQty) || 0), 0);
        const totalOut = salesMap[p.name] || 0;
        const totalValue = pLots.reduce((sum, l) => sum + (Number(l.remainingQty) * Number(l.cost || 0)), 0);

        return {
            id: p.id,
            sku: p.sku,
            name: p.name,
            totalIn,
            totalOut,
            currentStock,
            totalValue
        };
    });
  }, [products, lots, transactions]);

  const stockMovementTotals = useMemo(() => {
    return stockMovementReport.reduce((acc, p) => ({
        totalIn: acc.totalIn + p.totalIn,
        totalOut: acc.totalOut + p.totalOut,
        totalStock: acc.totalStock + p.currentStock,
        totalValue: acc.totalValue + p.totalValue
    }), { totalIn: 0, totalOut: 0, totalStock: 0, totalValue: 0 });
  }, [stockMovementReport]);

  const filteredLedgerData = useMemo(() => {
    if (!transactions) return [];
    const todayStr = getThaiDate();
    
    return transactions.filter(t => {
        const tDate = safeDate(t.date);
        let timeMatch = true;
        if (ledgerTimeFilter === 'today') timeMatch = tDate === todayStr;
        else if (ledgerTimeFilter === 'month') timeMatch = tDate.startsWith(ledgerSelectedMonth);
        else if (ledgerTimeFilter === '7days') {
             const d1 = new Date(tDate);
             const d2 = new Date();
             const diff = (d2 - d1) / (1000 * 3600 * 24);
             timeMatch = diff <= 7 && diff >= 0;
        }
        else if (ledgerTimeFilter === '30days') {
             const d1 = new Date(tDate);
             const d2 = new Date();
             const diff = (d2 - d1) / (1000 * 3600 * 24);
             timeMatch = diff <= 30 && diff >= 0;
        }
        
        let typeMatch = true;
        if (ledgerTypeFilter !== 'all') {
            typeMatch = t.type === ledgerTypeFilter;
        }
        
        return timeMatch && typeMatch;
    });
  }, [transactions, ledgerTimeFilter, ledgerSelectedMonth, ledgerTypeFilter]);

  const taxReportData = useMemo(() => {
    if (!transactions) return { list: [], totalBase: 0, totalVat: 0 };
    
    const list = transactions.filter(t => {
        const tDate = safeDate(t.date);
        const matchesMonth = tDate.startsWith(taxSelectedMonth);
        const isTargetType = taxTab === 'output' ? t.type === 'income' : t.type === 'expense';
        const hasVat = Number(t.vatAmount || 0) > 0;
        return matchesMonth && isTargetType && hasVat;
    });

    const totalBase = list.reduce((s, t) => s + (Number(t.beforeVat || 0)), 0);
    const totalVat = list.reduce((s, t) => s + (Number(t.vatAmount || 0)), 0);

    return { list, totalBase, totalVat };
  }, [transactions, taxSelectedMonth, taxTab]);

  const accSummary = useMemo(() => {
    const income = filteredLedgerData?.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.amount || 0)), 0) || 0;
    const expense = filteredLedgerData?.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0) || 0;
    const coupons = filteredLedgerData?.reduce((s, t) => {
      const val = t.type === 'income' ? (t.cashCoupon || 0) : (t.paidByVoucher || 0);
      return s + Number(val || 0);
    }, 0) || 0;
    return { income, expense, balance: income - expense, coupons };
  }, [filteredLedgerData]);

  const analyticsData = useMemo(() => {
    if (!transactions) return { byChannel: {}, topSelling: [], topSpenders: [], totalGP: 0, totalIncome: 0, totalExpense: 0, itemsLog: [], byCategory: {}, dailyTrend: [] };
    
    const todayStr = getThaiDate();
    const filteredTransactions = transactions.filter(t => {
        const tDate = safeDate(t.date);
        if (reportFilterType === 'all') return true;
        if (reportFilterType === 'today') return tDate === todayStr;
        if (reportFilterType === 'month') return tDate.startsWith(reportSelectedMonth);
        
        const d1 = new Date(tDate);
        const d2 = new Date();
        const diffTime = d2.getTime() - d1.getTime();
        const diffDays = diffTime / (1000 * 3600 * 24);
        
        if (reportFilterType === '7days') return diffDays <= 7 && diffDays >= 0;
        if (reportFilterType === '30days') return diffDays <= 30 && diffDays >= 0;
        
        return true;
    });

    const sales = filteredTransactions.filter(t => t.type === 'income');
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    
    const byChannel = sales.reduce((acc, t) => {
        const chan = safeStr(t.channel) || 'Offline';
        acc[chan] = (acc[chan] || 0) + (Number(t.amount) || 0);
        return acc;
    }, {});

    const productCategoryMap = {};
    products.forEach(p => {
        productCategoryMap[p.name] = p.category;
    });

    const productStats = {};
    const spenderStats = {};
    const categoryStats = {};
    const dailySalesMap = {}; 
    const itemsLog = [];

    sales.forEach(t => {
        const cName = safeStr(t.customer) || 'ทั่วไป';
        spenderStats[cName] = (spenderStats[cName] || 0) + (Number(t.amount) || 0);

        const tDate = safeDate(t.date);
        dailySalesMap[tDate] = (dailySalesMap[tDate] || 0) + (Number(t.amount) || 0);

        if (t.items && Array.isArray(t.items)) {
            t.items.forEach(item => {
                const itemName = safeStr(item.name);
                const itemTotal = Number(item.qty) * Number(item.price);
                productStats[itemName] = (productStats[itemName] || 0) + (Number(item.qty) || 0);
                const cat = productCategoryMap[itemName] || 'Uncategorized';
                categoryStats[cat] = (categoryStats[cat] || 0) + itemTotal;
                itemsLog.push({ ...item, date: t.date, customer: cName, channel: t.channel, orderId: t.orderId });
            });
        }
    });

    const dailyTrend = Object.entries(dailySalesMap)
        .sort((a,b) => new Date(a[0]) - new Date(b[0]))
        .slice(-14) 
        .map(([date, amount]) => ({ date, amount }));

    const topSelling = Object.entries(productStats).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topSpenders = Object.entries(spenderStats).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const totalIncome = sales.reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const totalExpense = expenses.reduce((s, t) => s + (Number(t.amount) || 0), 0);

    return { byChannel, topSelling, topSpenders, totalGP: totalIncome - totalExpense, totalIncome, totalExpense, itemsLog, byCategory: categoryStats, dailyTrend };
  }, [transactions, reportFilterType, reportSelectedMonth, products]);

  const contactStats = useMemo(() => {
      const stats = {};
      transactions?.filter(t => t.type === 'income').forEach(t => {
          const name = safeStr(t.customer) || 'ทั่วไป';
          if (!stats[name]) stats[name] = { spent: 0, count: 0 };
          stats[name].spent += (Number(t.amount) || 0);
          stats[name].count += 1;
      });
      return stats;
  }, [transactions]);

  // --- AI Analysis Logic ---
  const handleSaveApiKey = () => {
    localStorage.setItem('ai_api_key', aiExternalApiKey);
    window.alert("บันทึก External API Key เรียบร้อย");
  };

  const handleAIAnalysis = async () => {
    setIsAILoading(true);
    setAiResponse(null);
    const apiKey = aiExternalApiKey;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const contextData = {
        shopInfo: {
            name: settings.shopName,
            thaiName: settings.shopNameTh
        },
        financials: {
            summary: accSummary,
            taxReport: taxReportData
        },
        salesAnalytics: {
            totalIncome: analyticsData.totalIncome,
            topProducts: analyticsData.topSelling,
            channels: analyticsData.byChannel,
            topCustomers: analyticsData.topSpenders
        },
        inventory: {
            totalValue: inventorySummary.reduce((s, p) => s + p.totalValue, 0),
            lowStockItems: inventorySummary.filter(p => p.remaining < (p.minStock || 5)).map(p => p.name)
        }
    };

    const prompts = {
        CFO: `ในฐานะ CFO ระดับมืออาชีพ วิเคราะห์งบการเงินและบัญชี: รายรับ ฿${accSummary.income}, รายจ่าย ฿${accSummary.expense}, กำไรจากการดำเนินงาน ฿${accSummary.balance} และการใช้คูปอง ฿${accSummary.coupons} แนะนำแนวทางการจัดการกระแสเงินสดและการลดต้นทุน`,
        CMO: `ในฐานะ CMO และผู้เชี่ยวชาญด้านกลยุทธ์แบรนด์: วิเคราะห์ยอดขายรวม ฿${analyticsData.totalIncome} จากช่องทาง ${JSON.stringify(analyticsData.byChannel)} และสินค้าขายดี ${JSON.stringify(analyticsData.topSelling)} แนะนำแผนการขยายฐานลูกค้าและเพิ่ม Brand Awareness`,
        PROMO: `ในฐานะผู้เชี่ยวชาญด้านโปรโมชั่น: การใช้คูปองเงินสดรวม ฿${accSummary.coupons} คิดเป็นกี่เปอร์เซ็นต์ของรายได้ วิเคราะห์สินค้าขายดี 5 อันดับแรกเพื่อจัดโปรโมชั่น Bundle หรือ Flash Sale ให้ได้กำไรสูงสุด`,
        ANALYST: `ในฐานะ Business Data Analyst: วิเคราะห์ข้อมูลดิบทั้งหมด ${JSON.stringify(contextData)} ระบุความเสี่ยง (Risks) และโอกาส (Opportunities) ที่ซ่อนอยู่ในข้อมูลบัญชีและยอดขาย พร้อมสรุปแนวโน้มเดือนถัดไป`
    };

    const systemInstruction = `คุณคือทีมงานระดับบริหาร (Executive Team) ของธุรกิจ ${settings.shopName}. 
    วิเคราะห์ข้อมูลธุรกิจที่ได้รับและให้คำแนะนำในเชิงกลยุทธ์ที่นำไปปฏิบัติได้จริง (Actionable). 
    ใช้ภาษาที่เป็นมืออาชีพแต่เข้าใจง่ายในภาษาไทย. แบ่งเป็นหัวข้อหลัก 3-5 ข้อ. 
    ห้ามแสดงรหัสโปรแกรม. เน้นผลลัพธ์ทางธุรกิจและความคุ้มค่าทางบัญชี.`;

    const payload = {
        contents: [{ parts: [{ text: prompts[aiRole] }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] }
    };

    const callAPI = async (retryCount = 0) => {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error('API Error');
            const result = await response.json();
            setAiResponse(result.candidates?.[0]?.content?.parts?.[0]?.text);
        } catch (err) {
            if (retryCount < 5) {
                setTimeout(() => callAPI(retryCount + 1), Math.pow(2, retryCount) * 1000);
            } else {
                setAiResponse("ขออภัย ระบบ AI ไม่สามารถเข้าถึงข้อมูลได้ในขณะนี้ กรุณาลองใหม่ภายหลัง หรือตรวจสอบ API Key ของคุณ");
            }
        } finally {
            setIsAILoading(false);
        }
    };

    if (!apiKey) {
      window.alert("กรุณาระบุ External API Key เพื่อเริ่มการวิเคราะห์");
      setIsAILoading(false);
      return;
    }

    callAPI();
  };

  const handleAddProduct = async (e) => {
    if (e) e.preventDefault();
    if (!user) return;
    try {
      const productColl = collection(db, 'artifacts', appId, 'public', 'data', 'products');
      if (newProduct.id) {
         const { id, ...updateData } = newProduct;
         await updateDoc(doc(productColl, id), { ...updateData, updatedAt: new Date().toISOString() });
         window.alert("แก้ไขสินค้าเรียบร้อย");
      } else {
         await addDoc(productColl, { ...newProduct, createdAt: new Date().toISOString() });
         window.alert("เพิ่มสินค้าเรียบร้อย");
      }
      setProductModalOpen(false);
      setNewProduct({ name: '', sku: '', category: 'เครื่องดื่ม', brand: '', uom: 'ชิ้น', price: '', cost: '', minStock: 5, barcode: '', image: null });
    } catch (err) { console.error(err); }
  };
  
  const handleDeleteProduct = async (id) => {
      try {
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', id));
          window.alert("ลบสินค้าเรียบร้อย");
      } catch(err) { console.error(err); }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1048576) { 
         window.alert("ไฟล์รูปภาพต้องมีขนาดไม่เกิน 1MB");
         return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const generateAutoSKU = () => {
    const categoryPrefixMap = {
        'เครื่องดื่ม': 'DRK',
        'อาหารแห้ง / ขนม': 'FD',
        'นมและผลิตภัณฑ์แช่เย็น': 'DRY',
        'อาหารแช่แข็ง': 'FRZ',
        'ของใช้ส่วนตัว': 'PER',
        'ของใช้ในบ้าน / ทำความสะอาด': 'HSE',
        'แม่และเด็ก': 'BABY',
        'สุขภาพและยา': 'HLTH',
        'สัตว์เลี้ยง': 'PET',
        'อื่นๆ': 'GEN'
    };

    const prefix = categoryPrefixMap[newProduct.category] || 'PD';
    const random = Math.floor(10000 + Math.random() * 90000);
    const timestamp = Date.now().toString().slice(-4);
    const sku = `${prefix}-${random}-${timestamp}`;
    setNewProduct(prev => ({ ...prev, sku }));
  };

  const getExcelStyles = () => {
    return {
        headerCellStyle: {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "B3543D" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }
        },
        enterpriseHeaderStyle: { font: { bold: true, size: 14 } },
        labelStyle: { font: { bold: true } },
        borderStyle: { border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } },
        totalRowStyle: {
            font: { bold: true },
            fill: { fgColor: { rgb: "F5F0E6" } },
            border: { top: { style: "thin" }, bottom: { style: "double" }, left: { style: "thin" }, right: { style: "thin" } }
        }
    };
  };

  const handleExportStockXLSX = () => {
    if (!inventorySummary || inventorySummary.length === 0) {
        window.alert("ไม่พบข้อมูลสินค้าที่จะส่งออก");
        return;
    }
    if (!window.XLSX) { window.alert("ระบบกำลังโหลดองค์ประกอบ Excel... กรุณารอสักครู่"); return; }

    const styles = getExcelStyles();
    const headerRows = [
        [{ v: "รายงานสินค้าคงเหลือ (Stock Balance Report)", s: styles.enterpriseHeaderStyle }],
        [{ v: `ข้อมูล ณ วันที่: ${getThaiDate()}`, s: styles.labelStyle }],
        [`ชื่อสถานประกอบการ: ${settings.shopNameTh || settings.shopName}`],
        [`เลขประจำตัวผู้เสียภาษี: ${settings.taxId}`],
        [`สาขา: ${settings.branch}`],
        [`ที่อยู่: ${settings.address}`],
        [],
        [
            { v: "ลำดับ", s: styles.headerCellStyle },
            { v: "ชื่อสินค้า", s: styles.headerCellStyle },
            { v: "รหัสสินค้า (SKU)", s: styles.headerCellStyle },
            { v: "หมวดหมู่", s: styles.headerCellStyle },
            { v: "หน่วยนับ", s: styles.headerCellStyle },
            { v: "คงเหลือ", s: styles.headerCellStyle },
            { v: "ต้นทุนเฉลี่ย", s: styles.headerCellStyle },
            { v: "มูลค่ารวม", s: styles.headerCellStyle }
        ]
    ];

    inventorySummary.forEach((p, index) => {
        const avgCost = p.remaining > 0 ? (p.totalValue / p.remaining) : (Number(p.cost) || 0);
        headerRows.push([
            { v: index + 1, s: styles.borderStyle },
            { v: safeStr(p.name), s: styles.borderStyle },
            { v: safeStr(p.sku), s: styles.borderStyle },
            { v: safeStr(p.category), s: styles.borderStyle },
            { v: safeStr(p.uom), s: styles.borderStyle },
            { v: p.remaining, s: styles.borderStyle },
            { v: Number(avgCost.toFixed(2)), s: styles.borderStyle, t: 'n', z: '#,##0.00' },
            { v: Number(Number(p.totalValue || 0).toFixed(2)), s: styles.borderStyle, t: 'n', z: '#,##0.00' }
        ]);
    });

    const ws = window.XLSX.utils.aoa_to_sheet(headerRows);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Stock Balance");
    window.XLSX.writeFile(wb, `Stock_Balance_${getThaiDate()}.xlsx`);
    setIsExportMenuOpen(false);
  };

  const handleExportMovementXLSX = () => {
    setMovementExportModalOpen(true); 
    setIsExportMenuOpen(false);
  };

  const handleConfirmExportMovement = () => {
    if (!window.XLSX) { window.alert("ระบบกำลังโหลดองค์ประกอบ Excel... กรุณารอสักครู่"); return; }
    
    const salesMap = {};
    transactions.filter(t => {
        const tDate = safeDate(t.date);
        return t.type === 'income' && tDate >= movementStartDate && tDate <= movementEndDate;
    }).forEach(t => {
        if (t.items && Array.isArray(t.items)) {
            t.items.forEach(i => {
                const n = safeStr(i.name);
                salesMap[n] = (salesMap[n] || 0) + (Number(i.qty) || 0);
            });
        }
    });

    const styles = getExcelStyles();
    const headerRows = [
        [{ v: "รายงานความเคลื่อนไหวสินค้า (Stock Movement Report)", s: styles.enterpriseHeaderStyle }],
        [{ v: `ช่วงเวลา: ${movementStartDate} ถึง ${movementEndDate}`, s: styles.labelStyle }],
        [`ชื่อสถานประกอบการ: ${settings.shopNameTh || settings.shopName}`],
        [`เลขประจำตัวผู้เสียภาษี: ${settings.taxId}`],
        [`สาขา: ${settings.branch}`],
        [],
        [
            { v: "สินค้า", s: styles.headerCellStyle },
            { v: "SKU", s: styles.headerCellStyle },
            { v: "รับเข้าช่วงนี้", s: styles.headerCellStyle },
            { v: "ขายออกช่วงนี้", s: styles.headerCellStyle },
            { v: "คงเหลือปัจจุบัน", s: styles.headerCellStyle },
            { v: "มูลค่าคงเหลือ", s: styles.headerCellStyle }
        ]
    ];

    let sumIn = 0, sumOut = 0, sumBalance = 0, sumValue = 0;

    products.forEach(p => {
        const pLotsInRange = lots.filter(l => {
            const lDate = safeDate(l.receiveDate);
            return l.productId === p.id && lDate >= movementStartDate && lDate <= movementEndDate;
        });
        const periodIn = pLotsInRange.reduce((sum, l) => sum + (Number(l.initialQty) || 0), 0);
        const periodOut = salesMap[p.name] || 0;
        const pLotsAll = lots.filter(l => l.productId === p.id);
        const currentBalance = pLotsAll.reduce((sum, l) => sum + (Number(l.remainingQty) || 0), 0);
        const currentValue = pLotsAll.reduce((sum, l) => sum + (Number(l.remainingQty) * Number(l.cost || 0)), 0);

        sumIn += periodIn;
        sumOut += periodOut;
        sumBalance += currentBalance;
        sumValue += currentValue;

        headerRows.push([
            { v: safeStr(p.name), s: styles.borderStyle },
            { v: safeStr(p.sku) || '-', s: styles.borderStyle },
            { v: periodIn, s: styles.borderStyle },
            { v: periodOut, s: styles.borderStyle },
            { v: currentBalance, s: styles.borderStyle },
            { v: Number(currentValue.toFixed(2)), s: styles.borderStyle, t: 'n', z: '#,##0.00' }
        ]);
    });

    headerRows.push([
        { v: "รวมทั้งสิ้น", s: { ...styles.totalRowStyle, alignment: { horizontal: "center" } } },
        { v: "", s: styles.totalRowStyle },
        { v: sumIn, s: { ...styles.totalRowStyle, alignment: { horizontal: "right" } } },
        { v: sumOut, s: { ...styles.totalRowStyle, alignment: { horizontal: "right" } } },
        { v: sumBalance, s: { ...styles.totalRowStyle, alignment: { horizontal: "right" } } },
        { v: Number(sumValue.toFixed(2)), s: { ...styles.totalRowStyle, alignment: { horizontal: "right" } }, t: 'n', z: '#,##0.00' }
    ]);

    const ws = window.XLSX.utils.aoa_to_sheet(headerRows);
    ws['!cols'] = [{ wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Movement Report");
    window.XLSX.writeFile(wb, `Stock_Movement_${movementStartDate}_to_${movementEndDate}.xlsx`);
    setMovementExportModalOpen(false);
  };

  const handleExportContactsXLSX = () => {
    const filteredContacts = contacts.filter(c => (crmTypeFilter === 'all' || c.type === crmTypeFilter) && ((safeStr(c.name)).toLowerCase().includes(searchTerm.toLowerCase())));
    if (filteredContacts.length === 0) {
        window.alert("ไม่พบข้อมูลที่จะส่งออก");
        return;
    }
    if (!window.XLSX) { window.alert("ระบบกำลังโหลดองค์ประกอบ Excel... กรุณารอสักครู่"); return; }

    const styles = getExcelStyles();
    const headerRows = [
        [{ v: "รายงานฐานข้อมูลผู้ติดต่อ (CRM Contacts Report)", s: styles.enterpriseHeaderStyle }],
        [{ v: `ประเภท: ${crmTypeFilter === 'all' ? 'ทั้งหมด' : crmTypeFilter === 'customer' ? 'ลูกค้า' : 'คู่ค้า'}`, s: styles.labelStyle }],
        [`ชื่อสถานประกอบการ: ${settings.shopNameTh || settings.shopName}`],
        [],
        [
            { v: "ชื่อ", s: styles.headerCellStyle },
            { v: "ประเภท", s: styles.headerCellStyle },
            { v: "เลขผู้เสียภาษี", s: styles.headerCellStyle },
            { v: "เบอร์โทร", s: styles.headerCellStyle },
            { v: "อีเมล", s: styles.headerCellStyle },
            { v: "ที่อยู่", s: styles.headerCellStyle }
        ]
    ];

    filteredContacts.forEach(c => {
        headerRows.push([
            { v: safeStr(c.name), s: styles.borderStyle },
            { v: c.type === 'customer' ? 'ลูกค้า' : 'คู่ค้า', s: styles.borderStyle },
            { v: safeStr(c.taxId) || '-', s: styles.borderStyle },
            { v: safeStr(c.phone || c.mobile), s: styles.borderStyle },
            { v: safeStr(c.email), s: styles.borderStyle },
            { v: safeStr(c.address), s: styles.borderStyle }
        ]);
    });

    const ws = window.XLSX.utils.aoa_to_sheet(headerRows);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Contacts");
    window.XLSX.writeFile(wb, `CRM_Contacts_${getThaiDate()}.xlsx`);
  };

  const handleExportTaxReportXLSX = () => {
    if (!taxReportData.list || taxReportData.list.length === 0) {
        window.alert("ไม่พบข้อมูลที่จะส่งออก");
        return;
    }
    if (!window.XLSX) { window.alert("ระบบกำลังโหลดองค์ประกอบ Excel... กรุณารอสักครู่"); return; }

    const reportTitle = taxTab === 'output' ? 'รายงานภาษีขาย' : 'รายงานภาษีซื้อ';
    const filename = `${taxTab === 'output' ? 'Sales' : 'Purchase'}_Tax_Report_${taxSelectedMonth}.xlsx`;

    const styles = getExcelStyles();
    const rows = [
        [{ v: reportTitle, s: styles.enterpriseHeaderStyle }],
        [{ v: `เดือนภาษี: ${formatMonthYear(taxSelectedMonth)}`, s: styles.labelStyle }],
        [`ชื่อสถานประกอบการ: ${settings.shopNameTh || settings.shopName}`],
        [`เลขประจำตัวผู้เสียภาษี: ${settings.taxId}`],
        [`สาขา: ${settings.branch}`],
        [`ที่อยู่: ${settings.address}`],
        [], 
        [
            { v: "ลำดับ", s: styles.headerCellStyle },
            { v: "วันที่", s: styles.headerCellStyle },
            { v: "เลขที่ใบกำกับภาษี", s: styles.headerCellStyle },
            { v: "ชื่อผู้ซื้อสินค้า/ผู้รับบริการ", s: styles.headerCellStyle },
            { v: "เลขประจำตัวผู้เสียภาษี", s: styles.headerCellStyle },
            { v: "สาขา", s: styles.headerCellStyle },
            { v: "มูลค่าสินค้า/บริการ", s: styles.headerCellStyle },
            { v: "จำนวนภาษีมูลค่าเพิ่ม", s: styles.headerCellStyle },
            { v: "จำนวนเงินรวม", s: styles.headerCellStyle }
        ]
    ];

    taxReportData.list.forEach((t, idx) => {
        const beforeVat = Number(t.beforeVat || 0);
        const vatAmount = Number(t.vatAmount || 0);
        const rowTotal = beforeVat + vatAmount;

        rows.push([
            { v: idx + 1, s: styles.borderStyle },
            { v: safeDate(t.date), s: styles.borderStyle },
            { v: t.invNo || t.abbNo || t.taxInvoiceNo || '-', s: styles.borderStyle },
            { v: safeStr(t.customer), s: styles.borderStyle },
            { v: t.fullTaxTaxId || t.taxId || '-', s: styles.borderStyle },
            { v: t.fullTaxBranch || '00000', s: styles.borderStyle },
            { v: Number(beforeVat.toFixed(2)), s: { ...styles.borderStyle, alignment: { horizontal: "right" } }, t: 'n', z: '#,##0.00' },
            { v: Number(vatAmount.toFixed(2)), s: { ...styles.borderStyle, alignment: { horizontal: "right" } }, t: 'n', z: '#,##0.00' },
            { v: Number(rowTotal.toFixed(2)), s: { ...styles.borderStyle, alignment: { horizontal: "right" } }, t: 'n', z: '#,##0.00' }
        ]);
    });

    rows.push([
        { v: "รวมทั้งสิ้น", s: { ...styles.totalRowStyle, alignment: { horizontal: "center" } } },
        { v: "", s: styles.totalRowStyle },
        { v: "", s: styles.totalRowStyle },
        { v: "", s: styles.totalRowStyle },
        { v: "", s: styles.totalRowStyle },
        { v: "", s: styles.totalRowStyle },
        { v: Number(taxReportData.totalBase.toFixed(2)), s: { ...styles.totalRowStyle, alignment: { horizontal: "right" } }, t: 'n', z: '#,##0.00' },
        { v: Number(taxReportData.totalVat.toFixed(2)), s: { ...styles.totalRowStyle, alignment: { horizontal: "right" } }, t: 'n', z: '#,##0.00' },
        { v: Number((taxReportData.totalBase + taxReportData.totalVat).toFixed(2)), s: { ...styles.totalRowStyle, alignment: { horizontal: "right" } }, t: 'n', z: '#,##0.00' }
    ]);

    const ws = window.XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 8 }, { wch: 12 }, { wch: 25 }, { wch: 35 }, { wch: 20 }, { wch: 10 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Tax Report");
    window.XLSX.writeFile(wb, filename);
  };

  const handleConfirmExportLedger = () => {
    if (!transactions || transactions.length === 0) {
        window.alert("ไม่พบข้อมูลที่จะส่งออก");
        setLedgerExportModalOpen(false);
        return;
    }
    if (!window.XLSX) { window.alert("ระบบกำลังโหลดองค์ประกอบ Excel... กรุณารอสักครู่"); return; }
    
    let filtered = transactions;
    if (exportLedgerType !== 'all') {
        filtered = filtered.filter(t => t.type === exportLedgerType);
    }
    if (exportStartDate && exportEndDate) {
        filtered = filtered.filter(t => {
            const tDate = safeDate(t.date);
            return tDate >= exportStartDate && tDate <= exportEndDate;
        });
    }
    if (filtered.length === 0) { window.alert("ไม่พบรายการในช่วงเวลาและประเภทที่เลือก"); return; }

    const styles = getExcelStyles();
    const headerRows = [
        [{ v: "รายงานสมุดบัญชีรายรับ-รายจ่าย (Account Ledger Report)", s: styles.enterpriseHeaderStyle }],
        [{ v: `ช่วงเวลา: ${exportStartDate} ถึง ${exportEndDate}`, s: styles.labelStyle }],
        [`ชื่อสถานประกอบการ: ${settings.shopNameTh || settings.shopName}`],
        [`เลขประจำตัวผู้เสียภาษี: ${settings.taxId}`],
        [],
        [
            { v: "วันที่", s: styles.headerCellStyle },
            { v: "หมวดหมู่", s: styles.headerCellStyle },
            { v: "ลูกค้า/คู่ค้า", s: styles.headerCellStyle },
            { v: "ประเภท", s: styles.headerCellStyle },
            { v: "ยอดเงินสุทธิ", s: styles.headerCellStyle },
            { v: "หมายเหตุ", s: styles.headerCellStyle }
        ]
    ];

    filtered.forEach(t => {
        headerRows.push([
            { v: safeDate(t.date), s: styles.borderStyle },
            { v: safeStr(t.category), s: styles.borderStyle },
            { v: safeStr(t.customer), s: styles.borderStyle },
            { v: t.type === 'income' ? 'รายรับ' : 'รายจ่าย', s: styles.borderStyle },
            { v: Number(Number(t.amount || 0).toFixed(2)), s: styles.borderStyle, t: 'n', z: '#,##0.00' },
            { v: safeStr(t.note), s: styles.borderStyle }
        ]);
    });

    const ws = window.XLSX.utils.aoa_to_sheet(headerRows);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Ledger");
    window.XLSX.writeFile(wb, `Account_Ledger_${exportStartDate}_to_${exportEndDate}.xlsx`);
    setLedgerExportModalOpen(false);
  };

  const handleSaveContact = async (e) => {
    if (e) e.preventDefault();
    try {
      const contactColl = collection(db, 'artifacts', appId, 'public', 'data', 'contacts');
      if (newContact.id) {
          const { id, ...updateData } = newContact;
          await updateDoc(doc(contactColl, id), { ...updateData, updatedAt: new Date().toISOString() });
          window.alert("แก้ไขข้อมูลเรียบร้อย");
      } else {
          await addDoc(contactColl, { ...newContact, createdAt: new Date().toISOString() });
          window.alert("เพิ่มข้อมูลเรียบร้อย");
      }
      setContactModalOpen(false);
      setNewContact({ 
          type: 'customer', code: '', name: '', taxId: '', branch: '00000', 
          group: 'General', contactPerson: '', phone: '', mobile: '', email: '', 
          lineId: '', facebook: '', address: '', shippingAddress: '', creditTerm: '', note: ''
      });
    } catch (err) { console.error(err); }
  };

  const handleSaveExpense = async (e) => {
    if (e) e.preventDefault();
    if (!user || !newExpense.amount) return;
    try {
      const transColl = collection(db, 'artifacts', appId, 'public', 'data', 'transactions');
      const baseAmount = Number(newExpense.amount);
      const discount = Number(newExpense.discount || 0);
      const cashCoupon = Number(newExpense.cashCoupon || 0);
      const priceAfterDiscount = Math.max(0, baseAmount - discount);
      let vat = 0;
      let beforeVat = 0;
      let grandTotal = 0;

      if (newExpense.taxType === 'exclude') {
          beforeVat = priceAfterDiscount;
          vat = priceAfterDiscount * 0.07;
          grandTotal = priceAfterDiscount + vat;
      } else if (newExpense.taxType === 'include') {
          beforeVat = priceAfterDiscount / 1.07;
          vat = priceAfterDiscount - beforeVat;
          grandTotal = priceAfterDiscount;
      } else { 
          beforeVat = priceAfterDiscount;
          vat = 0;
          grandTotal = priceAfterDiscount;
      }
      
      const adjustments = Number(newExpense.adjustments || 0);
      grandTotal += adjustments;
      const cashPayment = Math.max(0, grandTotal - cashCoupon);

      await addDoc(transColl, {
        date: newExpense.date,
        type: 'expense',
        category: newExpense.category,
        amount: cashPayment, 
        baseAmount: baseAmount,
        discount: discount,
        adjustments: adjustments,
        taxInvoiceNo: newExpense.taxInvoiceNo || '',
        taxType: newExpense.taxType,
        beforeVat: beforeVat,
        vatAmount: vat,
        grandTotal: grandTotal,
        paidByVoucher: cashCoupon,
        paidByCash: cashPayment,
        expenseTotalValue: grandTotal,
        customer: newExpense.vendor || 'ไม่ระบุ',
        vendorId: newExpense.vendorId || '',
        note: newExpense.note || ''
      });
      setExpenseModalOpen(false);
      setNewExpense({ 
          date: getThaiDate(), category: 'อุปกรณ์แพ็คของ', amount: '', note: '', vendor: '', vendorId: '', 
          discount: '', adjustments: '', cashCoupon: '', taxType: 'none', taxInvoiceNo: '' 
      });
      window.alert("บันทึกรายจ่ายสำเร็จ");
    } catch (err) { console.error(err); }
  };

  const handleDeleteTransaction = async (id) => {
      try {
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'transactions', id));
          const lotsToDelete = lots.filter(l => l.stockInTransactionId === id);
          for (const lot of lotsToDelete) {
              await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'lots', lot.id));
          }
          window.alert("ลบรายการและสต็อกที่เกี่ยวข้องสำเร็จ");
      } catch (e) { console.error(e); }
  };

  const handleDeleteContact = async (id) => {
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'contacts', id));
      window.alert("ลบข้อมูลผู้ติดต่อเรียบร้อย");
    } catch (err) { console.error(err); }
  };

  const handleUpdateTransaction = async (e) => {
      if (e) e.preventDefault();
      if (!user || !editingTransaction) return;
      try {
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'transactions', editingTransaction.id), {
              note: editingTransaction.note || '',
              customer: editingTransaction.customer || ''
          });
          setEditTransactionModalOpen(false);
          setEditingTransaction(null);
          window.alert("อัปเดตข้อมูลสำเร็จ");
      } catch (e) { console.error(e); }
  };

  const handleIssueFullTax = async () => {
      if (!user || !fullTaxData) return;
      try {
          const invNo = `INV-${getThaiDate().replace(/-/g, '')}-${Math.random().toString(36).substring(7).toUpperCase()}`;
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'transactions', fullTaxData.id), {
              fullTaxStatus: 'issued',
              invNo: invNo,
              fullTaxCustomer: fullTaxData.customer,
              fullTaxTaxId: fullTaxData.taxId,
              fullTaxBranch: fullTaxData.branch || '00000',
              fullTaxAddress: fullTaxData.address || ''
          });
          setFullTaxConverterOpen(false);
          setFullTaxData(null);
          window.alert("ออกใบกำกับภาษีเต็มรูปสำเร็จ เลขที่: " + invNo);
      } catch (e) { console.error(e); }
  };

  const addToCart = (product) => {
    const info = inventorySummary.find(i => i.id === product.id);
    if (!info || info.remaining <= 0) return;
    setCart(prev => {
      const ex = prev.find(i => i.id === product.id);
      if (ex) return prev.map(i => i.id === product.id ? { ...i, qty: (i.qty || 0) + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || !user) return;
    try {
      const transColl = collection(db, 'artifacts', appId, 'public', 'data', 'transactions');
      const ts = Date.now();
      const rid = `TX-${ts.toString().slice(-6)}`;
      const abbNo = `ABB-${getThaiDate().replace(/-/g, '')}-${ts.toString().slice(-4)}`;
      
      const transData = {
        date: getThaiDate(), 
        type: 'income', 
        category: 'ขายสินค้า', 
        channel: salesChannel,
        orderId: orderId,
        abbNo: abbNo,
        amount: derivedValues.finalPayout, 
        subtotal: derivedValues.totalProductPrice,
        priceAfterDiscount: derivedValues.priceAfterDiscount,
        beforeVat: derivedValues.beforeVat,
        vatType: posVatType,
        vatAmount: derivedValues.vat,
        grandTotal: derivedValues.grandTotal,
        totalBill: derivedValues.netPayable,
        discount: Number(discountAmount || 0),
        cashCoupon: Number(cashCoupon || 0),
        shippingIncome: Number(shippingIncome || 0),
        actualShippingCost: Number(actualShippingCost || 0),
        platformFee: Number(platformFee || 0),
        adjustments: Number(posAdjustment || 0),
        customer: isFullTax ? customerInfo.name : 'ทั่วไป',
        items: cart.map(i => ({ name: safeStr(i.name), qty: Number(i.qty || 0), price: Number(i.price || 0) }))
      };

      await setDoc(doc(transColl, rid), transData);
      setLastTransaction(transData);
      setReceiptModalOpen(true);

      setCart([]); setShippingIncome(''); setDiscountAmount(''); setPlatformFee(''); setCashCoupon('');
      setActualShippingCost(''); setPosAdjustment(''); setPosVatType('none'); 
      setOrderId(''); setIsFullTax(false);
    } catch (err) { console.error(err); }
  };

  const handleAddStockItem = () => {
    if (!stockItemInput.productId || !stockItemInput.qty || !stockItemInput.cost) return;
    const p = products.find(p => p.id === stockItemInput.productId);
    if (!p) return;
    setNewStock(prev => ({ 
      ...prev, 
      items: [...(prev.items || []), { 
        productId: stockItemInput.productId, 
        name: safeStr(p.name), 
        qty: Number(stockItemInput.qty), 
        cost: Number(stockItemInput.cost) 
      }] 
    }));
    setStockItemInput({ productId: '', qty: '', cost: '' });
  };

  const handleRemoveStockItem = (index) => {
    setNewStock(prev => ({
      ...prev,
      items: (prev.items || []).filter((_, i) => i !== index)
    }));
  };

  const handleReceiveStock = async () => {
    if (!user || !newStock.items?.length) return;
    try {
      const tColl = collection(db, 'artifacts', appId, 'public', 'data', 'transactions');
      const lColl = collection(db, 'artifacts', appId, 'public', 'data', 'lots');
      const subtotal = newStock.items.reduce((s, i) => s + (i.cost * i.qty), 0);
      const discount = Number(newStock.discount) || 0;
      const voucher = Number(newStock.voucher) || 0;
      const priceAfterDiscount = Math.max(0, subtotal - discount);
      let vat = 0;
      let beforeVat = 0;
      let grandTotal = 0;

      if (newStock.taxType === 'exclude') {
          beforeVat = priceAfterDiscount;
          vat = priceAfterDiscount * 0.07;
          grandTotal = priceAfterDiscount + vat;
      } else if (newStock.taxType === 'include') {
          beforeVat = priceAfterDiscount / 1.07;
          vat = priceAfterDiscount - beforeVat;
          grandTotal = priceAfterDiscount;
      } else { 
          beforeVat = priceAfterDiscount;
          vat = 0;
          grandTotal = priceAfterDiscount;
      }

      const cashPayment = Math.max(0, grandTotal - voucher); 

      const docRef = await addDoc(tColl, { 
        date: newStock.receiveDate, 
        type: 'expense', 
        category: 'ซื้อสินค้าเข้าสต็อก',
        amount: cashPayment,
        baseAmount: subtotal,
        discount: discount,
        taxInvoiceNo: newStock.taxInvoiceNo,
        taxType: newStock.taxType,
        beforeVat: beforeVat,
        vatAmount: vat,
        grandTotal: grandTotal,
        paidByVoucher: voucher,
        paidByCash: cashPayment,
        expenseTotalValue: grandTotal,
        customer: safeStr(newStock.vendor) || 'ไม่ระบุ',
        note: `Stock In: ${newStock.items.length} items. (Voucher Used: ${voucher})`
      });
      
      const transactionId = docRef.id;

      // --- Smart Pro-rata Cost Distribution Logic ---
      const totalReductions = discount + voucher;
      const reductionRatio = subtotal > 0 ? (subtotal - totalReductions) / subtotal : 1;

      for (const i of newStock.items) {
        const unitCostAfterReductions = i.cost * reductionRatio;

        await addDoc(lColl, { 
          productId: i.productId, 
          lotNo: safeStr(newStock.lotNo), 
          initialQty: Number(i.qty),
          remainingQty: Number(i.qty), 
          cost: Number(unitCostAfterReductions.toFixed(4)), 
          receiveDate: newStock.receiveDate,
          stockInTransactionId: transactionId 
        });
      }
      setStockModalOpen(false);
      setNewStock({ 
        lotNo: '', receiveDate: getThaiDate(), vendor: '', taxInvoiceNo: '', taxType: 'none', 
        items: [], discount: 0, voucher: 0 
      });
      window.alert("บันทึกรับสินค้าและอัปเดตสต็อกเรียบร้อย (คำนวณต้นทุนเฉลี่ยสุทธิให้อัตโนมัติ)");
    } catch (e) { console.error(e); }
  };

  const handleSettingsLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1048576) { 
          window.alert("ไฟล์รูปภาพต้องมีขนาดไม่เกิน 1MB");
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({ ...prev, logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSettingsSignatureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1048576) { 
          window.alert("ไฟล์รูปภาพต้องมีขนาดไม่เกิน 1MB");
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({ ...prev, signature: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
       await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'general'), settings);
       setSettingsModalOpen(false);
       window.alert("บันทึกการตั้งค่าเรียบร้อย");
    } catch(err) { console.error(err); }
  };

  const formatMonthYear = (dateStr) => {
    if (!dateStr) return '';
    const [y, m] = dateStr.split('-');
    const monthIndex = parseInt(m) - 1;
    const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${thaiMonths[monthIndex]} ${parseInt(y) + 543}`;
  };

  useEffect(() => {
    const initAuth = async () => {
        try {
            await signInAnonymously(auth);
            setAuthStatus('success');
        } catch (err) {
            setAuthStatus('error');
            setAuthErrorMessage(err.message);
        }
    };
    initAuth();
    const unsubAuth = onAuthStateChanged(auth, setUser);
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const p = (c) => collection(db, 'artifacts', appId, 'public', 'data', c);
    const uP = onSnapshot(p('products'), s => { setProducts(s.docs.map(d => ({ ...d.data(), id: d.id }))); setLoading(false); }, () => setLoading(false));
    const uL = onSnapshot(p('lots'), s => setLots(s.docs.map(d => ({ ...d.data(), id: d.id }))));
    const uC = onSnapshot(p('contacts'), s => setContacts(s.docs.map(d => ({ ...d.data(), id: d.id }))));
    const uT = onSnapshot(query(p('transactions'), orderBy('date', 'desc'), limit(200)), s => setTransactions(s.docs.map(d => ({ ...d.data(), id: d.id }))));
    const uS = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'general'), (docSnap) => {
        if (docSnap.exists()) {
            setSettings(prev => ({ ...prev, ...docSnap.data() }));
        }
    });

    return () => { uP(); uL(); uC(); uT(); uS(); };
  }, [user, appId]);

  if (loading && user) return <div className="h-screen w-full flex items-center justify-center bg-[#FDFCF8]"><Loader2 className="animate-spin text-[#B3543D]" size={40}/></div>;

  return (
    <div className="flex h-screen h-[100dvh] w-full text-[#433D3C] overflow-hidden bg-[#FDFCF8]">
      <GlobalStyles />
      <Sidebar 
        currentView={view} 
        setView={setView} 
        iDevMode={isDevMode} 
        handleToggleMode={handleToggleMode} 
        currentAppId={appId} 
        openSettings={() => setSettingsModalOpen(true)}
        settingsData={settings}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-[#FDFCF8]">
        <header className="h-20 bg-white/50 backdrop-blur-md border-b border-[#D7BA9D]/20 flex items-center justify-between px-10 shrink-0 no-print">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.2em] text-[#8B8A73]">{view}</h2>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B8A73]" size={16} />
            <input type="text" placeholder="ค้นหาด้วย Ref ABB หรือ Order ID..." className="pl-11 pr-5 py-2.5 bg-white border border-[#D7BA9D]/30 rounded-2xl text-[14px] w-80 outline-none focus:border-[#B3543D] transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {view === 'pos' && (
             <div className="flex flex-col xl:flex-row gap-8 h-full w-full animate-in fade-in duration-300">
             <div className="flex-1 space-y-8">
               <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                 {Object.keys(channelConfig).map(ch => (
                   <button key={ch} onClick={() => setSalesChannel(ch)} className={`flex-shrink-0 flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all font-bold text-sm ${salesChannel === ch ? 'bg-white text-[#B3543D] border-[#B3543D] shadow-sm' : 'bg-[#F5F0E6] text-[#8B8A73] border-transparent hover:bg-white'}`}>
                     {React.createElement(channelConfig[ch].brandIcon, { size: 18 })} {ch}
                   </button>
                 ))}
               </div>
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5">
                 {products?.filter(p => (safeStr(p.name)).toLowerCase().includes(searchTerm.toLowerCase())).map(product => {
                   const info = inventorySummary.find(i => i.id === product.id);
                   return (
                     <div key={product.id} onClick={() => addToCart(product)} className={`bg-white p-4 rounded-[32px] border border-[#D7BA9D]/20 hover:border-[#B3543D]/50 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 group ${info?.remaining <= 0 ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                       <div className="w-full aspect-square bg-[#F5F0E6] rounded-[24px] flex items-center justify-center text-[#B3543D] mb-4 overflow-hidden relative">
                           {product.image ? (
                               <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                           ) : (
                               <Box size={40} className="opacity-40"/>
                           )}
                       </div>
                       <h4 className="font-bold text-[15px] mb-1 truncate leading-tight text-[#433D3C]">{safeStr(product.name)}</h4>
                       <div className="flex justify-between items-center mt-3">
                         <span className="text-lg font-extrabold text-[#B3543D]">฿{Number(product.price || 0).toLocaleString()}</span>
                         <div className={`text-[11px] font-bold px-2 py-1 rounded-lg ${info?.remaining < (product.minStock || 5) ? 'bg-red-50 text-red-500' : 'bg-[#F5F0E6] text-[#8B8A73]'}`}>
                            Stock: {info?.remaining || 0}
                         </div>
                       </div>
                     </div>
                   );
                 })}
               </div>
             </div>

             <div className="w-full xl:w-[450px] 2xl:w-[500px] bg-white rounded-[40px] border border-[#D7BA9D]/20 flex flex-col shadow-xl shrink-0">
               <div className="p-7 border-b border-[#F5F0E6] flex items-center justify-between">
                   <div className="flex items-center gap-3"><ShoppingCart className="text-[#B3543D]" size={22} /><h3 className="font-extrabold text-lg">รายการขายปัจจุบัน</h3></div>
                   <span className="bg-[#B3543D]/10 text-[#B3543D] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{salesChannel}</span>
               </div>
               
               <div className="flex-1 p-7 space-y-6 overflow-y-auto custom-scrollbar bg-white">
                 {cart?.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center py-20 opacity-30">
                       <ShoppingBag size={48} className="mb-4 text-[#8B8A73]" />
                       <p className="text-center text-[#8B8A73] text-[15px] italic">ไม่มีสินค้าในตะกร้า</p> 
                   </div>
                 ) : cart?.map(item => (
                   <div key={item.id} className="flex justify-between items-center bg-[#FDFCF8] p-4 rounded-[24px] border border-[#F5F0E6]">
                     <div className="min-w-0 pr-3">
                       <p className="font-bold text-[14px] truncate mb-0.5">{safeStr(item.name)}</p>
                       <p className="text-[15px] text-[#B3543D] font-extrabold">฿{Number(item.price || 0).toLocaleString()}</p>
                     </div>
                     <div className="flex items-center gap-3 bg-white p-1 rounded-xl shadow-sm border border-[#F5F0E6]">
                       <button onClick={() => setCart(cart.map(c => c.id === item.id ? {...c, qty: Math.max(0, c.qty - 1)} : c).filter(c => c.qty > 0))} className="w-8 h-8 rounded-lg bg-[#FDFCF8] hover:bg-[#F5F0E6] text-sm font-bold transition-all text-[#8B8A73]">-</button>
                       <span className="text-[14px] font-extrabold w-6 text-center">{item.qty}</span>
                       <button onClick={() => addToCart(item)} className="w-8 h-8 rounded-lg bg-[#FDFCF8] hover:bg-[#F5F0E6] text-sm font-bold transition-all text-[#B3543D]">+</button>
                     </div>
                   </div>
                 ))}
                 
                 {cart?.length > 0 && (
                   <div className="pt-6 border-t border-[#F5F0E6] space-y-6">
                     <div className="space-y-4">
                         <p className="text-[10px] font-black text-[#8B8A73] uppercase tracking-widest flex items-center gap-2"><Hash size={12}/> Order Reference</p>
                         <div className="relative">
                           <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D7BA9D]" size={14} />
                           <input 
                               type="text" 
                               className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl pl-9 pr-3 py-2.5 text-[14px] font-bold outline-none focus:border-[#B3543D]" 
                               value={orderId} 
                               onChange={e => setOrderId(e.target.value)} 
                               placeholder="Order ID / เลขอ้างอิง..."
                           />
                         </div>
                     </div>

                     <div className="space-y-4">
                         <p className="text-[10px] font-black text-[#8B8A73] uppercase tracking-widest flex items-center gap-2"><Percent size={12}/> Tax Configuration</p>
                         <div className="grid grid-cols-3 gap-2 bg-[#FDFCF8] p-1.5 rounded-2xl border border-[#F5F0E6]">
                               {[
                                   { id: 'none', label: 'No VAT' },
                                   { id: 'include', label: 'Inc. 7%' },
                                   { id: 'exclude', label: 'Exc. 7%' }
                               ].map(type => (
                                   <button 
                                       key={type.id} 
                                       onClick={() => setPosVatType(type.id)}
                                       className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all ${posVatType === type.id ? 'bg-[#B3543D] text-white shadow-md' : 'text-[#8B8A73] hover:bg-white'}`}
                                   >
                                       {type.label}
                                   </button>
                               ))}
                         </div>
                     </div>

                     <div className="space-y-4">
                         <p className="text-[10px] font-black text-[#8B8A73] uppercase tracking-widest flex items-center gap-2"><Globe size={12}/> Platform & Logistics Details</p>
                         <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1.5">
                                 <label className="text-[11px] font-bold text-[#8B8A73] ml-1">Platform Fee</label>
                                 <div className="relative">
                                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-red-300">฿</span>
                                     <input type="number" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl pl-7 pr-3 py-2.5 text-[14px] font-bold text-red-500 outline-none" value={platformFee} onChange={e => setPlatformFee(e.target.value)} placeholder="0" />
                                 </div>
                             </div>
                             <div className="space-y-1.5">
                                 <label className="text-[11px] font-bold text-[#8B8A73] ml-1">Shipping (Charged)</label>
                                 <div className="relative">
                                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-green-300">฿</span>
                                     <input type="number" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl pl-7 pr-3 py-2.5 text-[14px] font-bold text-green-600 outline-none" value={shippingIncome} onChange={e => setShippingIncome(e.target.value)} placeholder="เรียกเก็บลูกค้า" />
                                 </div>
                             </div>
                             <div className="space-y-1.5">
                                 <label className="text-[11px] font-bold text-[#8B8A73] ml-1">Actual Ship Cost</label>
                                 <div className="relative">
                                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-red-300">฿</span>
                                     <input type="number" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl pl-7 pr-3 py-2.5 text-[14px] font-bold text-red-500 outline-none" value={actualShippingCost} onChange={e => setActualShippingCost(e.target.value)} placeholder="ต้นทุนจริง" />
                                 </div>
                             </div>
                             <div className="space-y-1.5">
                                 <label className="text-[11px] font-bold text-[#8B8A73] ml-1">Order Discount</label>
                                 <div className="relative">
                                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-red-300">฿</span>
                                     <input type="number" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl pl-7 pr-3 py-2.5 text-[14px] font-bold text-red-500 outline-none" value={discountAmount} onChange={e => setDiscountAmount(e.target.value)} placeholder="ส่วนลดบิล" />
                                 </div>
                             </div>
                             <div className="space-y-1.5">
                                 <label className="text-[11px] font-bold text-[#8B8A73] ml-1">Cash Coupon</label>
                                 <div className="relative">
                                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-300">฿</span>
                                     <input type="number" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl pl-7 pr-3 py-2.5 text-[14px] font-bold text-blue-500 outline-none" value={cashCoupon} onChange={e => setCashCoupon(e.target.value)} placeholder="คูปองเงินสด" />
                                 </div>
                             </div>
                         </div>
                     </div>

                     <div className="space-y-4">
                         <p className="text-[10px] font-black text-[#8B8A73] uppercase tracking-widest flex items-center gap-2"><Calculator size={12}/> Adjustments</p>
                         <div className="flex gap-4">
                             <div className="flex-1 space-y-1.5">
                                 <input type="number" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-4 py-2.5 text-[14px] font-bold text-blue-600 outline-none" value={posAdjustment} onChange={e => setPosAdjustment(e.target.value)} placeholder="ปรับปรุงยอด (+/-)" />
                             </div>
                         </div>
                     </div>

                     <div className="flex items-center justify-between p-4 bg-[#FDFCF8] border border-[#D7BA9D]/20 rounded-3xl">
                         <div className="flex items-center gap-3 text-[14px] font-bold"><UserCheck size={20} className={isFullTax ? 'text-[#B3543D]' : 'text-[#8B8A73]'} /> ใบกำกับภาษีเต็มรูป</div>
                         <button onClick={() => setIsFullTax(!isFullTax)} className={`w-12 h-6 rounded-full relative transition-all duration-300 ${isFullTax ? 'bg-[#B3543D]' : 'bg-[#D7BA9D]'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-300 ${isFullTax ? 'left-7' : 'left-1'}`} /></button>
                     </div>
                     
                     {isFullTax && (
                       <div className="space-y-3 animate-in slide-in-from-top-4 duration-300">
                         <button onClick={() => setCustomerPickerOpen(true)} className="w-full flex items-center justify-between bg-white border border-[#D7BA9D]/30 rounded-2xl px-5 py-3 text-[13px] text-[#8B8A73] font-bold hover:border-[#B3543D] transition-all"><span>{safeStr(customerInfo.name) || "เลือกข้อมูลลูกค้าจาก CRM"}</span><ChevronRight size={16}/></button>
                         <input type="text" placeholder="ระบุชื่อลูกค้า (Manual)" className="w-full bg-white border border-[#D7BA9D]/30 rounded-2xl px-5 py-3 text-[13px] font-bold outline-none focus:border-[#B3543D]" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} />
                       </div>
                     )}
                   </div>
                 )}
               </div>

               <div className="p-8 bg-[#F5F0E6]/50 rounded-b-[40px] border-t border-[#F5F0E6] space-y-4 shadow-inner no-print">
                 <div className="space-y-3">
                     <div className="flex justify-between items-center text-[#8B8A73] text-xs font-medium">
                       <span>ยอดรวมสินค้า (Subtotal)</span>
                       <span>฿{derivedValues.totalProductPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                     </div>
                     {derivedValues.discount > 0 && (
                       <div className="flex justify-between items-center text-red-500 text-xs font-medium">
                           <span>ส่วนลด (Discount)</span>
                           <span>-฿{derivedValues.discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                       </div>
                     )}
                     {derivedValues.shipping > 0 && (
                       <div className="flex justify-between items-center text-[#8B8A73] text-xs font-medium">
                           <span>ค่าขนส่ง (Shipping)</span>
                           <span>฿{derivedValues.shipping.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                       </div>
                     )}

                     <div className="border-t border-dashed border-[#D7BA9D]/50 my-2 pt-2 space-y-1">
                         <div className="flex justify-between items-center text-[#8B8A73] text-[10px]">
                           <span>ราคาก่อนภาษี (Before VAT)</span>
                           <span>฿{derivedValues.beforeVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                         </div>
                         <div className="flex justify-between items-center text-[#8B8A73] text-[10px]">
                           <span>ภาษีมูลค่าเพิ่ม (VAT 7%)</span>
                           <span>฿{derivedValues.vat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                         </div>
                     </div>

                     <div className="flex justify-between items-center text-[#433D3C] text-sm font-bold border-t border-[#F5F0E6] pt-2">
                       <span>ยอดรวมทั้งสิ้น (Grand Total)</span>
                       <span>฿{derivedValues.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                     </div>
                     
                     {derivedValues.coupon > 0 && (
                         <div className="flex justify-between items-center text-blue-500 text-sm font-bold">
                           <span className="flex items-center gap-1"><Tag size={12}/> หักคูปอง (Coupon)</span>
                           <span>-฿{derivedValues.coupon.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                         </div>
                     )}

                     <div className="flex justify-between items-center pt-2">
                       <span className="text-[16px] font-black text-[#433D3C] flex items-center gap-2 uppercase tracking-tighter">Net Payable <CheckCircle2 size={18} className="text-green-600"/></span>
                       <span className="text-3xl font-black text-[#B3543D]">฿{derivedValues.netPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                     </div>
                 </div>
                 <button onClick={handleCheckout} disabled={cart?.length === 0} className="w-full bg-[#B3543D] text-white py-5 rounded-[24px] text-lg font-extrabold shadow-xl hover:bg-[#963F2C] transition-all disabled:opacity-50">ยืนยันรายการขาย</button>
               </div>
             </div>
           </div>
          )}

          {view === 'contacts' && (
            <div className="w-full space-y-10 animate-in fade-in duration-300 text-[#433D3C]">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                    <div className="space-y-2">
                        <h3 className="text-3xl font-black tracking-tight">ฐานข้อมูล CRM Pro</h3>
                        <p className="text-[15px] text-[#8B8A73] font-medium leading-relaxed">วิเคราะห์พฤติกรรมการซื้อและบริหารความสัมพันธ์รายบุคคลอย่างมืออาชีพ</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-[#F5F0E6] p-1 rounded-xl w-fit shadow-inner">
                          {[
                              { id: 'all', label: 'ทั้งหมด' },
                              { id: 'customer', label: 'ลูกค้า' },
                              { id: 'vendor', label: 'คู่ค้า' }
                          ].map(t => (
                              <button key={t.id} onClick={() => setCrmTypeFilter(t.id)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${crmTypeFilter === t.id ? 'bg-white text-[#B3543D] shadow-sm' : 'text-[#8B8A73] hover:text-[#433D3C]'}`}>
                                  {t.label}
                              </button>
                          ))}
                      </div>
                      <button onClick={handleExportContactsXLSX} className="px-3 py-2 rounded-lg text-xs font-bold transition-all bg-[#433D3C] text-white hover:bg-[#2A2A2A] shadow-md flex items-center gap-1.5">
                          <FileSpreadsheet size={14}/> Export .xlsx
                      </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                    {contacts?.filter(c => (crmTypeFilter === 'all' || c.type === crmTypeFilter) && ((safeStr(c.name)).toLowerCase().includes(searchTerm.toLowerCase()))).map(c => {
                        const stats = contactStats[c.name] || { spent: 0, count: 0 };
                        return (
                            <div key={c.id} className="bg-white p-7 rounded-[40px] border border-[#D7BA9D]/20 shadow-sm hover:shadow-2xl hover:border-[#B3543D]/30 transition-all group flex flex-col justify-between h-full">
                                <div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${c.type === 'customer' ? 'bg-blue-50 text-blue-500' : 'bg-amber-50 text-amber-600'}`}>
                                            {c.type === 'customer' ? <Users2 size={28}/> : <Truck size={28}/>}
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${c.type === 'customer' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-700'}`}>{c.type}</span>
                                            {stats.spent > 5000 && <div className="mt-1.5 flex items-center justify-end gap-1 text-[11px] text-[#B3543D] font-black uppercase"><Zap size={11} fill="currentColor"/> High Value</div>}
                                        </div>
                                    </div>
                                    <h4 className="font-extrabold text-[18px] mb-1 truncate leading-tight">{safeStr(c.name)}</h4>
                                    <p className="text-[11px] text-[#8B8A73] font-mono mb-5 tracking-wide">ID: {safeStr(c.taxId) || 'N/A'}</p>
                                    
                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        <div className="bg-[#FDFCF8] p-4 rounded-3xl border border-[#F5F0E6]">
                                            <p className="text-[10px] text-[#8B8A73] uppercase font-black mb-1">Total Spent</p>
                                            <p className="text-[15px] font-extrabold text-[#B3543D]">฿{Number(stats.spent || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="bg-[#FDFCF8] p-4 rounded-3xl border border-[#F5F0E6]">
                                            <p className="text-[10px] text-[#8B8A73] uppercase font-black mb-1">Orders</p>
                                            <p className="text-[15px] font-extrabold">{stats.count}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-5 border-t border-[#F5F0E6] flex justify-between items-center">
                                    <button 
                                      onClick={() => { setNewContact({...c, id: c.id}); setContactModalOpen(true); }}
                                      className="text-[12px] font-extrabold text-[#8B8A73] hover:text-[#B3543D] flex items-center gap-1.5 transition-colors"
                                    >
                                      <Eye size={16}/> Profile
                                    </button>
                                    <div className="flex gap-1.5">
                                        <button 
                                          onClick={() => { setNewContact({...c, id: c.id}); setContactModalOpen(true); }}
                                          className="p-2.5 hover:bg-[#F5F0E6] rounded-full text-[#8B8A73] transition-colors"
                                        >
                                          <Edit2 size={16}/>
                                        </button>
                                        <button 
                                          className="p-2.5 hover:bg-red-50 rounded-full text-red-400 transition-colors" 
                                          onClick={() => { setDeletingContactId(c.id); setDeleteContactConfirmOpen(true); }}
                                        >
                                          <Trash2 size={16}/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <button onClick={() => setContactModalOpen(true)} className="fixed bottom-12 right-12 w-18 h-18 bg-[#B3543D] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-all z-40 p-5"><Plus size={36}/></button>
            </div>
          )}

          {view === 'inventory' && (
            <div className="w-full space-y-8 animate-in fade-in duration-300 text-[#433D3C]">
               <div className="flex justify-between items-center no-print">
                 <div className="flex items-center gap-4">
                    {selectedProductId && <button onClick={() => setSelectedProductId(null)} className="p-3 bg-white border border-[#D7BA9D]/30 rounded-2xl hover:bg-[#F5F0E6] transition-all"><ArrowLeft size={20} /></button>}
                    <h3 className="text-2xl font-black">{selectedProductId ? "Batch & Lot Details" : "Stock Master Control"}</h3>
                 </div>
                 <div className="flex gap-3 font-bold">
                    <div className="relative">
                        <button onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} className="flex items-center gap-2.5 bg-[#433D3C] text-white px-4 py-3 rounded-2xl text-[14px] shadow-lg hover:bg-[#2A2A2A] transition-all">
                            <FileSpreadsheet size={18}/> Export .xlsx
                        </button>
                        {isExportMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-20" onClick={() => setIsExportMenuOpen(false)}></div>
                                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-[#D7BA9D]/30 py-2 z-30 animate-in fade-in zoom-in-95 duration-200">
                                    <button onClick={handleExportStockXLSX} className="w-full text-left px-4 py-3 hover:bg-[#F5F0E6] text-sm font-bold text-[#433D3C] flex items-center gap-3">
                                        <FileText size={16} className="text-[#B3543D]"/> Export Stock Balance
                                    </button>
                                    <button onClick={handleExportMovementXLSX} className="w-full text-left px-4 py-3 hover:bg-[#F5F0E6] text-sm font-bold text-[#433D3C] flex items-center gap-3">
                                        <FileDown size={16} className="text-[#B3543D]"/> Export Movement Report
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                    <button onClick={() => setProductModalOpen(true)} className="flex items-center gap-2.5 bg-white border border-[#D7BA9D]/30 px-6 py-3 rounded-2xl text-[14px] hover:bg-[#F5F0E6] transition-all shadow-sm"><Plus size={18}/> เพิ่มรายการสินค้า</button>
                    <button onClick={() => setStockModalOpen(true)} className="flex items-center gap-2.5 bg-[#B3543D] text-white px-6 py-3 rounded-2xl text-[14px] shadow-lg hover:shadow-xl transition-all"><Package size={18}/> รับสินค้าเข้าคลัง</button>
                 </div>
               </div>

               <div className="flex items-center gap-2 mb-6 bg-[#F5F0E6] p-1 rounded-xl w-fit no-print">
                    <button 
                        onClick={() => setInventoryTab('overview')} 
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${inventoryTab === 'overview' ? 'bg-white text-[#B3543D] shadow-sm' : 'text-[#8B8A73] hover:text-[#433D3C]'}`}
                    >
                        <Box size={16}/> Stock Control
                    </button>
                    <button 
                        onClick={() => setInventoryTab('movement')} 
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${inventoryTab === 'movement' ? 'bg-white text-[#B3543D] shadow-sm' : 'text-[#8B8A73] hover:text-[#433D3C]'}`}
                    >
                        <ClipboardList size={16}/> Movement Report (บัญชี)
                    </button>
               </div>

               {inventoryTab === 'overview' ? (
                   <div className="bg-white rounded-[40px] border border-[#D7BA9D]/20 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                      <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-[#F5F0E6]/50 border-b text-[11px] font-black text-[#8B8A73] uppercase tracking-widest">
                          <tr><th className="px-8 py-6 w-16 text-center">ID</th><th className="px-8 py-6">Description</th><th className="px-8 py-6 text-right">Qty Balance</th><th className="px-8 py-6 text-right">{selectedProductId ? 'Unit Cost' : 'Avg. Cost'}</th><th className="px-8 py-6 text-right">Valuation</th><th className="px-8 py-6 text-center w-32">Actions</th></tr>
                        </thead>
                        <tbody className="divide-y divide-[#F5F0E6] text-[14px]">
                          {selectedProductId ? (
                            lots?.filter(l => l.productId === selectedProductId).map((l, i) => (
                              <tr key={i} className="hover:bg-[#FDFCF8] group transition-colors">
                                <td className="px-8 py-5 text-[#8B8A73] font-mono text-center">{i+1}</td>
                                <td className="px-8 py-5">
                                    <p className="font-bold text-[#433D3C]">Lot: {safeStr(l.lotNo)}</p>
                                    <p className="text-xs text-[#8B8A73] mt-1 font-mono">Date Received: {safeDate(l.receiveDate)}</p>
                                </td>
                                <td className="px-8 py-5 text-right font-extrabold text-[#606C38]">{l.remainingQty}</td>
                                <td className="px-8 py-5 text-right font-mono text-[#8B8A73]">฿{Number(l.cost || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                <td className="px-8 py-5 text-right font-bold">฿{(Number(l.remainingQty) * Number(l.cost || 0)).toLocaleString()}</td>
                                <td className="px-8 py-5 text-center"> - </td>
                              </tr>
                            ))
                          ) : (
                            inventorySummary?.map(p => (
                              <tr key={p.id} className="hover:bg-[#FDFCF8] group transition-colors">
                                <td className="px-8 py-6 text-[#8B8A73] font-mono text-center">{p.index}</td>
                                <td className="px-8 py-6">
                                    <div className="font-bold text-[15px] group-hover:text-[#B3543D] transition-colors">{safeStr(p.name)}</div>
                                    <div className="text-[11px] text-[#B3543D] font-mono mt-1 font-bold uppercase tracking-wider">{safeStr(p.sku) || 'No SKU'}</div>
                                </td>
                                <td className="px-8 py-6 text-right font-bold text-lg">{p.remaining} <span className="text-xs font-medium text-[#8B8A73] ml-1">{p.uom}</span></td>
                                <td className="px-8 py-6 text-right font-mono text-[#8B8A73] text-xs">฿{(p.remaining > 0 ? p.totalValue / p.remaining : Number(p.cost || 0)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                <td className="px-8 py-6 text-right font-black text-[#B3543D] text-[16px]">฿{Number(p.totalValue || 0).toLocaleString()}</td>
                                <td className="px-8 py-6 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      <button onClick={() => setSelectedProductId(p.id)} className="p-2 hover:bg-[#F5F0E6] rounded-full text-[#8B8A73] transition-colors" title="ดูรายละเอียด Lots"><Eye size={18}/></button>
                                      <button onClick={() => { setNewProduct({...p, id: p.id}); setProductModalOpen(true); }} className="p-2 hover:bg-[#F5F0E6] rounded-full text-[#8B8A73] transition-colors" title="แก้ไขสินค้า"><Edit2 size={18}/></button>
                                      <button onClick={(e) => { e.stopPropagation(); setDeletingProdId(p.id); setDeleteProdConfirmOpen(true); }} className="p-2 hover:bg-red-50 rounded-full text-red-400 transition-colors" title="ลบสินค้า"><Trash2 size={18}/></button>
                                    </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                      </div>
                   </div>
               ) : (
                   <div className="bg-white rounded-[40px] border border-[#D7BA9D]/20 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                      <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead className="bg-[#F5F0E6]/50 border-b text-[11px] font-black text-[#8B8A73] uppercase tracking-widest">
                              <tr>
                                <th className="px-8 py-6">สินค้า (Product)</th>
                                <th className="px-8 py-6">SKU</th>
                                <th className="px-8 py-6 text-right text-green-600">ยอดรับเข้า (Total In)</th>
                                <th className="px-8 py-6 text-right text-red-500">ยอดขายออก (Total Out)</th>
                                <th className="px-8 py-6 text-right text-[#433D3C]">คงเหลือ (Balance)</th>
                                <th className="px-8 py-6 text-right text-[#B3543D]">มูลค่าคงเหลือ (Value)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F5F0E6] text-[14px]">
                              {stockMovementReport?.map((p, idx) => (
                                  <tr key={p.id} className="hover:bg-[#FDFCF8] group transition-colors">
                                      <td className="px-8 py-5">
                                          <div className="font-bold text-[#433D3C]">{safeStr(p.name)}</div>
                                      </td>
                                      <td className="px-8 py-5 font-mono text-xs text-[#8B8A73]">{safeStr(p.sku) || '-'}</td>
                                      <td className="px-8 py-5 text-right font-bold text-green-600">+{p.totalIn.toLocaleString()}</td>
                                      <td className="px-8 py-5 text-right font-bold text-red-500">-{p.totalOut.toLocaleString()}</td>
                                      <td className="px-8 py-5 text-right font-extrabold text-[#433D3C] bg-blue-50/50">{p.currentStock.toLocaleString()}</td>
                                      <td className="px-8 py-5 text-right font-bold text-[#B3543D]">฿{p.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                  </tr>
                              ))}
                              {stockMovementReport?.length === 0 ? (
                                  <tr><td colSpan="6" className="p-10 text-center text-[#8B8A73] italic">ไม่พบข้อมูลสินค้า</td></tr>
                              ) : (
                                  <tr className="bg-[#FDFCF8] border-t-2 border-gray-200">
                                      <td colSpan="2" className="px-8 py-5 text-right font-black text-[#8B8A73] uppercase text-[11px] tracking-widest">รวมทั้งสิ้น (Total)</td>
                                      <td className="px-8 py-5 text-right font-black text-green-600 text-[15px]">+{stockMovementTotals.totalIn.toLocaleString()}</td>
                                      <td className="px-8 py-5 text-right font-black text-red-500 text-[15px]">-{stockMovementTotals.totalOut.toLocaleString()}</td>
                                      <td className="px-8 py-5 text-right font-black text-[#433D3C] text-[15px] bg-[#F5F0E6]/30">{stockMovementTotals.totalStock.toLocaleString()}</td>
                                      <td className="px-8 py-5 text-right font-black text-[#B3543D] text-[15px] underline decoration-double">฿{stockMovementTotals.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                  </tr>
                              )}
                            </tbody>
                          </table>
                      </div>
                   </div>
               )}
            </div>
          )}

          {view === 'accounting' && (
             <div className="w-full space-y-10 animate-in fade-in duration-300 text-[#433D3C] no-print">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                   <div>
                       <h3 className="text-3xl font-black tracking-tight">Account Ledger</h3>
                       <p className="text-[15px] text-[#8B8A73] font-medium mt-1">บันทึกรายรับ-รายจ่าย และตรวจสอบสถานะการเงิน</p>
                   </div>
                   
                   <div className="flex flex-col items-end gap-3">
                       <div className="flex flex-wrap gap-2 items-center">
                           <div className="bg-white border border-[#D7BA9D]/30 p-1 rounded-xl flex shadow-sm">
                               {[
                                   { id: 'today', label: 'วันนี้' },
                                   { id: '7days', label: '7 วัน' },
                                   { id: '30days', label: '30 วัน' },
                                   { id: 'month', label: 'รายเดือน' },
                                   { id: 'all', label: 'ทั้งหมด' }
                               ].map(f => (
                                   <button 
                                       key={f.id}
                                       onClick={() => setLedgerTimeFilter(f.id)}
                                       className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${ledgerTimeFilter === f.id ? 'bg-[#433D3C] text-white shadow-md' : 'text-[#8B8A73] hover:bg-[#F5F0E6]'}`}
                                   >
                                       {f.label}
                                   </button>
                               ))}
                           </div>

                           {ledgerTimeFilter === 'month' && (
                               <div className="relative">
                                   <button 
                                       onClick={() => {
                                           setIsLedgerMonthPickerOpen(!isLedgerMonthPickerOpen);
                                           setLedgerPickerYear(parseInt(ledgerSelectedMonth.split('-')[0]));
                                       }}
                                       className={`flex items-center gap-2 bg-white border ${isLedgerMonthPickerOpen ? 'border-[#B3543D] ring-2 ring-[#B3543D]/10' : 'border-[#D7BA9D]/30'} pl-3 pr-4 py-1.5 rounded-xl shadow-sm hover:border-[#B3543D] transition-all text-[#433D3C]`}
                                   >
                                       <Calendar size={16} className="text-[#B3543D]" />
                                       <span className="text-xs font-bold pt-0.5">{formatMonthYear(ledgerSelectedMonth)}</span>
                                   </button>

                                   {isLedgerMonthPickerOpen && (
                                       <>
                                           <div className="fixed inset-0 z-30" onClick={() => setIsLedgerMonthPickerOpen(false)} />
                                           <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#D7BA9D]/30 p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                                               <div className="flex justify-between items-center mb-4">
                                                   <button onClick={() => setLedgerPickerYear(ledgerPickerYear - 1)} className="p-1 hover:bg-[#F5F0E6] rounded-lg text-[#8B8A73] transition-colors"><ChevronLeft size={18}/></button>
                                                   <span className="font-black text-lg text-[#433D3C]">{ledgerPickerYear + 543}</span>
                                                   <button onClick={() => setLedgerPickerYear(ledgerPickerYear + 1)} className="p-1 hover:bg-[#F5F0E6] rounded-lg text-[#8B8A73] transition-colors"><ChevronRight size={18}/></button>
                                               </div>
                                               <div className="grid grid-cols-3 gap-2">
                                                   {['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'].map((m, i) => {
                                                       const monthNum = String(i + 1).padStart(2, '0');
                                                       const isSelected = ledgerSelectedMonth === `${ledgerPickerYear}-${monthNum}`;
                                                       return (
                                                           <button
                                                               key={m}
                                                               onClick={() => {
                                                                   setLedgerSelectedMonth(`${ledgerPickerYear}-${monthNum}`);
                                                                   setIsLedgerMonthPickerOpen(false);
                                                               }}
                                                               className={`py-2 rounded-xl text-xs font-bold transition-all ${isSelected ? 'bg-[#B3543D] text-white shadow-md' : 'bg-[#FDFCF8] text-[#8B8A73] hover:bg-[#F5F0E6] hover:text-[#433D3C]'}`}
                                                           >
                                                               {m}
                                                           </button>
                                                       );
                                                   })}
                                               </div>
                                           </div>
                                       </>
                                   )}
                               </div>
                           )}
                       </div>

                       <div className="flex gap-2 w-full justify-end">
                           <div className="bg-white border border-[#D7BA9D]/30 p-1 rounded-xl flex shadow-sm">
                               {[
                                   { id: 'all', label: 'ทั้งหมด' },
                                   { id: 'income', label: 'รายรับ' },
                                   { id: 'expense', label: 'รายจ่าย' }
                               ].map(t => (
                                   <button
                                       key={t.id}
                                       onClick={() => setLedgerTypeFilter(t.id)}
                                       className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${ledgerTypeFilter === t.id ? (t.id === 'income' ? 'bg-green-600 text-white' : t.id === 'expense' ? 'bg-red-500 text-white' : 'bg-[#433D3C] text-white') + ' shadow-md' : 'text-[#8B8A73] hover:bg-[#F5F0E6]'}`}
                                   >
                                       {t.label}
                                   </button>
                               ))}
                           </div>
                           <button onClick={() => setLedgerExportModalOpen(true)} className="flex items-center gap-2 bg-[#433D3C] text-white px-4 py-2 rounded-xl text-[13px] font-bold shadow-md hover:bg-[#2A2A2A] transition-all">
                             <FileSpreadsheet size={16}/> Export .xlsx
                           </button>
                           <button onClick={() => setExpenseModalOpen(true)} className="flex items-center gap-2 bg-[#B3543D] text-white px-4 py-2 rounded-xl text-[13px] font-bold shadow-md hover:bg-[#963F2C] transition-all">
                             <Plus size={16}/> บันทึกรายจ่าย
                           </button>
                       </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                   <div className="bg-white p-8 rounded-[40px] border border-[#D7BA9D]/20 shadow-sm text-center transform transition-transform hover:-translate-y-1">
                       <p className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest mb-2">Cash Inflow</p>
                       <h4 className="text-3xl text-[#606C38] font-black">฿{accSummary.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
                   </div>
                   <div className="bg-white p-8 rounded-[40px] border border-[#D7BA9D]/20 shadow-sm text-center transform transition-transform hover:-translate-y-1">
                       <p className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest mb-2">Cash Outflow</p>
                       <h4 className="text-3xl text-[#B3543D] font-black">฿{accSummary.expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
                   </div>
                   <div className="bg-white p-8 rounded-[40px] border border-[#D7BA9D]/20 shadow-sm text-center transform transition-transform hover:-translate-y-1">
                       <p className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest mb-2">Cash Coupon</p>
                       <h4 className="text-3xl text-blue-500 font-black">฿{accSummary.coupons.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
                   </div>
                   <div className="bg-[#433D3C] text-white p-8 rounded-[40px] shadow-2xl text-center transform transition-transform hover:-translate-y-1">
                       <p className="text-[11px] opacity-70 font-black uppercase tracking-widest mb-2">Operating Profit</p>
                       <h4 className="text-3xl font-black text-white">฿{accSummary.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
                   </div>
                </div>
                <div className="bg-white rounded-[48px] border border-[#D7BA9D]/20 shadow-xl overflow-hidden">
                   <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead className="bg-[#F5F0E6]/30 text-[11px] font-black text-[#8B8A73] uppercase tracking-widest border-b">
                         <tr><th className="px-6 py-7">Execution Date</th><th className="px-6 py-7">Description & Details</th><th className="px-6 py-7 text-right">Net Impact</th><th className="px-6 py-7 text-center">Actions</th></tr>
                      </thead>
                      <tbody className="divide-y divide-[#F5F0E6] text-sm">
                         {filteredLedgerData.length === 0 && (
                             <tr><td colSpan="4" className="p-10 text-center text-[#8B8A73] italic">ไม่พบรายการในช่วงเวลาที่เลือก</td></tr>
                         )}
                         {filteredLedgerData?.map(t => (
                            <tr key={t.id} className="hover:bg-[#FDFCF8] transition-colors group">
                                <td className="px-6 py-6 text-[#8B8A73] font-mono text-xs font-bold">{safeDate(t.date)}</td>
                                <td className="px-6 py-6">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-[#433D3C]">{safeStr(t.category)}</span>
                                        <span className="text-[#8B8A73] mx-1">|</span>
                                        <span className="text-[13px] font-semibold text-[#8B8A73]">{safeStr(t.customer)}</span>
                                        {t.channel && <span className="bg-[#B3543D]/5 text-[#B3543D] px-2 py-0.5 rounded text-[9px] font-black uppercase">{t.channel}</span>}
                                    </div>
                                    <div className="mt-1 flex flex-wrap gap-2 items-center">
                                        {t.abbNo && <span className="text-[9px] bg-[#606C38]/10 text-[#606C38] px-1.5 py-0.5 rounded font-black tracking-tighter uppercase">ABB: {t.abbNo}</span>}
                                        {t.fullTaxStatus === 'issued' && <span className="text-[9px] bg-[#B3543D]/10 text-[#B3543D] px-1.5 py-0.5 rounded font-black tracking-tighter uppercase">FULL: {t.invNo}</span>}
                                        {t.orderId && <span className="text-[10px] bg-white border border-[#D7BA9D]/30 px-1.5 py-0.5 rounded font-mono text-[#B3543D]">Platform ID: {t.orderId}</span>}
                                        {t.note && <span className="text-[11px] text-[#8B8A73] italic font-medium leading-relaxed">* {t.note}</span>}
                                    </div>
                                </td>
                                <td className={`px-6 py-6 text-right font-black text-[16px] ${t.type === 'income' ? 'text-[#606C38]' : 'text-[#B3543D]'}`}>
                                    {t.type === 'income' ? '+' : '-'} ฿{(Number(t.amount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-6">
                                    <div className="flex justify-center items-center gap-1.5">
                                        {t.type === 'income' && (
                                            <>
                                                <button onClick={() => { setLastTransaction(t); setReceiptModalOpen(true); }} className="p-2 hover:bg-[#F5F0E6] rounded-full text-[#8B8A73] transition-all" title="เรียกดูใบกำกับอย่างย่อ">
                                                    <Eye size={16}/>
                                                </button>
                                                {t.fullTaxStatus === 'issued' ? (
                                                   <button onClick={() => { setSelectedInvoice(t); setFullInvoicePreviewOpen(true); }} className="p-2 hover:bg-[#F5F0E6] rounded-full text-green-600 transition-all" title="เรียกดูใบกำกับเต็มรูป">
                                                       <FileText size={16}/>
                                                   </button>
                                                ) : (
                                                   <button 
                                                       onClick={() => { setFullTaxData({...t, taxId: '', branch: '00000', address: ''}); setFullTaxConverterOpen(true); }} 
                                                       className="p-2 hover:bg-[#F5F0E6] rounded-full text-[#B3543D] transition-all" 
                                                       title="ออกใบกำกับเต็มรูป"
                                                   >
                                                       <Building2 size={16}/>
                                                   </button>
                                                )}
                                            </>
                                        )}
                                        <button onClick={() => { setEditingTransaction(t); setEditTransactionModalOpen(true); }} className="p-2 hover:bg-[#F5F0E6] rounded-full text-[#8B8A73] transition-all" title="แก้ไข">
                                            <Edit2 size={16}/>
                                        </button>
                                        <button onClick={() => { setDeletingId(t.id); setDeleteConfirmOpen(true); }} className="p-2 hover:bg-red-50 rounded-full text-red-400 transition-all" title="ลบ">
                                            <Trash2 size={16}/>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                   </div>
                </div>
             </div>
          )}

          {view === 'tax_report' && (
            <div className="w-full space-y-8 animate-in fade-in duration-300 text-[#433D3C]">
                <div className="bg-white p-8 rounded-[40px] border border-[#D7BA9D]/20 shadow-sm space-y-5">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div className="space-y-1.5">
                            <h4 className="text-2xl font-black text-[#433D3C] tracking-tight">
                                {taxTab === 'output' ? 'รายงานภาษีขาย (Sales Tax Report)' : 'รายงานภาษีซื้อ (Purchase Tax Report)'}
                            </h4>
                            <div className="flex items-center gap-3">
                                <span className="bg-[#B3543D] text-white px-3 py-1 rounded-lg text-xs font-black">เดือนภาษี: {formatMonthYear(taxSelectedMonth)}</span>
                                <span className="text-[11px] text-[#8B8A73] font-bold uppercase tracking-widest">VAT Report System</span>
                            </div>
                        </div>
                        <div className="text-left md:text-right space-y-1">
                            <p className="text-[15px] font-black text-[#433D3C]">{settings.shopNameTh || settings.shopName}</p>
                            <p className="text-xs font-bold text-[#8B8A73]">เลขประจำตัวผู้เสียภาษี: <span className="font-mono text-[#433D3C]">{settings.taxId}</span></p>
                            <p className="text-xs font-bold text-[#8B8A73]">สถานประกอบการ: <span className="text-[#433D3C]">{settings.branch}</span></p>
                        </div>
                    </div>
                    <div className="pt-4 border-t border-[#F5F0E6] flex items-start gap-3">
                        <div className="mt-0.5 text-[#B3543D]"><MapPin size={16}/></div>
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-black text-[#8B8A73] uppercase tracking-widest">ที่อยู่จดทะเบียนสถานประกอบการ</p>
                            <p className="text-xs font-medium text-[#433D3C] leading-relaxed">{settings.address}</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print">
                    <div>
                        <h3 className="text-xl font-black tracking-tight">ตัวเลือกการแสดงผล</h3>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                         <div className="flex items-center gap-2">
                             <div className="bg-[#F5F0E6] p-1 rounded-xl flex shadow-inner">
                                 <button onClick={() => setTaxTab('output')} className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${taxTab === 'output' ? 'bg-white text-[#B3543D] shadow-sm' : 'text-[#8B8A73] hover:text-[#433D3C]'}`}>ภาษีขาย (Sales)</button>
                                 <button onClick={() => setTaxTab('input')} className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${taxTab === 'input' ? 'bg-white text-[#B3543D] shadow-sm' : 'text-[#8B8A73] hover:text-[#433D3C]'}`}>ภาษีซื้อ (Purchase)</button>
                             </div>
                             <div className="relative">
                                 <button 
                                     onClick={() => {
                                         setIsTaxMonthPickerOpen(!isTaxMonthPickerOpen);
                                         setTaxPickerYear(parseInt(taxSelectedMonth.split('-')[0]));
                                     }}
                                     className={`flex items-center gap-2 bg-white border ${isTaxMonthPickerOpen ? 'border-[#B3543D] ring-2 ring-[#B3543D]/10' : 'border-[#D7BA9D]/30'} pl-3 pr-4 py-2 rounded-xl shadow-sm hover:border-[#B3543D] transition-all text-[#433D3C]`}
                                 >
                                     <Calendar size={16} className="text-[#B3543D]" />
                                     <span className="text-xs font-bold pt-0.5">{formatMonthYear(taxSelectedMonth)}</span>
                                 </button>
                                 {isTaxMonthPickerOpen && (
                                     <>
                                         <div className="fixed inset-0 z-30" onClick={() => setIsTaxMonthPickerOpen(false)} />
                                         <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#D7BA9D]/30 p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                                             <div className="flex justify-between items-center mb-4">
                                                 <button onClick={() => setTaxPickerYear(taxPickerYear - 1)} className="p-1 hover:bg-[#F5F0E6] rounded-lg text-[#8B8A73] transition-colors"><ChevronLeft size={18}/></button>
                                                 <span className="font-black text-lg text-[#433D3C]">{taxPickerYear + 543}</span>
                                                 <button onClick={() => setTaxPickerYear(taxPickerYear + 1)} className="p-1 hover:bg-[#F5F0E6] rounded-lg text-[#8B8A73] transition-colors"><ChevronRight size={18}/></button>
                                             </div>
                                             <div className="grid grid-cols-3 gap-2">
                                                 {['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'].map((m, i) => {
                                                     const monthNum = String(i + 1).padStart(2, '0');
                                                     const isSelected = taxSelectedMonth === `${taxPickerYear}-${monthNum}`;
                                                     return (
                                                         <button key={m} onClick={() => { setTaxSelectedMonth(`${taxPickerYear}-${monthNum}`); setIsTaxMonthPickerOpen(false); }} className={`py-2 rounded-xl text-xs font-bold transition-all ${isSelected ? 'bg-[#B3543D] text-white shadow-md' : 'bg-[#FDFCF8] text-[#8B8A73] hover:bg-[#F5F0E6]'}`}>{m}</button>
                                                     );
                                                 })}
                                             </div>
                                         </div>
                                     </>
                                 )}
                             </div>
                         </div>
                         <button onClick={handleExportTaxReportXLSX} className="flex items-center gap-2 bg-[#433D3C] text-white px-5 py-2 rounded-xl text-xs font-black shadow-md hover:bg-[#2A2A2A] transition-all">
                             <FileSpreadsheet size={16}/> Export Tax Report (.xlsx)
                         </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="bg-white p-8 rounded-[40px] border border-[#D7BA9D]/20 shadow-sm text-center">
                        <p className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest mb-2">มูลค่าสินค้า (Tax Base)</p>
                        <h4 className="text-3xl text-[#433D3C] font-black">฿{taxReportData.totalBase.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
                     </div>
                     <div className="bg-white p-8 rounded-[40px] border border-[#D7BA9D]/20 shadow-sm text-center">
                        <p className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest mb-2">จำนวนภาษี (Total VAT 7%)</p>
                        <h4 className="text-3xl text-[#B3543D] font-black">฿{taxReportData.totalVat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
                     </div>
                </div>

                <div className="bg-white rounded-[40px] border border-[#D7BA9D]/20 shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[#F5F0E6]/50 text-[10px] font-black text-[#8B8A73] uppercase tracking-widest border-b">
                                <tr>
                                    <th className="px-6 py-5 w-24">วันที่</th>
                                    <th className="px-6 py-5">เลขที่ใบกำกับ</th>
                                    <th className="px-6 py-5">ชื่อผู้ซื้อ/ผู้ขาย</th>
                                    <th className="px-6 py-5">เลขผู้เสียภาษี</th>
                                    <th className="px-6 py-5 w-20">สาขา</th>
                                    <th className="px-6 py-5 text-right">มูลค่าสินค้า</th>
                                    <th className="px-6 py-5 text-right">ภาษีมูลค่าเพิ่ม</th>
                                    <th className="px-6 py-5 text-right">จำนวนเงินรวม</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F5F0E6]">
                                {taxReportData.list.length === 0 ? (
                                    <tr><td colSpan="8" className="p-12 text-center text-[#8B8A73] italic">ไม่พบรายการภาษีในช่วงเวลาที่เลือก</td></tr>
                                ) : (
                                    <>
                                        {taxReportData.list.map((t, idx) => {
                                            const beforeVat = Number(t.beforeVat || 0);
                                            const vatAmount = Number(t.vatAmount || 0);
                                            const rowTotal = beforeVat + vatAmount;
                                            return (
                                                <tr key={idx} className="hover:bg-[#FDFCF8] transition-colors">
                                                    <td className="px-6 py-4 font-mono text-xs">{safeDate(t.date)}</td>
                                                    <td className="px-6 py-4 font-bold text-[#433D3C]">{t.invNo || t.abbNo || t.taxInvoiceNo || '-'}</td>
                                                    <td className="px-6 py-4">{safeStr(t.customer)}</td>
                                                    <td className="px-6 py-4 font-mono text-xs">{t.fullTaxTaxId || t.taxId || '-'}</td>
                                                    <td className="px-6 py-4 font-mono text-xs">{t.fullTaxBranch || '00000'}</td>
                                                    <td className="px-6 py-4 text-right font-mono">฿{beforeVat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                    <td className="px-6 py-4 text-right font-mono font-bold text-[#B3543D]">฿{vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                    <td className="px-6 py-4 text-right font-mono font-bold text-[#433D3C]">฿{rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                </tr>
                                            );
                                        })}
                                        <tr className="bg-[#FDFCF8] border-t-2 border-gray-200">
                                            <td colSpan="5" className="px-6 py-5 text-right font-black text-[#8B8A73] uppercase text-[11px] tracking-widest">รวมทั้งสิ้น (Total)</td>
                                            <td className="px-6 py-5 text-right font-black text-[#433D3C] text-[15px] underline decoration-double">฿{taxReportData.totalBase.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="px-6 py-5 text-right font-black text-[#B3543D] text-[15px] underline decoration-double">฿{taxReportData.totalVat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="px-6 py-5 text-right font-black text-[#433D3C] text-[16px] underline decoration-double bg-[#F5F0E6]/30">฿{(taxReportData.totalBase + taxReportData.totalVat).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        </tr>
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
          )}

          {view === 'reports' && (
            <div className="w-full space-y-8 animate-in fade-in duration-300 text-[#433D3C]">
                <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                    <div>
                        <h3 className="text-3xl font-black tracking-tight text-[#433D3C]">Executive Dashboard</h3>
                        <p className="text-[15px] text-[#8B8A73] font-medium mt-2">ภาพรวมผลประกอบการและวิเคราะห์แนวโน้มธุรกิจ (Real-time)</p>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center relative">
                        <div className="bg-white border border-[#D7BA9D]/30 p-1 rounded-xl flex shadow-sm">
                            {[
                                { id: 'today', label: 'วันนี้' },
                                { id: '7days', label: '7 วัน' },
                                { id: '30days', label: '30 วัน' },
                                { id: 'month', label: 'รายเดือน' },
                                { id: 'all', label: 'ทั้งหมด' }
                            ].map(f => (
                                <button 
                                    key={f.id}
                                    onClick={() => setReportFilterType(f.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${reportFilterType === f.id ? 'bg-[#433D3C] text-white shadow-md' : 'text-[#8B8A73] hover:bg-[#F5F0E6]'}`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                        
                        {reportFilterType === 'month' && (
                            <div className="relative">
                                <button 
                                    onClick={() => {
                                        setIsMonthPickerOpen(!isMonthPickerOpen);
                                        setPickerYear(parseInt(reportSelectedMonth.split('-')[0]));
                                    }}
                                    className={`flex items-center gap-2 bg-white border ${isMonthPickerOpen ? 'border-[#B3543D] ring-2 ring-[#B3543D]/10' : 'border-[#D7BA9D]/30'} pl-3 pr-4 py-1.5 rounded-xl shadow-sm hover:border-[#B3543D] transition-all text-[#433D3C]`}
                                >
                                    <Calendar size={16} className="text-[#B3543D]" />
                                    <span className="text-xs font-bold pt-0.5">{formatMonthYear(reportSelectedMonth)}</span>
                                </button>

                                {isMonthPickerOpen && (
                                    <>
                                        <div className="fixed inset-0 z-30" onClick={() => setIsMonthPickerOpen(false)} />
                                        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#D7BA9D]/30 p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                                            <div className="flex justify-between items-center mb-4">
                                                <button onClick={() => setPickerYear(pickerYear - 1)} className="p-1 hover:bg-[#F5F0E6] rounded-lg text-[#8B8A73] transition-colors"><ChevronLeft size={18}/></button>
                                                <span className="font-black text-lg text-[#433D3C]">{pickerYear + 543}</span>
                                                <button onClick={() => setPickerYear(pickerYear + 1)} className="p-1 hover:bg-[#F5F0E6] rounded-lg text-[#8B8A73] transition-colors"><ChevronRight size={18}/></button>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                {['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'].map((m, i) => {
                                                    const monthNum = String(i + 1).padStart(2, '0');
                                                    const isSelected = reportSelectedMonth === `${pickerYear}-${monthNum}`;
                                                    return (
                                                        <button
                                                            key={m}
                                                            onClick={() => {
                                                                setReportSelectedMonth(`${pickerYear}-${monthNum}`);
                                                                setIsMonthPickerOpen(false);
                                                            }}
                                                            className={`py-2 rounded-xl text-xs font-bold transition-all ${isSelected ? 'bg-[#B3543D] text-white shadow-md' : 'bg-[#FDFCF8] text-[#8B8A73] hover:bg-[#F5F0E6] hover:text-[#433D3C]'}`}
                                                        >
                                                            {m}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
                     <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-[#D7BA9D]/20 shadow-sm flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="font-bold text-lg flex items-center gap-2"><TrendingUp size={20} className="text-[#B3543D]"/> Daily Sales Trend</h4>
                            <span className="text-xs text-[#8B8A73] font-medium bg-[#F5F0E6] px-3 py-1 rounded-full">Last 14 Days</span>
                        </div>
                        <div className="flex-1 flex items-end justify-between gap-2 h-48 w-full pt-4 pb-2 border-b border-[#D7BA9D]/30 relative">
                             {analyticsData.dailyTrend.length === 0 ? (
                                 <div className="absolute inset-0 flex items-center justify-center text-[#8B8A73] italic">ไม่มีข้อมูลการขายในช่วงนี้</div>
                             ) : (
                                 analyticsData.dailyTrend.map((d, i) => {
                                     const maxVal = Math.max(...analyticsData.dailyTrend.map(x => x.amount)) || 1;
                                     const hPercent = Math.max(5, (d.amount / maxVal) * 100);
                                     return (
                                        <div key={i} className="flex flex-col items-center flex-1 group relative">
                                            <div 
                                                className="w-full bg-[#B3543D]/80 rounded-t-lg transition-all duration-500 group-hover:bg-[#B3543D]" 
                                                style={{ height: `${hPercent}%`, minHeight: '4px' }}
                                            >
                                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#433D3C] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                                    {d.date}: ฿{d.amount.toLocaleString()}
                                                </div>
                                            </div>
                                            <span className="text-[9px] text-[#8B8A73] mt-2 font-mono rotate-0 truncate w-full text-center">{d.date.slice(5)}</span>
                                        </div>
                                     );
                                 })
                             )}
                        </div>
                     </div>

                     <div className="bg-white p-8 rounded-[40px] border border-[#D7BA9D]/20 shadow-sm flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="font-bold text-lg flex items-center gap-2"><PieChart size={20} className="text-[#B3543D]"/> Sales by Category</h4>
                        </div>
                        <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2 max-h-60">
                             {Object.entries(analyticsData.byCategory)
                                 .sort((a,b) => b[1] - a[1])
                                 .map(([cat, amt], idx) => {
                                    const percent = (amt / analyticsData.totalIncome) * 100 || 0;
                                    return (
                                        <div key={idx} className="space-y-1">
                                            <div className="flex justify-between text-xs font-bold text-[#433D3C]">
                                                <span>{cat}</span>
                                                <span>฿{amt.toLocaleString()}</span>
                                            </div>
                                            <div className="w-full bg-[#F5F0E6] rounded-full h-2.5 overflow-hidden">
                                                <div className="bg-[#B3543D] h-full rounded-full" style={{ width: `${percent}%` }}></div>
                                            </div>
                                            <div className="text-[10px] text-right text-[#8B8A73]">{percent.toFixed(1)}%</div>
                                        </div>
                                    )
                                 })
                             }
                             {Object.keys(analyticsData.byCategory).length === 0 && <div className="text-center text-[#8B8A73] italic py-10">ยังไม่มีข้อมูล</div>}
                        </div>
                     </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
                    <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-[#D7BA9D]/20 shadow-sm">
                        <div className="flex justify-between items-center mb-8">
                            <h4 className="font-bold text-lg flex items-center gap-2"><Globe size={20} className="text-[#B3543D]"/> Sales Channel Performance</h4>
                        </div>
                        <div className="space-y-6">
                            {Object.entries(analyticsData.byChannel).sort((a,b) => b[1] - a[1]).map(([chan, amt], idx) => {
                                const percent = (amt / analyticsData.totalIncome) * 100;
                                return (
                                    <div key={chan} className="space-y-2">
                                        <div className="flex justify-between text-sm font-bold text-[#433D3C]">
                                            <div className="flex items-center gap-3">
                                                <span className="w-6 text-[#8B8A73]">{idx + 1}.</span>
                                                <span>{chan}</span>
                                            </div>
                                            <span>฿{amt.toLocaleString()}</span>
                                        </div>
                                        <div className="h-3 w-full bg-[#F5F0E6] rounded-full overflow-hidden">
                                            <div className="h-full bg-[#B3543D]" style={{ width: `${percent}%` }}></div>
                                        </div>
                                    </div>
                                )
                            })}
                            {Object.keys(analyticsData.byChannel).length === 0 && <div className="text-center text-[#8B8A73] italic py-10">ยังไม่มีข้อมูลการขายในช่วงเวลานี้</div>}
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[40px] border border-[#D7BA9D]/20 shadow-sm">
                        <h4 className="font-bold text-lg flex items-center gap-2 mb-8"><Award size={20} className="text-[#B3543D]"/> Top Products</h4>
                        <div className="space-y-6">
                            {analyticsData.topSelling.map(([name, qty], idx) => (
                                <div key={idx} className="flex items-center gap-4 border-b border-[#F5F0E6] pb-4 last:border-0 last:pb-0">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${idx === 0 ? 'bg-[#B3543D] text-white shadow-lg shadow-[#B3543D]/30' : 'bg-[#F5F0E6] text-[#8B8A73]'}`}>
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-[#433D3C] truncate">{name}</p>
                                        <p className="text-[11px] text-[#8B8A73]">ขายได้ {qty} ชิ้น</p>
                                    </div>
                                </div>
                            ))}
                            {analyticsData.topSelling.length === 0 && <div className="text-center text-[#8B8A73] italic py-10">ยังไม่มีข้อมูลสินค้าขายดี</div>}
                        </div>
                    </div>
                </div>
                
                <div className="bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-[40px] p-8">
                      <h4 className="font-bold text-lg flex items-center gap-2 mb-6"><Users2 size={20} className="text-[#B3543D]"/> Top Spenders (VIP Customers)</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                         {analyticsData.topSpenders.map(([name, total], idx) => (
                            <div key={idx} className="bg-white p-5 rounded-3xl border border-[#D7BA9D]/20 flex flex-col items-center text-center gap-2 shadow-sm">
                                <div className="w-12 h-12 rounded-full bg-[#F5F0E6] flex items-center justify-center text-[#433D3C] font-black">{name.charAt(0)}</div>
                                <p className="font-bold text-sm truncate w-full">{name}</p>
                                <span className="text-[#B3543D] font-extrabold text-sm">฿{total.toLocaleString()}</span>
                            </div>
                         ))}
                          {analyticsData.topSpenders.length === 0 && <div className="col-span-full text-center text-[#8B8A73] italic py-4">ยังไม่มีข้อมูลลูกค้า</div>}
                      </div>
                </div>
            </div>
          )}

          {view === 'ai_consultant' && (
            <div className="w-full space-y-8 animate-in fade-in duration-300 text-[#433D3C]">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h3 className="text-3xl font-black tracking-tight text-[#433D3C] flex items-center gap-3"><Brain className="text-[#B3543D]" size={36}/> AI Executive Strategy Hub</h3>
                        <p className="text-[15px] text-[#8B8A73] font-medium mt-2">ที่ปรึกษา AI ระดับสูง วิเคราะห์ข้อมูลจาก บัญชี การตลาด และคลังสินค้า แบบบูรณาการ</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-[#D7BA9D]/20 shadow-sm">
                            <span className="text-[10px] font-black text-[#8B8A73] uppercase tracking-widest px-3">Gemini 3 Flash Pro</span>
                            <div className="h-6 w-px bg-[#F5F0E6]"></div>
                            <div className="flex items-center gap-2 px-3 text-[#606C38]">
                                <ShieldCheck size={16}/>
                                <span className="text-xs font-bold">Secure Data Link</span>
                            </div>
                        </div>
                        <div className="flex gap-2 w-full max-w-sm">
                          <div className="relative flex-1">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D7BA9D]" size={14}/>
                            <input 
                              type="password" 
                              placeholder="Enter External API Key..." 
                              className="w-full pl-9 pr-4 py-2 bg-white border border-[#D7BA9D]/30 rounded-xl text-xs font-bold focus:border-[#B3543D] outline-none shadow-inner"
                              value={aiExternalApiKey}
                              onChange={(e) => setAiExternalApiKey(e.target.value)}
                            />
                          </div>
                          <button 
                            onClick={handleSaveApiKey}
                            className="bg-[#433D3C] text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-[#2A2A2A] transition-all shadow-sm shrink-0"
                          >
                            <Save size={14}/> บันทึกรหัส
                          </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { id: 'CFO', label: 'CFO Advisor', icon: Landmark, color: 'text-amber-600', bg: 'bg-amber-50', desc: 'เน็ตกำไร, กระแสเงินสด, บัญชี' },
                        { id: 'CMO', label: 'CMO Strategy', icon: Globe, color: 'text-blue-600', bg: 'bg-blue-50', desc: 'กลยุทธ์แบรนด์, ยอดขายช่องทาง' },
                        { id: 'PROMO', label: 'Promo Specialist', icon: Tag, color: 'text-red-600', bg: 'bg-red-50', desc: 'ส่วนลด, คูปอง, กระตุ้นยอด' },
                        { id: 'ANALYST', label: 'Data Analyst', icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50', desc: 'แนวโน้มธุรกิจ, พยากรณ์' }
                    ].map(role => (
                        <button 
                            key={role.id}
                            onClick={() => setAiRole(role.id)}
                            className={`p-6 rounded-[32px] border-2 text-left transition-all duration-300 ${aiRole === role.id ? 'border-[#B3543D] bg-white shadow-xl scale-105' : 'border-transparent bg-white hover:border-[#D7BA9D]/30 shadow-sm'}`}
                        >
                            <div className={`w-12 h-12 rounded-2xl ${role.bg} ${role.color} flex items-center justify-center mb-4`}>
                                <role.icon size={24}/>
                            </div>
                            <h4 className="font-bold text-[16px] mb-1">{role.label}</h4>
                            <p className="text-[11px] text-[#8B8A73] font-medium">{role.desc}</p>
                        </button>
                    ))}
                </div>

                <div className="bg-white rounded-[40px] border border-[#D7BA9D]/20 shadow-xl overflow-hidden min-h-[500px] flex flex-col">
                    <div className="p-8 border-b border-[#F5F0E6] flex justify-between items-center bg-[#FDFCF8]/50">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#433D3C] rounded-full flex items-center justify-center text-white">
                                <Sparkles size={18}/>
                            </div>
                            <div>
                                <h4 className="font-bold text-lg">AI Strategic Analysis</h4>
                                <p className="text-xs text-[#8B8A73] font-bold">Current Role: {aiRole}</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleAIAnalysis}
                            disabled={isAILoading}
                            className="bg-[#B3543D] text-white px-8 py-3 rounded-2xl font-black shadow-lg hover:bg-[#963F2C] transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isAILoading ? <Loader2 className="animate-spin" size={18}/> : <Rocket size={18}/>}
                            {isAILoading ? 'Analyzing...' : 'เริ่มการวิเคราะห์อัจฉริยะ'}
                        </button>
                    </div>

                    <div className="flex-1 p-10 bg-white">
                        {!aiResponse && !isAILoading && (
                            <div className="h-full flex flex-col items-center justify-center text-center py-20">
                                <div className="w-24 h-24 bg-[#F5F0E6] rounded-full flex items-center justify-center text-[#8B8A73] mb-6">
                                    <Bot size={48}/>
                                </div>
                                <h5 className="font-bold text-xl mb-2 text-[#433D3C]">พร้อมวิเคราะห์แผนกลยุทธ์ให้คุณแล้ว</h5>
                                <p className="text-sm text-[#8B8A73] max-w-md leading-relaxed">เลือกบทบาทที่ต้องการและกดปุ่มเริ่มวิเคราะห์ AI จะทำการสรุปข้อมูลบัญชีและการตลาดแบบเชิงลึกเพื่อธุรกิจของคุณ</p>
                            </div>
                        )}

                        {isAILoading && (
                            <div className="h-full flex flex-col items-center justify-center py-20 space-y-6">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 bg-[#B3543D] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-3 h-3 bg-[#B3543D] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-3 h-3 bg-[#B3543D] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-[#433D3C]">AI กำลังประมวลผลข้อมูลมหาศาล...</p>
                                    <p className="text-xs text-[#8B8A73] mt-2 italic">เรากำลังเชื่อมโยงข้อมูลรายได้ ต้นทุน และพฤติกรรมลูกค้าให้คุณ</p>
                                </div>
                            </div>
                        )}

                        {aiResponse && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
                                <div className="flex items-start gap-4 mb-8">
                                    <div className="w-8 h-8 bg-green-50 text-green-600 rounded-lg flex items-center justify-center shrink-0">
                                        <Lightbulb size={20}/>
                                    </div>
                                    <h5 className="text-xl font-black text-[#433D3C]">คำแนะนำเชิงกลยุทธ์สำหรับคุณ</h5>
                                </div>
                                <div className="space-y-6 text-[#433D3C] leading-loose text-lg whitespace-pre-wrap font-medium">
                                    {aiResponse}
                                </div>
                                <div className="mt-12 p-6 bg-[#F5F0E6] rounded-3xl border border-[#D7BA9D]/30 flex items-center justify-between no-print">
                                    <p className="text-xs text-[#8B8A73] font-bold italic">* คำแนะนำจาก AI นี้ถูกสร้างขึ้นจากการวิเคราะห์ข้อมูลตัวเลขในแอปพลิเคชันของคุณโดยเฉพาะ</p>
                                    <button onClick={() => window.print()} className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl text-xs font-black shadow-sm text-[#433D3C] hover:bg-[#FDFCF8]"><Printer size={14}/> พิมพ์แผนกลยุทธ์</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
          )}
        </section>
      </main>

      <Modal isOpen={isDeleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="ยืนยันการลบรายการ">
          <div className="space-y-6 text-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto"><Trash2 size={40}/></div>
              <div><p className="text-lg font-bold text-[#433D3C]">คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?</p><p className="text-sm text-[#8B8A73] mt-2 leading-relaxed px-2">การลบรายการนี้จะทำให้ข้อมูลสต็อกที่เกี่ยวข้องถูกลบไปด้วย (กรณีเป็นรายการรับเข้า) <br/><span className="text-red-500 font-bold">** การดำเนินการนี้ไม่สามารถกู้คืนได้ **</span></p></div>
              <div className="flex gap-4"><button onClick={() => setDeleteConfirmOpen(false)} className="flex-1 px-6 py-3.5 rounded-2xl bg-white border border-[#D7BA9D]/30 font-bold text-[#8B8A73] hover:bg-[#F5F0E6] transition-all">ยกเลิก</button><button onClick={() => { handleDeleteTransaction(deletingId); setDeleteConfirmOpen(false); }} className="flex-1 px-6 py-3.5 rounded-2xl bg-red-500 text-white font-bold shadow-lg hover:bg-red-600 transition-all">ยืนยันการลบ</button></div>
          </div>
      </Modal>

      <Modal isOpen={isDeleteProdConfirmOpen} onClose={() => setDeleteProdConfirmOpen(false)} title="ยืนยันการลบสินค้า">
          <div className="space-y-6 text-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto"><Package size={40}/></div>
              <div><p className="text-lg font-bold text-[#433D3C]">ยืนยันการลบสินค้าออกจากระบบ?</p><p className="text-sm text-[#8B8A73] mt-2 leading-relaxed px-2">ข้อมูลประวัติและสต็อกคงเหลือของสินค้านี้จะถูกลบออกทั้งหมด <br/><span className="text-red-500 font-bold">** ไม่สามารถกู้คืนข้อมูลได้ **</span></p></div>
              <div className="flex gap-4"><button onClick={() => setDeleteProdConfirmOpen(false)} className="flex-1 px-6 py-3.5 rounded-2xl bg-white border border-[#D7BA9D]/30 font-bold text-[#8B8A73] hover:bg-[#F5F0E6] transition-all">ยกเลิก</button><button onClick={() => { handleDeleteProduct(deletingProdId); setDeleteProdConfirmOpen(false); }} className="flex-1 px-6 py-3.5 rounded-2xl bg-red-600 text-white font-bold shadow-lg hover:bg-red-700 transition-all">ยืนยันการลบ</button></div>
          </div>
      </Modal>

      <Modal isOpen={isDeleteContactConfirmOpen} onClose={() => setDeleteContactConfirmOpen(false)} title="ยืนยันการลบผู้ติดต่อ">
          <div className="space-y-6 text-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto"><Users size={40}/></div>
              <div><p className="text-lg font-bold text-[#433D3C]">ยืนยันการลบข้อมูลผู้ติดต่อ?</p><p className="text-sm text-[#8B8A73] mt-2 leading-relaxed px-2">ข้อมูลส่วนตัวและประวัติการติดต่อจะถูกลบออกจากฐานข้อมูล <br/><span className="text-red-500 font-bold">** ไม่สามารถกู้คืนข้อมูลได้ **</span></p></div>
              <div className="flex gap-4"><button onClick={() => setDeleteContactConfirmOpen(false)} className="flex-1 px-6 py-3.5 rounded-2xl bg-white border border-[#D7BA9D]/30 font-bold text-[#8B8A73] hover:bg-[#F5F0E6] transition-all">ยกเลิก</button><button onClick={() => { handleDeleteContact(deletingContactId); setDeleteContactConfirmOpen(false); }} className="flex-1 px-6 py-3.5 rounded-2xl bg-red-600 text-white font-bold shadow-lg hover:bg-red-700 transition-all">ยืนยันการลบ</button></div>
          </div>
      </Modal>

      <Modal isOpen={isLedgerExportModalOpen} onClose={() => setLedgerExportModalOpen(false)} title="Export Account Ledger (.xlsx)">
        <div className="space-y-6">
           <div className="space-y-2">
               <label className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest px-1">ช่วงเวลา (Date Range)</label>
               <div className="flex items-center gap-2">
                   <div className="flex-1 relative">
                       <CalendarRange size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B3543D]"/>
                       <input type="date" className="w-full pl-9 pr-3 py-2.5 bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl text-sm font-bold outline-none" value={exportStartDate} onChange={e => setExportStartDate(e.target.value)} />
                   </div>
                   <span className="text-[#8B8A73]">ถึง</span>
                   <div className="flex-1 relative">
                       <CalendarRange size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B3543D]"/>
                       <input type="date" className="w-full pl-9 pr-3 py-2.5 bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl text-sm font-bold outline-none" value={exportEndDate} onChange={e => setExportEndDate(e.target.value)} />
                   </div>
               </div>
           </div>

           <div className="space-y-2">
               <label className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest px-1">ประเภทรายการ (Transaction Type)</label>
               <div className="flex bg-[#F5F0E6] p-1 rounded-xl">
                   {['all', 'income', 'expense'].map(type => (
                       <button
                           key={type}
                           onClick={() => setExportLedgerType(type)}
                           className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${exportLedgerType === type ? 'bg-white text-[#B3543D] shadow-sm' : 'text-[#8B8A73] hover:text-[#433D3C]'}`}
                       >
                           {type === 'all' ? 'ทั้งหมด (All)' : type === 'income' ? 'รายรับ (Income)' : 'รายจ่าย (Expense)'}
                       </button>
                   ))}
               </div>
           </div>

           <div className="pt-4 border-t border-[#F5F0E6]">
               <button onClick={handleConfirmExportLedger} className="w-full bg-[#433D3C] text-white py-3.5 rounded-xl text-sm font-black shadow-lg hover:bg-[#2A2A2A] transition-all flex items-center justify-center gap-2">
                   <FileSpreadsheet size={18}/> ยืนยันการ Export
               </button>
           </div>
        </div>
      </Modal>

      <Modal isOpen={isMovementExportModalOpen} onClose={() => setMovementExportModalOpen(false)} title="Export Movement Report (.xlsx)">
        <div className="space-y-6">
           <div className="space-y-2">
               <label className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest px-1">ช่วงเวลา (Date Range)</label>
               <div className="flex items-center gap-2">
                   <div className="flex-1 relative">
                       <CalendarRange size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B3543D]"/>
                       <input type="date" className="w-full pl-9 pr-3 py-2.5 bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl text-sm font-bold outline-none" value={movementStartDate} onChange={e => setMovementStartDate(e.target.value)} />
                   </div>
                   <span className="text-[#8B8A73]">ถึง</span>
                   <div className="flex-1 relative">
                       <CalendarRange size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B3543D]"/>
                       <input type="date" className="w-full pl-9 pr-3 py-2.5 bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl text-sm font-bold outline-none" value={movementEndDate} onChange={e => setMovementEndDate(e.target.value)} />
                   </div>
               </div>
           </div>

           <div className="pt-4 border-t border-[#F5F0E6]">
               <button onClick={handleConfirmExportMovement} className="w-full bg-[#433D3C] text-white py-3.5 rounded-xl text-sm font-black shadow-lg hover:bg-[#2A2A2A] transition-all flex items-center justify-center gap-2">
                   <FileSpreadsheet size={18}/> ยืนยันการ Export
               </button>
           </div>
        </div>
      </Modal>

      <Modal isOpen={isSettingsModalOpen} onClose={() => setSettingsModalOpen(false)} title="ตั้งค่าร้านค้า (Store Settings)" maxWidth="max-w-2xl">
          <form onSubmit={handleSaveSettings} className="space-y-6 text-left">
              <div className="flex gap-6">
                 <div className="w-1/3 flex flex-col items-center gap-3">
                     <div 
                        className="w-32 h-32 rounded-full border-2 border-dashed border-[#D7BA9D] flex items-center justify-center overflow-hidden cursor-pointer hover:bg-[#F5F0E6] transition-all relative group"
                        onClick={() => logoInputRef.current?.click()}
                     >
                        {settings.logo ? (
                            <img src={settings.logo} alt="Shop Logo" className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-center text-[#8B8A73]">
                                <UploadCloud size={32} className="mx-auto mb-1"/>
                                <span className="text-xs font-bold">Upload Logo</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-white font-bold text-xs">
                             เปลี่ยนรูป
                        </div>
                     </div>
                     <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleSettingsLogoChange} />
                     <p className="text-[10px] text-[#8B8A73] text-center">แนะนำขนาด 1:1 (PNG/JPG)</p>
                 </div>

                 <div className="w-2/3 space-y-4">
                     <div className="space-y-1">
                         <label className="text-[10px] font-black text-[#8B8A73] uppercase tracking-widest px-1">ชื่อร้าน (English)</label>
                         <input type="text" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-4 py-2.5 text-sm font-bold outline-none" value={settings.shopName} onChange={e => setSettings({...settings, shopName: e.target.value})} />
                     </div>
                     <div className="space-y-1">
                         <label className="text-[10px] font-black text-[#8B8A73] uppercase tracking-widest px-1">ชื่อนิติบุคคล/ร้าน (ไทย)</label>
                         <input type="text" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-4 py-2.5 text-sm font-bold outline-none" value={settings.shopNameTh} onChange={e => setSettings({...settings, shopNameTh: e.target.value})} />
                     </div>
                 </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-[#F5F0E6]">
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <label className="text-[10px] font-black text-[#8B8A73] uppercase tracking-widest px-1">เลขผู้เสียภาษี</label>
                          <input type="text" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-4 py-2.5 text-sm font-bold outline-none font-mono" value={settings.taxId} onChange={e => setSettings({...settings, taxId: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-black text-[#8B8A73] uppercase tracking-widest px-1">สาขา</label>
                          <input type="text" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-4 py-2.5 text-sm font-bold outline-none" value={settings.branch} onChange={e => setSettings({...settings, branch: e.target.value})} />
                      </div>
                  </div>
                  <div className="space-y-1">
                        <label className="text-[10px] font-black text-[#8B8A73] uppercase tracking-widest px-1">ที่อยู่</label>
                        <textarea className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-4 py-2.5 text-sm font-medium outline-none h-20" value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                        <label className="text-[10px] font-black text-[#8B8A73] uppercase tracking-widest px-1">เบอร์โทรศัพท์</label>
                        <input type="text" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-4 py-2.5 text-sm font-bold outline-none" value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})} />
                  </div>
              </div>

              <div className="pt-4 border-t border-[#F5F0E6]">
                  <label className="text-[10px] font-black text-[#8B8A73] uppercase tracking-widest px-1 mb-2 block">ลายเซ็นผู้อนุมัติ (Signature)</label>
                  <div 
                      className="w-full h-24 border-2 border-dashed border-[#D7BA9D] rounded-xl flex items-center justify-center cursor-pointer hover:bg-[#F5F0E6] transition-all relative group overflow-hidden"
                      onClick={() => signatureInputRef.current?.click()}
                  >
                      {settings.signature ? (
                          <img src={settings.signature} alt="Signature" className="h-full object-contain" />
                      ) : (
                          <span className="text-xs text-[#8B8A73] font-bold">คลิกเพื่ออัปโหลดลายเซ็น</span>
                      )}
                      <input type="file" ref={signatureInputRef} className="hidden" accept="image/*" onChange={handleSettingsSignatureChange} />
                  </div>
              </div>

              <div className="pt-4">
                  <button type="submit" className="w-full bg-[#433D3C] text-white py-4 rounded-xl text-lg font-black shadow-xl hover:bg-[#2A2A2A] transition-all">บันทึกการตั้งค่า</button>
              </div>
          </form>
      </Modal>

      <Modal isOpen={isFullInvoicePreviewOpen} onClose={() => setFullInvoicePreviewOpen(false)} title="ใบกำกับภาษีเต็มรูป (Full Tax Invoice)" maxWidth="max-w-3xl">
          {selectedInvoice && (
              <div className="bg-white p-8 text-[#333] font-mono-receipt border border-gray-200 shadow-lg relative min-h-[800px] flex flex-col justify-between invoice-preview-container">
                  <div className="absolute top-4 right-4 no-print flex gap-2 z-10">
                      <button onClick={() => setInvoiceType('original')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${invoiceType === 'original' ? 'bg-[#433D3C] text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>ต้นฉบับ</button>
                      <button onClick={() => setInvoiceType('copy')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${invoiceType === 'copy' ? 'bg-[#433D3C] text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>สำเนา</button>
                  </div>

                  <div className="space-y-4">
                      <div className="flex justify-between items-start">
                           <div className="w-[60%] space-y-1 text-left">
                              <div className="flex items-center gap-3 mb-2">
                                  <div className="w-10 h-10 bg-[#B3543D] rounded-full flex items-center justify-center text-white overflow-hidden">
                                    {settings.logo ? <img src={settings.logo} className="w-full h-full object-cover"/> : <Leaf size={20} />}
                                  </div>
                                  <h4 className="text-xl font-bold text-[#B3543D]">{settings.shopName || 'EATS AND USE PRO CO., LTD.'}</h4>
                              </div>
                              <p className="text-sm font-bold">{settings.shopNameTh || 'บริษัท อีทส์ แอนด์ ยูส โปร จำกัด'}</p>
                              <p className="text-xs">{settings.address}</p>
                              <p className="text-xs">เลขประจำตัวผู้เสียภาษี: {settings.taxId} ({settings.branch})</p>
                              <p className="text-xs">โทร: {settings.phone}</p>
                           </div>

                           <div className="w-[35%] text-right space-y-1">
                              <h5 className="text-lg font-bold uppercase tracking-wide">ใบกำกับภาษี / ใบเสร็จรับเงิน</h5>
                              <p className="text-[10px] font-bold text-gray-500">TAX INVOICE / RECEIPT</p>
                              <div className="border border-gray-300 p-1.5 rounded text-center bg-gray-50 my-2">
                                  <p className="text-xs font-bold">{invoiceType === 'original' ? 'ต้นฉบับ / Original' : 'สำเนา / Copy'}</p>
                              </div>
                              <div className="flex flex-col gap-0.5 text-[10px] mt-2">
                                  <div className="flex justify-between"><span className="font-bold text-gray-600">เลขที่ / No.:</span><span className="font-bold">{selectedInvoice.invNo}</span></div>
                                  <div className="flex justify-between"><span className="font-bold text-gray-600">วันที่ / Date:</span><span className="font-bold">{safeDate(selectedInvoice.date)}</span></div>
                                  <div className="flex justify-between"><span className="font-bold text-gray-600">อ้างอิง / Ref.:</span><span className="font-bold">{selectedInvoice.abbNo}</span></div>
                              </div>
                           </div>
                      </div>
                      <hr className="border-gray-300 my-4"/>
                      <div className="border border-gray-300 rounded p-4 flex justify-between items-start text-left">
                          <div className="w-full text-left">
                              <p className="text-xs font-bold text-gray-500 uppercase mb-1">ลูกค้า / Customer</p>
                              <p className="text-sm font-bold mb-1">{selectedInvoice.fullTaxCustomer}</p>
                              <p className="text-xs mb-1">{selectedInvoice.fullTaxAddress}</p>
                              <p className="text-xs"><span className="font-bold">เลขประจำตัวผู้เสียภาษี:</span> {selectedInvoice.fullTaxTaxId || '-'} <span className="mx-2">|</span> <span className="font-bold">สาขา:</span> {selectedInvoice.fullTaxBranch || '00000'}</p>
                          </div>
                      </div>
                      <div className="mt-4">
                          <table className="w-full text-xs border-collapse">
                              <thead>
                                  <tr className="bg-gray-100 border border-gray-300 text-gray-600">
                                      <th className="border border-gray-300 py-2 px-2 w-12 text-center">ลำดับ<br/>No.</th>
                                      <th className="border border-gray-300 py-2 px-2 text-left">รายการ<br/>Description</th>
                                      <th className="border border-gray-300 py-2 px-2 w-16 text-center">จำนวน<br/>Qty</th>
                                      <th className="border border-gray-300 py-2 px-2 w-20 text-right">หน่วยละ<br/>Unit Price</th>
                                      <th className="border border-gray-300 py-2 px-2 w-24 text-right">จำนวนเงิน<br/>Amount</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {selectedInvoice.items && selectedInvoice.items.map((item, i) => (
                                      <tr key={i} className="align-top">
                                          <td className="border-x border-gray-300 py-2 px-2 text-center">{i+1}</td>
                                          <td className="border-x border-gray-300 py-2 px-2">{item.name}</td>
                                          <td className="border-x border-gray-300 py-2 px-2 text-center">{item.qty}</td>
                                          <td className="border-x border-gray-300 py-2 px-2 text-right">{item.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                          <td className="border-x border-gray-300 py-2 px-2 text-right">{(item.qty * item.price).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                      </tr>
                                  ))}
                                  <tr className="border-t border-gray-300"></tr> 
                              </tbody>
                          </table>
                      </div>
                  </div>
                  <div className="space-y-4 mt-4">
                      <div className="flex gap-4 items-start">
                          <div className="flex-1 space-y-4">
                              <div className="border border-gray-300 rounded bg-gray-50 p-3 text-center">
                                  <div className="text-xs font-bold text-gray-500 mb-1">จำนวนเงินตัวอักษร (Baht Text):</div>
                                  <div className="font-bold text-[#B3543D] text-sm">({ThaiBahtText(selectedInvoice.totalBill)})</div>
                              </div>
                              <div className="text-xs text-gray-500"><p><span className="font-bold">หมายเหตุ:</span> เอกสารนี้จัดทำโดยระบบคอมพิวเตอร์</p></div>
                          </div>
                          <div className="w-64 text-xs">
                              <div className="flex justify-between py-1 border-b border-gray-200"><span>รวมเป็นเงิน (Subtotal)</span><span className="font-bold">{(selectedInvoice.subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                              {selectedInvoice.discount > 0 && <div className="flex justify-between py-1 border-b border-gray-200 text-red-500"><span>หักส่วนลด (Discount)</span><span>-{(selectedInvoice.discount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>}
                              {selectedInvoice.shippingIncome > 0 && <div className="flex justify-between py-1 border-b border-gray-200"><span>ค่าขนส่ง (Shipping)</span><span>{(selectedInvoice.shippingIncome || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>}
                              <div className="flex justify-between py-1 border-b border-gray-200"><span>จำนวนเงินหลังหักส่วนลด</span><span>{((selectedInvoice.subtotal - (selectedInvoice.discount || 0))).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                              <div className="flex justify-between py-1 border-b border-gray-200"><span>ภาษีมูลค่าเพิ่ม 7% (VAT)</span><span>{(selectedInvoice.vatAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                              <div className="flex justify-between py-2 border-b border-gray-300 text-base font-bold bg-gray-100 px-2 mt-1"><span>จำนวนเงินทั้งสิ้น (Grand Total)</span><span className="text-[#B3543D]">{(selectedInvoice.totalBill || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                          </div>
                      </div>
                      <div className="flex justify-between mt-8 pt-4 pb-2">
                          <div className="text-center w-48"><div className="border-b border-gray-400 border-dashed h-8"></div><p className="text-xs mt-2">ผู้รับวางบิล / ผู้จ่ายเงิน</p><p className="text-[10px] text-gray-400">Receiver / Payer</p><p className="text-[10px] mt-1">วันที่ ____/____/____</p></div>
                          <div className="text-center w-48"><div className="border-b border-gray-400 border-dashed h-8 flex items-end justify-center pb-1">{settings.signature && <img src={settings.signature} alt="Sig" className="max-h-16 max-w-full" />}</div><p className="text-xs mt-2">ผู้รับเงิน / ผู้ออกใบกำกับภาษี</p><p className="text-[10px] text-gray-400">Cashier / Authorized Signature</p><p className="text-[10px] mt-1">วันที่ {safeDate(selectedInvoice.date)}</p></div>
                      </div>
                  </div>
                  <div className="mt-4 text-center no-print"><button onClick={() => window.print()} className="bg-[#433D3C] text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-[#2A2A2A] transition-all flex items-center justify-center gap-2 mx-auto"><Printer size={18}/> พิมพ์ / บันทึก PDF</button></div>
              </div>
          )}
      </Modal>

      <Modal isOpen={isEditTransactionModalOpen} onClose={() => { setEditTransactionModalOpen(false); setEditingTransaction(null); }} title="แก้ไขรายละเอียดรายการ">
        {editingTransaction && (
          <form onSubmit={handleUpdateTransaction} className="space-y-6 text-left">
              <div className="space-y-2">
                  <label className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest px-1">จ่ายให้ใคร / ชื่อลูกค้า</label>
                  <input type="text" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-2xl px-5 py-3.5 text-[15px] font-bold outline-none focus:border-[#B3543D]" value={editingTransaction.customer} onChange={e => setEditingTransaction({...editingTransaction, customer: e.target.value})} />
              </div>
              <div className="space-y-2">
                  <label className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest px-1">หมายเหตุ / Note</label>
                  <textarea className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-2xl px-5 py-3 text-[14px] outline-none focus:border-[#B3543D] h-24 font-medium" value={editingTransaction.note || ''} onChange={e => setEditingTransaction({...editingTransaction, note: e.target.value})} placeholder="ระบุรายละเอียดเพิ่มเติม..." />
              </div>
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 flex gap-3 text-amber-700">
                  <AlertTriangle size={20} className="shrink-0"/><p className="text-[11px] font-bold">หมายเหตุ: การแก้ไขยอดเงินไม่สามารถทำได้เพื่อป้องกันความผิดพลาดทางบัญชี หากยอดเงินผิดกรุณาลบรายการแล้วสร้างใหม่</p>
              </div>
              <button type="submit" className="w-full bg-[#B3543D] text-white py-5 rounded-[24px] text-lg font-black shadow-xl hover:bg-[#963F2C] transition-all">บันทึกการแก้ไข</button>
          </form>
        )}
      </Modal>

      <Modal isOpen={isReceiptModalOpen} onClose={() => setReceiptModalOpen(false)} title="ใบกำกับภาษีอย่างย่อ (Simplified Invoice)" maxWidth="max-w-sm">
        {lastTransaction && (
          <div className="flex flex-col items-center font-mono-receipt text-[#433D3C] invoice-preview-container">
             <div className="text-center mb-6 space-y-1">
                <div className="w-10 h-10 bg-[#B3543D] rounded-full flex items-center justify-center text-white mx-auto mb-2 overflow-hidden">{settings.logo ? <img src={settings.logo} className="w-full h-full object-cover"/> : <Leaf size={20} />}</div>
                <h4 className="text-[15px] font-bold uppercase">{settings.shopName || 'eats and use Pro'}</h4>
                <p className="text-[10px] opacity-60">เลขประจำตัวผู้เสียภาษี: {settings.taxId || '010-XXXX-XXXXX'}</p>
                <p className="text-[10px] opacity-60">{settings.branch || 'สำนักงานใหญ่'}</p>
             </div>
             <div className="w-full border-y border-dashed border-[#D7BA9D] py-4 my-2 text-[11px] space-y-1">
                <div className="flex justify-between font-bold"><span>เลขที่ใบเสร็จ (Ref ID):</span> <span>{lastTransaction.abbNo}</span></div>
                <div className="flex justify-between"><span>วันที่:</span> <span>{safeDate(lastTransaction.date)}</span></div>
                <div className="flex justify-between"><span>ช่องทาง:</span> <span>{lastTransaction.channel}</span></div>
                {lastTransaction.orderId && <div className="flex justify-between"><span>Order ID:</span> <span>{lastTransaction.orderId}</span></div>}
             </div>
             <div className="w-full space-y-2 mb-6">
                {lastTransaction.items && lastTransaction.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-[11px]"><div className="flex gap-2"><span>{item.qty}x</span> <span className="truncate w-32">{item.name}</span></div><span>฿{(item.qty * item.price).toLocaleString()}</span></div>
                ))}
             </div>
             <div className="w-full border-t border-dashed border-[#D7BA9D] pt-4 space-y-1.5 text-[11px]">
                <div className="flex justify-between"><span>ยอดรวมสินค้า (Subtotal)</span> <span>฿{(lastTransaction.subtotal || 0).toLocaleString()}</span></div>
                {lastTransaction.discount > 0 && <div className="flex justify-between text-red-500"><span>ส่วนลด (Discount)</span> <span>-฿{(lastTransaction.discount || 0).toLocaleString()}</span></div>}
                {lastTransaction.shippingIncome > 0 && <div className="flex justify-between text-green-600"><span>ค่าขนส่ง (Shipping)</span> <span>฿{(lastTransaction.shippingIncome || 0).toLocaleString()}</span></div>}
                <div className="flex justify-between text-[14px] font-bold border-t border-dashed border-[#D7BA9D] pt-2 mt-1"><span>ยอดชำระทั้งสิ้น</span> <span>฿{(lastTransaction.totalBill || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
             </div>
             <div className="w-full bg-[#FDFCF8] p-3 rounded-xl mt-6 text-center no-print">
                <p className="text-[9px] opacity-60 italic mb-2">* โปรดเก็บรหัส Ref ID นี้ไว้เพื่อใช้ในการขอออกใบกำกับภาษีเต็มรูป *</p>
                <button onClick={() => { window.print(); }} className="w-full bg-[#433D3C] text-white py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-2 shadow-lg"><Printer size={14}/> พิมพ์ใบเสร็จอย่างย่อ</button>
             </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isExpenseModalOpen} onClose={() => setExpenseModalOpen(false)} title="บันทึกรายจ่ายทั่วไป (General Expense Manager)" maxWidth="max-w-2xl">
        <form onSubmit={handleSaveExpense} className="space-y-8 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#F5F0E6] p-7 rounded-[32px] shadow-inner">
                 <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest px-1">คู่ค้า (Vendor)</label>
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setExpenseVendorPickerOpen(true)} className="flex-[2] flex items-center justify-between bg-white border border-[#D7BA9D]/30 rounded-2xl px-5 py-3 text-sm font-bold text-[#8B8A73] hover:border-[#B3543D] transition-all"><span>{newExpense.vendor || "ค้นหาจาก CRM..."}</span><ChevronRight size={18}/></button>
                        <input type="text" className="flex-1 bg-white border border-[#D7BA9D] rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:border-[#B3543D] text-[#433D3C]" value={newExpense.vendor} onChange={e => setNewExpense({...newExpense, vendor: e.target.value, vendorId: ''})} placeholder="หรือระบุชื่อ..." />
                    </div>
                </div>
                 <div className="space-y-2"><label className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest px-1">วันที่จ่าย</label><input type="date" className="w-full bg-white border border-[#D7BA9D]/30 rounded-2xl px-5 py-3.5 text-[15px] font-bold outline-none focus:border-[#B3543D]" required value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} /></div>
                 <div className="space-y-2"><label className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest px-1">หมวดหมู่รายจ่าย</label><select className="w-full bg-white border border-[#D7BA9D]/30 rounded-2xl px-5 py-3.5 text-[15px] font-bold outline-none focus:border-[#B3543D]" value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})}><option value="อุปกรณ์แพ็คของ">อุปกรณ์แพ็คของ (กล่อง/เทป)</option><option value="ค่าจัดส่ง">ค่าจัดส่ง (Logistics)</option><option value="ค่าสาธารณูปโภค">ค่าสาธารณูปโภค (น้ำ/ไฟ/เน็ต)</option><option value="ค่าเช่าที่">ค่าเช่าที่</option><option value="ค่าการตลาด">ค่าการตลาด / โฆษณา</option><option value="ค่าอุปกรณ์สำนักงาน">ค่าอุปกรณ์สำนักงาน</option><option value="รายจ่ายอื่นๆ">รายจ่ายอื่นๆ</option></select></div>
                 <div className="space-y-2"><label className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest px-1">Tax Invoice No.</label><input type="text" className="w-full bg-white border border-[#D7BA9D]/30 rounded-2xl px-5 py-3 text-sm font-bold outline-none" value={newExpense.taxInvoiceNo} onChange={e => setNewExpense({...newExpense, taxInvoiceNo: e.target.value})} placeholder="เลขใบกำกับภาษี" /></div>
                 <div className="space-y-2"><label className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest px-1">Tax Configuration</label><div className="flex bg-white rounded-2xl p-1 border border-[#D7BA9D]/30">{['none', 'include', 'exclude'].map(t => (<button key={t} type="button" onClick={() => setNewExpense({...newExpense, taxType: t})} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${newExpense.taxType === t ? 'bg-[#433D3C] text-white shadow-sm' : 'text-[#8B8A73] hover:bg-[#F5F0E6]'}`}>{t === 'none' ? 'No VAT' : t === 'include' ? 'Inc. 7%' : 'Exc. 7%'}</button>))}</div></div>
            </div>
            <div className="space-y-3"><label className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest px-1">Financial Data</label><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="space-y-2"><label className="text-[10px] font-bold text-[#8B8A73] px-1">ยอดเงินพื้นฐาน</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#D7BA9D]">฿</span><input type="number" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-2xl pl-8 pr-4 py-3.5 text-[16px] font-extrabold outline-none focus:border-[#B3543D]" required value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} placeholder="0.00" /></div></div><div className="space-y-2"><label className="text-[10px] font-bold text-red-400 px-1">ส่วนลด</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-red-200">฿</span><input type="number" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-2xl pl-8 pr-4 py-3.5 text-[16px] font-extrabold outline-none focus:border-red-400 text-red-500" value={newExpense.discount} onChange={e => setNewExpense({...newExpense, discount: e.target.value})} placeholder="0" /></div></div><div className="space-y-2"><label className="text-[10px] font-bold text-blue-400 px-1">ปรับปรุงยอด</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-200">฿</span><input type="number" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-2xl pl-8 pr-4 py-3.5 text-[16px] font-extrabold outline-none focus:border-blue-400 text-blue-600" value={newExpense.adjustments} onChange={e => setNewExpense({...newExpense, adjustments: e.target.value})} placeholder="+/-" /></div></div></div></div>
            <div className="space-y-2"><label className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest px-1">บันทึกเพิ่มเติม</label><textarea className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-2xl px-5 py-3 text-[14px] outline-none focus:border-[#B3543D] h-20 font-medium" value={newExpense.note} onChange={e => setNewExpense({...newExpense, note: e.target.value})} placeholder="ระบุรายละเอียด..." /></div>
            <div className="p-6 bg-[#FDFCF8] border border-[#F5F0E6] rounded-[32px] space-y-3 no-print">
                 {(() => {
                     const base = Number(newExpense.amount);
                     const disc = Number(newExpense.discount || 0);
                     const adj = Number(newExpense.adjustments || 0);
                     const priceAfterDiscount = Math.max(0, base - disc);
                     let vat = 0, beforeVat = 0, grandTotal = 0;
                     if (newExpense.taxType === 'exclude') { beforeVat = priceAfterDiscount; vat = priceAfterDiscount * 0.07; grandTotal = priceAfterDiscount + vat; }
                     else if (newExpense.taxType === 'include') { beforeVat = priceAfterDiscount / 1.07; vat = priceAfterDiscount - beforeVat; grandTotal = priceAfterDiscount; }
                     else { beforeVat = priceAfterDiscount; vat = 0; grandTotal = priceAfterDiscount; }
                     grandTotal += adj;
                     return (<div className="border-b border-dashed border-[#D7BA9D]/30 pb-3 space-y-1.5"><div className="flex justify-between items-center text-[10px] font-medium text-[#8B8A73]"><span>ฐานภาษี (Tax Base)</span><span>฿{beforeVat.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div><div className="flex justify-between items-center text-[10px] font-medium text-[#8B8A73]"><span>ภาษีมูลค่าเพิ่ม (VAT 7%)</span><span>฿{vat.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div><div className="flex justify-between items-center text-sm font-extrabold text-[#433D3C] pt-1"><span>ยอดรวมทั้งสิ้น (Grand Total)</span><span>฿{grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div></div>);
                 })()}
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-dashed border-[#D7BA9D]/30"><div className="flex items-center gap-2"><Tag size={16} className="text-blue-500"/><span className="text-xs font-bold text-blue-500">Cash Coupon (คูปองเงินสด)</span></div><div className="relative w-32"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-300">฿</span><input type="number" className="w-full bg-white border border-blue-100 rounded-xl pl-7 pr-3 py-1.5 text-sm font-bold text-blue-600 outline-none text-right" value={newExpense.cashCoupon} onChange={e => setNewExpense({...newExpense, cashCoupon: e.target.value})} placeholder="0.00" /></div></div>
                <div className="flex justify-between items-center"><div><p className="text-[10px] font-black text-[#8B8A73] uppercase tracking-widest mb-1">ยอดจ่ายสุทธิ (Net Cash)</p><p className="text-3xl font-black text-[#B3543D]">{(() => { const base = Number(newExpense.amount), disc = Number(newExpense.discount || 0), adj = Number(newExpense.adjustments || 0), priceAfterDiscount = Math.max(0, base - disc); let grandTotal = 0; if (newExpense.taxType === 'exclude') grandTotal = priceAfterDiscount * 1.07; else grandTotal = priceAfterDiscount; grandTotal += adj; return `฿${Math.max(0, grandTotal - (Number(newExpense.cashCoupon) || 0)).toLocaleString(undefined, {minimumFractionDigits: 2})}`; })()}</p></div><button type="submit" className="bg-[#B3543D] text-white px-10 py-4 rounded-[20px] text-lg font-black shadow-xl hover:bg-[#963F2C] transition-all flex items-center gap-2"><Receipt size={20}/> บันทึกรายจ่าย</button></div>
            </div>
        </form>
      </Modal>

      <Modal isOpen={isContactModalOpen} onClose={() => setContactModalOpen(false)} title="เพิ่มข้อมูล CRM">
        <form onSubmit={handleSaveContact} className="space-y-6 text-left">
            <div className="flex gap-4 p-5 bg-[#F5F0E6] rounded-3xl"><label className="flex-1 flex items-center justify-center gap-3 bg-white p-3 rounded-2xl cursor-pointer shadow-sm border border-transparent hover:border-[#B3543D] transition-all"><input type="radio" className="w-4 h-4 accent-[#B3543D]" name="ctype" checked={newContact.type === 'customer'} onChange={() => setNewContact({...newContact, type: 'customer'})} /> <span className="text-sm font-bold text-[#433D3C]">ลูกค้า</span></label><label className="flex-1 flex items-center justify-center gap-3 bg-white p-3 rounded-2xl cursor-pointer shadow-sm border border-transparent hover:border-[#B3543D] transition-all"><input type="radio" className="w-4 h-4 accent-[#B3543D]" name="ctype" checked={newContact.type === 'vendor'} onChange={() => setNewContact({...newContact, type: 'vendor'})} /> <span className="text-sm font-bold text-[#433D3C]">คู่ค้า</span></label></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-4"><h5 className="font-bold text-sm text-[#433D3C] border-b border-[#F5F0E6] pb-2">ข้อมูลทั่วไป (General Info)</h5><div className="space-y-1"><label className="text-[10px] font-black text-[#8B8A73] uppercase tracking-widest px-1">รหัสลูกค้า/คู่ค้า</label><input type="text" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-4 py-2.5 text-sm font-bold outline-none" value={newContact.code} onChange={e => setNewContact({...newContact, code: e.target.value})} placeholder="ระบุรหัส (ถ้ามี)" /></div><div className="space-y-1"><label className="text-[10px] font-black text-[#8B8A73] uppercase tracking-widest px-1">ชื่อบริษัท / ร้านค้า</label><input type="text" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-4 py-2.5 text-sm font-bold outline-none" required value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})} /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[10px] font-black text-[#8B8A73] uppercase tracking-widest px-1">Tax ID</label><input type="text" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-4 py-2.5 text-sm font-mono outline-none" value={newContact.taxId} onChange={e => setNewContact({...newContact, taxId: e.target.value})} /></div><div className="space-y-1"><label className="text-[10px] font-black text-[#8B8A73] uppercase tracking-widest px-1">สาขา</label><input type="text" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-4 py-2.5 text-sm outline-none" value={newContact.branch} onChange={e => setNewContact({...newContact, branch: e.target.value})} /></div></div><div className="space-y-1"><label className="text-[10px] font-black text-[#8B8A73] uppercase tracking-widest px-1">กลุ่มลูกค้า</label><select className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-4 py-2.5 text-sm font-bold outline-none" value={newContact.group} onChange={e => setNewContact({...newContact, group: e.target.value})}><option value="General">General (ทั่วไป)</option><option value="VIP">VIP</option><option value="Wholesale">Wholesale (ค้าส่ง)</option></select></div></div><div className="space-y-4"><h5 className="font-bold text-sm text-[#433D3C] border-b border-[#F5F0E6] pb-2">ข้อมูลการติดต่อ (Contact Info)</h5><div className="space-y-1"><label className="text-[10px] font-black text-[#8B8A73] uppercase tracking-widest px-1">ชื่อผู้ติดต่อ</label><div className="flex items-center gap-2 bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-3 py-1"><User size={16} className="text-[#D7BA9D]"/><input type="text" className="w-full bg-transparent py-1.5 text-sm font-bold outline-none" value={newContact.contactPerson} onChange={e => setNewContact({...newContact, contactPerson: e.target.value})} placeholder="ชื่อบุคคลที่ติดต่อ" /></div></div><div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[10px] font-black text-[#8B8A73] uppercase tracking-widest px-1">เบอร์โทรศัพท์</label><div className="flex items-center gap-2 bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-3 py-1"><Phone size={16} className="text-[#D7BA9D]"/><input type="text" className="w-full bg-transparent py-1.5 text-sm outline-none" value={newContact.phone} onChange={e => setNewContact({...newContact, phone: e.target.value})} /></div></div><div className="space-y-1"><label className="text-[10px] font-black text-[#8B8A73] uppercase tracking-widest px-1">มือถือ</label><div className="flex items-center gap-2 bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-3 py-1"><Smartphone size={16} className="text-[#D7BA9D]"/><input type="text" className="w-full bg-transparent py-1.5 text-sm outline-none" value={newContact.mobile} onChange={e => setNewContact({...newContact, mobile: e.target.value})} /></div></div></div><div className="space-y-1"><label className="text-[10px] font-black text-[#8B8A73] uppercase tracking-widest px-1">อีเมล</label><div className="flex items-center gap-2 bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-3 py-1"><Mail size={16} className="text-[#D7BA9D]"/><input type="email" className="w-full bg-transparent py-1.5 text-sm outline-none" value={newContact.email} onChange={e => setNewContact({...newContact, email: e.target.value})} /></div></div><div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[10px] font-black text-[#8B8A73] uppercase tracking-widest px-1">Line ID</label><div className="flex items-center gap-2 bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-3 py-1"><MessageCircle size={16} className="text-green-500"/><input type="text" className="w-full bg-transparent py-1.5 text-sm outline-none" value={newContact.lineId} onChange={e => setNewContact({...newContact, lineId: e.target.value})} /></div></div><div className="space-y-1"><label className="text-[10px] font-black text-[#8B8A73] uppercase tracking-widest px-1">Facebook</label><div className="flex items-center gap-2 bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-3 py-1"><Globe size={16} className="text-blue-600"/><input type="text" className="w-full bg-transparent py-1.5 text-sm outline-none" value={newContact.facebook} onChange={e => setNewContact({...newContact, facebook: e.target.value})} /></div></div></div></div></div>
            <div className="flex flex-col md:flex-row gap-6 border-t border-[#F5F0E6] pt-4"><div className="flex-1 space-y-4"><h5 className="font-bold text-sm text-[#433D3C] flex items-center gap-2"><MapPin size={16}/> ที่อยู่ (Addresses)</h5><div className="space-y-1"><label className="text-[10px] font-black text-[#8B8A73] uppercase tracking-widest px-1">ที่อยู่ตาม ภ.พ.20 / ออกใบกำกับ</label><textarea className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-4 py-2.5 text-sm outline-none h-20" value={newContact.address} onChange={e => setNewContact({...newContact, address: e.target.value})} placeholder="ที่อยู่สำหรับออกเอกสารภาษี..." /></div><div className="space-y-1"><label className="text-[10px] font-black text-[#8B8A73] uppercase tracking-widest px-1">สถานที่จัดส่ง (Shipping Address)</label><textarea className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-4 py-2.5 text-sm outline-none h-20" value={newContact.shippingAddress} onChange={e => setNewContact({...newContact, shippingAddress: e.target.value})} placeholder="ถ้าเหมือนด้านบน ไม่ต้องระบุ" /></div></div><div className="flex-1 space-y-4"><h5 className="font-bold text-sm text-[#433D3C] flex items-center gap-2"><CreditCard size={16}/> การเงิน & อื่นๆ</h5><div className="space-y-1"><label className="text-[10px] font-black text-[#8B8A73] uppercase tracking-widest px-1">Credit Term (วัน)</label><input type="number" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-4 py-2.5 text-sm font-bold outline-none" value={newContact.creditTerm} onChange={e => setNewContact({...newContact, creditTerm: e.target.value})} placeholder="0" /></div><div className="space-y-1"><label className="text-[10px] font-black text-[#8B8A73] uppercase tracking-widest px-1">หมายเหตุ (Note)</label><textarea className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-4 py-2.5 text-sm outline-none h-32" value={newContact.note} onChange={e => setNewContact({...newContact, note: e.target.value})} placeholder="บันทึกเพิ่มเติม..." /></div></div></div>
            <button type="submit" className="w-full bg-[#B3543D] text-white py-4 rounded-xl text-lg font-black shadow-xl hover:bg-[#963F2C] transition-all">บันทึกข้อมูล CRM</button>
        </form>
      </Modal>

      <Modal isOpen={isStockModalOpen} onClose={() => setStockModalOpen(false)} title="บันทึกรับสินค้าเข้าสต็อก" maxWidth="max-w-3xl">
        <div className="space-y-8 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#F5F0E6] p-7 rounded-[32px] shadow-inner">
             <div className="col-span-1 md:col-span-2 space-y-4"><div className="space-y-2"><label className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest px-1">คู่ค้า (Vendor)</label><div className="flex gap-3"><button type="button" onClick={() => setVendorPickerOpen(true)} className="flex-[2] flex items-center justify-between bg-white border border-[#D7BA9D]/30 rounded-2xl px-5 py-3 text-sm font-bold text-[#8B8A73] hover:border-[#B3543D] transition-all"><span>{newStock.vendor || "เลือกจาก CRM..."}</span><ChevronRight size={18}/></button><input type="text" className="flex-1 bg-white border border-[#D7BA9D]/30 rounded-2xl px-5 py-3 text-sm font-bold outline-none" value={newStock.vendor} onChange={e => setNewStock({...newStock, vendor: e.target.value})} placeholder="หรือระบุชื่อ..." /></div></div></div>
             <div className="space-y-1"><label className="text-[11px] font-black uppercase text-[#8B8A73] px-1">Lot No.</label><div className="font-mono text-[17px] font-extrabold text-[#B3543D] px-1">{newStock.lotNo || 'Auto-Generating'}</div></div>
             <div className="space-y-2"><label className="text-[11px] font-black uppercase text-[#8B8A73] px-1">วันที่รับ</label><input type="date" className="w-full bg-white border border-[#D7BA9D]/30 rounded-2xl px-5 py-3 text-sm font-bold outline-none" value={newStock.receiveDate} onChange={e => setNewStock({...newStock, receiveDate: e.target.value})} /></div>
             <div className="space-y-2"><label className="text-[11px] font-black uppercase text-[#8B8A73] px-1">Tax Invoice No.</label><input type="text" className="w-full bg-white border border-[#D7BA9D]/30 rounded-2xl px-5 py-3 text-sm font-bold outline-none" value={newStock.taxInvoiceNo} onChange={e => setNewStock({...newStock, taxInvoiceNo: e.target.value})} placeholder="เลขใบกำกับภาษี" /></div>
             <div className="space-y-2"><label className="text-[11px] font-black uppercase text-[#8B8A73] px-1">Tax Configuration</label><div className="flex bg-white rounded-2xl p-1 border border-[#D7BA9D]/30">{['none', 'include', 'exclude'].map(t => (<button key={t} onClick={() => setNewStock({...newStock, taxType: t})} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${newStock.taxType === t ? 'bg-[#433D3C] text-white shadow-sm' : 'text-[#8B8A73] hover:bg-[#F5F0E6]'}`}>{t === 'none' ? 'No VAT' : t === 'include' ? 'Inc. 7%' : 'Exc. 7%'}</button>))}</div></div>
          </div>
          <div className="space-y-4"><h5 className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest px-1">เพิ่มสินค้า</h5><div className="flex flex-col lg:flex-row gap-3 items-end"><div className="flex-[3] w-full"><select className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-[#B3543D]" value={stockItemInput.productId} onChange={e => setStockItemInput({...stockItemInput, productId: e.target.value})}><option value="">-- เลือกสินค้า --</option>{products?.map(p => <option key={p.id} value={p.id}>{safeStr(p.name)}</option>)}</select></div><div className="flex-[2] flex gap-3 w-full"><input type="number" placeholder="Cost" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-2xl px-4 py-3.5 text-sm font-bold text-center" value={stockItemInput.cost} onChange={e => setStockItemInput({...stockItemInput, cost: e.target.value})} /><input type="number" placeholder="Qty" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-2xl px-4 py-3.5 text-sm font-bold text-center" value={stockItemInput.qty} onChange={e => setStockItemInput({...stockItemInput, qty: e.target.value})} /><button type="button" onClick={handleAddStockItem} className="bg-[#B3543D] text-white w-14 h-14 rounded-2xl flex items-center justify-center hover:bg-[#963F2C] shadow-lg shrink-0 transition-all no-print"><Plus size={24}/></button></div></div><div className="border border-[#D7BA9D]/20 rounded-[32px] overflow-hidden bg-white"><table className="w-full text-left text-sm"><thead className="bg-[#FDFCF8] border-b text-[10px] font-black uppercase tracking-widest text-[#8B8A73]"><tr className="divide-x divide-[#F5F0E6]"><th className="p-4">Item</th><th className="p-4 text-right">Unit Cost</th><th className="p-4 text-center">Qty</th><th className="p-4 text-right">Subtotal</th><th className="w-12"></th></tr></thead><tbody className="divide-y divide-[#F5F0E6] font-bold">{!newStock.items?.length && <tr><td colSpan="5" className="p-12 text-center text-[#8B8A73] italic opacity-50">ยังไม่มีข้อมูล</td></tr>}{newStock.items?.map((item, idx) => (<tr key={idx} className="divide-x divide-[#F5F0E6]"><td className="p-4 truncate">{item.name}</td><td className="p-4 text-right font-mono">฿{item.cost}</td><td className="p-4 text-center font-mono">{item.qty}</td><td className="p-4 text-right text-[#B3543D]">฿{(Number(item.cost) * Number(item.qty)).toLocaleString()}</td><td className="p-4 text-center"><button type="button" onClick={() => handleRemoveStockItem(idx)} className="text-red-400 hover:text-red-600 transition-colors no-print"><X size={18}/></button></td></tr>))}</tbody></table></div></div>
          <div className="p-6 bg-[#FDFCF8] border border-[#F5F0E6] rounded-[32px] space-y-3"><div className="flex justify-between items-center text-xs font-bold text-[#8B8A73]"><span>ยอดรวมสินค้า (Subtotal)</span><span>฿{(newStock.items?.reduce((s, i) => s + (i.cost * i.qty), 0) || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div><div className="flex justify-between items-center"><span className="text-xs font-bold text-[#8B8A73]">ส่วนลดการค้า (Discount)</span><div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-[#D7BA9D]/30 w-32"><span className="text-[10px] font-black text-red-300">-฿</span><input type="number" className="w-full outline-none text-right text-xs text-red-500 font-bold bg-transparent" value={newStock.discount} onChange={e => setNewStock({...newStock, discount: e.target.value})} placeholder="0.00" /></div></div>
              {(() => {
                  const sub = newStock.items?.reduce((s, i) => s + (i.cost * i.qty), 0) || 0;
                  const disc = Number(newStock.discount) || 0;
                  const afterDisc = Math.max(0, sub - disc);
                  let vat = 0, beforeVat = 0, grandTotal = 0;
                  if (newStock.taxType === 'exclude') { beforeVat = afterDisc; vat = afterDisc * 0.07; grandTotal = afterDisc + vat; }
                  else if (newStock.taxType === 'include') { beforeVat = afterDisc / 1.07; vat = afterDisc - beforeVat; grandTotal = afterDisc; }
                  else { beforeVat = afterDisc; vat = 0; grandTotal = afterDisc; }
                  return (<div className="border-y border-dashed border-[#D7BA9D]/30 py-3 space-y-1.5"><div className="flex justify-between items-center text-[10px] font-medium text-[#8B8A73]"><span>ฐานภาษี (Tax Base)</span><span>฿{beforeVat.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div><div className="flex justify-between items-center text-[10px] font-medium text-[#8B8A73]"><span>ภาษีมูลค่าเพิ่ม (VAT 7%)</span><span>฿{vat.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div><div className="flex justify-between items-center text-sm font-extrabold text-[#433D3C] pt-1"><span>ยอดรวมทั้งสิ้น (Grand Total)</span><span>฿{grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div></div>);
              })()}
              <div className="flex justify-between items-center"><span className="text-xs font-bold text-blue-500 flex items-center gap-1"><Tag size={12}/> หักคูปองเงินสด (Cash Coupon)</span><div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-blue-100 w-32"><span className="text-[10px] font-black text-blue-300">-฿</span><input type="number" className="w-full outline-none text-right text-xs text-blue-500 font-bold bg-transparent" value={newStock.voucher} onChange={e => setNewStock({...newStock, voucher: e.target.value})} placeholder="0.00" /></div></div>
              <div className="flex justify-between items-center pt-2"><p className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest mb-1">ยอดชำระจริง (Net Payable)</p><p className="text-3xl font-black text-[#B3543D]">{(() => { const sub = newStock.items?.reduce((s, i) => s + (i.cost * i.qty), 0) || 0, disc = Number(newStock.discount) || 0, afterDisc = Math.max(0, sub - disc); let grand = 0; if (newStock.taxType === 'exclude') grand = afterDisc * 1.07; else grand = afterDisc; return `฿${Math.max(0, grand - (Number(newStock.voucher) || 0)).toLocaleString(undefined, {minimumFractionDigits: 2})}`; })()}</p></div>
          </div>
          <button onClick={handleReceiveStock} className="w-full bg-[#433D3C] text-white py-5 rounded-[24px] text-lg font-black shadow-xl hover:bg-[#2A2A2A] transition-all no-print mt-2">บันทึกรับสินค้า</button>
        </div>
      </Modal>

      <Modal isOpen={isProductModalOpen} onClose={() => setProductModalOpen(false)} title="เพิ่มสินค้าใหม่ (Performance Mode)" maxWidth="max-w-4xl">
        <form onSubmit={handleAddProduct} className="flex flex-col lg:flex-row gap-8 text-left">
           <div className="flex-1 flex flex-col gap-4"><div className="aspect-square bg-[#FDFCF8] border-2 border-dashed border-[#D7BA9D] rounded-[32px] flex flex-col items-center justify-center cursor-pointer hover:bg-[#F5F0E6] transition-all relative overflow-hidden group" onClick={() => fileInputRef.current?.click()}>{newProduct.image ? (<><img src={newProduct.image} alt="Preview" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><p className="text-white font-bold flex items-center gap-2"><ImagePlus size={20}/> เปลี่ยนรูปภาพ</p></div></>) : (<div className="text-center space-y-2 text-[#8B8A73]"><div className="w-16 h-16 bg-[#E8E1D5] rounded-full flex items-center justify-center mx-auto text-[#B3543D] mb-2"><UploadCloud size={32}/></div><p className="font-bold">อัปโหลดรูปภาพสินค้า</p><p className="text-xs opacity-70">รองรับไฟล์ PNG, JPG (Max 1MB)</p></div>)}<input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg" onChange={handleImageChange} /></div><div className="bg-[#F5F0E6] p-5 rounded-2xl space-y-3"><h5 className="font-bold text-sm flex items-center gap-2"><ScanBarcode size={18}/> Barcode / SKU Setup</h5><div className="space-y-2"><label className="text-[10px] font-black text-[#8B8A73] uppercase tracking-widest px-1">รหัสสินค้า (SKU)</label><div className="flex gap-2"><input type="text" className="flex-1 bg-white border border-[#D7BA9D]/30 rounded-xl px-4 py-2.5 text-sm font-bold outline-none" value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} placeholder="ระบุหรือสร้างอัตโนมัติ" /><button type="button" onClick={generateAutoSKU} className="bg-[#B3543D] text-white px-3 rounded-xl hover:bg-[#963F2C] transition-all"><Wand2 size={18}/></button></div></div><div className="space-y-2"><label className="text-[10px] font-black text-[#8B8A73] uppercase tracking-widest px-1">บาร์โค้ด (Barcode)</label><input type="text" className="w-full bg-white border border-[#D7BA9D]/30 rounded-xl px-4 py-2.5 text-sm font-bold outline-none" value={newProduct.barcode} onChange={e => setNewProduct({...newProduct, barcode: e.target.value})} placeholder="สแกนบาร์โค้ด..." /></div></div></div>
           <div className="flex-[1.5] space-y-6"><div className="space-y-4"><div className="space-y-2"><label className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest px-1">ชื่อสินค้า (Product Name)</label><input type="text" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-2xl px-5 py-3.5 text-[16px] font-bold outline-none focus:border-[#B3543D] transition-all" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder="ระบุชื่อสินค้า..." /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest px-1">หมวดหมู่</label><select className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-2xl px-4 py-3 text-sm font-bold outline-none" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}><option value="เครื่องดื่ม">เครื่องดื่ม</option><option value="อาหารแห้ง / ขนม">อาหารแห้ง / ขนม</option><option value="นมและผลิตภัณฑ์แช่เย็น">นมและผลิตภัณฑ์แช่เย็น</option><option value="อาหารแช่แข็ง">อาหารแช่แข็ง</option><option value="ของใช้ส่วนตัว">ของใช้ส่วนตัว</option><option value="ของใช้ในบ้าน / ทำความสะอาด">ของใช้ในบ้าน / ทำความสะอาด</option><option value="แม่และเด็ก">แม่และเด็ก</option><option value="สุขภาพและยา">สุขภาพและยา</option><option value="สัตว์เลี้ยง">สัตว์เลี้ยง</option><option value="อื่นๆ">อื่นๆ</option></select></div><div className="space-y-2"><label className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest px-1">แบรนด์</label><input type="text" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-2xl px-4 py-3 text-sm font-bold outline-none" value={newProduct.brand} onChange={e => setNewProduct({...newProduct, brand: e.target.value})} placeholder="ระบุแบรนด์" /></div></div></div><div className="p-1 border-t border-[#F5F0E6]"></div><div className="space-y-4"><h5 className="font-bold text-sm text-[#433D3C]">Pricing & Inventory</h5><div className="grid grid-cols-2 gap-5"><div className="space-y-2"><label className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest px-1">ราคาขาย (Retail Price)</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-[#D7BA9D]">฿</span><input type="number" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-2xl pl-8 pr-4 py-3.5 text-[18px] font-extrabold text-[#B3543D] outline-none" required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} placeholder="0.00" /></div></div><div className="space-y-2"><label className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest px-1">ต้นทุน (Cost)</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-[#D7BA9D]">฿</span><input type="number" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-2xl pl-8 pr-4 py-3.5 text-[16px] font-bold text-[#433D3C] outline-none" value={newProduct.cost} onChange={e => setNewProduct({...newProduct, cost: e.target.value})} placeholder="0.00" /></div></div></div><div className="grid grid-cols-2 gap-5"><div className="space-y-2"><label className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest px-1">หน่วยนับ (UOM)</label><input type="text" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/20 rounded-2xl px-5 py-3 text-[14px] font-bold outline-none" required value={newProduct.uom} onChange={e => setNewProduct({...newProduct, uom: e.target.value})} placeholder="ขวด, กล่อง..." /></div><div className="space-y-2"><label className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest px-1">Min. Stock Alert</label><input type="number" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/20 rounded-2xl px-5 py-3 text-[14px] font-bold outline-none" value={newProduct.minStock} onChange={e => setNewProduct({...newStock, minStock: e.target.value})} /></div></div></div><div className="pt-4"><button type="submit" className="w-full bg-[#B3543D] text-white py-4 rounded-xl text-lg font-black shadow-xl hover:bg-[#963F2C] transition-all no-print flex items-center justify-center gap-2"><CheckCircle2 size={24}/> บันทึกสินค้า</button></div></div>
        </form>
      </Modal>

      <ContactPickerModal 
        isOpen={fullTaxCustomerPickerOpen} 
        onClose={() => setFullTaxCustomerPickerOpen(false)} 
        contacts={contacts} 
        type="customer" 
        onSelect={(c) => setFullTaxData({...fullTaxData, customer: c.name, taxId: c.taxId, branch: c.branch, address: c.address})} 
      />
      <ContactPickerModal isOpen={isCustomerPickerOpen} onClose={() => setCustomerPickerOpen(false)} contacts={contacts} type="customer" onSelect={(c) => setCustomerInfo({ name: c.name, taxId: c.taxId, branch: c.branch, address: c.address })} />
      <ContactPickerModal isOpen={isVendorPickerOpen} onClose={() => setVendorPickerOpen(false)} contacts={contacts} type="vendor" onSelect={(v) => setNewStock({ ...newStock, vendor: v.name, taxId: v.taxId })} />
      <ContactPickerModal isOpen={expenseVendorPickerOpen} onClose={() => setExpenseVendorPickerOpen(false)} contacts={contacts} type="vendor" onSelect={(v) => setNewExpense({ ...newExpense, vendor: v.name, vendorId: v.id })} />
    </div>
  );
};

export default App;
