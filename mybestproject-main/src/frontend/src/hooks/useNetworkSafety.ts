import { useCallback, useEffect, useRef, useState } from "react";

export type EncryptionType = "WPA3" | "WPA2" | "WPA" | "Open";
export type RiskLevel = "SECURE" | "MODERATE RISK" | "DANGEROUS";
export type ConnectionStatus = "Connected" | "Disconnected" | "Scanning";

export interface ThreatFactor {
  id: string;
  label: string;
  description: string;
  severity: "low" | "medium" | "high";
  score: number;
  icon: string;
}

export interface NetworkSafetyState {
  ssid: string;
  encryptionType: EncryptionType;
  isPublic: boolean;
  isOpen: boolean;
  riskScore: number;
  riskLevel: RiskLevel;
  vpnEnabled: boolean;
  connectionStatus: ConnectionStatus;
  isScanning: boolean;
  threatFactors: ThreatFactor[];
  aiRecommendation: string;
  trustScore: number;
  lastAnalyzed: Date;
  protectionModeActive: boolean;
  signalStrength: number;
}

const SUSPICIOUS_NAMES = [
  "Free_Airport_WiFi",
  "Starbucks_Free_Internet",
  "Public_5G_Free",
  "FreeWiFi",
  "Guest_Network",
  "xfinitywifi",
  "attwifi",
  "Google Starbucks",
  "CoffeeShop_FREE",
  "HotelGuest",
  "Airport_Free_WiFi",
  "PublicWiFi",
  "OpenNetwork",
  "Free_5G",
  "McDonald's Free WiFi",
  "BurgerKing_WiFi",
  "Library_Public",
];

const REALISTIC_SSIDS = [
  "Home_Network_5G",
  "Daniel's iPhone",
  "Jio_Fiber_4521",
  "BSNL_Broadband",
  "Airtel_5G_Plus",
  "AndroidAP_8823",
  "College_Campus_WiFi",
  "Office_Secure_Net",
  "TP-Link_A3F2",
  "Netgear_Premium",
  "ASUS_Router_2G",
  "Vodafone_WiFi",
];

const AI_RECOMMENDATIONS: Record<RiskLevel, string[]> = {
  SECURE: [
    "Your connection is encrypted and secure. Safe to browse and communicate.",
    "WPA3 encryption detected. Your data is protected with the latest security standards.",
    "Network appears trustworthy. All security protocols are active.",
  ],
  "MODERATE RISK": [
    "Avoid accessing banking or sensitive accounts on this network.",
    "Consider enabling a VPN for additional protection on this network.",
    "Some security concerns detected. Minimize sharing of personal data.",
  ],
  DANGEROUS: [
    "⚠ CRITICAL: Enable VPN immediately. Avoid all sensitive activity.",
    "Potential MITM attack indicators detected. Disconnect if possible.",
    "This network may expose your passwords and personal files. Enable VPN now.",
  ],
};

const ENCRYPTION_WEIGHTS: EncryptionType[] = [
  "WPA2",
  "WPA2",
  "WPA2",
  "WPA2",
  "WPA3",
  "WPA3",
  "WPA",
  "Open",
];

function computeRisk(
  ssid: string,
  encryption: EncryptionType,
  isPublic: boolean,
  vpnEnabled: boolean,
): { score: number; factors: ThreatFactor[] } {
  const factors: ThreatFactor[] = [];
  let score = 0;

  const isSuspicious = SUSPICIOUS_NAMES.some(
    (s) =>
      ssid.toLowerCase().includes(s.toLowerCase()) ||
      s.toLowerCase().includes(ssid.toLowerCase().split("_")[0]),
  );

  if (encryption === "Open") {
    score += 35;
    factors.push({
      id: "no-enc",
      label: "No Encryption",
      description: "Network traffic is completely unencrypted",
      severity: "high",
      score: 35,
      icon: "🔓",
    });
  } else if (encryption === "WPA") {
    score += 15;
    factors.push({
      id: "weak-enc",
      label: "Weak Encryption (WPA)",
      description: "WPA is outdated and vulnerable to modern attacks",
      severity: "medium",
      score: 15,
      icon: "⚠",
    });
  } else if (encryption === "WPA2") {
    score += 5;
    factors.push({
      id: "wpa2",
      label: "WPA2 Encryption",
      description: "Good encryption but not the latest standard",
      severity: "low",
      score: 5,
      icon: "🔒",
    });
  }

  if (isPublic) {
    score += 20;
    factors.push({
      id: "public",
      label: "Public Network",
      description: "Shared public networks are accessible to everyone",
      severity: "medium",
      score: 20,
      icon: "📶",
    });
  }

  if (isSuspicious) {
    score += 20;
    factors.push({
      id: "suspicious",
      label: "Suspicious Network Name",
      description: "Network name matches known phishing hotspot patterns",
      severity: "high",
      score: 20,
      icon: "🎣",
    });
  }

  if (!vpnEnabled) {
    score += 10;
    factors.push({
      id: "no-vpn",
      label: "VPN Disabled",
      description: "No VPN protection active on this network",
      severity: "medium",
      score: 10,
      icon: "🛡",
    });
  }

  if (encryption === "Open" && isSuspicious) {
    score += 15;
    factors.push({
      id: "mitm",
      label: "Possible MITM Attack",
      description: "Open network with suspicious name is a MITM attack vector",
      severity: "high",
      score: 15,
      icon: "💀",
    });
  }

  const variance = Math.floor(Math.random() * 10) - 5;
  score = Math.max(0, Math.min(100, score + variance));

  return { score, factors };
}

