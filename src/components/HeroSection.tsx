import { ShoppingCart, Truck, Award } from "lucide-react";
import productImg from "@/assets/jinseng-plus.png";

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-start overflow-hidden bg-gradient-to-b from-[#1c8d14] via-[#6ac444] to-[#b8f28d] pt-12">
      {/* Top Text Content */}
      <div className="container mx-auto px-4 z-10 text-center mb-12">
        <h1 className="text-white text-2xl md:text-5xl font-extrabold leading-[1.2] max-w-5xl mx-auto drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]">
          পাতলা, মাত্র ২-১ মিনিটেই বের হয়ে যায় ? বড় হতে চায়না ? <br />
          <span className="text-yellow-300">অনেক ঔষধ খেয়েও উপকার হয়নি?</span> <br />
          তাদের জন্যই এই সলিউশন
        </h1>
      </div>

      {/* Product Image and Badges Container */}
      <div className="relative z-10 flex flex-col items-center mb-12 w-full max-w-lg px-4">
        <div className="relative">
          {/* Main Product Image */}
          <div className="relative z-0 p-2 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-gradient-to-tr from-white/20 to-transparent">
            <img 
              src={productImg} 
              alt="Jinseng Plus" 
              className="w-full h-auto max-w-[340px] rounded-[32px] border-4 border-white/30"
            />
          </div>

          {/* Top Left Badge */}
          <div className="absolute -top-6 -left-6 md:-left-12 bg-[#fff200] text-[#0c4a08] font-black px-6 py-3 rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.2)] rotate-[-6deg] text-base md:text-lg border-2 border-white flex flex-col items-center justify-center leading-tight">
            <span>একবার খাবেন</span>
            <span className="text-xl md:text-2xl">৫ দিন কাজ করবে</span>
          </div>

          {/* Bottom Right Badge */}
          <div className="absolute -bottom-6 -right-6 md:-right-12 bg-white text-[#0c4a08] font-black px-6 py-3 rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.2)] rotate-[6deg] text-sm md:text-base border-2 border-[#1c8d14] flex flex-col items-center justify-center leading-tight">
            <span>প্রতিবার ২ থেকে ৩ বার</span>
            <span className="text-base md:text-lg">প্রতিবার ৩০-৪০ মিনিট</span>
          </div>
        </div>
      </div>

      {/* Order Button */}
      <div className="z-10 mb-8 w-full flex justify-center">
        <a 
          href="#order" 
          className="flex items-center gap-2 bg-[#105e0a] hover:bg-[#0c4a08] text-white font-bold py-4 px-10 rounded-full text-xl md:text-2xl transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(0,0,0,0.3)] border-2 border-white/30"
        >
          <ShoppingCart className="w-6 h-6" />
          অর্ডার করতে চাই
        </a>
      </div>

      {/* Bottom Wave Decor */}
      <div className="absolute bottom-[100px] left-0 w-full leading-[0] overflow-hidden pointer-events-none">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[60px] md:h-[100px] fill-white/30">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C51.29,101.4,115,95.14,166,85.16,211.39,76,260,67.74,321.39,56.44Z"></path>
        </svg>
      </div>

      {/* Footer Info Text - Positioned at the very bottom */}
      <div className="mt-auto w-full bg-white/20 backdrop-blur-md py-6 z-10">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <p className="text-[#0c4a08] text-xs md:text-sm font-semibold leading-relaxed">
            <span className="inline-flex items-center gap-1 text-pink-600 font-bold">
              📢 আপনার বিশ্বস্ত পণ্য:
            </span>{" "}
            বাংলাদেশের ঔষধ প্রশাসন কর্তৃক অনুমোদিত সার্টিফাইড প্রোডাক্ট! আমরা আপনাদের সুবিধার্থে বাংলাদেশের যেকোনো জায়গায় নিরাপদে সিকিউরভাবে হোম ডেলিভারি সেবা প্রদান করে থাকি। 🚚
          </p>
        </div>
      </div>
      
      {/* Decorative Overlays */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/4 left-10 w-24 h-24 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-10 w-32 h-32 bg-yellow-300/10 rounded-full blur-3xl"></div>
      </div>
    </section>
  );
};

export default HeroSection;
