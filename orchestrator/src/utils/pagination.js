exports.getPagination = (page, size) => {
  const limit = size ? +size : 10;
  const offset = page ? page * limit : 0;
  return { limit, offset };
};

exports.getPagingData = (data, page, limit) => {
  const items = data?.rows || [];
  const totalItems = data?.count || 0;
  const currentPage = page ? +page : 0;
  const totalPages = Math.ceil(totalItems / limit);
  return { totalPages, currentPage, totalItems, items };
};
