import React, { useState, useMemo, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, initializeFirestore, collection, doc, setDoc, addDoc, onSnapshot, query, getDoc, updateDoc, deleteDoc
} from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { 
  LayoutDashboard, ShoppingCart, Package, Receipt, Users, FileSpreadsheet, 
  Plus, Search, Edit2, Trash2, ArrowUpRight, ArrowDownRight, ChevronRight, 
  Download, Filter, MoreVertical, CheckCircle2, UserPlus, Box, TrendingUp, 
  CreditCard, Leaf, Globe, Store, Percent, Truck, Tag, Coins, FileText, 
  Hash, BarChart3, X, History, LayoutGrid, List, Calculator, UserCheck, 
  Building2, MapPin, SearchCode, Sparkles, Layers, Archive, ArrowLeft,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  PieChart,
  Activity,
  ClipboardList,
  UserSearch,
  Eye,
  CloudCog
} from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyDf0rpBqefYiKXOvALDd3xpyONGHRkgr6g",
  authDomain: "eats-and-use-management-system.firebaseapp.com",
  projectId: "eats-and-use-management-system",
  storageBucket: "eats-and-use-management-system.firebasestorage.app",
  messagingSenderId: "742592710018",
  appId: "1:742592710018:web:973c5d172717c3fb443b9b",
  measurementId: "G-R7PN5DSFWS"
};

const app = initializeApp(firebaseConfig);

// แก้ไข: ใช้ initializeFirestore พร้อม options เพื่อแก้ปัญหา Offline ใน StackBlitz
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true, // บังคับใช้ Long Polling เพื่อความเสถียร
});

const auth = getAuth(app);

// --- App ID Configuration ---
// แก้ไข App ID ให้ตรงกับชื่อร้าน
const appId = typeof __app_id !== 'undefined' ? __app_id : 'eats-and-use-pos';

// --- Constants ---
const FMCG_CONFIG = {
  'เครื่องดื่ม': { prefix: 'BVG', sub: ['น้ำเปล่า', 'น้ำอัดลม', 'กาแฟ/ชา', 'เครื่องดื่มชูกำลัง'] },
  'ขนม/ของทานเล่น': { prefix: 'SNK', sub: ['มันฝรั่งทอด', 'คุ้กกี้', 'ถั่ว', 'เยลลี่'] },
  'เครื่องปรุง/ของแห้ง': { prefix: 'GRC', sub: ['ซอส/เครื่องปรุง', 'ข้าวสาร', 'เส้นก๋วยเตี๋ยว', 'น้ำมันพืช'] },
  'ผลิตภัณฑ์ทำความสะอาด': { prefix: 'HHC', sub: ['น้ำยาล้างจาน', 'ผงซักฟอก', 'น้ำยาถูพื้น'] },
  'ของใช้ส่วนตัว': { prefix: 'PER', sub: ['สบู่/แชมพู', 'ยาสีฟัน', 'กระดาษชำระ'] },
  'อื่นๆ': { prefix: 'OTH', sub: ['ทั่วไป'] }
};

const channelConfig = {
  Offline: { brandIcon: Store, color: '#433D3C' },
  Shopee: { brandIcon: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.5 7H5.5L4 21H20L18.5 7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M16 9V6C16 3.79086 14.2091 2 12 2C9.79086 2 8 3.79086 8 6V9" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 12C10.5 12 9 13.5 9 15C9 16.5 10.5 18 12 18C13.5 18 15 16.5 15 15C15 13.5 13.5 12 12 12Z" fill="currentColor"/>
    </svg>
  ), color: '#EE4D2D' },
  Lazada: { brandIcon: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M12 22V12" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 12L21 7" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 12L3 7" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="12" r="3" fill="currentColor"/>
    </svg>
  ), color: '#000083' },
  TikTok: { brandIcon: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 12V3H13V6C13 8.20914 14.7909 10 17 10V14C14.7909 14 13 12.2091 13 10V18C13 21.3137 10.3137 24 7 24C3.68629 24 1 21.3137 1 18C1 14.6863 3.68629 12 7 12H9Z" fill="currentColor"/>
    </svg>
  ), color: '#000000' },
  Line: { brandIcon: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 10.0401C22 5.59969 17.5135 2 11.9865 2C6.45946 2 2 5.59969 2 10.0401C2 14.0792 5.54955 17.4363 10.3378 18.0039C10.7432 18.0934 11.2973 18.2575 11.4144 18.6602C11.5135 19.0331 11.4505 19.6148 11.3964 20.0026C11.3964 20.0026 11.1982 21.2107 11.1171 21.703C11.018 22.2847 10.7297 23.4779 12.3514 22.8217C13.973 22.1654 18.991 19.1226 21.2613 16.4826C22.6126 14.6331 22 12.1878 22 10.0401Z" fill="currentColor"/>
    </svg>
  ), color: '#06C755' }
};

