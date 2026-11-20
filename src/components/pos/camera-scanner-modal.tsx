"use client"

import React, { useEffect, useRef, useState } from "react"
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode"
import {
  Camera,
  X,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Volume2,
  VolumeX,
} from "lucide-react"

interface CameraScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onScan: (barcode: string) => boolean | void // returns true if product matched
}

export function CameraScannerModal({
  isOpen,
  onClose,
  onScan,
}: CameraScannerModalProps) {
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>("")
  const [isScanning, setIsScanning] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [lastScanned, setLastScanned] = useState<{
    code: string
    success: boolean
    time: number
  } | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerId = "pos-camera-scanner-viewport"
  const lastScannedRef = useRef<string | null>(null)
  const cooldownTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Web Audio synthesizer beep
  const playBeep = (isSuccess: boolean) => {
    if (!soundEnabled) return
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = "sine"
      osc.frequency.setValueAtTime(isSuccess ? 880 : 330, ctx.currentTime) // High pleasant pitch if found, lower if not

      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(ctx.currentTime + 0.12)
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // Request cameras on open
  useEffect(() => {
    if (!isOpen) return

    let isMounted = true

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!isMounted) return
        if (devices && devices.length > 0) {
          setCameras(devices)
          // Prefer back camera (environment) if available
          const backCam = devices.find(
            (d) =>
              d.label.toLowerCase().includes("back") ||
              d.label.toLowerCase().includes("trasera") ||
              d.label.toLowerCase().includes("environment")
          )
          setSelectedCameraId(backCam ? backCam.id : devices[0].id)
        } else {
          setErrorMsg("No se detectaron cámaras en este dispositivo.")
        }
      })
      .catch((err) => {
        if (!isMounted) return
        setErrorMsg(
          "No se pudo acceder a la cámara. Asegurate de dar los permisos en el navegador."
        )
      })

    return () => {
      isMounted = false
    }
  }, [isOpen])

  // Start scanner when camera is selected
  useEffect(() => {
    if (!isOpen || !selectedCameraId) return

    const html5QrCode = new Html5Qrcode(containerId, {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.QR_CODE,
      ],
      verbose: false,
    })

    scannerRef.current = html5QrCode

    const config = {
      fps: 15,
      qrbox: { width: 280, height: 160 },
      aspectRatio: 1.333,
    }

    const onScanSuccess = (decodedText: string) => {
      // 1.5s debounce for the same barcode to prevent spam
      if (lastScannedRef.current === decodedText) {
        return
      }

      lastScannedRef.current = decodedText
      if (cooldownTimeoutRef.current) clearTimeout(cooldownTimeoutRef.current)
      cooldownTimeoutRef.current = setTimeout(() => {
        lastScannedRef.current = null
      }, 1500)

      // Haptic feedback on mobile devices
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(50)
      }

      // Execute onScan callback
      const matched = onScan(decodedText)
      const isSuccess = matched !== false

      playBeep(isSuccess)
      setLastScanned({
        code: decodedText,
        success: isSuccess,
        time: Date.now(),
      })
    }

    html5QrCode
      .start(
        selectedCameraId,
        config,
        onScanSuccess,
        () => {} // Silent on individual frame miss
      )
      .then(() => {
        setIsScanning(true)
        setErrorMsg(null)
      })
      .catch((err) => {
        setErrorMsg(
          "Error al iniciar el visor de cámara. Probá seleccionando otra cámara o recargando."
        )
      })

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().then(() => html5QrCode.clear()).catch(() => {})
      } else {
        html5QrCode.clear()
      }
    }
  }, [isOpen, selectedCameraId])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-neutral-200 shadow-2xl overflow-hidden z-50 animate-fadeIn">
        {/* Header */}
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FE9820]/15 text-[#FE9820] flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#1F1F1F]">
                Lector de Código de Barras
              </h3>
              <p className="text-[10px] text-neutral-400">
                Apuntá la cámara al código de barras del producto
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              title={soundEnabled ? "Silenciar beep" : "Activar beep"}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewfinder Area */}
        <div className="relative bg-black flex flex-col items-center justify-center min-h-[300px]">
          {/* HTML5 QR Code Container */}
          <div id={containerId} className="w-full" />

          {/* Animated Laser Overlay */}
          {isScanning && !errorMsg && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-64 h-36 border-2 border-white/60 rounded-2xl overflow-hidden shadow-2xl">
                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#FE9820]" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#FE9820]" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#FE9820]" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#FE9820]" />

                {/* Laser line moving vertically */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#FE9820] to-transparent animate-laser shadow-[0_0_8px_#FE9820]" />
              </div>
            </div>
          )}

          {/* Error display */}
          {errorMsg && (
            <div className="absolute inset-4 p-4 rounded-2xl bg-black/90 text-white flex flex-col items-center justify-center text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-amber-400" />
              <p className="text-xs font-semibold">{errorMsg}</p>
              <p className="text-[11px] text-neutral-400">
                Asegurate de que otra app no esté usando la cámara.
              </p>
            </div>
          )}
        </div>

        {/* Last Scan Status Pill */}
        {lastScanned && (
          <div
            className={`px-4 py-2 text-xs font-semibold flex items-center justify-between border-t ${
              lastScanned.success
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              {lastScanned.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span className="truncate">
                {lastScanned.success
                  ? `¡Producto agregado al carrito!`
                  : `Código ${lastScanned.code} no encontrado`}
              </span>
            </div>
            <span className="font-mono text-[10px] text-neutral-500 shrink-0">
              {lastScanned.code}
            </span>
          </div>
        )}

        {/* Footer: Camera Switcher & Finish */}
        <div className="p-3 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between gap-2">
          {cameras.length > 1 ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <RefreshCw className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <select
                value={selectedCameraId}
                onChange={(e) => setSelectedCameraId(e.target.value)}
                className="text-xs font-medium bg-white border border-neutral-200 rounded-lg px-2 py-1 max-w-[190px] truncate outline-none"
              >
                {cameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label || `Cámara ${c.id.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="text-[11px] text-neutral-400 font-medium">
              EAN-13, EAN-8, UPC, Code 128
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-900 text-white font-bold text-xs transition-colors shadow-xs"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