function scoreToLevel(score: number): RiskLevel {
  if (score <= 30) return "SECURE";
  if (score <= 70) return "MODERATE RISK";
  return "DANGEROUS";
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function useNetworkSafety() {
  // Use refs for initial values to avoid re-render issues
  const initRef = useRef({
    ssid: pickRandom(REALISTIC_SSIDS),
    enc: pickRandom(ENCRYPTION_WEIGHTS) as EncryptionType,
    isPublic: Math.random() < 0.4,
  });
  const {
    ssid: initialSsid,
    enc: initialEnc,
    isPublic: initialPublic,
  } = initRef.current;
  const initialOpen = initialEnc === "Open";

  const [state, setState] = useState<NetworkSafetyState>({
    ssid: initialSsid,
    encryptionType: initialEnc,
    isPublic: initialPublic,
    isOpen: initialOpen,
    riskScore: 0,
    riskLevel: "SECURE",
    vpnEnabled: false,
    connectionStatus: "Scanning",
    isScanning: true,
    threatFactors: [],
    aiRecommendation: "",
    trustScore: 100,
    lastAnalyzed: new Date(),
    protectionModeActive: false,
    signalStrength: Math.floor(Math.random() * 40) + 60,
  });

  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const runScan = useCallback(
    (
      vpnEnabled: boolean,
      ssid?: string,
      enc?: EncryptionType,
      pub?: boolean,
    ) => {
      const currentSsid = ssid ?? state.ssid;
      const currentEnc = enc ?? state.encryptionType;
      const currentPublic = pub ?? state.isPublic;

      setState((prev) => ({
        ...prev,
        isScanning: true,
        connectionStatus: "Scanning",
      }));

      setTimeout(() => {
        const { score, factors } = computeRisk(
          currentSsid,
          currentEnc,
          currentPublic,
          vpnEnabled,
        );
        const level = scoreToLevel(score);
        const recList = AI_RECOMMENDATIONS[level];
        const recommendation = pickRandom(recList);
        const trust = Math.max(0, 100 - score);

        setState((prev) => ({
          ...prev,
          ssid: currentSsid,
          encryptionType: currentEnc,
          isPublic: currentPublic,
          isOpen: currentEnc === "Open",
          riskScore: score,
          riskLevel: level,
          threatFactors: factors,
          aiRecommendation: recommendation,
          trustScore: trust,
          isScanning: false,
          connectionStatus: "Connected",
          lastAnalyzed: new Date(),
          protectionModeActive: level === "DANGEROUS",
          signalStrength: Math.floor(Math.random() * 40) + 60,
        }));
      }, 2200);
    },
    [state.ssid, state.encryptionType, state.isPublic],
  );

  // Initial scan — use ref values, runs once
  const initialScanFired = useRef(false);
  useEffect(() => {
    if (initialScanFired.current) return;
    initialScanFired.current = true;
    runScan(
      false,
      initRef.current.ssid,
      initRef.current.enc,
      initRef.current.isPublic,
    );
  }, [runScan]);

  // Auto-refresh every 30s
  useEffect(() => {
    refreshTimer.current = setInterval(() => {
      const newSsid = pickRandom(REALISTIC_SSIDS);
      const newEnc = pickRandom(ENCRYPTION_WEIGHTS);
      const newPublic = Math.random() < 0.4;
      runScan(state.vpnEnabled, newSsid, newEnc, newPublic);
    }, 30000);
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, [state.vpnEnabled, runScan]);

  const rescan = useCallback(() => {
    const newSsid = pickRandom(REALISTIC_SSIDS);
    const newEnc = pickRandom(ENCRYPTION_WEIGHTS);
    const newPublic = Math.random() < 0.4;
    runScan(state.vpnEnabled, newSsid, newEnc, newPublic);
  }, [state.vpnEnabled, runScan]);

  const toggleVPN = useCallback(() => {
    setState((prev) => {
      const newVpn = !prev.vpnEnabled;
      return { ...prev, vpnEnabled: newVpn };
    });
    runScan(!state.vpnEnabled);
  }, [state.vpnEnabled, runScan]);

  return { state, rescan, toggleVPN };
}
