import React, { useEffect, useRef } from 'react';
import { Signal, Wifi } from 'lucide-react';

// Lapisan sisi ponsel: beberapa salinan bingkai yang ditumpuk ke belakang, supaya terlihat tebal saat dimiringkan.
const EDGE_LAYERS = Array.from({ length: 12 }, (_, i) => i + 1);

/**
 * Mockup ponsel 3D bergaya iPhone: bingkai logam, Dynamic Island, bilah status, dan pantulan cahaya.
 * Di perangkat dengan mouse, ponsel miring mengikuti kursor dan kembali ke posisi awal saat kursor pergi.
 * Isi layar bisa digulir. ink: warna teks bilah status, mengikuti warna teks halaman di dalam layar.
 * className: tata letak pembungkus (bisa berisi zoom untuk versi kecil). float: ponsel mengambang pelan.
 */
export default function PhoneMockup({ children, ink = '#FFFFFF', label = 'Contoh tampilan di ponsel', className = 'w-full px-6 py-8', float = true }) {
  const sceneRef = useRef(null);
  const frame = useRef(0);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const onMove = (e) => {
    const scene = sceneRef.current;
    if (!scene || e.pointerType !== 'mouse') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const box = scene.getBoundingClientRect();
    const px = Math.min(0.5, Math.max(-0.5, (e.clientX - box.left) / box.width - 0.5));
    const py = Math.min(0.5, Math.max(-0.5, (e.clientY - box.top) / box.height - 0.5));
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      scene.dataset.tracking = 'true';
      scene.style.setProperty('--ry', `${(px * 40).toFixed(2)}deg`);
      scene.style.setProperty('--rx', `${(-py * 22).toFixed(2)}deg`);
      scene.style.setProperty('--gx', `${(50 + px * 110).toFixed(1)}%`);
      scene.style.setProperty('--sx', `${(-px * 46).toFixed(1)}px`);
    });
  };

  const onLeave = () => {
    const scene = sceneRef.current;
    if (!scene) return;
    cancelAnimationFrame(frame.current);
    scene.dataset.tracking = 'false';
    ['--ry', '--rx', '--gx', '--sx'].forEach((name) => scene.style.removeProperty(name));
  };

  return (
    <div ref={sceneRef} className={`phone-scene relative flex justify-center ${className}`} onPointerMove={onMove} onPointerLeave={onLeave}>
      <div className={float ? 'phone-float' : '[transform-style:preserve-3d]'}>
        <div className="phone-3d w-[252px] sm:w-[290px]">
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
              <span aria-hidden="true" className="phone-glare" />
            </div>
          </div>
        </div>
      </div>
      <span aria-hidden="true" className="phone-shadow" />
    </div>
  );
}
