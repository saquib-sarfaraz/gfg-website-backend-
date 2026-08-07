/**
 * verify_pipeline.js - End-to-end Cloudinary media pipeline + MongoDB persistence test
 * Run: node verify_pipeline.js (from /backend directory)
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

require('dotenv').config();

// ── Minimal HTTP client ─────────────────────────────────────────────────────
function jsonRequest(opts, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch(e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// ── Multipart form upload ───────────────────────────────────────────────────
function multipartUpload(filePath, fieldName, folder, token) {
  return new Promise((resolve, reject) => {
    const boundary = '----FormBoundary' + Date.now();
    const filename = path.basename(filePath);
    const fileContent = fs.readFileSync(filePath);

    const parts = [
      `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\nContent-Type: image/jpeg\r\n\r\n`,
      fileContent,
      `\r\n--${boundary}\r\nContent-Disposition: form-data; name="folder"\r\n\r\n${folder}\r\n--${boundary}--\r\n`
    ];

    const body = Buffer.concat(parts.map(p => Buffer.isBuffer(p) ? p : Buffer.from(p)));

    const req = http.request({
      hostname: 'localhost', port: 5001,
      path: '/api/media/upload', method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
        'Authorization': `Bearer ${token}`
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch(e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Results tracker ─────────────────────────────────────────────────────────
const results = {};
const check = (key, condition, label) => {
  results[key] = condition;
  console.log(`  ${condition ? '✓' : '✗'} ${label}`);
  return condition;
};

// ── Main test ───────────────────────────────────────────────────────────────
async function main() {
  const imgPath = '/tmp/test_real.jpg';
  if (!fs.existsSync(imgPath)) {
    console.error('ERROR: Test image not found at /tmp/test_real.jpg — run: curl -s -o /tmp/test_real.jpg "https://picsum.photos/100/100"');
    process.exit(1);
  }

  // ── 1. Login ──────────────────────────────────────────────────────────────
  console.log('\n=== STEP 1: Login ===');
  const loginBody = JSON.stringify({ email: 'admin@gfgcampus.org', password: 'AdminPass2026!' });
  const loginRes = await jsonRequest({
    hostname: 'localhost', port: 5001, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginBody) }
  }, loginBody);

  check('login', loginRes.body.success, 'Login API responded with success');
  if (!loginRes.body.token) { console.error('Cannot continue without token'); process.exit(1); }

  const token = loginRes.body.token;
  const memberId = loginRes.body.member._id;
  console.log(`  Member: ${loginRes.body.member.name} | role: ${loginRes.body.member.role}`);
  console.log(`  photo (before): ${loginRes.body.member.photo}`);

  // ── 2. Upload avatar via 'file' field ────────────────────────────────────
  console.log('\n=== STEP 2: Upload avatar via "file" field (Profile flow) ===');
  fs.copyFileSync(imgPath, '/tmp/avatar_test.jpg');
  const avatarUpload = await multipartUpload('/tmp/avatar_test.jpg', 'file', 'Members', token);

  console.log(`  HTTP status: ${avatarUpload.status}`);
  const avMedia = avatarUpload.body.media;
  console.log(`  media.url: ${avMedia?.url}`);
  console.log(`  media.publicId: ${avMedia?.publicId}`);
  const avUrl = avMedia?.url || '';
  check('avatar_cloudinary_url', avUrl.startsWith('https://res.cloudinary.com'), 'Cloudinary URL returned for avatar');
  check('avatar_public_id', !!avMedia?.publicId, 'publicId present in avatar upload response');

  if (!avUrl.startsWith('https://res.cloudinary.com')) {
    console.error('  STOPPED: Avatar upload did not return Cloudinary URL');
    printSummary(); process.exit(1);
  }

  // ── 3. PATCH profile photo ───────────────────────────────────────────────
  console.log('\n=== STEP 3: PATCH member profile — persist avatar URL ===');
  const patchBody = JSON.stringify({ photo: avUrl, photoPublicId: avMedia.publicId });
  const patchRes = await jsonRequest({
    hostname: 'localhost', port: 5001, path: `/api/members/${memberId}/profile`, method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'Content-Length': Buffer.byteLength(patchBody) }
  }, patchBody);

  const patchedPhoto = patchRes.body.data?.photo;
  const patchedPublicId = patchRes.body.data?.photoPublicId;
  console.log(`  photo after PATCH: ${patchedPhoto}`);
  console.log(`  photoPublicId after PATCH: ${patchedPublicId}`);
  check('avatar_mongodb_updated', patchedPhoto === avUrl, 'MongoDB photo field updated to Cloudinary URL');
  check('avatar_publicid_persisted', !!patchedPublicId, 'photoPublicId persisted in MongoDB');

  // ── 4. GET /api/auth/me — verify refresh persistence ────────────────────
  console.log('\n=== STEP 4: GET /api/auth/me — simulate browser refresh ===');
  const meRes = await jsonRequest({
    hostname: 'localhost', port: 5001, path: '/api/auth/me', method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const freshPhoto = meRes.body.member?.photo;
  console.log(`  photo from /me: ${freshPhoto}`);
  check('avatar_refresh_persists', freshPhoto?.startsWith('https://res.cloudinary.com'), 'Avatar persists as Cloudinary URL after refresh');

  // ── 5. Upload cover via 'file' field ─────────────────────────────────────
  console.log('\n=== STEP 5: Upload cover photo ===');
  fs.copyFileSync(imgPath, '/tmp/cover_test.jpg');
  const coverUpload = await multipartUpload('/tmp/cover_test.jpg', 'file', 'Members', token);

  const covMedia = coverUpload.body.media;
  const covUrl = covMedia?.url || '';
  console.log(`  cover url: ${covUrl}`);
  check('cover_cloudinary_url', covUrl.startsWith('https://res.cloudinary.com'), 'Cloudinary URL returned for cover photo');

  if (covUrl.startsWith('https://res.cloudinary.com')) {
    const patchCoverBody = JSON.stringify({ coverPhoto: covUrl, coverPhotoPublicId: covMedia.publicId });
    const patchCoverRes = await jsonRequest({
      hostname: 'localhost', port: 5001, path: `/api/members/${memberId}/profile`, method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'Content-Length': Buffer.byteLength(patchCoverBody) }
    }, patchCoverBody);
    const savedCover = patchCoverRes.body.data?.coverPhoto;
    console.log(`  coverPhoto after PATCH: ${savedCover}`);
    check('cover_mongodb_updated', savedCover === covUrl, 'MongoDB coverPhoto updated to Cloudinary URL');
    check('cover_publicid_persisted', !!patchCoverRes.body.data?.coverPhotoPublicId, 'coverPhotoPublicId persisted in MongoDB');
  }

  // ── 6. Upload post image via 'mediaFile' field (Community Feed flow) ─────
  console.log('\n=== STEP 6: Upload post image via "mediaFile" field (Community Feed flow) ===');
  fs.copyFileSync(imgPath, '/tmp/post_test.jpg');
  const postImgUpload = await multipartUpload('/tmp/post_test.jpg', 'mediaFile', 'Posts', token);

  const postMedia = postImgUpload.body.media;
  const postImgUrl = postMedia?.url || '';
  const postImgPublicId = postMedia?.publicId || '';
  console.log(`  post image url: ${postImgUrl}`);
  console.log(`  post image publicId: ${postImgPublicId}`);
  check('post_image_cloudinary_url', postImgUrl.startsWith('https://res.cloudinary.com'), 'Cloudinary URL returned for post image');

  // ── 7. Create post with Cloudinary media URL ─────────────────────────────
  if (postImgUrl.startsWith('https://res.cloudinary.com')) {
    console.log('\n=== STEP 7: Create community post with Cloudinary media ===');
    const postBody = JSON.stringify({
      postType: 'Thought',
      title: '[Verification] Cloudinary Pipeline Test',
      content: 'Automated test: verifying that community post media persists as Cloudinary URL.',
      media: [{ type: 'image', url: postImgUrl, publicId: postImgPublicId, fileName: 'test_post.jpg' }],
      tags: ['cloudinary', 'verification']
    });
    const postCreateRes = await jsonRequest({
      hostname: 'localhost', port: 5001, path: '/api/posts', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'Content-Length': Buffer.byteLength(postBody) }
    }, postBody);

    const createdPost = postCreateRes.body.data;
    console.log(`  Post creation HTTP status: ${postCreateRes.status}`);
    console.log(`  Created post ID: ${createdPost?._id}`);
    const postMediaUrl = createdPost?.media?.[0]?.url;
    console.log(`  Post media[0].url in MongoDB: ${postMediaUrl}`);
    check('post_media_url_persisted', postMediaUrl?.startsWith('https://res.cloudinary.com'), 'Community post media.url is a Cloudinary URL in MongoDB');

    // ── 8. Fetch post back to verify persistence ─────────────────────────
    if (createdPost?._id) {
      console.log('\n=== STEP 8: Fetch post back — simulate feed refresh ===');
      const fetchRes = await jsonRequest({
        hostname: 'localhost', port: 5001, path: `/api/posts/${createdPost._id}`, method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const fetchedUrl = fetchRes.body.data?.media?.[0]?.url;
      console.log(`  Fetched media[0].url: ${fetchedUrl}`);
      check('post_media_refresh_persists', fetchedUrl?.startsWith('https://res.cloudinary.com'), 'Post media URL persists after fetch (simulated refresh)');
    }
  }

  // ── Print summary ─────────────────────────────────────────────────────────
  printSummary();
}

function printSummary() {
  console.log('\n========================================');
  console.log('ACCEPTANCE TEST RESULTS');
  console.log('========================================');
  const labels = {
    login: 'Login OK',
    avatar_cloudinary_url: 'Avatar upload — Cloudinary URL returned',
    avatar_public_id: 'Avatar upload — publicId returned',
    avatar_mongodb_updated: 'Avatar — MongoDB photo updated',
    avatar_publicid_persisted: 'Avatar — photoPublicId in MongoDB',
    avatar_refresh_persists: 'Avatar — persists after refresh',
    cover_cloudinary_url: 'Cover upload — Cloudinary URL returned',
    cover_mongodb_updated: 'Cover — MongoDB coverPhoto updated',
    cover_publicid_persisted: 'Cover — coverPhotoPublicId in MongoDB',
    post_image_cloudinary_url: 'Post image — Cloudinary URL returned (mediaFile field)',
    post_media_url_persisted: 'Post — media[].url is Cloudinary URL in MongoDB',
    post_media_refresh_persists: 'Post — media URL persists after refresh'
  };
  for (const [k, v] of Object.entries(results)) {
    console.log(`  ${v ? '✓' : '✗'} ${labels[k] || k}`);
  }
  const allPassed = Object.values(results).every(Boolean);
  console.log(`\n${allPassed ? '✅ ALL CHECKS PASSED' : '❌ SOME CHECKS FAILED'}`);
}

main().catch(err => { console.error('Uncaught error:', err); process.exit(1); });
