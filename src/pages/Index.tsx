import PriceCalculator from "@/components/PriceCalculator";
import Navigation from "@/components/Navigation";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-accent">
      <Navigation />
      <PriceCalculator />
    </div>
  );
};

export default Index;