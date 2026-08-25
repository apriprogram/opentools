import React from 'react';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import { FileText } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary">Syarat & Ketentuan</h1>
            <p className="text-secondary mt-1">Terakhir diperbarui: {new Date().toLocaleDateString('id-ID')}</p>
          </div>
        </div>

        <Card className="p-8 space-y-6 text-[15px] leading-relaxed text-primary">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Penerimaan Syarat</h2>
            <p className="text-secondary">
              Dengan mengakses dan menggunakan situs web OpenTools, Anda menerima dan setuju untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak setuju dengan ketentuan ini, Anda dilarang menggunakan atau mengakses situs ini.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Penggunaan Layanan</h2>
            <p className="text-secondary mb-2">
              OpenTools menyediakan layanan konversi dan kompresi file secara gratis dan terbuka. Anda setuju untuk menggunakan layanan ini hanya untuk tujuan yang sah dan sesuai dengan hukum yang berlaku. Anda dilarang:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-secondary">
              <li>Menggunakan layanan ini untuk memproses file yang mengandung malware, virus, atau kode berbahaya lainnya.</li>
              <li>Menggunakan layanan ini untuk memproses materi ilegal, melanggar hak cipta, atau konten yang dilarang oleh hukum.</li>
              <li>Mencoba membebani server kami secara sengaja dengan serangan DDoS atau permintaan spam otomatis.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Tanggung Jawab File</h2>
            <p className="text-secondary">
              Anda memegang penuh tanggung jawab atas file yang Anda unggah. Kami tidak mengklaim kepemilikan atas file Anda. Karena sistem kami dirancang untuk menghapus file secara otomatis setelah 5 menit, kami tidak bertanggung jawab atas kehilangan data. Pastikan Anda menyimpan file asli Anda sebelum menggunakan layanan kami.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Penafian (Disclaimer)</h2>
            <p className="text-secondary">
              Materi di situs web OpenTools disediakan "sebagaimana adanya". Kami tidak memberikan jaminan, tersurat maupun tersirat, dan dengan ini menolak dan meniadakan semua jaminan lainnya, termasuk namun tidak terbatas pada, jaminan tersirat atau kondisi yang dapat diperjualbelikan, kesesuaian untuk tujuan tertentu, atau non-pelanggaran kekayaan intelektual atau pelanggaran hak lainnya.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Batasan Tanggung Jawab</h2>
            <p className="text-secondary">
              Dalam keadaan apa pun, OpenTools atau pemasoknya tidak bertanggung jawab atas segala kerusakan (termasuk, tanpa batasan, kerusakan karena hilangnya data atau keuntungan, atau karena gangguan bisnis) yang timbul dari penggunaan atau ketidakmampuan untuk menggunakan materi di situs web OpenTools.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Perubahan Syarat</h2>
            <p className="text-secondary">
              OpenTools dapat merevisi syarat ketentuan penggunaan situs webnya kapan saja tanpa pemberitahuan. Dengan menggunakan situs web ini, Anda setuju untuk terikat oleh versi saat ini dari Syarat dan Ketentuan Penggunaan ini.
            </p>
          </section>
        </Card>
      </div>
    </PageContainer>
  );
}
