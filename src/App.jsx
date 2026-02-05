import React, { useState, useMemo, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, initializeFirestore, collection, doc, setDoc, addDoc, onSnapshot, query, getDoc, updateDoc, deleteDoc,
  orderBy, limit
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  ShoppingCart, Package, Users, FileSpreadsheet, 
  Plus, Search, Edit2, Trash2, ChevronRight, 
  Download, X, Box, Store, Truck, CreditCard, Leaf, 
  UserCheck, ArrowLeft, ClipboardList, Eye, CloudCog, 
  ToggleLeft, ToggleRight, AlertTriangle, Loader2,
  BadgePercent, Landmark, Container, Activity, Globe,
  TrendingUp, TrendingDown, Target, Award, ShoppingBag,
  Zap, Calendar, BarChart3, PieChart, Users2, LayoutGrid, Receipt,
  Calculator, Tag, ShieldCheck, Info, Percent, Hash, Printer, FileText,
  MoreVertical, CheckCircle2, Building2, FileCheck, Copy
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
    // Correction for simplistic logic errors manually
    res = res.replace("หนึ่งสิบ", "สิบ");
    res = res.replace("สิบหนึ่ง", "สิบเอ็ด");
    if(res.endsWith("หนึ่ง") && res.length > 4) res = res.substring(0, res.length-5) + "เอ็ด"; // Crude fix for some edge cases
    
    return res;
  }

  // Refined Logic specifically for "หนึ่ง" (Et) vs "หนึ่ง" (Nueng)
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
                } else if (pos % 6 === 0 && digit === 1 && i > 0) { // Not first digit
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
        
        // Fix for "One" at start
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
      .no-print { display: none !important; }
      .print-only { display: block !important; }
      body { background: white !important; }
      .modal-content { box-shadow: none !important; border: none !important; max-width: 100% !important; width: 100% !important; }
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 no-print">
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
const Sidebar = ({ currentView, setView, isDevMode, handleToggleMode, currentAppId }) => (
  <aside className="w-64 bg-[#F5F0E6] flex flex-col h-full border-r border-[#D7BA9D]/30 transition-all flex-shrink-0 no-print">
    <div className="p-8 flex flex-col items-center text-center">
      <div className="w-14 h-14 bg-[#B3543D] rounded-full flex items-center justify-center text-white mb-4 shadow-lg shadow-[#B3543D]/20"><Leaf size={28} /></div>
      <h1 className="text-xl font-extrabold text-[#433D3C] tracking-tight">eats and use</h1>
      <p className="text-[11px] text-[#8B8A73] uppercase tracking-[0.2em] font-bold mt-1">Pro Analytics</p>
    </div>
    <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
      {[
        { id: 'pos', icon: ShoppingCart, label: 'ขายสินค้า' },
        { id: 'inventory', icon: Package, label: 'คลังสินค้า' },
        { id: 'contacts', icon: Users, label: 'ฐานข้อมูล CRM' },
        { id: 'accounting', icon: CreditCard, label: 'สมุดบัญชี' },
        { id: 'reports', icon: BarChart3, label: 'รายงาน & วิเคราะห์' }
      ].map(item => (
        <button key={item.id} onClick={() => setView(item.id)} className={`flex items-center w-full px-5 py-3.5 space-x-3 rounded-2xl transition-all ${currentView === item.id ? 'bg-white text-[#B3543D] shadow-sm border border-[#D7BA9D]/30' : 'text-[#8B8A73] hover:bg-white/50'}`}>
          <item.icon size={20} /> <span className="font-bold text-[15px]">{item.label}</span>
        </button>
      ))}
    </nav>
    <div className="p-5 text-center space-y-3">
      <button onClick={handleToggleMode} className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all border shadow-sm ${isDevMode ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-700'}`}>
        <div className="flex flex-col text-left"><span className="text-[10px] opacity-70 uppercase tracking-wider">Mode</span><span className="text-[11px]">{isDevMode ? 'DEV-TEST' : 'PRODUCTION'}</span></div>
        {isDevMode ? <ToggleLeft size={24}/> : <ToggleRight size={24}/>}
      </button>
      <div className="bg-[#E8E1D5] rounded-2xl p-3 border border-[#D7BA9D]/30">
         <div className="flex items-center justify-center gap-2 text-[#433D3C] font-bold text-[11px]">
            <CloudCog size={14} className="text-[#B3543D]"/>
            <span className="font-mono">ID: {currentAppId ? currentAppId.slice(0,12) : '...'}</span>
         </div>
      </div>
    </div>
  </aside>
);

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

  const [isDevMode, setIsDevMode] = useState(() => localStorage.getItem('isDevMode') === 'true');
  const appId = isDevMode ? 'dev-test' : 'eats-and-use-2026';

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

  // Checkout States (Extended)
  const [salesChannel, setSalesChannel] = useState('Offline');
  const [orderId, setOrderId] = useState(''); // Platform Order ID
  const [discountAmount, setDiscountAmount] = useState(''); 
  const [shippingIncome, setShippingIncome] = useState(''); // เก็บลูกค้า
  const [actualShippingCost, setActualShippingCost] = useState(''); // ต้นทุนขนส่งจริง
  const [platformFee, setPlatformFee] = useState(''); // ค่าธรรมเนียมรวม
  const [posAdjustment, setPosAdjustment] = useState(''); // ปรับปรุงยอด (+/-)
  const [posVatType, setPosVatType] = useState('none'); // none, include, exclude
  const [isFullTax, setIsFullTax] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ name: '', taxId: '', branch: '00000', address: '' });

  // Modal States
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
  
  // Full Tax Converter State
  const [isFullTaxConverterOpen, setFullTaxConverterOpen] = useState(false);
  const [fullTaxData, setFullTaxData] = useState(null);
  const [fullTaxCustomerPickerOpen, setFullTaxCustomerPickerOpen] = useState(false);
  const [isFullInvoicePreviewOpen, setFullInvoicePreviewOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceType, setInvoiceType] = useState('original'); // 'original' | 'copy'

  // Form States
  const [newProduct, setNewProduct] = useState({ name: '', sku: '', category: 'เครื่องดื่ม', brand: '', uom: 'ชิ้น', price: 0, minStock: 5 });
  const [newStock, setNewStock] = useState({ lotNo: '', receiveDate: getThaiDate(), vendor: '', taxId: '', items: [], discount: 0, includeVat: true });
  const [stockItemInput, setStockItemInput] = useState({ productId: '', qty: '', cost: '' });
  const [newContact, setNewContact] = useState({ name: '', taxId: '', branch: '00000', email: '', phone: '', address: '', type: 'customer' });
  const [newExpense, setNewExpense] = useState({ date: getThaiDate(), category: 'อุปกรณ์แพ็คของ', amount: '', note: '', vendor: '', vendorId: '', discount: '', adjustments: '' });

  // --- Calculations (Memoized) ---
  const derivedValues = useMemo(() => {
    const subtotal = cart?.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.qty || 0)), 0) || 0;
    
    // คำนวณ VAT (7%)
    let vatAmount = 0;
    let totalAfterVat = subtotal;

    if (posVatType === 'exclude') {
        vatAmount = subtotal * 0.07;
        totalAfterVat = subtotal + vatAmount;
    } else if (posVatType === 'include') {
        vatAmount = subtotal - (subtotal / 1.07);
        totalAfterVat = subtotal; 
    }

    // ยอดรวมบิล (ที่ลูกค้าต้องจ่ายจริง)
    const totalBill = totalAfterVat + Number(shippingIncome || 0) - Number(discountAmount || 0);
    
    // รายรับสุทธิ (Payout)
    const finalPayout = totalBill - Number(platformFee || 0) - Number(actualShippingCost || 0) + Number(posAdjustment || 0);
    
    return { subtotal, vatAmount, totalBill, finalPayout };
  }, [cart, discountAmount, shippingIncome, platformFee, actualShippingCost, posAdjustment, posVatType]);

  const inventorySummary = useMemo(() => {
    if (!products) return [];
    return products.map((p, idx) => {
      const pLots = lots?.filter(l => l.productId === p.id) || [];
      const remaining = pLots.reduce((s, l) => s + (Number(l.remainingQty) || 0), 0);
      const value = pLots.reduce((s, l) => s + (Number(l.remainingQty) * Number(l.cost || 0)), 0);
      return { ...p, index: idx + 1, remaining, totalValue: value };
    });
  }, [products, lots]);

  const accSummary = useMemo(() => {
    const income = transactions?.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.amount || 0)), 0) || 0;
    const expense = transactions?.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0) || 0;
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const analyticsData = useMemo(() => {
    if (!transactions) return { byChannel: {}, topSelling: [], topSpenders: [], totalGP: 0, totalIncome: 0, totalExpense: 0, itemsLog: [] };
    
    const sales = transactions.filter(t => t.type === 'income');
    const expenses = transactions.filter(t => t.type === 'expense');
    
    const byChannel = sales.reduce((acc, t) => {
        const chan = safeStr(t.channel) || 'Offline';
        acc[chan] = (acc[chan] || 0) + (Number(t.amount) || 0);
        return acc;
    }, {});

    const productStats = {};
    const spenderStats = {};
    const itemsLog = [];

    sales.forEach(t => {
        const cName = safeStr(t.customer) || 'ทั่วไป';
        spenderStats[cName] = (spenderStats[cName] || 0) + (Number(t.amount) || 0);

        if (t.items && Array.isArray(t.items)) {
            t.items.forEach(item => {
                const itemName = safeStr(item.name);
                productStats[itemName] = (productStats[itemName] || 0) + (Number(item.qty) || 0);
                itemsLog.push({ ...item, date: t.date, customer: cName, channel: t.channel, orderId: t.orderId });
            });
        }
    });

    const topSelling = Object.entries(productStats).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topSpenders = Object.entries(spenderStats).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const totalIncome = sales.reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const totalExpense = expenses.reduce((s, t) => s + (Number(t.amount) || 0), 0);

    return { byChannel, topSelling, topSpenders, totalGP: totalIncome - totalExpense, totalIncome, totalExpense, itemsLog };
  }, [transactions]);

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

  // --- Handlers ---
  const handleAddProduct = async (e) => {
    if (e) e.preventDefault();
    if (!user) return;
    try {
      const productColl = collection(db, 'artifacts', appId, 'public', 'data', 'products');
      await addDoc(productColl, { ...newProduct, createdAt: new Date().toISOString() });
      setProductModalOpen(false);
      setNewProduct({ name: '', sku: '', category: 'เครื่องดื่ม', brand: '', uom: 'ชิ้น', price: 0, minStock: 5 });
    } catch (err) { console.error(err); }
  };

  const handleSaveContact = async (e) => {
    if (e) e.preventDefault();
    try {
      const contactColl = collection(db, 'artifacts', appId, 'public', 'data', 'contacts');
      await addDoc(contactColl, { ...newContact, createdAt: new Date().toISOString() });
      setContactModalOpen(false);
      setNewContact({ name: '', taxId: '', branch: '00000', email: '', phone: '', address: '', type: 'customer' });
    } catch (err) { console.error(err); }
  };

  const handleSaveExpense = async (e) => {
    if (e) e.preventDefault();
    if (!user || !newExpense.amount) return;
    try {
      const transColl = collection(db, 'artifacts', appId, 'public', 'data', 'transactions');
      const netAmount = Number(newExpense.amount) - Number(newExpense.discount || 0) + Number(newExpense.adjustments || 0);
      await addDoc(transColl, {
        date: newExpense.date,
        type: 'expense',
        category: newExpense.category,
        amount: netAmount,
        customer: newExpense.vendor || 'ไม่ระบุ',
        vendorId: newExpense.vendorId || '',
        note: newExpense.note || '',
        baseAmount: Number(newExpense.amount),
        discount: Number(newExpense.discount || 0),
        adjustments: Number(newExpense.adjustments || 0)
      });
      setExpenseModalOpen(false);
      setNewExpense({ date: getThaiDate(), category: 'อุปกรณ์แพ็คของ', amount: '', note: '', vendor: '', vendorId: '', discount: '', adjustments: '' });
      alert("บันทึกรายจ่ายสำเร็จ");
    } catch (err) { console.error(err); }
  };

  const handleDeleteTransaction = async (id) => {
      if (!confirm("ยืนยันการลบรายการนี้? (การลบจะไม่มีผลต่อสต็อกสินค้าโดยอัตโนมัติ)")) return;
      try {
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'transactions', id));
          alert("ลบรายการสำเร็จ");
      } catch (e) { console.error(e); }
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
          alert("อัปเดตข้อมูลสำเร็จ");
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
          alert("ออกใบกำกับภาษีเต็มรูปสำเร็จ เลขที่: " + invNo);
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
        abbNo: abbNo, // ใบกำกับภาษีอย่างย่อ (Ref ID)
        amount: derivedValues.finalPayout, 
        subtotal: derivedValues.subtotal,
        vatType: posVatType,
        vatAmount: derivedValues.vatAmount,
        totalBill: derivedValues.totalBill,
        discount: Number(discountAmount || 0),
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

      // Reset
      setCart([]); setShippingIncome(''); setDiscountAmount(''); setPlatformFee(''); 
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
      const totalCost = newStock.items.reduce((s, i) => s + (i.qty * i.cost), 0);
      
      await addDoc(tColl, { 
        date: newStock.receiveDate, 
        type: 'expense', 
        category: 'ซื้อสินค้าเข้าสต็อก',
        amount: totalCost - (Number(newStock.discount) || 0), 
        customer: safeStr(newStock.vendor) || 'ไม่ระบุ'
      });
      
      for (const i of newStock.items) {
        await addDoc(lColl, { 
          productId: i.productId, 
          lotNo: safeStr(newStock.lotNo), 
          initialQty: Number(i.qty),
          remainingQty: Number(i.qty), 
          cost: Number(i.cost), 
          receiveDate: newStock.receiveDate 
        });
      }
      setStockModalOpen(false);
      setNewStock({ lotNo: '', receiveDate: getThaiDate(), vendor: '', items: [], discount: 0, includeVat: true });
    } catch (e) { console.error(e); }
  };

  // --- Auth & Initial Sync ---
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
    return () => { uP(); uL(); uC(); uT(); };
  }, [user, appId]);

  if (loading && user) return <div className="h-screen w-full flex items-center justify-center bg-[#FDFCF8]"><Loader2 className="animate-spin text-[#B3543D]" size={40}/></div>;

  return (
    <div className="flex h-screen h-[100dvh] w-full text-[#433D3C] overflow-hidden bg-[#FDFCF8]">
      <GlobalStyles />
      <Sidebar currentView={view} setView={setView} isDevMode={isDevMode} handleToggleMode={handleToggleMode} currentAppId={appId} />

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
                      <div key={product.id} onClick={() => addToCart(product)} className={`bg-white p-6 rounded-[32px] border border-[#D7BA9D]/20 hover:border-[#B3543D]/50 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 ${info?.remaining <= 0 ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                        <div className="w-12 h-12 bg-[#F5F0E6] rounded-2xl flex items-center justify-center text-[#B3543D] mb-5"><Box size={24} /></div>
                        <h4 className="font-bold text-[15px] mb-1 truncate leading-tight">{safeStr(product.name)}</h4>
                        <div className="flex justify-between items-end mt-5">
                          <span className="text-xl font-extrabold text-[#B3543D]">฿{Number(product.price || 0).toLocaleString()}</span>
                          <div className="text-right">
                             <p className="text-[10px] uppercase font-bold text-[#8B8A73] mb-0.5">Stock</p>
                             <span className={`text-[13px] font-bold ${info?.remaining < (product.minStock || 5) ? 'text-red-500' : 'text-[#433D3C]'}`}>{info?.remaining || 0}</span>
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
                      
                      {/* --- Group Order Ref ID --- */}
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

                      {/* --- Group 0: Tax Configuration (VAT) --- */}
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

                      {/* --- Group 1: Marketplace & Logistics Detailed --- */}
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
                          </div>
                      </div>

                      {/* --- Group 2: Financial Adjustments --- */}
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
                  <div className="space-y-2">
                      <div className="flex justify-between items-center text-[#8B8A73] text-sm font-bold">
                        <span>Grand Total</span>
                        <span>฿{derivedValues.totalBill.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[15px] font-black text-[#433D3C] flex items-center gap-2 uppercase tracking-tighter">Net Payout <ShieldCheck size={16} className="text-green-600"/></span>
                        <span className="text-3xl font-black text-[#B3543D]">฿{derivedValues.finalPayout.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
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
                    <div className="flex items-center gap-2 bg-[#F5F0E6] p-1.5 rounded-2xl w-fit shadow-inner">
                        {[
                            { id: 'all', label: 'ทั้งหมด' },
                            { id: 'customer', label: 'ลูกค้า' },
                            { id: 'vendor', label: 'คู่ค้า' }
                        ].map(t => (
                            <button key={t.id} onClick={() => setCrmTypeFilter(t.id)} className={`px-6 py-2.5 rounded-xl text-sm font-extrabold transition-all ${crmTypeFilter === t.id ? 'bg-white text-[#B3543D] shadow-md' : 'text-[#8B8A73] hover:text-[#433D3C]'}`}>
                                {t.label}
                            </button>
                        ))}
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
                                    <button className="text-[12px] font-extrabold text-[#8B8A73] hover:text-[#B3543D] flex items-center gap-1.5 transition-colors"><Eye size={16}/> Profile</button>
                                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-2.5 hover:bg-[#F5F0E6] rounded-full text-[#8B8A73] transition-colors"><Edit2 size={16}/></button>
                                        <button className="p-2.5 hover:bg-red-50 rounded-full text-red-400 transition-colors" onClick={async () => {
                                            if(confirm("ยืนยันการลบข้อมูลผู้ติดต่อ?")) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'contacts', c.id));
                                        }}><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <button onClick={() => setContactModalOpen(true)} className="fixed bottom-12 right-12 w-18 h-18 bg-[#B3543D] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-all z-40 p-5"><Plus size={36}/></button>
            </div>
          )}

          {view === 'reports' && (
            <div className="w-full space-y-12 animate-in fade-in duration-300 text-[#433D3C]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="space-y-2">
                        <h3 className="text-4xl font-black text-[#433D3C] tracking-tighter">Pro POS Analytics</h3>
                        <p className="text-sm text-[#8B8A73] font-medium">ศูนย์รวมข้อมูลเชิงลึก วิเคราะห์ทิศทางธุรกิจและกำไรรายวินาที</p>
                    </div>
                    <div className="flex gap-2 glass-morphism p-2 rounded-2xl shadow-sm">
                        {[
                            { id: 'overview', label: 'ภาพรวมธุรกิจ', icon: LayoutGrid },
                            { id: 'log', label: 'Log ข้อมูลดิบ', icon: ClipboardList }
                        ].map(tab => (
                            <button key={tab.id} onClick={() => setReportSubView(tab.id)} className={`flex items-center gap-3 px-8 py-3 rounded-xl text-sm font-extrabold transition-all ${reportSubView === tab.id ? 'bg-[#B3543D] text-white shadow-xl shadow-[#B3543D]/20' : 'text-[#8B8A73] hover:bg-white'}`}>
                                <tab.icon size={18}/> {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {reportSubView === 'overview' && (
                    <div className="space-y-10 animate-in slide-in-from-bottom-6 duration-500">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div className="bg-white p-9 rounded-[48px] border border-[#D7BA9D]/20 shadow-sm transition-transform hover:-translate-y-2">
                                <p className="text-[11px] text-[#8B8A73] uppercase font-black tracking-widest mb-2">Revenue</p>
                                <h4 className="text-4xl font-black text-[#433D3C]">฿{analyticsData.totalIncome.toLocaleString()}</h4>
                                <div className="mt-4 flex items-center gap-2 text-green-500 text-sm font-bold"><TrendingUp size={16}/> +12.5%</div>
                            </div>
                            <div className="bg-white p-9 rounded-[48px] border border-[#D7BA9D]/20 shadow-sm transition-transform hover:-translate-y-2">
                                <p className="text-[11px] text-[#8B8A73] uppercase font-black tracking-widest mb-2">Cost of Goods</p>
                                <h4 className="text-4xl font-black text-[#433D3C]">฿{analyticsData.totalExpense.toLocaleString()}</h4>
                            </div>
                            <div className="bg-[#433D3C] p-9 rounded-[48px] shadow-2xl text-white transition-transform hover:-translate-y-2">
                                <p className="text-[11px] opacity-60 uppercase font-black tracking-widest mb-2">Gross Profit (GP)</p>
                                <h4 className="text-4xl font-black text-white">฿{analyticsData.totalGP.toLocaleString()}</h4>
                                <div className="mt-5 h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-400 rounded-full transition-all duration-1000" style={{ width: `${(analyticsData.totalGP / (analyticsData.totalIncome || 1) * 100) || 0}%` }}></div>
                                </div>
                            </div>
                            <div className="bg-white p-9 rounded-[48px] border border-[#D7BA9D]/20 shadow-sm transition-transform hover:-translate-y-2">
                                <p className="text-[11px] text-[#8B8A73] uppercase font-black tracking-widest mb-2">Total Orders</p>
                                <h4 className="text-4xl font-black text-[#433D3C]">{transactions?.filter(t=>t.type==='income').length}</h4>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            <div className="bg-white p-10 rounded-[56px] border border-[#D7BA9D]/20 shadow-sm">
                                <h5 className="font-black text-sm uppercase tracking-widest mb-10 flex items-center gap-3 text-[#433D3C]"><PieChart size={22} className="text-[#B3543D]"/> Sales by Channel</h5>
                                <div className="space-y-8">
                                    {Object.entries(channelConfig).map(([name, config]) => {
                                        const value = analyticsData.byChannel[name] || 0;
                                        const percent = (value / (analyticsData.totalIncome || 1) * 100) || 0;
                                        return (
                                            <div key={name} className="space-y-3">
                                                <div className="flex justify-between items-center text-sm font-bold">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#FDFCF8]" style={{ color: config.color }}>{React.createElement(config.brandIcon, { size: 20 })}</div>
                                                        <span className="text-[15px]">{name}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[16px]">฿{value.toLocaleString()}</span>
                                                        <span className="ml-3 text-[#8B8A73] font-medium text-xs">{percent.toFixed(1)}%</span>
                                                    </div>
                                                </div>
                                                <div className="h-3 w-full bg-[#FDFCF8] rounded-full overflow-hidden border border-[#F5F0E6] p-0.5">
                                                    <div className="h-full rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${percent}%`, backgroundColor: config.color }}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="bg-white p-10 rounded-[56px] border border-[#D7BA9D]/20 shadow-sm">
                                <h5 className="font-black text-sm uppercase tracking-widest mb-10 flex items-center gap-3 text-[#433D3C]"><Award size={22} className="text-[#B3543D]"/> Ranking Metrics</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-5">
                                        <p className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest border-b border-[#F5F0E6] pb-3">Top Products (Qty)</p>
                                        <div className="space-y-4">
                                          {analyticsData.topSelling.map(([name, qty], i) => (
                                              <div key={i} className="flex justify-between items-center bg-[#FDFCF8] p-3 rounded-2xl">
                                                  <span className="text-[13px] font-bold truncate w-28">{safeStr(name)}</span>
                                                  <span className="text-[12px] font-black bg-[#B3543D] text-white px-2.5 py-1 rounded-lg">{qty}</span>
                                              </div>
                                          ))}
                                        </div>
                                    </div>
                                    <div className="space-y-5">
                                        <p className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest border-b border-[#F5F0E6] pb-3">VIP Customers (Spent)</p>
                                        <div className="space-y-4">
                                          {analyticsData.topSpenders.map(([name, spent], i) => (
                                              <div key={i} className="flex justify-between items-center bg-[#FDFCF8] p-3 rounded-2xl">
                                                  <span className="text-[13px] font-bold truncate w-28">{safeStr(name)}</span>
                                                  <span className="text-[13px] font-black text-[#B3543D]">฿{spent.toLocaleString()}</span>
                                              </div>
                                          ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {reportSubView === 'log' && (
                    <div className="bg-white rounded-[56px] border border-[#D7BA9D]/20 shadow-xl overflow-hidden animate-in zoom-in duration-300">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#F5F0E6]/50 border-b text-[11px] font-black text-[#8B8A73] uppercase tracking-[0.15em]">
                                    <tr><th className="px-10 py-7">Timestamp</th><th className="px-10 py-7">Details</th><th className="px-10 py-7 text-center">Qty</th><th className="px-10 py-7">Account</th><th className="px-10 py-7 text-right">Net Payout</th></tr>
                                </thead>
                                <tbody className="divide-y divide-[#F5F0E6] text-sm">
                                    {analyticsData.itemsLog.length === 0 ? (
                                        <tr><td colSpan="5" className="p-20 text-center text-[#8B8A73] italic opacity-50">No data found.</td></tr>
                                    ) : [...analyticsData.itemsLog].reverse().map((item, idx) => (
                                        <tr key={idx} className="hover:bg-[#FDFCF8] transition-colors group">
                                            <td className="px-10 py-6 text-[#8B8A73] font-mono text-xs">{safeDate(item.date)}</td>
                                            <td className="px-10 py-6">
                                                <div className="font-bold text-[#433D3C]">{safeStr(item.name)}</div>
                                                <div className="flex gap-2 mt-1">
                                                    <span className="px-2 py-0.5 rounded bg-[#F5F0E6] text-[9px] font-black uppercase tracking-widest">{safeStr(item.channel)}</span>
                                                    {item.orderId && <span className="text-[9px] text-[#B3543D] font-mono">Ref: {item.orderId}</span>}
                                                </div>
                                            </td>
                                            <td className="px-10 py-6 font-mono text-center font-bold">{item.qty}</td>
                                            <td className="px-10 py-6 font-semibold text-[#8B8A73]">{item.customer}</td>
                                            <td className="px-10 py-6 text-right text-[#B3543D] font-black text-[15px]">฿{(Number(item.qty || 0) * Number(item.price || 0)).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
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
                    <button onClick={() => setProductModalOpen(true)} className="flex items-center gap-2.5 bg-white border border-[#D7BA9D]/30 px-6 py-3 rounded-2xl text-[14px] hover:bg-[#F5F0E6] transition-all shadow-sm"><Plus size={18}/> เพิ่มรายการสินค้า</button>
                    <button onClick={() => setStockModalOpen(true)} className="flex items-center gap-2.5 bg-[#B3543D] text-white px-6 py-3 rounded-2xl text-[14px] shadow-lg hover:shadow-xl transition-all"><Package size={18}/> รับสินค้าเข้าคลัง</button>
                 </div>
               </div>
               <div className="bg-white rounded-[40px] border border-[#D7BA9D]/20 shadow-xl overflow-hidden">
                  <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[#F5F0E6]/50 border-b text-[11px] font-black text-[#8B8A73] uppercase tracking-widest">
                      <tr><th className="px-8 py-6 w-16 text-center">ID</th><th className="px-8 py-6">Description</th><th className="px-8 py-6 text-right">Qty Balance</th><th className="px-8 py-6 text-right">Valuation</th></tr>
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
                            <td className="px-8 py-5 text-right font-bold">฿{(Number(l.remainingQty) * Number(l.cost || 0)).toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        inventorySummary?.map(p => (
                          <tr key={p.id} onClick={() => setSelectedProductId(p.id)} className="hover:bg-[#FDFCF8] cursor-pointer group transition-colors">
                            <td className="px-8 py-6 text-[#8B8A73] font-mono text-center">{p.index}</td>
                            <td className="px-8 py-6">
                                <div className="font-bold text-[15px] group-hover:text-[#B3543D] transition-colors">{safeStr(p.name)}</div>
                                <div className="text-[11px] text-[#B3543D] font-mono mt-1 font-bold uppercase tracking-wider">{safeStr(p.sku) || 'No SKU'}</div>
                            </td>
                            <td className="px-8 py-6 text-right font-bold text-lg">{p.remaining} <span className="text-xs font-medium text-[#8B8A73] ml-1">{p.uom}</span></td>
                            <td className="px-8 py-6 text-right font-black text-[#B3543D] text-[16px]">฿{Number(p.totalValue || 0).toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  </div>
               </div>
            </div>
          )}

          {view === 'accounting' && (
             <div className="w-full space-y-10 animate-in fade-in duration-300 text-[#433D3C] no-print">
                <div className="flex justify-between items-center">
                   <h3 className="text-2xl font-black">Account Ledger</h3>
                   <button onClick={() => setExpenseModalOpen(true)} className="flex items-center gap-2.5 bg-[#B3543D] text-white px-6 py-3 rounded-2xl text-[14px] shadow-lg hover:shadow-xl transition-all">
                      <Receipt size={18}/> บันทึกรายจ่ายอื่นๆ
                   </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <div className="bg-white p-8 rounded-[40px] border border-[#D7BA9D]/20 shadow-sm text-center transform transition-transform hover:-translate-y-1">
                       <p className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest mb-2">Cash Inflow</p>
                       <h4 className="text-3xl text-[#606C38] font-black">฿{accSummary.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
                   </div>
                   <div className="bg-white p-8 rounded-[40px] border border-[#D7BA9D]/20 shadow-sm text-center transform transition-transform hover:-translate-y-1">
                       <p className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest mb-2">Cash Outflow</p>
                       <h4 className="text-3xl text-[#B3543D] font-black">฿{accSummary.expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
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
                         {transactions?.map(t => (
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
                                        <button onClick={() => handleDeleteTransaction(t.id)} className="p-2 hover:bg-red-50 rounded-full text-red-400 transition-all" title="ลบ">
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
        </section>
      </main>

      {/* --- Modals --- */}

      {/* Modal: Full Tax Invoice View (ใบกำกับภาษีเต็มรูป) */}
      <Modal isOpen={isFullInvoicePreviewOpen} onClose={() => setFullInvoicePreviewOpen(false)} title="ใบกำกับภาษีเต็มรูป (Full Tax Invoice)" maxWidth="max-w-3xl">
          {selectedInvoice && (
              <div className="bg-white p-8 text-[#333] font-mono-receipt border border-gray-200 shadow-lg relative min-h-[800px] flex flex-col justify-between">
                  {/* Header / Actions */}
                  <div className="absolute top-4 right-4 no-print flex gap-2 z-10">
                      <button 
                        onClick={() => setInvoiceType('original')} 
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${invoiceType === 'original' ? 'bg-[#433D3C] text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                      >
                        ต้นฉบับ
                      </button>
                      <button 
                        onClick={() => setInvoiceType('copy')} 
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${invoiceType === 'copy' ? 'bg-[#433D3C] text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                      >
                        สำเนา
                      </button>
                  </div>

                  {/* Document Content */}
                  <div className="space-y-4">
                      {/* 1. Header: Title & Copy Type */}
                      <div className="flex justify-between items-start">
                           {/* Company Info */}
                           <div className="w-[60%] space-y-1">
                              <div className="flex items-center gap-3 mb-2">
                                  <div className="w-10 h-10 bg-[#B3543D] rounded-full flex items-center justify-center text-white"><Leaf size={20} /></div>
                                  <h4 className="text-xl font-bold text-[#B3543D]">บริษัท อีทส์ แอนด์ ยูส โปร จำกัด</h4>
                              </div>
                              <p className="text-sm font-bold">EATS AND USE PRO CO., LTD.</p>
                              <p className="text-xs">123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110</p>
                              <p className="text-xs">เลขประจำตัวผู้เสียภาษี: 010555XXXXXXX (สำนักงานใหญ่)</p>
                              <p className="text-xs">โทร: 02-XXX-XXXX</p>
                           </div>

                           {/* Document Meta */}
                           <div className="w-[35%] text-right space-y-2">
                              <h5 className="text-xl font-bold uppercase tracking-wide">ใบกำกับภาษี / ใบเสร็จรับเงิน</h5>
                              <p className="text-xs font-bold text-gray-500">TAX INVOICE / RECEIPT</p>
                              <div className="border border-gray-300 p-2 rounded text-center bg-gray-50">
                                  <p className="text-sm font-bold">{invoiceType === 'original' ? 'ต้นฉบับ / Original' : 'สำเนา / Copy'}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                                  <div className="text-right font-bold">เลขที่ / No.:</div>
                                  <div className="text-right">{selectedInvoice.invNo}</div>
                                  <div className="text-right font-bold">วันที่ / Date:</div>
                                  <div className="text-right">{safeDate(selectedInvoice.date)}</div>
                                  <div className="text-right font-bold">อ้างอิง / Ref.:</div>
                                  <div className="text-right">{selectedInvoice.abbNo}</div>
                              </div>
                           </div>
                      </div>

                      <hr className="border-gray-300 my-4"/>

                      {/* 2. Customer Section */}
                      <div className="border border-gray-300 rounded p-4 flex justify-between items-start">
                          <div className="w-full">
                              <p className="text-xs font-bold text-gray-500 uppercase mb-1">ลูกค้า / Customer</p>
                              <p className="text-sm font-bold mb-1">{selectedInvoice.fullTaxCustomer}</p>
                              <p className="text-xs mb-1">{selectedInvoice.fullTaxAddress}</p>
                              <p className="text-xs">
                                  <span className="font-bold">เลขประจำตัวผู้เสียภาษี:</span> {selectedInvoice.fullTaxTaxId || '-'} 
                                  <span className="mx-2">|</span> 
                                  <span className="font-bold">สาขา:</span> {selectedInvoice.fullTaxBranch || '00000'}
                              </p>
                          </div>
                      </div>

                      {/* 3. Items Table */}
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
                                  {/* Empty rows filler if needed, or just close border */}
                                  <tr className="border-t border-gray-300"></tr> 
                              </tbody>
                          </table>
                      </div>
                  </div>

                  {/* 4. Footer Section */}
                  <div className="space-y-4 mt-4">
                      <div className="flex gap-4 items-start">
                          {/* Left: Text Amount & Note */}
                          <div className="flex-1 space-y-4">
                              <div className="border border-gray-300 rounded bg-gray-50 p-3 text-center">
                                  <span className="text-xs font-bold text-gray-500 mr-2">จำนวนเงินตัวอักษร (Baht Text):</span>
                                  <span className="font-bold text-[#B3543D] text-sm">({ThaiBahtText(selectedInvoice.totalBill)})</span>
                              </div>
                              <div className="text-xs text-gray-500">
                                  <p><span className="font-bold">หมายเหตุ:</span> เอกสารนี้จัดทำโดยระบบคอมพิวเตอร์</p>
                              </div>
                          </div>

                          {/* Right: Totals */}
                          <div className="w-64 text-xs">
                              <div className="flex justify-between py-1 border-b border-gray-200">
                                  <span>รวมเป็นเงิน (Subtotal)</span>
                                  <span className="font-bold">{(selectedInvoice.subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              </div>
                              {selectedInvoice.discount > 0 && (
                                  <div className="flex justify-between py-1 border-b border-gray-200 text-red-500">
                                      <span>หักส่วนลด (Discount)</span>
                                      <span>-{(selectedInvoice.discount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                  </div>
                              )}
                              {selectedInvoice.shippingIncome > 0 && (
                                  <div className="flex justify-between py-1 border-b border-gray-200">
                                      <span>ค่าขนส่ง (Shipping)</span>
                                      <span>{(selectedInvoice.shippingIncome || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                  </div>
                              )}
                              <div className="flex justify-between py-1 border-b border-gray-200">
                                  <span>จำนวนเงินหลังหักส่วนลด</span>
                                  <span>{((selectedInvoice.subtotal - (selectedInvoice.discount || 0))).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between py-1 border-b border-gray-200">
                                  <span>ภาษีมูลค่าเพิ่ม 7% (VAT)</span>
                                  <span>{(selectedInvoice.vatAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between py-2 border-b border-gray-300 text-base font-bold bg-gray-100 px-2 mt-1">
                                  <span>จำนวนเงินทั้งสิ้น (Grand Total)</span>
                                  <span className="text-[#B3543D]">{(selectedInvoice.totalBill || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              </div>
                          </div>
                      </div>

                      {/* Signatures */}
                      <div className="flex justify-between mt-8 pt-4 pb-2">
                          <div className="text-center w-48">
                              <div className="border-b border-gray-400 border-dashed h-8"></div>
                              <p className="text-xs mt-2">ผู้รับวางบิล / ผู้จ่ายเงิน</p>
                              <p className="text-[10px] text-gray-400">Receiver / Payer</p>
                              <p className="text-[10px] mt-1">วันที่ ____/____/____</p>
                          </div>
                          <div className="text-center w-48">
                              <div className="border-b border-gray-400 border-dashed h-8"></div>
                              <p className="text-xs mt-2">ผู้รับเงิน / ผู้ออกใบกำกับภาษี</p>
                              <p className="text-[10px] text-gray-400">Cashier / Authorized Signature</p>
                              <p className="text-[10px] mt-1">วันที่ {safeDate(selectedInvoice.date)}</p>
                          </div>
                      </div>
                  </div>

                  {/* Print Button */}
                  <div className="mt-4 text-center no-print">
                     <button onClick={() => window.print()} className="bg-[#433D3C] text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-[#2A2A2A] transition-all flex items-center justify-center gap-2 mx-auto">
                        <Printer size={18}/> พิมพ์ / บันทึก PDF
                     </button>
                  </div>
              </div>
          )}
      </Modal>

      {/* Modal: Full Tax Converter */}
      <Modal isOpen={isFullTaxConverterOpen} onClose={() => { setFullTaxConverterOpen(false); setFullTaxData(null); }} title="ออกใบกำกับภาษีเต็มรูป (Convert ABB to Full Invoice)">
          {fullTaxData && (
              <div className="space-y-6 text-left">
                  <div className="bg-[#FDFCF8] p-5 rounded-2xl border border-[#F5F0E6] space-y-2">
                      <p className="text-[10px] font-black text-[#8B8A73] uppercase tracking-widest">Original Reference</p>
                      <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-[#433D3C]">เลขที่ ABB อ้างอิง:</span>
                          <span className="font-mono text-sm font-black text-[#B3543D]">{fullTaxData.abbNo}</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-[#433D3C]">ยอดรวมสุทธิ:</span>
                          <span className="text-lg font-black">฿{(fullTaxData.totalBill || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                  </div>

                  <div className="space-y-4">
                      <div className="space-y-2">
                          <label className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest px-1">Customer / Tax Info</label>
                          <button 
                            type="button" 
                            onClick={() => setFullTaxCustomerPickerOpen(true)} 
                            className="w-full flex items-center justify-between bg-white border border-[#D7BA9D]/30 rounded-2xl px-5 py-3.5 text-sm font-bold text-[#8B8A73] hover:border-[#B3543D] transition-all"
                          >
                              <span>{fullTaxData.customer || "เลือกจากฐานข้อมูล CRM..."}</span>
                              <ChevronRight size={18}/>
                          </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <label className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest px-1">เลขผู้เสียภาษี</label>
                              <input type="text" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-2xl px-5 py-3 font-mono text-[14px] outline-none" value={fullTaxData.taxId || ''} onChange={e => setFullTaxData({...fullTaxData, taxId: e.target.value})} placeholder="13 หลัก" />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest px-1">สาขา</label>
                              <input type="text" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-2xl px-5 py-3 text-[14px] outline-none" value={fullTaxData.branch || ''} onChange={e => setFullTaxData({...fullTaxData, branch: e.target.value})} placeholder="00000" />
                          </div>
                      </div>

                      <div className="space-y-2">
                          <label className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest px-1">ที่อยู่ใบกำกับภาษี</label>
                          <textarea className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-2xl px-5 py-3 text-[13px] outline-none h-20" value={fullTaxData.address || ''} onChange={e => setFullTaxData({...fullTaxData, address: e.target.value})} placeholder="ระบุที่อยู่ที่ต้องการให้ออกใบกำกับภาษี..." />
                      </div>
                  </div>

                  <div className="pt-4">
                      <button 
                        onClick={handleIssueFullTax}
                        className="w-full bg-[#B3543D] text-white py-5 rounded-[24px] text-lg font-black shadow-xl hover:bg-[#963F2C] transition-all flex items-center justify-center gap-3"
                      >
                          <CheckCircle2 size={24}/> ออกใบกำกับภาษีเต็มรูป
                      </button>
                  </div>
              </div>
          )}
      </Modal>

      {/* Modal: Edit Transaction */}
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
                  <AlertTriangle size={20} className="shrink-0"/>
                  <p className="text-[11px] font-bold">หมายเหตุ: การแก้ไขยอดเงินไม่สามารถทำได้เพื่อป้องกันความผิดพลาดทางบัญชี หากยอดเงินผิดกรุณาลบรายการแล้วสร้างใหม่</p>
              </div>
              <button type="submit" className="w-full bg-[#B3543D] text-white py-5 rounded-[24px] text-lg font-black shadow-xl hover:bg-[#963F2C] transition-all">บันทึกการแก้ไข</button>
          </form>
        )}
      </Modal>

      {/* Modal: Simplified Receipt View */}
      <Modal isOpen={isReceiptModalOpen} onClose={() => setReceiptModalOpen(false)} title="ใบกำกับภาษีอย่างย่อ (Simplified Invoice)" maxWidth="max-w-sm">
        {lastTransaction && (
          <div className="flex flex-col items-center font-mono-receipt text-[#433D3C]">
             <div className="text-center mb-6 space-y-1">
                <div className="w-10 h-10 bg-[#B3543D] rounded-full flex items-center justify-center text-white mx-auto mb-2"><Leaf size={20} /></div>
                <h4 className="text-[15px] font-bold uppercase">eats and use Pro</h4>
                <p className="text-[10px] opacity-60">เลขประจำตัวผู้เสียภาษี: 010-XXXX-XXXXX</p>
                <p className="text-[10px] opacity-60">สำนักงานใหญ่: 00000</p>
             </div>
             
             <div className="w-full border-y border-dashed border-[#D7BA9D] py-4 my-2 text-[11px] space-y-1">
                <div className="flex justify-between font-bold"><span>เลขที่ใบเสร็จ (Ref ID):</span> <span>{lastTransaction.abbNo}</span></div>
                <div className="flex justify-between"><span>วันที่:</span> <span>{safeDate(lastTransaction.date)}</span></div>
                <div className="flex justify-between"><span>ช่องทาง:</span> <span>{lastTransaction.channel}</span></div>
                {lastTransaction.orderId && <div className="flex justify-between"><span>Order ID:</span> <span>{lastTransaction.orderId}</span></div>}
             </div>

             <div className="w-full space-y-2 mb-6">
                {lastTransaction.items && lastTransaction.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-[11px]">
                      <div className="flex gap-2"><span>{item.qty}x</span> <span className="truncate w-32">{item.name}</span></div>
                      <span>฿{(item.qty * item.price).toLocaleString()}</span>
                  </div>
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
                <button 
                  onClick={() => { window.print(); }}
                  className="w-full bg-[#433D3C] text-white py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-2 shadow-lg"
                >
                  <Printer size={14}/> พิมพ์ใบเสร็จอย่างย่อ
                </button>
             </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isExpenseModalOpen} onClose={() => setExpenseModalOpen(false)} title="บันทึกรายจ่ายทั่วไป (General Expense Manager)" maxWidth="max-w-2xl">
        <form onSubmit={handleSaveExpense} className="space-y-8 text-left">
            <div className="grid grid-cols-2 gap-5 bg-[#F5F0E6] p-6 rounded-[32px]">
                <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest px-1">หมวดหมู่รายจ่าย</label>
                    <select className="w-full bg-white border border-[#D7BA9D]/30 rounded-2xl px-5 py-3.5 text-[15px] font-bold outline-none focus:border-[#B3543D]" value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})}>
                        <option value="อุปกรณ์แพ็คของ">อุปกรณ์แพ็คของ (กล่อง/เทป)</option>
                        <option value="ค่าจัดส่ง">ค่าจัดส่ง (Logistics)</option>
                        <option value="ค่าสาธารณูปโภค">ค่าสาธารณูปโภค (น้ำ/ไฟ/เน็ต)</option>
                        <option value="ค่าเช่าที่">ค่าเช่าที่</option>
                        <option value="ค่าการตลาด">ค่าการตลาด / โฆษณา</option>
                        <option value="ค่าอุปกรณ์สำนักงาน">ค่าอุปกรณ์สำนักงาน</option>
                        <option value="รายจ่ายอื่นๆ">รายจ่ายอื่นๆ</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest px-1">วันที่จ่าย</label>
                    <input type="date" className="w-full bg-white border border-[#D7BA9D]/30 rounded-2xl px-5 py-3.5 text-[15px] font-bold outline-none focus:border-[#B3543D]" required value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} />
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest px-1">Financial Data</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#8B8A73] px-1">ยอดเงินพื้นฐาน</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#D7BA9D]">฿</span>
                            <input type="number" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-2xl pl-8 pr-4 py-3.5 text-[16px] font-extrabold outline-none focus:border-[#B3543D]" required value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} placeholder="0.00" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-red-400 px-1">ส่วนลด</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-red-200">฿</span>
                            <input type="number" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-2xl pl-8 pr-4 py-3.5 text-[16px] font-extrabold outline-none focus:border-red-400 text-red-500" value={newExpense.discount} onChange={e => setNewExpense({...newExpense, discount: e.target.value})} placeholder="0" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-blue-400 px-1">ปรับปรุงยอด</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-200">฿</span>
                            <input type="number" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-2xl pl-8 pr-4 py-3.5 text-[16px] font-extrabold outline-none focus:border-blue-400 text-blue-600" value={newExpense.adjustments} onChange={e => setNewExpense({...newExpense, adjustments: e.target.value})} placeholder="+/-" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest px-1">คู่ค้า / ผู้รับเงิน (Vendor)</label>
                <div className="flex gap-3">
                    <button type="button" onClick={() => setExpenseVendorPickerOpen(true)} className="flex-[2] flex items-center justify-between bg-white border border-[#D7BA9D]/30 rounded-2xl px-5 py-3.5 text-sm font-bold text-[#8B8A73] hover:border-[#B3543D] transition-all">
                        <span>{newExpense.vendor || "ค้นหาจาก CRM..."}</span>
                        <ChevronRight size={18}/>
                    </button>
                    <input type="text" className="flex-1 bg-white border border-[#D7BA9D]/30 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-[#B3543D]" value={newExpense.vendor} onChange={e => setNewExpense({...newExpense, vendor: e.target.value, vendorId: ''})} placeholder="หรือระบุชื่อ..." />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest px-1">บันทึกเพิ่มเติม</label>
                <textarea className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-2xl px-5 py-3 text-[14px] outline-none focus:border-[#B3543D] h-20 font-medium" value={newExpense.note} onChange={e => setNewExpense({...newExpense, note: e.target.value})} placeholder="ระบุรายละเอียด..." />
            </div>

            <div className="p-6 bg-[#FDFCF8] border border-[#F5F0E6] rounded-[24px] flex justify-between items-center no-print">
                <div>
                    <p className="text-[10px] font-black text-[#8B8A73] uppercase tracking-widest mb-1">ยอดจ่ายสุทธิ (Net)</p>
                    <p className="text-3xl font-black text-[#B3543D]">฿{(Number(newExpense.amount) - Number(newExpense.discount || 0) + Number(newExpense.adjustments || 0)).toLocaleString()}</p>
                </div>
                <button type="submit" className="bg-[#B3543D] text-white px-10 py-4 rounded-[20px] text-lg font-black shadow-xl hover:bg-[#963F2C] transition-all flex items-center gap-2">
                    <Receipt size={20}/> บันทึกรายจ่าย
                </button>
            </div>
        </form>
      </Modal>

      <Modal isOpen={isContactModalOpen} onClose={() => setContactModalOpen(false)} title="เพิ่มข้อมูล CRM">
        <form onSubmit={handleSaveContact} className="space-y-6 text-left">
            <div className="flex gap-4 p-5 bg-[#F5F0E6] rounded-3xl">
               <label className="flex-1 flex items-center justify-center gap-3 bg-white p-3 rounded-2xl cursor-pointer shadow-sm border border-transparent hover:border-[#B3543D] transition-all">
                  <input type="radio" className="w-4 h-4 accent-[#B3543D]" name="ctype" checked={newContact.type === 'customer'} onChange={() => setNewContact({...newContact, type: 'customer'})} /> 
                  <span className="text-sm font-bold text-[#433D3C]">ลูกค้า</span>
               </label>
               <label className="flex-1 flex items-center justify-center gap-3 bg-white p-3 rounded-2xl cursor-pointer shadow-sm border border-transparent hover:border-[#B3543D] transition-all">
                  <input type="radio" className="w-4 h-4 accent-[#B3543D]" name="ctype" checked={newContact.type === 'vendor'} onChange={() => setNewContact({...newContact, type: 'vendor'})} /> 
                  <span className="text-sm font-bold text-[#433D3C]">คู่ค้า</span>
               </label>
            </div>
            <div className="space-y-2">
                <label className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest px-1">ชื่อ</label>
                <input type="text" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-2xl px-5 py-3.5 text-[15px] font-bold outline-none focus:border-[#B3543D] transition-all" required value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-5">
               <div className="space-y-2">
                   <label className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest px-1">Tax ID</label>
                   <input type="text" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-2xl px-5 py-3.5 text-[15px] font-mono outline-none focus:border-[#B3543D]" value={newContact.taxId} onChange={e => setNewContact({...newContact, taxId: e.target.value})} />
               </div>
               <div className="space-y-2">
                   <label className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest px-1">สาขา</label>
                   <input type="text" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-2xl px-5 py-3.5 text-[15px] outline-none focus:border-[#B3543D]" value={newContact.branch} onChange={e => setNewContact({...newContact, branch: e.target.value})} />
               </div>
            </div>
            <button type="submit" className="w-full bg-[#B3543D] text-white py-5 rounded-[24px] text-lg font-black shadow-xl hover:bg-[#963F2C] transition-all mt-4 no-print">บันทึกข้อมูล CRM</button>
        </form>
      </Modal>

      <Modal isOpen={isStockModalOpen} onClose={() => setStockModalOpen(false)} title="บันทึกรับสินค้าเข้าสต็อก" maxWidth="max-w-3xl">
        <div className="space-y-8 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#F5F0E6] p-7 rounded-[32px] shadow-inner">
             <div className="col-span-1 md:col-span-2 space-y-2">
                <label className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest px-1">คู่ค้า (Vendor)</label>
                <div className="flex gap-3">
                    <button type="button" onClick={() => setVendorPickerOpen(true)} className="flex-[2] flex items-center justify-between bg-white border border-[#D7BA9D]/30 rounded-2xl px-5 py-3 text-sm font-bold text-[#8B8A73] hover:border-[#B3543D] transition-all"><span>{newStock.vendor || "เลือกจาก CRM..."}</span><ChevronRight size={18}/></button>
                    <input type="text" className="flex-1 bg-white border border-[#D7BA9D]/30 rounded-2xl px-5 py-3 text-sm font-bold outline-none" value={newStock.vendor} onChange={e => setNewStock({...newStock, vendor: e.target.value})} placeholder="หรือระบุชื่อ..." />
                </div>
             </div>
             <div className="space-y-1">
                <label className="text-[11px] font-black uppercase text-[#8B8A73] px-1">Lot No.</label>
                <div className="font-mono text-[17px] font-extrabold text-[#B3543D] px-1">{newStock.lotNo || 'Auto-Generating'}</div>
             </div>
             <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-[#8B8A73] px-1">วันที่รับ</label>
                <input type="date" className="w-full bg-white border border-[#D7BA9D]/30 rounded-2xl px-5 py-3 text-sm font-bold outline-none" value={newStock.receiveDate} onChange={e => setNewStock({...newStock, receiveDate: e.target.value})} />
             </div>
          </div>
          
          <div className="space-y-4">
             <h5 className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest px-1">เพิ่มสินค้า</h5>
             <div className="flex flex-col lg:flex-row gap-3 items-end">
                <div className="flex-[3] w-full">
                   <select className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-[#B3543D]" value={stockItemInput.productId} onChange={e => setStockItemInput({...stockItemInput, productId: e.target.value})}>
                      <option value="">-- เลือกสินค้า --</option>
                      {products?.map(p => <option key={p.id} value={p.id}>{safeStr(p.name)}</option>)}
                   </select>
                </div>
                <div className="flex-[2] flex gap-3 w-full">
                    <input type="number" placeholder="Cost" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-2xl px-4 py-3.5 text-sm font-bold text-center" value={stockItemInput.cost} onChange={e => setStockItemInput({...stockItemInput, cost: e.target.value})} />
                    <input type="number" placeholder="Qty" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-2xl px-4 py-3.5 text-sm font-bold text-center" value={stockItemInput.qty} onChange={e => setStockItemInput({...stockItemInput, qty: e.target.value})} />
                    <button type="button" onClick={handleAddStockItem} className="bg-[#B3543D] text-white w-14 h-14 rounded-2xl flex items-center justify-center hover:bg-[#963F2C] shadow-lg shrink-0 transition-all no-print"><Plus size={24}/></button>
                </div>
             </div>
             
             <div className="border border-[#D7BA9D]/20 rounded-[32px] overflow-hidden bg-white">
                <table className="w-full text-left text-sm">
                   <thead className="bg-[#FDFCF8] border-b text-[10px] font-black uppercase tracking-widest text-[#8B8A73]"><tr className="divide-x divide-[#F5F0E6]"><th className="p-4">Item</th><th className="p-4 text-right">Unit Cost</th><th className="p-4 text-center">Qty</th><th className="p-4 text-right">Subtotal</th><th className="w-12"></th></tr></thead>
                   <tbody className="divide-y divide-[#F5F0E6] font-bold">
                      {!newStock.items?.length && <tr><td colSpan="5" className="p-12 text-center text-[#8B8A73] italic opacity-50">ยังไม่มีข้อมูล</td></tr>}
                      {newStock.items?.map((item, idx) => (
                        <tr key={idx} className="divide-x divide-[#F5F0E6]">
                            <td className="p-4 truncate">{item.name}</td>
                            <td className="p-4 text-right font-mono">฿{item.cost}</td>
                            <td className="p-4 text-center font-mono">{item.qty}</td>
                            <td className="p-4 text-right text-[#B3543D]">฿{(Number(item.cost) * Number(item.qty)).toLocaleString()}</td>
                            <td className="p-4 text-center"><button type="button" onClick={() => handleRemoveStockItem(idx)} className="text-red-400 hover:text-red-600 transition-colors no-print"><X size={18}/></button></td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
          <div className="pt-6 border-t border-[#F5F0E6] flex justify-between items-center">
             <div className="flex items-center gap-4">
                 <span className="text-sm font-bold text-[#8B8A73] uppercase tracking-wider">Discount:</span>
                 <div className="flex items-center gap-2 bg-[#FDFCF8] px-4 py-2 rounded-xl border border-[#D7BA9D]/30 no-print">
                    <span className="text-xs font-black text-[#D7BA9D]">฿</span>
                    <input type="number" className="w-24 outline-none text-right text-[16px] text-red-500 font-extrabold bg-transparent" value={newStock.discount} onChange={e => setNewStock({...newStock, discount: e.target.value})} />
                 </div>
             </div>
             <div className="text-right">
                <p className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest mb-1">Grand Total</p>
                <p className="text-3xl font-black text-[#B3543D]">฿{Math.max(0, (newStock.items?.reduce((s, i) => s + (i.cost * i.qty), 0) || 0) - Number(newStock.discount || 0)).toLocaleString()}</p>
             </div>
          </div>
          <button onClick={handleReceiveStock} className="w-full bg-[#433D3C] text-white py-5 rounded-[24px] text-lg font-black shadow-xl hover:bg-[#2A2A2A] transition-all no-print">บันทึกรับสินค้า</button>
        </div>
      </Modal>

      <Modal isOpen={isProductModalOpen} onClose={() => setProductModalOpen(false)} title="เพิ่มสินค้าใหม่">
        <form onSubmit={handleAddProduct} className="space-y-6 text-left">
           <div className="space-y-2">
               <label className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest px-1">Description</label>
               <input type="text" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-2xl px-5 py-3.5 text-[15px] font-bold outline-none focus:border-[#B3543D] transition-all" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder="ระบุชื่อสินค้า..." />
           </div>
           <div className="grid grid-cols-2 gap-5">
             <div className="space-y-2">
                 <label className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest px-1">Retail Price</label>
                 <div className="flex items-center gap-3 bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-2xl px-5 py-3.5">
                    <span className="text-sm font-black text-[#D7BA9D]">฿</span>
                    <input type="number" className="w-full bg-transparent text-[16px] font-extrabold outline-none" required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                 </div>
             </div>
             <div className="space-y-2">
                 <label className="text-[11px] font-black text-[#8B8A73] uppercase tracking-widest px-1">UOM</label>
                 <input type="text" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/20 rounded-2xl px-5 py-3.5 text-[15px] font-bold outline-none" required value={newProduct.uom} onChange={e => setNewProduct({...newProduct, uom: e.target.value})} placeholder="ขวด, กล่อง..." />
             </div>
           </div>
           <button type="submit" className="w-full bg-[#B3543D] text-white py-5 rounded-[24px] text-lg font-black shadow-xl hover:bg-[#963F2C] transition-all mt-4 no-print">บันทึกสินค้า</button>
        </form>
      </Modal>
      
      {/* Customer Picker for Full Tax issuance */}
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
