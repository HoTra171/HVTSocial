/**
 * Debug Environment Variables
 * This component shows what environment variables were baked into the build
 */

export default function DebugEnv() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const wsUrl = import.meta.env.VITE_WS_URL;
  const mode = import.meta.env.MODE;
  const dev = import.meta.env.DEV;
  const prod = import.meta.env.PROD;

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'monospace',
      backgroundColor: '#f5f5f5',
      margin: '20px'
    }}>
      <h1>🔍 Environment Variables Debug</h1>

      <h2>Build-time Environment:</h2>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr style={{ backgroundColor: '#ddd' }}>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #999' }}>Variable</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #999' }}>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '10px', border: '1px solid #999' }}>VITE_API_URL</td>
            <td style={{
              padding: '10px',
              border: '1px solid #999',
              backgroundColor: apiUrl?.includes('localhost') ? '#ffcccc' : '#ccffcc',
              fontWeight: 'bold'
            }}>
              {apiUrl || '❌ UNDEFINED'}
            </td>
          </tr>
          <tr>
            <td style={{ padding: '10px', border: '1px solid #999' }}>VITE_WS_URL</td>
            <td style={{ padding: '10px', border: '1px solid #999' }}>
              {wsUrl || '❌ UNDEFINED'}
            </td>
          </tr>
          <tr>
            <td style={{ padding: '10px', border: '1px solid #999' }}>MODE</td>
            <td style={{ padding: '10px', border: '1px solid #999' }}>{mode}</td>
          </tr>
          <tr>
            <td style={{ padding: '10px', border: '1px solid #999' }}>DEV</td>
            <td style={{ padding: '10px', border: '1px solid #999' }}>{dev ? 'true' : 'false'}</td>
          </tr>
          <tr>
            <td style={{ padding: '10px', border: '1px solid #999' }}>PROD</td>
            <td style={{ padding: '10px', border: '1px solid #999' }}>{prod ? 'true' : 'false'}</td>
          </tr>
        </tbody>
      </table>

      <h2>Expected Values:</h2>
      <ul>
        <li>VITE_API_URL should be: <strong>https://hvtsocial-backend.onrender.com</strong></li>
        <li>VITE_WS_URL should be: <strong>https://hvtsocial-backend.onrender.com</strong></li>
        <li>MODE should be: <strong>production</strong></li>
      </ul>

      {apiUrl?.includes('localhost') && (
        <div style={{
          backgroundColor: '#ffcccc',
          padding: '15px',
          marginTop: '20px',
          border: '2px solid red',
          borderRadius: '5px'
        }}>
          <h3>⚠️ WARNING: Using localhost!</h3>
          <p>The build is using localhost instead of the production backend URL.</p>
          <p><strong>This means environment variables were NOT loaded during build.</strong></p>
        </div>
      )}

      {!apiUrl && (
        <div style={{
          backgroundColor: '#ffcccc',
          padding: '15px',
          marginTop: '20px',
          border: '2px solid red',
          borderRadius: '5px'
        }}>
          <h3>❌ ERROR: VITE_API_URL is undefined!</h3>
          <p>Environment variable was not set during build.</p>
        </div>
      )}
    </div>
  );
}
