// Klien toyyibPay. Status bayaran SENTIASA disahkan terus dengan toyyibPay (getBillTransactions),
// bukan berdasarkan data callback atau URL pulang yang boleh dipalsukan.

export function asas(env) {
  const b = (env.TOYYIBPAY_BASE || "https://toyyibpay.com").replace(/\/$/, "");
  if (b !== "https://toyyibpay.com" && b !== "https://dev.toyyibpay.com") throw new Error("TOYYIBPAY_BASE tidak sah");
  return b;
}

// toyyibPay hanya terima huruf, nombor, ruang dan "_" untuk nama & keterangan bil.
const alnum = (s, n) => String(s).replace(/[^A-Za-z0-9 _]/g, "").replace(/\s+/g, " ").trim().slice(0, n);

async function pos(env, laluan, medan) {
  const f = new FormData();
  for (const [k, v] of Object.entries(medan)) f.append(k, String(v));
  const ctl = new AbortController();
  const tm = setTimeout(() => ctl.abort(), 15000);
  try {
    const r = await fetch(asas(env) + laluan, { method: "POST", body: f, signal: ctl.signal });
    const t = await r.text();
    try { return JSON.parse(t); } catch (e) { return null; }
  } finally {
    clearTimeout(tm);
  }
}

export async function ciptaBil(env, d) {
  if (!env.TOYYIBPAY_SECRET || !env.TOYYIBPAY_CATEGORY) throw new Error("toyyibPay belum dikonfigurasi");
  const medan = {
    userSecretKey: env.TOYYIBPAY_SECRET,
    categoryCode: env.TOYYIBPAY_CATEGORY,
    billName: alnum("Sumbangan ARISMA Foundation", 30),
    billDescription: alnum(d.keterangan, 100),
    billPriceSetting: 1,            // amaun tetap
    billPayorInfo: 1,               // maklumat pembayar wajib
    billAmount: d.amaun_sen,        // dalam sen
    billReturnUrl: d.pulang,
    billCallbackUrl: d.panggilBalik,
    billExternalReferenceNo: d.id,
    billTo: d.nama.slice(0, 100),
    billEmail: d.emel,
    billPhone: d.telefon.replace(/[^0-9]/g, "").slice(0, 15),
    billSplitPayment: 0,
    billSplitPaymentArgs: "",
    billPaymentChannel: env.TOYYIBPAY_CHANNEL || "2",
    billExpiryDays: 3
  };
  if (env.TOYYIBPAY_CAJ) medan.billChargeToCustomer = env.TOYYIBPAY_CAJ;
  const j = await pos(env, "/index.php/api/createBill", medan);
  const kod = Array.isArray(j) && j[0] && j[0].BillCode;
  if (!kod || !/^[A-Za-z0-9]{4,32}$/.test(kod)) throw new Error("toyyibPay tidak memulangkan BillCode");
  return kod;
}

export function pautanBayar(env, billcode) {
  return asas(env) + "/" + billcode;
}

// Pulangkan { status: "berjaya" | "menunggu" | "semak", refno, saluran }
export async function semakBayaran(env, derma) {
  const j = await pos(env, "/index.php/api/getBillTransactions", { billCode: derma.billcode });
  const senarai = Array.isArray(j) ? j : [];
  const berjaya = senarai.find((t) => String(t.billpaymentStatus) === "1");
  if (!berjaya) return { status: "menunggu" };

  const sen = Math.round(parseFloat(berjaya.billpaymentAmount) * 100);
  if (sen !== derma.amaun_sen) return { status: "semak", sebab: "amaun tidak sepadan" };
  if (berjaya.billExternalReferenceNo && berjaya.billExternalReferenceNo !== derma.id) {
    return { status: "semak", sebab: "rujukan tidak sepadan" };
  }
  return {
    status: "berjaya",
    refno: String(berjaya.billpaymentInvoiceNo || "").slice(0, 64),
    saluran: String(berjaya.billpaymentChannel || "").slice(0, 32)
  };
}
