import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ShoppingBag, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .eq("is_active", true)
        .single();
      setProduct(data);
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        লোড হচ্ছে...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Package className="w-16 h-16 text-muted-foreground/30" />
        <p className="text-muted-foreground text-lg">প্রোডাক্ট পাওয়া যায়নি</p>
        <Link to="/" className="text-primary hover:underline text-sm">← হোমে ফিরুন</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 max-w-5xl">
          <Link to="/#products" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />সব প্রোডাক্ট
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          {/* Image */}
          <motion.div
            className="aspect-square rounded-2xl overflow-hidden bg-muted border border-border"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingBag className="w-20 h-20 text-muted-foreground/20" />
              </div>
            )}
          </motion.div>

          {/* Info */}
          <motion.div
            className="flex flex-col justify-center"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{product.name}</h1>

            {product.description && (
              <p className="text-muted-foreground mb-6 leading-relaxed">{product.description}</p>
            )}

            <div className="flex items-center gap-4 mb-6">
              <span className="text-4xl font-bold text-foreground">৳{product.price}</span>
              {product.stock > 0 ? (
                <span className="text-sm text-primary bg-primary/10 px-3 py-1 rounded-full">স্টকে আছে ({product.stock} পিস)</span>
              ) : (
                <span className="text-sm text-destructive bg-destructive/10 px-3 py-1 rounded-full">স্টক আউট</span>
              )}
            </div>

            <Link
              to="/#order"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 px-8 rounded-2xl text-lg font-bold hover:opacity-90 transition-opacity w-full md:w-auto"
            >
              🛒 অর্ডার করুন
            </Link>

            <div className="mt-8 text-xs text-muted-foreground">
              যোগ করা হয়েছে: {new Date(product.created_at).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
