import { getDb } from "@/lib/mongodb";

type OtpDoc = {
  email: string;
  otp: string;
  createdAt: string;
};

export async function issueOtp(email: string) {
  const normalized = email.trim().toLowerCase();
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const db = await getDb();
  const otps = db.collection<OtpDoc>("auth_otps");
  await otps.updateOne(
    { email: normalized },
    {
      $set: {
        email: normalized,
        otp,
        createdAt: new Date().toISOString(),
      },
    },
    { upsert: true }
  );
  return otp;
}

export async function verifyOtp(email: string, otp: string) {
  const normalized = email.trim().toLowerCase();
  const db = await getDb();
  const otps = db.collection<OtpDoc>("auth_otps");
  const saved = await otps.findOne({ email: normalized });
  if (!saved || saved.otp !== otp.trim()) return false;
  await otps.deleteOne({ email: normalized });
  return true;
}
