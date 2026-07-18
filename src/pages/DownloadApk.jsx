import React from 'react';

const DownloadApk = () => {
  const [apkSize, setApkSize] = React.useState('21.8 MB');

  React.useEffect(() => {
    fetch('/app-release.apk', { method: 'HEAD' })
      .then((res) => {
        const contentLength = res.headers.get('content-length');
        if (contentLength) {
          const sizeBytes = parseInt(contentLength, 10);
          const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(1);
          setApkSize(`${sizeMB} MB`);
        }
      })
      .catch((err) => {
        console.error('Error fetching APK size:', err);
      });
  }, []);

  const handleDownload = () => {
    // Triggers download of the public asset app-release.apk
    const link = document.createElement('a');
    link.href = '/app-release.apk';
    link.download = 'SmartERP-Mobile.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100%', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title Header */}
      <div>
        <h1 className="text-display-lg" style={{ margin: 0, fontSize: '24px', color: 'var(--color-on-surface)' }}>Get SmartERP on Your Android Device</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--color-on-surface-variant)', fontSize: '14px' }}>
          Take your business management tools wherever you go. Direct download and quick setup.
        </p>
      </div>

      {/* Main Promo Area (Side-by-side or stacked depending on layout) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* Left Column: Premium Promotional Info */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--color-border-structural)', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--color-surface-container-low)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                <i className="fa-solid fa-mobile-screen-button fa-lg"></i>
              </div>
              <div>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-primary)', letterSpacing: '1px', textTransform: 'uppercase' }}>Mobile Application</span>
                <h2 style={{ margin: '2px 0 0', fontSize: '20px', fontWeight: '700', color: 'var(--color-on-surface)' }}>SmartERP Client v1.0.0</h2>
              </div>
            </div>

            <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
              Stay connected with your company operations in real-time. Created with high-fidelity components, our Android companion app brings all critical ERP workflows, ledger details, and voucher creation onto your pocket device.
            </p>

            {/* Feature Checkmarks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ color: '#137333', marginTop: '2px' }}><i className="fa-solid fa-circle-check"></i></div>
                <div>
                  <strong style={{ fontSize: '14px', color: 'var(--color-on-surface)', display: 'block' }}>Real-time Sync & Dashboards</strong>
                  <span style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)' }}>Track revenue, sales, and pending entries instantly.</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ color: '#137333', marginTop: '2px' }}><i className="fa-solid fa-circle-check"></i></div>
                <div>
                  <strong style={{ fontSize: '14px', color: 'var(--color-on-surface)', display: 'block' }}>Voucher Creation</strong>
                  <span style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)' }}>Draft and sync Sales, Receipts, and Payments on site.</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ color: '#137333', marginTop: '2px' }}><i className="fa-solid fa-circle-check"></i></div>
                <div>
                  <strong style={{ fontSize: '14px', color: 'var(--color-on-surface)', display: 'block' }}>Offline-first Storage</strong>
                  <span style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)' }}>Securely cache essential local ledgers and work without connection.</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleDownload}
            style={{
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              padding: '16px 24px',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              boxShadow: '0 4px 12px rgba(0, 63, 177, 0.25)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
          >
            <i className="fa-solid fa-circle-arrow-down fa-lg"></i>
            Download Android APK ({apkSize})
          </button>
        </div>

        {/* Right Column: Step-by-Step Installation Guide */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--color-border-structural)', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--color-on-surface)', borderBottom: '1px solid var(--color-border-structural)', paddingBottom: '16px' }}>
            <i className="fa-solid fa-screwdriver-wrench" style={{ marginRight: '8px', color: 'var(--color-primary)' }}></i>
            How to Install the APK
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Step 1 */}
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--color-surface-container-low)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px', flexShrink: 0 }}>
                1
              </div>
              <div style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--color-on-surface-variant)' }}>
                <strong style={{ color: 'var(--color-on-surface)', display: 'block', marginBottom: '2px' }}>Download the File</strong>
                Click the download button on the left to obtain the <code>SmartERP-Mobile.apk</code> package.
              </div>
            </div>

            {/* Step 2 */}
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--color-surface-container-low)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px', flexShrink: 0 }}>
                2
              </div>
              <div style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--color-on-surface-variant)' }}>
                <strong style={{ color: 'var(--color-on-surface)', display: 'block', marginBottom: '2px' }}>Enable Unknown Sources</strong>
                Go to Android <strong>Settings &gt; Security (or Apps & Notifications)</strong> and enable <strong>"Install Unknown Apps"</strong> for your web browser or file manager.
              </div>
            </div>

            {/* Step 3 */}
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--color-surface-container-low)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px', flexShrink: 0 }}>
                3
              </div>
              <div style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--color-on-surface-variant)' }}>
                <strong style={{ color: 'var(--color-on-surface)', display: 'block', marginBottom: '2px' }}>Launch Installer</strong>
                Open the downloaded APK from your notifications or your device's <strong>Downloads</strong> folder, then tap <strong>"Install"</strong>.
              </div>
            </div>

            {/* Step 4 */}
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--color-surface-container-low)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px', flexShrink: 0 }}>
                4
              </div>
              <div style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--color-on-surface-variant)' }}>
                <strong style={{ color: 'var(--color-on-surface)', display: 'block', marginBottom: '2px' }}>Log In</strong>
                Open the SmartERP app, enter your enterprise server credentials, and access your database workspace.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DownloadApk;
