import { Shell } from "@/components/Shell";
import { useI18n } from "@/hooks/use-i18n";
import { Heart, Users, Leaf, HandHeart } from "lucide-react";
import { DonationForm } from "@/components/DonationForm";

import { usePageTitle } from "@/hooks/use-page-title";

export default function DonatePage() {
  const { t } = useI18n();
  usePageTitle("Donate");

  const areas = [
    { icon: Users,     title: t.donate.communityDev,   desc: t.donate.communityDevDesc   },
    { icon: HandHeart, title: t.donate.socialWelfare,  desc: t.donate.socialWelfareDesc  },
    { icon: Leaf,      title: t.donate.envProtection,  desc: t.donate.envProtectionDesc  },
    { icon: Heart,     title: t.donate.youthEmp,       desc: t.donate.youthEmpDesc       },
  ];

  return (
    <Shell>
      <div>

        {/* Header */}
        <section className="pt-14 pb-12 px-6 sm:px-12 md:px-20 lg:px-32 border-b border-border animate-fadeUp notranslate">
          <p className="text-sm font-bold text-[hsl(var(--kesari))] mb-4 whitespace-nowrap">{t.nav.donate}</p>
          <h1 className="text-foreground mb-4" style={{ fontSize: "clamp(2.4rem, 6vw, 4.5rem)", fontWeight: 700, lineHeight: 1.06, letterSpacing: "-0.03em" }}>
            {t.donate.title}
          </h1>
          <p className="text-muted-foreground" style={{ fontSize: "clamp(0.95rem, 1.6vw, 1.1rem)", maxWidth: "52ch", lineHeight: 1.7 }}>
            {t.donate.subtitle}
          </p>
        </section>

        {/* Impact areas */}
        <section className="px-6 sm:px-12 md:px-20 lg:px-32 py-14 border-b border-border animate-fadeUp notranslate">
          <div className="w-10 h-[3px] bg-[hsl(var(--kesari))] mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border">
            {areas.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-card p-8 hover:bg-muted/40 transition-colors group">
                <Icon className="h-6 w-6 text-[hsl(var(--kesari))] mb-5" />
                <h3 className="font-bold text-foreground mb-3 group-hover:text-[hsl(var(--kesari))] transition-colors">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How to contribute */}
        <section className="px-6 sm:px-12 md:px-20 lg:px-32 py-14 border-b border-border animate-fadeUp notranslate">
          <div className="w-10 h-[3px] bg-[hsl(var(--kesari))] mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-foreground mb-10" style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 700, letterSpacing: "-0.02em" }}>
                {t.donate.howToContribute}
              </h2>
              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground mb-4">{t.donate.bankTransfer}</h3>
                  <div className="space-y-2 text-sm text-muted-foreground border-l-2 border-[hsl(var(--kesari))] pl-5">
                    <p><span className="font-semibold text-foreground">{t.donate.accountName}</span> {t.donate.orgName}</p>
                    <p><span className="font-semibold text-foreground">{t.donate.accountNumber}</span> {t.donate.contactDetails}</p>
                    <p><span className="font-semibold text-foreground">{t.donate.ifscCode}</span> {t.donate.contactDetails}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground mb-4">{t.donate.contactUs}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-border pl-5">{t.donate.contactDesc}</p>
                </div>
              </div>
            </div>
            <div className="pt-0">
              <DonationForm />
            </div>
          </div>
        </section>

        {/* Thank you */}
        <section className="px-6 sm:px-12 md:px-20 lg:px-32 py-20 bg-foreground animate-fadeUp notranslate">
          <div className="max-w-2xl">
            <p className="text-sm font-bold text-[hsl(var(--kesari))] mb-5 whitespace-nowrap">🙏</p>
            <h3 className="text-white mb-4" style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 700, letterSpacing: "-0.02em" }}>
              {t.donate.thankYou}
            </h3>
            <p className="text-white/60 leading-relaxed" style={{ fontSize: "clamp(0.95rem, 1.6vw, 1.05rem)" }}>
              {t.donate.thankYouDesc}
            </p>
          </div>
        </section>

      </div>
    </Shell>
  );
}
