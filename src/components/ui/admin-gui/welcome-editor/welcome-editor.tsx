import { useState, useEffect } from "react";
import { supabase, createClerkSupabaseClient } from "@/services";
import { useAuth } from "@clerk/clerk-react";
import { Modal } from "@/components/ui";
import { X } from "lucide-react";

const DEFAULT_PROCESS_EYEBROW = "Så funkar det";

interface ProcessStep {
  title: string;
  text: string;
}

const DEFAULT_PROCESS_STEPS: ProcessStep[] = [
  {
    title: "Hör av er",
    text: "Berätta om datum, plats och vad ni drömmer om. Vi börjar med ett samtal där ni får ställa alla frågor.",
  },
  {
    title: "Vi planerar tillsammans",
    text: "Vi går igenom tider, platser och vilka ögonblick som är viktigast för er. Inga detaljer är för små.",
  },
  {
    title: "Bröllopsdagen",
    text: "Jag fotograferar närvarande och lugnt, med plats för både det stora och det lilla som händer runtomkring.",
  },
  {
    title: "Bilderna",
    text: "Ett genomtänkt urval av redigerade bilder levereras digitalt, redo att sparas och återvända till i många år.",
  },
];

export function WelcomeAdmin({ onClose }: { onClose: () => void }) {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rowId, setRowId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [processEyebrow, setProcessEyebrow] = useState(DEFAULT_PROCESS_EYEBROW);
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>(DEFAULT_PROCESS_STEPS);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: "", message: "" });

  useEffect(() => {
    async function fetchContent() {
      const { data } = await supabase.from("welcome_content").select("*").maybeSingle();
      if (data) {
        setRowId(data.id);
        setTitle(data.title || "");
        setText(data.text || "");
        setProcessEyebrow(data.process_eyebrow || DEFAULT_PROCESS_EYEBROW);

        if (Array.isArray(data.process_steps) && data.process_steps.length > 0) {
          setProcessSteps(
            data.process_steps.map((step: any) => ({
              title: step.title || "",
              text: step.text || "",
            }))
          );
        }
      }
      setLoading(false);
    }
    fetchContent();
  }, []);

  const updateStep = (index: number, field: keyof ProcessStep, value: string) => {
    setProcessSteps((previous) =>
      previous.map((step, stepIndex) =>
        stepIndex === index ? { ...step, [field]: value } : step
      )
    );
  };

  const addStep = () => {
    setProcessSteps((previous) => [...previous, { title: "", text: "" }]);
  };

  const removeStep = (index: number) => {
    setProcessSteps((previous) =>
      previous.length > 1 ? previous.filter((_, stepIndex) => stepIndex !== index) : previous
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = await getToken({ template: "supabase" });
      const adminClient = createClerkSupabaseClient(token!);
      const payload = {
        title,
        text,
        process_eyebrow: processEyebrow,
        process_steps: processSteps,
      };

      if (rowId !== null) {
        const { error } = await adminClient.from("welcome_content").update(payload).eq("id", rowId);
        if (error) throw error;
      } else {
        const { data, error } = await adminClient.from("welcome_content").insert(payload).select("id").single();
        if (error) throw error;
        if (data) setRowId(data.id);
      }

      setModalConfig({ isOpen: true, title: "Uppdaterad", message: "Välkomsttexten och processen har sparats." });
    } catch (err: any) {
      setModalConfig({ isOpen: true, title: "Fel", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="fixed inset-0 bg-white z-[100] flex items-center justify-center text-[10px] uppercase tracking-widest text-stone-400">Hämtar text...</div>;

  return (
    <div className="fixed inset-0 bg-white z-[100] overflow-y-auto animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="flex justify-between items-center mb-16">
          <div>
            <h2 className="text-xl font-light uppercase tracking-[0.3em]">Välkomsttext & process</h2>
            <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-2 font-medium font-bold">Visas på bröllopssajten</p>
          </div>
          <button onClick={onClose} className="inline-flex items-center gap-2 bg-stone-900 px-5 py-3 text-[9px] font-bold uppercase tracking-[0.2em] text-white shadow-md transition-colors hover:bg-stone-700"
          >
            <X size={14} />
            Stäng
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          <div className="space-y-1">
            <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Rubrik</label>
            <input
              className="w-full border-b border-stone-200 py-2 text-lg font-light outline-none focus:border-stone-900 bg-transparent"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Välkomna hit"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Text</label>
            <textarea
              rows={6}
              className="w-full border border-stone-100 p-3 text-sm font-light leading-relaxed outline-none focus:border-stone-900 bg-white resize-y"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Skriv välkomsttexten här..."
            />
          </div>

          <div className="space-y-6 border-t border-stone-100 pt-8">
            <div>
              <h3 className="text-[11px] uppercase tracking-[0.2em] text-stone-900 font-bold border-l-2 border-stone-900 pl-4">Så funkar det</h3>
              <p className="mt-2 text-[10px] text-stone-400 uppercase tracking-widest font-bold">Visas till höger om välkomsttexten</p>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Liten rubrik</label>
              <input
                className="w-full border-b border-stone-200 py-2 text-sm font-light outline-none focus:border-stone-900 bg-transparent"
                value={processEyebrow}
                onChange={e => setProcessEyebrow(e.target.value)}
                placeholder="Så funkar det"
              />
            </div>

            <div className="space-y-4">
              {processSteps.map((step, index) => (
                <div key={index} className="space-y-3 border border-stone-100 bg-stone-50/30 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Steg {index + 1}</span>
                    {processSteps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        className="text-[9px] uppercase tracking-widest text-red-400 transition-colors hover:text-red-600 font-bold"
                      >
                        Ta bort
                      </button>
                    )}
                  </div>

                  <input
                    className="w-full border-b border-stone-200 py-2 text-sm font-light outline-none focus:border-stone-900 bg-transparent"
                    value={step.title}
                    onChange={e => updateStep(index, "title", e.target.value)}
                    placeholder="Rubrik, t.ex. Hör av er"
                  />

                  <textarea
                    rows={3}
                    className="w-full border border-stone-100 bg-white p-3 text-sm font-light leading-relaxed outline-none focus:border-stone-900 resize-y"
                    value={step.text}
                    onChange={e => updateStep(index, "text", e.target.value)}
                    placeholder="Kort beskrivning av steget..."
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={addStep}
                disabled={processSteps.length >= 8}
                className="w-full border border-dashed border-stone-300 px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-stone-500 transition-colors hover:border-stone-900 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                + Lägg till steg
              </button>
            </div>
          </div>

          <button type="submit" disabled={saving} className="w-full bg-stone-900 text-white text-[10px] uppercase tracking-[0.3em] py-6 font-bold hover:bg-stone-800 transition-all shadow-xl disabled:opacity-50">
            {saving ? "Sparar..." : "Spara ändringar"}
          </button>
        </form>
      </div>
      <Modal {...modalConfig} onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} />
    </div>
  );
}
