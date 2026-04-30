import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut, Package, Clock, Truck, CheckCircle, XCircle, RefreshCw,
  Eye, Pencil, Trash2, X, RotateCcw, CreditCard, Send, ArrowRight,
  Plus, ShoppingBag, BoxIcon, Settings, Save, Upload, Image,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderStatus = Database["public"]["Enums"]["order_status"];
type Product = Database["public"]["Tables"]["products"]["Row"];

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "পেন্ডিং", color: "bg-bubble-yellow/20 text-bubble-yellow", icon: Clock },
  confirmed: { label: "কনফার্মড", color: "bg-bubble-blue/20 text-bubble-blue", icon: CheckCircle },
  processing: { label: "প্রসেসিং", color: "bg-accent/20 text-accent", icon: Package },
  shipped: { label: "শিপড", color: "bg-secondary/20 text-secondary", icon: Send },
  delivered: { label: "ডেলিভারড", color: "bg-primary/20 text-primary", icon: Truck },
  returned: { label: "রিটার্নড", color: "bg-bubble-pink/20 text-bubble-pink", icon: RotateCcw },
  refunded: { label: "রিফান্ডেড", color: "bg-muted-foreground/20 text-muted-foreground", icon: CreditCard },
  cancelled: { label: "ক্যানসেলড", color: "bg-destructive/20 text-destructive", icon: XCircle },
};

const allStatuses: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered", "returned", "refunded", "cancelled"];

