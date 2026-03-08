import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, BrainCircuit, TrendingUp, Activity, Terminal, Wallet, 
  CheckCircle2, Zap, Network, Database, Lock, ExternalLink, Code2,
  Sparkles, Cpu, Globe2, BarChart3, Radio, Fingerprint, ChevronRight,
  AlertTriangle
} from 'lucide-react';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function App() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isUnderwriting, setIsUnderwriting] = useState(false);
  const [isCreatingMarket, setIsCreatingMarket] = useState(false);
  const [isVerifyingWorldID, setIsVerifyingWorldID] = useState(false);
  
  // State for Phase 1: Actuary
  const [vaultHealth, setVaultHealth] = useState(1.45);
  const [riskStatus, setRiskStatus] = useState('Monitoring');
  
  // State for Phase 2: Markets
  const [markets, setMarkets] = useState([
    { id: 1, question: "MicroStrategy sells any Bitcoin by 2026?", status: "Active", liquidity: "$14,500", volume: "High" }
  ]);

  // State for Phase 3: World ID
  const [worldIDStatus, setWorldIDStatus] = useState('Unverified');
  const [collateralRatio, setCollateralRatio] = useState(150);

  // Terminal Logs State
  const [logs, setLogs] = useState([
    "[SYSTEM] Sentient Command Center Initialized.",
    "[SYSTEM] Connected to Base Sepolia RPC.",
    "[SYSTEM] Awaiting Agent Triggers..."
  ]);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        setIsConnecting(true);
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== '0x14a34') {
          addLog("⚠️ Switch MetaMask to Base Sepolia network.");
        }
        setWalletAddress(accounts[0]);
        addLog(`✅ Wallet Connected: ${accounts[0].substring(0,6)}...${accounts[0].substring(38)}`);
      } catch (error) {
        addLog("❌ Wallet connection failed.");
      } finally {
        setIsConnecting(false);
      }
    } else {
      addLog("❌ Web3 wallet not detected.");
    }
  };

  const triggerVaultActuary = async () => {
    if (isUnderwriting) return;
    setIsUnderwriting(true);
    setRiskStatus('Analyzing...');
    
    const sequence = [
      "🤖 ACTUARY AGENT: Log Trigger Activated",
      "🔍 Fetching Vault #42 Health Factor...",
      "⚠️ Health Factor Critical: 1.05 detected.",
      "🧠 AI Risk Assessment: High Volatility. Initiating protective measures.",
      "✅ Sending BFT Consensus Report...",
      "🚀 Executing Cross-Chain Write to Base Sepolia...",
      "🎉 SUCCESS! Collateral Ratio Adjusted. Tx: 0x8a2b...4c19"
    ];

    for (let i = 0; i < sequence.length; i++) {
      await new Promise(r => setTimeout(r, 800));
      addLog(sequence[i]);
      if (i === 2) setVaultHealth(1.05);
      if (i === 3) setRiskStatus('Critical Risk');
    }
    
    setVaultHealth(1.55);
    setRiskStatus('Secured');
    setIsUnderwriting(false);
  };

  const triggerMarketCreator = async () => {
    if (isCreatingMarket) return;
    setIsCreatingMarket(true);

    const sequence = [
      "🤖 CREATOR AGENT: Cron Trigger Activated",
      "🌐 Formulating AI Prediction Market...",
      "📝 Market Proposal: 'Will Ethereum flip Bitcoin market cap in 2026?'",
      "✅ Sending to DON Consensus to verify...",
      "🚀 Executing Cross-Chain Write to Base Sepolia...",
      "🎉 SUCCESS! Market Deployed On-Chain.",
      "🔍 Tx Hash: 0xf94c2604cba0eaf0b2f2ea57ac852155da56756018fc46eecabd10125d96ef8c"
    ];

    for (let i = 0; i < sequence.length; i++) {
      await new Promise(r => setTimeout(r, 800));
      addLog(sequence[i]);
    }

    setMarkets(prev => [
      { id: Date.now(), question: "Will Ethereum flip Bitcoin market cap in 2026?", status: "New", liquidity: "$0", volume: "Zero" },
      ...prev
    ]);
    setIsCreatingMarket(false);
  };

  const triggerWorldIDVerification = async () => {
    if (isVerifyingWorldID) return;
    setIsVerifyingWorldID(true);
    setWorldIDStatus('Generating Proof...');

    const sequence = [
      "📱 MINI APP: Initializing MiniKit SDK inside World App...",
      "🌍 MINI APP: Generating Zero-Knowledge Proof of Humanity...",
      "📡 POST /cre-agent/world-id: Routing payload to Chainlink DON...",
      "🤖 WORLD ID AGENT: HTTP Trigger Intercepted Payload.",
      "🔍 WORLD ID AGENT: Verifying ZK Proof off-chain via Worldcoin API...",
      "✅ WORLD ID AGENT: Proof Validated! User is Unique Human.",
      "🚀 Executing Cross-Chain Write to Base Sepolia...",
      "🎉 SUCCESS! Sybil Resistance Achieved. Ratio lowered to 115%."
    ];

    for (let i = 0; i < sequence.length; i++) {
      await new Promise(r => setTimeout(r, 800));
      addLog(sequence[i]);
      if (i === 4) setWorldIDStatus('Verifying Off-Chain...');
    }

    setWorldIDStatus('Verified Human');
    setCollateralRatio(115);
    setVaultHealth(1.95); 
    setIsVerifyingWorldID(false);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 font-sans selection:bg-cyan-500/30 pb-12 overflow-x-hidden relative">
      {/* Tactical Grid Background */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      
      {/* Ambient Deep Space Glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-900/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-900/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="fixed top-[20%] right-[20%] w-[40%] h-[40%] bg-emerald-900/10 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Modern Edge-to-Edge Navbar */}
      <nav className="border-b border-white/[0.08] bg-[#030712]/70 backdrop-blur-2xl sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4 group cursor-pointer">
            <div className="relative">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-xl blur opacity-30 group-hover:opacity-70 transition duration-500"></div>
              <div className="relative w-11 h-11 rounded-xl bg-slate-950 flex items-center justify-center border border-white/10 shadow-xl">
                <BrainCircuit className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black tracking-tighter text-white drop-shadow-lg">SENTIENT<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">AI</span></span>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></span>
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-400/80">Oracle Network Sync</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="hidden lg:flex items-center space-x-8 mr-4 border-r border-white/10 pr-8">
               <div className="text-right">
                  <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">Deployment Zone</p>
                  <p className="text-xs font-black text-slate-200 tracking-wide">Tenderly War Room</p>
               </div>
               <div className="text-right">
                  <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">Engine Version</p>
                  <p className="text-xs font-black text-cyan-400 tracking-wide">CRE v1.1.2</p>
               </div>
            </div>
            <button 
              onClick={walletAddress ? undefined : connectWallet}
              disabled={isConnecting}
              className={`group relative px-6 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-300 flex items-center space-x-2 overflow-hidden ${
                walletAddress 
                  ? 'bg-slate-900/80 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
                  : 'bg-white text-slate-950 hover:bg-cyan-50 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-cyan-500/30'
              }`}
            >
              <Wallet className={`w-4 h-4 transition-transform group-hover:scale-110 ${walletAddress ? 'text-cyan-400' : 'text-slate-950'}`} />
              <span>
                {isConnecting ? 'Authenticating...' : 
                 walletAddress ? `${walletAddress.substring(0,6)}...${walletAddress.substring(38)}` : 
                 'Initialize Node'}
              </span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 relative z-10">
        
        {/* Top-Level Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { label: 'Total Value Secured', value: '$14.2M', color: 'emerald', icon: Database, sub: '+2.4% Active' },
            { label: 'Autonomous Agents', value: '03 Online', color: 'cyan', icon: Cpu, sub: 'System 100% Sync' },
            { label: 'Oracle DON Status', value: 'OPTIMAL', color: 'purple', icon: Radio, sub: 'Latency: 14ms' }
          ].map((stat, i) => (
            <div key={i} className={`group relative bg-slate-900/50 border border-white/[0.05] rounded-[2rem] p-6 backdrop-blur-xl overflow-hidden hover:border-${stat.color}-500/40 transition-all duration-500 shadow-2xl`}>
              <div className={`absolute -top-10 -right-10 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity transform group-hover:scale-110 duration-700 text-${stat.color}-400`}>
                <stat.icon className="w-48 h-48" />
              </div>
              <div className="flex items-center space-x-3 mb-4 relative z-10">
                <div className={`p-2 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-400 ring-1 ring-${stat.color}-500/20`}>
                  <TrendingUp className="w-4 h-4" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</p>
              </div>
              <h2 className="text-3xl font-black text-white mb-2 relative z-10 tracking-tight">{stat.value}</h2>
              <p className={`text-[10px] font-bold text-${stat.color}-400/80 flex items-center relative z-10 uppercase tracking-wider`}>
                <Sparkles className="w-3 h-3 mr-1.5" /> {stat.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Action Center - 3 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Phase 1: Vault Actuary */}
          <div className="relative group bg-slate-900/60 border border-white/[0.08] rounded-[2rem] overflow-hidden flex flex-col shadow-2xl transition-all duration-500 hover:border-cyan-500/30 hover:shadow-[0_0_40px_rgba(6,182,212,0.1)]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-600"></div>
            <div className="p-6 border-b border-white/5 bg-gradient-to-b from-white/[0.04] to-transparent flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">Vault Actuary</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.25em] mt-1">EVM Sentinel Agent</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 flex-grow flex flex-col space-y-6">
              <div className="relative p-6 rounded-3xl bg-slate-950/80 border border-white/5 overflow-hidden ring-1 ring-inset ring-white/5">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-50"></div>
                <div className="flex flex-col space-y-5 relative z-10">
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Live Health Index</p>
                    <span className={`text-5xl font-black tracking-tighter transition-colors duration-700 ${vaultHealth < 1.1 ? 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]'}`}>
                      {vaultHealth.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">System Status</p>
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-700 ${
                      riskStatus === 'Critical Risk' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      riskStatus === 'Secured' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      'bg-slate-900 text-slate-400 border border-white/10'
                    }`}>
                      {riskStatus === 'Critical Risk' && <AlertTriangle className="w-3 h-3 mr-2" />}
                      {riskStatus}
                    </span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={triggerVaultActuary}
                disabled={isUnderwriting}
                className="group relative w-full py-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(8,145,178,0.3)] hover:shadow-[0_0_30px_rgba(8,145,178,0.5)] disabled:opacity-50 mt-auto overflow-hidden active:scale-[0.98]"
              >
                <div className="flex justify-center items-center relative z-10">
                  {isUnderwriting ? <><Zap className="w-4 h-4 mr-2 animate-bounce" /> Processing WASM...</> : <><Sparkles className="w-4 h-4 mr-2" /> Simulate Crash</>}
                </div>
              </button>
            </div>
          </div>

          {/* Phase 2: Market Creator */}
          <div className="relative group bg-slate-900/60 border border-white/[0.08] rounded-[2rem] overflow-hidden flex flex-col shadow-2xl transition-all duration-500 hover:border-purple-500/30 hover:shadow-[0_0_40px_rgba(168,85,247,0.1)]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-pink-600"></div>
            <div className="p-6 border-b border-white/5 bg-gradient-to-b from-white/[0.04] to-transparent flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">Market Creator</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.25em] mt-1">Cron Engine Agent</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 flex-grow flex flex-col space-y-6">
              <div className="space-y-3 flex-grow overflow-y-auto pr-2 custom-scrollbar max-h-[220px]">
                {markets.map((market) => (
                  <div key={market.id} className="bg-slate-950/80 p-5 rounded-2xl border border-white/5 ring-1 ring-inset ring-white/5 hover:bg-slate-900 transition-colors">
                    <p className="text-xs font-bold text-slate-200 line-clamp-2 leading-relaxed">{market.question}</p>
                    <div className="flex justify-between items-center mt-4">
                      <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">Liq: <span className="text-slate-300">{market.liquidity}</span></p>
                      <span className={`px-2.5 py-1 rounded-md border text-[8px] font-black uppercase tracking-widest ${
                        market.status === 'New' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30 animate-pulse' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {market.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={triggerMarketCreator}
                disabled={isCreatingMarket}
                className="group relative w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] disabled:opacity-50 mt-auto overflow-hidden active:scale-[0.98]"
              >
                <div className="flex justify-center items-center relative z-10">
                  {isCreatingMarket ? <><Zap className="w-4 h-4 mr-2 animate-bounce" /> Proposing...</> : <><TrendingUp className="w-4 h-4 mr-2" /> Force Market</>}
                </div>
              </button>
            </div>
          </div>

          {/* Phase 3: Sybil Resistance (World ID) */}
          <div className="relative group bg-slate-900/60 border border-white/[0.08] rounded-[2rem] overflow-hidden flex flex-col shadow-2xl transition-all duration-500 hover:border-emerald-500/30 hover:shadow-[0_0_40px_rgba(16,185,129,0.1)]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
            <div className="p-6 border-b border-white/5 bg-gradient-to-b from-white/[0.04] to-transparent flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                  <Fingerprint className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">Mini App Bridge</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.25em] mt-1">HTTP Webhook Agent</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 flex-grow flex flex-col space-y-6">
              <div className="relative p-6 rounded-3xl bg-slate-950/80 border border-white/5 overflow-hidden ring-1 ring-inset ring-white/5">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-50"></div>
                <div className="flex flex-col space-y-5 relative z-10">
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Verification Status</p>
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-700 ${
                      worldIDStatus === 'Verified Human' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      worldIDStatus === 'Generating Proof...' || worldIDStatus === 'Verifying Off-Chain...' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 animate-pulse' :
                      'bg-slate-900 text-slate-400 border border-white/10'
                    }`}>
                      {worldIDStatus === 'Verified Human' && <CheckCircle2 className="w-3 h-3 mr-2" />}
                      {worldIDStatus}
                    </span>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Collateral Requirement</p>
                    <span className={`text-5xl font-black tracking-tighter transition-colors duration-700 ${collateralRatio === 115 ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]' : 'text-slate-300'}`}>
                      {collateralRatio}%
                    </span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={triggerWorldIDVerification}
                disabled={isVerifyingWorldID || worldIDStatus === 'Verified Human'}
                className="group relative w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] disabled:opacity-50 disabled:cursor-not-allowed mt-auto overflow-hidden active:scale-[0.98]"
              >
                <div className="flex justify-center items-center relative z-10">
                  {isVerifyingWorldID ? <><Zap className="w-4 h-4 mr-2 animate-bounce" /> Routing Proof...</> : 
                   worldIDStatus === 'Verified Human' ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Sybil Resistant</> : 
                   <><Fingerprint className="w-4 h-4 mr-2" /> Verify via MiniKit</>}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Global Agent Execution Terminal */}
        <div className="group bg-[#050A18]/90 border border-white/10 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)] mt-8 backdrop-blur-2xl ring-1 ring-white/5 hover:ring-white/10 transition-all duration-500">
          <div className="bg-[#0A1020] border-b border-white/5 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse mr-3 shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
              <Terminal className="w-4 h-4 text-slate-500 mr-2" />
              <span className="text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase">Chainlink CRE WASM Log</span>
            </div>
            <div className="flex space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
            </div>
          </div>
          <div className="p-6 h-64 overflow-y-auto font-mono text-[13px] bg-transparent custom-scrollbar-terminal space-y-2">
            {logs.map((log, index) => (
              <div key={index} className={`leading-relaxed tracking-tight ${
                log.includes('SUCCESS') || log.includes('✅') || log.includes('🎉') ? 'text-emerald-400 font-bold drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]' : 
                log.includes('Critical') || log.includes('⚠️') || log.includes('❌') ? 'text-amber-400' :
                log.includes('🤖') || log.includes('📱') || log.includes('🌍') ? 'text-cyan-300 mt-6 font-bold flex items-center bg-cyan-950/30 px-3 py-1.5 rounded-md border-l-2 border-cyan-500' : 
                log.includes('[SYSTEM]') ? 'text-slate-500 font-bold' :
                'text-slate-300'
              }`}>
                {log.includes('🤖') ? null : <ChevronRight className="inline-block w-3 h-3 mr-2 opacity-50" />}
                {log}
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar-terminal::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar-terminal::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }
        .custom-scrollbar-terminal::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}