import { CheckCircle2, ShoppingCart } from "lucide-react";

const featureList = [
  "টিস্যুগুলো নতুন করে শক্তি সঞ্চয় করবে",
  "ড্রাইভ ৩০ থেকে ৪০ মিনিট",
  "টানা ৩-৪ বার করতে পারবেন",
  "অভ্যন্তরীণ ভাইটালিটি ও দৈনন্দিন ফ্রেশ-ফিল বাড়াতে সাহায্য করবে",
  "শরীরের স্বাভাবিক শক্তি পুনরায় ভারসাম্যে আনতে সাপোর্ট দেয়",
  "ব্যক্তিগত সময়ের কনফিডেন্স ও endurance ধরে রাখতে সাহায্য করে",
  "আগের তুলনায় overall well-being & vitality better feel করতে সাহায্য করে",
];

const FeaturesSection = () => {
  const headerText = "প্রথম দিন থেকেই আপনাকে দিবে এনার্জি বৃদ্ধি, অ্যাক্টিভনেস ও ব্যক্তিগত কনফিডেন্স উন্নতি - দৈনন্দিন অস্বস্তি কমাতে ও ভেতরের ভাইটালিটি সাপোর্ট";

  return (
    <section className="py-16 bg-white flex flex-col items-center gap-10">
      <div className="container mx-auto px-4 flex justify-center">
        {/* Main Boxed Features */}
        <div className="w-full max-w-2xl border-[3px] border-[#0c4a08] rounded-xl overflow-hidden shadow-xl bg-white">
          {/* Box Header */}
          <div className="bg-[#0c4a08] p-4 text-center">
            <h2 className="text-white text-sm md:text-lg font-bold leading-relaxed">
              {headerText}
            </h2>
          </div>

          {/* List Items */}
          <div className="flex flex-col">
            {featureList.map((item, index) => (
              <div 
                key={index} 
                className={`flex items-start gap-3 p-3 px-4 ${
                  index !== featureList.length - 1 ? "border-b border-gray-200" : ""
                }`}
              >
                <CheckCircle2 className="w-5 h-5 text-[#0c4a08] flex-shrink-0 mt-0.5" />
                <span className="text-[#0c4a08] font-bold text-sm md:text-base leading-snug">
                  {item}
                </span>
              </div>
            ))}
          </div>

          {/* Box Footer / Button */}
          <div className="flex justify-center py-6 bg-gray-50/50">
            <a 
              href="#order" 
              className="flex items-center gap-2 bg-[#0c4a08] hover:bg-[#083506] text-white font-bold py-3 px-8 rounded-full text-lg transition-transform hover:scale-105 shadow-md border-2 border-white/20"
            >
              <ShoppingCart className="w-5 h-5" />
              অর্ডার করতে চাই
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Banner */}
      <div className="w-full max-w-4xl px-4">
        <div className="bg-[#0c4a08] p-4 rounded-lg text-center shadow-lg border-2 border-white/20">
          <p className="text-white text-sm md:text-lg font-bold leading-relaxed">
            {headerText}
          </p>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