const nextStatuses: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: ["returned", "refunded"],
  returned: ["refunded"],
  refunded: [],
  cancelled: [],
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<"orders" | "products" | "settings">("orders");
  const [fbPixelId, setFbPixelId] = useState("");
  const [fbCapiToken, setFbCapiToken] = useState("");
  const [copyrightText, setCopyrightText] = useState("© ২০২৫ Libsun — সকল স্বত্ব সংরক্ষিত");
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteProductConfirm, setDeleteProductConfirm] = useState<string | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProductImage, setEditProductImage] = useState<File | null>(null);
  const [editProductImagePreview, setEditProductImagePreview] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({ name: "", description: "", price: 0, image_url: "", stock: 0, is_active: true });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };

  const fetchSettings = async () => {
    setSettingsLoading(true);
    const { data } = await supabase.from("site_settings").select("key, value").in("key", ["fb_pixel_id", "fb_capi_token", "copyright_text"]);
    if (data) {
      setFbPixelId(data.find((s) => s.key === "fb_pixel_id")?.value || "");
      setFbCapiToken(data.find((s) => s.key === "fb_capi_token")?.value || "");
      setCopyrightText(data.find((s) => s.key === "copyright_text")?.value || "© ২০২৫ Libsun — সকল স্বত্ব সংরক্ষিত");
    }
    setSettingsLoading(false);
  };

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    const upsertKeys = [
      { key: "fb_pixel_id", value: fbPixelId },
      { key: "fb_capi_token", value: fbCapiToken },
      { key: "copyright_text", value: copyrightText },
    ];
    for (const item of upsertKeys) {
      const { data: existing } = await supabase.from("site_settings").select("id").eq("key", item.key).maybeSingle();
      if (existing) {
        await supabase.from("site_settings").update({ value: item.value }).eq("key", item.key);
      } else {
        await supabase.from("site_settings").insert(item);
      }
    }
    setSettingsSaving(false);
    toast({ title: "সেটিংস সেভ হয়েছে ✅" });
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate("/admin"); return; }
      fetchOrders();
      fetchProducts();
      fetchSettings();
    });
  }, [navigate]);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    await supabase.from("orders").update({ status }).eq("id", orderId);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    if (selectedOrder?.id === orderId) setSelectedOrder((p) => p ? { ...p, status } : null);
    toast({ title: `স্ট্যাটাস আপডেট: ${statusConfig[status].label}` });
  };

  const handleDelete = async (orderId: string) => {
    await supabase.from("orders").delete().eq("id", orderId);
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    setDeleteConfirm(null);
    setSelectedOrder(null);
    toast({ title: "অর্ডার ডিলিট হয়েছে", variant: "destructive" });
  };

  const handleEditSave = async () => {
    if (!editingOrder) return;
    const { id, customer_name, phone, address, delivery_area, quantity, notes } = editingOrder;
    const deliveryCharge = delivery_area === "inside_dhaka" ? 60 : 120;
    const total = editingOrder.unit_price * quantity + deliveryCharge;
    await supabase.from("orders").update({
      customer_name, phone, address, delivery_area, quantity, delivery_charge: deliveryCharge, total, notes,
    }).eq("id", id);
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, customer_name, phone, address, delivery_area, quantity, delivery_charge: deliveryCharge, total, notes } : o));
    setEditingOrder(null);
    toast({ title: "অর্ডার আপডেট হয়েছে" });
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const { error } = await supabase.storage.from("product-images").upload(fileName, file);
    if (error) {
      toast({ title: "ছবি আপলোড হয়নি", variant: "destructive" });
      setUploadingImage(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
    setNewProduct((prev) => ({ ...prev, image_url: urlData.publicUrl }));
    setImagePreview(urlData.publicUrl);
    setUploadingImage(false);
    toast({ title: "ছবি আপলোড হয়েছে ✅" });
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || newProduct.price <= 0) {
      toast({ title: "নাম ও মূল্য দিন", variant: "destructive" });
      return;
    }
    const { data, error } = await supabase.from("products").insert({
      name: newProduct.name,
      description: newProduct.description || null,
      price: newProduct.price,
      image_url: newProduct.image_url || null,
      stock: newProduct.stock,
      is_active: newProduct.is_active,
    }).select().single();
    if (error) {
      toast({ title: "প্রোডাক্ট যোগ করতে সমস্যা", variant: "destructive" });
      return;
    }
    setProducts((prev) => [data, ...prev]);
    setNewProduct({ name: "", description: "", price: 0, image_url: "", stock: 0, is_active: true });
    setImagePreview(null);
    setShowAddProduct(false);
    toast({ title: "প্রোডাক্ট যোগ হয়েছে" });
  };

  const handleEditProductSave = async () => {
    if (!editingProduct) return;
    let imageUrl = editingProduct.image_url;

    if (editProductImage) {
      setUploadingImage(true);
      const fileExt = editProductImage.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const { error } = await supabase.storage.from("product-images").upload(fileName, editProductImage);
      if (error) {
        toast({ title: "ছবি আপলোড হয়নি", variant: "destructive" });
        setUploadingImage(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
      imageUrl = urlData.publicUrl;
      setUploadingImage(false);
    }

    const { error } = await supabase.from("products").update({
      name: editingProduct.name,
      description: editingProduct.description,
      price: editingProduct.price,
      image_url: imageUrl,
      stock: editingProduct.stock,
      is_active: editingProduct.is_active,
    }).eq("id", editingProduct.id);

    if (error) {
      toast({ title: "আপডেট হয়নি", variant: "destructive" });
      return;
    }

    setProducts((prev) => prev.map((p) => p.id === editingProduct.id ? { ...p, name: editingProduct.name, description: editingProduct.description, price: editingProduct.price, image_url: imageUrl, stock: editingProduct.stock, is_active: editingProduct.is_active } : p));
    setEditingProduct(null);
    setEditProductImage(null);
    setEditProductImagePreview(null);
    toast({ title: "প্রোডাক্ট আপডেট হয়েছে ✅" });
  };

  const handleDeleteProduct = async (productId: string) => {
    await supabase.from("products").delete().eq("id", productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setDeleteProductConfirm(null);
    setSelectedProduct(null);
    toast({ title: "প্রোডাক্ট ডিলিট হয়েছে", variant: "destructive" });
  };

  const handleToggleActive = async (product: Product) => {
    const newActive = !product.is_active;
    await supabase.from("products").update({ is_active: newActive }).eq("id", product.id);
    setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, is_active: newActive } : p));
    toast({ title: newActive ? "প্রোডাক্ট সক্রিয় করা হয়েছে" : "প্রোডাক্ট নিষ্ক্রিয় করা হয়েছে" });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) => o.status === "processing" || o.status === "confirmed").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    cancelled: orders.filter((o) => o.status === "cancelled" || o.status === "returned" || o.status === "refunded").length,
    revenue: orders.filter((o) => !["cancelled", "refunded"].includes(o.status)).reduce((s, o) => s + o.total, 0),
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <h1 className="text-lg font-bold text-foreground">🎈 বাবল গান — অ্যাডমিন</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => { fetchOrders(); fetchProducts(); }} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
          <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-muted transition-colors text-destructive">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-card border-b border-border px-4">
        <div className="flex gap-1 max-w-6xl mx-auto">
          <button onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "orders" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            <ShoppingBag className="w-4 h-4" />অর্ডার
          </button>
          <button onClick={() => setActiveTab("products")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "products" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            <BoxIcon className="w-4 h-4" />প্রোডাক্ট
          </button>
          <button onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "settings" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            <Settings className="w-4 h-4" />সেটিংস
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {activeTab === "orders" ? (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 mb-6">
              {[
                { label: "মোট", value: stats.total, color: "text-foreground" },
                { label: "পেন্ডিং", value: stats.pending, color: "text-bubble-yellow" },
                { label: "প্রসেসিং", value: stats.processing, color: "text-bubble-blue" },
                { label: "শিপড", value: stats.shipped, color: "text-secondary" },
                { label: "ডেলিভারড", value: stats.delivered, color: "text-primary" },
                { label: "ক্যানসেলড", value: stats.cancelled, color: "text-destructive" },
                { label: "আয়", value: `৳${stats.revenue.toLocaleString()}`, color: "text-primary" },
              ].map((s, i) => (
                <motion.div key={i} className="bg-card rounded-xl p-3 border border-border text-center"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {(["all", ...allStatuses] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    filter === f ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
                  }`}>
                  {f === "all" ? "সব" : statusConfig[f].label} ({f === "all" ? orders.length : orders.filter((o) => o.status === f).length})
                </button>
              ))}
            </div>

            {/* Orders List */}
            {loading ? (
              <div className="text-center py-20 text-muted-foreground">লোড হচ্ছে...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">কোনো অর্ডার নেই</div>
            ) : (
              <div className="space-y-3">
                {filtered.map((order) => {
                  const sc = statusConfig[order.status];
                  const StatusIcon = sc.icon;
                  const next = nextStatuses[order.status];
                  return (
                    <motion.div key={order.id} className="bg-card rounded-xl border border-border p-4"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{order.customer_name}</span>
                          <span className="text-muted-foreground text-sm">{order.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${sc.color}`}>
                            <StatusIcon className="w-3 h-3" />{sc.label}
                          </div>
                          <button onClick={() => setSelectedOrder(order)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="বিস্তারিত">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingOrder({ ...order })} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="এডিট">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteConfirm(order.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="ডিলিট">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 text-sm mb-3">
                        <div><span className="text-muted-foreground">ঠিকানা: </span><span className="text-foreground">{order.address}</span></div>
                        <div><span className="text-muted-foreground">এরিয়া: </span><span className="text-foreground">{order.delivery_area === "inside_dhaka" ? "ঢাকা" : "ঢাকার বাইরে"}</span></div>
                        <div><span className="text-muted-foreground">পরিমাণ: </span><span className="text-foreground">{order.quantity} পিস</span></div>
                        <div><span className="text-muted-foreground">মোট: </span><span className="font-bold text-foreground">৳{order.total}</span></div>
                      </div>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <div className="flex gap-1.5 flex-wrap">
                          {next.map((ns) => {
                            const nsc = statusConfig[ns];
                            return (
                              <button key={ns} onClick={() => updateStatus(order.id, ns)}
                                className={`text-xs px-2.5 py-1.5 rounded-lg ${nsc.color} hover:opacity-80 transition-opacity inline-flex items-center gap-1`}>
                                <ArrowRight className="w-3 h-3" />{nsc.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        ) : activeTab === "products" ? (
          /* Products Tab */
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">প্রোডাক্ট ম্যানেজমেন্ট</h2>
                <p className="text-sm text-muted-foreground">{products.length} টি প্রোডাক্ট</p>
              </div>
              <button onClick={() => setShowAddProduct(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                <Plus className="w-4 h-4" />প্রোডাক্ট যোগ করুন
              </button>
            </div>

            {loading ? (
              <div className="text-center py-20 text-muted-foreground">লোড হচ্ছে...</div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <BoxIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">কোনো প্রোডাক্ট নেই</p>
                <button onClick={() => setShowAddProduct(true)}
                  className="mt-3 text-sm text-primary hover:underline">প্রথম প্রোডাক্ট যোগ করুন</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <motion.div key={product.id} className="bg-card rounded-xl border border-border overflow-hidden"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    {product.image_url && (
                      <div className="aspect-video bg-muted overflow-hidden">
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-foreground">{product.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${product.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {product.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}
                        </span>
                      </div>
                      {product.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
                      )}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-bold text-foreground">৳{product.price}</span>
                        <span className="text-sm text-muted-foreground">স্টক: {product.stock}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedProduct(product)}
                          className="flex-1 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors inline-flex items-center justify-center gap-1">
                          <Eye className="w-3.5 h-3.5" />দেখুন
                        </button>
                        <button onClick={() => { setEditingProduct({ ...product }); setEditProductImagePreview(product.image_url); setEditProductImage(null); }}
                          className="flex-1 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors inline-flex items-center justify-center gap-1">
                          <Pencil className="w-3.5 h-3.5" />এডিট
                        </button>
                        <button onClick={() => handleToggleActive(product)}
                          className={`flex-1 py-2 rounded-lg text-sm transition-colors inline-flex items-center justify-center gap-1 ${
                            product.is_active ? "text-muted-foreground hover:text-foreground hover:bg-muted" : "text-primary hover:bg-primary/10"
                          }`}>
                          {product.is_active ? "নিষ্ক্রিয়" : "সক্রিয়"}
                        </button>
                        <button onClick={() => setDeleteProductConfirm(product.id)}
                          className="flex-1 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors inline-flex items-center justify-center gap-1">
                          <Trash2 className="w-3.5 h-3.5" />ডিলিট
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        ) : activeTab === "settings" ? (
          /* Settings Tab */
          <div className="max-w-xl">
            <h2 className="text-xl font-bold text-foreground mb-1">ফেসবুক পিক্সেল ও কনভার্সন API</h2>
            <p className="text-sm text-muted-foreground mb-6">পিক্সেল আইডি ও টোকেন দিলে অটোমেটিক কাজ করবে</p>

            {settingsLoading ? (
              <div className="text-muted-foreground py-10 text-center">লোড হচ্ছে...</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Facebook Pixel ID</label>
                  <input
                    type="text"
                    value={fbPixelId}
                    onChange={(e) => setFbPixelId(e.target.value)}
                    placeholder="যেমন: 123456789012345"
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Facebook Events Manager থেকে পাবেন</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Conversion API Token</label>
                  <input
                    type="password"
                    value={fbCapiToken}
                    onChange={(e) => setFbCapiToken(e.target.value)}
                    placeholder="আপনার CAPI অ্যাক্সেস টোকেন"
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Events Manager → Settings → Generate Access Token</p>
                </div>

                <hr className="border-border my-6" />
                <h2 className="text-xl font-bold text-foreground mb-1">কপিরাইট টেক্সট</h2>
                <p className="text-sm text-muted-foreground mb-4">ফুটারে যে টেক্সট দেখাবে</p>
                <div>
                  <input
                    type="text"
                    value={copyrightText}
                    onChange={(e) => setCopyrightText(e.target.value)}
                    placeholder="© ২০২৫ Libsun — সকল স্বত্ব সংরক্ষিত"
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  />
                </div>

                <button
                  onClick={handleSaveSettings}
                  disabled={settingsSaving}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {settingsSaving ? "সেভ হচ্ছে..." : "সেভ করুন"}
                </button>

                <div className="bg-muted/50 rounded-xl p-4 mt-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">📋 যেভাবে কাজ করবে:</h4>
                  <ul className="text-xs text-muted-foreground space-y-1.5">
                    <li>• Pixel ID দিলে সাইটে অটো PageView ট্র্যাক হবে</li>
                    <li>• CAPI Token দিলে সার্ভার থেকে Purchase ইভেন্ট যাবে</li>
                    <li>• অর্ডার করলে ব্রাউজার + সার্ভার দুইদিক থেকে ইভেন্ট পাঠাবে</li>
                    <li>• দুটোই দিলে Facebook Ads অপটিমাইজেশন সবচেয়ে ভালো হবে</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && !editingOrder && (
          <motion.div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedOrder(null)}>
            <motion.div className="bg-card rounded-2xl border border-border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">অর্ডার বিস্তারিত</h2>
                <button onClick={() => setSelectedOrder(null)} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <DetailField label="কাস্টমার" value={selectedOrder.customer_name} />
                  <DetailField label="ফোন" value={selectedOrder.phone} />
                  <DetailField label="ঠিকানা" value={selectedOrder.address} />
                  <DetailField label="ডেলিভারি এরিয়া" value={selectedOrder.delivery_area === "inside_dhaka" ? "ঢাকার ভিতরে" : "ঢাকার বাইরে"} />
                  <DetailField label="পরিমাণ" value={`${selectedOrder.quantity} পিস`} />
                  <DetailField label="একক মূল্য" value={`৳${selectedOrder.unit_price}`} />
                  <DetailField label="ডেলিভারি চার্জ" value={`৳${selectedOrder.delivery_charge}`} />
                  <DetailField label="মোট" value={`৳${selectedOrder.total}`} bold />
                </div>
                {selectedOrder.notes && <DetailField label="নোট" value={selectedOrder.notes} />}
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">স্ট্যাটাস</span>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig[selectedOrder.status].color}`}>
                    {statusConfig[selectedOrder.status].label}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  অর্ডার তারিখ: {new Date(selectedOrder.created_at).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
                {nextStatuses[selectedOrder.status].length > 0 && (
                  <div className="flex gap-2 flex-wrap pt-2 border-t border-border">
                    {nextStatuses[selectedOrder.status].map((ns) => (
                      <button key={ns} onClick={() => updateStatus(selectedOrder.id, ns)}
                        className={`text-sm px-4 py-2 rounded-xl ${statusConfig[ns].color} hover:opacity-80 transition-opacity`}>
                        {statusConfig[ns].label} করুন
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <button onClick={() => { setEditingOrder({ ...selectedOrder }); }}
                    className="flex-1 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors">
                    <Pencil className="w-4 h-4 inline mr-1" />এডিট
                  </button>
                  <button onClick={() => setDeleteConfirm(selectedOrder.id)}
                    className="flex-1 py-2 rounded-xl bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors">
                    <Trash2 className="w-4 h-4 inline mr-1" />ডিলিট
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Order Modal */}
      <AnimatePresence>
        {editingOrder && (
          <motion.div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setEditingOrder(null)}>
            <motion.div className="bg-card rounded-2xl border border-border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">অর্ডার এডিট</h2>
                <button onClick={() => setEditingOrder(null)} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <EditField label="কাস্টমার নাম" value={editingOrder.customer_name}
                  onChange={(v) => setEditingOrder({ ...editingOrder, customer_name: v })} />
                <EditField label="ফোন" value={editingOrder.phone}
                  onChange={(v) => setEditingOrder({ ...editingOrder, phone: v })} />
                <EditField label="ঠিকানা" value={editingOrder.address}
                  onChange={(v) => setEditingOrder({ ...editingOrder, address: v })} textarea />
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">ডেলিভারি এরিয়া</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["inside_dhaka", "outside_dhaka"] as const).map((area) => (
                      <button key={area}
                        onClick={() => setEditingOrder({ ...editingOrder, delivery_area: area })}
                        className={`py-2 rounded-xl text-sm border transition-all ${
                          editingOrder.delivery_area === area
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground"
                        }`}>
                        {area === "inside_dhaka" ? "ঢাকার ভিতরে" : "ঢাকার বাইরে"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">পরিমাণ</label>
                  <input type="number" min={1} value={editingOrder.quantity}
                    onChange={(e) => setEditingOrder({ ...editingOrder, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <EditField label="নোট (ঐচ্ছিক)" value={editingOrder.notes || ""}
                  onChange={(v) => setEditingOrder({ ...editingOrder, notes: v || null })} textarea />
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setEditingOrder(null)}
                    className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground text-sm font-medium hover:bg-muted transition-colors">
                    বাতিল
                  </button>
                  <button onClick={handleEditSave}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                    সেভ করুন
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Order Confirm Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setDeleteConfirm(null)}>
            <motion.div className="bg-card rounded-2xl border border-border p-6 w-full max-w-sm text-center"
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}>
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">অর্ডার ডিলিট করবেন?</h3>
              <p className="text-muted-foreground text-sm mb-6">এই অর্ডারটি স্থায়ীভাবে মুছে যাবে।</p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground text-sm font-medium hover:bg-muted transition-colors">
                  না
                </button>
                <button onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                  হ্যাঁ, ডিলিট করুন
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Product Modal */}
      <AnimatePresence>
        {showAddProduct && (
          <motion.div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowAddProduct(false)}>
            <motion.div className="bg-card rounded-2xl border border-border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">নতুন প্রোডাক্ট যোগ</h2>
                <button onClick={() => setShowAddProduct(false)} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <EditField label="প্রোডাক্টের নাম *" value={newProduct.name}
                  onChange={(v) => setNewProduct({ ...newProduct, name: v })} />
                <EditField label="বর্ণনা" value={newProduct.description}
                  onChange={(v) => setNewProduct({ ...newProduct, description: v })} textarea />
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">মূল্য (৳) *</label>
                  <input type="number" min={0} value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">প্রোডাক্টের ছবি</label>
                  {imagePreview || newProduct.image_url ? (
                    <div className="relative rounded-xl overflow-hidden bg-muted mb-2">
                      <img src={imagePreview || newProduct.image_url} alt="Preview" className="w-full h-40 object-cover" />
                      <button onClick={() => { setImagePreview(null); setNewProduct({ ...newProduct, image_url: "" }); }}
                        className="absolute top-2 right-2 p-1 rounded-full bg-foreground/60 text-background hover:bg-foreground/80">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : null}
                  <label className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border text-sm cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all ${uploadingImage ? "opacity-50 pointer-events-none" : ""}`}>
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
                    {uploadingImage ? (
                      <><RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />আপলোড হচ্ছে...</>
                    ) : (
                      <><Upload className="w-4 h-4 text-muted-foreground" /><span className="text-muted-foreground">ছবি আপলোড করুন</span></>
                    )}
                  </label>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">স্টক</label>
                  <input type="number" min={0} value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setNewProduct({ ...newProduct, is_active: !newProduct.is_active })}
                    className={`w-10 h-6 rounded-full transition-colors ${newProduct.is_active ? "bg-primary" : "bg-muted"}`}>
                    <div className={`w-4 h-4 rounded-full bg-card shadow transition-transform mx-1 ${newProduct.is_active ? "translate-x-4" : ""}`} />
                  </button>
                  <span className="text-sm text-foreground">{newProduct.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setShowAddProduct(false)}
                    className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground text-sm font-medium hover:bg-muted transition-colors">
                    বাতিল
                  </button>
                  <button onClick={handleAddProduct}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                    যোগ করুন
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedProduct(null)}>
            <motion.div className="bg-card rounded-2xl border border-border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">প্রোডাক্ট বিস্তারিত</h2>
                <button onClick={() => setSelectedProduct(null)} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
              </div>
              {selectedProduct.image_url && (
                <div className="aspect-video rounded-xl overflow-hidden mb-4 bg-muted">
                  <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <DetailField label="নাম" value={selectedProduct.name} bold />
                  <DetailField label="মূল্য" value={`৳${selectedProduct.price}`} bold />
                  <DetailField label="স্টক" value={`${selectedProduct.stock} পিস`} />
                  <DetailField label="স্ট্যাটাস" value={selectedProduct.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"} />
                </div>
                {selectedProduct.description && <DetailField label="বর্ণনা" value={selectedProduct.description} />}
                <div className="text-xs text-muted-foreground">
                  যোগ করা হয়েছে: {new Date(selectedProduct.created_at).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" })}
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => { handleToggleActive(selectedProduct); setSelectedProduct(null); }}
                    className="flex-1 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors">
                    {selectedProduct.is_active ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"}
                  </button>
                  <button onClick={() => { setDeleteProductConfirm(selectedProduct.id); }}
                    className="flex-1 py-2 rounded-xl bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors">
                    <Trash2 className="w-4 h-4 inline mr-1" />ডিলিট
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Product Confirm Modal */}
      <AnimatePresence>
        {deleteProductConfirm && (
          <motion.div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setDeleteProductConfirm(null)}>
            <motion.div className="bg-card rounded-2xl border border-border p-6 w-full max-w-sm text-center"
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}>
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">প্রোডাক্ট ডিলিট করবেন?</h3>
              <p className="text-muted-foreground text-sm mb-6">এই প্রোডাক্টটি স্থায়ীভাবে মুছে যাবে।</p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteProductConfirm(null)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground text-sm font-medium hover:bg-muted transition-colors">
                  না
                </button>
                <button onClick={() => handleDeleteProduct(deleteProductConfirm)}
                  className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                  হ্যাঁ, ডিলিট করুন
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Product Modal */}
      <AnimatePresence>
        {editingProduct && (
          <motion.div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => { setEditingProduct(null); setEditProductImage(null); setEditProductImagePreview(null); }}>
            <motion.div className="bg-card rounded-2xl border border-border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">প্রোডাক্ট এডিট</h2>
                <button onClick={() => { setEditingProduct(null); setEditProductImage(null); setEditProductImagePreview(null); }} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <EditField label="প্রোডাক্টের নাম *" value={editingProduct.name}
                  onChange={(v) => setEditingProduct({ ...editingProduct, name: v })} />
                <EditField label="বর্ণনা" value={editingProduct.description || ""}
                  onChange={(v) => setEditingProduct({ ...editingProduct, description: v || null })} textarea />
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">মূল্য (৳) *</label>
                  <input type="number" min={0} value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">প্রোডাক্টের ছবি</label>
                  {(editProductImagePreview || editingProduct.image_url) && (
                    <div className="relative rounded-xl overflow-hidden bg-muted mb-2">
                      <img src={editProductImagePreview || editingProduct.image_url || ""} alt="Preview" className="w-full h-40 object-cover" />
                      <button onClick={() => { setEditProductImagePreview(null); setEditProductImage(null); setEditingProduct({ ...editingProduct, image_url: null }); }}
                        className="absolute top-2 right-2 p-1 rounded-full bg-foreground/60 text-background hover:bg-foreground/80">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <label className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border text-sm cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all ${uploadingImage ? "opacity-50 pointer-events-none" : ""}`}>
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          setEditProductImage(f);
                          setEditProductImagePreview(URL.createObjectURL(f));
                        }
                      }} />
                    <Upload className="w-4 h-4 text-muted-foreground" /><span className="text-muted-foreground">নতুন ছবি আপলোড করুন</span>
                  </label>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">স্টক</label>
                  <input type="number" min={0} value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditingProduct({ ...editingProduct, is_active: !editingProduct.is_active })}
                    className={`w-10 h-6 rounded-full transition-colors ${editingProduct.is_active ? "bg-primary" : "bg-muted"}`}>
                    <div className={`w-4 h-4 rounded-full bg-card shadow transition-transform mx-1 ${editingProduct.is_active ? "translate-x-4" : ""}`} />
                  </button>
                  <span className="text-sm text-foreground">{editingProduct.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => { setEditingProduct(null); setEditProductImage(null); setEditProductImagePreview(null); }}
                    className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground text-sm font-medium hover:bg-muted transition-colors">
                    বাতিল
                  </button>
                  <button onClick={handleEditProductSave}
                    disabled={uploadingImage}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                    {uploadingImage ? "আপলোড হচ্ছে..." : "সেভ করুন"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DetailField = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <div>
    <span className="text-xs text-muted-foreground block">{label}</span>
    <span className={`text-sm text-foreground ${bold ? "font-bold" : ""}`}>{value}</span>
  </div>
);

const EditField = ({ label, value, onChange, textarea }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean }) => (
  <div>
    <label className="text-xs text-muted-foreground block mb-1">{label}</label>
    {textarea ? (
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2}
        className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
    ) : (
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
    )}
  </div>
);

export default AdminDashboard;
