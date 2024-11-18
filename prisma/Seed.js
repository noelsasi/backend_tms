const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs') // For password hashing
require('dotenv').config()

const prisma = new PrismaClient()

async function up() {
  try {
    // Create roles
    const roles = await prisma.role.createMany({
      data: [
        { role_name: 'admin' },
        { role_name: 'scholar' },
        { role_name: 'user' },
        { role_name: 'guest' },
      ],
    })

    console.log('Roles created:', roles)

    // Create permissions
    const permissions = [
      {
        role_id: 1,
        permission: [
          'CREATE_USER',
          'MODIFY_USER',
          'DELETE_USER',
          'CREATE_THESIS',
          'MODIFY_THESIS',
          'DELETE_THESIS',
          'CREATE_GUIDELINE',
          'MODIFY_GUIDELINE',
          'DELETE_GUIDELINE',
          'VIEW_THESIS',
          'CREATE_PEER_REVIEW',
          'MODIFY_PEER_REVIEW',
          'DELETE_PEER_REVIEW',
          'VIEW_PROFILE',
          'UPDATE_PROFILE',
        ],
      },
      {
        role_id: 2,
        permission: [
          'CREATE_THESIS',
          'MODIFY_THESIS',
          'DELETE_THESIS',
          'SUBMIT_THESIS',
          'CREATE_GUIDELINE',
          'MODIFY_GUIDELINE',
          'DELETE_GUIDELINE',
          'VIEW_THESIS',
          'CREATE_PEER_REVIEW',
          'MODIFY_PEER_REVIEW',
          'DELETE_PEER_REVIEW',
          'MY_THESIS',
          'VIEW_PROFILE',
          'UPDATE_PROFILE',
        ],
      },
      {
        role_id: 3,
        permission: [
          'VIEW_THESIS',
          'SUBMIT_THESIS',
          'MY_THESIS',
          'VIEW_PROFILE',
          'UPDATE_PROFILE',
        ],
      },
      { role_id: 4, permission: ['VIEW_THESIS'] },
    ]

    for (const perm of permissions) {
      await prisma.permission.create({
        data: perm,
      })
    }

    console.log('Permissions created')

    // Hash password function
    const hashPassword = async password => {
      const salt = await bcrypt.genSalt(10)
      return await bcrypt.hash(password, salt)
    }

    // Create users
    const users = [
      {
        username: 'admin',
        email: 'admin@scholarvault.com',
        password_hash: await hashPassword('scholarvault'),
        role_id: 1,
        firstname: 'Admin',
        lastname: 'User',
        gender: 'Male',
        dob: new Date('1980-01-01'),
        phone: '123-456-7890',
        address: '123 Admin St, Admin City',
        profilePic: 'https://www.scholarvault.com/admin.jpg',
        verified: true,
        emailVerified: new Date(),
      },
      {
        username: 'scholar',
        email: 'scholar@scholarvault.com',
        password_hash: await hashPassword('scholarvault'),
        role_id: 2,
        firstname: 'Scholar',
        lastname: 'User',
        gender: 'Male',
        dob: new Date('1995-06-15'),
        phone: '987-654-3210',
        address: '456 Scholar Rd, Scholar City',
        profilePic: 'https://www.scholarvault.com/scholar.jpg',
        verified: true,
        emailVerified: new Date(),
      },
      {
        username: 'user',
        email: 'user@scholarvault.com',
        password_hash: await hashPassword('scholarvault'),
        role_id: 3,
        firstname: 'Registered',
        lastname: 'User',
        gender: 'Female',
        dob: new Date('1992-11-20'),
        phone: '654-321-9870',
        address: '789 Regular Rd, Regular City',
        profilePic: 'https://www.scholarvault.com/regular.jpg',
        verified: false,
      },
    ]

    for (const user of users) {
      await prisma.user.create({
        data: user,
      })
    }

    console.log('Users created')

    // Create a thesis
    const thesis = await prisma.thesis.create({
      data: {
        title: 'Research on AI',
        abstract: 'This is a paper about Artificial Intelligence.',
        keywords: ['AI', 'Machine Learning', 'Data Science'],
        document_url: 'https://www.scholarvault.com/thesis.pdf',
        status: 'submitted',
        author_id: 2, // Assuming scholar user ID is 2
        reviewer_id: 1, // Assuming admin user ID is 1
      },
    })

    console.log('Thesis created:', thesis)

    // Create peer messages
    const peerMessages = [
      {
        title: 'Peer Review 1',
        review: 'This thesis is a great exploration of AI.',
        review_date: new Date(),
        status: 'pending',
        thesis_id: thesis.thesis_id,
        reviewer_id: 2,
      },
      {
        title: 'Peer Review 2',
        review: 'I agree! We should explore the ethical implications further.',
        review_date: new Date(),
        status: 'pending',
        thesis_id: thesis.thesis_id,
        reviewer_id: 1,
      },
    ]

    for (const message of peerMessages) {
      await prisma.peerMessage.create({
        data: message,
      })
    }

    console.log('Peer messages created')

    // Create notifications
    const notifications = [
      {
        user_id: 2,
        message: 'Your thesis has been submitted successfully!',
      },
      {
        user_id: 1,
        message: 'New thesis submission for review.',
      },
    ]

    for (const notification of notifications) {
      await prisma.notification.create({
        data: notification,
      })
    }

    console.log('Notifications created')

    // Create guideline templates
    const guidelines = await prisma.guidelines.create({
      data: {
        user_id: 1,
        file_url: 'https://www.scholarvault.com/guidelines.pdf',
        title: 'Guidelines',
        description: 'This is the first guideline for AI research.',
      },
    })

    console.log('Guideline Template created:', guidelines)

    // Create history
    const historyRecord = await prisma.history.create({
      data: {
        user_id: 2,
        action: 'Created Thesis',
        description: 'Created a thesis on Artificial Intelligence.',
      },
    })

    console.log('History record created:', historyRecord)

    // Create enquiry form
    const enquiryForm = await prisma.enquiryForm.create({
      data: {
        name: 'John Doe',
        email: 'john.doe@scholarvault.com',
        message: 'I have a question about the AI thesis submission.',
        subject: 'AI Thesis Enquiry',
      },
    })

    console.log('Enquiry form created:', enquiryForm)
  } catch (error) {
    console.error('Error creating records:', error.message)
  }
}

async function down() {
  try {
    // Delete all records in reverse order of creation
    await prisma.enquiryForm.deleteMany({})
    await prisma.history.deleteMany({})
    await prisma.guidelines.deleteMany({})
    await prisma.notification.deleteMany({})
    await prisma.peerMessage.deleteMany({})
    await prisma.thesis.deleteMany({})
    await prisma.user.deleteMany({})
    await prisma.permission.deleteMany({})
    await prisma.role.deleteMany({})

    console.log('All records deleted')
  } catch (error) {
    console.error('Error deleting records:', error.message)
  }
}

module.exports = { up, down }