// --- External UI Components ---
const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-md" }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-[32px] w-full ${maxWidth} overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 text-[#433D3C]`}>
        <div className="p-6 border-b border-[#F5F0E6] flex justify-between items-center bg-[#FDFCF8]">
          <h3 className="font-bold">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-[#F5F0E6] rounded-full transition-colors text-[#8B8A73]"><X size={18} /></button>
        </div>
        <div className="p-8 max-h-[85vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

const Sidebar = ({ currentView, setView }) => (
  <aside className="w-64 bg-[#F5F0E6] flex flex-col h-full border-r border-[#D7BA9D]/30">
    <div className="p-10 flex flex-col items-center text-center">
      <div className="w-16 h-16 bg-[#B3543D] rounded-full flex items-center justify-center text-white mb-4 shadow-lg shadow-[#B3543D]/20"><Leaf size={32} /></div>
      <h1 className="text-xl font-bold text-[#433D3C]">eats and use</h1>
      <p className="text-[10px] text-[#8B8A73] uppercase tracking-[0.2em] font-bold">Pro Analytics POS</p>
    </div>
    <nav className="flex-1 px-6 space-y-2">
      {[
        { id: 'pos', icon: ShoppingCart, label: 'ขายสินค้า' },
        { id: 'inventory', icon: Package, label: 'คลังสินค้า' },
        { id: 'contacts', icon: Users, label: 'ฐานข้อมูล CRM' },
        { id: 'accounting', icon: CreditCard, label: 'สมุดบัญชี' },
        { id: 'reports', icon: FileSpreadsheet, label: 'รายงาน & วิเคราะห์' }
      ].map(item => (
        <button key={item.id} onClick={() => setView(item.id)} className={`flex items-center w-full px-5 py-3.5 space-x-4 rounded-xl transition-all ${currentView === item.id ? 'bg-white text-[#B3543D] shadow-sm border border-[#D7BA9D]/50' : 'text-[#8B8A73] hover:bg-white/50'}`}>
          <item.icon size={18} /> <span className="font-bold text-sm">{item.label}</span>
        </button>
      ))}
    </nav>
    <div className="p-6 text-center">
      <div className="bg-[#E8E1D5] rounded-xl p-3 border border-[#D7BA9D]/30">
         <div className="flex items-center justify-center gap-2 text-[#433D3C] font-bold text-xs mb-1">
            <CloudCog size={14} className="text-[#B3543D]"/>
            <span>App ID: {appId.slice(0,8)}...</span>
         </div>
         <p className="text-[9px] text-[#8B8A73] uppercase tracking-widest">Cloud Connected</p>
      </div>
    </div>
  </aside>
);

const ContactPickerModal = ({ isOpen, onClose, contacts, type, onSelect }) => {
  const [search, setSearch] = useState('');
  
  const filtered = useMemo(() => {
    const list = contacts.filter(c => c.type === type);
    if (!search) return list;
    return list.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      (c.taxId && c.taxId.includes(search))
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
          {filtered.length === 0 ? (
            <p className="text-center text-[#8B8A73] text-xs py-10 italic">ไม่พบข้อมูลผู้ติดต่อ</p>
          ) : filtered.map(c => (
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
                  <p className="text-sm font-bold text-[#433D3C]">{c.name}</p>
                  <p className="text-[10px] text-[#8B8A73] font-mono">Tax ID: {c.taxId || '-'} | สาขา: {c.branch}</p>
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

// --- Main App Component ---

const App = () => {
  // --- States ---
  const [user, setUser] = useState(null);
  const [view, setView] = useState('pos');
  const [searchTerm, setSearchTerm] = useState('');
  const [inventorySubView, setInventorySubView] = useState('table'); 
  const [reportSubView, setReportSubView] = useState('tax'); 
  const [crmTypeFilter, setCrmTypeFilter] = useState('all'); 
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Data States
  const [shopInfo, setShopInfo] = useState({
    name: 'ร้าน eats and use', taxId: '0105566000000', branch: '00000',
    address: '123 ชั้น 4 อาคารมินิมอล ถนนสุขุมวิท กรุงเทพฯ', phone: '02-123-4567'
  });
  const [products, setProducts] = useState([]);
  const [lots, setLots] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [cart, setCart] = useState([]);

  // UI Control States
  const [isProductModalOpen, setProductModalOpen] = useState(false);
  const [isStockModalOpen, setStockModalOpen] = useState(false);
  const [isShopModalOpen, setShopModalOpen] = useState(false);
  const [isContactModalOpen, setContactModalOpen] = useState(false);
  const [isCustomerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [isVendorPickerOpen, setVendorPickerOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState(null);
  const [viewingContact, setViewingContact] = useState(null);
  
  // Checkout States
  const [salesChannel, setSalesChannel] = useState('Offline');
  const [manualFeeAmount, setManualFeeAmount] = useState(0); 
  const [shippingIncome, setShippingIncome] = useState(0); 
  const [actualShippingCost, setActualShippingCost] = useState(0); 
  const [discountAmount, setDiscountAmount] = useState(0); 
  const [useVat, setUseVat] = useState(true);
  const [isFullTax, setIsFullTax] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ name: '', taxId: '', branch: '00000', address: '' });

  const [searchReceiptId, setSearchReceiptId] = useState('');
  const [foundTransaction, setFoundTransaction] = useState(null);

  // Form States
  const [newProduct, setNewProduct] = useState({ 
    name: '', sku: '', category: 'เครื่องดื่ม', subCategory: '', brand: '', uom: 'ชิ้น', size: '', price: 0, minStock: 5 
  });
  const [newStock, setNewStock] = useState({ 
    productId: '', cost: 0, qty: 0, lotNo: '', receiveDate: new Date().toISOString().split('T')[0],
    vendor: '', taxId: '', branch: '00000', includeVat: true, contactId: ''
  });
  const [newContact, setNewContact] = useState({ name: '', taxId: '', branch: '00000', email: '', phone: '', address: '', type: 'customer' });

  // --- Derived Calculations ---
  const derivedValues = useMemo(() => {
    const currentSubtotal = cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty)), 0);
    const currentVatValue = useVat ? (currentSubtotal - Number(discountAmount)) * 0.07 : 0;
    const currentFinalReceive = currentSubtotal + Number(shippingIncome) - Number(discountAmount) - Number(manualFeeAmount) + (useVat ? currentVatValue : 0);
    return { subtotal: currentSubtotal, vatValue: currentVatValue, finalReceive: currentFinalReceive };
  }, [cart, useVat, discountAmount, shippingIncome, manualFeeAmount]);

  const productInventorySummary = useMemo(() => {
    return products.map((product, index) => {
      const productLots = lots.filter(l => l.productId === product.id);
      const totalIn = productLots.reduce((sum, l) => sum + (Number(l.initialQty) || 0), 0);
      const remaining = productLots.reduce((sum, l) => sum + (Number(l.remainingQty) || 0), 0);
      const used = totalIn - remaining;
      const totalValue = productLots.reduce((sum, l) => sum + ((Number(l.remainingQty) || 0) * (Number(l.cost) || 0)), 0);
      return { index: index + 1, ...product, totalIn, used, remaining, totalValue };
    });
  }, [products, lots]);

  const salesTaxReport = useMemo(() => transactions.filter(t => t.type === 'income' && (Number(t.vat) || 0) > 0), [transactions]);
  const purchaseTaxReport = useMemo(() => transactions.filter(t => t.type === 'expense' && (Number(t.vat) || 0) > 0), [transactions]);

  const taxSummary = useMemo(() => {
    const totalOutput = salesTaxReport.reduce((sum, t) => sum + (Number(t.vat) || 0), 0);
    const totalInput = purchaseTaxReport.reduce((sum, t) => sum + (Number(t.vat) || 0), 0);
    return { totalOutput, totalInput, netVat: totalOutput - totalInput };
  }, [salesTaxReport, purchaseTaxReport]);

  const accSummary = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount || 0) + Number(t.shippingIncome || 0) - Number(t.discount || 0), 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount || 0), 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const analyticsData = useMemo(() => {
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

  const sortedCategories = useMemo(() => [...new Set(products.map(p => p.category))].sort(), [products]);

  // --- Functions ---
  const getProductStockInfo = (productId) => {
    const summary = productInventorySummary.find(p => p.id === productId);
    const minVal = summary?.minStock || 10;
    return { totalQty: summary?.remaining || 0, status: summary?.remaining === 0 ? 'หมด' : summary?.remaining < minVal ? 'ใกล้หมด' : 'ปกติ' };
  };

  const addToCart = (product) => {
    const info = getProductStockInfo(product.id);
    if (info.totalQty <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.qty + 1 > info.totalQty) return prev;
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  // --- Handlers ---
  const handleSaveShopInfo = async () => {
    if (!user) return;
    try {
      const shopDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'shopInfo');
      await setDoc(shopDocRef, shopInfo);
      setShopModalOpen(false);
    } catch (err) { console.error(err); }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      const productColl = collection(db, 'artifacts', appId, 'public', 'data', 'products');
      await addDoc(productColl, { ...newProduct, createdAt: new Date().toISOString() });
      setProductModalOpen(false);
    } catch (err) { console.error(err); }
  };

  const handleReceiveStock = async (e) => {
    e.preventDefault();
    if (!user || !newStock.productId) return;
    try {
      const purchaseVat = newStock.includeVat ? (Number(newStock.qty) * Number(newStock.cost)) * 0.07 : 0;
      const lotColl = collection(db, 'artifacts', appId, 'public', 'data', 'lots');
      const transColl = collection(db, 'artifacts', appId, 'public', 'data', 'transactions');
      await addDoc(lotColl, { 
        ...newStock, initialQty: Number(newStock.qty), remainingQty: Number(newStock.qty), cost: Number(newStock.cost) 
      });
      await addDoc(transColl, {
        date: newStock.receiveDate, type: 'expense', category: 'ซื้อสินค้าเข้าสต็อก', channel: 'Internal',
        amount: Number(newStock.qty) * Number(newStock.cost), fee: 0, vat: purchaseVat, customer: newStock.vendor || 'ไม่ระบุชื่อ',
        taxId: newStock.taxId || '-', branch: newStock.branch || '00000', taxType: 'เต็มรูปแบบ', desc: `รับเข้าล็อต ${newStock.lotNo}`
      });
      setStockModalOpen(false);
      setNewStock({ productId: '', cost: 0, qty: 0, lotNo: '', receiveDate: new Date().toISOString().split('T')[0], vendor: '', taxId: '', branch: '00000', includeVat: true, contactId: '' });
    } catch (err) { console.error(err); }
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || !user) return;
    try {
      let currentLots = JSON.parse(JSON.stringify(lots));
      let totalItemsPrice = 0;
      const lotUpdates = [];
      cart.forEach(item => {
        let qtyToSell = item.qty;
        totalItemsPrice += Number(item.price) * item.qty;
        const sortedLots = currentLots.filter(l => l.productId === item.id && l.remainingQty > 0).sort((a, b) => new Date(a.receiveDate) - new Date(b.receiveDate));
        for (let lot of sortedLots) {
          const sellFromThisLot = Math.min(lot.remainingQty, qtyToSell);
          const currentRem = lot.remainingQty - sellFromThisLot;
          qtyToSell -= sellFromThisLot;
          lotUpdates.push({ id: lot.id, remainingQty: currentRem });
          if (qtyToSell <= 0) break;
        }
      });
      for (let upd of lotUpdates) {
        const lotDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'lots', upd.id);
        await setDoc(lotDocRef, { remainingQty: upd.remainingQty }, { merge: true });
      }
      const currentVat = useVat ? (totalItemsPrice - Number(discountAmount)) * 0.07 : 0;
      const transColl = collection(db, 'artifacts', appId, 'public', 'data', 'transactions');
      const receiptId = `TX-${Date.now().toString().slice(-6)}`;
      await setDoc(doc(transColl, receiptId), {
        date: new Date().toISOString().split('T')[0],
        type: 'income', category: 'ขายสินค้า', channel: salesChannel,
        amount: totalItemsPrice, fee: Number(manualFeeAmount), shippingIncome: Number(shippingIncome), shippingCost: Number(actualShippingCost),
        discount: Number(discountAmount), vat: currentVat,
        customer: isFullTax ? customerInfo.name : 'ลูกค้าทั่วไป', taxId: isFullTax ? customerInfo.taxId : '-', branch: isFullTax ? customerInfo.branch : '-',
        taxType: isFullTax ? 'เต็มรูปแบบ' : 'แบบย่อ', desc: `ขายผ่าน ${salesChannel}`,
        items: cart.map(i => ({ name: i.name, qty: i.qty, price: i.price, category: i.category }))
      });
      setCart([]); setShippingIncome(0); setActualShippingCost(0); setDiscountAmount(0); setManualFeeAmount(0); setIsFullTax(false);
      alert(`บันทึกเรียบร้อย (ID: ${receiptId})`);
    } catch (err) { console.error(err); }
  };

  const handleSearchReceipt = () => {
    const tx = transactions.find(t => t.id === searchReceiptId);
    if (tx) setFoundTransaction(tx);
    else alert('ไม่พบรายการ');
  };

  const handleConvertToFullTax = async () => {
    if (!foundTransaction || !user) return;
    try {
      const transDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'transactions', foundTransaction.id);
      await updateDoc(transDocRef, { taxType: 'เต็มรูปแบบ', customer: customerInfo.name, taxId: customerInfo.taxId, branch: customerInfo.branch });
      alert('บันทึกใบกำกับภาษีเต็มรูปสำเร็จ');
      setFoundTransaction(null); setSearchReceiptId('');
    } catch (err) { console.error(err); }
  };

  const handleSaveContact = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      const contactColl = collection(db, 'artifacts', appId, 'public', 'data', 'contacts');
      if (editingContactId) {
        await updateDoc(doc(contactColl, editingContactId), { ...newContact });
      } else {
        await addDoc(contactColl, { ...newContact, createdAt: new Date().toISOString() });
      }
      setContactModalOpen(false);
      setEditingContactId(null);
      setNewContact({ name: '', taxId: '', branch: '00000', email: '', phone: '', address: '', type: 'customer' });
    } catch (err) { console.error(err); }
  };

  const handleEditContact = (c) => {
    setNewContact({ ...c });
    setEditingContactId(c.id);
    setContactModalOpen(true);
  };

  const handleDeleteContact = async (id) => {
    if(!confirm('ยืนยันการลบรายชื่อนี้?')) return;
    try {
       await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'contacts', id));
    } catch(e) { console.error(e); }
  };

  // --- Sync Effects ---
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    document.head.appendChild(script);
    const initAuth = async () => {
      try {
        // Fix: Removed signInWithCustomToken because it causes mismatch when using custom firebaseConfig
        // with the environment's token. Always use Anonymous for this setup.
        await signInAnonymously(auth); 
      } catch (err) { 
        console.error("Auth error", err); 
        // Show specific alert for configuration-not-found error
        if (err.code === 'auth/configuration-not-found' || err.code === 'auth/admin-restricted-operation') {
            alert("Connection Error: กรุณาเปิดใช้งาน 'Anonymous' (ไม่ระบุตัวตน) ใน Firebase Console -> Authentication -> Sign-in method ก่อนใช้งาน");
        }
      }
    };
    initAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, setUser);
    return () => unsubscribeAuth();
  }, []);

  // --- NEW: Safety Timeout to prevent infinite loading ---
  useEffect(() => {
    // Force stop loading after 8 seconds (Safety net)
    const safetyTimer = setTimeout(() => {
        setLoading(false);
    }, 8000);
    return () => clearTimeout(safetyTimer);
  }, []);

  useEffect(() => {
    if (!user) return;
    const publicPath = (coll) => collection(db, 'artifacts', appId, 'public', 'data', coll);
    const shopDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'shopInfo');
    getDoc(shopDocRef).then((snap) => { if (snap.exists()) setShopInfo(snap.data()); });
    
    // Add error callbacks to snapshot listeners
    const unsubProducts = onSnapshot(publicPath('products'), 
      (snap) => { setProducts(snap.docs.map(d => ({ ...d.data(), id: d.id }))); setLoading(false); }, 
      (err) => {
        console.error("Products snapshot error:", err);
        setLoading(false); // Force stop loading on error
        if(err.code === 'permission-denied') alert("Error: ไม่สามารถเข้าถึงฐานข้อมูลได้ (Permission Denied) กรุณาตรวจสอบ Firestore Rules ใน Firebase Console ว่าเปิดเป็น Test Mode หรือไม่");
      }
    );
    const unsubLots = onSnapshot(publicPath('lots'), 
      (snap) => setLots(snap.docs.map(d => ({ ...d.data(), id: d.id }))), 
      (err) => console.error("Lots snapshot error:", err)
    );
    const unsubContacts = onSnapshot(publicPath('contacts'), 
      (snap) => setContacts(snap.docs.map(d => ({ ...d.data(), id: d.id }))), 
      (err) => console.error("Contacts snapshot error:", err)
    );
    const unsubTrans = onSnapshot(publicPath('transactions'), 
      (snap) => { setTransactions(snap.docs.map(d => ({ ...d.data(), id: d.id })).sort((a, b) => new Date(b.date) - new Date(a.date))); }, 
      (err) => console.error("Transactions snapshot error:", err)
    );
    
    return () => { unsubProducts(); unsubLots(); unsubContacts(); unsubTrans(); };
  }, [user]);

  useEffect(() => {
    if (isProductModalOpen && newProduct.category) {
      const config = FMCG_CONFIG[newProduct.category];
      const prefix = config ? config.prefix : 'ITEM';
      const timestamp = Date.now().toString().slice(-4);
      const count = products.filter(p => p.category === newProduct.category).length + 1;
      const formattedCount = count.toString().padStart(3, '0');
      setNewProduct(prev => ({ ...prev, sku: `${prefix}-${formattedCount}-${timestamp}`, subCategory: config ? config.sub[0] : '' }));
    }
  }, [newProduct.category, isProductModalOpen, products.length]);

  if (loading && user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#FDFCF8] text-[#8B8A73]">
          <Leaf size={48} className="animate-bounce mb-4 text-[#B3543D]" />
          <p className="font-bold uppercase tracking-widest text-xs">eats and use POS Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#FDFCF8] text-[#433D3C] overflow-hidden" style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>
      <Sidebar currentView={view} setView={setView} />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white/40 backdrop-blur-md border-b border-[#D7BA9D]/20 flex items-center justify-between px-10">
          <h2 className="text-lg font-bold tracking-tight text-[#8B8A73] uppercase tracking-widest">{view === 'pos' ? 'Terminal' : view}</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B8A73]" size={14} />
            <input type="text" placeholder="ค้นหา..." className="pl-9 pr-4 py-2 bg-white border border-[#D7BA9D]/30 rounded-full text-xs w-60 outline-none focus:border-[#B3543D]" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-10">
          {view === 'pos' && (
            <div className="flex gap-10 h-full max-w-[1500px] mx-auto animate-in fade-in duration-300">
              <div className="flex-1 space-y-6">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide text-[#433D3C]">
                  {Object.keys(channelConfig).map(ch => (
                    <button key={ch} onClick={() => setSalesChannel(ch)} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all font-bold text-xs ${salesChannel === ch ? 'bg-white text-[#B3543D] border-[#B3543D] shadow-sm' : 'bg-[#F5F0E6] text-[#8B8A73] border-transparent hover:bg-white'}`}>
                      {React.createElement(channelConfig[ch].brandIcon, { size: 14 })} {ch}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.filter(p => p.name.includes(searchTerm) || p.sku.includes(searchTerm)).map(product => {
                    const info = getProductStockInfo(product.id);
                    return (
                      <div key={product.id} onClick={() => addToCart(product)} className={`bg-white p-6 rounded-3xl border border-[#D7BA9D]/20 hover:border-[#B3543D]/50 cursor-pointer transition-all ${info.totalQty === 0 ? 'opacity-50' : ''}`}>
                        <div className="w-10 h-10 bg-[#F5F0E6] rounded-xl flex items-center justify-center text-[#B3543D] mb-4"><Box size={20} /></div>
                        <h4 className="font-bold text-sm mb-1">{product.name}</h4>
                        <div className="flex justify-between items-end mt-4">
                          <span className="text-lg font-bold">฿{Number(product.price).toLocaleString()}</span>
                          <span className={`text-[10px] font-bold ${info.totalQty < (product.minStock || 10) ? 'text-[#B3543D]' : 'text-[#8B8A73]'}`}>คงเหลือ: {info.totalQty}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="w-[450px] bg-white rounded-[40px] border border-[#D7BA9D]/20 flex flex-col shadow-sm">
                <div className="p-8 border-b border-[#F5F0E6] flex items-center gap-3 text-[#433D3C]"><ShoppingCart className="text-[#B3543D]" /> <h3 className="font-bold text-sm">รายการขาย</h3></div>
                <div className="flex-1 p-8 space-y-6 overflow-y-auto">
                  {cart.length === 0 ? <p className="text-center text-[#8B8A73] text-xs py-10 italic">ว่าง</p> : cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-[#FDFCF8] p-3 rounded-2xl border border-[#F5F0E6] text-[#433D3C]">
                      <div className="min-w-0 pr-2"><p className="font-bold text-xs truncate">{item.name}</p><p className="text-[10px] text-[#B3543D] font-bold">฿{Number(item.price).toLocaleString()}</p></div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setCart(cart.map(c => c.id === item.id ? {...c, qty: Math.max(0, c.qty - 1)} : c).filter(c => c.qty > 0))} className="w-6 h-6 rounded-lg bg-white border border-[#D7BA9D]/30 text-xs">-</button>
                        <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                        <button onClick={() => addToCart(item)} className="w-6 h-6 rounded-lg bg-white border border-[#D7BA9D]/30 text-xs">+</button>
                      </div>
                    </div>
                  ))}
                  <div className="pt-6 border-t border-[#F5F0E6] space-y-4">
                    <div className="space-y-4 p-4 bg-[#FDFCF8] border border-[#D7BA9D]/20 rounded-2xl">
                        <div className="flex items-center justify-between text-[#433D3C]">
                          <div className="flex items-center gap-2"><UserCheck size={16} className={isFullTax ? 'text-[#B3543D]' : 'text-[#8B8A73]'} /><span className="text-xs font-bold">ใบกำกับภาษีเต็มรูป</span></div>
                          <button onClick={() => setIsFullTax(!isFullTax)} className={`w-10 h-5 rounded-full relative transition-all ${isFullTax ? 'bg-[#B3543D]' : 'bg-[#D7BA9D]'}`}><div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${isFullTax ? 'left-6' : 'left-1'}`} /></button>
                        </div>
                        {isFullTax && (
                          <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                             <button onClick={() => setCustomerPickerOpen(true)} className="w-full flex items-center justify-between bg-white border border-[#D7BA9D]/30 rounded-lg px-4 py-2.5 text-xs text-[#8B8A73] hover:border-[#B3543D] transition-all"><span>{customerInfo.name || "ค้นหาลูกค้า..."}</span><ChevronRight size={14}/></button>
                             <input type="text" placeholder="ชื่อ" className="w-full bg-white border border-[#D7BA9D]/30 rounded-lg px-3 py-2 text-[11px]" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} />
                             <div className="grid grid-cols-2 gap-2">
                                <input type="text" placeholder="Tax ID" className="w-full bg-white border border-[#D7BA9D]/30 rounded-lg px-3 py-2 text-[11px]" value={customerInfo.taxId} onChange={e => setCustomerInfo({...customerInfo, taxId: e.target.value})} />
                                <input type="text" placeholder="สาขา" className="w-full bg-white border border-[#D7BA9D]/30 rounded-lg px-3 py-2 text-[11px]" value={customerInfo.branch} onChange={e => setCustomerInfo({...customerInfo, branch: e.target.value})} />
                             </div>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
                <div className="p-8 bg-[#F5F0E6]/50 rounded-b-[40px] border-t border-[#F5F0E6] space-y-4 text-[#433D3C]">
                  <div className="flex justify-between text-lg font-bold"><span>ยอดรับสุทธิ</span><span className="text-[#B3543D]">฿{derivedValues.finalReceive.toLocaleString()}</span></div>
                  <button onClick={handleCheckout} disabled={cart.length === 0} className="w-full bg-[#B3543D] text-white py-4 rounded-2xl font-bold text-sm shadow-lg hover:bg-[#963F2C] transition-all">ยืนยันการขาย</button>
                </div>
              </div>
            </div>
          )}

          {view === 'inventory' && (
            <div className="space-y-8 max-w-[1400px] mx-auto animate-in fade-in duration-300 text-[#433D3C]">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                 <div>
                    <div className="flex items-center gap-3">
                       {selectedProductId && <button onClick={() => setSelectedProductId(null)} className="p-2 hover:bg-[#F5F0E6] rounded-xl text-[#B3543D] transition-colors"><ArrowLeft size={20} /></button>}
                       <h3 className="text-xl font-bold">{selectedProductId ? `ล็อตสินค้า: ${products.find(p => p.id === selectedProductId)?.name}` : "คลังสินค้า"}</h3>
                    </div>
                 </div>
                 <div className="flex gap-3 font-bold">
                    <button onClick={() => exportExcel(productInventorySummary, 'Inventory_Report')} className="flex items-center gap-2 bg-white border border-[#D7BA9D]/50 px-5 py-2.5 rounded-2xl text-xs hover:bg-[#FDFCF8]"><Download size={14}/> Export</button>
                    <button onClick={() => setProductModalOpen(true)} className="flex items-center gap-2 bg-white border border-[#D7BA9D]/50 px-5 py-2.5 rounded-2xl text-xs hover:bg-[#FDFCF8] transition-all shadow-sm"><Plus size={16}/> เพิ่มสินค้า</button>
                    <button onClick={() => setStockModalOpen(true)} className="flex items-center gap-2 bg-[#B3543D] text-white px-5 py-2.5 rounded-2xl text-xs shadow-md shadow-[#B3543D]/20"><Package size={16}/> รับสต็อก</button>
                 </div>
               </div>
               
               {selectedProductId ? (
                 <div className="bg-white rounded-[32px] border border-[#D7BA9D]/20 shadow-sm overflow-hidden text-[11px] animate-in slide-in-from-right-4 duration-300">
                    <table className="w-full text-left">
                      <thead className="bg-[#F5F0E6]/50 border-b text-[9px] font-bold text-[#8B8A73] uppercase tracking-widest">
                        <tr><th className="px-6 py-5">รหัสล็อต</th><th className="px-6 py-5">วันที่รับเข้า</th><th className="px-6 py-5 text-right">แรกรับ</th><th className="px-6 py-5 text-right">คงเหลือ</th></tr>
                      </thead>
                      <tbody className="divide-y divide-[#F5F0E6]">
                        {lots.filter(l => l.productId === selectedProductId).map((lot) => (
                          <tr key={lot.id} className="font-bold hover:bg-[#FDFCF8]">
                            <td className="px-6 py-5 font-mono text-[#B3543D]">{lot.lotNo}</td>
                            <td className="px-6 py-5 text-[#8B8A73]">{lot.receiveDate}</td>
                            <td className="px-6 py-5 text-right">{lot.initialQty}</td>
                            <td className={`px-6 py-5 text-right ${lot.remainingQty == 0 ? 'text-red-300 opacity-50' : 'text-[#606C38]'}`}>{lot.remainingQty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
               ) : (
                 <div className="bg-white rounded-[32px] border border-[#D7BA9D]/20 shadow-sm overflow-hidden text-[11px]">
                    <table className="w-full text-left"><thead className="bg-[#F5F0E6]/50 border-b text-[9px] font-bold text-[#8B8A73] uppercase tracking-widest"><tr><th className="px-6 py-5 w-12 text-center">#</th><th className="px-6 py-5">สินค้า (คลิกเพื่อดูล็อต)</th><th className="px-6 py-5 text-right">สต็อกรวม</th><th className="px-6 py-5 text-right">มูลค่ารวม</th></tr></thead><tbody className="divide-y divide-[#F5F0E6]">
                        {productInventorySummary.map(item => (<tr key={item.id} onClick={() => setSelectedProductId(item.id)} className="hover:bg-[#FDFCF8] font-bold text-[#433D3C] cursor-pointer"><td className="px-6 py-5 text-center text-[#8B8A73]">{item.index}</td><td className="px-6 py-5"><div>{item.name}</div><div className="text-[9px] text-[#B3543D] font-mono">{item.sku}</div></td><td className="px-6 py-5 text-right">{item.remaining} {item.uom}</td><td className="px-6 py-5 text-right font-black">฿{item.totalValue.toLocaleString()}</td></tr>))}
                    </tbody></table>
                 </div>
               )}
            </div>
          )}

          {view === 'accounting' && (
             <div className="space-y-8 max-w-[1400px] mx-auto animate-in fade-in duration-300 text-[#433D3C]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-bold text-center">
                   <div className="bg-white p-6 rounded-[32px] border border-[#D7BA9D]/20 shadow-sm"><p className="text-[10px] text-[#8B8A73] uppercase mb-1">รายรับรวม</p><h4 className="text-xl text-[#606C38]">฿{accSummary.income.toLocaleString()}</h4></div>
                   <div className="bg-white p-6 rounded-[32px] border border-[#D7BA9D]/20 shadow-sm"><p className="text-[10px] text-[#8B8A73] uppercase mb-1">รายจ่ายรวม</p><h4 className="text-xl text-[#B3543D]">฿{accSummary.expense.toLocaleString()}</h4></div>
                   <div className="bg-[#433D3C] text-white p-6 rounded-[32px] shadow-lg"><p className="text-[10px] opacity-70 uppercase mb-1">คงเหลือ</p><h4 className="text-xl">฿{accSummary.balance.toLocaleString()}</h4></div>
                </div>
                <div className="bg-white rounded-[32px] border border-[#D7BA9D]/20 shadow-sm overflow-hidden text-[11px]"><table className="w-full text-left"><thead className="bg-[#F5F0E6]/30 text-[9px] font-bold text-[#8B8A73] uppercase tracking-widest"><tr><th className="px-6 py-5">วันที่</th><th className="px-6 py-5">รายการ</th><th className="px-6 py-5 text-right">จำนวนเงิน</th></tr></thead><tbody className="divide-y divide-[#F5F0E6]">{transactions.map(t => (<tr key={t.id} className="hover:bg-[#FDFCF8] font-bold"><td className="px-6 py-5 text-[#8B8A73]">{t.date}</td><td className="px-6 py-5">{t.category} ({t.customer})</td><td className={`px-6 py-5 text-right ${t.type === 'income' ? 'text-[#606C38]' : 'text-[#B3543D]'}`}>฿{(t.amount + (t.shippingIncome || 0) - (t.discount || 0)).toLocaleString()}</td></tr>))}</tbody></table></div>
             </div>
          )}

          {view === 'reports' && (
             <div className="space-y-10 animate-in fade-in duration-500 text-[#433D3C] pb-20">
                <div className="flex gap-2 bg-[#F5F0E6] p-1 rounded-2xl w-fit">
                   <button onClick={() => setReportSubView('tax')} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${reportSubView === 'tax' ? 'bg-white text-[#B3543D] shadow-sm' : 'text-[#8B8A73]'}`}>รายงานภาษี</button>
                   <button onClick={() => setReportSubView('analytics')} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${reportSubView === 'analytics' ? 'bg-white text-[#B3543D] shadow-sm' : 'text-[#8B8A73]'}`}>วิเคราะห์ Big Data</button>
                </div>

                {reportSubView === 'tax' ? (
                  <div className="space-y-8 animate-in slide-in-from-left-4 duration-300">
                    <div className="bg-[#FEFAE0] p-8 rounded-[40px] border border-[#CCD5AE] space-y-4">
                       <h4 className="font-black uppercase text-xs">แปลงใบกำกับภาษีอย่างย่อเป็นแบบเต็มรูป</h4>
                       <div className="flex gap-4">
                          <input type="text" placeholder="เลขอ้างอิงใบเสร็จ..." className="flex-1 bg-white border border-[#CCD5AE] rounded-2xl px-5 py-3 text-sm focus:border-[#B3543D] outline-none" value={searchReceiptId} onChange={e => setSearchReceiptId(e.target.value)} />
                          <button onClick={handleSearchReceipt} className="bg-[#B3543D] text-white px-8 py-3 rounded-2xl font-bold hover:bg-[#963F2C]">ค้นหา</button>
                       </div>
                       {foundTransaction && (
                         <div className="bg-white/60 p-6 rounded-3xl border border-[#CCD5AE] space-y-4">
                            <button onClick={() => setCustomerPickerOpen(true)} className="w-full flex items-center justify-between bg-white border border-[#D7BA9D]/30 rounded-xl px-4 py-2 text-xs text-[#8B8A73]"><span>{customerInfo.name || "เลือกจาก CRM..."}</span><ChevronRight size={14}/></button>
                            <input type="text" placeholder="ชื่อ" className="w-full bg-white border border-[#D7BA9D]/30 rounded-xl px-4 py-2 text-xs" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} />
                            <button onClick={handleConvertToFullTax} className="w-full bg-[#606C38] text-white py-3 rounded-2xl font-bold">บันทึกใบกำกับภาษีเต็มรูป</button>
                         </div>
                       )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                      <h4 className="font-black uppercase text-xs flex items-center gap-2"><ClipboardList size={16} className="text-[#B3543D]"/> รายการขายแบบเจาะลึก (Big Data Log)</h4>
                      <div className="bg-white rounded-[40px] border border-[#D7BA9D]/20 shadow-sm overflow-hidden text-[11px]"><table className="w-full text-left"><thead className="bg-[#F5F0E6]/30 text-[9px] font-bold text-[#8B8A73] uppercase tracking-widest"><tr><th className="px-6 py-5">วันที่</th><th className="px-6 py-5">สินค้า</th><th className="px-6 py-5 text-center">จำนวน</th><th className="px-6 py-5 text-right">รวม</th><th className="px-6 py-5 text-center">ช่องทาง</th></tr></thead><tbody className="divide-y divide-[#F5F0E6]">{analyticsData.itemizedSalesLog.reverse().map((item, idx) => (<tr key={idx} className="hover:bg-[#FDFCF8] font-bold text-[#433D3C]"><td className="px-6 py-5 text-[#8B8A73]">{item.date}</td><td className="px-6 py-5">{item.name}</td><td className="px-6 py-5 text-center">{item.qty}</td><td className="px-6 py-5 text-right text-[#B3543D]">฿{Number(item.total).toLocaleString()}</td><td className="px-6 py-5 text-center"><span className="px-2 py-0.5 bg-white border border-[#D7BA9D]/30 rounded-full text-[9px]">{item.channel}</span></td></tr>))}</tbody></table></div>
                  </div>
                )}
             </div>
          )}

          {view === 'contacts' && (
             <div className="space-y-8 max-w-[1400px] mx-auto animate-in fade-in duration-300 text-[#433D3C]">
                <div className="flex items-center gap-4 bg-[#F5F0E6] p-1 rounded-2xl w-fit">
                   <button onClick={() => setCrmTypeFilter('all')} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${crmTypeFilter === 'all' ? 'bg-white text-[#B3543D] shadow-sm' : ''}`}>ทั้งหมด</button>
                   <button onClick={() => setCrmTypeFilter('customer')} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${crmTypeFilter === 'customer' ? 'bg-white text-[#B3543D] shadow-sm' : ''}`}>ลูกค้า</button>
                   <button onClick={() => setCrmTypeFilter('vendor')} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${crmTypeFilter === 'vendor' ? 'bg-white text-[#B3543D] shadow-sm' : ''}`}>คู่ค้า</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   {contacts.filter(c => (crmTypeFilter === 'all' || c.type === crmTypeFilter) && (c.name.includes(searchTerm) || (c.taxId && c.taxId.includes(searchTerm)))).map(c => (
                    <div key={c.id} className="bg-white p-8 rounded-[40px] border border-[#D7BA9D]/20 shadow-sm group hover:border-[#B3543D]/50 transition-all text-[#433D3C]">
                       <div className="flex justify-between items-start mb-6">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.type === 'customer' ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500'}`}><Users size={24}/></div>
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${c.type === 'customer' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>{c.type}</span>
                       </div>
                       <h4 className="text-lg font-black mb-1">{c.name}</h4>
                       <p className="text-xs text-[#8B8A73] mb-4">{c.address || 'ไม่ระบุที่อยู่'}</p>
                       <div className="pt-6 border-t border-[#F5F0E6] flex justify-between text-[11px] font-bold text-[#8B8A73]"><span>Branch: {c.branch}</span><span>Tax ID: {c.taxId}</span></div>
                       <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-[#F5F0E6]">
                          <button onClick={() => setViewingContact(c)} className="p-2 text-[#8B8A73] hover:text-[#B3543D] hover:bg-[#F5F0E6] rounded-full transition-all"><Eye size={16}/></button>
                          <button onClick={() => handleEditContact(c)} className="p-2 text-[#8B8A73] hover:text-[#B3543D] hover:bg-[#F5F0E6] rounded-full transition-all"><Edit2 size={16}/></button>
                          <button onClick={() => handleDeleteContact(c.id)} className="p-2 text-[#8B8A73] hover:text-red-500 hover:bg-red-50 rounded-full transition-all"><Trash2 size={16}/></button>
                       </div>
                    </div>
                   ))}
                </div>
                <button onClick={() => { setEditingContactId(null); setNewContact({ name: '', taxId: '', branch: '00000', email: '', phone: '', address: '', type: 'customer' }); setContactModalOpen(true); }} className="fixed bottom-10 right-10 w-16 h-16 bg-[#B3543D] text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-all"><Plus size={32}/></button>
             </div>
          )}
        </section>
      </main>

      {/* --- Pop-up Pickers --- */}
      <ContactPickerModal isOpen={isCustomerPickerOpen} onClose={() => setCustomerPickerOpen(false)} contacts={contacts} type="customer" onSelect={(c) => setCustomerInfo({ name: c.name, taxId: c.taxId, branch: c.branch, address: c.address })} />
      <ContactPickerModal isOpen={isVendorPickerOpen} onClose={() => setVendorPickerOpen(false)} contacts={contacts} type="vendor" onSelect={(v) => setNewStock({ ...newStock, contactId: v.id, vendor: v.name, taxId: v.taxId, branch: v.branch })} />

      {/* --- Modals --- */}
      <Modal isOpen={!!viewingContact} onClose={() => setViewingContact(null)} title="ข้อมูลผู้ติดต่อ">
        {viewingContact && (
          <div className="space-y-4 text-left text-[#433D3C]">
             <div className="text-center mb-6">
                <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-2 ${viewingContact.type === 'customer' ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500'}`}><Users size={32}/></div>
                <h3 className="font-bold text-xl">{viewingContact.name}</h3>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${viewingContact.type === 'customer' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>{viewingContact.type}</span>
             </div>
             <div className="space-y-3 bg-[#FDFCF8] p-6 rounded-3xl border border-[#D7BA9D]/20">
                <div className="flex justify-between items-center pb-2 border-b border-[#F5F0E6]"><span className="text-xs text-[#8B8A73]">Tax ID</span><span className="font-bold font-mono text-sm">{viewingContact.taxId || '-'}</span></div>
                <div className="flex justify-between items-center pb-2 border-b border-[#F5F0E6]"><span className="text-xs text-[#8B8A73]">สาขา</span><span className="font-bold text-sm">{viewingContact.branch}</span></div>
                <div className="flex justify-between items-center pb-2 border-b border-[#F5F0E6]"><span className="text-xs text-[#8B8A73]">เบอร์โทร</span><span className="font-bold text-sm">{viewingContact.phone || '-'}</span></div>
                <div><span className="text-xs text-[#8B8A73] block mb-1">ที่อยู่</span><p className="font-bold text-sm leading-relaxed">{viewingContact.address || '-'}</p></div>
             </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isContactModalOpen} onClose={() => setContactModalOpen(false)} title={editingContactId ? 'แก้ไขรายชื่อ' : 'เพิ่มรายชื่อ CRM'}>
        <form onSubmit={handleSaveContact} className="space-y-4 text-left text-[#433D3C]">
           <div className="flex gap-4 p-4 bg-[#F5F0E6] rounded-2xl mb-4">
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input type="radio" name="ctype" checked={newContact.type === 'customer'} onChange={() => setNewContact({...newContact, type: 'customer'})} /> ลูกค้า</label>
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input type="radio" name="ctype" checked={newContact.type === 'vendor'} onChange={() => setNewContact({...newContact, type: 'vendor'})} /> คู่ค้า (Vendor)</label>
           </div>
           <div><label className="text-[10px] font-black text-[#8B8A73] uppercase mb-1 block">ชื่อลูกค้า / บริษัท</label><input type="text" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-4 py-2.5 text-sm focus:border-[#B3543D] outline-none" required value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})} /></div>
           <div className="grid grid-cols-2 gap-4">
              <div><label className="text-[10px] font-black text-[#8B8A73] uppercase mb-1 block">Tax ID</label><input type="text" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-4 py-2.5 text-sm font-mono outline-none" required value={newContact.taxId} onChange={e => setNewContact({...newContact, taxId: e.target.value})} /></div>
              <div><label className="text-[10px] font-black text-[#8B8A73] uppercase mb-1 block">สาขา</label><input type="text" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-4 py-2.5 text-sm outline-none" required value={newContact.branch} onChange={e => setNewContact({...newContact, branch: e.target.value})} /></div>
           </div>
           <div><label className="text-[10px] font-black text-[#8B8A73] uppercase mb-1 block">เบอร์โทร</label><input type="text" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-4 py-2.5 text-sm outline-none" value={newContact.phone} onChange={e => setNewContact({...newContact, phone: e.target.value})} /></div>
           <div><label className="text-[10px] font-black text-[#8B8A73] uppercase mb-1 block">ที่อยู่ (ตามภ.พ.20)</label><textarea className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-4 py-2.5 text-sm outline-none h-20 resize-none focus:border-[#B3543D]" value={newContact.address} onChange={e => setNewContact({...newContact, address: e.target.value})} /></div>
           <button type="submit" className="w-full bg-[#B3543D] text-white py-4 rounded-2xl font-bold mt-4 shadow-lg">บันทึกข้อมูล</button>
        </form>
      </Modal>

      <Modal isOpen={isShopModalOpen} onClose={() => setShopModalOpen(false)} title="แก้ไขข้อมูลร้านค้า">
        <div className="space-y-5 text-left text-[#433D3C]">
           <div><label className="text-[10px] font-bold text-[#8B8A73] uppercase block">ชื่อร้าน</label><input type="text" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-4 py-3 text-sm outline-none" value={shopInfo.name} onChange={e => setShopInfo({...shopInfo, name: e.target.value})} /></div>
           <div className="grid grid-cols-2 gap-4">
              <div><label className="text-[10px] font-bold text-[#8B8A73] uppercase block">Tax ID</label><input type="text" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-4 py-3 text-sm font-mono outline-none" value={shopInfo.taxId} onChange={e => setShopInfo({...shopInfo, taxId: e.target.value})} /></div>
              <div><label className="text-[10px] font-bold text-[#8B8A73] uppercase block">สาขา</label><input type="text" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-4 py-3 text-sm outline-none" value={shopInfo.branch} onChange={e => setShopInfo({...shopInfo, branch: e.target.value})} /></div>
           </div>
           <button onClick={handleSaveShopInfo} className="w-full bg-[#B3543D] text-white py-4 rounded-2xl font-bold">บันทึกข้อมูล</button>
        </div>
      </Modal>

      <Modal isOpen={isProductModalOpen} onClose={() => setProductModalOpen(false)} title="เพิ่มสินค้า Pro FMCG" maxWidth="max-w-2xl">
        <form onSubmit={handleAddProduct} className="space-y-6 text-left text-[#433D3C]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
               <div><label className="text-[10px] font-black text-[#8B8A73] uppercase tracking-widest block mb-1">หมวดหมู่</label><select className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-4 py-2.5 text-sm focus:border-[#B3543D] outline-none" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}>{Object.keys(FMCG_CONFIG).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
               <div><label className="text-[10px] font-black text-[#8B8A73] uppercase tracking-widest block mb-1">ชื่อสินค้า</label><input type="text" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#B3543D]" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} /></div>
               <div><label className="text-[10px] font-black text-[#8B8A73] uppercase tracking-widest block mb-1">แบรนด์</label><input type="text" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#B3543D]" value={newProduct.brand} onChange={e => setNewProduct({...newProduct, brand: e.target.value})} /></div>
            </div>
            <div className="space-y-4">
               <div><label className="text-[10px] font-black text-[#B3543D] uppercase block mb-1">Auto SKU</label><input type="text" className="w-full bg-[#F5F0E6] border border-[#D7BA9D]/30 rounded-xl px-4 py-2.5 text-sm font-mono font-bold" readOnly value={newProduct.sku} /></div>
               <div className="grid grid-cols-2 gap-2 text-left">
                  <div><label className="text-[10px] font-black text-[#8B8A73] uppercase block mb-1">ราคา</label><input type="number" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-4 py-2.5 text-sm" required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} /></div>
                  <div><label className="text-[10px] font-black text-[#8B8A73] uppercase block mb-1">Min Stock</label><input type="number" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-4 py-2.5 text-sm" value={newProduct.minStock} onChange={e => setNewProduct({...newProduct, minStock: e.target.value})} /></div>
               </div>
               <div><label className="text-[10px] font-black text-[#8B8A73] uppercase block mb-1">หน่วย</label><select className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-4 py-2.5 text-sm outline-none" value={newProduct.uom} onChange={e => setNewProduct({...newProduct, uom: e.target.value})}><option>ชิ้น</option><option>แพ็ค</option><option>ลัง</option></select></div>
            </div>
          </div>
          <button type="submit" className="w-full bg-[#B3543D] text-white py-4 rounded-3xl font-black shadow-lg">บันทึกสินค้าลงฐานข้อมูล</button>
        </form>
      </Modal>

      <Modal isOpen={isStockModalOpen} onClose={() => setStockModalOpen(false)} title="รับสต็อก & ภาษีซื้อ">
        <form onSubmit={handleReceiveStock} className="space-y-4 text-left text-[#433D3C]">
          <div><label className="text-[9px] font-bold text-[#8B8A73] uppercase block mb-1">เลือกสินค้า</label><select className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#B3543D]" required value={newStock.productId} onChange={e => setNewStock({...newStock, productId: e.target.value})}><option value="">-- เลือก --</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-3">
             <div><label className="text-[9px] font-bold uppercase text-[#8B8A73] mb-1 block">เลขล็อต</label><input type="text" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-3 py-2 text-sm focus:border-[#B3543D] outline-none" required value={newStock.lotNo} onChange={e => setNewStock({...newStock, lotNo: e.target.value})} /></div>
             <div><label className="text-[9px] font-bold uppercase text-[#8B8A73] mb-1 block">วันที่</label><input type="date" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-3 py-2 text-sm focus:border-[#B3543D] outline-none" value={newStock.receiveDate} onChange={e => setNewStock({...newStock, receiveDate: e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-left">
             <div><label className="text-[9px] font-bold uppercase text-[#8B8A73] mb-1 block">จำนวน</label><input type="number" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-3 py-2 text-sm focus:border-[#B3543D] outline-none" required value={newStock.qty} onChange={e => setNewStock({...newStock, qty: e.target.value})} /></div>
             <div><label className="text-[9px] font-bold uppercase text-[#8B8A73] mb-1 block">ต้นทุน/หน่วย</label><input type="number" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-3 py-2 text-sm focus:border-[#B3543D] outline-none" required value={newStock.cost} onChange={e => setNewStock({...newStock, cost: e.target.value})} /></div>
          </div>
          <div className="pt-3 border-t border-[#F5F0E6] space-y-3">
             <div className="flex justify-between items-center"><p className="text-[10px] text-[#B3543D] font-bold uppercase tracking-widest">ข้อมูลคู่ค้า (Vendor)</p></div>
             <div><button type="button" onClick={() => setVendorPickerOpen(true)} className="w-full flex items-center justify-between bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-3 py-2 text-xs text-[#8B8A73] hover:border-[#B3543D] transition-all"><span>{newStock.vendor || "คลิกเพื่อค้นหาคู่ค้า..."}</span><ChevronRight size={12}/></button></div>
             <div><label className="text-[9px] text-[#8B8A73] uppercase mb-1 block">ชื่อผู้ขาย</label><input type="text" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-3 py-2 text-sm focus:border-[#B3543D] outline-none" value={newStock.vendor} onChange={e => setNewStock({...newStock, vendor: e.target.value})} /></div>
             <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[9px] text-[#8B8A73] uppercase mb-1 block">Tax ID</label><input type="text" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-3 py-2 text-sm font-mono focus:border-[#B3543D] outline-none" value={newStock.taxId} onChange={e => setNewStock({...newStock, taxId: e.target.value})} /></div>
                <div><label className="text-[9px] text-[#8B8A73] uppercase mb-1 block">สาขา</label><input type="text" className="w-full bg-[#FDFCF8] border border-[#D7BA9D]/30 rounded-xl px-3 py-2 text-sm focus:border-[#B3543D] outline-none" value={newStock.branch} onChange={e => setNewStock({...newStock, branch: e.target.value})} /></div>
             </div>
             <div className="flex items-center justify-between p-3 bg-[#FDFCF8] border border-[#D7BA9D]/20 rounded-xl">
                <span className="text-xs">บันทึกภาษีซื้อ (VAT 7%)</span>
                <button type="button" onClick={() => setNewStock({...newStock, includeVat: !newStock.includeVat})} className={`w-8 h-4 rounded-full relative transition-all ${newStock.includeVat ? 'bg-[#606C38]' : 'bg-[#D7BA9D]'}`}><div className={`w-2.5 h-2.5 bg-white rounded-full absolute top-0.5 transition-all ${newStock.includeVat ? 'left-5' : 'left-0.5'}`} /></button>
             </div>
          </div>
          <button type="submit" className="w-full bg-[#433D3C] text-white py-4 rounded-2xl font-bold mt-2 shadow-lg shadow-black/10 transition-all hover:scale-[1.01]">ยืนยันรับสต็อกลงคลาวด์</button>
        </form>
      </Modal>
    </div>
  );
};

export default App;