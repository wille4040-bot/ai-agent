// ============================================================
// EDGE-FUNKTION: skicka-bekraftelse (Fas 1)
// Skickar bekräftelsemail till kunden efter en lyckad bokning.
//
// Körs på Supabase servrar. Anropas från bokningssidan med
// { bokning_id: "..." } – funktionen hämtar själv alla uppgifter
// ur databasen, så ingen kan skicka falska mail med egna texter.
//
// Kräver en gratis Resend-nyckel (RESEND_API_KEY). Saknas nyckeln
// hoppar funktionen bara över mailet – bokningen påverkas inte.
// ============================================================

import { createClient } from "npm:@supabase/supabase-js@2";

// Tillåt anrop från webbläsaren (CORS)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function svar(body: object, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { bokning_id } = await req.json();
    if (!bokning_id) return svar({ ok: false, fel: "bokning_id saknas" }, 400);

    // Läser med service-nyckeln (finns automatiskt på servern)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: bokning, error } = await supabase
      .from("bokningar")
      .select(
        "id, kund_namn, kund_epost, starttid, sluttid, status, skapad, tjanster (namn, pris_kr, langd_minuter), foretag (namn, adress, telefon, epost, tidszon)",
      )
      .eq("id", bokning_id)
      .single();

    if (error || !bokning) {
      return svar({ ok: false, fel: "Bokningen hittades inte" }, 404);
    }

    // Skicka bara mail för färska, bekräftade bokningar
    // (stoppar att någon återanvänder gamla boknings-id:n som skräppost)
    const minuterSedanSkapad =
      (Date.now() - new Date(bokning.skapad).getTime()) / 60000;
    if (bokning.status !== "bekraftad" || minuterSedanSkapad > 15) {
      return svar({ ok: false, fel: "Bokningen är för gammal eller avbokad" }, 400);
    }

    const resendNyckel = Deno.env.get("RESEND_API_KEY");
    if (!resendNyckel) {
      // Ingen nyckel inlagd ännu – helt okej i test, bokningen gäller ändå
      return svar({ ok: true, skickat: false, info: "RESEND_API_KEY saknas – inget mail skickat" });
    }

    const foretag = bokning.foretag as {
      namn: string; adress: string | null; telefon: string | null;
      epost: string | null; tidszon: string;
    };
    const tjanst = bokning.tjanster as {
      namn: string; pris_kr: number; langd_minuter: number;
    };

    const tz = foretag.tidszon || "Europe/Stockholm";
    const start = new Date(bokning.starttid);
    const datumText = start.toLocaleDateString("sv-SE", {
      weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: tz,
    });
    const tidText = start.toLocaleTimeString("sv-SE", {
      hour: "2-digit", minute: "2-digit", timeZone: tz,
    });

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1f2937">
        <h2 style="color:#111827">Din bokning är bekräftad!</h2>
        <p>Hej ${bokning.kund_namn},</p>
        <p>Tack för din bokning hos <strong>${foretag.namn}</strong>. Här är dina uppgifter:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px 0;color:#6b7280">Tjänst</td><td style="padding:8px 0;text-align:right"><strong>${tjanst.namn}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Datum</td><td style="padding:8px 0;text-align:right"><strong>${datumText}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Tid</td><td style="padding:8px 0;text-align:right"><strong>kl ${tidText}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Längd</td><td style="padding:8px 0;text-align:right">${tjanst.langd_minuter} min</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Pris</td><td style="padding:8px 0;text-align:right">${Number(tjanst.pris_kr).toLocaleString("sv-SE")} kr</td></tr>
        </table>
        ${foretag.adress ? `<p><strong>Adress:</strong> ${foretag.adress}</p>` : ""}
        ${foretag.telefon ? `<p>Behöver du avboka eller ändra tiden? Ring ${foretag.namn} på <strong>${foretag.telefon}</strong>.</p>` : ""}
        <p style="color:#6b7280;font-size:13px;margin-top:24px">Bokningsnummer: ${bokning.id}</p>
      </div>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendNyckel}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // I test används Resends egen avsändare. Med egen domän byter
        // du till t.ex. "Frisör Lisa <noreply@dindoman.se>".
        from: Deno.env.get("EMAIL_FROM") ?? "Bokning <onboarding@resend.dev>",
        to: [bokning.kund_epost],
        subject: `Bokningsbekräftelse – ${tjanst.namn} hos ${foretag.namn}`,
        html,
      }),
    });

    if (!res.ok) {
      const felText = await res.text();
      console.error("Resend-fel:", felText);
      return svar({ ok: true, skickat: false, info: "Mailet kunde inte skickas" });
    }

    return svar({ ok: true, skickat: true });
  } catch (e) {
    console.error(e);
    return svar({ ok: false, fel: "Oväntat fel" }, 500);
  }
});
