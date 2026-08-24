import http from 'http';

function checkUrl(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          url,
          status: res.statusCode,
          length: body.length,
          snippet: body.substring(0, 400)
        });
      });
    }).on('error', (err) => {
      resolve({ url, error: err.message });
    });
  });
}

async function main() {
  const r1 = await checkUrl('http://localhost:5175/src/main.tsx');
  const r2 = await checkUrl('http://localhost:5175/src/presentation-main.tsx');
  const r3 = await checkUrl('http://localhost:5175/src/App.tsx');
  const r4 = await checkUrl('http://localhost:5175/src/PresentationApp.tsx');
  
  console.log('MAIN.TSX STATUS:', r1.status, 'Length:', r1.length);
  console.log('PRESENTATION-MAIN.TSX STATUS:', r2.status, 'Length:', r2.length);
  console.log('APP.TSX STATUS:', r3.status, 'Length:', r3.length);
  console.log('PRESENTATIONAPP.TSX STATUS:', r4.status, 'Length:', r4.length);
  
  if (r3.status !== 200) {
    console.log('App.tsx error snippet:', r3.snippet);
  }
  if (r4.status !== 200) {
    console.log('PresentationApp.tsx error snippet:', r4.snippet);
  }
}

main();
