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
  BadgePercent, Landmark, Container, Activity, Globe // เพิ่ม Activity และ Globe
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
    return String(val);
  }
};

const safeStr = (val) => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') return '-';
    return String(val);
};

// --- Global Styles Injection ---
const GlobalStyles = () => (
  <style>{`
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
    }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #D7BA9D; border-radius: 10px; }
  `}</style>
);

const FMCG_CONFIG = {
  'เครื่องดื่ม': { prefix: 'BVG', sub: ['น้ำเปล่า', 'น้ำอัดลม', 'กาแฟ/ชา'] },
  'ขนม/ของทานเล่น': { prefix: 'SNK', sub: ['มันฝรั่งทอด', 'คุ้กกี้', 'ถั่ว'] },
  'เครื่องปรุง/ของแห้ง': { prefix: 'GRC', sub: ['ซอส', 'ข้าวสาร'] },
  'ผลิตภัณฑ์ทำความสะอาด': { prefix: 'HHC', sub: ['ล้างจาน', 'ผงซักฟอก'] },
  'ของใช้ส่วนตัว': { prefix: 'PER', sub: ['สบู่', 'ยาสีฟัน'] },
  'อื่นๆ': { prefix: 'OTH', sub: ['ทั่วไป'] }
};

const channelConfig = {
  Offline: { brandIcon: Store, color: '#433D3C' },
  Shopee: { brandIcon: BadgePercent, color: '#EE4D2D' },
  Lazada: { brandIcon: Landmark, color: '#000083' },
  TikTok: { brandIcon: Activity, color: '#000000' },
  Line: { brandIcon: Globe, color: '#06C755' }
};

// --- Modals ---
const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-md" }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className={`bg-white rounded-[32px] w-full ${maxWidth} overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 text-[#433D3C]`}>
        <div className="p-6 border-b border-[#F5F0E6] flex justify-between items-center bg-[#FDFCF8]">
          <h3 className="font-bold">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-[#F5F0E6] rounded-full transition-colors text-[#8B8A73]"><X size={18} /></button>
        </div>
        <div className="p-8 max-h-[85vh] overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>
  );
};

