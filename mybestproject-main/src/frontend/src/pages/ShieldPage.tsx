import { RefreshCw, ShieldAlert, ShieldCheck, ShieldOff } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import AIAnalysisGrid from "../components/shield/AIAnalysisGrid";
import CyberSafetyTips from "../components/shield/CyberSafetyTips";
import DangerWarningModal from "../components/shield/DangerWarningModal";
import NetworkInfoCard from "../components/shield/NetworkInfoCard";
import ProtectionModeBanner from "../components/shield/ProtectionModeBanner";
import RadarRings from "../components/shield/RadarRings";
import RecommendationsCard from "../components/shield/RecommendationsCard";
import RiskMeter from "../components/shield/RiskMeter";
import StatusLights from "../components/shield/StatusLights";
import ThreatFactorsList from "../components/shield/ThreatFactorsList";
import ThreatLevelCard from "../components/shield/ThreatLevelCard";
import ThreatLogPanel from "../components/shield/ThreatLogPanel";
import VPNStatusCard from "../components/shield/VPNStatusCard";
import { useNetworkSafety } from "../hooks/useNetworkSafety";

const LEVEL_COLORS = {
  SECURE: "oklch(0.82 0.32 140)",
  "MODERATE RISK": "oklch(0.76 0.35 65)",
  DANGEROUS: "oklch(0.68 0.35 25)",
};

const SHIELD_ANIM = {
  SECURE: "animate-safe-pulse",
  "MODERATE RISK": "animate-warning-pulse",
  DANGEROUS: "animate-danger-pulse",
};

