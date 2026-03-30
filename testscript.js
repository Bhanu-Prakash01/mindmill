const mongoose = require('mongoose');
require('dotenv').config();

const Assessment = require('./backend/models/Assessment');
const User = require('./backend/models/User');
const Organization = require('./backend/models/Organization');
const TestTakerInvite = require('./backend/models/TestTakerInvite');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mindmill');
  
  const user = await User.findOne({ role: 'user' }).populate('organization');
  if (!user) {
    console.log("No user found");
    process.exit(0);
  }
  
  const userId = user._id;
  const orgId = user.organization._id;
  console.log("Found User:", user.email, "Org:", orgId);

  const allAssessments = await Assessment.find({
    isActive: true,
    isPublished: true,
    $or: [
      { 'unlockedBy.organization': orgId },
      { 'memberAllocations': { $elemMatch: { organization: orgId, member: userId } } }
    ]
  });
  
  console.log(`Found ${allAssessments.length} matching assessments`);
  
  const unlockedAssessments = await Promise.all(allAssessments.map(async (a) => {
    const unlockEntry = a.unlockedBy?.find(
      u => u.organization?.toString() === orgId.toString()
    );

    const memberAlloc = (a.memberAllocations || []).find(
      ma => ma.organization?.toString() === orgId.toString() && ma.member?.toString() === userId.toString()
    );

    console.log("For assessment", a.title, "memberAlloc:", memberAlloc);

    return {
      title: a.title,
      memberAllocation: memberAlloc ? {
          testsRemaining: Math.max(0, memberAlloc.testsAllowed - memberAlloc.testsDistributed)
      } : null
    };
  }));

  console.log(JSON.stringify(unlockedAssessments, null, 2));
  process.exit(0);
}

test().catch(console.error);
