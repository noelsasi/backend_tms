const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')
const prisma = new PrismaClient()

async function main() {
  // Seed Roles
  await prisma.role.createMany({
    data: [
      { role_name: 'admin' },
      { role_name: 'scholar' },
      { role_name: 'user' },
      { role_name: 'guest' },
    ],
  })

  // Seed Permissions
  await prisma.permission.createMany({
    data: [
      { role_id: 1, permission: 'manage_users' },
      { role_id: 1, permission: 'moderate_theses' },
      { role_id: 1, permission: 'view_all_theses' },
      { role_id: 2, permission: 'submit_thesis' },
      { role_id: 2, permission: 'moderate_thesis' },
      { role_id: 2, permission: 'peer_review' },
      { role_id: 2, permission: 'view_guidelines' },
      { role_id: 3, permission: 'submit_thesis' },
      { role_id: 3, permission: 'view_thesis' },
      { role_id: 4, permission: 'view_thesis' },
    ],
  })

  // Seed Users with hashed passwords
  // for (let i = 1; i <= 10; i++) {
  //   const password = `password${i}`; // Sample plain password
  //   const hashedPassword = await bcrypt.hash(password, 10); // Hash the password

  //   await prisma.user.create({
  //     data: {
  //       username: `user_${i}`,
  //       email: `user${i}@scholarvault.com`,
  //       password_hash: hashedPassword,
  //       role_id: i <= 2 ? 1 : i <= 4 ? 2 : 3,
  //       firstname: `FirstName${i}`,
  //       lastname: `LastName${i}`,
  //       gender: i % 2 === 0 ? 'Female' : 'Male',
  //       dob: new Date(2000 + i, i - 1, i),
  //       phone: `123456789${i}`,
  //       address: `${i} User St`,
  //       created_at: new Date(),
  //       updated_at: new Date(),
  //     },
  //   });
  // }
  for (let i = 1; i <= 10; i++) {
    const password = `password${i}` // Sample plain password
    const hashedPassword = await bcrypt.hash(password, 10) // Hash the password

    const username = `user_${i}`
    const profilePic =
      i % 2 === 0
        ? `https://avatar.iran.liara.run/public/girl?username=${username}`
        : `https://avatar.iran.liara.run/public/boy?username=${username}`

    await prisma.user.create({
      data: {
        username: username,
        email: `user${i}@scholarvault.com`,
        password_hash: hashedPassword,
        role_id: i <= 2 ? 1 : i <= 4 ? 2 : 3,
        firstname: `FirstName${i}`,
        lastname: `LastName${i}`,
        gender: i % 2 === 0 ? 'Female' : 'Male',
        dob: new Date(2000 + i, i - 1, i),
        phone: `123456789${i}`,
        address: `${i} User St`,
        profilePic: profilePic, // Use dynamic profile picture URL
        created_at: new Date(),
        updated_at: new Date(),
      },
    })
  }
  // Seed Theses
  for (let i = 1; i <= 10; i++) {
    await prisma.thesis.create({
      data: {
        title: `Thesis Title ${i}`,
        abstract: `Abstract for thesis ${i}`,
        keywords: JSON.stringify([`keyword${i}`, `keyword${i + 1}`]),
        document_url: `http://scholarvault.com/thesis${i}`,
        status: i % 2 === 0 ? 'approved' : 'submitted',
        author_id: (i % 8) + 1,
        reviewer_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
    })
  }

  // Seed Thesis Views
  for (let i = 1; i <= 10; i++) {
    await prisma.thesisView.create({
      data: {
        thesis_id: i,
        ip_address: `192.168.1.${i}`,
        viewed_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
    })
  }

  // Seed Thesis Downloads
  for (let i = 1; i <= 5; i++) {
    await prisma.thesisDownload.create({
      data: {
        thesis_id: i,
        ip_address: `192.168.1.${i + 10}`,
        downloaded_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
    })
  }

  // Seed Peer Messages
  for (let i = 1; i <= 10; i++) {
    await prisma.peerMessage.create({
      data: {
        thesis_id: (i % 5) + 1,
        user_id: (i % 3) + 1,
        message_content: `Message content from user ${i}`,
        created_at: new Date(),
        updated_at: new Date(),
      },
    })
  }

  // Seed Notifications
  for (let i = 1; i <= 10; i++) {
    await prisma.notification.create({
      data: {
        user_id: (i % 4) + 1,
        message: `Notification message ${i}`,
        created_at: new Date(),
        updated_at: new Date(),
      },
    })
  }

  // Seed Guideline Templates
  for (let i = 1; i <= 5; i++) {
    await prisma.guidelineTemplate.create({
      data: {
        user_id: i,
        rules: JSON.stringify([`Rule ${i}A`, `Rule ${i}B`]),
        file_url: `http://scholarvault.com/guideline${i}`,
        created_at: new Date(),
        updated_at: new Date(),
      },
    })
  }

  // Seed History
  for (let i = 1; i <= 10; i++) {
    await prisma.history.create({
      data: {
        user_id: (i % 3) + 1,
        action: `Action ${i}`,
        description: `Description for action ${i}`,
        created_at: new Date(),
        updated_at: new Date(),
      },
    })
  }

  // Seed Enquiry Forms
  for (let i = 1; i <= 5; i++) {
    await prisma.enquiryForm.create({
      data: {
        name: `Enquirer ${i}`,
        email: `enquirer${i}@scholarvault.com`,
        message: `Message from enquirer ${i}`,
        subject: `Inquiry Subject ${i}`,
        created_at: new Date(),
        updated_at: new Date(),
      },
    })
  }

  console.log('Database seeded successfully!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
