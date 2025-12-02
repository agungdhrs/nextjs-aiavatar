'use server'

import { revalidatePath } from 'next/cache';

export async function submitJadwal(formData: FormData) {
  // Support single or multiple rows: FormData can have repeated keys
  const temas = formData.getAll('tema').map(String);
  const tanggals = formData.getAll('tanggal').map(String);
  const jams = formData.getAll('jam').map(String);

  if (temas.length === 0 || tanggals.length === 0 || jams.length === 0) {
    return { success: false, message: 'Semua field harus diisi' };
  }

  // Basic length check
  if (!(temas.length === tanggals.length && temas.length === jams.length)) {
    return { success: false, message: 'Jumlah tema/tanggal/jam tidak konsisten' };
  }

  // Build batch payload and send as a single request to n8n
  const items = temas.map((t, i) => ({ 'Tema Postingan': t, 'Tanggal Posting': tanggals[i], 'Jam': jams[i] }));

  // Send items one-by-one (more robust) and collect results for each
  const results: Array<{ index: number; ok: boolean; status?: number; statusText?: string; body?: any; attempts?: number; error?: any }> = [];
  const maxRetries = 3;
  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  for (let i = 0; i < items.length; i++) {
    const single = items[i];
    let attempt = 0;
    let ok = false;
    let lastResult: any = null;

    while (attempt < maxRetries && !ok) {
      attempt += 1;
      try {
        console.log(`📤 [${i + 1}/${items.length}] Mengirim payload ke n8n (attempt ${attempt}):`, single);
        const response = await fetch(process.env.N8N_WEBHOOK_URL!, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.N8N_API_KEY!,
          },
          body: JSON.stringify(single),
        });

        const text = await response.text().catch(() => '');
        let body: any = text;
        try { body = text ? JSON.parse(text) : text; } catch {}

        console.log(`✅ [${i + 1}/${items.length}] n8n POST response (attempt ${attempt}):`, response.status, response.statusText, body);

        if (!response.ok) {
          lastResult = { status: response.status, statusText: response.statusText, body };
          if (attempt < maxRetries) await delay(250 * Math.pow(2, attempt));
        } else {
          ok = true;
          results.push({ index: i, ok: true, status: response.status, statusText: response.statusText, body, attempts: attempt });
        }
      } catch (e) {
        lastResult = e instanceof Error ? e.message : String(e);
        console.error(`❌ [${i + 1}/${items.length}] Fetch error on attempt ${attempt}:`, lastResult);
        if (attempt < maxRetries) await delay(250 * Math.pow(2, attempt));
      }
    }

    if (!ok) {
      results.push({ index: i, ok: false, attempts: maxRetries, error: lastResult });
    }
  }

  revalidatePath('/');

  const failed = results.filter(r => !r.ok);
  if (failed.length > 0) {
    return { success: false, message: `${failed.length} dari ${results.length} pengiriman gagal`, results };
  }

  return { success: true, message: `${results.length} jadwal berhasil disimpan!`, results };
}

export async function getJadwalList() {
  try {
    // Cek URL yang dipanggil
    console.log("🚀 Mencoba fetch ke:", process.env.N8N_WEBHOOK_GET_URL);
    
    const response = await fetch(process.env.N8N_WEBHOOK_GET_URL!, {
      method: 'GET',
      headers: {
        'x-api-key': process.env.N8N_API_KEY!,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      // Try to read the response body (could be JSON or plain text) for better debugging
      let bodyText: string;
      try {
        bodyText = await response.text();
      } catch (e) {
        bodyText = String(e);
      }

      console.error("❌ Gagal Fetch! Status:", response.status, response.statusText, "- body:", bodyText);
      return [];
    }

    let data: any = [];
    try {
      data = await response.json();
    } catch (e) {
      // If parsing fails, log the raw text so debugging is easier
      try {
        const raw = await response.text();
        console.warn("⚠️ Response JSON parse failed, raw body:", raw);
      } catch (_) {
        console.warn("⚠️ Response JSON parse failed and raw body could not be read");
      }
      return [];
    }
    console.log("✅ Data berhasil diambil:", data.length, "items");
    return data;

  } catch (error) {
    console.error("❌ Error Fatal saat ambil data:", error);
    return [];
  }
}