import { Logo } from "./Header";

export default function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="max-w-5xl mx-auto grid md:grid-cols-2 rounded-3xl overflow-hidden shadow-lift bg-white">
      <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-brand-dark via-brand to-[#7B3AA8] text-white p-10 relative overflow-hidden">
        <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-gold/25 blur-3xl" />
        <Logo light />
        <div className="relative space-y-3">
          <h2 className="font-display text-3xl font-black leading-tight">Shop. Eat.<br /><span className="text-gold-champagne">Discover.</span></h2>
          <p className="text-purple-100">Boutiques du monde entier et restaurants de votre ville, au même endroit.</p>
          <ul className="text-sm space-y-1 text-purple-100"><li>✔ Livraison suivie</li><li>✔ Paiement sécurisé (simulé)</li><li>✔ Vendeurs, restaurants et livreurs</li></ul>
        </div>
        <p className="relative text-xs text-purple-200">Projet académique — données fictives</p>
      </div>
      <div className="p-8 md:p-10 space-y-5">
        <div><h1 className="font-display text-3xl font-black text-brand-dark">{title}</h1><p className="text-gray-500 text-sm mt-1">{subtitle}</p></div>
        {children}
      </div>
    </div>
  );
}