export default function ShieldPage() {
  const { state, rescan, toggleVPN } = useNetworkSafety();
  const [modalShown, setModalShown] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Show danger modal when risk crosses 71
  useEffect(() => {
    if (!state.isScanning && state.riskLevel === "DANGEROUS" && !modalShown) {
      setModalVisible(true);
      setModalShown(true);
    }
    if (state.riskLevel !== "DANGEROUS") {
      setModalShown(false);
    }
  }, [state.riskLevel, state.isScanning, modalShown]);

  const levelColor = LEVEL_COLORS[state.riskLevel];
  const ShieldIcon = state.isScanning
    ? ShieldCheck
    : state.riskLevel === "SECURE"
      ? ShieldCheck
      : state.riskLevel === "MODERATE RISK"
        ? ShieldAlert
        : ShieldOff;

  const encryptionOk =
    state.encryptionType === "WPA3" || state.encryptionType === "WPA2";

  return (
    <div className="min-h-full w-full cyber-grid-bg" data-ocid="shield.page">
      {/* Page content */}
      <div className="px-4 pt-4 pb-8 space-y-4 max-w-lg mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 26 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-xl font-bold font-display tracking-tight">
              <span className="text-primary">SOCIONET</span>{" "}
              <span className="text-foreground">Shield</span>
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-semibold tracking-wide">
                AI POWERED
              </span>
              <p className="text-xs text-muted-foreground">Network Security</p>
            </div>
          </div>
          <motion.button
            type="button"
            onClick={rescan}
            disabled={state.isScanning}
            data-ocid="shield.rescan_button"
            whileTap={{ scale: 0.88 }}
            className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center disabled:opacity-40"
            aria-label="Rescan network"
          >
            <RefreshCw
              className={`w-4 h-4 text-primary ${state.isScanning ? "animate-spin" : ""}`}
            />
          </motion.button>
        </motion.div>

        {/* Protection mode banner */}
        <AnimatePresence>
          {state.protectionModeActive && <ProtectionModeBanner active />}
        </AnimatePresence>

        {/* ── Central Shield Radar Section ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 280,
            damping: 24,
            delay: 0.1,
          }}
          className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-2xl p-6 flex flex-col items-center gap-4 overflow-hidden relative"
          style={{ boxShadow: `0 0 40px ${levelColor}20` }}
          data-ocid="shield.central_panel"
        >
          {/* Cyber grid overlay */}
          <div
            className="absolute inset-0 cyber-grid-bg opacity-30 pointer-events-none"
            aria-hidden="true"
          />

          {/* Status label */}
          <div className="flex items-center gap-2 z-10">
            <span
              className="w-2 h-2 rounded-full"
              style={{
                background: levelColor,
                boxShadow: `0 0 8px ${levelColor}`,
              }}
              aria-hidden="true"
            />
            <span
              className="text-xs font-bold tracking-widest uppercase"
              style={{ color: levelColor }}
            >
              {state.isScanning ? "SCANNING..." : state.riskLevel}
            </span>
          </div>

          {/* Radar + Shield + Meter row */}
          <div className="relative flex items-center justify-around w-full z-10">
            {/* Radar rings + shield */}
            <div
              className="relative flex items-center justify-center"
              style={{ width: 160, height: 160 }}
            >
              <RadarRings color={levelColor} size={64} />

              {/* Shield icon center */}
              <motion.div
                animate={
                  state.isScanning
                    ? { rotate: [0, 5, -5, 0] }
                    : { scale: [1, 1.05, 1] }
                }
                transition={{
                  duration: state.isScanning ? 0.6 : 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
                className={`relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center ${SHIELD_ANIM[state.riskLevel]}`}
                style={{
                  background: `${levelColor}18`,
                  border: `2px solid ${levelColor}50`,
                }}
              >
                <ShieldIcon
                  className="w-8 h-8 animate-shield-glow"
                  style={{ color: levelColor }}
                />
              </motion.div>
            </div>

            {/* Risk meter */}
            <div className="flex flex-col items-center gap-1">
              <RiskMeter
                score={state.riskScore}
                isScanning={state.isScanning}
              />
            </div>
          </div>

          {/* Status lights */}
          <StatusLights
            networkOk={!state.isOpen}
            encryptionOk={encryptionOk}
            vpnOk={state.vpnEnabled}
          />

          {/* Last analyzed */}
          <p className="text-[10px] text-muted-foreground z-10">
            {state.isScanning
              ? "Analyzing network..."
              : `Last analyzed: ${state.lastAnalyzed.toLocaleTimeString()}`}
          </p>
        </motion.div>

        {/* Network info */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.15,
            type: "spring",
            stiffness: 300,
            damping: 26,
          }}
        >
          <NetworkInfoCard
            ssid={state.ssid}
            encryptionType={state.encryptionType}
            isPublic={state.isPublic}
            isOpen={state.isOpen}
            signalStrength={state.signalStrength}
            connectionStatus={state.connectionStatus}
          />
        </motion.div>

        {/* Threat level */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.2,
            type: "spring",
            stiffness: 300,
            damping: 26,
          }}
        >
          <ThreatLevelCard
            riskLevel={state.riskLevel}
            riskScore={state.riskScore}
            isScanning={state.isScanning}
          />
        </motion.div>

        {/* AI Analysis Grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.25,
            type: "spring",
            stiffness: 300,
            damping: 26,
          }}
        >
          <AIAnalysisGrid
            trustScore={state.trustScore}
            riskScore={state.riskScore}
            isScanning={state.isScanning}
          />
        </motion.div>

        {/* VPN */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            type: "spring",
            stiffness: 300,
            damping: 26,
          }}
        >
          <VPNStatusCard
            vpnEnabled={state.vpnEnabled}
            onToggle={toggleVPN}
            isScanning={state.isScanning}
          />
        </motion.div>

        {/* AI Recommendation */}
        {!state.isScanning && state.aiRecommendation && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.32,
              type: "spring",
              stiffness: 300,
              damping: 26,
            }}
          >
            <RecommendationsCard recommendation={state.aiRecommendation} />
          </motion.div>
        )}

        {/* Threat factors */}
        {!state.isScanning && state.threatFactors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.35,
              type: "spring",
              stiffness: 300,
              damping: 26,
            }}
          >
            <ThreatFactorsList factors={state.threatFactors} />
          </motion.div>
        )}

        {/* Safety tips */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.38,
            type: "spring",
            stiffness: 300,
            damping: 26,
          }}
        >
          <CyberSafetyTips />
        </motion.div>

        {/* Threat log */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.4,
            type: "spring",
            stiffness: 300,
            damping: 26,
          }}
        >
          <ThreatLogPanel />
        </motion.div>
      </div>

      {/* Danger modal */}
      <DangerWarningModal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        onEnableVPN={toggleVPN}
        ssid={state.ssid}
      />
    </div>
  );
}
