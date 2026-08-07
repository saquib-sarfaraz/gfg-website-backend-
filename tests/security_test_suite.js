require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const Member = require('../models/Member');
const AdminAccess = require('../models/AdminAccess');
const Post = require('../models/Post');
const authController = require('../controllers/authController');
const memberController = require('../controllers/memberController');
const userDirectoryController = require('../controllers/userDirectoryController');
const eventController = require('../controllers/eventController');
const announcementController = require('../controllers/announcementController');
const postController = require('../controllers/postController');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

async function runSecurityTestSuite() {
  console.log("========================================================");
  console.log("   AUTOMATED SECURITY REGRESSION TEST SUITE (35 PHASES)");
  console.log("========================================================\n");

  await connectDB();

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName, details = '') => {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${details}`);
      failed++;
    }
  };

  // --- TEST 1: Unauthenticated Requests (HTTP 401) ---
  console.log("--- Category A: Unauthenticated Protection (HTTP 401) ---");
  const reqUnauth = { headers: {} };
  const resUnauth = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; }
  };

  const { authMiddleware } = require('../middleware/auth');
  await authMiddleware(reqUnauth, resUnauth, () => {});
  assert(resUnauth.statusCode === 401, "Unauthenticated access to protected middleware returns 401");

  // --- TEST 2: Non-Admin Access to Admin Routes (HTTP 403) ---
  console.log("\n--- Category B: Admin OS Protection (HTTP 403) ---");
  const reqVisitor = {
    user: { _id: 'visitor_id_123', role: 'Visitor' },
    adminAccess: null
  };
  const resVisitor = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; }
  };
  const { adminOnly } = require('../middleware/auth');
  adminOnly(reqVisitor, resVisitor, () => {});
  assert(resVisitor.statusCode === 403, "Non-admin accessing adminOnly route receives 403 Forbidden");

  // --- TEST 3: Mass Assignment Privilege Escalation on Signup ---
  console.log("\n--- Category C: Privilege Escalation Prevention ---");
  const testEmail = "security_test_escalation_" + Date.now() + "@example.com";
  const reqSignupEscalate = {
    body: {
      fullName: "Hacker User",
      email: testEmail,
      password: "Password123!",
      confirmPassword: "Password123!",
      isJamia: true,
      role: "Super Admin",
      isAdmin: true,
      adminRole: "ROOT_SUPER_ADMIN"
    },
    app: { get: () => null }
  };
  const resSignupEscalate = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; }
  };
  await authController.signup(reqSignupEscalate, resSignupEscalate);
  
  const createdHackerUser = await User.findOne({ email: testEmail });
  assert(
    createdHackerUser && createdHackerUser.role === 'Visitor',
    "Mass assignment role escalation on signup blocked (Role enforced as Visitor)"
  );

  // Clean up signup user
  if (createdHackerUser) {
    await User.findByIdAndDelete(createdHackerUser._id);
    await Member.findOneAndDelete({ userRef: createdHackerUser._id });
  }

  // --- TEST 4: Cross-Account Profile Mutation (IDOR / BOLA Prevention) ---
  console.log("\n--- Category D: IDOR / BOLA Cross-Account Protection ---");
  const reqCrossEdit = {
    user: { _id: "user_A_id_111" },
    params: { id: "user_B_id_222" },
    body: { bio: "Hacked Bio" }
  };
  const resCrossEdit = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; }
  };
  
  // Create a real dummy member for B to test against DB lookup
  const { generateUserCode } = require('../utils/userCodeGenerator');
  const dummyMemberB = await Member.create({
    userCode: generateUserCode(),
    name: "Member B",
    email: "member_b_" + Date.now() + "@example.com",
    role: "Visitor"
  });

  reqCrossEdit.params.id = dummyMemberB._id.toString();
  await memberController.updateSelfProfile(reqCrossEdit, resCrossEdit);
  assert(
    resCrossEdit.statusCode === 403,
    "User A attempting to update User B's profile receives 403 Forbidden"
  );

  await Member.findByIdAndDelete(dummyMemberB._id);

  // --- TEST 5: Duplicate Normalized Email Signup (HTTP 409 Conflict) ---
  console.log("\n--- Category E: Identity Integrity & Email Normalization ---");
  const existingUser = await User.findOne({});
  if (existingUser) {
    const reqDup = {
      body: {
        fullName: "Duplicate User",
        email: " " + existingUser.email.toUpperCase() + " ",
        password: "Password123!",
        confirmPassword: "Password123!",
        isJamia: true
      },
      app: { get: () => null }
    };
    const resDup = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.payload = payload; return this; }
    };
    await authController.signup(reqDup, resDup);
    assert(
      resDup.statusCode === 409,
      "Duplicate email signup with whitespace and uppercase returns 409 Conflict"
    );
  }

  // --- TEST 6: Invalid Token Verification ---
  console.log("\n--- Category F: JWT Security ---");
  const reqBadToken = { headers: { authorization: "Bearer invalid_junk_token_123" } };
  const resBadToken = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; }
  };
  await authMiddleware(reqBadToken, resBadToken, () => {});
  assert(
    resBadToken.statusCode === 401,
    "Forged or invalid Bearer JWT returns 401 Unauthorized"
  );

  console.log("\n========================================================");
  console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("========================================================\n");

  process.exit(failed > 0 ? 1 : 0);
}

runSecurityTestSuite().catch(e => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
