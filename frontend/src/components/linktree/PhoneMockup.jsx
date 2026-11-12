import React, { useEffect, useRef } from 'react';
import { Signal, Wifi } from 'lucide-react';

// Lapisan sisi ponsel: beberapa salinan bingkai yang ditumpuk ke belakang, supaya terlihat tebal saat dimiringkan.
// Jumlahnya sengaja sedikit (jarak 2,4px): tiap lapisan menjadi satu lapisan gambar di kartu grafis.
const EDGE_LAYERS = [2.4, 4.8, 7.2, 9.6, 12];

/**
 * Mockup ponsel 3D bergaya iPhone: bingkai logam, Dynamic Island, bilah status, dan pantulan cahaya.
 * Ponsel diam. Di perangkat dengan mouse, ponsel miring mengikuti kursor dan kembali ke posisi awal saat
 * kursor pergi. Isi layar bisa digulir. ink: warna teks bilah status, mengikuti warna teks halaman di layar.
 * className: tata letak pembungkus (bisa berisi zoom untuk versi kecil).
 *
 * Kemiringan ditulis langsung ke gaya elemen ponsel, pantulan, dan bayangan (hanya transform), bukan lewat
 * variabel CSS di pembungkus. Variabel yang berubah membuat browser menghitung ulang gaya seluruh isi layar
 * di setiap gerakan kursor; transform langsung hanya dikerjakan kartu grafis.
 */
export default function PhoneMockup({ children, ink = '#FFFFFF', label = 'Contoh tampilan di ponsel', className = 'w-full px-6 py-8' }) {
  const sceneRef = useRef(null);
  const phoneRef = useRef(null);
  const glareRef = useRef(null);
  const shadowRef = useRef(null);
  const frame = useRef(0);
  const box = useRef(null);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const onEnter = () => {
    // Ukuran area diukur sekali saat kursor masuk, bukan di setiap gerakan.
    box.current = sceneRef.current?.getBoundingClientRect() || null;
  };

  const onMove = (e) => {
    const scene = sceneRef.current;
    if (!scene || e.pointerType !== 'mouse') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const area = box.current || (box.current = scene.getBoundingClientRect());
    const px = Math.min(0.5, Math.max(-0.5, (e.clientX - area.left) / area.width - 0.5));
    const py = Math.min(0.5, Math.max(-0.5, (e.clientY - area.top) / area.height - 0.5));
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      if (scene.dataset.tracking !== 'true') scene.dataset.tracking = 'true';
      if (phoneRef.current) phoneRef.current.style.transform = `rotateX(${(-py * 22).toFixed(2)}deg) rotateY(${(px * 40).toFixed(2)}deg)`;
      if (glareRef.current) glareRef.current.style.transform = `translateX(${(px * 36).toFixed(2)}%)`;
      if (shadowRef.current) shadowRef.current.style.transform = `translateX(calc(-50% + ${(-px * 46).toFixed(1)}px))`;
    });
  };

  const onLeave = () => {
    const scene = sceneRef.current;
    if (!scene) return;
    cancelAnimationFrame(frame.current);
    box.current = null;
    scene.dataset.tracking = 'false';
    [phoneRef, glareRef, shadowRef].forEach((ref) => ref.current?.style.removeProperty('transform'));
  };

  return (
    <div
      ref={sceneRef}
      className={`phone-scene relative flex justify-center ${className}`}
      onPointerEnter={onEnter}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <div ref={phoneRef} className="phone-3d w-[252px] sm:w-[290px]">
        {EDGE_LAYERS.map((depth) => (
          <span key={depth} aria-hidden="true" className="phone-edge" style={{ transform: `translateZ(-${depth}px)` }} />
        ))}
        {/* Tombol samping */}
        <span aria-hidden="true" className="phone-key left-[-3px] top-[104px] h-[26px]" />
        <span aria-hidden="true" className="phone-key left-[-3px] top-[150px] h-[46px]" />
        <span aria-hidden="true" className="phone-key left-[-3px] top-[206px] h-[46px]" />
        <span aria-hidden="true" className="phone-key right-[-3px] top-[170px] h-[72px]" />

        <div className="phone-body">
          <div className="phone-screen h-[500px] sm:h-[578px]" role="group" aria-label={label}>
            <div className="phone-scroll h-full overflow-y-auto">{children}</div>

            {/* Bilah status dan Dynamic Island: hiasan, tidak menghalangi isi layar. */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 flex h-[46px] items-center justify-between px-6 text-[12px] font-semibold" style={{ color: ink }}>
              <span className="tabular-nums">9:41</span>
              <span className="flex items-center gap-1">
                <Signal size={13} strokeWidth={2.5} />
                <Wifi size={13} strokeWidth={2.5} />
                <span className="relative ml-0.5 h-[10px] w-[20px] rounded-[3px] border border-current opacity-90">
                  <span className="absolute inset-[1.5px] right-[4px] rounded-[1px] bg-current" />
                </span>
              </span>
            </div>
            <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[10px] flex h-[26px] w-[88px] -translate-x-1/2 items-center justify-end rounded-full bg-black pr-2.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
              <span className="h-[9px] w-[9px] rounded-full bg-[#15161c] shadow-[inset_0_0_0_1.5px_#2a2c38,inset_0_0_3px_1px_rgba(90,110,220,0.5)]" />
            </div>
            <span aria-hidden="true" className="pointer-events-none absolute bottom-[7px] left-1/2 h-[4px] w-[104px] -translate-x-1/2 rounded-full opacity-80" style={{ backgroundColor: ink }} />
            <span ref={glareRef} aria-hidden="true" className="phone-glare" />
          </div>
        </div>
      </div>
      <span ref={shadowRef} aria-hidden="true" className="phone-shadow" />
    </div>
  );
}