const Sidebar = ({ currentView, setView, isDevMode, handleToggleMode, currentAppId }) => (
  <aside className="w-64 bg-[#F5F0E6] flex flex-col h-full border-r border-[#D7BA9D]/30 transition-all flex-shrink-0">
    <div className="p-8 flex flex-col items-center text-center">
      <div className="w-14 h-14 bg-[#B3543D] rounded-full flex items-center justify-center text-white mb-4 shadow-lg shadow-[#B3543D]/20"><Leaf size={28} /></div>
      <h1 className="text-lg font-bold text-[#433D3C]">eats and use</h1>
      <p className="text-[9px] text-[#8B8A73] uppercase tracking-[0.2em] font-bold">Pro Analytics</p>
    </div>
    <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
      {[
        { id: 'pos', icon: ShoppingCart, label: 'ขายสินค้า' },
        { id: 'inventory', icon: Package, label: 'คลังสินค้า' },
        { id: 'contacts', icon: Users, label: 'ฐานข้อมูล CRM' },
        { id: 'accounting', icon: CreditCard, label: 'สมุดบัญชี' },
        { id: 'reports', icon: FileSpreadsheet, label: 'รายงาน & วิเคราะห์' }
      ].map(item => (
        <button key={item.id} onClick={() => setView(item.id)} className={`flex items-center w-full px-4 py-3 space-x-3 rounded-xl transition-all ${currentView === item.id ? 'bg-white text-[#B3543D] shadow-sm border border-[#D7BA9D]/30' : 'text-[#8B8A73] hover:bg-white/50'}`}>
          <item.icon size={18} /> <span className="font-bold text-sm">{item.label}</span>
        </button>
      ))}
    </nav>
    <div className="p-4 text-center space-y-3">
      <button onClick={handleToggleMode} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all border shadow-sm ${isDevMode ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-700'}`}>
        <div className="flex flex-col text-left"><span className="text-[9px] opacity-70">MODE</span><span>{isDevMode ? 'DEV-TEST' : 'PRODUCTION'}</span></div>
        {isDevMode ? <ToggleLeft size={24}/> : <ToggleRight size={24}/>}
      </button>
      <div className="bg-[#E8E1D5] rounded-xl p-2.5 border border-[#D7BA9D]/30">
         <div className="flex items-center justify-center gap-2 text-[#433D3C] font-bold text-[10px]">
            <CloudCog size={12} className="text-[#B3543D]"/>
            <span>ID: {currentAppId ? currentAppId.slice(0,10) : '...'}</span>
         </div>
      </div>
    </div>
  </aside>
);

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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B8A73]" size={16} />
          <input 
            type="text" 
            placeholder={`ค้นหาชื่อ หรือ เลขผู้เสียภาษี...`} 
            className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-2xl pl-10 pr-4 py-3 text-sm focus:border-[#B3543D] outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar text-left">
          {filtered?.length === 0 ? (
            <p className="text-center text-[#8B8A73] text-xs py-10 italic">ไม่พบข้อมูลผู้ติดต่อ</p>
          ) : filtered?.map(c => (
            <div 
              key={c.id} 
              onClick={() => { onSelect(c); onClose(); }}
              className="flex justify-between items-center p-4 bg-[#FDFCF8] border border-[#D7BA9D]/20 rounded-2xl hover:border-[#B3543D] hover:bg-white cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white border border-[#D7BA9D]/20 rounded-xl flex items-center justify-center text-[#B3543D]">
                  {type === 'customer' ? <Users size={18}/> : <Truck size={18}/>}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#433D3C]">{safeStr(c.name)}</p>
                  <p className="text-[10px] text-[#8B8A73] font-mono">Tax ID: {safeStr(c.taxId) || '-'} | สาขา: {safeStr(c.branch)}</p>
                </div>
              </div>
              <ChevronRight className="text-[#D7BA9D] group-hover:text-[#B3543D]" size={16} />
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
  const [reportSubView, setReportSubView] = useState('tax');
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
  const [manualFeeAmount, setManualFeeAmount] = useState(''); 
  const [shippingIncome, setShippingIncome] = useState(''); 
  const [actualShippingCost, setActualShippingCost] = useState(''); 
  const [discountAmount, setDiscountAmount] = useState(''); 
  const [isFullTax, setIsFullTax] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ name: '', taxId: '', branch: '00000', address: '' });

  // Modal States
  const [isProductModalOpen, setProductModalOpen] = useState(false);
  const [isStockModalOpen, setStockModalOpen] = useState(false);
  const [isVendorPickerOpen, setVendorPickerOpen] = useState(false);
  const [isCustomerPickerOpen, setCustomerPickerOpen] = useState(false);

  // Form States
  const [newProduct, setNewProduct] = useState({ name: '', sku: '', category: 'เครื่องดื่ม', brand: '', uom: 'ชิ้น', price: 0, minStock: 5 });
  const [newStock, setNewStock] = useState({ lotNo: '', receiveDate: getThaiDate(), vendor: '', taxId: '', items: [], discount: 0, includeVat: true });
  const [stockItemInput, setStockItemInput] = useState({ productId: '', qty: '', cost: '' });

  // --- Derived Calculations ---
  const derivedValues = useMemo(() => {
    const subtotal = cart?.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty)), 0) || 0;
    const final = subtotal + Number(shippingIncome || 0) - Number(discountAmount || 0) - Number(manualFeeAmount || 0);
    return { subtotal, final };
  }, [cart, discountAmount, shippingIncome, manualFeeAmount]);

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
    const income = transactions?.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount + (t.shippingIncome || 0) - (t.discount || 0)), 0) || 0;
    const expense = transactions?.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0) || 0;
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const analyticsData = useMemo(() => {
    if (!transactions) return { byChannel: {}, topSelling: [], itemizedSalesLog: [] };
    const sales = transactions.filter(t => t.type === 'income');
    const byChannel = sales.reduce((acc, t) => { acc[t.channel] = (acc[t.channel] || 0) + (t.amount || 0); return acc; }, {});
    const productStats = {};
    const itemizedSalesLog = [];
    sales.forEach(t => {
      if (t.items && Array.isArray(t.items)) {
        t.items.forEach(item => {
          productStats[item.name] = (productStats[item.name] || 0) + (item.qty || 0);
          itemizedSalesLog.push({ ...item, date: t.date, receiptId: t.id, channel: t.channel, total: item.qty * item.price });
        });
      }
    });
    const topSelling = Object.entries(productStats).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { byChannel, topSelling, itemizedSalesLog };
  }, [transactions]);

  // --- Auth & Data Logic ---
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
    const uT = onSnapshot(query(p('transactions'), orderBy('date', 'desc'), limit(100)), s => setTransactions(s.docs.map(d => ({ ...d.data(), id: d.id }))));
    return () => { uP(); uL(); uC(); uT(); };
  }, [user, appId]);

  // --- Handlers ---
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      const productColl = collection(db, 'artifacts', appId, 'public', 'data', 'products');
      await addDoc(productColl, { ...newProduct, createdAt: new Date().toISOString() });
      setProductModalOpen(false);
      setNewProduct({ name: '', sku: '', category: 'เครื่องดื่ม', brand: '', uom: 'ชิ้น', price: 0, minStock: 5 });
    } catch (err) { console.error(err); }
  };

  const addToCart = (product) => {
    const info = inventorySummary.find(i => i.id === product.id);
    if (!info || info.remaining <= 0) return;
    setCart(prev => {
      const ex = prev.find(i => i.id === product.id);
      if (ex) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || !user) return;
    try {
      const transColl = collection(db, 'artifacts', appId, 'public', 'data', 'transactions');
      const rid = `TX-${Date.now().toString().slice(-6)}`;
      await setDoc(doc(transColl, rid), {
        date: getThaiDate(), type: 'income', category: 'ขายสินค้า', channel: salesChannel,
        amount: derivedValues.subtotal, fee: Number(manualFeeAmount || 0), shippingIncome: Number(shippingIncome || 0),
        discount: Number(discountAmount || 0), customer: isFullTax ? customerInfo.name : 'ทั่วไป',
        items: cart.map(i => ({ name: i.name, qty: i.qty, price: i.price }))
      });
      setCart([]); setShippingIncome(''); setDiscountAmount(''); setManualFeeAmount(''); setIsFullTax(false);
      alert("บันทึกการขายสำเร็จ");
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
        name: p.name, 
        qty: Number(stockItemInput.qty), 
        cost: Number(stockItemInput.cost) 
      }] 
    }));
    setStockItemInput({ productId: '', qty: '', cost: '' });
  };

  const handleRemoveStockItem = (index) => {
    setNewStock(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleReceiveStock = async () => {
    if (!user || newStock.items?.length === 0) return;
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
          initialQty: i.qty,
          remainingQty: i.qty, 
          cost: i.cost, 
          receiveDate: newStock.receiveDate 
        });
      }
      setStockModalOpen(false);
      setNewStock({ lotNo: '', receiveDate: getThaiDate(), vendor: '', items: [], discount: 0 });
    } catch (e) { console.error(e); }
  };

  if (loading && user) return <div className="h-screen w-full flex items-center justify-center bg-[#FDFCF8]"><Loader2 className="animate-spin text-[#B3543D]" size={40}/></div>;

  if (authStatus === 'error') {
    return (
      <div className="h-screen h-[100dvh] w-full flex flex-col items-center justify-center bg-red-50 text-red-800 p-8 text-center">
          <AlertTriangle size={64} className="mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-2">Authentication Failed</h2>
          <p className="text-sm mb-6">{authErrorMessage}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold">ลองใหม่อีกครั้ง</button>
      </div>
    );
  }

  return (
    <div className="flex h-screen h-[100dvh] w-full text-[#433D3C] overflow-hidden bg-[#FDFCF8]">
      <GlobalStyles />
      <Sidebar currentView={view} setView={setView} isDevMode={isDevMode} handleToggleMode={handleToggleMode} currentAppId={appId} />

      <main className="flex-1 flex flex-col min-w-0 bg-[#FDFCF8]">
        <header className="h-16 bg-white/50 backdrop-blur-md border-b border-[#D7BA9D]/20 flex items-center justify-between px-8 shrink-0">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#8B8A73]">{view}</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B8A73]" size={14} />
            <input type="text" placeholder="ค้นหา..." className="pl-9 pr-4 py-1.5 bg-white border border-[#D7BA9D]/30 rounded-full text-xs w-64 outline-none focus:border-[#B3543D]" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {view === 'pos' && (
            <div className="flex flex-col xl:flex-row gap-6 h-full w-full animate-in fade-in duration-300">
              <div className="flex-1 space-y-6">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {Object.keys(channelConfig).map(ch => (
                    <button key={ch} onClick={() => setSalesChannel(ch)} className={`flex-shrink-0 flex items-center gap-2 px-5 py-2 rounded-2xl border transition-all font-bold text-xs ${salesChannel === ch ? 'bg-white text-[#B3543D] border-[#B3543D] shadow-sm' : 'bg-[#F5F0E6] text-[#8B8A73] border-transparent hover:bg-white'}`}>
                      {React.createElement(channelConfig[ch].brandIcon)} {ch}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
                  {products?.filter(p => (safeStr(p.name)).toLowerCase().includes(searchTerm.toLowerCase())).map(product => {
                    const info = inventorySummary.find(i => i.id === product.id);
                    return (
                      <div key={product.id} onClick={() => addToCart(product)} className={`bg-white p-4 rounded-3xl border border-[#D7BA9D]/20 hover:border-[#B3543D]/50 cursor-pointer transition-all ${info?.remaining <= 0 ? 'opacity-40 grayscale' : ''}`}>
                        <div className="w-10 h-10 bg-[#F5F0E6] rounded-xl flex items-center justify-center text-[#B3543D] mb-3"><Box size={20} /></div>
                        <h4 className="font-bold text-xs mb-1 truncate">{safeStr(product.name)}</h4>
                        <div className="flex justify-between items-end mt-4">
                          <span className="text-sm font-bold text-[#B3543D]">฿{Number(product.price || 0).toLocaleString()}</span>
                          <span className={`text-[9px] font-bold ${info?.remaining < (product.minStock || 5) ? 'text-red-500' : 'text-[#8B8A73]'}`}>{info?.remaining || 0}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="w-full xl:w-[400px] 2xl:w-[450px] bg-white rounded-[32px] border border-[#D7BA9D]/20 flex flex-col shadow-sm shrink-0">
                <div className="p-6 border-b border-[#F5F0E6] flex items-center gap-3"><ShoppingCart className="text-[#B3543D]" size={20} /><h3 className="font-bold text-sm">ตะกร้าสินค้า</h3></div>
                <div className="flex-1 p-6 space-y-4 overflow-y-auto custom-scrollbar bg-white">
                  {cart?.length === 0 ? <p className="text-center text-[#8B8A73] text-xs py-10 italic">ไม่มีสินค้าในตะกร้า</p> : cart?.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-[#FDFCF8] p-3 rounded-2xl border border-[#F5F0E6]">
                      <div className="min-w-0 pr-2"><p className="font-bold text-xs truncate">{safeStr(item.name)}</p><p className="text-[10px] text-[#B3543D] font-bold">฿{Number(item.price || 0).toLocaleString()}</p></div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setCart(cart.map(c => c.id === item.id ? {...c, qty: Math.max(0, c.qty - 1)} : c).filter(c => c.qty > 0))} className="w-6 h-6 rounded-lg bg-white border border-[#D7BA9D]/30 text-xs">-</button>
                        <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                        <button onClick={() => addToCart(item)} className="w-6 h-6 rounded-lg bg-white border border-[#D7BA9D]/30 text-xs">+</button>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-[#F5F0E6] space-y-3">
                    <div className="flex justify-between items-center"><span className="text-xs text-[#8B8A73]">ส่วนลดท้ายบิล</span><input type="number" className="w-20 text-right text-xs bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-lg px-2 py-1 outline-none text-red-500 font-bold" value={discountAmount} onChange={e => setDiscountAmount(e.target.value)} placeholder="0" /></div>
                    {salesChannel !== 'Offline' && (
                      <>
                        <div className="flex justify-between items-center"><span className="text-xs text-[#8B8A73]">ค่าส่งที่เก็บลูกค้า</span><input type="number" className="w-20 text-right text-xs bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-lg px-2 py-1 outline-none text-green-600 font-bold" value={shippingIncome} onChange={e => setShippingIncome(e.target.value)} /></div>
                        <div className="flex justify-between items-center"><span className="text-xs text-[#8B8A73]">ค่าธรรมเนียม Platform</span><input type="number" className="w-20 text-right text-xs bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-lg px-2 py-1 outline-none text-red-500 font-bold" value={manualFeeAmount} onChange={e => setManualFeeAmount(e.target.value)} /></div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#FDFCF8] border border-[#D7BA9D]/20 rounded-2xl">
                    <div className="flex items-center gap-2 text-xs font-bold"><UserCheck size={16} className={isFullTax ? 'text-[#B3543D]' : 'text-[#8B8A73]'} /> ใบกำกับภาษีเต็มรูป</div>
                    <button onClick={() => setIsFullTax(!isFullTax)} className={`w-10 h-5 rounded-full relative transition-all ${isFullTax ? 'bg-[#B3543D]' : 'bg-[#D7BA9D]'}`}><div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${isFullTax ? 'left-6' : 'left-1'}`} /></button>
                  </div>
                  {isFullTax && (
                    <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                      <button onClick={() => setCustomerPickerOpen(true)} className="w-full flex items-center justify-between bg-white border border-[#D7BA9D]/30 rounded-lg px-4 py-2 text-xs text-[#8B8A73]"><span>{safeStr(customerInfo.name) || "ค้นหาลูกค้า..."}</span><ChevronRight size={14}/></button>
                      <input type="text" placeholder="ชื่อ" className="w-full bg-white border border-[#D7BA9D]/30 rounded-lg px-3 py-2 text-[11px]" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} />
                    </div>
                  )}
                </div>
                <div className="p-6 bg-[#F5F0E6]/50 rounded-b-[32px] border-t border-[#F5F0E6] space-y-4">
                  <div className="flex justify-between text-lg font-bold"><span>ยอดรับสุทธิ</span><span className="text-[#B3543D]">฿{derivedValues.final.toLocaleString()}</span></div>
                  <button onClick={handleCheckout} disabled={cart?.length === 0} className="w-full bg-[#B3543D] text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-[#963F2C] transition-all">ยืนยันการขาย</button>
                </div>
              </div>
            </div>
          )}

          {view === 'inventory' && (
            <div className="w-full space-y-6 animate-in fade-in duration-300 text-[#433D3C]">
               <div className="flex justify-between items-center">
                 <h3 className="text-lg font-bold flex items-center gap-2">{selectedProductId && <ArrowLeft className="cursor-pointer" onClick={() => setSelectedProductId(null)} />} {selectedProductId ? "ล็อตสินค้า" : "คลังสินค้าคงเหลือ"}</h3>
                 <div className="flex gap-2 font-bold">
                    <button onClick={() => setProductModalOpen(true)} className="flex items-center gap-2 bg-white border border-[#D7BA9D]/30 px-4 py-2 rounded-xl text-xs hover:bg-[#F5F0E6] transition-all shadow-sm"><Plus size={14}/> เพิ่มสินค้า</button>
                    <button onClick={() => setStockModalOpen(true)} className="flex items-center gap-2 bg-[#B3543D] text-white px-4 py-2 rounded-xl text-xs shadow-md"><Package size={14}/> รับสต็อก</button>
                 </div>
               </div>
               <div className="bg-white rounded-3xl border border-[#D7BA9D]/20 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-bold">
                    <thead className="bg-[#F5F0E6]/50 border-b text-[10px] font-bold text-[#8B8A73] uppercase">
                      <tr><th className="px-6 py-4 w-12">#</th><th className="px-6 py-4">ชื่อสินค้า</th><th className="px-6 py-4 text-right">คงเหลือ</th><th className="px-6 py-4 text-right">มูลค่าสต็อก</th></tr>
                    </thead>
                    <tbody className="divide-y divide-[#F5F0E6]">
                      {selectedProductId ? (
                        lots?.filter(l => l.productId === selectedProductId).map((l, i) => (
                          <tr key={i} className="hover:bg-[#FDFCF8]">
                            <td className="px-6 py-4 text-[#8B8A73]">{i+1}</td>
                            <td className="px-6 py-4">ล็อต {safeStr(l.lotNo)} ({safeDate(l.receiveDate)})</td>
                            <td className="px-6 py-4 text-right text-[#606C38]">{l.remainingQty}</td>
                            <td className="px-6 py-4 text-right">฿{(Number(l.remainingQty) * Number(l.cost || 0)).toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        inventorySummary?.map(p => (
                          <tr key={p.id} onClick={() => setSelectedProductId(p.id)} className="hover:bg-[#FDFCF8] cursor-pointer">
                            <td className="px-6 py-4 text-[#8B8A73]">{p.index}</td>
                            <td className="px-6 py-4"><div>{safeStr(p.name)}</div><div className="text-[9px] text-[#B3543D] font-mono">{safeStr(p.sku)}</div></td>
                            <td className="px-6 py-4 text-right">{p.remaining} {p.uom}</td>
                            <td className="px-6 py-4 text-right text-[#B3543D]">฿{Number(p.totalValue || 0).toLocaleString()}</td>
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
             <div className="w-full space-y-8 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="bg-white p-6 rounded-[32px] border border-[#D7BA9D]/20 shadow-sm font-bold"><p className="text-[10px] text-[#8B8A73] uppercase mb-1">รายรับ</p><h4 className="text-xl text-[#606C38] font-black">฿{accSummary.income.toLocaleString()}</h4></div>
                   <div className="bg-white p-6 rounded-[32px] border border-[#D7BA9D]/20 shadow-sm font-bold"><p className="text-[10px] text-[#8B8A73] uppercase mb-1">รายจ่าย</p><h4 className="text-xl text-[#B3543D] font-black">฿{accSummary.expense.toLocaleString()}</h4></div>
                   <div className="bg-[#433D3C] text-white p-6 rounded-[32px] shadow-lg font-bold"><p className="text-[10px] opacity-70 uppercase mb-1">กำไรสะสม</p><h4 className="text-xl font-black">฿{accSummary.balance.toLocaleString()}</h4></div>
                </div>
                <div className="bg-white rounded-3xl border border-[#D7BA9D]/20 shadow-sm overflow-hidden">
                   <div className="overflow-x-auto">
                   <table className="w-full text-left text-xs font-bold">
                      <thead className="bg-[#F5F0E6]/30 text-[9px] text-[#8B8A73] uppercase border-b"><tr><th className="px-6 py-4">วันที่</th><th className="px-6 py-4">รายการ</th><th className="px-6 py-4 text-right">จำนวนเงิน</th></tr></thead>
                      <tbody className="divide-y divide-[#F5F0E6]">
                         {transactions?.map(t => (
                            <tr key={t.id} className="hover:bg-[#FDFCF8]"><td className="px-6 py-4 text-[#8B8A73] font-mono">{safeDate(t.date)}</td><td className="px-6 py-4">{safeStr(t.category)} ({safeStr(t.customer)})</td><td className={`px-6 py-4 text-right ${t.type === 'income' ? 'text-[#606C38]' : 'text-[#B3543D]'}`}>฿{(Number(t.amount || 0) + Number(t.shippingIncome || 0) - Number(t.discount || 0)).toLocaleString()}</td></tr>
                         ))}
                      </tbody>
                   </table>
                   </div>
                </div>
             </div>
          )}
        </section>
      </main>

      <Modal isOpen={isStockModalOpen} onClose={() => setStockModalOpen(false)} title="บันทึกรับสต็อกบิลรวม" maxWidth="max-w-3xl">
        <div className="space-y-6 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#F5F0E6] p-5 rounded-2xl">
             <div className="col-span-1 md:col-span-2 flex justify-between items-center mb-2"><p className="text-[10px] text-[#B3543D] font-bold uppercase tracking-widest">ข้อมูลคู่ค้า (Vendor)</p></div>
             <div className="col-span-1 md:col-span-2"><input type="text" className="w-full bg-white border border-[#D7BA9D]/30 rounded-xl px-3 py-1.5 text-xs outline-none" value={newStock.vendor} onChange={e => setNewStock({...newStock, vendor: e.target.value})} placeholder="ระบุชื่อคู่ค้า..." /></div>
             <div><label className="text-[10px] font-bold uppercase text-[#8B8A73] mb-1 block">เลขที่ล็อต</label><div className="font-mono text-sm font-bold text-[#B3543D]">{newStock.lotNo || 'Auto'}</div></div>
             <div><label className="text-[10px] font-bold uppercase text-[#8B8A73] mb-1 block">วันที่รับ</label><input type="date" className="w-full bg-white border border-[#D7BA9D]/30 rounded-xl px-3 py-1.5 text-xs outline-none" value={newStock.receiveDate} onChange={e => setNewStock({...newStock, receiveDate: e.target.value})} /></div>
          </div>
          <div className="space-y-3">
             <p className="text-[10px] text-[#8B8A73] font-bold uppercase tracking-widest px-1">เพิ่มสินค้าลงบิล</p>
             <div className="flex flex-col md:flex-row gap-2 items-end">
                <div className="flex-1 w-full">
                   <select className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-3 py-2 text-xs outline-none" value={stockItemInput.productId} onChange={e => setStockItemInput({...stockItemInput, productId: e.target.value})}>
                      <option value="">-- เลือกสินค้า --</option>
                      {products?.map(p => <option key={p.id} value={p.id}>{safeStr(p.name)}</option>)}
                   </select>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="w-full md:w-24"><input type="number" placeholder="ทุน" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-3 py-2 text-xs text-center" value={stockItemInput.cost} onChange={e => setStockItemInput({...stockItemInput, cost: e.target.value})} /></div>
                    <div className="w-full md:w-24"><input type="number" placeholder="จำนวน" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-3 py-2 text-xs text-center" value={stockItemInput.qty} onChange={e => setStockItemInput({...stockItemInput, qty: e.target.value})} /></div>
                    <button type="button" onClick={handleAddStockItem} className="bg-[#B3543D] text-white p-2 rounded-xl h-9 flex items-center justify-center shrink-0 hover:bg-[#963F2C] transition-all"><Plus size={20}/></button>
                </div>
             </div>
             <div className="border border-[#D7BA9D]/20 rounded-2xl overflow-hidden bg-white">
                <table className="w-full text-left text-[11px] font-bold">
                   <thead className="bg-[#FDFCF8] border-b"><tr><th className="p-3">สินค้า</th><th className="p-3 text-right">ทุน</th><th className="p-3 text-right">จำนวน</th><th className="p-3 text-right">รวม</th><th className="w-10"></th></tr></thead>
                   <tbody className="divide-y divide-[#F5F0E6]">
                      {!newStock.items?.length && <tr><td colSpan="5" className="p-5 text-center text-[#8B8A73] italic">ยังไม่มีรายการ</td></tr>}
                      {newStock.items?.map((item, idx) => (<tr key={idx}><td className="p-3 truncate">{safeStr(item.name)}</td><td className="p-3 text-right">{item.cost}</td><td className="p-3 text-right">{item.qty}</td><td className="p-3 text-right">฿{(Number(item.cost) * Number(item.qty)).toLocaleString()}</td><td className="p-3 text-center"><button type="button" onClick={() => handleRemoveStockItem(idx)} className="text-red-400"><X size={14}/></button></td></tr>))}
                   </tbody>
                </table>
             </div>
          </div>
          <div className="pt-4 border-t border-[#F5F0E6] flex justify-between items-center font-bold">
             <div className="flex items-center gap-2 text-xs text-[#8B8A73]"><span>ส่วนลดบิล:</span><input type="number" className="w-24 border-b border-[#D7BA9D]/30 outline-none text-right text-red-500" value={newStock.discount} onChange={e => setNewStock({...newStock, discount: e.target.value})} /></div>
             <div className="text-right">
                <p className="text-xl font-black text-[#B3543D]">฿{Math.max(0, (newStock.items?.reduce((s, i) => s + (i.cost * i.qty), 0) || 0) - Number(newStock.discount || 0)).toLocaleString()}</p>
             </div>
          </div>
          <button onClick={handleReceiveStock} className="w-full bg-[#433D3C] text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-[#2A2A2A] transition-all">ยืนยันรับสินค้า</button>
        </div>
      </Modal>

      <Modal isOpen={isProductModalOpen} onClose={() => setProductModalOpen(false)} title="เพิ่มสินค้าใหม่">
        <form onSubmit={handleAddProduct} className="space-y-4 text-left font-bold text-[#433D3C]">
           <div><label className="text-[10px] font-bold text-[#8B8A73] uppercase mb-1 block">ชื่อสินค้า</label><input type="text" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-4 py-2 text-sm outline-none" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} /></div>
           <div className="grid grid-cols-2 gap-4">
              <div><label className="text-[10px] font-bold text-[#8B8A73] uppercase mb-1 block">ราคาขาย</label><input type="number" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-4 py-2 text-sm outline-none" required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} /></div>
              <div><label className="text-[10px] font-bold text-[#8B8A73] uppercase mb-1 block">หน่วย</label><input type="text" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-4 py-2 text-sm outline-none" required value={newProduct.uom} onChange={e => setNewProduct({...newProduct, uom: e.target.value})} /></div>
           </div>
           <button type="submit" className="w-full bg-[#B3543D] text-white py-4 rounded-2xl font-bold mt-4 shadow-lg hover:bg-[#963F2C] transition-all">บันทึกสินค้า</button>
        </form>
      </Modal>
      
      <ContactPickerModal isOpen={isCustomerPickerOpen} onClose={() => setCustomerPickerOpen(false)} contacts={contacts} type="customer" onSelect={(c) => setCustomerInfo({ name: c.name, taxId: c.taxId, branch: c.branch, address: c.address })} />
      <ContactPickerModal isOpen={isVendorPickerOpen} onClose={() => setVendorPickerOpen(false)} contacts={contacts} type="vendor" onSelect={(v) => setNewStock({ ...newStock, vendor: v.name, taxId: v.taxId })} />
    </div>
  );
};

export default App;
