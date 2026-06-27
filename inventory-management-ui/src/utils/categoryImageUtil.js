const CATEGORY_IMAGE_KEY_PREFIX = "inventoryflow_category_image_";

export const getCategoryImage = (categoryId) => {
  if (!categoryId) {
    return null;
  }

  return localStorage.getItem(`${CATEGORY_IMAGE_KEY_PREFIX}${categoryId}`);
};

export const saveCategoryImage = (categoryId, imageDataUrl) => {
  if (!categoryId || !imageDataUrl) {
    return;
  }

  localStorage.setItem(`${CATEGORY_IMAGE_KEY_PREFIX}${categoryId}`, imageDataUrl);
};

export const removeCategoryImage = (categoryId) => {
  if (!categoryId) {
    return;
  }

  localStorage.removeItem(`${CATEGORY_IMAGE_KEY_PREFIX}${categoryId}`);
};