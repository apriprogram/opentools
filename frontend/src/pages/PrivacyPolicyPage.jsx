import React from 'react';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import { Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PrivacyPolicyPage() {
  const { t } = useTranslation();

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary">Kebijakan Privasi</h1>
            <p className="text-secondary mt-1">Terakhir diperbarui: {new Date().toLocaleDateString('id-ID')}</p>
          </div>
        </div>

        <Card className="p-8 space-y-6 text-[15px] leading-relaxed text-primary">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Komitmen Privasi Kami</h2>
            <p className="text-secondary">
              Di OpenTools, privasi Anda adalah prioritas utama kami. Kami membangun platform ini dengan prinsip bahwa file Anda adalah milik Anda sepenuhnya. Kami tidak pernah melihat, menyalin, atau menjual data Anda.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Penanganan & Penghapusan File</h2>
            <ul className="list-disc pl-5 space-y-2 text-secondary">
              <li><strong>Proses End-to-End:</strong> File yang Anda unggah hanya diproses untuk tujuan konversi atau kompresi yang Anda minta.</li>
              <li><strong>Penghapusan Otomatis (5 Menit):</strong> Semua file yang diunggah dan dihasilkan akan dihapus secara otomatis dan permanen dari server kami dalam waktu maksimal 5 menit setelah proses selesai.</li>
              <li><strong>Tidak Ada Salinan Cadangan:</strong> Kami tidak menyimpan salinan cadangan dari file Anda. Setelah dihapus, file tersebut tidak dapat dipulihkan kembali oleh siapapun.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Pengumpulan Data</h2>
            <p className="text-secondary mb-2">
              Kami <strong>TIDAK</strong> mengumpulkan atau menyimpan:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-secondary">
              <li>Isi dari file dokumen, gambar, audio, atau video Anda.</li>
              <li>Informasi identitas pribadi (Nama, Email, dll) karena kami tidak mensyaratkan pendaftaran akun.</li>
              <li>Data pelacakan iklan (platform kami 100% bebas iklan).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Keamanan</h2>
            <p className="text-secondary">
              Seluruh transfer data antara perangkat Anda dan server kami dienkripsi menggunakan protokol keamanan standar industri (HTTPS/TLS). Kami menjamin bahwa koneksi Anda aman dari pihak ketiga.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Open Source</h2>
            <p className="text-secondary">
              Transparansi adalah kunci dari kepercayaan. Kode sumber (source code) dari OpenTools terbuka untuk publik. Siapa saja dapat mengaudit, meninjau, dan memastikan bahwa kami menepati janji privasi kami. Anda dapat melihat kode sumber kami di repositori GitHub kami.
            </p>
          </section>
        </Card>
      </div>
    </PageContainer>
  );
}
