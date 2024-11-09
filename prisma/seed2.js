const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs"); // For password hashing

const prisma = new PrismaClient();

async function main() {
  // Create roles
  const adminRole = await prisma.role.create({
    data: {
      role_name: "admin",
    },
  });

  const scholarRole = await prisma.role.create({
    data: {
      role_name: "scholar",
    },
  });

  const userRole = await prisma.role.create({
    data: {
      role_name: "user",
    },
  });

  const guestRole = await prisma.role.create({
    data: {
      role_name: "guest",
    },
  });

  console.log("Roles created:", adminRole, scholarRole, userRole, guestRole);

  // Create permissions for each role
  const adminPermissions = await prisma.permission.create({
    data: {
      role_id: adminRole.id,
      permission: [
        "CREATE_USER",
        "MODIFY_USER",
        "CREATE_THESIS",
        "MODIFY_THESIS",
        "CREATE_GUIDELINE",
        "MODIFY_GUIDELINE",
        "VIEW_THESIS",
        "CREATE_PEER_REVIEW",
        "MODIFY_PEER_REVIEW",
      ],
    },
  });

  const scholarPermissions = await prisma.permission.create({
    data: {
      role_id: scholarRole.id,
      permission: [
        "CREATE_THESIS",
        "MODIFY_THESIS",
        "SUBMIT_THESIS",
        "VIEW_THESIS",
        "MY_THESIS",
      ],
    },
  });

  const userPermissions = await prisma.permission.create({
    data: {
      role_id: userRole.id,
      permission: ["VIEW_THESIS", "SUBMIT_THESIS", "MY_THESIS"],
    },
  });

  const guestPermissions = await prisma.permission.create({
    data: {
      role_id: guestRole.id,
      permission: ["VIEW_THESIS"],
    },
  });

  console.log(
    "Permissions created:",
    adminPermissions,
    scholarPermissions,
    userPermissions,
    guestPermissions
  );

  // Hash password function
  const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  };

  // Create admin user with hashed password
  const adminPassword = await hashPassword("adminPassword123");
  const adminUser = await prisma.user.create({
    data: {
      username: "admin",
      email: "admin@example.com",
      password_hash: adminPassword,
      role_id: adminRole.id,
      firstname: "Admin",
      lastname: "User",
      gender: "Male",
      dob: new Date("1980-01-01"),
      phone: "123-456-7890",
      address: "123 Admin St, Admin City",
      profilePic: "https://example.com/admin.jpg",
      verified: true,
      emailVerified: new Date(),
    },
  });

  // Create scholar user with hashed password
  const scholarPassword = await hashPassword("scholarPassword123");
  const scholarUser = await prisma.user.create({
    data: {
      username: "john_scholar",
      email: "john.scholar@example.com",
      password_hash: scholarPassword,
      role_id: scholarRole.id,
      firstname: "John",
      lastname: "Scholar",
      gender: "Male",
      dob: new Date("1995-06-15"),
      phone: "987-654-3210",
      address: "456 Scholar Rd, Scholar City",
      profilePic: "https://example.com/john.jpg",
      verified: true,
      emailVerified: new Date(),
    },
  });

  // Create regular user with hashed password
  const userPassword = await hashPassword("userPassword123");
  const regularUser = await prisma.user.create({
    data: {
      username: "regular_user",
      email: "regular.user@example.com",
      password_hash: userPassword,
      role_id: userRole.id,
      firstname: "Regular",
      lastname: "User",
      gender: "Female",
      dob: new Date("1992-11-20"),
      phone: "654-321-9870",
      address: "789 Regular Rd, Regular City",
      profilePic: "https://example.com/regular.jpg",
      verified: false,
    },
  });

  // Create guest user
  const guestUser = await prisma.user.create({
    data: {
      username: "guest_user",
      email: "guest.user@example.com",
      password_hash: await hashPassword("guestPassword123"),
      role_id: guestRole.id,
      firstname: "Guest",
      lastname: "User",
      gender: "Non-binary",
      dob: new Date("2000-01-01"),
      phone: "000-000-0000",
      address: "123 Guest Rd, Guest City",
      profilePic: "https://example.com/guest.jpg",
      verified: false,
    },
  });

  console.log("Users created:", adminUser, scholarUser, regularUser, guestUser);

  // Create a thesis
  const thesis = await prisma.thesis.create({
    data: {
      title: "Research on AI",
      abstract: "This is a paper about Artificial Intelligence.",
      keywords: ["AI", "Machine Learning", "Data Science"],
      document_url: "https://example.com/thesis.pdf",
      status: "submitted",
      author_id: scholarUser.id,
      reviewer_id: adminUser.id,
    },
  });

  console.log("Thesis created:", thesis);

  // Create peer messages
  const peerMessage1 = await prisma.peerMessage.create({
    data: {
      thesis_id: thesis.thesis_id,
      user_id: scholarUser.id,
      message_content: "This thesis is a great exploration of AI.",
    },
  });

  const peerMessage2 = await prisma.peerMessage.create({
    data: {
      thesis_id: thesis.thesis_id,
      user_id: adminUser.id,
      message_content:
        "I agree! We should explore the ethical implications further.",
    },
  });

  console.log("Peer messages created:", peerMessage1, peerMessage2);

  // Create notifications
  const notification1 = await prisma.notification.create({
    data: {
      user_id: scholarUser.id,
      message: "Your thesis has been submitted successfully!",
    },
  });

  const notification2 = await prisma.notification.create({
    data: {
      user_id: adminUser.id,
      message: "New thesis submission for review.",
    },
  });

  console.log("Notifications created:", notification1, notification2);

  // Create guideline templates
  const guidelineTemplate1 = await prisma.guidelineTemplate.create({
    data: {
      user_id: adminUser.id,
      rules: { "AI Research": "Follow ethical AI guidelines." },
      file_url: "https://example.com/guideline1.pdf",
    },
  });

  console.log("Guideline Template created:", guidelineTemplate1);

  // Create history
  const historyRecord = await prisma.history.create({
    data: {
      user_id: scholarUser.id,
      action: "Created Thesis",
      description: "Created a thesis on Artificial Intelligence.",
    },
  });

  console.log("History record created:", historyRecord);

  // Create enquiry form
  const enquiryForm = await prisma.enquiryForm.create({
    data: {
      name: "John Doe",
      email: "john.doe@example.com",
      message: "I have a question about the AI thesis submission.",
      subject: "AI Thesis Enquiry",
    },
  });

  console.log("Enquiry form created:", enquiryForm);
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
