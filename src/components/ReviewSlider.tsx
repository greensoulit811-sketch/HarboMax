import { ShoppingCart } from "lucide-react";
import reportImg from "@/assets/lab-report.png";

const ReviewSlider = () => {
  return (
    <section className="py-16 bg-gray-50 flex flex-col items-center">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Top Info Banner */}
        <div className="bg-[#0c4a08] p-6 rounded-xl text-center mb-10 shadow-lg border-2 border-white/20">
          <p className="text-white text-sm md:text-lg font-bold leading-relaxed">
            ১৮ থেকে ৬৫ বছর বয়সী যে কেউ নিরাপদে সেবন করতে পারবেন। যাদের ইন্সট্যান্ট টাইমিং দরকার তারাও খেতে পারবেন এবং যাদের দীর্ঘদিনের প্রব্লেম আছে তারাও স্থায়ী সমাধানের জন্য খাবেন। প্রথম দিন থেকেই কার্যকারিতা বুঝতে পারবেন। প্রতিবার ইন্টারকোর্স টাইম মিনিমাম ৪০ থেকে ৪৫ মিনিট।
          </p>
        </div>

        {/* Lab Report Image */}
        <div className="flex justify-center mb-10">
          <div className="bg-white p-2 md:p-4 rounded-lg shadow-2xl border border-gray-200">
            <img 
              src={reportImg} 
              alt="Laboratory Analysis Report" 
              className="w-full h-auto max-w-2xl rounded shadow-inner"
            />
          </div>
        </div>

        {/* Order Button */}
        <div className="flex justify-center">
          <a 
            href="#order" 
            className="flex items-center gap-2 bg-[#0c4a08] hover:bg-[#083506] text-white font-bold py-4 px-10 rounded-full text-xl transition-all transform hover:scale-105 shadow-[0_4px_15px_rgba(0,0,0,0.2)] border-2 border-white/20"
          >
            <ShoppingCart className="w-6 h-6" />
            অর্ডার করতে চাই
          </a>
        </div>
      </div>
    </section>
  );
};

export default ReviewSlider;
