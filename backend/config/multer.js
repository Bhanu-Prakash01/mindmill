const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDirs = ['uploads/logos', 'uploads/avatars', 'uploads/attachments', 'uploads/questions', 'uploads/banners'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    
    if (file.fieldname === 'logo') {
      uploadPath += 'logos/';
    } else if (file.fieldname === 'banner') {
      uploadPath += 'banners/';
    } else if (file.fieldname === 'avatar') {
      uploadPath += 'avatars/';
    } else if (file.fieldname === 'attachment') {
      uploadPath += 'attachments/';
    } else if (file.fieldname === 'questionImage') {
      uploadPath += 'questions/';
    } else {
      uploadPath += 'misc/';
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    'image': /jpeg|jpg|png|gif|webp|svg/,
    'document': /pdf|doc|docx|txt/,
    'spreadsheet': /xls|xlsx|csv/
  };

  const ext = path.extname(file.originalname).toLowerCase();
  
  // Check file type based on fieldname
  if (file.fieldname === 'logo' || file.fieldname === 'avatar' || file.fieldname === 'questionImage' || file.fieldname === 'banner') {
    if (allowedTypes.image.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for logos and avatars'), false);
    }
  } else if (file.fieldname === 'attachment') {
    const allAllowed = new RegExp([...Object.values(allowedTypes)].map(r => r.source).join('|'));
    if (allAllowed.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  } else {
    cb(null, true);
  }
};

// Upload configurations
const uploadLogo = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

const uploadAvatar = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1 * 1024 * 1024 } // 1MB
});

const uploadAttachment = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const uploadQuestionImage = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

const uploadBanner = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

module.exports = {
  uploadLogo,
  uploadAvatar,
  uploadAttachment,
  uploadQuestionImage,
  uploadBanner
};
