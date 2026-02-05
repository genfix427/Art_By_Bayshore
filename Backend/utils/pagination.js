export const getPagination = (page, limit) => {
  const currentPage = parseInt(page, 10) || 1;
  const pageSize = parseInt(limit, 10) || 10;
  const skip = (currentPage - 1) * pageSize;

  return { currentPage, pageSize, skip };
};

export const getPaginationMeta = (total, currentPage, pageSize) => {
  const totalPages = Math.ceil(total / pageSize);
  
  return {
    total,
    page: currentPage,
    limit: pageSize,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
};