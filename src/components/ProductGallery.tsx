import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];

const ProductGallery = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      setProducts(data || []);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="aspect-square rounded-2xl bg-muted animate-pulse" />
    );
  }

  if (products.length === 0) {
    return (
      <div className="aspect-square rounded-2xl border border-border bg-card flex items-center justify-center">
        <ShoppingBag className="w-16 h-16 text-muted-foreground/20" />
      </div>
    );
  }

  const current = products[selected];

  return (
    <div className="space-y-4">
      <motion.div
        className="rounded-2xl overflow-hidden border border-border bg-card aspect-square"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        key={selected}
      >
        {current.image_url ? (
          <img
            src={current.image_url}
            alt={current.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-20 h-20 text-muted-foreground/20" />
          </div>
        )}
      </motion.div>
      {products.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {products.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setSelected(i)}
              className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                selected === i ? "border-primary shadow-playful scale-105" : "border-border opacity-70 hover:opacity-100"
              }`}
            >
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <ShoppingBag className="w-5 h-5 text-muted-foreground/30" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
