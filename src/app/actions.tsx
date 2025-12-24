'use server'

import { revalidatePath } from 'next/cache';

export interface Jadwal {
  'Tema Postingan': string;
  'Tanggal Posting': string;
  'Jam': string;
  'Image URL'?: string;
  'Account'?: string;
}

export async function submitJadwal(formData: FormData) {
  const tema = formData.get('tema');
  const tanggal = formData.get('tanggal');
  const jam = formData.get('jam');
  const account = formData.get('account');
  const imageUrl = formData.get('imageUrl');

  // Simple validation
  if (!tema || !tanggal || !jam || !account) {
    return { success: false, message: 'Semua field harus diisi' };
  }

  const payload = {
    'Tema Postingan': tema,
    'Tanggal Posting': tanggal,
    'Jam': jam,
    'Image URL': imageUrl,  // Will work once reject.json is active
    'Account': account,
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
    let body: unknown = bodyText;
    try { body = bodyText ? JSON.parse(bodyText) : bodyText; } catch { }

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

    let data: Jadwal[] = [];
    try {
      data = (await response.json()) as Jadwal[];
    } catch {
      // If parsing fails, log the raw text so debugging is easier
      try {
        const raw = await response.text();
        console.warn("⚠️ Response JSON parse failed, raw body:", raw);
      } catch {
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

export async function generatePreview(formData: FormData) {
  const tema = formData.get('tema');
  if (!tema) return { success: false, message: 'Tema wajib diisi' };

  let previewUrl = process.env.N8N_PREVIEW_URL;
  if (!previewUrl && process.env.N8N_WEBHOOK_URL) {
    previewUrl = process.env.N8N_WEBHOOK_URL.replace('input-jadwal', 'preview-image');
  }

  if (!previewUrl) {
    return { success: false, message: 'Konfigurasi URL Preview belum diset (N8N_PREVIEW_URL)' };
  }

  try {
    const response = await fetch(previewUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.N8N_API_KEY!,
      },
      body: JSON.stringify({ tema }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to generate preview: ${response.status} ${text}`);
    }

    // Check content-type to determine response format
    const contentType = response.headers.get('content-type') || '';
    console.log('🔍 n8n Response Content-Type:', contentType);

    // If n8n returns binary image (respondWith: 'binary'), convert to base64
    // NOTE: This creates large data URLs (~2MB) that cannot be saved to Google Sheets
    // but works fine for preview display only
    if (contentType.includes('image/')) {
      console.log('📸 Received binary image from n8n');
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const imageUrl = `data:${contentType};base64,${base64}`;

      console.log('✅ Binary converted to data URL (length:', imageUrl.length, ')');
      console.log('⚠️ Note: Data URL too large for Google Sheets. Use URL extraction instead for submit.');
      return { success: true, imageUrl, message: 'Preview berhasil' };
    }

    // Otherwise parse as JSON and extract OpenAI URL
    const data = await response.json();
    console.log('🔍 n8n Preview Response:', JSON.stringify(data, null, 2));

    let imageUrl = null;

    // Try to extract OpenAI URL from various n8n response structures

    // Pattern 1: Direct URL string
    if (typeof data === 'string' && data.startsWith('http')) {
      imageUrl = data;
    }
    // Pattern 2: Direct url property
    else if (data.url && typeof data.url === 'string') {
      imageUrl = data.url;
    }
    // Pattern 3: imageUrl property
    else if (data.imageUrl && typeof data.imageUrl === 'string') {
      imageUrl = data.imageUrl;
    }
    // Pattern 4: OpenAI format - data array with url
    else if (data.data && Array.isArray(data.data) && data.data[0]?.url) {
      imageUrl = data.data[0].url;
    }
    // Pattern 5: Array response with url
    else if (Array.isArray(data) && data[0]?.url) {
      imageUrl = data[0].url;
    }
    // Pattern 6: Array response with imageUrl
    else if (Array.isArray(data) && data[0]?.imageUrl) {
      imageUrl = data[0].imageUrl;
    }
    // Pattern 7: Nested in output
    else if (data.output?.url) {
      imageUrl = data.output.url;
    }
    // Pattern 8: OpenAI message.content format
    else if (data.message?.content) {
      imageUrl = data.message.content;
    }
    // Pattern 9: n8n array-like object {0: {...}}
    else if (data['0']) {
      const item = data['0'];
      if (typeof item === 'string' && item.startsWith('http')) {
        imageUrl = item;
      } else if (item.json?.url) {
        imageUrl = item.json.url;
      } else if (item.json?.imageUrl) {
        imageUrl = item.json.imageUrl;
      } else if (item.json?.data && Array.isArray(item.json.data) && item.json.data[0]?.url) {
        // OpenAI format nested in n8n item
        imageUrl = item.json.data[0].url;
      } else if (item.json?.message?.content) {
        imageUrl = item.json.message.content;
      }
    }

    if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
      console.log('✅ OpenAI URL extracted:', imageUrl.substring(0, 100) + '...');
      return { success: true, imageUrl, message: 'Preview berhasil' };
    }

    console.error('❌ Could not extract URL from response');
    console.error('Response keys:', Object.keys(data));
    console.error('Response sample:', JSON.stringify(data).substring(0, 500));

    return {
      success: false,
      message: 'Gagal extract URL dari n8n response'
    };

  } catch (error) {
    console.error('Preview Error:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Gagal generate preview' };
  }
}