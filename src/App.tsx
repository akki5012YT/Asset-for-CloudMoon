import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Server, 
  Play, 
  Copy, 
  Check, 
  Download, 
  RefreshCw, 
  Terminal, 
  Bug, 
  Code2, 
  ShieldAlert, 
  ArrowRight, 
  Sparkles,
  ExternalLink,
  Info,
  Layers,
  Globe2
} from 'lucide-react';
import { FIXED_PORTAL_HTML, ORIGINAL_PORTAL_HTML } from './data/portalData';

interface ApiStatus {
  name: string;
  url: string;
  status: 'pending' | 'online' | 'offline';
  latency: number | null;
  code?: string;
  message?: string;
}

const API_ENDPOINTS = [
  { name: 'Main Batata API', url: 'https://api.cloudmoon.cloudbatata.com' },
  { name: 'Prod App API', url: 'https://api.prod.cloudmoonapp.com' },
  { name: 'Prod Geometry API', url: 'https://api.prod.geometry.today' },
  { name: 'AWS Lambda Backup', url: 'https://hrz5zfjq02.execute-api.us-east-1.amazonaws.com' },
  { name: 'ViewOnCloud API', url: 'https://api.prod.viewoncloud.com' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'apis' | 'simulator' | 'code' | 'diff'>('diagnosis');
  const [apiStatuses, setApiStatuses] = useState<ApiStatus[]>(
    API_ENDPOINTS.map(api => ({ ...api, status: 'pending', latency: null }))
  );
  const [isProbing, setIsProbing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Simulator State
  const [simScenario, setSimScenario] = useState<'40002' | '40001' | '50000' | '4' | '0'>('40002');
  const [simAlertBox, setSimAlertBox] = useState<{ mode: 'orig' | 'fixed'; text: string } | null>(null);

  // Probe APIs on mount
  useEffect(() => {
    probeApis();
  }, []);

  const probeApis = async () => {
    setIsProbing(true);
    const updated = await Promise.all(
      API_ENDPOINTS.map(async (api) => {
        const start = performance.now();
        try {
          const res = await fetch(`${api.url}/_ping`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(4000)
          });
          const latency = Math.round(performance.now() - start);
          if (res.ok) {
            const data = await res.json().catch(() => ({}));
            return {
              ...api,
              status: 'online' as const,
              latency,
              code: data.code || '0',
              message: data.message || 'pong'
            };
          } else {
            return { ...api, status: 'offline' as const, latency, message: `HTTP ${res.status}` };
          }
        } catch (e: any) {
          const latency = Math.round(performance.now() - start);
          return { ...api, status: 'offline' as const, latency, message: e.name === 'TimeoutError' ? 'タイムアウト' : '接続拒否/CORS' };
        }
      })
    );
    setApiStatuses(updated);
    setIsProbing(false);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(FIXED_PORTAL_HTML);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadCode = () => {
    const blob = new Blob([FIXED_PORTAL_HTML], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'portal-261014.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const runSimulator = (mode: 'orig' | 'fixed') => {
    const scenarioData: Record<string, any> = {
      '40002': { code: 40002, data: {}, message: '' },
      '40001': { code: 40001, data: {}, message: '' },
      '50000': { code: 50000, data: {}, message: '' },
      '4': { code: 4, data: {}, message: '' },
      '0': { code: 0, data: { sid: 'session_demo_98765', android_instance_id: 'inst_abc123' }, message: 'success' }
    };

    const res = scenarioData[simScenario];

    if (mode === 'orig') {
      // Original logic in portal-261014.html line 160:
      // alert("Fail: " + res.message);
      const text = `Fail: ${res.message}`;
      setSimAlertBox({ mode: 'orig', text });
    } else {
      // Fixed logic:
      const failMsg = res.message || res.msg || 
        (res.code === 40001 ? '認証トークンの有効期限切れ（再ログインしてください）' :
         res.code === 40002 ? '未ログインまたはセッション無効 (Code: 40002)' :
         res.code === 4 ? 'サーバーメンテナンス中です (Code: 4)' :
         res.code === 50000 ? 'クラウド端末が満杯または起動不可 (Code: 50000)' :
         `エラー (Code: ${res.code})`);
      setSimAlertBox({ mode: 'fixed', text: `Fail: ${failMsg}` });
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col font-sans">
      {/* Top Banner */}
      <header className="border-b border-slate-800 bg-[#1e293b]/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Bug className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-white tracking-tight">CloudMoon Debugger & Fixer</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
                  原因特定済み
                </span>
              </div>
              <p className="text-xs text-slate-400">
                portal-261014.html の「Fail:」空文字エラー解析 ＆ 修正完了版コード提供
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'コピー完了' : '修正コードをコピー'}
            </button>
            <button
              onClick={handleDownloadCode}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#8b5cf6] hover:bg-[#7c3aed] text-xs font-semibold text-white shadow-lg shadow-purple-500/20 transition"
            >
              <Download className="w-4 h-4" />
              修正済みHTMLを保存
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 border-t border-slate-800/60 overflow-x-auto">
          {[
            { id: 'diagnosis', label: '原因解明サマリー', icon: ShieldAlert },
            { id: 'simulator', label: '「Fail:」再現シミュレーター', icon: Play },
            { id: 'apis', label: 'API死活状況 (5系統)', icon: Server },
            { id: 'diff', label: 'コード変更差分 (Diff)', icon: Layers },
            { id: 'code', label: '修正完了HTMLコード', icon: Code2 },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
                  isActive 
                    ? 'border-[#8b5cf6] text-white bg-purple-500/10' 
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">

        {/* TAB 1: DIAGNOSIS */}
        {activeTab === 'diagnosis' && (
          <div className="space-y-6">
            {/* Core Answer Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-[#1e293b] border border-purple-500/30 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400 shrink-0">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    ご質問の「なぜ『Fail:』だけで原因が書かれないのか？」の決定的一因
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    ユーザー様の予想通り、<span className="text-purple-400 font-mono font-semibold">portal-261014.html</span> の終盤にある関数 <span className="text-emerald-400 font-mono font-semibold">handlePlay()</span> に直接の原因がありました！
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-4 mt-3">
                    <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30">
                      <div className="flex items-center gap-2 text-xs font-bold text-red-400 mb-2 uppercase tracking-wide">
                        <XCircle className="w-4 h-4" /> 該当コード (難読化解除後)
                      </div>
                      <pre className="text-xs font-mono text-red-200 bg-black/40 p-3 rounded-lg overflow-x-auto">
{`const _0x284285 = await this.customFetch("/phone/connect", ...);
if (_0x284285.code === 0 && _0x284285.data) {
  // 接続成功処理
} else {
  alert("Fail: " + _0x284285["message"]); // ← ココ！
}`}
                      </pre>
                      <p className="text-xs text-red-300/90 mt-2">
                        CloudMoonのAPIサーバーはエラー発生時、<code className="text-yellow-300 font-bold font-mono">&#123; "code": 40002, "data": &#123;&#125;, "message": "" &#125;</code> のように <strong className="text-white">message に空文字 <code className="text-yellow-300 font-mono">""</code></strong> を返します。<br />
                        その結果、<code className="text-white font-mono">"Fail: " + ""</code> と連結されて、ダイアログに <strong className="text-white">「Fail: 」</strong> だけが表示されていたのです。
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-2 uppercase tracking-wide">
                        <CheckCircle2 className="w-4 h-4" /> 修正後の処理
                      </div>
                      <pre className="text-xs font-mono text-emerald-200 bg-black/40 p-3 rounded-lg overflow-x-auto">
{`const failMsg = _0x284285.message || _0x284285.msg ||
  (_0x284285.code === 40001 ? "認証トークン期限切れ" :
   _0x284285.code === 40002 ? "未ログインまたはセッション無効 (40002)" :
   _0x284285.code === 4 ? "サーバーメンテナンス中" :
   \`エラーコード: \${_0x284285.code}\`);
console.error("CloudMoon API Response:", _0x284285);
alert("Fail: " + failMsg);`}
                      </pre>
                      <p className="text-xs text-emerald-300/90 mt-2">
                        空文字の場合は <code className="text-white font-mono">msg</code> やステータスコードを分解して日本語の理由を必ず明示し、F12コンソールにも詳細オブジェクトを出力するように修正しました。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Why CloudMoon Stopped Working All at Once */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                前まで動いていたCloudMoonが一斉に停止した「5大原因」
              </h3>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-bold">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px]">1</span>
                    旧バージョン（260909）の強制サービス終了
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    リポジトリの履歴にある通り、公式側で <code className="text-purple-300">260909.svg</code> がサービス終了となり旧APIの受付が遮断されました。そのため261014への切り替えが必要になりました。
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-bold">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px]">2</span>
                    未認証コード「40002」の未処理
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    旧コードの <code className="text-purple-300">customFetch</code> は <code className="text-purple-300">40001</code> のみ再ログインさせていましたが、新APIが返す <code className="text-purple-300">40002</code>（未認証）を無視していたため、認証切れでプレイボタンを押すと「Fail: 」に直行していました。
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-bold">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px]">3</span>
                    サーバーID「23 (US East)」の固定送信
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    <code className="text-purple-300">localStorage</code> の <code className="text-purple-300">selectedServer</code> が未選択の時、常に「23 (米国東部)」が送信されていました。日本・アジアから接続すると空きスロットがなく拒絶されるケースが発生します。
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-bold">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px]">4</span>
                    HTMLのタグ閉じミス (Line 154)
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    日本語化コミット時に <code className="text-red-300">順番/span&gt;</code> となり <code className="text-red-300">&lt;</code> が抜けていました。待機列（Queue）モーダルのDOMが壊れ、待機列遷移時にエラーを起こしていました。
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-bold">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px]">5</span>
                    遷移先ファイル形式の不整合
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    起動後の遷移先が <code className="text-purple-300">./play-261014.svg</code> に設定されていますが、SVG内のsrcdoc iframeから相対パス遷移をかけると origin が異なり遮断されるケースがあります。
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-300 font-bold">
                      <Check className="w-4 h-4" />
                      修正済みファイルを提供中
                    </div>
                    <p className="text-slate-300 leading-relaxed mt-1">
                      本ツールでは、上記すべて（エラーメッセージの日本語明示、40002処理、HTMLタグ修復、F12デバッグログ追加）を反映した最新コードを生成済みです。
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('code')}
                    className="mt-2 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition shadow"
                  >
                    修正コードを確認する <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Action Cards */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">エラーの挙動を体感・テストする</h4>
                  <p className="text-xs text-slate-400 mt-0.5">「Fail:」が何を出していたのかシミュレーションで確認</p>
                </div>
                <button
                  onClick={() => setActiveTab('simulator')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition"
                >
                  シミュレーターへ
                </button>
              </div>

              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">公式APIサーバーの稼働状態を確認</h4>
                  <p className="text-xs text-slate-400 mt-0.5">全5系統のCloudMoon APIゲートウェイの死活と応答速度</p>
                </div>
                <button
                  onClick={() => setActiveTab('apis')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-lg transition"
                >
                  APIステータス確認
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Play className="w-5 h-5 text-purple-400" />
                    「Fail:」エラー再現 ＆ 修正コード比較シミュレーター
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    APIサーバーが返す各種レスポンスに対して、コード変更前（元のコード）と変更後で何が違うかをテストできます。
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">シミュレートするAPI状況:</span>
                  <select
                    value={simScenario}
                    onChange={(e) => {
                      setSimScenario(e.target.value as any);
                      setSimAlertBox(null);
                    }}
                    className="bg-slate-800 border border-slate-700 text-xs font-semibold rounded-lg px-3 py-2 text-white outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="40002">Code 40002: 未ログイン / セッション無効 (今回の一斉停止の原因)</option>
                    <option value="40001">Code 40001: 認証トークン期限切れ</option>
                    <option value="50000">Code 50000: クラウドノード満杯</option>
                    <option value="4">Code 4: サーバーメンテナンス中</option>
                    <option value="0">Code 0: 成功 (クラウド起動)</option>
                  </select>
                </div>
              </div>

              {/* Simulation Testing Buttons */}
              <div className="grid md:grid-cols-2 gap-6 pt-2">
                {/* Before: Original Code */}
                <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4" /> 元の portal-261014.html の処理
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-400 font-mono">
                      alert("Fail: " + res.message)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    空文字の <code className="text-slate-300">res.message</code> をそのまま表示するため、原因が分かりません。
                  </p>
                  <button
                    onClick={() => runSimulator('orig')}
                    className="w-full py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    元のコードでアラートを実行してみる
                  </button>
                </div>

                {/* After: Fixed Code */}
                <div className="p-5 rounded-xl bg-slate-800/40 border border-emerald-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> 修正後の処理
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                      エラー理由・コード・日本語を安全にフォールバック
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    ステータスコードを識別し、ユーザーに何が原因かを明瞭に伝えます。
                  </p>
                  <button
                    onClick={() => runSimulator('fixed')}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    修正後のコードでアラートを実行してみる
                  </button>
                </div>
              </div>

              {/* Simulated Dialog Output */}
              {simAlertBox && (
                <div className="mt-4 p-4 rounded-xl bg-black/60 border border-purple-500/40 animate-fade-in space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-purple-300 flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-purple-400" />
                      ブラウザの alert() ダイアログの表示結果:
                    </span>
                    <button
                      onClick={() => setSimAlertBox(null)}
                      className="text-slate-500 hover:text-slate-300 text-xs"
                    >
                      閉じる
                    </button>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        simAlertBox.mode === 'orig' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {simAlertBox.mode === 'orig' ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400">ダイアログ表示テキスト:</div>
                        <div className="text-sm font-mono font-bold text-white mt-0.5">
                          {simAlertBox.text}
                          {simAlertBox.mode === 'orig' && simAlertBox.text === 'Fail: ' && (
                            <span className="text-red-400 font-sans font-normal ml-2 text-xs">
                              ← （「Fail:」の後ろが完全に空白！）
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold ${
                      simAlertBox.mode === 'orig' 
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {simAlertBox.mode === 'orig' ? '原因不明のまま' : '原因が明瞭に表示される'}
                    </span>
                  </div>
                </div>
              )}

              {/* Raw API Response View */}
              <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-2">
                  <Code2 className="w-3.5 h-3.5" />
                  CloudMoon API サーバーの生レスポンス (JSON):
                </span>
                <pre className="text-xs font-mono bg-black/50 p-3 rounded-lg text-amber-200 border border-slate-800 overflow-x-auto">
{JSON.stringify(
  simScenario === '40002' ? { code: 40002, data: {}, message: "" } :
  simScenario === '40001' ? { code: 40001, data: {}, message: "" } :
  simScenario === '50000' ? { code: 50000, data: {}, message: "" } :
  simScenario === '4' ? { code: 4, data: {}, message: "" } :
  { code: 0, data: { sid: "session_demo_98765", android_instance_id: "inst_abc123" }, message: "success" },
  null,
  2
)}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: API PROBE */}
        {activeTab === 'apis' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Globe2 className="w-5 h-5 text-indigo-400" />
                    CloudMoon バックエンド API ゲートウェイ 死活監視
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    portal-261014.html 内で自動プローブされる全5箇所のAPIホストへ ping を送信し、現在の応答状況を計測します。
                  </p>
                </div>

                <button
                  onClick={probeApis}
                  disabled={isProbing}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isProbing ? 'animate-spin' : ''}`} />
                  {isProbing ? '再プローブ中...' : '再診断を実行'}
                </button>
              </div>

              <div className="grid gap-3">
                {apiStatuses.map((api, idx) => (
                  <div
                    key={api.url}
                    className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-wrap items-center justify-between gap-4 hover:border-slate-600 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full shrink-0 ${
                        api.status === 'online' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' :
                        api.status === 'offline' ? 'bg-red-400 shadow-[0_0_8px_#f87171]' :
                        'bg-amber-400 animate-pulse'
                      }`} />
                      <div>
                        <div className="font-bold text-sm text-white flex items-center gap-2">
                          {api.name}
                          {idx === 0 && (
                            <span className="text-[10px] px-2 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono">
                              優先メイン
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-mono text-slate-400 mt-0.5">{api.url}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono">
                      {api.latency !== null && (
                        <span className={`px-2 py-1 rounded text-xs ${
                          api.latency < 250 ? 'bg-emerald-500/10 text-emerald-400' :
                          api.latency < 800 ? 'bg-amber-500/10 text-amber-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>
                          {api.latency} ms
                        </span>
                      )}

                      <div className="text-right">
                        <span className={`font-bold ${
                          api.status === 'online' ? 'text-emerald-400' :
                          api.status === 'offline' ? 'text-red-400' :
                          'text-amber-400'
                        }`}>
                          {api.status === 'online' ? '稼働中 (Online)' :
                           api.status === 'offline' ? '接続不可 / 要プロキシ' : '検査中...'}
                        </span>
                        {api.message && (
                          <div className="text-[11px] text-slate-400">
                            応答: {api.message}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-slate-300 space-y-1">
                <span className="font-bold text-purple-300">💡 プローブの仕組み:</span>
                <p>
                  portal-261014.html では起動時に各APIの <code className="text-white font-mono">/_ping</code> へ同時リクエストを送り、一番早く 200 OK を返したサーバーをそのセッションの接続先として自動採用します。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DIFF VIEWER */}
        {activeTab === 'diff' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-400" />
                  コード修正箇所の精密差分 (Diff)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  元の <span className="font-mono text-purple-300">portal-261014.html</span> と修正版の重要な差分をわかりやすく対比しています。
                </p>
              </div>

              {/* Diff Block 1: Fail: Alert */}
              <div className="rounded-xl border border-slate-700 overflow-hidden text-xs">
                <div className="px-4 py-2.5 bg-slate-800 font-bold text-slate-200 border-b border-slate-700 flex items-center justify-between">
                  <span>差分 ①: handlePlay 内のエラーアラート空文字問題の解消</span>
                  <span className="text-[10px] text-purple-400 font-mono">Core Fix</span>
                </div>
                <div className="p-3 bg-red-950/20 border-b border-red-900/30 text-red-300 font-mono flex items-start gap-3">
                  <span className="text-red-500 font-bold select-none">-</span>
                  <code>alert(_0x2be7ed(0x1f3) + _0x284285[_0x2be7ed(0x25f)])</code>
                </div>
                <div className="p-3 bg-emerald-950/20 text-emerald-300 font-mono flex items-start gap-3">
                  <span className="text-emerald-500 font-bold select-none">+</span>
                  <div>
                    <code>{'const _err = _0x284285[_0x2be7ed(0x25f)] || _0x284285["msg"] || (_0x284285[_0x2be7ed(0x2f8)] === 40001 ? "認証トークンの期限切れ（再ログインしてください）" : _0x284285[_0x2be7ed(0x2f8)] === 40002 ? "セッション無効/未認証 (Code: 40002)" : _0x284285[_0x2be7ed(0x2f8)] === 4 ? "サーバーメンテナンス中" : "エラー (Code: " + _0x284285[_0x2be7ed(0x2f8)] + ")");'}</code>
                    <br />
                    <code>{'console.error("[CloudMoon Play Error]", _0x284285);'}</code>
                    <br />
                    <code>{'alert(_0x2be7ed(0x1f3) + _err);'}</code>
                  </div>
                </div>
              </div>

              {/* Diff Block 2: 40002 in customFetch */}
              <div className="rounded-xl border border-slate-700 overflow-hidden text-xs">
                <div className="px-4 py-2.5 bg-slate-800 font-bold text-slate-200 border-b border-slate-700 flex items-center justify-between">
                  <span>差分 ②: customFetch での未認証コード 40002 のキャッチ</span>
                  <span className="text-[10px] text-purple-400 font-mono">Authentication Fix</span>
                </div>
                <div className="p-3 bg-red-950/20 border-b border-red-900/30 text-red-300 font-mono flex items-start gap-3">
                  <span className="text-red-500 font-bold select-none">-</span>
                  <code>if (_0x3ffb90 && String(_0x3ffb90["code"]) === "40001") &#123; this.signOut(false); throw new Error("Unauthorized"); &#125;</code>
                </div>
                <div className="p-3 bg-emerald-950/20 text-emerald-300 font-mono flex items-start gap-3">
                  <span className="text-emerald-500 font-bold select-none">+</span>
                  <code>if (_0x3ffb90 && (String(_0x3ffb90["code"]) === "40001" || String(_0x3ffb90["code"]) === "40002")) &#123; this.signOut(false); throw new Error("Unauthorized"); &#125;</code>
                </div>
              </div>

              {/* Diff Block 3: HTML typo */}
              <div className="rounded-xl border border-slate-700 overflow-hidden text-xs">
                <div className="px-4 py-2.5 bg-slate-800 font-bold text-slate-200 border-b border-slate-700 flex items-center justify-between">
                  <span>差分 ③: HTML構文エラーの修正 (Line 154)</span>
                  <span className="text-[10px] text-purple-400 font-mono">HTML Tag Fix</span>
                </div>
                <div className="p-3 bg-red-950/20 border-b border-red-900/30 text-red-300 font-mono flex items-start gap-3">
                  <span className="text-red-500 font-bold select-none">-</span>
                  <code>&lt;span class="..."&gt;順番/span&gt;</code>
                </div>
                <div className="p-3 bg-emerald-950/20 text-emerald-300 font-mono flex items-start gap-3">
                  <span className="text-emerald-500 font-bold select-none">+</span>
                  <code>&lt;span class="..."&gt;順番&lt;/span&gt;</code>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: FIXED CODE */}
        {activeTab === 'code' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-emerald-400" />
                    修正完了版 portal-261014.html コード
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    全修正を施した完成版コードです。コピーまたはダウンロードして、GitHubの <code className="text-purple-300">portal-261014.html</code> を上書きしてください。
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700 transition"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'コピーしました！' : '全文をコピー'}
                  </button>
                  <button
                    onClick={handleDownloadCode}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#8b5cf6] hover:bg-[#7c3aed] text-xs font-bold text-white shadow-lg shadow-purple-500/20 transition"
                  >
                    <Download className="w-4 h-4" />
                    ファイルをダウンロード
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute top-3 right-3 text-xs text-slate-400 font-mono bg-black/60 px-2.5 py-1 rounded">
                  49,321 bytes
                </div>
                <textarea
                  readOnly
                  value={FIXED_PORTAL_HTML}
                  rows={20}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 leading-relaxed outline-none focus:border-purple-500 transition select-all"
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-300 space-y-2">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  GitHub への反映手順:
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                  <li>上の「修正済みHTMLを保存」ボタンを押すか、「全文をコピー」をクリックします。</li>
                  <li>GitHub のリポジトリ <code className="text-purple-300">akki5012YT/CloudMoon</code> を開きます。</li>
                  <li><code className="text-purple-300">portal-261014.html</code> を開き、鉛筆アイコン（Edit）をクリックして内容を上書き貼り付けします。</li>
                  <li>「Commit changes」をクリックして保存すれば即時反映されます。</li>
                </ol>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500 bg-slate-950">
        CloudMoon Debugger & Diagnostic Engine &middot; Real-time analysis for portal-261014.html
      </footer>
    </div>
  );
}
