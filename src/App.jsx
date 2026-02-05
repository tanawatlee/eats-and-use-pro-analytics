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
  MoreVertical, CheckCircle2, Building2, User, Loader
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
const thaiBahtText = (num) => {
    if (!num || isNaN(num)) return "ศูนย์บาทถ้วน";
    const minus = num < 0 ? "ลบ" : "";
    num = Math.abs(num);
    const numberText = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
    const unitText = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];
    
    let [integerPart, decimalPart] = num.toFixed(2).split(".");
    
    const convert = (numStr) => {
        let text = "";
        let n = numStr.length;
        for (let i = 0; i < n; i++) {
            let digit = parseInt(numStr.charAt(i));
            let pos = n - 1 - i;
            if (digit !== 0) {
                if (pos % 6 === 1 && digit === 1) text += "เอ็ด";
                else if (pos % 6 === 1 && digit === 2) text += "ยี่";
                else if (pos % 6 === 0 && digit === 1 && i > 0) text += "เอ็ด";
                else text += numberText[digit];
                text += unitText[pos % 6];
            }
            if (pos % 6 === 0 && pos > 0) text += "ล้าน";
        }
        return text.replace(/หนึ่งสิบ/g, "สิบ").replace(/ยี่สิบ/g, "ยี่สิบ").replace(/สิบหนึ่ง/g, "สิบเอ็ด");
    };

    let result = minus + convert(integerPart) + "บาท";
    if (parseInt(decimalPart) === 0) result += "ถ้วน";
    else result += convert(decimalPart) + "สตางค์";
    
    return result || "ศูนย์บาทถ้วน";
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
      body { background: white !important; padding: 0 !important; margin: 0 !important; }
      .modal-container { position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; max-width: 100% !important; box-shadow: none !important; margin: 0 !important; border: none !important; padding: 0 !important; overflow: visible !important; }
      .invoice-page { border: none !important; padding: 0 !important; width: 100% !important; }
      .fixed { position: static !important; }
      .bg-black\\/40 { background: transparent !important; backdrop-filter: none !important; }
      @page { margin: 1cm; size: auto; }
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
      <div className={`bg-white rounded-[32px] w-full ${maxWidth} overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 text-[#433D3C] modal-container`}>
        <div className="p-6 border-b border-[#F5F0E6] flex justify-between items-center bg-[#FDFCF8] no-print">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-[#F5F0E6] rounded-full transition-colors text-[#8B8A73]"><X size={20} /></button>
        </div>
        <div className="p-8 max-h-[85vh] overflow-y-auto custom-scrollbar">{children}</div>
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

  // Checkout States
  const [salesChannel, setSalesChannel] = useState('Offline');
  const [orderId, setOrderId] = useState(''); 
  const [discountAmount, setDiscountAmount] = useState(''); 
  const [shippingIncome, setShippingIncome] = useState(''); 
  const [actualShippingCost, setActualShippingCost] = useState(''); 
  const [platformFee, setPlatformFee] = useState(''); 
  const [posAdjustment, setPosAdjustment] = useState(''); 
  const [posVatType, setPosVatType] = useState('none'); 
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
  
  // Full Tax States
  const [isFullTaxConverterOpen, setFullTaxConverterOpen] = useState(false);
  const [fullTaxData, setFullTaxData] = useState(null);
  const [fullTaxCustomerPickerOpen, setFullTaxCustomerPickerOpen] = useState(false);
  const [isFullInvoicePreviewOpen, setFullInvoicePreviewOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceCopyType, setInvoiceCopyType] = useState('original'); 
  const [isGeneratingPrint, setIsGeneratingPrint] = useState(false);

  // Form States
  const [newProduct, setNewProduct] = useState({ name: '', sku: '', category: 'เครื่องดื่ม', brand: '', uom: 'ชิ้น', price: 0, minStock: 5 });
  const [newStock, setNewStock] = useState({ lotNo: '', receiveDate: getThaiDate(), vendor: '', taxId: '', items: [], discount: 0, includeVat: true });
  const [stockItemInput, setStockItemInput] = useState({ productId: '', qty: '', cost: '' });
  const [newContact, setNewContact] = useState({ name: '', taxId: '', branch: '00000', email: '', phone: '', address: '', type: 'customer' });
  const [newExpense, setNewExpense] = useState({ date: getThaiDate(), category: 'อุปกรณ์แพ็คของ', amount: '', note: '', vendor: '', vendorId: '', discount: '', adjustments: '' });

  // --- Calculations ---
  const derivedValues = useMemo(() => {
    const subtotal = cart?.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.qty || 0)), 0) || 0;
    let vatAmount = 0;
    let totalAfterVat = subtotal;

    if (posVatType === 'exclude') {
        vatAmount = subtotal * 0.07;
        totalAfterVat = subtotal + vatAmount;
    } else if (posVatType === 'include') {
        vatAmount = subtotal - (subtotal / 1.07);
        totalAfterVat = subtotal; 
    }

    const totalBill = totalAfterVat + Number(shippingIncome || 0) - Number(discountAmount || 0);
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

  // --- Handlers ---
  const handleSaveContact = async (e) => {
    if (e) e.preventDefault();
    try {
      const contactColl = collection(db, 'artifacts', appId, 'public', 'data', 'contacts');
      await addDoc(contactColl, { ...newContact, createdAt: new Date().toISOString() });
      setContactModalOpen(false);
      setNewContact({ name: '', taxId: '', branch: '00000', email: '', phone: '', address: '', type: 'customer' });
    } catch (err) { console.error(err); }
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

      setCart([]); setShippingIncome(''); setDiscountAmount(''); setPlatformFee(''); 
      setActualShippingCost(''); setPosAdjustment(''); setPosVatType('none'); 
      setOrderId(''); setIsFullTax(false);
    } catch (err) { console.error(err); }
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
          alert("บันทึกข้อมูลใบกำกับภาษีสำเร็จ");
      } catch (e) { console.error(e); }
  };

  const handlePrintRequest = () => {
      setIsGeneratingPrint(true);
      setTimeout(() => {
          window.print();
          setIsGeneratingPrint(false);
      }, 1200);
  };

  const handleDeleteTransaction = async (id) => {
      if (!confirm("ยืนยันการลบรายการนี้?")) return;
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
            <input type="text" placeholder="ค้นหาข้อมูล..." className="pl-11 pr-5 py-2.5 bg-white border border-[#D7BA9D]/30 rounded-2xl text-[14px] w-80 outline-none focus:border-[#B3543D] transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
                      <div key={product.id} onClick={() => { if (info?.remaining > 0) { const ex = cart.find(i => i.id === product.id); if (!ex || ex.qty < info.remaining) { setCart([...cart.filter(i => i.id !== product.id), { ...product, qty: (ex?.qty || 0) + 1 }]) } } }} className={`bg-white p-6 rounded-[32px] border border-[#D7BA9D]/20 hover:border-[#B3543D]/50 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 ${info?.remaining <= 0 ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
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
                </div>
                
                <div className="flex-1 p-7 space-y-6 overflow-y-auto custom-scrollbar bg-white">
                  {cart?.length === 0 ? <p className="text-center text-[#8B8A73] text-[15px] italic py-20 opacity-30">ไม่มีสินค้าในตะกร้า</p> : cart?.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-[#FDFCF8] p-4 rounded-[24px] border border-[#F5F0E6]">
                      <div className="min-w-0 pr-3">
                        <p className="font-bold text-[14px] truncate mb-0.5">{safeStr(item.name)}</p>
                        <p className="text-[15px] text-[#B3543D] font-extrabold">฿{Number(item.price || 0).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-3 bg-white p-1 rounded-xl shadow-sm border border-[#F5F0E6]">
                        <button onClick={() => setCart(cart.map(c => c.id === item.id ? {...c, qty: Math.max(0, c.qty - 1)} : c).filter(c => c.qty > 0))} className="w-8 h-8 rounded-lg bg-[#FDFCF8] hover:bg-[#F5F0E6] text-sm font-bold transition-all text-[#8B8A73]">-</button>
                        <span className="text-[14px] font-extrabold w-6 text-center">{item.qty}</span>
                        <button onClick={() => { const info = inventorySummary.find(i => i.id === item.id); if (item.qty < info.remaining) setCart(cart.map(c => c.id === item.id ? {...c, qty: c.qty + 1} : c)) }} className="w-8 h-8 rounded-lg bg-[#FDFCF8] hover:bg-[#F5F0E6] text-sm font-bold transition-all text-[#B3543D]">+</button>
                      </div>
                    </div>
                  ))}
                  
                  {cart?.length > 0 && (
                    <div className="pt-6 border-t border-[#F5F0E6] space-y-6">
                      <div className="space-y-4">
                          <p className="text-[10px] font-black text-[#8B8A73] uppercase tracking-widest flex items-center gap-2"><Hash size={12}/> Order Reference</p>
                          <input type="text" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-4 py-2.5 text-[14px] font-bold outline-none focus:border-[#B3543D]" value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="Order ID..." />
                      </div>
                      <div className="space-y-4">
                          <p className="text-[10px] font-black text-[#8B8A73] uppercase tracking-widest flex items-center gap-2"><Percent size={12}/> Tax Configuration</p>
                          <div className="grid grid-cols-3 gap-2 bg-[#FDFCF8] p-1.5 rounded-2xl border border-[#F5F0E6]">
                                {[{ id: 'none', label: 'No VAT' }, { id: 'include', label: 'Inc. 7%' }, { id: 'exclude', label: 'Exc. 7%' }].map(type => (
                                    <button key={type.id} onClick={() => setPosVatType(type.id)} className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all ${posVatType === type.id ? 'bg-[#B3543D] text-white shadow-md' : 'text-[#8B8A73] hover:bg-white'}`}>{type.label}</button>
                                ))}
                          </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-8 bg-[#F5F0E6]/50 rounded-b-[40px] border-t border-[#F5F0E6] space-y-4 no-print shadow-inner text-right">
                  <p className="text-[15px] font-black text-[#433D3C]">TOTAL PAYOUT</p>
                  <span className="text-3xl font-black text-[#B3543D]">฿{derivedValues.finalPayout.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  <button onClick={handleCheckout} disabled={cart?.length === 0} className="w-full bg-[#B3543D] text-white py-5 rounded-[24px] text-lg font-extrabold shadow-xl hover:bg-[#963F2C] transition-all">ยืนยันการขาย</button>
                </div>
              </div>
            </div>
          )}

          {view === 'accounting' && (
             <div className="w-full space-y-10 animate-in fade-in duration-300 text-[#433D3C] no-print">
                <div className="flex justify-between items-center">
                   <h3 className="text-2xl font-black">Account Ledger</h3>
                   <button onClick={() => setExpenseModalOpen(true)} className="flex items-center gap-2.5 bg-[#B3543D] text-white px-6 py-3 rounded-2xl text-[14px] shadow-lg hover:shadow-xl transition-all">
                      <Receipt size={18}/> บันทึกรายจ่าย
                   </button>
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
                                    </div>
                                    <div className="mt-1 flex flex-wrap gap-2">
                                        {t.abbNo && <span className="text-[9px] bg-[#606C38]/10 text-[#606C38] px-1.5 py-0.5 rounded font-black">ABB: {t.abbNo}</span>}
                                        {t.fullTaxStatus === 'issued' && <span className="text-[9px] bg-[#B3543D]/10 text-[#B3543D] px-1.5 py-0.5 rounded font-black">FULL: {t.invNo}</span>}
                                    </div>
                                </td>
                                <td className={`px-6 py-6 text-right font-black text-[16px] ${t.type === 'income' ? 'text-[#606C38]' : 'text-[#B3543D]'}`}>
                                    {t.type === 'income' ? '+' : '-'} ฿{(Number(t.amount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-6">
                                    <div className="flex justify-center items-center gap-1.5">
                                        {t.type === 'income' && (
                                            <>
                                                <button onClick={() => { setLastTransaction(t); setReceiptModalOpen(true); }} className="p-2 hover:bg-[#F5F0E6] rounded-full text-[#8B8A73] transition-all" title="ใบกำกับอย่างย่อ"><Eye size={16}/></button>
                                                {t.fullTaxStatus === 'issued' ? (
                                                    <button onClick={() => { setSelectedInvoice(t); setFullInvoicePreviewOpen(true); }} className="p-2 hover:bg-[#F5F0E6] rounded-full text-green-600 transition-all" title="ใบกำกับเต็มรูป"><FileText size={16}/></button>
                                                ) : (
                                                    <button onClick={() => { setFullTaxData({...t, taxId: '', branch: '00000', address: ''}); setFullTaxConverterOpen(true); }} className="p-2 hover:bg-[#F5F0E6] rounded-full text-[#B3543D] transition-all" title="ออกใบกำกับเต็มรูป"><Building2 size={16}/></button>
                                                )}
                                            </>
                                        )}
                                        <button onClick={() => { setEditingTransaction(t); setEditTransactionModalOpen(true); }} className="p-2 hover:bg-[#F5F0E6] rounded-full text-[#8B8A73] transition-all"><Edit2 size={16}/></button>
                                        <button onClick={() => handleDeleteTransaction(t.id)} className="p-2 hover:bg-red-50 rounded-full text-red-400 transition-all"><Trash2 size={16}/></button>
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
          
          {/* Inventory View */}
          {view === 'inventory' && (
            <div className="w-full space-y-8 animate-in fade-in duration-300 text-[#433D3C]">
                <div className="flex justify-between items-center no-print">
                  <div className="flex items-center gap-4">
                     {selectedProductId && <button onClick={() => setSelectedProductId(null)} className="p-3 bg-white border border-[#D7BA9D]/30 rounded-2xl hover:bg-[#F5F0E6] transition-all"><ArrowLeft size={20} /></button>}
                     <h3 className="text-2xl font-black">{selectedProductId ? "Batch & Lot Details" : "Stock Master Control"}</h3>
                  </div>
                </div>
                <div className="bg-white rounded-[40px] border border-[#D7BA9D]/20 shadow-xl overflow-hidden">
                   <div className="overflow-x-auto">
                   <table className="w-full text-left">
                     <thead className="bg-[#F5F0E6]/50 border-b text-[11px] font-black text-[#8B8A73] uppercase tracking-widest">
                       <tr><th className="px-8 py-6 w-16 text-center">ID</th><th className="px-8 py-6">Description</th><th className="px-8 py-6 text-right">Qty Balance</th><th className="px-8 py-6 text-right">Valuation</th></tr>
                     </thead>
                     <tbody className="divide-y divide-[#F5F0E6] text-[14px]">
                       {selectedProductId ? lots?.filter(l => l.productId === selectedProductId).map((l, i) => (
                           <tr key={i} className="hover:bg-[#FDFCF8] group transition-colors">
                             <td className="px-8 py-5 text-[#8B8A73] font-mono text-center">{i+1}</td>
                             <td className="px-8 py-5"><p className="font-bold text-[#433D3C]">Lot: {safeStr(l.lotNo)}</p><p className="text-xs text-[#8B8A73] mt-1 font-mono">Date Received: {safeDate(l.receiveDate)}</p></td>
                             <td className="px-8 py-5 text-right font-extrabold text-[#606C38]">{l.remainingQty}</td>
                             <td className="px-8 py-5 text-right font-bold">฿{(Number(l.remainingQty) * Number(l.cost || 0)).toLocaleString()}</td>
                           </tr>
                         )) : inventorySummary?.map(p => (
                           <tr key={p.id} onClick={() => setSelectedProductId(p.id)} className="hover:bg-[#FDFCF8] cursor-pointer group transition-colors">
                             <td className="px-8 py-6 text-[#8B8A73] font-mono text-center">{p.index}</td>
                             <td className="px-8 py-6"><div className="font-bold text-[15px] group-hover:text-[#B3543D] transition-colors">{safeStr(p.name)}</div><div className="text-[11px] text-[#B3543D] font-mono mt-1 font-bold uppercase tracking-wider">{safeStr(p.sku) || 'No SKU'}</div></td>
                             <td className="px-8 py-6 text-right font-bold text-lg">{p.remaining} <span className="text-xs font-medium text-[#8B8A73] ml-1">{p.uom}</span></td>
                             <td className="px-8 py-6 text-right font-black text-[#B3543D] text-[16px]">฿{Number(p.totalValue || 0).toLocaleString()}</td>
                           </tr>
                         ))
                       }
                     </tbody>
                   </table>
                   </div>
                </div>
             </div>
          )}
        </section>
      </main>

      {/* --- Modals --- */}

      {/* Modal: Full Tax Invoice View */}
      <Modal isOpen={isFullInvoicePreviewOpen} onClose={() => setFullInvoicePreviewOpen(false)} title="ใบกำกับภาษีเต็มรูป" maxWidth="max-w-3xl">
          {selectedInvoice && (
              <div className="flex flex-col text-[#433D3C] font-mono-receipt p-4 invoice-page bg-white relative">
                  {/* Feedback Overlay when generating print */}
                  {isGeneratingPrint && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-[99] flex flex-col items-center justify-center animate-in fade-in no-print">
                          <Loader className="animate-spin text-[#B3543D] mb-4" size={48} />
                          <p className="text-lg font-black text-[#433D3C]">กำลังจัดเตรียมไฟล์เอกสาร...</p>
                          <p className="text-sm text-[#8B8A73]">กรุณาเลือก "Save as PDF" ในหน้าต่างที่กำลังจะเปิดขึ้น</p>
                      </div>
                  )}

                  <div className="flex justify-between items-center no-print bg-[#FDFCF8] p-4 rounded-2xl mb-8 border border-[#F5F0E6]">
                      <div className="flex gap-2">
                          <button onClick={() => setInvoiceCopyType('original')} className={`px-4 py-1.5 rounded-lg text-[11px] font-black transition-all ${invoiceCopyType === 'original' ? 'bg-[#B3543D] text-white' : 'bg-white text-[#8B8A73]'}`}>ต้นฉบับ</button>
                          <button onClick={() => setInvoiceCopyType('copy')} className={`px-4 py-1.5 rounded-lg text-[11px] font-black transition-all ${invoiceCopyType === 'copy' ? 'bg-[#B3543D] text-white' : 'bg-white text-[#8B8A73]'}`}>สำเนา</button>
                      </div>
                      <button 
                        onClick={handlePrintRequest} 
                        className="bg-[#433D3C] text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all"
                      >
                          <Printer size={16}/> Print / Save PDF
                      </button>
                  </div>

                  <div className="flex justify-between items-start border-b-2 border-black pb-8 mb-8">
                      <div className="space-y-1">
                          <h4 className="text-2xl font-black text-[#B3543D] mb-2">EATS AND USE PRO</h4>
                          <p className="text-[13px] font-black">บริษัท อีทส์ แอนด์ ยูส โปร จำกัด (สำนักงานใหญ่)</p>
                          <p className="text-[12px]">เลขประจำตัวผู้เสียภาษี: 010-XXXX-XXXXX</p>
                      </div>
                      <div className="text-right">
                          <div className="inline-block border-2 border-black px-4 py-1 mb-4">
                              <h5 className="text-lg font-black uppercase">{invoiceCopyType === 'original' ? 'ต้นฉบับ' : 'สำเนา'} ใบกำกับภาษี</h5>
                          </div>
                          <p className="text-[13px] font-black">เลขที่: {selectedInvoice.invNo}</p>
                          <p className="text-[12px]">วันที่: {safeDate(selectedInvoice.date)}</p>
                      </div>
                  </div>

                  <div className="w-full mb-10">
                      <div className="border border-black p-6 rounded-xl bg-[#FDFCF8]/50 w-full">
                          <p className="text-[11px] font-black uppercase mb-3 underline">Customer Details / รายละเอียดลูกค้า</p>
                          <p className="text-[16px] font-black mb-1">{selectedInvoice.fullTaxCustomer}</p>
                          <p className="text-[12px] font-bold mb-2">Tax ID: {selectedInvoice.fullTaxTaxId} | สาขา: {selectedInvoice.fullTaxBranch}</p>
                          <p className="text-[13px] leading-relaxed opacity-80">{selectedInvoice.fullTaxAddress}</p>
                      </div>
                  </div>

                  <table className="w-full text-left text-[13px] mb-8">
                      <thead className="border-y-2 border-black font-black text-[12px] uppercase">
                          <tr className="bg-[#FDFCF8]"><th className="py-4 px-3 w-12">No.</th><th className="py-4 px-3">Description</th><th className="py-4 px-3 text-center w-20">Qty</th><th className="py-4 px-3 text-right w-32">Unit Price</th><th className="py-4 px-3 text-right w-32">Amount</th></tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                          {selectedInvoice.items?.map((item, i) => (
                              <tr key={i}><td className="py-3 px-3 text-center">{i+1}</td><td className="py-3 px-3">{item.name}</td><td className="py-3 px-3 text-center">{item.qty}</td><td className="py-3 px-3 text-right">฿{item.price.toLocaleString()}</td><td className="py-3 px-3 text-right">฿{(item.qty * item.price).toLocaleString()}</td></tr>
                          ))}
                      </tbody>
                  </table>

                  <div className="grid grid-cols-5 gap-8 mt-auto border-t-2 border-black pt-8">
                      <div className="col-span-3 space-y-8">
                          <div className="bg-[#FDFCF8] border-2 border-black p-3 rounded-lg">
                              <p className="text-[11px] font-black mb-1 opacity-60">ยอดเงินตัวอักษร</p>
                              <p className="text-[14px] font-black">({thaiBahtText(selectedInvoice.totalBill)})</p>
                          </div>
                          <div className="grid grid-cols-2 gap-8 pt-8">
                              <div className="text-center">
                                  <div className="h-20 border-b border-black"></div>
                                  <p className="text-[11px] font-bold mt-2">ผู้รับของ</p>
                              </div>
                              <div className="text-center">
                                  <div className="h-20 border-b border-black"></div>
                                  <p className="text-[11px] font-bold mt-2">ผู้รับเงิน / Authorized Signature</p>
                              </div>
                          </div>
                      </div>
                      <div className="col-span-2 space-y-2 text-[13px]">
                          <div className="flex justify-between font-bold"><span>Subtotal:</span> <span>฿{(selectedInvoice.subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                          <div className="flex justify-between border-t border-dashed pt-2 font-bold"><span>VAT (7%):</span> <span>฿{(selectedInvoice.vatAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                          <div className="flex justify-between text-lg font-black text-[#B3543D] pt-4 border-t-2 border-black"><span>NET TOTAL:</span> <span>฿{(selectedInvoice.totalBill || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                      </div>
                  </div>
              </div>
          )}
      </Modal>

      {/* Simplified Receipt View */}
      <Modal isOpen={isReceiptModalOpen} onClose={() => setReceiptModalOpen(false)} title="ใบกำกับภาษีอย่างย่อ" maxWidth="max-w-sm">
        {lastTransaction && (
          <div className="flex flex-col items-center font-mono-receipt text-[#433D3C]">
             <div className="text-center mb-6 space-y-1">
                <div className="w-10 h-10 bg-[#B3543D] rounded-full flex items-center justify-center text-white mx-auto mb-2"><Leaf size={20} /></div>
                <h4 className="text-[15px] font-bold uppercase">eats and use Pro</h4>
             </div>
             <div className="w-full border-y border-dashed border-[#D7BA9D] py-4 my-2 text-[11px] space-y-1">
                <div className="flex justify-between font-bold"><span>เลขที่ใบเสร็จ:</span> <span>{lastTransaction.abbNo}</span></div>
                <div className="flex justify-between"><span>วันที่:</span> <span>{safeDate(lastTransaction.date)}</span></div>
             </div>
             <div className="w-full space-y-2 mb-6">
                {lastTransaction.items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-[11px]">
                     <div className="flex gap-2"><span>{item.qty}x</span> <span className="truncate w-32">{item.name}</span></div>
                     <span>฿{(item.qty * item.price).toLocaleString()}</span>
                  </div>
                ))}
             </div>
             <div className="w-full border-t border-dashed border-[#D7BA9D] pt-4 space-y-1.5 text-[11px]">
                <div className="flex justify-between"><span>ยอดรวมสินค้า</span> <span>฿{(lastTransaction.subtotal || 0).toLocaleString()}</span></div>
                <div className="flex justify-between text-[14px] font-bold border-t border-dashed border-[#D7BA9D] pt-2 mt-1"><span>ยอดชำระทั้งสิ้น</span> <span>฿{(lastTransaction.totalBill || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
             </div>
             <button onClick={() => window.print()} className="no-print w-full bg-[#433D3C] text-white py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-2 mt-6"><Printer size={14}/> พิมพ์ใบเสร็จ</button>
          </div>
        )}
      </Modal>

      {/* Converter Modal */}
      <Modal isOpen={isFullTaxConverterOpen} onClose={() => setFullTaxConverterOpen(false)} title="ออกใบกำกับภาษีเต็มรูป">
          {fullTaxData && (
              <div className="space-y-6 text-left">
                  <div className="bg-[#FDFCF8] p-5 rounded-2xl border">
                      <p className="text-[10px] font-black text-[#8B8A73] uppercase mb-2">Original ABB: {fullTaxData.abbNo}</p>
                      <button onClick={() => setFullTaxCustomerPickerOpen(true)} className="w-full flex items-center justify-between bg-white border rounded-2xl px-5 py-3 text-sm font-bold">
                          <span>{fullTaxData.customer || "เลือกจากฐานข้อมูล CRM..."}</span><ChevronRight size={18}/>
                      </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <input type="text" className="w-full bg-[#FDFCF8] border rounded-2xl px-5 py-3 text-[14px]" value={fullTaxData.taxId || ''} onChange={e => setFullTaxData({...fullTaxData, taxId: e.target.value})} placeholder="เลขผู้เสียภาษี" />
                      <input type="text" className="w-full bg-[#FDFCF8] border rounded-2xl px-5 py-3 text-[14px]" value={fullTaxData.branch || ''} onChange={e => setFullTaxData({...fullTaxData, branch: e.target.value})} placeholder="สาขา" />
                  </div>
                  <textarea className="w-full bg-[#FDFCF8] border rounded-2xl px-5 py-3 text-[13px] h-20" value={fullTaxData.address || ''} onChange={e => setFullTaxData({...fullTaxData, address: e.target.value})} placeholder="ที่อยู่ใบกำกับภาษี..." />
                  <button onClick={handleIssueFullTax} className="w-full bg-[#B3543D] text-white py-5 rounded-[24px] text-lg font-black shadow-xl">ออกใบกำกับภาษีเต็มรูป</button>
              </div>
          )}
      </Modal>

      <ContactPickerModal isOpen={fullTaxCustomerPickerOpen} onClose={() => setFullTaxCustomerPickerOpen(false)} contacts={contacts} type="customer" onSelect={(c) => setFullTaxData({...fullTaxData, customer: c.name, taxId: c.taxId, branch: c.branch, address: c.address})} />
      <ContactPickerModal isOpen={isCustomerPickerOpen} onClose={() => setCustomerPickerOpen(false)} contacts={contacts} type="customer" onSelect={(c) => setCustomerInfo({ name: c.name, taxId: c.taxId, branch: c.branch, address: c.address })} />
      <ContactPickerModal isOpen={isVendorPickerOpen} onClose={() => setVendorPickerOpen(false)} contacts={contacts} type="vendor" onSelect={(v) => setNewStock({ ...newStock, vendor: v.name, taxId: v.taxId })} />
      <ContactPickerModal isOpen={expenseVendorPickerOpen} onClose={() => setExpenseVendorPickerOpen(false)} contacts={contacts} type="vendor" onSelect={(v) => setNewExpense({ ...newExpense, vendor: v.name, vendorId: v.id })} />
      
      {/* Transaction Edit */}
      <Modal isOpen={isEditTransactionModalOpen} onClose={() => { setEditTransactionModalOpen(false); setEditingTransaction(null); }} title="แก้ไขรายการ">
        {editingTransaction && (
          <form onSubmit={handleUpdateTransaction} className="space-y-6 text-left">
              <input type="text" className="w-full bg-[#FDFCF8] border rounded-2xl px-5 py-3.5 text-[15px] font-bold" value={editingTransaction.customer} onChange={e => setEditingTransaction({...editingTransaction, customer: e.target.value})} />
              <textarea className="w-full bg-[#FDFCF8] border rounded-2xl px-5 py-3 text-[14px] h-24" value={editingTransaction.note || ''} onChange={e => setEditingTransaction({...editingTransaction, note: e.target.value})} placeholder="หมายเหตุ..." />
              <button type="submit" className="w-full bg-[#B3543D] text-white py-5 rounded-[24px] text-lg font-black shadow-xl">บันทึกการแก้ไข</button>
          </form>
        )}
      </Modal>

      {/* Stock & Product Modals remain the same */}
      <Modal isOpen={isStockModalOpen} onClose={() => setStockModalOpen(false)} title="บันทึกรับสินค้า" maxWidth="max-w-3xl">
          <div className="space-y-8 text-left">
              <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setVendorPickerOpen(true)} className="bg-white border rounded-2xl px-5 py-3 text-sm font-bold">{newStock.vendor || "เลือกคู่ค้า..."}</button>
                  <input type="date" className="w-full bg-white border rounded-2xl px-5 py-3 text-sm font-bold" value={newStock.receiveDate} onChange={e => setNewStock({...newStock, receiveDate: e.target.value})} />
              </div>
              <div className="flex gap-3">
                  <select className="flex-1 bg-[#FDFCF8] border rounded-2xl px-5 py-3.5 text-sm" value={stockItemInput.productId} onChange={e => setStockItemInput({...stockItemInput, productId: e.target.value})}>
                      <option value="">-- เลือกสินค้า --</option>
                      {products?.map(p => <option key={p.id} value={p.id}>{safeStr(p.name)}</option>)}
                  </select>
                  <input type="number" placeholder="ทุน" className="w-24 bg-[#FDFCF8] border rounded-2xl px-4 py-3.5 text-sm" value={stockItemInput.cost} onChange={e => setStockItemInput({...stockItemInput, cost: e.target.value})} />
                  <input type="number" placeholder="Qty" className="w-24 bg-[#FDFCF8] border rounded-2xl px-4 py-3.5 text-sm" value={stockItemInput.qty} onChange={e => setStockItemInput({...stockItemInput, qty: e.target.value})} />
                  <button onClick={() => { if(stockItemInput.productId && stockItemInput.qty) { const p = products.find(i=>i.id===stockItemInput.productId); setNewStock({...newStock, items: [...newStock.items, {...stockItemInput, name: p.name}]}); setStockItemInput({productId:'',qty:'',cost:''}) } }} className="bg-[#B3543D] text-white w-14 rounded-2xl flex items-center justify-center"><Plus size={24}/></button>
              </div>
              <div className="border rounded-[32px] overflow-hidden">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-[#FDFCF8] border-b uppercase"><tr><th className="p-4">Item</th><th className="p-4 text-right">Cost</th><th className="p-4 text-center">Qty</th><th className="p-4 text-right">Total</th></tr></thead>
                      <tbody className="divide-y font-bold">
                          {newStock.items.map((item, i) => (
                              <tr key={i}><td className="p-4">{item.name}</td><td className="p-4 text-right">฿{item.cost}</td><td className="p-4 text-center">{item.qty}</td><td className="p-4 text-right">฿{(item.qty*item.cost).toLocaleString()}</td></tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      </Modal>

      <Modal isOpen={isProductModalOpen} onClose={() => setProductModalOpen(false)} title="เพิ่มสินค้า">
          <form onSubmit={async (e) => { e.preventDefault(); await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'products'), {...newProduct, createdAt: new Date().toISOString()}); setProductModalOpen(false); }} className="space-y-6 text-left">
              <input type="text" className="w-full bg-[#FDFCF8] border rounded-2xl px-5 py-3.5" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder="ชื่อสินค้า..." />
              <div className="grid grid-cols-2 gap-5">
                  <input type="number" className="w-full bg-[#FDFCF8] border rounded-2xl px-5 py-3.5" required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} placeholder="ราคาขาย" />
                  <input type="text" className="w-full bg-[#FDFCF8] border rounded-2xl px-5 py-3.5" required value={newProduct.uom} onChange={e => setNewProduct({...newProduct, uom: e.target.value})} placeholder="หน่วย (ขวด, กล่อง)" />
              </div>
              <button type="submit" className="w-full bg-[#B3543D] text-white py-5 rounded-[24px] font-black shadow-xl">บันทึกสินค้า</button>
          </form>
      </Modal>
    </div>
  );
};

export default App;
