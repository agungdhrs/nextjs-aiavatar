'use server'

import { revalidatePath } from 'next/cache';

export async function submitJadwal(formData: FormData) {
  const tema = formData.get('tema');
  const tanggal = formData.get('tanggal');
  const jam = formData.get('jam');

  // Simple validation
  if (!tema || !tanggal || !jam) {
    return { success: false, message: 'Semua field harus diisi' };
  }

  const payload = {
    'Tema Postingan': tema,
    'Tanggal Posting': tanggal,
    'Jam': jam,
  };

  try {
    console.log('📤 Mengirim payload ke n8n:', payload);
    const response = await fetch(process.env.N8N_WEBHOOK_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.N8N_API_KEY!,
      },
      body: JSON.stringify(payload),
    });

    const bodyText = await response.text().catch(() => '');
    let body: any = bodyText;
    try { body = bodyText ? JSON.parse(bodyText) : bodyText; } catch {}

    console.log('✅ n8n POST response:', response.status, response.statusText, body);

    if (!response.ok) {
      console.error('❌ n8n Error Detail:', response.status, response.statusText, body);
      return { success: false, message: `Gagal ke n8n: ${response.status} ${response.statusText}` };
    }

    revalidatePath('/');
    return { success: true, message: 'Jadwal berhasil disimpan!' };
  } catch (error) {
    console.error('❌ Catch Error:', error);
    return { success: false, message: error instanceof Error ? error.message : String(error) };
  }
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