export const PAGE_SIZE = 10;
export const UPLOAD_PATH = '../public/uploads/';
export const STATUS_CODES = {
  INVALID_INPUT: 422,
  FORBIDDEN: 403,
  NOTFOUND: 404,
};
export const AWS_CONFIG = {
  AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY,
  AWS_SECRET_KEY: process.env.AWS_SECRET_KEY,
  BUCKET: `ftrv-upload-storage-${process.env.NODE_ENV}`,
  PROFILE_PICTURE: [process.env.FOLDER_ALIAS, 'profile-picture'].join('-'),
  BLOG_THUMBNAIL: [process.env.FOLDER_ALIAS, 'blog-thumbnail'].join('-'),
  CEO_PAGE: [process.env.FOLDER_ALIAS, 'ceo-page'].join('-'),
  BANNER_IMAGE: [process.env.FOLDER_ALIAS, 'banner-image'].join('-'),
};

export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
};
