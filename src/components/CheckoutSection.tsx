import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Phone, Minus, Plus, MapPin, User, Truck, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { trackFBEvent, sendServerEvent } from "@/hooks/useFacebookPixel";
import type { Database } from "@/integrations/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];

const CheckoutSection = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryArea, setDeliveryArea] = useState<"inside" | "outside">("outside");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .gt("stock", 0)
        .order("created_at", { ascending: false });
      const list = data || [];
      setProducts(list);
      if (list.length > 0) setSelectedProduct(list[0]);
      setLoadingProducts(false);
    };
    fetchProducts();
  }, []);

  const unitPrice = selectedProduct?.price || 0;
  const deliveryCharge = deliveryArea === "inside" ? 60 : 120;
  const subtotal = unitPrice * quantity;
  const total = subtotal + deliveryCharge;

  const handleOrder = async () => {
    if (!name || !phone || !address) {
      toast({ title: "সকল তথ্য পূরণ করুন", variant: "destructive" });
      return;
    }
    if (!selectedProduct) {
      toast({ title: "একটি প্রোডাক্ট সিলেক্ট করুন", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("orders").insert({
      customer_name: name,
      phone,
      address,
      delivery_area: deliveryArea === "inside" ? "inside_dhaka" : "outside_dhaka",
      quantity,
      unit_price: unitPrice,
      delivery_charge: deliveryCharge,
      total,
      notes: `প্রোডাক্ট: ${selectedProduct.name}`,
    });

    if (error) {
      console.error(error);
      toast({ title: "অর্ডার সেভ হয়নি, আবার চেষ্টা করুন", variant: "destructive" });
      setSubmitting(false);
      return;
    }

    // Track Purchase event — browser pixel
    trackFBEvent("Purchase", {
      value: total,
      currency: "BDT",
      content_name: selectedProduct.name,
    });

    // Track Purchase event — server CAPI
    sendServerEvent({
      event_name: "Purchase",
      customer_name: name,
      phone,
      value: total,
      currency: "BDT",
      content_name: selectedProduct.name,
    });

    setOrderPlaced(true);
    setSubmitting(false);
    toast({ title: "✅ অর্ডার সফলভাবে সম্পন্ন হয়েছে!" });
  };

  const benefits = [
    "ক্যাশ অন ডেলিভারি",
    "প্রডাক্ট দেখে নেওয়ার সুযোগ",
    "১০০% অরিজিনাল প্রডাক্ট",
  ];

  if (orderPlaced) {
    return (
      <div className="bg-card rounded-3xl border border-border p-8 shadow-lg text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold text-foreground mb-2">অর্ডার সফল হয়েছে!</h3>
        <p className="text-muted-foreground mb-6">আমরা শীঘ্রই আপনার সাথে যোগাযোগ করবো। ধন্যবাদ!</p>
        <button
          onClick={() => { setOrderPlaced(false); setName(""); setPhone(""); setAddress(""); setQuantity(1); }}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold"
        >
          আরেকটি অর্ডার করুন
        </button>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-3xl border border-border p-6 md:p-8 shadow-lg">
      <h3 className="text-2xl font-bold text-foreground mb-2">অর্ডার করুন 🎈</h3>
      <p className="text-muted-foreground text-sm mb-6">ক্যাশ অন ডেলিভারি — পণ্য হাতে পেয়ে টাকা দিন</p>

      {/* Product Selector */}
      {loadingProducts ? (
        <div className="text-sm text-muted-foreground mb-6">প্রোডাক্ট লোড হচ্ছে...</div>
      ) : products.length === 0 ? (
        <div className="text-sm text-muted-foreground mb-6 bg-muted/50 rounded-xl p-4 text-center">
          <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
          কোনো প্রোডাক্ট নেই
        </div>
      ) : (
        <div className="mb-6">
          <label className="text-sm font-medium text-foreground mb-2 block">প্রোডাক্ট সিলেক্ট করুন</label>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => { setSelectedProduct(product); setQuantity(1); }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                  selectedProduct?.id === product.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground text-sm truncate">{product.name}</div>
                  <div className="text-xs text-muted-foreground">স্টক: {product.stock} পিস</div>
                </div>
                <div className="font-bold text-foreground text-sm whitespace-nowrap">৳{product.price}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price */}
      {selectedProduct && (
        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl font-bold text-foreground">৳{unitPrice}</span>
        </div>
      )}

      {/* Quantity */}
      <div className="mb-5">
        <label className="text-sm font-medium text-foreground mb-2 block">পরিমাণ</label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-10 h-10 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-xl font-bold w-10 text-center">{quantity}</span>
          <button
            onClick={() => setQuantity(Math.min(selectedProduct?.stock || 99, quantity + 1))}
            className="w-10 h-10 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" /> আপনার নাম
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="আপনার পুরো নাম লিখুন"
            className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
            <Phone className="w-4 h-4 text-muted-foreground" /> মোবাইল নম্বর
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="০১XXXXXXXXX"
            className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" /> ডেলিভারি ঠিকানা
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="বিস্তারিত ঠিকানা লিখুন"
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {/* Delivery area */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
            <Truck className="w-4 h-4 text-muted-foreground" /> ডেলিভারি এরিয়া
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setDeliveryArea("inside")}
              className={`py-3 rounded-xl text-sm font-medium border transition-all ${
                deliveryArea === "inside"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              ঢাকার ভিতরে — ৳৬০
            </button>
            <button
              onClick={() => setDeliveryArea("outside")}
              className={`py-3 rounded-xl text-sm font-medium border transition-all ${
                deliveryArea === "outside"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              ঢাকার বাইরে — ৳১২০
            </button>
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="bg-muted/50 rounded-xl p-4 mb-6 space-y-2 text-sm">
        {selectedProduct && (
          <div className="flex justify-between text-muted-foreground">
            <span className="truncate mr-2">{selectedProduct.name}</span>
            <span>৳{unitPrice}</span>
          </div>
        )}
        <div className="flex justify-between text-muted-foreground">
          <span>মূল্য ({quantity} পিস)</span>
          <span>৳{subtotal}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>ডেলিভারি চার্জ</span>
          <span>৳{deliveryCharge}</span>
        </div>
        <div className="border-t border-border pt-2 flex justify-between text-foreground font-bold text-lg">
          <span>সর্বমোট</span>
          <span>৳{total}</span>
        </div>
      </div>

      {/* CTA */}
      <motion.button
        onClick={handleOrder}
        disabled={submitting || !selectedProduct}
        className="w-full bg-cta-gradient text-secondary-foreground py-4 rounded-2xl text-lg font-bold shadow-warm disabled:opacity-50"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {submitting ? "⏳ অর্ডার হচ্ছে..." : "🛒 অর্ডার কনফার্ম করুন"}
      </motion.button>

      {/* Benefits */}
      <ul className="mt-6 space-y-2">
        {benefits.map((b, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="w-4 h-4 text-primary flex-shrink-0" />
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CheckoutSection;
