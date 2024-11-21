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
          'DELETE_COMMENT',
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
          'DELETE_COMMENT',
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
          'DELETE_COMMENT',
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
        keywords: 'AI, Machine Learning, Data Science',
        document_url: 'https://pdfobject.com/pdf/sample.pdf',
        status: 'pending',
        category: 'AI',
        author_id: 2,
        reviewer_id: 2,
      },
      {
        title: 'Quantum Computing Advances',
        abstract: 'Exploring the latest in quantum computing.',
        keywords: 'Quantum Computing, Qubits, Entanglement',
        document_url: 'https://pdfobject.com/pdf/sample.pdf',
        status: 'approved',
        category: 'Quantum Computing',
        author_id: 3,
        reviewer_id: 2,
      },
      {
        title: 'Blockchain Technology',
        abstract: 'A comprehensive study on blockchain.',
        keywords: 'Blockchain, Cryptocurrency, Decentralization',
        document_url: 'https://pdfobject.com/pdf/sample.pdf',
        status: 'pending',
        category: 'Blockchain',
        author_id: 3,
        reviewer_id: 2,
      },
      {
        title: 'Renewable Energy Sources',
        abstract: 'Investigating renewable energy solutions.',
        keywords: 'Renewable Energy, Solar, Wind',
        document_url: 'https://pdfobject.com/pdf/sample.pdf',
        status: 'pending',
        category: 'Renewable Energy',
        author_id: 3,
        reviewer_id: 2,
      },
      {
        title: 'Cybersecurity Threats',
        abstract: 'Understanding modern cybersecurity threats.',
        keywords: 'Cybersecurity, Threats, Protection',
        document_url: 'https://pdfobject.com/pdf/sample.pdf',
        status: 'approved',
        category: 'Cybersecurity',
        author_id: 3,
        reviewer_id: 2,
      },
      {
        title: 'Artificial Neural Networks',
        abstract: 'Deep dive into neural networks.',
        keywords: 'Neural Networks, Deep Learning, AI',
        document_url: 'https://pdfobject.com/pdf/sample.pdf',
        status: 'pending',
        category: 'AI',
        author_id: 3,
        reviewer_id: 2,
      },
      {
        title: 'Internet of Things (IoT)',
        abstract: 'Exploring IoT applications and challenges.',
        keywords: 'IoT, Smart Devices, Connectivity',
        document_url: 'https://pdfobject.com/pdf/sample.pdf',
        status: 'pending',
        category: 'IoT',
        author_id: 3,
        reviewer_id: 2,
      },
      {
        title: 'Big Data Analytics',
        abstract: 'Analyzing big data trends and tools.',
        keywords: 'Big Data, Analytics, Data Science',
        document_url: 'https://pdfobject.com/pdf/sample.pdf',
        status: 'approved',
        category: 'Big Data',
        author_id: 3,
        reviewer_id: 2,
      },
      {
        title: 'Augmented Reality',
        abstract: 'The future of augmented reality technology.',
        keywords: 'Augmented Reality, AR, Technology',
        document_url: 'https://pdfobject.com/pdf/sample.pdf',
        status: 'pending',
        category: 'AR',
        author_id: 3,
        reviewer_id: 2,
      },
      {
        title: '5G Networks',
        abstract: 'Impact of 5G networks on communication.',
        keywords: '5G, Networks, Communication',
        document_url: 'https://pdfobject.com/pdf/sample.pdf',
        status: 'approved',
        category: '5G',
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
    const guidelinesData = [
      {
        user_id: 1,
        file_url:
          'https://grad.ucsd.edu/academics/preparing-to-graduate/dissertation-thesis-template.html',
        title: 'Fonts and Desktop Publishing',
        description:
          'Features that should stand out in the thesis include the quality of the scholarship or research, the soundness of the logic, the originality of ideas, and the lucidity of the prose, but not the size of the headlines. The use of headers or chapter titles larger than 3/16" is discouraged and the use of excessive italics or bold print is discouraged.',
      },
      {
        user_id: 2,
        file_url:
          'https://grad.ucsd.edu/academics/preparing-to-graduate/dissertation-thesis-template.html',
        title: 'Spacing',
        description:
          'Use 1.5 or double spaced text. Only footnotes, long quotations, bibliography entries (double space between entries), table captions, and similar special material may be single-spaced.',
      },
      {
        user_id: 3,
        file_url:
          'https://grad.ucsd.edu/academics/preparing-to-graduate/dissertation-thesis-template.html',
        title: 'Margins',
        description:
          'We recommend a left margin of 1.5" and a top, bottom, and right margin of 1" if the thesis is to be bound. Page numbers do not need to meet the 1" margin requirement. If you do not follow the appropriate margin guidelines that are included here, you might lose content if your thesis is later bound. Some students may wish to extend their work beyond the margin requirement for aesthetic reasons; this is acceptable.',
      },
      {
        user_id: 2,
        file_url:
          'https://grad.ucsd.edu/academics/preparing-to-graduate/dissertation-thesis-template.html',
        title: 'Abstract',
        description:
          "An abstract is to be included with the thesis. Particular care should be taken in preparing the abstract since it will be published in Dissertation Abstracts or Master's Abstracts and the length is limited by the publisher. The abstract may not exceed 350 words for a doctorate or 150 words for a master's. In style, the abstract should be a miniature version of the thesis. It should be a summary of the results, conclusions or main arguments presented in the thesis. The heading of the abstract must contain the word Abstract, and must show the title of the thesis and the writer's name as indicated here.",
      },
      {
        user_id: 1,
        file_url:
          'https://grad.ucsd.edu/academics/preparing-to-graduate/dissertation-thesis-template.html',
        title: 'Page Numbering',
        description:
          'Page numbers should be placed in the upper right corner of the page. Only the number should appear, not "page 9" or the abbreviation "p. 9." On the first page of each chapter, the number may be placed at the center bottom, one double space below the last line of type (the conventional placement), or at the top right corner. Page numbers should not be shown on the Title Page, the Abstract, or on the first page of the Acknowledgments, Table of Contents, List of Tables or the Preface. However, the following pages (e.g., the second and succeeding pages) of each of these sections should be numbered using Roman numerals. The count for these preliminary pages should start with the title page. For example, if the thesis has a two-page abstract, then the second page of the acknowledgments should be the first page showing a number, and it should be numbered with the Roman numeral v. Pages of the text itself and of all items following the text (i.e. the notes and bibliography) should be numbered consecutively throughout in Arabic numbers, beginning with number 1 on the first page of the first chapter or introduction (but not preface). Please number every page to be bound, including pages on which only illustrations, drawings, tables, or captions appear. The page numbers do not need to meet the 1" margin requirements.',
      },
    ]

    for (const guideline of guidelinesData) {
      await prisma.guidelines.create({
        data: guideline,
      })
    }

    console.log('Guideline Template created:', guidelinesData)

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
