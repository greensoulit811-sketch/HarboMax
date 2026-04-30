import { Phone } from "lucide-react";

const UsageSection = () => {
  return (
    <section className="py-16 bg-white flex flex-col items-center">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        {/* Title */}
        <h2 className="text-red-600 text-2xl md:text-4xl font-extrabold mb-2">
          (জিনসেং প্লাস- ৬০ পিচ ক্যাপসুল)
        </h2>
        <h3 className="text-[#0c4a08] text-xl md:text-2xl font-bold mb-8">
          খাওয়ার নিয়ম
        </h3>

        {/* Usage Instructions Banner */}
        <div className="bg-[#0c4a08] p-6 rounded-xl text-center mb-6 shadow-lg border-2 border-white/20">
          <p className="text-white text-sm md:text-lg font-bold leading-relaxed">
            একবার সেবনে মিনিমাম ১২০ ঘণ্টা বা ৫ দিন পর্যন্ত কার্যকারিতা বজায় থাকবে। ভেষজ উপাদান দিয়ে তৈরি, কোনো পার্শ্বপ্রতিক্রিয়া নাই। এটা শুধু কাজের সময়েই কার্যকারিতা প্রকাশ পাবে, অন্য সময় প্রব্লেম করবেনা। রাতের খাবার পরে একটি ট্যাবলেট নরমাল পানি দিয়ে খাবেন।
          </p>
        </div>

        {/* Call Banner */}
        <div className="bg-red-600 p-4 rounded-xl text-center mb-4 shadow-lg">
          <p className="text-white text-lg md:text-xl font-bold">
            যেকোন প্রয়োজনে কল করতে পারেন
          </p>
        </div>

        {/* Phone Number */}
        <div className="mb-8">
          <a 
            href="tel:01774507573" 
            className="inline-flex items-center gap-2 bg-[#0c4a08] text-white font-bold py-3 px-10 rounded-full text-xl md:text-2xl shadow-md"
          >
            <Phone className="w-6 h-6 fill-white" />
            01774507573
          </a>
        </div>

        {/* Warning/Guarantee Banner */}
        <div className="bg-[#00c97b] p-6 rounded-xl text-center mb-12 shadow-lg border-2 border-white/20">
          <p className="text-white text-sm md:text-lg font-bold leading-relaxed">
            অন্য কোথাও দাম কম দেখে নকল প্রোডাক্ট কিনে প্রতারিত না হয়ে (একমাত্র অনুমোদিত প্রতিষ্ঠান) আমাদের অরিজিনাল জিনসেং-প্লাস অর্ডার করুন ! স্থায়ী ভাবে সুস্থ হওয়ার জন্য এই ৬০পিচ ক্যাপসুলই যথেষ্ট ইনশাআল্লাহ!
          </p>
        </div>

        {/* Pricing Section */}
        <div className="bg-[#1a1a1a] p-8 rounded-2xl text-center shadow-2xl border-b-8 border-[#0c4a08]">
          <p className="text-white text-lg md:text-2xl font-bold mb-4">
            জিনসেং প্লাস পূর্বের মূল্য: <span className="text-red-500 line-through">২২৯৯/-</span> টাকা
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-2">
            <span className="text-white text-3xl md:text-6xl font-black">অফার মূল্য-</span>
            <div className="relative inline-block px-8 py-2">
              <span className="text-[#fff200] text-4xl md:text-7xl font-black relative z-10">
                ৯৯০/-
              </span>
              <div className="absolute inset-0 border-4 border-[#4ade80] rounded-[50%] scale-110 -rotate-3 z-0"></div>
            </div>
            <span className="text-white text-3xl md:text-6xl font-black">টাকা</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UsageSection;
