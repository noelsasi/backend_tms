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

    // Create multiple theses
    const thesesData = [
      {
        title: 'Research on AI',
        abstract: 'This is a paper about Artificial Intelligence.',
        keywords: ['AI', 'Machine Learning', 'Data Science'],
        document_url: 'https://www.scholarvault.com/thesis1.pdf',
        status: 'submitted',
        author_id: 2,
        reviewer_id: 2,
      },
      {
        title: 'Quantum Computing Advances',
        abstract: 'Exploring the latest in quantum computing.',
        keywords: ['Quantum Computing', 'Qubits', 'Entanglement'],
        document_url: 'https://www.scholarvault.com/thesis2.pdf',
        status: 'approved',
        author_id: 3,
        reviewer_id: 2,
      },
      {
        title: 'Blockchain Technology',
        abstract: 'A comprehensive study on blockchain.',
        keywords: ['Blockchain', 'Cryptocurrency', 'Decentralization'],
        document_url: 'https://www.scholarvault.com/thesis3.pdf',
        status: 'submitted',
        author_id: 3,
        reviewer_id: 2,
      },
      {
        title: 'Renewable Energy Sources',
        abstract: 'Investigating renewable energy solutions.',
        keywords: ['Renewable Energy', 'Solar', 'Wind'],
        document_url: 'https://www.scholarvault.com/thesis4.pdf',
        status: 'submitted',
        author_id: 3,
        reviewer_id: 2,
      },
      {
        title: 'Cybersecurity Threats',
        abstract: 'Understanding modern cybersecurity threats.',
        keywords: ['Cybersecurity', 'Threats', 'Protection'],
        document_url: 'https://www.scholarvault.com/thesis5.pdf',
        status: 'approved',
        author_id: 3,
        reviewer_id: 2,
      },
      {
        title: 'Artificial Neural Networks',
        abstract: 'Deep dive into neural networks.',
        keywords: ['Neural Networks', 'Deep Learning', 'AI'],
        document_url: 'https://www.scholarvault.com/thesis6.pdf',
        status: 'submitted',
        author_id: 3,
        reviewer_id: 2,
      },
      {
        title: 'Internet of Things (IoT)',
        abstract: 'Exploring IoT applications and challenges.',
        keywords: ['IoT', 'Smart Devices', 'Connectivity'],
        document_url: 'https://www.scholarvault.com/thesis7.pdf',
        status: 'submitted',
        author_id: 3,
        reviewer_id: 2,
      },
      {
        title: 'Big Data Analytics',
        abstract: 'Analyzing big data trends and tools.',
        keywords: ['Big Data', 'Analytics', 'Data Science'],
        document_url: 'https://www.scholarvault.com/thesis8.pdf',
        status: 'approved',
        author_id: 3,
        reviewer_id: 2,
      },
      {
        title: 'Augmented Reality',
        abstract: 'The future of augmented reality technology.',
        keywords: ['Augmented Reality', 'AR', 'Technology'],
        document_url: 'https://www.scholarvault.com/thesis9.pdf',
        status: 'submitted',
        author_id: 3,
        reviewer_id: 2,
      },
      {
        title: '5G Networks',
        abstract: 'Impact of 5G networks on communication.',
        keywords: ['5G', 'Networks', 'Communication'],
        document_url: 'https://www.scholarvault.com/thesis10.pdf',
        status: 'approved',
        author_id: 3,
        reviewer_id: 2,
      },
    ]

    for (const thesisData of thesesData) {
      await prisma.thesis.create({
        data: thesisData,
      })
    }

    console.log('Theses created')

    // Create peer messages
    const peerMessages = [
      {
        title: 'Peer Review 1',
        review: 'This thesis is a great exploration of AI.',
        review_date: new Date(),
        status: 'pending',
        thesis_id: Math.floor(Math.random() * 10) + 1,
        reviewer_id: 2,
      },
      {
        title: 'Peer Review 2',
        review: 'I agree! We should explore the ethical implications further.',
        review_date: new Date(),
        status: 'pending',
        thesis_id: Math.floor(Math.random() * 10) + 1,
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
