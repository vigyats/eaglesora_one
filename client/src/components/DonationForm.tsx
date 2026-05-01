import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/hooks/use-i18n";

const CURRENCIES = [
  { code: "INR", symbol: "₹", label: "INR" },
  { code: "USD", symbol: "$", label: "USD" },
  { code: "EUR", symbol: "€", label: "EUR" },
  { code: "GBP", symbol: "£", label: "GBP" },
  { code: "AED", symbol: "د.إ", label: "AED" },
  { code: "SGD", symbol: "S$", label: "SGD" },
  { code: "CAD", symbol: "CA$", label: "CAD" },
  { code: "AUD", symbol: "A$", label: "AUD" },
];

export function DonationForm() {
  const { t } = useI18n();
  const d = t.donate;
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [panCard, setPanCard] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [inrValue, setInrValue] = useState<number | null>(null);
  const [converting, setConverting] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedCurrency = CURRENCIES.find(c => c.code === currency)!;

  // fetch conversion whenever amount or currency changes
  useEffect(() => {
    if (!amount || isNaN(parseFloat(amount))) { setInrValue(null); return; }
    if (currency === "INR") { setInrValue(parseFloat(amount)); return; }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setConverting(true);
      try {
        const res = await fetch(`https://open.er-api.com/v6/latest/${currency}`);
        const data = await res.json();
        const rate = data.rates?.INR;
        if (rate) setInrValue(parseFloat(amount) * rate);
        else setInrValue(null);
      } catch {
        setInrValue(null);
      } finally {
        setConverting(false);
      }
    }, 500);
  }, [amount, currency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!donorName || !donorEmail || !panCard || !amount) {
      toast({ title: d.fillAllFields, variant: "destructive" });
      return;
    }

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(panCard.toUpperCase())) {
      toast({ title: d.invalidPan, variant: "destructive" });
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({ title: d.validAmount, variant: "destructive" });
      return;
    }

    const finalInr = currency === "INR" ? amountNum : inrValue;
    if (!finalInr || finalInr < 500) {
      toast({ title: "Minimum donation is ₹500 (or equivalent)", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donorName, donorEmail, panCard: panCard.toUpperCase(), amount: finalInr }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to process donation");

      toast({
        title: d.successTitle,
        description: `${d.receiptSent} ${donorEmail}. ${d.transactionId}: ${data.transactionId}`,
      });

      setDonorName(""); setDonorEmail(""); setPanCard(""); setAmount(""); setInrValue(null);
    } catch (error: any) {
      toast({ title: error.message || "Failed to process donation", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="donorName" className="text-xs">{d.fullName} <span className="text-destructive">*</span></Label>
        <Input id="donorName" value={donorName} onChange={(e) => setDonorName(e.target.value)}
          placeholder={d.fullNamePlaceholder} disabled={loading} className="h-9 text-sm" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="donorEmail" className="text-xs">{d.emailAddress} <span className="text-destructive">*</span></Label>
        <Input id="donorEmail" type="email" value={donorEmail} onChange={(e) => setDonorEmail(e.target.value)}
          placeholder="your.email@example.com" disabled={loading} className="h-9 text-sm" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="panCard" className="text-xs">{d.panCardLabel} <span className="text-destructive">*</span></Label>
        <Input id="panCard" value={panCard} onChange={(e) => setPanCard(e.target.value.toUpperCase())}
          placeholder={d.panCardPlaceholder} maxLength={10} disabled={loading} className="h-9 text-sm" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="amount" className="text-xs">{d.amountLabel} <span className="text-destructive">*</span></Label>
        <div className="flex gap-2">
          {/* Currency selector */}
          <div className="relative">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              disabled={loading}
              className="h-9 pl-3 pr-7 text-sm border border-input bg-background rounded-md appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">▾</span>
          </div>
          {/* Amount input with currency symbol prefix */}
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none">
              {selectedCurrency.symbol}
            </span>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min="0"
              step="any"
              disabled={loading}
              className="h-9 text-sm pl-8"
            />
          </div>
        </div>
        {/* Live INR conversion */}
        {amount && parseFloat(amount) > 0 && currency !== "INR" && (
          <p className="text-xs text-muted-foreground mt-1">
            {converting ? "Converting…" : inrValue
              ? <>≈ <span className={`font-semibold ${inrValue < 500 ? "text-destructive" : "text-foreground"}`}>₹{inrValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>{inrValue < 500 ? " — minimum ₹500 required" : " INR"}</>
              : "Could not fetch rate"
            }
          </p>
        )}
        {amount && parseFloat(amount) > 0 && currency === "INR" && parseFloat(amount) < 500 && (
          <p className="text-xs text-destructive mt-1">Minimum donation is ₹500</p>
        )}
      </div>
      <Button type="submit" variant="outline" className="w-full h-9 text-sm" disabled={loading}>
        {loading ? d.processing : d.payNow}
      </Button>
    </form>
  );
}
