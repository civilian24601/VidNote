/**
 * Video Playback Test Script
 * 
 * This script creates a standalone HTML page with a video player 
 * for testing video playback from a Supabase URL.
 * 
 * Run with: node scripts/test-video-playback.js [VIDEO_URL]
 * Then open the generated test-player.html file in your browser
 */

const fs = require('fs');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Get command line arguments
const args = process.argv.slice(2);
let videoUrl = args[0];

async function createTestPage() {
  // If no URL provided, try to get a test URL from Supabase
  if (!videoUrl) {
    console.log('No URL provided, attempting to get a test video URL from Supabase...');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials not found in environment variables');
      console.error('Please provide a video URL as an argument: node scripts/test-video-playback.js [VIDEO_URL]');
      process.exit(1);
    }
    
    try {
      // Initialize Supabase
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // List files in videos bucket
      const { data, error } = await supabase.storage.from('videos').list('public');
      
      if (error) {
        console.error('Error listing files:', error.message);
        console.error('Please provide a video URL as an argument instead');
        process.exit(1);
      }
      
      if (data && data.length > 0) {
        // Find the first video file
        const videoFile = data.find(file => 
          file.name.endsWith('.mp4') || 
          file.name.endsWith('.webm') || 
          file.name.endsWith('.mov')
        );
        
        if (videoFile) {
          const { data: urlData } = supabase.storage
            .from('videos')
            .getPublicUrl(`public/${videoFile.name}`);
          
          videoUrl = urlData.publicUrl;
          console.log(`Found video: ${videoFile.name}`);
          console.log(`Generated URL: ${videoUrl}`);
        } else {
          console.error('No video files found in the bucket');
          console.error('Please provide a video URL as an argument');
          process.exit(1);
        }
      } else {
        console.error('No files found in the bucket');
        console.error('Please provide a video URL as an argument');
        process.exit(1);
      }
    } catch (err) {
      console.error('Error connecting to Supabase:', err.message);
      console.error('Please provide a video URL as an argument');
      process.exit(1);
    }
  }
  
  if (!videoUrl) {
    console.error('No video URL available. Please provide one as an argument.');
    process.exit(1);
  }
  
  // Create test HTML page
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Video Playback Test</title>
  <link rel="stylesheet" href="https://cdn.plyr.io/3.7.8/plyr.css" />
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
      color: #333;
    }
    h1 {
      text-align: center;
      margin-bottom: 30px;
    }
    .player-container {
      background-color: #000;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 30px;
    }
    .test-results {
      background-color: #fff;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 30px;
    }
    .test-results h2 {
      margin-top: 0;
    }
    .test-item {
      margin-bottom: 10px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }
    .success {
      color: green;
    }
    .error {
      color: red;
    }
    .warning {
      color: orange;
    }
    .log-output {
      background-color: #f8f8f8;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 15px;
      font-family: monospace;
      white-space: pre-wrap;
      overflow-x: auto;
      max-height: 300px;
      overflow-y: auto;
    }
    .buttons {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }
    button {
      padding: 8px 16px;
      background-color: #4a65ad;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    button:hover {
      background-color: #3a5199;
    }
    .url-display {
      word-break: break-all;
      background-color: #f8f8f8;
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 20px;
      border: 1px solid #ddd;
    }
    .direct-video {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
    }
    .debug-info {
      margin-top: 20px;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <h1>Video Playback Test</h1>
  
  <div class="url-display">
    Testing URL: <strong id="video-url">${videoUrl}</strong>
  </div>
  
  <div class="buttons">
    <button id="check-url">Check URL Headers</button>
    <button id="retry-load">Reload Player</button>
    <button id="clear-logs">Clear Logs</button>
  </div>
  
  <div class="test-results">
    <h2>Test Results</h2>
    <div id="url-test-results" class="test-item">URL Test: <span class="pending">Pending</span></div>
    <div id="format-test-results" class="test-item">Format Test: <span class="pending">Pending</span></div>
    <div id="cors-test-results" class="test-item">CORS Test: <span class="pending">Pending</span></div>
    <div id="player-test-results" class="test-item">Player Test: <span class="pending">Pending</span></div>
  </div>
  
  <div class="player-container">
    <video id="player" playsinline controls>
      <source src="${videoUrl}" type="video/mp4" />
      <source src="${videoUrl}" type="video/webm" />
      <source src="${videoUrl}" type="video/ogg" />
      Your browser does not support the video tag.
    </video>
  </div>
  
  <h2>Debug Logs</h2>
  <div class="log-output" id="log-output"></div>
  
  <div class="direct-video">
    <h2>Fallback: Direct Video Element</h2>
    <p>If the Plyr player doesn't work, this basic video element might help isolate the issue:</p>
    <video width="100%" controls>
      <source src="${videoUrl}" type="video/mp4">
      Your browser does not support the video tag.
    </video>
  </div>
  
  <div class="debug-info">
    <p>Browser: <span id="browser-info"></span></p>
    <p>Generated: ${new Date().toISOString()}</p>
  </div>
  
  <script src="https://cdn.plyr.io/3.7.8/plyr.polyfilled.js"></script>
  <script>
    // Get elements
    const logOutput = document.getElementById('log-output');
    const urlTestResults = document.getElementById('url-test-results');
    const formatTestResults = document.getElementById('format-test-results');
    const corsTestResults = document.getElementById('cors-test-results');
    const playerTestResults = document.getElementById('player-test-results');
    const videoUrl = document.getElementById('video-url').textContent;
    const browserInfo = document.getElementById('browser-info');
    
    // Display browser info
    browserInfo.textContent = navigator.userAgent;
    
    // Custom logging
    function log(message, type = 'info') {
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
      const entry = document.createElement('div');
      entry.classList.add(type);
      entry.textContent = \`[\${timestamp}] [\${type.toUpperCase()}] \${message}\`;
      logOutput.appendChild(entry);
      logOutput.scrollTop = logOutput.scrollHeight;
      console[type === 'error' ? 'error' : type === 'warning' ? 'warn' : 'log'](message);
    }
    
    // Clear logs
    document.getElementById('clear-logs').addEventListener('click', () => {
      logOutput.innerHTML = '';
      log('Logs cleared');
    });
    
    // URL check
    async function checkUrl() {
      log('Checking URL: ' + videoUrl);
      
      try {
        const response = await fetch(videoUrl, { method: 'HEAD' });
        const headers = {};
        response.headers.forEach((value, name) => {
          headers[name] = value;
        });
        
        log('URL Status: ' + response.status + ' ' + response.statusText);
        log('Headers: ' + JSON.stringify(headers, null, 2));
        
        if (response.ok) {
          urlTestResults.innerHTML = 'URL Test: <span class="success">Success ✓</span>';
        } else {
          urlTestResults.innerHTML = \`URL Test: <span class="error">Failed ✗ (Status \${response.status})</span>\`;
        }
        
        // Check content type
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('video/')) {
          formatTestResults.innerHTML = \`Format Test: <span class="success">Success ✓ (\${contentType})</span>\`;
        } else {
          formatTestResults.innerHTML = \`Format Test: <span class="warning">Warning ⚠ (Content-Type: \${contentType || 'not specified'})</span>\`;
        }
        
        // Check CORS headers
        const corsHeader = response.headers.get('access-control-allow-origin');
        if (corsHeader) {
          corsTestResults.innerHTML = \`CORS Test: <span class="success">Success ✓ (\${corsHeader})</span>\`;
        } else {
          corsTestResults.innerHTML = \`CORS Test: <span class="warning">Warning ⚠ (No CORS headers)</span>\`;
        }
        
        return response.ok;
      } catch (error) {
        log('Error checking URL: ' + error.message, 'error');
        urlTestResults.innerHTML = \`URL Test: <span class="error">Failed ✗ (\${error.message})</span>\`;
        return false;
      }
    }
    
    // Check URL button
    document.getElementById('check-url').addEventListener('click', checkUrl);
    
    // Initialize player
    let player;
    function initPlayer() {
      log('Initializing Plyr player');
      
      if (player) {
        player.destroy();
      }
      
      try {
        player = new Plyr('#player', {
          debug: true,
          muted: false
        });
        
        player.on('ready', event => {
          log('Player is ready');
          playerTestResults.innerHTML = 'Player Test: <span class="success">Ready ✓</span>';
        });
        
        player.on('loadedmetadata', () => {
          log('Video metadata loaded, duration: ' + player.duration);
        });
        
        player.on('loadeddata', () => {
          log('Video data loaded');
        });
        
        player.on('canplay', () => {
          log('Video can play');
          playerTestResults.innerHTML = 'Player Test: <span class="success">Can Play ✓</span>';
        });
        
        player.on('error', event => {
          const videoEl = document.querySelector('video');
          const errorDetails = videoEl.error;
          
          log('Player error event', 'error');
          
          if (errorDetails) {
            let errorMessage = 'Unknown error';
            
            switch(errorDetails.code) {
              case 1:
                errorMessage = 'MEDIA_ERR_ABORTED: Fetching process aborted by user';
                break;
              case 2:
                errorMessage = 'MEDIA_ERR_NETWORK: Network error while loading media';
                break;
              case 3:
                errorMessage = 'MEDIA_ERR_DECODE: Media decoding error';
                break;
              case 4:
                errorMessage = 'MEDIA_ERR_SRC_NOT_SUPPORTED: Media format not supported';
                break;
            }
            
            log(\`Video error: \${errorMessage} (code \${errorDetails.code})\`, 'error');
            playerTestResults.innerHTML = \`Player Test: <span class="error">Error ✗ (\${errorMessage})</span>\`;
          }
        });
        
      } catch (error) {
        log('Error initializing player: ' + error.message, 'error');
        playerTestResults.innerHTML = \`Player Test: <span class="error">Initialization Error ✗</span>\`;
      }
    }
    
    // Reload player button
    document.getElementById('retry-load').addEventListener('click', async () => {
      log('Reloading player');
      initPlayer();
    });
    
    // Run tests on load
    window.addEventListener('load', async () => {
      await checkUrl();
      initPlayer();
    });
  </script>
</body>
</html>
  `;
  
  // Write the HTML file
  fs.writeFileSync('test-player.html', html);
  console.log('Created test-player.html with URL:', videoUrl);
  console.log('Open this file in your browser to test video playback');
}

createTestPage().catch(error => {
  console.error('Error creating test page:', error);
  process.exit(1);
});